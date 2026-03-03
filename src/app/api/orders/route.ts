// app/api/orders/route.ts
// GET  /api/orders   — list orders with filters
// POST /api/orders   — create new order

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { generateOrderNumber } from "@/lib/utils"
import type { OrderFilters } from "@/types"

// ─── Validation Schemas ───────────────────────────────────────────────────

const createOrderSchema = z.object({
  clientId: z.string().cuid("Invalid client"),
  driverId: z.string().cuid().optional(),
  scheduledDate: z.string().datetime("Invalid date"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  deliveryNotes: z.string().max(500).optional(),
  internalNotes: z.string().max(500).optional(),
  items: z.array(z.object({
    inventoryId: z.string().cuid().optional(),
    name: z.string().min(1, "Item name required"),
    sku: z.string().optional(),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.string().default("unit"),
    unitPrice: z.number().min(0, "Price cannot be negative"),
  })).min(1, "At least one item required"),
})

// ─── GET /api/orders ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { businessId } = session.user

    const { searchParams } = new URL(req.url)
    const filters: OrderFilters = {
      status: (searchParams.get("status") as any) ?? "ALL",
      driverId: searchParams.get("driverId") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      pageSize: parseInt(searchParams.get("pageSize") ?? "20"),
    }

    // Build where clause — businessId ALWAYS present (tenant isolation)
    const where: any = { businessId }

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status
    }
    if (filters.driverId) where.driverId = filters.driverId
    if (filters.clientId) where.clientId = filters.clientId
    if (filters.dateFrom || filters.dateTo) {
      where.scheduledDate = {}
      if (filters.dateFrom) where.scheduledDate.gte = new Date(filters.dateFrom)
      if (filters.dateTo) where.scheduledDate.lte = new Date(filters.dateTo)
    }
    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: "insensitive" } },
        { client: { name: { contains: filters.search, mode: "insensitive" } } },
      ]
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          client: { select: { id: true, name: true, address: true, city: true, phone: true } },
          driver: { select: { id: true, name: true, phone: true } },
          items: true,
        },
        orderBy: [
          { scheduledDate: "asc" },
          { createdAt: "desc" },
        ],
        skip: ((filters.page ?? 1) - 1) * (filters.pageSize ?? 20),
        take: filters.pageSize ?? 20,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      data: orders,
      meta: { total, page: filters.page, pageSize: filters.pageSize },
    })
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[GET /api/orders]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── POST /api/orders ────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { businessId } = session.user

    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const input = parsed.data

    // Verify client belongs to this business
    const client = await db.client.findFirst({
      where: { id: input.clientId, businessId },
    })
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Verify driver belongs to this business (if provided)
    if (input.driverId) {
      const driver = await db.driver.findFirst({
        where: { id: input.driverId, businessId },
      })
      if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 })
      }
    }

    // Calculate totals
    const subtotal = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )
    const tax = subtotal * 0.13 // Ontario HST
    const total = subtotal + tax

    // Create order + items in a transaction
    const order = await db.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(businessId, tx)

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          businessId,
          clientId: input.clientId,
          driverId: input.driverId,
          status: input.driverId ? "ASSIGNED" : "PENDING",
          priority: input.priority,
          scheduledDate: new Date(input.scheduledDate),
          deliveryAddress: client.address,
          deliveryNotes: input.deliveryNotes,
          internalNotes: input.internalNotes,
          subtotal,
          tax,
          total,
          items: {
            create: input.items.map(item => ({
              inventoryId: item.inventoryId,
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          client: true,
          driver: true,
          items: true,
        },
      })

      // Decrement inventory quantities if linked
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

    // Fire webhook to n8n for automation (SMS, email, etc.)
    // Non-blocking — don't await, don't fail if n8n is down
    fireWebhook("order.created", {
      orderId: order.id,
      orderNumber: order.orderNumber,
      businessId,
      clientName: order.client.name,
      clientPhone: order.client.phone,
      driverName: order.driver?.name,
      driverPhone: order.driver?.phone,
      scheduledDate: order.scheduledDate,
      total: order.total,
    }).catch(err => console.error("[Webhook] order.created failed:", err))

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("[POST /api/orders]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── Webhook helper ───────────────────────────────────────────────────────

async function fireWebhook(event: string, payload: object) {
  const url = process.env.N8N_WEBHOOK_URL
  if (!url) return

  const crypto = await import("crypto")
  const body = JSON.stringify({ event, payload, timestamp: Date.now() })
  const signature = crypto
    .createHmac("sha256", process.env.N8N_WEBHOOK_SECRET ?? "")
    .update(body)
    .digest("hex")

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Signature": `sha256=${signature}`,
    },
    body,
  })
}
