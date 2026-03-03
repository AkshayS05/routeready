// middleware.ts (root level)
// Protects dashboard routes and injects tenant context headers.
// IMPORTANT: /api/auth routes are excluded via matcher so NextAuth
// handles them without any middleware interference.

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // If accessing dashboard without a businessId, force re-auth
    if (pathname.startsWith("/dashboard") && !token?.businessId) {
      return NextResponse.redirect(new URL("/login?error=no-business", req.url))
    }

    // Add businessId to request headers (tenant isolation layer)
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
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes
        if (pathname === "/" || pathname.startsWith("/login")) return true

        // Webhook routes — verified in route handler
        if (pathname.startsWith("/api/webhooks")) return true
        if (pathname.startsWith("/api/agent")) return true

        // Everything else requires a session
        return !!token
      },
    },
  }
)

export const config = {
  // Exclude: static files, images, favicon, AND all /api/auth routes
  // /api/auth MUST be excluded — withAuth middleware conflicts with
  // NextAuth's own auth endpoints (CSRF, callback, session, etc.)
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
}
