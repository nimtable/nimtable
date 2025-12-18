"use client"

import { ArrowUpDown, Check, GitCompare, MoreHorizontal, X } from "lucide-react"
import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { OptimizeSheet } from "@/components/table/optimize-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from "next/navigation"
type Table = {
  id: string
  name: string
  catalog: string
  namespace: string
  needsOptimization: boolean
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

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <table className="w-full min-w-[800px]">
          <thead className="bg-table-header border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Table Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Needs Optimization
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Data Files
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Avg File Size
              </th>
              <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {[1, 2, 3, 4, 5].map((index) => (
              <tr key={index} className="hover:bg-table-row-hover">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-5 w-16" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : tables.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          No tables match the current filters
        </div>
      ) : (
        <table className="w-full min-w-[800px]">
          <thead className="bg-table-header border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                <div
                  className="flex cursor-pointer items-center gap-1 hover:text-card-foreground transition-colors"
                  onClick={() => requestSort("name")}
                >
                  Table Name
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                <div
                  className="flex cursor-pointer items-center gap-1 hover:text-card-foreground transition-colors"
                  onClick={() => requestSort("needsOptimization")}
                >
                  Needs Optimization
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                <div
                  className="flex cursor-pointer items-center gap-1 hover:text-card-foreground transition-colors"
                  onClick={() => requestSort("dataFiles")}
                >
                  Data Files
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Avg File Size
              </th>
              <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {sortedTables.map((table) => (
              <tr
                key={table.id}
                className="group hover:bg-table-row-hover transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-normal text-card-foreground">
                    {table.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {table.catalog}.{table.namespace}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {table.needsOptimization ? (
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm ${
                      table.dataFiles > 1000
                        ? "font-medium text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {table.dataFiles.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {table.avgFileSize}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => handleOptimize(table.id)}
                      disabled={!table.needsOptimization}
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                      Optimize
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
      )}

      {selectedCompactTable && (
        <OptimizeSheet
          open={showOptimizeSheet}
          onOpenChange={setShowOptimizeSheet}
          catalog={selectedCompactTable?.catalog}
          namespace={selectedCompactTable?.namespace}
          table={selectedCompactTable?.name}
        />
      )}
    </div>
  )
}
