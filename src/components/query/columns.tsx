"use client"

import { ColumnDef } from "@tanstack/react-table"

export type QueryResult = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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