// lib/auth.ts
// NextAuth v4 configuration
// Using Prisma adapter so sessions/accounts are stored in our DB

import { NextAuthOptions, getServerSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"
import type { AppSession } from "@/types"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Magic link email — great for small business owners
    EmailProvider({
      server: {
        host: "smtp.resend.com",
        port: 465,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  session: {
    strategy: "jwt", // JWT faster than DB sessions for most requests
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    // Runs when JWT is created/updated
    async jwt({ token, user }) {
      if (user) {
        // First sign in — fetch full user+business from DB
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          include: { business: true },
        })
        if (dbUser) {
          token.userId = dbUser.id
          token.role = dbUser.role
          token.businessId = dbUser.businessId
          token.businessName = dbUser.business.name
          token.businessSlug = dbUser.business.slug
          token.plan = dbUser.business.plan
        }
      }
      return token
    },

    // Runs on every request — shapes the session object the app uses
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as any
        session.user.businessId = token.businessId as string
        session.user.businessName = token.businessName as string
        session.user.businessSlug = token.businessSlug as string
        session.user.plan = token.plan as any
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
}

// Helper: get session in Server Components and API routes
// Usage: const session = await getAppSession()
export async function getAppSession(): Promise<AppSession | null> {
  return getServerSession(authOptions) as Promise<AppSession | null>
}

// Helper: require auth — throws if not authenticated
// Use in API routes to protect endpoints
export async function requireAuth(): Promise<AppSession> {
  const session = await getAppSession()
  if (!session) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}
