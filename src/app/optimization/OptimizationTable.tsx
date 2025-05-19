"use client"

import { useState } from "react"
import {
  ArrowUpDown,
  Check,
  GitCompare,
  LayoutGrid,
  MoreHorizontal,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Table = {
  id: string
  name: string
  needsCompaction: boolean
  dataFiles: number
  avgFileSize: string
  partitionSkew: boolean
  lastOptimized: string
}

type OptimizationTableProps = {
  tables: Table[]
  selectedTables: string[]
  setSelectedTables: (selected: string[]) => void
}

export function OptimizationTable({
  tables,
  selectedTables,
  setSelectedTables,
}: OptimizationTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Table | null
    direction: "ascending" | "descending"
  }>({
    key: null,
    direction: "ascending",
  })

  // Handle sorting
  const requestSort = (key: keyof Table) => {
    let direction: "ascending" | "descending" = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Apply sorting to tables
  const sortedTables = [...tables].sort((a, b) => {
    if (sortConfig.key === null) {
      return 0
    }

    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (typeof aValue === "string" && typeof bValue === "string") {
      // Handle string comparison
      if (sortConfig.direction === "ascending") {
        return aValue.localeCompare(bValue)
      }
      return bValue.localeCompare(aValue)
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      // Handle number comparison
      if (sortConfig.direction === "ascending") {
        return aValue - bValue
      }
      return bValue - aValue
    } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      // Handle boolean comparison
      if (sortConfig.direction === "ascending") {
        return aValue === bValue ? 0 : aValue ? -1 : 1
      }
      return aValue === bValue ? 0 : aValue ? 1 : -1
    }

    return 0
  })

  // Handle checkbox selection
  const toggleSelectAll = () => {
    if (selectedTables.length === tables.length) {
      setSelectedTables([])
    } else {
      setSelectedTables(tables.map((table) => table.id))
    }
  }

  const toggleSelectTable = (tableId: string) => {
    if (selectedTables.includes(tableId)) {
      setSelectedTables(selectedTables.filter((id) => id !== tableId))
    } else {
      setSelectedTables([...selectedTables, tableId])
    }
  }

  // Handle optimization action
  const handleOptimize = (tableId: string) => {
    console.log("Optimizing table:", tableId)
    // In a real app, this would trigger an optimization job
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-3.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    selectedTables.length === tables.length && tables.length > 0
                  }
                  onChange={toggleSelectAll}
                  aria-label="Select all tables"
                />
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  Table Name
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => requestSort("needsCompaction")}
                >
                  Needs Compaction
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => requestSort("dataFiles")}
                >
                  Data Files
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Avg File Size
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => requestSort("partitionSkew")}
                >
                  Partition Skew
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => requestSort("lastOptimized")}
                >
                  Last Optimized
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTables.map((table) => (
              <tr key={table.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedTables.includes(table.id)}
                    onChange={() => toggleSelectTable(table.id)}
                    aria-label={`Select ${table.name}`}
                  />
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{table.name}</div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {table.needsCompaction ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-800 border-amber-200"
                    >
                      <Check className="h-3 w-3 mr-1" /> Yes
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      <X className="h-3 w-3 mr-1" /> No
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <div
                    className={
                      table.dataFiles > 1000
                        ? "text-amber-600 font-medium"
                        : "text-gray-500"
                    }
                  >
                    {table.dataFiles.toLocaleString()}
                  </div>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {table.avgFileSize}
                </td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {table.partitionSkew ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-800 border-amber-200"
                    >
                      <Check className="h-3 w-3 mr-1" /> Yes
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      <X className="h-3 w-3 mr-1" /> No
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                  {table.lastOptimized}
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => handleOptimize(table.id)}
                      disabled={!table.needsCompaction}
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                      Compact
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Optimize Layout
                        </DropdownMenuItem>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tables.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tables match the current filters
        </div>
      )}
    </div>
  )
}
