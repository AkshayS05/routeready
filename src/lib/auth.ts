// lib/auth.ts
// NextAuth v4 configuration
// Using Prisma adapter so sessions/accounts are stored in our DB

import { NextAuthOptions, getServerSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { db } from "./db"
import * as bcrypt from "bcryptjs"
import type { AppSession } from "@/types"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db) as any,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "unused",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "unused",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null

          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { business: true },
          })

          if (!user || !user.password) {
            console.log("[Auth] User not found or no password:", credentials.email)
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            console.log("[Auth] Invalid password for:", credentials.email)
            return null
          }

          console.log("[Auth] Login success:", credentials.email)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            businessId: user.businessId,
            businessName: user.business.name,
            businessSlug: user.business.slug,
            plan: user.business.plan,
          }
        } catch (err) {
          console.error("[Auth] authorize error:", err)
          return null
        }
      },
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
        // Credentials provider already includes these fields
        if ((user as any).businessId) {
          token.userId = user.id
          token.role = (user as any).role
          token.businessId = (user as any).businessId
          token.businessName = (user as any).businessName
          token.businessSlug = (user as any).businessSlug
          token.plan = (user as any).plan
        } else {
          // OAuth sign-in — fetch from DB
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
export async function getAppSession(): Promise<AppSession | null> {
  return getServerSession(authOptions) as Promise<AppSession | null>
}

// Helper: require auth — throws if not authenticated
export async function requireAuth(): Promise<AppSession> {
  const session = await getAppSession()
  if (!session) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}
