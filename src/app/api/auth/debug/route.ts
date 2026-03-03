// Temporary debug endpoint — DELETE after fixing auth
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // 1. Test DB connection
    const userCount = await db.user.count()

    // 2. Find demo user
    const user = await db.user.findUnique({
      where: { email: "demo@routeready.app" },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        businessId: true,
        business: { select: { name: true, slug: true } },
      },
    })

    if (!user) {
      return NextResponse.json({
        status: "NO_USER",
        userCount,
        message: "Demo user not found in database",
      })
    }

    // 3. Test bcrypt
    const testHash = await bcrypt.hash("demo123", 10)
    const compareResult = await bcrypt.compare("demo123", user.password || "")
    const compareTestHash = await bcrypt.compare("demo123", testHash)

    return NextResponse.json({
      status: "OK",
      userCount,
      demoUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        passwordPrefix: user.password?.substring(0, 10) + "...",
        businessId: user.businessId,
        businessName: user.business?.name,
        businessSlug: user.business?.slug,
      },
      bcrypt: {
        compareWithStoredHash: compareResult,
        compareWithFreshHash: compareTestHash,
        storedHashAlgo: user.password?.substring(0, 4),
        freshHashAlgo: testHash.substring(0, 4),
      },
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
        nextauthUrl: process.env.NEXTAUTH_URL || "(not set)",
        vercelUrl: process.env.VERCEL_URL || "(not set)",
      },
    })
  } catch (err: any) {
    return NextResponse.json({
      status: "ERROR",
      message: err.message,
      stack: err.stack?.split("\n").slice(0, 5),
    }, { status: 500 })
  }
}
