// RouteReady - Global TypeScript Types
// These extend the Prisma-generated types with UI-specific additions

import type { 
  Business, User, Client, Driver, Order, OrderItem, 
  InventoryItem, Route, RouteStop,
  OrderStatus, Priority, RouteStatus, Plan, UserRole
} from "@prisma/client"

// Re-export Prisma enums for use throughout the app
export { OrderStatus, Priority, RouteStatus, Plan, UserRole }

// ─── Extended types with relations ──────────────────────────────────────────

export type OrderWithRelations = Order & {
  client: Client
  driver?: Driver | null
  items: OrderItem[]
  route?: Route | null
}

export type RouteWithRelations = Route & {
  driver: Driver
  orders: OrderWithRelations[]
  stops: RouteStop[]
}

export type InventoryWithStatus = InventoryItem & {
  stockStatus: "ok" | "low" | "critical" | "out"
  daysUntilExpiry?: number | null
}

// ─── Session / Auth ─────────────────────────────────────────────────────────

export type AppSession = {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    role: UserRole
    businessId: string
    businessName: string
    businessSlug: string
    plan: Plan
  }
}

// ─── API Response types ─────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T
  meta?: {
    total: number
    page: number
    pageSize: number
  }
}

export type ApiError = {
  error: string
  code?: string
  details?: Record<string, string[]>
}

// ─── Filter/Query types ─────────────────────────────────────────────────────

export type OrderFilters = {
  status?: OrderStatus | "ALL"
  driverId?: string
  clientId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  page?: number
  pageSize?: number
}

export type InventoryFilters = {
  category?: string
  stockStatus?: "low" | "critical" | "out"
  search?: string
  page?: number
  pageSize?: number
}

// ─── Dashboard stats ────────────────────────────────────────────────────────

export type DashboardStats = {
  today: {
    orders: number
    delivered: number
    pending: number
    inTransit: number
    revenue: number
  }
  week: {
    orders: number
    revenue: number
    onTimeRate: number
  }
  inventory: {
    lowStock: number
    critical: number
    expiringThisWeek: number
  }
  drivers: {
    active: number
    onRoute: number
  }
}

// ─── Route Optimization ─────────────────────────────────────────────────────

export type Coordinate = {
  lat: number
  lng: number
}

export type OptimizationStop = Coordinate & {
  id: string
  label: string
  address: string
}

export type OptimizedRoute = {
  stops: OptimizationStop[]
  totalDistanceKm: number
  estimatedMins: number
}

// ─── Form types (separate from DB types) ────────────────────────────────────

export type CreateOrderInput = {
  clientId: string
  driverId?: string
  scheduledDate: string
  priority: Priority
  deliveryNotes?: string
  internalNotes?: string
  items: {
    inventoryId?: string
    name: string
    sku?: string
    quantity: number
    unit: string
    unitPrice: number
  }[]
}

export type CreateDriverInput = {
  name: string
  phone: string
  email?: string
  vehicleType?: string
  licensePlate?: string
  capacityKg?: number
}

export type CreateClientInput = {
  name: string
  contactName?: string
  phone?: string
  email?: string
  address: string
  city: string
  postalCode?: string
  notes?: string
}
