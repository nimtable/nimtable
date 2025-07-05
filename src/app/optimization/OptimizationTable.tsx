"use client"

import {
  ArrowUpDown,
  Check,
  GitCompare,
  MoreHorizontal,
  X,
  Calendar,
} from "lucide-react"
import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OptimizeSheet } from "@/components/table/optimize-sheet"
import { ScheduleSheet } from "@/components/table/schedule-sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
type Table = {
  id: string
  name: string
  catalog: string
  namespace: string
  needsCompaction: boolean
  dataFiles: number
  avgFileSize: string
}

type OptimizationTableProps = {
  tables: Table[]
  loading: boolean
}

export function OptimizationTable({ tables, loading }: OptimizationTableProps) {
  const router = useRouter()
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Table | null
    direction: "ascending" | "descending"
  }>({
    key: null,
    direction: "ascending",
  })

  const [showOptimizeSheet, setShowOptimizeSheet] = useState(false)
  const [showScheduleSheet, setShowScheduleSheet] = useState(false)

  const [selectedCompactTable, setSelectedCompactTable] =
    useState<Table | null>(null)

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

  // Handle optimization action
  const handleOptimize = (tableId: string) => {
    const table = tables.find((table) => table.id === tableId)
    if (table) {
      setSelectedCompactTable(table)
      setShowOptimizeSheet(true)
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <div
                  className="flex cursor-pointer items-center gap-1"
                  onClick={() => requestSort("name")}
                >
                  Table Name
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <div
                  className="flex cursor-pointer items-center gap-1"
                  onClick={() => requestSort("needsCompaction")}
                >
                  Needs Compaction
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                <div
                  className="flex cursor-pointer items-center gap-1"
                  onClick={() => requestSort("dataFiles")}
                >
                  Data Files
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Avg File Size
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sortedTables.map((table) => (
              <tr key={table.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-3 py-4">
                  <div className="font-medium text-gray-900">{table.name}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4">
                  {table.needsCompaction ? (
                    <Badge
                      variant="outline"
                      className="border-amber-200 bg-amber-100 text-amber-800"
                    >
                      <Check className="mr-1 h-3 w-3" /> Yes
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-100 text-green-800"
                    >
                      <X className="mr-1 h-3 w-3" /> No
                    </Badge>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div
                    className={
                      table.dataFiles > 1000
                        ? "font-medium text-amber-600"
                        : "text-gray-500"
                    }
                  >
                    {table.dataFiles.toLocaleString()}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {table.avgFileSize}
                </td>

                <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => {
                        const selectedTable = tables.find(
                          (t) => t.id === table.id
                        )
                        if (selectedTable) {
                          setSelectedCompactTable(selectedTable)
                          setShowScheduleSheet(true)
                        }
                      }}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Schedule
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
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(
                              `/data/tables/table?catalog=${table.catalog}&namespace=${table.namespace}&table=${table.name}`
                            )
                          }}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(
                              `/data/tables/table?catalog=${table.catalog}&namespace=${table.namespace}&table=${table.name}&tab=snapshots`
                            )
                          }}
                        >
                          View History
                        </DropdownMenuItem>
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
        <div className="py-8 text-center text-gray-500">
          No tables match the current filters
        </div>
      )}

      {selectedCompactTable && (
        <>
          <OptimizeSheet
            open={showOptimizeSheet}
            onOpenChange={setShowOptimizeSheet}
            catalog={selectedCompactTable?.catalog}
            namespace={selectedCompactTable?.namespace}
            table={selectedCompactTable?.name}
          />
          <ScheduleSheet
            open={showScheduleSheet}
            onOpenChange={setShowScheduleSheet}
            catalog={selectedCompactTable?.catalog}
            namespace={selectedCompactTable?.namespace}
            table={selectedCompactTable?.name}
          />
        </>
      )}
    </div>
  )
}
