// middleware.ts (root level — runs before EVERY request)
// Two jobs:
// 1. Protect dashboard routes — redirect to login if no session
// 2. Ensure businessId context is always present (tenant isolation)

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // If accessing dashboard without a businessId somehow, force re-auth
    if (pathname.startsWith("/dashboard") && !token?.businessId) {
      return NextResponse.redirect(new URL("/login?error=no-business", req.url))
    }

    // Add businessId to request headers so API routes can read it
    // This is the tenant isolation layer — every API route gets this for free
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-business-id", token?.businessId as string ?? "")
    requestHeaders.set("x-user-id", token?.sub ?? "")
    requestHeaders.set("x-user-role", token?.role as string ?? "")

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  },
  {
    callbacks: {
      // Return true = allow through, false = redirect to login
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes — always allow
        const publicRoutes = ["/", "/login", "/api/auth"]
        if (publicRoutes.some(r => pathname.startsWith(r))) return true

        // API webhook routes (called by n8n) — allow but verify in route handler
        if (pathname.startsWith("/api/webhooks")) return true

        // Everything else requires a session
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
