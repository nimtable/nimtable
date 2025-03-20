"use client"

import { ColumnDef } from "@tanstack/react-table"

export type QueryResult = {
  [key: string]: any
}

export function createColumns(columns: string[]): ColumnDef<QueryResult>[] {
  return columns.map((column) => ({
    accessorKey: column,
    header: column,
    cell: ({ row }) => {
      const value = row.getValue(column)
      return <div className="font-mono text-sm">{String(value)}</div>
    },
  }))
} 