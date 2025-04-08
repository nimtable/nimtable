/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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

