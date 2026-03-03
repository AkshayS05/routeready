import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const { name, phone, businessType } = await req.json()

    if (!name || !phone || !businessType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Save to database
    const lead = await db.lead.create({
      data: { name, phone, businessType, source: "landing" },
    })

    // Forward to n8n webhook if configured
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: lead.id,
          name,
          phone,
          businessType,
          source: "landing",
          timestamp: lead.createdAt.toISOString(),
        }),
      }).catch(() => {}) // fire-and-forget, don't block response
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  // Simple endpoint to check lead count (no auth needed for now)
  const count = await db.lead.count()
  return NextResponse.json({ count })
}
