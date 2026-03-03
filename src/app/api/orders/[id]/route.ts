// app/api/orders/[id]/route.ts
// GET   /api/orders/:id — get single order
// PATCH /api/orders/:id — update order (status, driver, etc.)
// DELETE /api/orders/:id — cancel order

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "FAILED", "CANCELLED"]).optional(),
  driverId: z.string().cuid().nullable().optional(),
  routeId: z.string().cuid().nullable().optional(),
  scheduledDate: z.string().datetime().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  deliveryNotes: z.string().max(500).optional(),
  internalNotes: z.string().max(500).optional(),
  proofOfDelivery: z.string().url().optional(),
  signedBy: z.string().optional(),
  deliveredAt: z.string().datetime().optional(),
})

// ─── GET /api/orders/:id ─────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { businessId } = session.user

    const order = await db.order.findFirst({
      where: { id: params.id, businessId }, // businessId = tenant isolation
      include: {
        client: true,
        driver: true,
        items: { include: { inventory: true } },
        route: { include: { stops: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ data: order })
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── PATCH /api/orders/:id ───────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { businessId } = session.user

    // Verify order belongs to this business before allowing update
    const existing = await db.order.findFirst({
      where: { id: params.id, businessId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const body = await req.json()
    const parsed = updateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const updateData: any = { ...parsed.data }

    // Auto-set deliveredAt when marking as delivered
    if (parsed.data.status === "DELIVERED" && !parsed.data.deliveredAt) {
      updateData.deliveredAt = new Date()
    }

    const order = await db.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        driver: { select: { id: true, name: true, phone: true } },
      },
    })

    // Fire webhook on status changes
    if (parsed.data.status) {
      fireWebhook(`order.${parsed.data.status.toLowerCase()}`, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        businessId,
        newStatus: parsed.data.status,
        clientName: order.client.name,
        clientPhone: order.client.phone,
        driverName: order.driver?.name,
      }).catch(console.error)
    }

    return NextResponse.json({ data: order })
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ─── DELETE /api/orders/:id ──────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const { businessId, role } = session.user

    // Only owners/managers can delete orders
    if (!["OWNER", "MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const existing = await db.order.findFirst({
      where: { id: params.id, businessId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Soft delete: set to CANCELLED rather than actually deleting
    // Keeps audit trail intact
    await db.order.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    })

    return NextResponse.json({ data: { success: true } })
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function fireWebhook(event: string, payload: object) {
  const url = process.env.N8N_WEBHOOK_URL
  if (!url) return
  const body = JSON.stringify({ event, payload, timestamp: Date.now() })
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  })
}
