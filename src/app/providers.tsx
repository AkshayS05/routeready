"use client"
// app/providers.tsx
// All client-side providers wrapped in one component
// Keeps layout.tsx clean

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { SessionProvider } from "next-auth/react"
import { useState } from "react"

export function Providers({ children, session }: { children: React.ReactNode; session: any }) {
  // Create QueryClient inside useState to ensure each user gets their own instance
  // Prevents data leakage between users in SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,       // 30 seconds default
            retry: 1,                // only retry once on failure
            refetchOnWindowFocus: true,
          },
          mutations: {
            retry: 0,                // never retry mutations
          },
        },
      })
  )

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </SessionProvider>
  )
}
