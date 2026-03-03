import type { UserRole, Plan } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface Session {
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
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    role: UserRole
    businessId: string
    businessName: string
    businessSlug: string
    plan: Plan
  }
}
