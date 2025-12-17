"use client"

import { getOptimizationRecommendation } from "@/components/table/file-distribution"
import { OptimizationFilters } from "./OptimizationFilters"
import { OptimizationTable } from "./OptimizationTable"
import { useAllTables } from "../data/hooks/useTables"
import { useState } from "react"
import { Database } from "lucide-react"

export default function OptimizationPage() {
  const { tables, isLoading, isFileDistributionLoading } = useAllTables()

  const [optimizationStatus, setOptimizationStatus] = useState<
    "all" | "needs_optimization" | "optimized"
  >("all")
  const [fileCount, setFileCount] = useState<"all" | "high" | "medium" | "low">(
    "all"
  )

  const formattedTables = tables
    .map((table) => {
      if (table) {
        const recommendation = getOptimizationRecommendation(table)
        return {
          id: `${table.catalog}.${table.namespace}.${table.table}`,
          name: table.table,
          catalog: table.catalog,
          namespace: table.namespace,
          needsOptimization: recommendation.shouldOptimize,
          dataFiles: table.dataFileCount,
          avgFileSize: `${(table.dataFileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`,
        }
      }
      return null
    })
    .filter((item) => {
      if (!item) return false
      if (
        optimizationStatus === "needs_optimization" &&
        !item.needsOptimization
      ) {
        return false
      }
      if (optimizationStatus === "optimized" && item.needsOptimization) {
        return false
      }
      if (fileCount === "high" && item.dataFiles < 1000) {
        return false
      }
      if (fileCount === "medium" && item.dataFiles < 500) {
        return false
      }
      if (fileCount === "low" && item.dataFiles >= 500) {
        return false
      }
      return item
    })
    .filter((item) => item !== null)
    .sort((a, b) => {
      // Priority sort: tables needing optimization first
      if (a.needsOptimization && !b.needsOptimization) {
        return -1
      }
      if (!a.needsOptimization && b.needsOptimization) {
        return 1
      }
      // If both have same optimization status, sort by table name
      return a.name.localeCompare(b.name)
    })

  // if (isLoading || isFileDistributionLoading) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
  //     </div>
  //   )
  // }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Search and filters bar */}
      <div className="bg-card border-b border-border px-6 py-4">
        <OptimizationFilters
          optimizationStatus={optimizationStatus}
          setOptimizationStatus={setOptimizationStatus}
          fileCount={fileCount}
          setFileCount={setFileCount}
        />
      </div>

      {/* Tables */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-card-foreground" />
            <h2 className="text-m font-normal text-card-foreground">
              Tables ({formattedTables.length})
            </h2>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <OptimizationTable
            tables={formattedTables}
            loading={isLoading || isFileDistributionLoading}
          />
        </div>
      </div>
    </div>
  )
}
