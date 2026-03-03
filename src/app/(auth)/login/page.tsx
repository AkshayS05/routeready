"use client"
// app/(auth)/login/page.tsx

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Zap, Mail, Chrome, Loader2 } from "lucide-react"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [loading, setLoading] = useState<"google" | "email" | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (session) router.push("/dashboard")
  }, [session, router])

  async function handleGoogle() {
    setLoading("google")
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading("email")
    await signIn("email", { email, redirect: false, callbackUrl: "/dashboard" })
    setEmailSent(true)
    setLoading(null)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-xl mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">RouteReady</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          {emailSent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-white font-medium">Check your email</p>
              <p className="text-gray-400 text-sm mt-1">We sent a sign-in link to <strong>{email}</strong></p>
            </div>
          ) : (
            <>
              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {loading === "google" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Chrome className="w-4 h-4" />
                )}
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">or</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>

              {/* Email magic link */}
              <form onSubmit={handleEmail} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={!!loading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading === "email" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send magic link
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          RouteReady · Food Distribution Operations
        </p>
      </div>
    </div>
  )
}
