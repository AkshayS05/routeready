"use client"
// components/layout/Sidebar.tsx

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Truck,
  Package,
  Route,
  Settings,
  LogOut,
  ChevronRight,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/dashboard/drivers", label: "Drivers", icon: Truck },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/routes", label: "Routes", icon: Route },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">RouteReady</span>
        </div>
        {session?.user?.businessName && (
          <p className="text-xs text-gray-500 mt-1 ml-9 truncate">{session.user.businessName}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-emerald-400" : "text-gray-500 group-hover:text-gray-300")} />
              {label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-emerald-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800 space-y-0.5">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
          <Settings className="w-4 h-4 text-gray-500" />
          Settings
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
