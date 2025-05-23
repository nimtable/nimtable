"use client"

import { Filter } from "lucide-react"

type FiltersProps = {
  compactionStatus: "all" | "needs_compaction" | "optimized"
  setCompactionStatus: (
    status: "all" | "needs_compaction" | "optimized"
  ) => void
  fileCount: "all" | "high" | "medium" | "low"
  setFileCount: (count: "all" | "high" | "medium" | "low") => void
}

export function OptimizationFilters({
  compactionStatus,
  setCompactionStatus,
  fileCount,
  setFileCount,
}: FiltersProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-lg border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={compactionStatus}
          onChange={(e) =>
            setCompactionStatus(
              e.target.value as "all" | "needs_compaction" | "optimized"
            )
          }
          className="h-8 rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Compaction Status</option>
          <option value="needs_compaction">Needs Compaction</option>
          <option value="optimized">Optimized</option>
        </select>

        <select
          value={fileCount}
          onChange={(e) =>
            setFileCount(e.target.value as "all" | "high" | "medium" | "low")
          }
          className="h-8 rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All File Counts</option>
          <option value="high">High (1000+)</option>
          <option value="medium">Medium (500-999)</option>
          <option value="low">Low (&lt; 500)</option>
        </select>
      </div>
    </div>
  )
}
