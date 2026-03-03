// lib/auth.ts
// NextAuth v4 configuration
// Using JWT strategy with credentials login (no adapter needed for demo)

import { NextAuthOptions, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs"
import type { AppSession } from "@/types"

export const authOptions: NextAuthOptions = {
  // NOTE: No adapter — CredentialsProvider + PrismaAdapter conflict in NextAuth v4.
  // The adapter is only needed for OAuth/magic-link flows.
  // For credentials login, we handle everything in authorize() + JWT callbacks.

  providers: [
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

          if (!user || !user.password) return null

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null

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
          } as any
        } catch (err) {
          console.error("[Auth] authorize error:", err)
          return null
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = (user as any).role
        token.businessId = (user as any).businessId
        token.businessName = (user as any).businessName
        token.businessSlug = (user as any).businessSlug
        token.plan = (user as any).plan
      }
      return token
    },

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

export async function getAppSession(): Promise<AppSession | null> {
  return getServerSession(authOptions) as Promise<AppSession | null>
}

export async function requireAuth(): Promise<AppSession> {
  const session = await getAppSession()
  if (!session) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}
