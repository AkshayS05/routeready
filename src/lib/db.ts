// lib/db.ts
// Prisma client singleton pattern — critical for Next.js
// In development, Next.js hot reloads create new module instances.
// Without this pattern, you'd exhaust PostgreSQL connection limits.

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}
