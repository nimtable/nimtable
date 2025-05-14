"use client"

import "@/lib/service"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "@/lib/service"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

export const ReactQueryProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
