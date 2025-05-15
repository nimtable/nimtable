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

import { useState } from "react"
import { Database, FileText, Copy, Check, Info, RefreshCw, Layers, Hash, Calendar } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useRefresh } from "@/contexts/refresh-context"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { LoadTableResult, StructField } from "@/lib/data-loader"
import { dropTable, renameTable, getFileDistribution, type DistributionData } from "@/lib/data-loader"
import { cn } from "@/lib/utils"
import { getPropertyDescription } from "@/lib/property-descriptions"
import { FileStatistics } from "@/components/table/file-statistics"
import { FileDistributionLoading } from "@/components/table/file-distribution-loading"
import { useQuery } from "@tanstack/react-query"


interface InfoTabProps {
    tableData: LoadTableResult
    catalog: string
    namespace: string
    table: string
}

// Function to check if a property key contains sensitive information that should be redacted
const isSensitiveProperty = (key: string): boolean => {
    const sensitiveKeys = ["s3.secret-access-key", "s3.access-key-id"]

    return sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))
}

function FileDistributionSection({
    tableId,
    catalog,
    namespace,
}: { tableId: string; catalog: string; namespace: string }) {
    const { data: distribution, isLoading, refetch } = useQuery<DistributionData>({
        queryKey: ["file-distribution", catalog, namespace, tableId],
        queryFn: async () => {
            return await getFileDistribution(catalog, namespace, tableId)
        },

        enabled: !!(tableId && catalog && namespace),
        initialData: {
            ranges: {},
            dataFileCount: 0,
            positionDeleteFileCount: 0,
            eqDeleteFileCount: 0,
            dataFileSizeInBytes: 0,
            positionDeleteFileSizeInBytes: 0,
            eqDeleteFileSizeInBytes: 0,
            dataFileRecordCount: 0,
            positionDeleteFileRecordCount: 0,
            eqDeleteFileRecordCount: 0
        }
    })

    if (isLoading) {
        return <FileDistributionLoading />
    }

    // Sort the distribution data according to our predefined size order
    const sortedDistributionEntries = Object.entries(distribution.ranges).sort((a, b) => {
        const indexA = rangeOrder.indexOf(a[0])
        const indexB = rangeOrder.indexOf(b[0])
        return indexA - indexB
    })

    // Calculate total files
    const totalFiles = Object.values(distribution.ranges).reduce((sum, item) => sum + item.count, 0)

    return (
        <Card className="border-muted/70 shadow-sm h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">File Size Distribution</CardTitle>
                <CardDescription>Current distribution of file sizes in the table</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left section - File Statistics */}
                    <div className="space-y-6">
                        <div className="pt-4">
                            <FileStatistics distribution={distribution} />
                        </div>
                    </div>

                    {/* Right section - Distribution Chart, Total Files and Recommendation */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">Total Files: {totalFiles}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => refetch()}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {sortedDistributionEntries.map(([range, data]) => (
                                <div key={range} className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`h-3 w-3 rounded-full ${range === "0-8M"
                                                    ? "bg-blue-300 dark:bg-blue-400/80"
                                                    : range === "8M-32M"
                                                        ? "bg-blue-400 dark:bg-blue-500/80"
                                                        : range === "32M-128M"
                                                            ? "bg-blue-500"
                                                            : range === "128M-512M"
                                                                ? "bg-blue-600"
                                                                : "bg-blue-700"
                                                    }`}
                                            />
                                            <span className="text-sm font-medium">{range}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {data.count} files ({data.percentage}%)
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-muted/50 rounded-full w-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${range === "0-8M"
                                                ? "bg-blue-300 dark:bg-blue-400/80"
                                                : range === "8M-32M"
                                                    ? "bg-blue-400 dark:bg-blue-500/80"
                                                    : range === "32M-128M"
                                                        ? "bg-blue-500"
                                                        : range === "128M-512M"
                                                            ? "bg-blue-600"
                                                            : "bg-blue-700"
                                                }`}
                                            style={{ width: `${data.percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-muted/50">
                            <div className="text-sm">
                                <p className="mb-2 font-medium text-foreground">Optimization Recommendation:</p>
                                <p className="text-muted-foreground">
                                    This table has {distribution.ranges["0-8M"]?.count || 0} small files that could benefit from compaction.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Define the order of size ranges
const rangeOrder = ["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"]

export function InfoTab({ tableData, catalog, namespace, table }: InfoTabProps) {
    const { toast } = useToast()
    const router = useRouter()
    const { refresh } = useRefresh()
    const [showDropDialog, setShowDropDialog] = useState(false)
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [newTableName, setNewTableName] = useState(table)
    const [copyingField, setCopyingField] = useState<string | null>(null)

    const schema = tableData.metadata.schemas?.find((s) => s["schema-id"] === tableData.metadata["current-schema-id"])

    const handleDropTable = async () => {
        try {
            await dropTable(catalog, namespace, table)
            toast({
                title: "Table dropped successfully",
                description: `Table ${table} has been dropped from namespace ${namespace}`,
            })
            refresh()
            router.push(`/${catalog}/${namespace}`)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to drop table",
                description: errorToString(error),
            })
        }
        setShowDropDialog(false)
    }

    const handleRenameTable = async () => {
        try {
            await renameTable(catalog, namespace, table, newTableName)
            toast({
                title: "Table renamed successfully",
                description: `Table ${table} has been renamed to ${newTableName}`,
            })
            refresh()
            router.push(`/${catalog}/${namespace}/table/${newTableName}`)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to rename table",
                description: errorToString(error),
            })
        }
        setShowRenameDialog(false)
    }

    const copyToClipboard = (text: string, fieldName: string) => {
        setCopyingField(fieldName)
        navigator.clipboard
            .writeText(text)
            .then(() => {
                toast({
                    title: "Copied to clipboard",
                    description: `${fieldName} has been copied to your clipboard.`,
                })

                // Reset the copying state after a short delay
                setTimeout(() => {
                    setCopyingField(null)
                }, 1500)
            })
            .catch((err) => {
                toast({
                    variant: "destructive",
                    title: "Failed to copy",
                    description: "Could not copy to clipboard. " + errorToString(err),
                })
                setCopyingField(null)
            })
    }

    return (
        <div className="space-y-8">
            {/* Table Details */}
            <div className="space-y-6">
                <FileDistributionSection tableId={table} catalog={catalog} namespace={namespace} />

                <Card className="border-muted/70 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b py-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-500" />
                            Table Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 py-2">
                        <div className="divide-y divide-muted/30">
                            <div className="px-6 py-3">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-xs font-medium text-muted-foreground">Table UUID</h4>
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-6 w-6 rounded-md transition-all duration-200",
                                                        copyingField === "Table UUID" ? "bg-muted text-blue-500" : "text-muted-foreground",
                                                    )}
                                                    onClick={() => copyToClipboard(tableData.metadata["table-uuid"], "Table UUID")}
                                                >
                                                    {copyingField === "Table UUID" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                                <p>{copyingField === "Table UUID" ? "Copied!" : "Copy to clipboard"}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="border border-muted/30 rounded-md p-1.5 bg-muted/30 font-mono">
                                    <p className="text-xs text-foreground/90 break-all">{tableData.metadata["table-uuid"]}</p>
                                </div>
                            </div>

                            <div className="px-6 py-3">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-xs font-medium text-muted-foreground">Location</h4>
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-6 w-6 rounded-md transition-all duration-200",
                                                        copyingField === "Location" ? "bg-muted text-blue-500" : "text-muted-foreground",
                                                    )}
                                                    onClick={() => copyToClipboard(tableData.metadata.location || "", "Location")}
                                                >
                                                    {copyingField === "Location" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                                <p>{copyingField === "Location" ? "Copied!" : "Copy to clipboard"}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="border border-muted/30 rounded-md p-1.5 bg-muted/30 font-mono">
                                    <p className="text-xs text-foreground/90 break-all">{tableData.metadata.location}</p>
                                </div>
                            </div>

                            <div className="px-6 py-3">
                                <h4 className="text-xs font-medium text-muted-foreground mb-1">Last Updated</h4>
                                <p className="text-xs pl-1 font-medium">
                                    {tableData.metadata["last-updated-ms"]
                                        ? new Date(tableData.metadata["last-updated-ms"]).toLocaleString()
                                        : "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Schema Section */}
                <Card className="border-muted/70 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Table Schema
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Required</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schema?.fields.map((field: StructField) => (
                                    <TableRow key={field.id}>
                                        <TableCell>{field.id}</TableCell>
                                        <TableCell>{field.name}</TableCell>
                                        <TableCell>{typeof field.type === "string" ? field.type : field.type.type}</TableCell>
                                        <TableCell>{field.required ? "Yes" : "No"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Partition Information */}
                <Card className="border-muted/70 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Partition Specs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Spec ID</TableHead>
                                    <TableHead>Fields</TableHead>
                                    <TableHead>Default</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableData.metadata["partition-specs"] && tableData.metadata["partition-specs"].length > 0 ? (
                                    tableData.metadata["partition-specs"].map((spec) => (
                                        <TableRow key={spec["spec-id"]}>
                                            <TableCell>{spec["spec-id"]}</TableCell>
                                            <TableCell>
                                                {!spec.fields || spec.fields.length === 0 ? (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Layers className="h-3.5 w-3.5" />
                                                        <span>Unpartitioned</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground">Partitioned by:</span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {spec.fields.map((field) => {
                                                                // Determine icon based on transform
                                                                let icon = <Layers className="h-3 w-3" />
                                                                let bgColor = "bg-blue-100 dark:bg-blue-900/30"
                                                                let textColor = "text-blue-800 dark:text-blue-400"

                                                                if (field.transform.includes("bucket")) {
                                                                    icon = <Hash className="h-3 w-3" />
                                                                    bgColor = "bg-purple-100 dark:bg-purple-900/30"
                                                                    textColor = "text-purple-800 dark:text-purple-400"
                                                                } else if (
                                                                    field.transform.includes("year") ||
                                                                    field.transform.includes("month") ||
                                                                    field.transform.includes("day")
                                                                ) {
                                                                    icon = <Calendar className="h-3 w-3" />
                                                                    bgColor = "bg-green-100 dark:bg-green-900/30"
                                                                    textColor = "text-green-800 dark:text-green-400"
                                                                }

                                                                return (
                                                                    <div
                                                                        key={field["source-id"]}
                                                                        className={`${bgColor} ${textColor} px-2 py-1 rounded-md text-xs flex items-center gap-1`}
                                                                    >
                                                                        {icon}
                                                                        <span>{field.name}</span>
                                                                        <span className="opacity-70">({field.transform})</span>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {spec["spec-id"] === tableData.metadata["default-spec-id"] ? (
                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                        Default
                                                    </span>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3}>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Layers className="h-3.5 w-3.5" />
                                                <span>Unpartitioned</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Properties Section */}
            <Card className="border-muted/70 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 border-b py-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        Properties
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-0 py-2">
                    {tableData.metadata.properties && Object.keys(tableData.metadata.properties).length > 0 ? (
                        <div className="divide-y divide-muted/30">
                            {Object.entries(tableData.metadata.properties)
                                .filter(([key]) => !isSensitiveProperty(key)) // Filter out sensitive properties
                                .map(([key, value]) => (
                                    <div key={key} className="px-6 py-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                                {key}
                                                {getPropertyDescription(key) && (
                                                    <TooltipProvider delayDuration={300}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Info className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="max-w-sm">
                                                                <p className="text-xs">{getPropertyDescription(key)}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </h4>
                                        </div>
                                        <div className="border border-muted/30 rounded-md p-1.5 bg-muted/30">
                                            <p className="text-xs text-foreground/90 break-all font-mono">{value}</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="px-4 py-6 text-center text-muted-foreground text-xs">No properties defined</div>
                    )}
                </CardContent>
            </Card>

            {/* Drop Dialog */}
            <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Drop Table</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to drop the table &quot;{table}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDropDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDropTable}>
                            Drop Table
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Table</DialogTitle>
                        <DialogDescription>Enter a new name for the table &quot;{table}&quot;.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">New table name</Label>
                            <Input
                                id="name"
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                                placeholder="Enter new table name"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRenameTable}>Rename Table</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
