"use client"
// app/(dashboard)/dashboard/page.tsx
// Main dashboard with KPIs, recent orders, and alerts

import { useDashboardStats, useOrders } from "@/hooks/useOrders"
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/utils"
import {
  ShoppingCart, Truck, TrendingUp, Package,
  AlertTriangle, CheckCircle, Clock, ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentOrders } = useOrders({ pageSize: 8 })

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString("en-CA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Today's KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Orders"
          value={statsLoading ? "—" : String(stats?.today.orders ?? 0)}
          sub={`${stats?.today.delivered ?? 0} delivered`}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="In Transit"
          value={statsLoading ? "—" : String(stats?.today.inTransit ?? 0)}
          sub={`${stats?.today.pending ?? 0} pending`}
          icon={<Truck className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Today's Revenue"
          value={statsLoading ? "—" : formatCurrency(stats?.today.revenue ?? 0)}
          sub={`Week: ${formatCurrency(stats?.week.revenue ?? 0)}`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          label="Low Stock Items"
          value={statsLoading ? "—" : String(stats?.inventory.lowStock ?? 0)}
          sub={`${stats?.inventory.expiringThisWeek ?? 0} expiring soon`}
          icon={<Package className="w-5 h-5" />}
          color={stats?.inventory.lowStock > 0 ? "amber" : "emerald"}
        />
      </div>

      {/* Alerts */}
      {(stats?.inventory.lowStock > 0 || stats?.inventory.expiringThisWeek > 0) && (
        <div className="space-y-2">
          {stats?.inventory.lowStock > 0 && (
            <AlertBanner
              icon={<AlertTriangle className="w-4 h-4" />}
              color="amber"
              message={`${stats.inventory.lowStock} inventory items are below reorder threshold`}
              link="/dashboard/inventory?filter=low"
              linkLabel="View items"
            />
          )}
          {stats?.inventory.expiringThisWeek > 0 && (
            <AlertBanner
              icon={<Clock className="w-4 h-4" />}
              color="red"
              message={`${stats.inventory.expiringThisWeek} items expiring within 3 days`}
              link="/dashboard/inventory?filter=expiring"
              linkLabel="View items"
            />
          )}
        </div>
      )}

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {!recentOrders?.data?.length ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No orders yet. <Link href="/dashboard/orders/new" className="text-emerald-400 hover:underline">Create your first order</Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recentOrders.data.map(order => (
                  <tr key={order.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${order.id}`} className="text-sm font-mono text-emerald-400 hover:text-emerald-300">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{order.client.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{order.driver?.name ?? <span className="text-gray-600">Unassigned</span>}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(order.scheduledDate)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-300 font-mono">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    purple: "bg-purple-500/10 text-purple-400",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className={`w-9 h-9 rounded-lg ${colorMap[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      <div className="text-xs text-gray-600 mt-1">{sub}</div>
    </div>
  )
}

function AlertBanner({ icon, color, message, link, linkLabel }: {
  icon: React.ReactNode; color: string; message: string; link: string; linkLabel: string
}) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    red: "bg-red-500/10 border-red-500/30 text-red-400",
  }

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${colorMap[color]}`}>
      <div className="flex items-center gap-2">
        {icon}
        {message}
      </div>
      <Link href={link} className="text-xs font-medium underline underline-offset-2 flex items-center gap-1">
        {linkLabel} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
