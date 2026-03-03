// hooks/useOrders.ts
// All server state for orders — React Query handles caching, loading, errors
// These hooks are used throughout the app instead of raw fetch calls

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query"
import type { OrderWithRelations, OrderFilters, ApiResponse } from "@/types"
import type { OrderStatus } from "@prisma/client"

// ─── Query Keys ─────────────────────────────────────────────────────────────
// Centralized key factory prevents typos and enables precise cache invalidation

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
}

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchOrders(filters: OrderFilters): Promise<ApiResponse<OrderWithRelations[]>> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "ALL") params.set(k, String(v))
  })
  const res = await fetch(`/api/orders?${params}`)
  if (!res.ok) throw new Error("Failed to fetch orders")
  return res.json()
}

async function fetchOrder(id: string): Promise<OrderWithRelations> {
  const res = await fetch(`/api/orders/${id}`)
  if (!res.ok) throw new Error("Order not found")
  const json = await res.json()
  return json.data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

// List orders with filters
export function useOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    staleTime: 30_000,           // consider fresh for 30s
    placeholderData: keepPreviousData, // no loading flash when filters change
  })
}

// Single order detail
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchOrder(id),
    staleTime: 60_000,
    enabled: !!id,
  })
}

// ─── Update order status — optimistic update ─────────────────────────────────
// UI updates INSTANTLY. If API fails, it rolls back.
// This is what makes the app feel fast for drivers marking deliveries.

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus; filters?: OrderFilters }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update order")
      return res.json()
    },

    // Optimistic update — runs BEFORE the API call
    onMutate: async ({ id, status, filters = {} }) => {
      // Cancel any in-flight queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: orderKeys.list(filters) })
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) })

      // Snapshot current data for rollback
      const previousOrders = queryClient.getQueryData(orderKeys.list(filters))
      const previousOrder = queryClient.getQueryData(orderKeys.detail(id))

      // Optimistically update the list
      queryClient.setQueryData(orderKeys.list(filters), (old: any) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((o: OrderWithRelations) =>
            o.id === id ? { ...o, status } : o
          ),
        }
      })

      // Optimistically update the detail
      queryClient.setQueryData(orderKeys.detail(id), (old: any) => {
        if (!old) return old
        return { ...old, status }
      })

      return { previousOrders, previousOrder }
    },

    // If API call fails — roll back to snapshots
    onError: (err, { id, filters = {} }, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(orderKeys.list(filters), context.previousOrders)
      }
      if (context?.previousOrder) {
        queryClient.setQueryData(orderKeys.detail(id), context.previousOrder)
      }
    },

    // Whether success or error — always refetch to sync with server
    onSettled: (_, __, { id, filters = {} }) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list(filters) })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
  })
}

// ─── Create order ────────────────────────────────────────────────────────────

export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: any) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to create order")
      }
      return res.json()
    },

    onSuccess: () => {
      // Invalidate all order lists so they refetch
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["inventory"] }) // stock was decremented
    },
  })
}

// ─── Dashboard stats ─────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      const json = await res.json()
      return json.data
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000, // Auto-refresh every 5 minutes
  })
}
