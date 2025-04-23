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

import { useState, useRef, useEffect } from "react"
import { Play, Download, Copy, Check, Clock, AlertCircle, Database, TableIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { DataTable } from "@/components/query/data-table"
import { createColumns } from "@/components/query/columns"
import { runQuery } from "@/lib/data-loader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { highlightSQL } from "@/lib/sql-highlighter"
import { SqlEditorNavbar } from "@/components/shared/sql-editor-navbar"
import { SidebarInset } from "@/components/ui/sidebar"
import { useSearchParams } from "next/navigation"

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
    const [queryResults, setQueryResults] = useState<{ columns: string[]; rows: any[][] } | null>(null)
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
            setHighlightedCode(`<pre>${query.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`)
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
            toast({
                title: "Query copied to clipboard",
            })
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
            .map((row) => row.map((cell) => (typeof cell === "string" ? `"${cell.replace(/"/g, '""')}"` : cell)).join(","))
            .join("\n")
        const csvContent = `${headers}\n${rows}`

        // Create download link
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <SidebarInset className="bg-muted/5">
            <div className="flex flex-col h-full">
                <SqlEditorNavbar />

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold">Compose Query</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Write and execute SQL statements against your data catalogs
                            </p>
                        </div>

                        {/* SQL Editor Card */}
                        <Card className="border-muted/70 shadow-sm overflow-hidden mb-6">
                            {/* Editor Toolbar */}
                            <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 py-3 flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-base font-medium flex items-center gap-2">
                                    <Database className="h-4 w-4 text-blue-500" />
                                    SQL Statement
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={handleRunQuery}
                                                    disabled={isLoading}
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                >
                                                    <Play className="mr-1 h-3.5 w-3.5" />
                                                    Run Query
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Execute SQL query (Ctrl+Enter)</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    onClick={handleCopyQuery}
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-muted-foreground/20"
                                                >
                                                    {isCopying ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
                                                    Copy
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy query to clipboard</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            </CardHeader>

                            {/* SQL Editor with Syntax Highlighting */}
                            <CardContent className="p-0">
                                <div className="relative">
                                    <div className="sql-editor-container relative h-64 overflow-auto">
                                        {/* Highlighted code display */}
                                        <div
                                            ref={highlightedCodeRef}
                                            className="absolute inset-0 p-4 font-mono text-sm pointer-events-none whitespace-pre-wrap break-words sql-editor-container"
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
                                            className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-transparent resize-none border-0 focus:outline-none caret-foreground text-transparent [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full"
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
                                                    highlightedCodeRef.current.scrollTop = e.currentTarget.scrollTop
                                                    highlightedCodeRef.current.scrollLeft = e.currentTarget.scrollLeft
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                                        Press Ctrl+Enter to run
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Results Area */}
                        <Card className="border-muted/70 shadow-sm">
                            <CardHeader className="bg-muted/30 border-b border-muted/50 px-4 py-3 flex flex-row items-center justify-between space-y-0">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-base font-medium flex items-center gap-2">
                                        <TableIcon className="h-4 w-4 text-blue-500" />
                                        Query Results
                                    </CardTitle>

                                    {isLoading && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            <span>Running query...</span>
                                        </div>
                                    )}

                                    {executionTime !== null && !isLoading && !queryError && (
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{(executionTime / 1000).toFixed(2)}s</span>
                                        </div>
                                    )}

                                    {queryError && (
                                        <div className="flex items-center gap-1.5 text-sm text-destructive bg-destructive/10 px-2.5 py-1 rounded-md">
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
                                        className="border-muted-foreground/20 bg-muted/30 hover:bg-muted/50"
                                    >
                                        <Download className="mr-1.5 h-3.5 w-3.5" />
                                        Export CSV
                                    </Button>
                                )}
                            </CardHeader>

                            <CardContent className="p-4">
                                {/* Results or Error */}
                                {queryError ? (
                                    <div className="border border-destructive/30 rounded-md overflow-hidden">
                                        <div className="bg-destructive/5 px-4 py-2 border-b border-destructive/30">
                                            <h4 className="font-medium text-destructive flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4" />
                                                Error executing query
                                            </h4>
                                        </div>
                                        <div className="p-4">
                                            <pre className="bg-destructive/5 p-3 rounded-md text-sm font-mono text-destructive/90 whitespace-pre-wrap">
                                                {queryError}
                                            </pre>
                                        </div>
                                    </div>
                                ) : queryResults ? (
                                    <div className="bg-background overflow-hidden">
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
                                            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                                <TableIcon className="h-8 w-8 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-sm font-medium mb-1">No query results to display</p>
                                            <p className="text-xs max-w-md">
                                                Run a query using the editor above to see results here. You can use the &quot;Run Query&quot;
                                                button or press Ctrl+Enter.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}
