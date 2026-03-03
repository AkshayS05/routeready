// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Providers } from "./providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RouteReady — Food Distribution Operations",
  description: "Manage orders, drivers, routes and inventory for your food distribution business.",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Pass session to providers to avoid an extra network request on the client
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
