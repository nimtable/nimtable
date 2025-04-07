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
import { TableIcon, Database, FileText, Copy, Check, Settings } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { LoadTableResult, StructField } from "@/lib/data-loader"
import { dropTable, renameTable } from "@/lib/data-loader"
import { cn } from "@/lib/utils"
import { OptimizeSheet } from "@/components/table/optimize-sheet"

interface InfoTabProps {
    tableData: LoadTableResult
    catalog: string
    namespace: string
    table: string
}

export function InfoTab({ tableData, catalog, namespace, table }: InfoTabProps) {
    const { toast } = useToast()
    const router = useRouter()
    const { refresh } = useRefresh()
    const [showDropDialog, setShowDropDialog] = useState(false)
    const [showRenameDialog, setShowRenameDialog] = useState(false)
    const [showOptimizeDialog, setShowOptimizeDialog] = useState(false)
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <TableIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-semibold">{table}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 relative overflow-hidden group bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white hover:text-white shadow-md hover:shadow-lg transition-all duration-300 border-0 hover:scale-[1.03] transform"
                        onClick={() => setShowOptimizeDialog(true)}
                    >
                        {/* Animated glow effect */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400/0 via-purple-400/30 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-gradient-x"></div>

                        {/* Button content */}
                        <div className="relative flex items-center gap-2">
                            <div className="p-1 bg-white/20 rounded-md flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                <Settings className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="font-medium">Optimize</span>
                        </div>

                        {/* Subtle pulse effect */}
                        <span className="absolute -inset-3 block rounded-full bg-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                    </Button>
                </div>
            </div>

            {/* Schema Section */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    Schema
                </h3>
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
            </div>

            {/* Table Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-muted/70 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-500" />
                            Table Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-muted/30">
                            <div className="px-6 py-4">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="text-sm font-medium text-muted-foreground">Table UUID</h4>
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-7 w-7 rounded-md transition-all duration-200",
                                                        copyingField === "Table UUID" ? "bg-muted text-blue-500" : "text-muted-foreground",
                                                    )}
                                                    onClick={() => copyToClipboard(tableData.metadata["table-uuid"], "Table UUID")}
                                                >
                                                    {copyingField === "Table UUID" ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                                <p>{copyingField === "Table UUID" ? "Copied!" : "Copy to clipboard"}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="border border-muted/30 rounded-md p-2 bg-muted/30 font-mono">
                                    <p className="text-sm text-foreground/90 break-all">{tableData.metadata["table-uuid"]}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
                                    <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-7 w-7 rounded-md transition-all duration-200",
                                                        copyingField === "Location" ? "bg-muted text-blue-500" : "text-muted-foreground",
                                                    )}
                                                    onClick={() => copyToClipboard(tableData.metadata.location || "", "Location")}
                                                >
                                                    {copyingField === "Location" ? (
                                                        <Check className="h-3.5 w-3.5" />
                                                    ) : (
                                                        <Copy className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="left">
                                                <p>{copyingField === "Location" ? "Copied!" : "Copy to clipboard"}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="border border-muted/30 rounded-md p-2 bg-muted/30 font-mono">
                                    <p className="text-sm text-foreground/90 break-all">{tableData.metadata.location}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <h4 className="text-sm font-medium text-muted-foreground mb-1.5">Last Updated</h4>
                                <p className="text-sm pl-1 font-medium">
                                    {tableData.metadata["last-updated-ms"]
                                        ? new Date(tableData.metadata["last-updated-ms"]).toLocaleString()
                                        : "-"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-muted/70 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b">
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            Properties
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {tableData.metadata.properties && Object.keys(tableData.metadata.properties).length > 0 ? (
                            <div className="divide-y divide-muted/30">
                                {Object.entries(tableData.metadata.properties).map(([key, value]) => (
                                    <div key={key} className="px-6 py-4">
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1.5">{key}</h4>
                                        <div className="border border-muted/30 rounded-md p-2 bg-muted/30">
                                            <p className="text-sm text-foreground/90 break-all font-mono">{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="px-6 py-8 text-center text-muted-foreground">No properties defined</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Drop Dialog */}
            <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Drop Table</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to drop the table "{table}"? This action cannot be undone.
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
                        <DialogDescription>Enter a new name for the table "{table}".</DialogDescription>
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

            <OptimizeSheet
                open={showOptimizeDialog}
                onOpenChange={setShowOptimizeDialog}
                catalog={catalog}
                namespace={namespace}
                table={table}
            />
        </div>
    )
}
