"use client"
import { useAllTables } from "../data/hooks/useTables"
import { DistributionData } from "@/lib/data-loader"
import { createContext } from "react"

export const OverviewContext = createContext<{
  tables: (
    | (DistributionData & { table: string; catalog: string; namespace: string })
    | undefined
  )[]
  isLoading: boolean
  isFileDistributionLoading: boolean
  refresh: () => void
}>({
  tables: [],
  isLoading: true,
  isFileDistributionLoading: false,
  refresh: () => {},
})

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { tables, refetchCatalogs, isLoading, isFileDistributionLoading } =
    useAllTables()

  return (
    <OverviewContext.Provider
      value={{
        tables,
        isLoading,
        isFileDistributionLoading,
        refresh: refetchCatalogs,
      }}
    >
      {children}
    </OverviewContext.Provider>
  )
}
