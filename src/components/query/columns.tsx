"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"

// Helper function to create columns from an array of column names
export function createColumns(columnNames: string[]): ColumnDef<any>[] {
  return columnNames.map((columnName) => ({
    id: columnName,
    accessorKey: columnName,
    header: columnName,
    cell: ({ row }) => {
      const value = row.getValue(columnName)

      // Handle different value types appropriately
      if (value === null || value === undefined) {
        return <span className="text-muted-foreground italic text-sm">null</span>
      }

      if (typeof value === "boolean") {
        return (
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              value
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            {value ? "true" : "false"}
          </span>
        )
      }

      if (typeof value === "number") {
        return <span className="font-mono text-sm tabular-nums">{value}</span>
      }

      if (
        value instanceof Date ||
        (typeof value === "string" && !isNaN(Date.parse(value)) && value.includes("-") && value.includes(":"))
      ) {
        try {
          const date = value instanceof Date ? value : new Date(value)
          return <span className="text-sm tabular-nums">{date.toLocaleString()}</span>
        } catch (e) {
          return String(value)
        }
      }

      if (typeof value === "object") {
        try {
          return <span className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded">{JSON.stringify(value)}</span>
        } catch (e) {
          return <span className="text-muted-foreground italic text-sm">[Object]</span>
        }
      }

      return String(value)
    },
  }))
}
