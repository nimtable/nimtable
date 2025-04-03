"use client"

import * as React from "react"

interface RefreshContextType {
  refreshTrigger: number
  refresh: () => void
  isRefreshing: boolean
}

const RefreshContext = React.createContext<RefreshContextType | undefined>(undefined)

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const refresh = React.useCallback(() => {
    setIsRefreshing(true)
    setRefreshTrigger((prev) => prev + 1)

    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false)
    }, 800)
  }, [])

  const value = React.useMemo(
    () => ({
      refreshTrigger,
      refresh,
      isRefreshing,
    }),
    [refreshTrigger, refresh, isRefreshing],
  )

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
}

export function useRefresh() {
  const context = React.useContext(RefreshContext)
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider")
  }
  return context
}

