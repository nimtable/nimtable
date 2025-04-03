"use client"

import { useEffect, useState, useCallback } from "react"
import { TableIcon, FileText, HardDrive, Layers, Search, Database, FolderTree, FileType, Table2 } from "lucide-react"
import { notFound, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { errorToString, cn } from "@/lib/utils"
import { SidebarInset } from "@/components/ui/sidebar"
import { getNamespaceTables } from "@/lib/data-loader"
import type { NamespaceTable } from "@/types/data"
import { TopNavbar } from "@/components/shared/top-navbar"
import { PageLoader } from "@/components/shared/page-loader"

export default function NamespacePage() {
    const searchParams = useSearchParams()
    const catalog = searchParams.get("catalog")
    const namespace = searchParams.get("namespace")
    const router = useRouter()
    const { toast } = useToast()

    const [tables, setTables] = useState<NamespaceTable[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchNamespaceTables = useCallback(
        async (cat: string, ns: string) => {
            setIsLoading(true)
            try {
                const data = await getNamespaceTables(cat, ns)
                setTables(data)
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Failed to load namespace tables",
                    description: errorToString(error),
                })
            } finally {
                setIsLoading(false)
            }
        },
        [toast],
    )

    useEffect(() => {
        if (catalog && namespace) {
            fetchNamespaceTables(catalog, namespace)
        }
    }, [catalog, namespace, fetchNamespaceTables])

    // Ensure we have both catalog and namespace parameters
    if (!catalog || !namespace) {
        return notFound()
    }

    // Filter tables based on search query
    const filteredTables = tables.filter((table) => table.name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <PageLoader icon={TableIcon} title="Loading namespace data" entity={namespace} entityType="Namespace" />
            </div>
        )
    }

    return (
        <SidebarInset className="bg-muted/5">
            <div className="flex flex-col h-full">
                <TopNavbar catalog={catalog} namespace={namespace} />

                <div className="flex-1 overflow-auto">
                    <div className="max-w-6xl mx-auto p-6">
                        {/* Enhanced header section */}
                        <div className="mb-8">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="h-12 w-12 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center shadow-sm">
                                    <FolderTree className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">{namespace}</h1>
                                </div>
                            </div>
                        </div>

                        {/* Tables section with integrated search */}
                        <Card className="border-muted/70 shadow-sm overflow-hidden">
                            <CardHeader className="pb-6 border-b">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Database className="h-6 w-6 text-blue-500" />
                                            Tables
                                        </CardTitle>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1 w-full md:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search tables..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 h-10 bg-muted/30 border-muted-foreground/20"
                                            />
                                        </div>
                                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                                            {filteredTables.length} of {tables.length}
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                {filteredTables.length > 0 ? (
                                    <div className="overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30">
                                                    <TableHead className="font-medium">Table Name</TableHead>
                                                    <TableHead className="font-medium">Format Version</TableHead>
                                                    <TableHead className="font-medium">Total Data Size</TableHead>
                                                    <TableHead className="font-medium">Partitioning Strategy</TableHead>
                                                    <TableHead className="w-[100px] font-medium">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTables.map((table, index) => (
                                                    <TableRow
                                                        key={table.name}
                                                        className={cn(
                                                            "hover:bg-muted/30 transition-colors",
                                                            index < filteredTables.length - 1 ? "border-b border-muted/30" : "",
                                                        )}
                                                    >
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30">
                                                                    <Table2 className="h-3.5 w-3.5 text-blue-500" />
                                                                </div>
                                                                {table.name}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span
                                                                className={cn(
                                                                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit",
                                                                    table.formatVersion === "v2"
                                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
                                                                )}
                                                            >
                                                                <FileType className="h-3 w-3" />
                                                                {table.formatVersion}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                                                                {formatFileSize(table.dataSizeBytes)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                                                {table.partitioning || "None"}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Link
                                                                href={`/table?catalog=${catalog}&namespace=${namespace}&table=${table.name}`}
                                                                className="inline-flex items-center h-8 px-3 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                                                            >
                                                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                                                View
                                                            </Link>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex justify-center items-center py-16">
                                        <div className="text-center max-w-md">
                                            <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                                <Database className="h-8 w-8 text-muted-foreground/70" />
                                            </div>
                                            <h3 className="text-lg font-medium mb-2">No tables found</h3>
                                            <p className="text-muted-foreground text-sm mb-6">
                                                {searchQuery
                                                    ? `No tables matching "${searchQuery}" were found in this namespace.`
                                                    : "This namespace doesn't contain any tables yet."}
                                            </p>
                                            {searchQuery && (
                                                <button
                                                    onClick={() => setSearchQuery("")}
                                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                >
                                                    Clear search
                                                </button>
                                            )}
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
