// app/api/dashboard/stats/route.ts
// Returns all KPIs for the main dashboard in a single request
// Runs parallel queries for performance

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, addDays } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth()
    const { businessId } = session.user

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const threedays = addDays(now, 3)

    // Run all queries in parallel — much faster than sequential awaits
    const [
      todayOrders,
      weekOrders,
      lowStockItems,
      expiringItems,
      activeDrivers,
      driversOnRoute,
    ] = await Promise.all([
      // Today's orders grouped by status
      db.order.groupBy({
        by: ["status"],
        where: { businessId, scheduledDate: { gte: todayStart, lte: todayEnd } },
        _count: { id: true },
        _sum: { total: true },
      }),

      // This week's summary
      db.order.aggregate({
        where: {
          businessId,
          scheduledDate: { gte: weekStart, lte: weekEnd },
          status: { not: "CANCELLED" },
        },
        _count: { id: true },
        _sum: { total: true },
      }),

      // Low stock count
      db.inventoryItem.count({
        where: {
          businessId,
          active: true,
          quantity: { lte: db.inventoryItem.fields.reorderThreshold },
        },
      }).catch(() => 
        // Fallback: Prisma doesn't support field comparisons directly in all versions
        db.$queryRaw<[{count: bigint}]>`
          SELECT COUNT(*) as count FROM "InventoryItem" 
          WHERE "businessId" = ${businessId} 
          AND active = true 
          AND quantity <= "reorderThreshold"
        `.then(r => Number(r[0].count))
      ),

      // Expiring in 3 days
      db.inventoryItem.count({
        where: {
          businessId,
          active: true,
          expiryDate: { not: null, lte: threedays, gte: now },
        },
      }),

      // Total active drivers
      db.driver.count({
        where: { businessId, active: true },
      }),

      // Drivers currently on a route
      db.route.count({
        where: { businessId, status: "ACTIVE" },
      }),
    ])

    // Process today's order stats
    const todayStats = {
      orders: 0,
      delivered: 0,
      pending: 0,
      inTransit: 0,
      revenue: 0,
    }

    for (const group of todayOrders) {
      todayStats.orders += group._count.id
      todayStats.revenue += group._sum.total ?? 0
      if (group.status === "DELIVERED") todayStats.delivered += group._count.id
      if (group.status === "PENDING" || group.status === "ASSIGNED") todayStats.pending += group._count.id
      if (group.status === "IN_TRANSIT") todayStats.inTransit += group._count.id
    }

    // On-time rate (delivered orders out of all scheduled-for-today)
    const deliveredToday = todayOrders.find(g => g.status === "DELIVERED")?._count.id ?? 0
    const totalScheduled = todayStats.orders
    const onTimeRate = totalScheduled > 0 ? Math.round((deliveredToday / totalScheduled) * 100) : 0

    return NextResponse.json({
      data: {
        today: todayStats,
        week: {
          orders: weekOrders._count.id,
          revenue: weekOrders._sum.total ?? 0,
          onTimeRate,
        },
        inventory: {
          lowStock: typeof lowStockItems === "number" ? lowStockItems : 0,
          critical: 0, // Can add separate query for quantity <= threshold * 0.5
          expiringThisWeek: expiringItems,
        },
        drivers: {
          active: activeDrivers,
          onRoute: driversOnRoute,
        },
      },
    })
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[GET /api/dashboard/stats]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
