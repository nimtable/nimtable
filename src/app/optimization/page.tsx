"use client"

import { useState } from "react"

import { OptimizationFilters } from "./OptimizationFilters"
import { OptimizationMetrics } from "./OptimizationMetrics"
import { OptimizationTable } from "./OptimizationTable"

// Mock data for optimization metrics
const optimizationMetrics = {
  tablesNeedingCompaction: {
    value: 37,
    change: "+5",
    changeType: "negative",
  },
  coldDataNotTiered: {
    value: "1.2 TB",
    change: "-300 GB",
    changeType: "positive",
  },
  estimatedStorageSaved: {
    value: "450 GB",
    change: "+120 GB",
    changeType: "positive",
  },
  queryScanTimeReduction: {
    value: "32%",
    change: "+8%",
    changeType: "positive",
  },
}

// Mock data for tables needing optimization
const initialTables = [
  {
    id: "1",
    name: "customer_orders",
    needsCompaction: true,
    dataFiles: 1245,
    avgFileSize: "4.2 MB",
    partitionSkew: true,
    lastOptimized: "30 days ago",
  },
  {
    id: "2",
    name: "product_inventory",
    needsCompaction: true,
    dataFiles: 876,
    avgFileSize: "3.8 MB",
    partitionSkew: false,
    lastOptimized: "14 days ago",
  },
  {
    id: "3",
    name: "user_events",
    needsCompaction: true,
    dataFiles: 3254,
    avgFileSize: "2.1 MB",
    partitionSkew: true,
    lastOptimized: "45 days ago",
  },
  {
    id: "4",
    name: "transaction_history",
    needsCompaction: false,
    dataFiles: 432,
    avgFileSize: "18.5 MB",
    partitionSkew: false,
    lastOptimized: "2 days ago",
  },
  {
    id: "5",
    name: "marketing_campaigns",
    needsCompaction: true,
    dataFiles: 765,
    avgFileSize: "5.3 MB",
    partitionSkew: false,
    lastOptimized: "21 days ago",
  },
  {
    id: "6",
    name: "website_analytics",
    needsCompaction: false,
    dataFiles: 543,
    avgFileSize: "12.8 MB",
    partitionSkew: true,
    lastOptimized: "7 days ago",
  },
  {
    id: "7",
    name: "inventory_snapshots",
    needsCompaction: true,
    dataFiles: 1876,
    avgFileSize: "3.2 MB",
    partitionSkew: false,
    lastOptimized: "28 days ago",
  },
  {
    id: "8",
    name: "customer_support_tickets",
    needsCompaction: true,
    dataFiles: 654,
    avgFileSize: "4.7 MB",
    partitionSkew: true,
    lastOptimized: "18 days ago",
  },
  {
    id: "9",
    name: "product_reviews",
    needsCompaction: false,
    dataFiles: 321,
    avgFileSize: "15.3 MB",
    partitionSkew: false,
    lastOptimized: "5 days ago",
  },
  {
    id: "10",
    name: "shipping_logistics",
    needsCompaction: true,
    dataFiles: 987,
    avgFileSize: "4.1 MB",
    partitionSkew: true,
    lastOptimized: "25 days ago",
  },
]

export default function OptimizationPage() {
  const [tables, setTables] = useState(initialTables)
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [filters, setFilters] = useState({
    compactionStatus: "all",
    partitionSkew: "all",
    fileCount: "all",
    optimizationAge: "all",
  })

  // Filter tables based on selected filters
  const filteredTables = tables.filter((table) => {
    // Filter by compaction status
    if (filters.compactionStatus !== "all") {
      const needsCompaction = filters.compactionStatus === "needs_compaction"
      if (table.needsCompaction !== needsCompaction) return false
    }

    // Filter by partition skew
    if (filters.partitionSkew !== "all") {
      const hasSkew = filters.partitionSkew === "has_skew"
      if (table.partitionSkew !== hasSkew) return false
    }

    // Filter by file count
    if (filters.fileCount !== "all") {
      const fileCount = table.dataFiles
      if (filters.fileCount === "high" && fileCount < 1000) return false
      if (
        filters.fileCount === "medium" &&
        (fileCount < 500 || fileCount >= 1000)
      )
        return false
      if (filters.fileCount === "low" && fileCount >= 500) return false
    }

    // Filter by optimization age
    if (filters.optimizationAge !== "all") {
      const daysAgo = Number.parseInt(table.lastOptimized)
      if (filters.optimizationAge === "old" && daysAgo < 20) return false
      if (filters.optimizationAge === "recent" && daysAgo >= 20) return false
    }

    return true
  })

  // Handle batch optimization
  const handleBatchOptimize = () => {
    // In a real app, this would trigger optimization jobs for selected tables
    console.log("Optimizing tables:", selectedTables)

    // Update the mock data to simulate optimization
    const updatedTables = tables.map((table) => {
      if (selectedTables.includes(table.id)) {
        return {
          ...table,
          needsCompaction: false,
          lastOptimized: "Just now",
        }
      }
      return table
    })

    setTables(updatedTables)
    setSelectedTables([])
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-6 py-8">
      <h1 className="text-3xl font-semibold mb-2">Optimization</h1>
      <p className="text-gray-500 mb-8">
        Identify and fix performance and cost inefficiencies across your tables
      </p>

      <OptimizationMetrics metrics={optimizationMetrics} />

      <div className="mt-8">
        <OptimizationFilters
          filters={filters}
          setFilters={setFilters}
          selectedCount={selectedTables.length}
          onBatchOptimize={handleBatchOptimize}
        />

        <div className="mt-4">
          <OptimizationTable
            tables={filteredTables}
            selectedTables={selectedTables}
            setSelectedTables={setSelectedTables}
          />
        </div>
      </div>
    </div>
  )
}
