"use client"

import { Filter, Play } from "lucide-react"

import { Button } from "@/components/ui/button"

type FiltersProps = {
  filters: {
    compactionStatus: string
    partitionSkew: string
    fileCount: string
    optimizationAge: string
  }
  setFilters: (filters: any) => void
  selectedCount: number
  onBatchOptimize: () => void
}

export function OptimizationFilters({
  filters,
  setFilters,
  selectedCount,
  onBatchOptimize,
}: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={filters.compactionStatus}
          onChange={(e) =>
            setFilters({ ...filters, compactionStatus: e.target.value })
          }
          className="h-8 px-3 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Compaction Status</option>
          <option value="needs_compaction">Needs Compaction</option>
          <option value="optimized">Optimized</option>
        </select>

        <select
          value={filters.partitionSkew}
          onChange={(e) =>
            setFilters({ ...filters, partitionSkew: e.target.value })
          }
          className="h-8 px-3 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Partition Skew</option>
          <option value="has_skew">Has Skew</option>
          <option value="no_skew">No Skew</option>
        </select>

        <select
          value={filters.fileCount}
          onChange={(e) =>
            setFilters({ ...filters, fileCount: e.target.value })
          }
          className="h-8 px-3 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All File Counts</option>
          <option value="high">High (1000+)</option>
          <option value="medium">Medium (500-999)</option>
          <option value="low">Low (&lt; 500)</option>
        </select>

        <select
          value={filters.optimizationAge}
          onChange={(e) =>
            setFilters({ ...filters, optimizationAge: e.target.value })
          }
          className="h-8 px-3 py-1 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Ages</option>
          <option value="old">Old (20+ days)</option>
          <option value="recent">Recent (&lt; 20 days)</option>
        </select>
      </div>

      <Button
        className="gap-2"
        disabled={selectedCount === 0}
        onClick={onBatchOptimize}
      >
        <Play className="h-4 w-4" />
        Optimize Selected ({selectedCount})
      </Button>
    </div>
  )
}
