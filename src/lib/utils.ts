// lib/utils.ts
// Shared utility functions used throughout the app

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isToday, isTomorrow, isYesterday } from "date-fns"
import type { OrderStatus, InventoryItem } from "@prisma/client"

// shadcn-style className merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Order helpers ─────────────────────────────────────────────────────────

// Generate human-readable order numbers: ORD-2024-001
export async function generateOrderNumber(businessId: string, db: any): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.order.count({
    where: { businessId, createdAt: { gte: new Date(`${year}-01-01`) } },
  })
  return `ORD-${year}-${String(count + 1).padStart(4, "0")}`
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  ASSIGNED: "Assigned",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  ASSIGNED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  IN_TRANSIT: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  DELIVERED: "bg-green-500/15 text-green-400 border-green-500/30",
  FAILED: "bg-red-500/15 text-red-400 border-red-500/30",
  CANCELLED: "bg-gray-500/15 text-gray-400 border-gray-500/30",
}

// ─── Date formatting ────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  if (isToday(d)) return `Today, ${format(d, "h:mm a")}`
  if (isTomorrow(d)) return `Tomorrow, ${format(d, "h:mm a")}`
  if (isYesterday(d)) return `Yesterday, ${format(d, "h:mm a")}`
  return format(d, "MMM d, yyyy")
}

export function formatShortDate(date: Date | string): string {
  return format(new Date(date), "MMM d")
}

// ─── Currency ───────────────────────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount)
}

// ─── Inventory helpers ──────────────────────────────────────────────────────

export function getStockStatus(item: InventoryItem) {
  if (item.quantity <= 0) return "out" as const
  if (item.quantity <= item.reorderThreshold * 0.5) return "critical" as const
  if (item.quantity <= item.reorderThreshold) return "low" as const
  return "ok" as const
}

export const STOCK_STATUS_CONFIG = {
  ok: { label: "In Stock", color: "bg-green-500/15 text-green-400 border-green-500/30" },
  low: { label: "Low Stock", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  critical: { label: "Critical", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  out: { label: "Out of Stock", color: "bg-red-500/15 text-red-400 border-red-500/30" },
}

// ─── Route Optimization: Nearest Neighbor Algorithm ────────────────────────
// O(n²) — optimal for 5-20 stops, which covers 99% of food distributor routes
// Returns ordered array of stop indices

type Point = { lat: number; lng: number; id: string }

function haversineKm(a: Point, b: Point): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const sin2Lat = Math.sin(dLat / 2) ** 2
  const sin2Lng = Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(
    Math.sqrt(sin2Lat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sin2Lng),
    Math.sqrt(1 - sin2Lat - Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sin2Lng)
  )
  return R * c
}

export function optimizeRouteNearestNeighbor(
  depot: Point,
  stops: Point[]
): { orderedStops: Point[]; totalDistanceKm: number } {
  if (stops.length === 0) return { orderedStops: [], totalDistanceKm: 0 }
  if (stops.length === 1) return { orderedStops: stops, totalDistanceKm: haversineKm(depot, stops[0]) }

  const unvisited = [...stops]
  const route: Point[] = []
  let current = depot
  let totalDist = 0

  while (unvisited.length > 0) {
    let nearestIdx = 0
    let nearestDist = haversineKm(current, unvisited[0])

    for (let i = 1; i < unvisited.length; i++) {
      const d = haversineKm(current, unvisited[i])
      if (d < nearestDist) {
        nearestDist = d
        nearestIdx = i
      }
    }

    totalDist += nearestDist
    current = unvisited[nearestIdx]
    route.push(current)
    unvisited.splice(nearestIdx, 1)
  }

  // Add return to depot
  totalDist += haversineKm(current, depot)

  return { orderedStops: route, totalDistanceKm: Math.round(totalDist * 10) / 10 }
}

// Estimate drive time: ~30km/h average in GTA with stops
export function estimateDriveMins(distanceKm: number, numStops: number): number {
  const driveTime = (distanceKm / 30) * 60 // 30km/h average
  const stopTime = numStops * 10            // 10 min per stop
  return Math.round(driveTime + stopTime)
}

// ─── Min-Heap for critical inventory ────────────────────────────────────────
// O(log n) insertions — efficient even with 10,000+ SKUs

export class MinHeap<T> {
  private heap: T[] = []
  private compareFn: (a: T, b: T) => number

  constructor(compareFn: (a: T, b: T) => number) {
    this.compareFn = compareFn
  }

  push(item: T): void {
    this.heap.push(item)
    this.bubbleUp(this.heap.length - 1)
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined
    const top = this.heap[0]
    const last = this.heap.pop()!
    if (this.heap.length > 0) {
      this.heap[0] = last
      this.sinkDown(0)
    }
    return top
  }

  peek(): T | undefined {
    return this.heap[0]
  }

  get size(): number {
    return this.heap.length
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2)
      if (this.compareFn(this.heap[i], this.heap[parent]) < 0) {
        ;[this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]]
        i = parent
      } else break
    }
  }

  private sinkDown(i: number): void {
    const n = this.heap.length
    while (true) {
      let smallest = i
      const l = 2 * i + 1
      const r = 2 * i + 2
      if (l < n && this.compareFn(this.heap[l], this.heap[smallest]) < 0) smallest = l
      if (r < n && this.compareFn(this.heap[r], this.heap[smallest]) < 0) smallest = r
      if (smallest === i) break
      ;[this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]]
      i = smallest
    }
  }
}

// Get most critical inventory items (lowest stock ratio)
export function getCriticalInventory(items: InventoryItem[], limit = 5): InventoryItem[] {
  const heap = new MinHeap<InventoryItem>(
    (a, b) => a.quantity / a.reorderThreshold - b.quantity / b.reorderThreshold
  )
  items.forEach(item => {
    if (item.quantity <= item.reorderThreshold) heap.push(item)
  })
  const result: InventoryItem[] = []
  for (let i = 0; i < limit; i++) {
    const item = heap.pop()
    if (!item) break
    result.push(item)
  }
  return result
}

// ─── Webhook signature verification ────────────────────────────────────────
// Verify n8n webhook calls are legitimate

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto")
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  return `sha256=${expected}` === signature
}
