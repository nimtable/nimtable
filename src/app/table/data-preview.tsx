/*
 * Copyright 2026 Nimtable
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

import { useState } from "react"
import {
  Database,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TableIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/query/data-table"
import { createColumns } from "@/components/query/columns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchSampleData, FetchSampleDataResult } from "@/lib/data-loader"
import { useQuery } from "@tanstack/react-query"
import { errorToString } from "@/lib/utils"

interface DataPreviewProps {
  catalog: string
  namespace: string
  table: string
}

export function DataPreview({ catalog, namespace, table }: DataPreviewProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { data, error, isPending, refetch } = useQuery<FetchSampleDataResult>({
    queryKey: ["table-data-preview", catalog, namespace, table, page, pageSize],
    queryFn: async () => {
      return await fetchSampleData(catalog, namespace, table, {
        page,
        pageSize,
      })
    },
  })

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setPage(1) // Reset to first page when changing page size
  }

  return (
    <div className="space-y-6">
      <Card className="border-muted/70 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-primary" />
            Sample Data
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isPending}
                className="gap-1.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {/* Results or Error */}
          {isPending ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-blue-500"></div>
                <p className="text-sm text-muted-foreground">
                  Loading sample data...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4 max-w-md text-center">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-sm font-medium">
                    Failed to load data preview
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {errorToString(error)}
                  </p>
                </div>
              </div>
            </div>
          ) : data && data.columns.length > 0 ? (
            <div className="p-4">
              <DataTable
                columns={createColumns(data.columns)}
                data={data.rows.map((row) => {
                  const obj: Record<string, any> = {}
                  data.columns.forEach((col, idx) => {
                    obj[col] = row[idx]
                  })
                  return obj
                })}
                searchable={true}
                searchColumn={data.columns[0]}
              />

              {/* Custom Pagination Controls */}
              <div className="flex items-center justify-between space-x-2 py-4 mt-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, data.totalRows)} of{" "}
                  {data.totalRows} rows
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={`${pageSize}`}
                      onValueChange={handlePageSizeChange}
                    >
                      <SelectTrigger className="h-8 w-[70px] bg-muted/30 border-muted-foreground/20">
                        <SelectValue placeholder={pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[5, 10, 20, 50, 100].map((size) => (
                          <SelectItem key={size} value={`${size}`}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex w-[120px] items-center justify-center text-sm font-medium">
                    Page {page} of {data.totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex items-center justify-center bg-muted/30 border-muted-foreground/20"
                      onClick={() => handlePageChange(1)}
                      disabled={page === 1}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 flex items-center justify-center bg-muted/30 border-muted-foreground/20"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0 flex items-center justify-center bg-muted/30 border-muted-foreground/20"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === data.totalPages}
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex items-center justify-center bg-muted/30 border-muted-foreground/20"
                      onClick={() => handlePageChange(data.totalPages)}
                      disabled={page === data.totalPages}
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center gap-4 max-w-md text-center">
                <Database className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">No data available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This table appears to be empty or data cannot be previewed
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
