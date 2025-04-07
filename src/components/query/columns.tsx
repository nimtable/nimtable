/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
        } catch {
          return String(value)
        }
      }

      if (typeof value === "object") {
        try {
          return <span className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded">{JSON.stringify(value)}</span>
        } catch {
          return <span className="text-muted-foreground italic text-sm">[Object]</span>
        }
      }

      return String(value)
    },
  }))
}
