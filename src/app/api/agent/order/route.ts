// app/api/agent/order/route.ts
//
// AI Order Intake API
//
// HOW TO USE:
// POST /api/agent/order
// Body: { "message": "I need 5 bags of rice and 3 jugs of oil for Thursday" }
//
// The agent will:
// 1. Parse the natural language message using Claude AI
// 2. Match items to your inventory
// 3. Create an order in the database
// 4. Return a confirmation message
//
// TWO MODES:
// - Authenticated (from dashboard): Uses session to get businessId
// - Webhook (from WhatsApp/Twilio): Uses API key + businessId in headers

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { processOrderMessage } from "@/lib/agent"
import { getAppSession } from "@/lib/auth"

const requestSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000),
  clientId: z.string().optional(),  // Optional: pre-identified client (e.g., from WhatsApp number lookup)
})

export async function POST(req: NextRequest) {
  try {
    // Auth: either session (dashboard) or API key (webhook)
    let businessId: string

    const apiKey = req.headers.get("x-api-key")
    const headerBusinessId = req.headers.get("x-business-id")

    if (apiKey && headerBusinessId) {
      // Webhook mode: verify API key
      if (apiKey !== process.env.AGENT_API_KEY) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      }
      businessId = headerBusinessId
    } else {
      // Dashboard mode: use session
      const session = await getAppSession()
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      businessId = session.user.businessId
    }

    // Parse and validate request body
    const body = await req.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    // Process the message through the AI agent
    const result = await processOrderMessage(
      businessId,
      parsed.data.message,
      parsed.data.clientId
    )

    return NextResponse.json(result, {
      status: result.success ? 201 : 200,
    })
  } catch (err: any) {
    console.error("[POST /api/agent/order]", err)
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    )
  }
}
