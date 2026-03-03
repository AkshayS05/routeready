// app/api/auth/signup/route.ts
// Simple signup — creates a user + business, or joins the demo business

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    // Check if user already exists
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // Use the demo business (or create one if it doesn't exist)
    let business = await db.business.findFirst({ where: { slug: "patel-foods" } })
    if (!business) {
      business = await db.business.create({
        data: {
          name: "Demo Business",
          slug: "demo-biz",
          city: "Brampton",
          province: "ON",
          plan: "PRO",
        },
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "OWNER",
        businessId: business.id,
        emailVerified: new Date(),
      },
    })

    return NextResponse.json(
      { message: "Account created. You can now sign in.", userId: user.id },
      { status: 201 }
    )
  } catch (err: any) {
    console.error("[POST /api/auth/signup]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
