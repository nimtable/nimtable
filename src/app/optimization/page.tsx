"use client"

import { getCompactionRecommendation } from "@/components/table/file-distribution"
import { OptimizationFilters } from "./OptimizationFilters"
import { OptimizationTable } from "./OptimizationTable"
import { useAllTables } from "../data/hooks/useTables"
import { useState } from "react"
export default function OptimizationPage() {
  const { tables, isLoading, isFileDistributionLoading } = useAllTables()

  const [compactionStatus, setCompactionStatus] = useState<
    "all" | "needs_compaction" | "optimized"
  >("all")
  const [fileCount, setFileCount] = useState<"all" | "high" | "medium" | "low">(
    "all"
  )

  const formattedTables = tables
    .map((table) => {
      if (table) {
        const recommendation = getCompactionRecommendation(table)
        return {
          id: `${table.catalog}.${table.namespace}.${table.table}`,
          name: table.table,
          catalog: table.catalog,
          namespace: table.namespace,
          needsCompaction: recommendation.shouldCompact,
          dataFiles: table.dataFileCount,
          avgFileSize: `${(table.dataFileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`,
        }
      }
      return null
    })
    .filter((item) => {
      if (!item) return false
      if (compactionStatus === "needs_compaction" && !item.needsCompaction) {
        return false
      }
      if (compactionStatus === "optimized" && item.needsCompaction) {
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
      // Priority sort: tables needing compaction first
      if (a.needsCompaction && !b.needsCompaction) {
        return -1
      }
      if (!a.needsCompaction && b.needsCompaction) {
        return 1
      }
      // If both have same compaction status, sort by table name
      return a.name.localeCompare(b.name)
    })

  console.log("formattedTables", formattedTables)

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <h1 className="mb-2 text-3xl font-semibold">Optimization</h1>
      <p className="mb-8 text-gray-500">
        Identify and fix performance and cost inefficiencies across your tables
      </p>

      <div className="mt-8">
        <OptimizationFilters
          compactionStatus={compactionStatus}
          setCompactionStatus={setCompactionStatus}
          fileCount={fileCount}
          setFileCount={setFileCount}
        />

        <div className="mt-4">
          <OptimizationTable
            tables={formattedTables}
            loading={isFileDistributionLoading || isLoading}
          />
        </div>
      </div>
    </div>
  )
}
