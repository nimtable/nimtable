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
}>({
  tables: [],
  isLoading: true,
  isFileDistributionLoading: false,
})

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { tables, isLoading, isFileDistributionLoading } = useAllTables()

  return (
    <OverviewContext.Provider
      value={{
        tables,
        isLoading,
        isFileDistributionLoading,
      }}
    >
      {children}
    </OverviewContext.Provider>
  )
}
