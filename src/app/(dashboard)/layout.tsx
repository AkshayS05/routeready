// app/(dashboard)/layout.tsx
// Shared layout for all dashboard pages
// The (dashboard) folder grouping means this layout doesn't add a route segment

import { redirect } from "next/navigation"
import { getAppSession } from "@/lib/auth"
import { Sidebar } from "@/components/layout/Sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getAppSession()

  // Server-side auth check (belt and suspenders alongside middleware)
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
