"use client"
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import "@/lib/service"
import { toast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1 * 60 * 1000, // 1 minute
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      const title = query.meta?.errorMessage
      if (!title || typeof title !== "string" || title.trim().length === 0) {
        // Avoid noisy global toasts for background queries (e.g., transient 404s during navigation).
        // Queries that need a user-facing error should set `meta: { errorMessage: "..." }`.
        return
      }
      if (query.state.error) {
        toast({
          variant: "destructive",
          title,
          description: errorToString(error),
        })
      }
    },
  }),
})

export const ReactQueryProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
