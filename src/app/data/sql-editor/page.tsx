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

import {
  Play,
  Download,
  Copy,
  Check,
  Clock,
  AlertCircle,
  Database,
  TableIcon,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SqlEditorNavbar } from "@/components/shared/sql-editor-navbar"
import { createColumns } from "@/components/query/columns"
import { DataTable } from "@/components/query/data-table"
import { highlightSQL } from "@/lib/sql-highlighter"
import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { runQuery } from "@/lib/data-loader"
import { errorToString } from "@/lib/utils"

export default function SQLEditorPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const catalogParam = searchParams.get("catalog")
  const namespaceParam = searchParams.get("namespace")
  const tableParam = searchParams.get("table")
  const initialQueryParam = searchParams.get("initialQuery")

  // Generate initial query based on available parameters
  const initialQuery = () => {
    if (initialQueryParam) {
      return decodeURIComponent(initialQueryParam)
    }
    if (catalogParam && namespaceParam && tableParam) {
      return `SELECT * FROM \`${catalogParam}\`.\`${namespaceParam}\`.\`${tableParam}\` LIMIT 100`
    } else if (catalogParam && namespaceParam) {
      return `SELECT * FROM \`${catalogParam}\`.\`${namespaceParam}\`.table_name LIMIT 100`
    } else if (catalogParam) {
      return `SELECT * FROM \`${catalogParam}\`.namespace.table_name LIMIT 100`
    } else {
      return `SELECT * FROM catalog.namespace.table_name LIMIT 100`
    }
  }

  const [query, setQuery] = useState(initialQuery)
  const [queryResults, setQueryResults] = useState<{
    columns: string[]
    rows: any[][]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const [isCopying, setIsCopying] = useState(false)
  const [highlightedCode, setHighlightedCode] = useState<string>("")
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const highlightedCodeRef = useRef<HTMLDivElement>(null)

  // Update highlighted code when query changes
  useEffect(() => {
    try {
      const highlighted = highlightSQL(query)
      setHighlightedCode(highlighted)
    } catch (error) {
      console.error("SQL highlighting error:", error)
      // Fallback to plain text if highlighting fails
      setHighlightedCode(
        `<pre>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`
      )
    }
  }, [query])

  // Sync scrolling between textarea and highlighted code
  useEffect(() => {
    const textarea = editorRef.current
    const highlightedCode = highlightedCodeRef.current

    if (!textarea || !highlightedCode) return

    const syncScroll = () => {
      highlightedCode.scrollTop = textarea.scrollTop
      highlightedCode.scrollLeft = textarea.scrollLeft
    }

    textarea.addEventListener("scroll", syncScroll)
    return () => textarea.removeEventListener("scroll", syncScroll)
  }, [])

  const handleRunQuery = async () => {
    try {
      setIsLoading(true)
      setQueryError(null)
      setQueryResults(null)
      setExecutionTime(null)

      const startTime = performance.now()
      const result = await runQuery(query)
      const endTime = performance.now()
      setExecutionTime(endTime - startTime)

      if (result.error) {
        setQueryError(result.error)
      } else {
        setQueryResults(result)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to execute query",
        description: errorToString(error),
      })
      setQueryError(errorToString(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyQuery = async () => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      toast({
        variant: "destructive",
        title: "Clipboard API is not enabled in your browser",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(query)
      setIsCopying(true)
      toast({ title: "Query copied to clipboard" })
      setTimeout(() => setIsCopying(false), 2000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy query",
        description: errorToString(error),
      })
    }
  }

  const handleDownloadResults = () => {
    if (!queryResults) return

    // Create CSV content
    const headers = queryResults.columns.join(",")
    const rows = queryResults.rows
      .map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" ? `"${cell.replace(/"/g, '""')}"` : cell
          )
          .join(",")
      )
      .join("\n")
    const csvContent = `${headers}\n${rows}`

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background h-full">
      <SqlEditorNavbar />

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl">
          {/* SQL Editor Card */}
          <Card className="mb-6 overflow-hidden border-border shadow-sm">
            {/* Editor Toolbar */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border bg-card px-4 py-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-card-foreground">
                <Database className="h-4 w-4 text-primary" />
                SQL Statement
              </CardTitle>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleRunQuery}
                      disabled={isLoading}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Play className="mr-1 h-3.5 w-3.5" />
                      Run Query
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Execute SQL query (Ctrl+Enter)
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleCopyQuery}
                      variant="outline"
                      size="sm"
                      className="border-input bg-card text-card-foreground hover:!text-card-foreground hover:bg-muted/50"
                    >
                      {isCopying ? (
                        <Check className="mr-1 h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="mr-1 h-3.5 w-3.5 text-primary" />
                      )}
                      Copy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy SQL query</TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>

            {/* SQL Editor with Syntax Highlighting */}
            <CardContent className="p-0">
              <div className="relative">
                <div className="sql-editor-container relative h-64 overflow-auto">
                  {/* Highlighted code display */}
                  <div
                    ref={highlightedCodeRef}
                    className="sql-editor-container pointer-events-none absolute inset-0 whitespace-pre-wrap break-words p-4 font-mono text-sm"
                    dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    aria-hidden="true"
                  ></div>

                  {/* Actual textarea for editing */}
                  <textarea
                    ref={editorRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                    }}
                    className="absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-4 font-mono text-sm text-transparent caret-foreground focus:outline-none [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2"
                    placeholder="Enter your SQL query here..."
                    spellCheck="false"
                    onKeyDown={(e) => {
                      // Add Ctrl+Enter shortcut to run query
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        handleRunQuery()
                      }
                    }}
                    onScroll={(e) => {
                      if (highlightedCodeRef.current) {
                        highlightedCodeRef.current.scrollTop =
                          e.currentTarget.scrollTop
                        highlightedCodeRef.current.scrollLeft =
                          e.currentTarget.scrollLeft
                      }
                    }}
                  />
                </div>
                <div className="absolute bottom-2 right-2 rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground">
                  Press Ctrl+Enter to run
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Area */}
          <Card className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-card-foreground">
                  <TableIcon className="h-4 w-4 text-primary" />
                  Query Results
                </CardTitle>

                {isLoading && (
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-sm text-muted-foreground">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                    <span>Running query...</span>
                  </div>
                )}

                {executionTime !== null && !isLoading && !queryError && (
                  <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-1 text-sm text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{(executionTime / 1000).toFixed(2)}s</span>
                  </div>
                )}

                {queryError && (
                  <div className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1 text-sm text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Query failed</span>
                  </div>
                )}
              </div>

              {queryResults && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadResults}
                  className="border-input bg-card text-card-foreground hover:!text-card-foreground hover:bg-muted/50"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Export CSV
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4">
              {/* Results or Error */}
              {queryError ? (
                <div className="overflow-hidden rounded-md border border-destructive/30">
                  <div className="border-b border-destructive/30 bg-destructive/5 px-4 py-2">
                    <h4 className="flex items-center gap-1.5 font-medium text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Error executing query
                    </h4>
                  </div>
                  <div className="p-4">
                    <pre className="whitespace-pre-wrap rounded-md bg-destructive/5 p-3 font-mono text-sm text-destructive/90">
                      {queryError}
                    </pre>
                  </div>
                </div>
              ) : queryResults ? (
                <div className="overflow-hidden bg-background">
                  <DataTable
                    columns={createColumns(queryResults.columns)}
                    data={queryResults.rows.map((row) => {
                      const obj: { [key: string]: any } = {}
                      queryResults.columns.forEach((col, idx) => {
                        obj[col] = row[idx]
                      })
                      return obj
                    })}
                    searchable={true}
                    searchColumn={queryResults.columns[0]}
                  />
                </div>
              ) : (
                <div className="bg-background p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/30">
                      <TableIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="mb-1 text-sm font-medium">
                      No query results to display
                    </p>
                    <p className="max-w-md text-xs">
                      Run a query using the editor above to see results here.
                      You can use the &quot;Run Query&quot; button or press
                      Ctrl+Enter.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
