"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Zap, LogIn, Loader2, AlertCircle, UserPlus } from "lucide-react"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (session) router.push("/dashboard")
  }, [session, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError("")

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email || !password) return
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Signup failed")
        setLoading(false)
        return
      }

      // Auto sign-in after signup
      setSuccess("Account created! Signing in...")
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setSuccess("")
        setError("Account created but auto-login failed. Try signing in manually.")
        setMode("login")
        setLoading(false)
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  function fillDemo() {
    setEmail("demo@routeready.app")
    setPassword("demo123")
    setMode("login")
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
          <p className="text-gray-500 text-sm mt-1">Operations platform for small businesses</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => { setMode("login"); setError(""); setSuccess("") }}
              className={`flex-1 text-sm py-2 rounded-md transition-all ${mode === "login" ? "bg-gray-700 text-white font-medium" : "text-gray-400"}`}
            >
              Sign in
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); setSuccess("") }}
              className={`flex-1 text-sm py-2 rounded-md transition-all ${mode === "signup" ? "bg-gray-700 text-white font-medium" : "text-gray-400"}`}
            >
              Sign up
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={mode === "login" ? handleLogin : handleSignup} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Min 6 characters" : "Enter password"}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          {mode === "login" && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-800" />
                <span className="text-xs text-gray-600">demo</span>
                <div className="flex-1 h-px bg-gray-800" />
              </div>
              <button
                onClick={fillDemo}
                className="w-full text-sm text-gray-400 hover:text-emerald-400 py-2 rounded-lg border border-gray-800 hover:border-emerald-500/30 transition-all"
              >
                Use demo account
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          RouteReady · Small Business Operations
        </p>
      </div>
    </div>
  )
}
