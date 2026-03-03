// lib/agent.ts
// AI Order Intake Agent
//
// HOW THIS WORKS:
// ===============
// 1. Customer sends a natural language message like:
//    "I need 5 cases of paneer and 10kg basmati, deliver Thursday"
//
// 2. We send this message to Claude along with:
//    - The business's inventory (so Claude knows what's available)
//    - The client list (so Claude can match who's ordering)
//    - A "create_order" tool definition (so Claude can structure the order)
//
// 3. Claude understands the message, matches items to inventory,
//    picks the right client, and calls the create_order tool with
//    structured data (item IDs, quantities, dates).
//
// 4. We execute that tool call — actually create the order in the DB.
//
// 5. We send the result back to Claude, which generates a friendly
//    confirmation message for the customer.
//
// WHY TOOL USE (not just "return JSON"):
// - Claude tool use is TYPED — it follows the schema we define
// - It never hallucinates JSON structure — the schema is enforced
// - It can ask clarifying questions if the message is ambiguous
// - It handles edge cases (partial matches, out-of-stock, etc.)

import Anthropic from "@anthropic-ai/sdk"
import { db } from "./db"
import { generateOrderNumber } from "./utils"
import type { InventoryItem, Client } from "@prisma/client"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ─── Tool Definition ─────────────────────────────────────────────────────────
// This tells Claude EXACTLY what parameters it can use to create an order.
// Claude will call this tool when it understands the customer's intent.

const CREATE_ORDER_TOOL: Anthropic.Tool = {
  name: "create_order",
  description:
    "Create a delivery order for a client. Use this when the customer wants to place an order for items. Match items to inventory by name/description. If you cannot confidently match an item, include it with inventoryId as null and note the issue.",
  input_schema: {
    type: "object" as const,
    properties: {
      clientId: {
        type: "string",
        description: "The ID of the client placing the order (from the client list provided)",
      },
      scheduledDate: {
        type: "string",
        description: "Delivery date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ). Interpret relative dates like 'tomorrow', 'Thursday', 'next week' based on today's date.",
      },
      priority: {
        type: "string",
        enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
        description: "Order priority. Default NORMAL. Use HIGH/URGENT only if customer explicitly says it's urgent/rush.",
      },
      deliveryNotes: {
        type: "string",
        description: "Any delivery instructions mentioned by the customer (e.g., 'back door', 'before 9am')",
      },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            inventoryId: {
              type: ["string", "null"],
              description: "The inventory item ID if matched, or null if no match found",
            },
            name: {
              type: "string",
              description: "Product name as understood from the customer message",
            },
            quantity: {
              type: "number",
              description: "How many units the customer wants",
            },
            unit: {
              type: "string",
              description: "Unit of measurement (bag, case, kg, jug, unit, etc.)",
            },
            unitPrice: {
              type: "number",
              description: "Price per unit from inventory. Use 0 if item not in inventory.",
            },
          },
          required: ["name", "quantity", "unit", "unitPrice"],
        },
        description: "List of items the customer wants to order",
      },
    },
    required: ["clientId", "scheduledDate", "items"],
  },
}

// ─── Build the System Prompt ─────────────────────────────────────────────────
// We inject the business's actual inventory and client list into the prompt
// so Claude has real data to work with — not hallucinated products.

function buildSystemPrompt(
  businessName: string,
  inventory: InventoryItem[],
  clients: Client[],
  today: string
): string {
  const inventoryList = inventory
    .map(
      (i) =>
        `- ID: ${i.id} | ${i.name} (SKU: ${i.sku}) | ${i.unit} @ $${i.unitPrice} | Stock: ${i.quantity} ${i.unit}s`
    )
    .join("\n")

  const clientList = clients
    .map((c) => `- ID: ${c.id} | ${c.name} (Contact: ${c.contactName ?? "N/A"}) | ${c.city}`)
    .join("\n")

  return `You are the AI order assistant for "${businessName}".
Your job is to take customer orders from natural language messages and create structured orders.

TODAY'S DATE: ${today}

AVAILABLE INVENTORY:
${inventoryList || "No inventory items found."}

REGISTERED CLIENTS:
${clientList || "No clients found."}

RULES:
1. Match items to inventory by name, description, or common aliases (e.g., "paneer" matches "Paneer 1kg Block")
2. If a customer mentions a client name or you can identify who they are from context, use their clientId
3. If you cannot identify the client, ask for clarification — do NOT guess
4. Interpret relative dates: "tomorrow" = the day after today, "Thursday" = the next upcoming Thursday, etc.
5. If an item is not in inventory, still include it but set inventoryId to null and unitPrice to 0
6. If stock is insufficient, still create the order but mention the stock issue in your response
7. Default priority is NORMAL unless the customer says "rush", "urgent", "ASAP", etc.
8. Always confirm the order details in your response message
9. Be concise and professional — this is a business context, not casual chat
10. Use Canadian dollar amounts`
}

// ─── Main Agent Function ─────────────────────────────────────────────────────
// This is the core function that processes a customer message.
//
// FLOW:
// 1. Fetch inventory + clients from DB (for this business)
// 2. Send message to Claude with tool definitions
// 3. If Claude calls create_order → execute it in DB
// 4. Send result back to Claude → get confirmation message
// 5. Return the confirmation + order details

export type AgentResult = {
  success: boolean
  message: string          // Human-readable response for the customer
  orderId?: string         // If order was created
  orderNumber?: string     // Human-readable order number
  items?: { name: string; quantity: number; unit: string; unitPrice: number }[]
  total?: number
  error?: string
}

export async function processOrderMessage(
  businessId: string,
  message: string,
  clientId?: string        // Optional: if we already know who's ordering (e.g., from WhatsApp number)
): Promise<AgentResult> {
  // Step 1: Fetch business data
  const [business, inventory, clients] = await Promise.all([
    db.business.findUnique({ where: { id: businessId } }),
    db.inventoryItem.findMany({
      where: { businessId, active: true },
      orderBy: { name: "asc" },
    }),
    db.client.findMany({
      where: { businessId, active: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!business) {
    return { success: false, message: "Business not found", error: "BUSINESS_NOT_FOUND" }
  }

  const today = new Date().toISOString().split("T")[0]

  // If we know the client, add that context to the message
  const contextPrefix = clientId
    ? `[System: This message is from client ID ${clientId}. Use this clientId for the order.]\n\n`
    : ""

  // Step 2: Call Claude with the message + tools
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",  // Fast + smart enough for order parsing
    max_tokens: 1024,
    system: buildSystemPrompt(business.name, inventory, clients, today),
    tools: [CREATE_ORDER_TOOL],
    messages: [
      {
        role: "user",
        content: contextPrefix + message,
      },
    ],
  })

  // Step 3: Check if Claude wants to create an order
  const toolUse = response.content.find(
    (block) => block.type === "tool_use"
  ) as { type: "tool_use"; id: string; name: string; input: any } | undefined

  // If Claude just responded with text (e.g., asking for clarification)
  if (!toolUse) {
    const textBlock = response.content.find(
      (block) => block.type === "text"
    ) as { type: "text"; text: string } | undefined
    return {
      success: false,
      message: textBlock?.text ?? "I couldn't understand that order. Could you rephrase?",
    }
  }

  // Step 4: Execute the order creation in the database
  const input = toolUse.input as {
    clientId: string
    scheduledDate?: string
    priority?: string
    deliveryNotes?: string
    items: {
      inventoryId?: string | null
      name: string
      quantity: number
      unit: string
      unitPrice: number
    }[]
  }

  try {
    // Verify client exists
    const client = await db.client.findFirst({
      where: { id: input.clientId, businessId },
    })
    if (!client) {
      return {
        success: false,
        message: "I couldn't find that client in the system. Could you specify which client this order is for?",
      }
    }

    // Calculate totals
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const tax = subtotal * 0.13 // Ontario HST
    const total = subtotal + tax

    // Create the order in a transaction
    const order = await db.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(businessId, tx)

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          businessId,
          clientId: input.clientId,
          status: "PENDING",
          priority: (input.priority as any) ?? "NORMAL",
          scheduledDate: input.scheduledDate
            ? new Date(input.scheduledDate)
            : new Date(Date.now() + 24 * 60 * 60 * 1000), // default: tomorrow
          deliveryAddress: client.address,
          deliveryNotes: input.deliveryNotes,
          internalNotes: "Created by AI Order Agent",
          subtotal,
          tax,
          total,
          items: {
            create: input.items.map((item) => ({
              inventoryId: item.inventoryId || undefined,
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: { client: true, items: true },
      })

      // Decrement inventory for matched items
      for (const item of input.items) {
        if (item.inventoryId) {
          await tx.inventoryItem.update({
            where: { id: item.inventoryId },
            data: { quantity: { decrement: item.quantity } },
          })
        }
      }

      return newOrder
    })

    // Step 5: Send result back to Claude for a confirmation message
    const confirmResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: "You are a professional order confirmation assistant. Generate a brief, clear confirmation message for the customer. Include the order number, items, total, and delivery date. Keep it under 100 words. Use Canadian dollars.",
      messages: [
        {
          role: "user",
          content: `Generate a confirmation for this order:
Order #: ${order.orderNumber}
Client: ${order.client.name}
Items: ${order.items.map((i) => `${i.quantity} ${i.unit} ${i.name} @ $${i.unitPrice}`).join(", ")}
Subtotal: $${subtotal.toFixed(2)}
HST (13%): $${tax.toFixed(2)}
Total: $${total.toFixed(2)}
Delivery: ${order.scheduledDate.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}`,
        },
      ],
    })

    const confirmText = confirmResponse.content.find(
      (block) => block.type === "text"
    ) as { type: "text"; text: string } | undefined

    return {
      success: true,
      message: confirmText?.text ?? `Order ${order.orderNumber} created successfully.`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: input.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
      })),
      total,
    }
  } catch (err: any) {
    console.error("[Agent] Order creation failed:", err)
    return {
      success: false,
      message: "Sorry, I couldn't create that order. There was a system error. Please try again or contact support.",
      error: err.message,
    }
  }
}
