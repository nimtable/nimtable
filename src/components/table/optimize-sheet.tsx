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

import { useEffect, useState, useCallback } from "react"
import { ChevronRight, SettingsIcon, CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { errorToString } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import Link from "next/link"
import { loadTableData, type LoadTableResult } from "@/lib/data-loader"
import {
    getFileDistribution,
    runOptimizationOperation,
    type DistributionData,
    type OptimizationOperation,
} from "@/lib/data-loader"
import { FileStatistics } from "@/components/table/file-statistics"

type OptimizationStep = {
    name: string
    status: "pending" | "running" | "done" | "error"
    error?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result?: any
}

// Define the order of size ranges
const rangeOrder = ["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"]

function FileDistributionSection({
    tableId,
    catalog,
    namespace,
}: { tableId: string; catalog: string; namespace: string }) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [distribution, setDistribution] = useState<DistributionData>({
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
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const data = await getFileDistribution(catalog, namespace, tableId)
            setDistribution(data)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to fetch distribution data",
                description: errorToString(error),
            })
        } finally {
            setLoading(false)
        }
    }, [catalog, namespace, tableId, toast])

    useEffect(() => {
        if (tableId && catalog && namespace) {
            fetchData()
        }
    }, [tableId, catalog, namespace, toast, fetchData])

    if (loading) {
        return (
            <Card className="border-muted/70 shadow-sm h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">File Size Distribution</CardTitle>
                    <CardDescription>Loading distribution data...</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                    {/* Skeleton UI for loading state */}
                    {["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"].map((range) => (
                        <div key={range} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{range}</span>
                                <div className="h-4 w-24 bg-muted/50 rounded animate-pulse"></div>
                            </div>
                            <div className="h-2.5 bg-muted/50 rounded-full w-full overflow-hidden">
                                <div className="h-full bg-muted/70 rounded-full w-1/6 animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        )
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
                <div className="flex justify-between items-center mb-4 text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Total Files: {totalFiles}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={fetchData}
                            disabled={loading}
                        >
                            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
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

                <div className="mt-6 pt-4 border-t border-muted/50">
                    <FileStatistics distribution={distribution} />
                </div>

                <div className="mt-6 pt-4 border-t border-muted/50">
                    <div className="text-sm">
                        <p className="mb-2 font-medium text-foreground">Optimization Recommendation:</p>
                        <p className="text-muted-foreground">
                            This table has {distribution.ranges["0-8M"]?.count || 0} small files that could benefit from compaction.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface OptimizeSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    catalog: string
    namespace: string
    table: string
}

export function OptimizeSheet({ open, onOpenChange, catalog, namespace, table }: OptimizeSheetProps) {
    const { toast } = useToast()
    const [, setTableData] = useState<LoadTableResult | undefined>(undefined)
    const [isLoading] = useState(false)
    const [showProgressDialog, setShowProgressDialog] = useState(false)
    const [optimizationSteps, setOptimizationSteps] = useState<OptimizationStep[]>([])

    // Optimization settings
    const [snapshotRetention, setSnapshotRetention] = useState(true)
    const [retentionPeriod, setRetentionPeriod] = useState("5")
    const [minSnapshotsToKeep, setMinSnapshotsToKeep] = useState("1")
    const [orphanFileDeletion, setOrphanFileDeletion] = useState(false)
    const [orphanFileRetention, setOrphanFileRetention] = useState("3")
    const [compaction, setCompaction] = useState(true)

    // Update optimization steps based on enabled settings
    useEffect(() => {
        const steps: OptimizationStep[] = []

        if (snapshotRetention) {
            steps.push({ name: "Snapshot Expiration", status: "pending" })
        }

        if (compaction) {
            steps.push({ name: "Compaction", status: "pending" })
        }

        if (orphanFileDeletion) {
            steps.push({ name: "Orphan File Cleanup", status: "pending" })
        }

        setOptimizationSteps(steps)
    }, [snapshotRetention, compaction, orphanFileDeletion])

    useEffect(() => {
        if (open && catalog && namespace && table) {
            loadTableData(catalog, namespace, table)
                .then(setTableData)
                .catch((error) => {
                    toast({
                        variant: "destructive",
                        title: "Failed to load table",
                        description: errorToString(error),
                    })
                })
        }
    }, [catalog, namespace, table, open, toast])

    const runOptimizationStep = async (step: OptimizationStep, index: number) => {
        try {
            setOptimizationSteps((steps) => {
                const newSteps = [...steps]
                newSteps[index] = { ...step, status: "running" }
                return newSteps
            })

            const result = await runOptimizationOperation(step.name as OptimizationOperation, catalog, namespace, table, {
                snapshotRetention,
                retentionPeriod,
                minSnapshotsToKeep,
                orphanFileDeletion,
                orphanFileRetention,
                compaction,
            })

            setOptimizationSteps((steps) => {
                const newSteps = [...steps]
                newSteps[index] = {
                    ...step,
                    status: "done",
                    result,
                }
                return newSteps
            })

            return true
        } catch (error) {
            setOptimizationSteps((steps) => {
                const newSteps = [...steps]
                newSteps[index] = { ...step, status: "error", error: errorToString(error) }
                return newSteps
            })
            return false
        }
    }

    const handleOptimize = async () => {
        setShowProgressDialog(true)
        setOptimizationSteps((steps) => steps.map((step) => ({ ...step, status: "pending" })))

        // Run steps sequentially
        for (let i = 0; i < optimizationSteps.length; i++) {
            const step = optimizationSteps[i]
            const success = await runOptimizationStep(step, i)
            if (!success) {
                toast({
                    variant: "destructive",
                    title: `Failed to run ${step.name}`,
                    description: step.error,
                })
                return
            }
        }

        toast({
            title: "Optimization completed",
            description: "All optimization steps have been completed successfully.",
        })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-full p-0 flex flex-col h-full">
                {/* Header */}
                <div className="border-b bg-background">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/table?catalog=${catalog}&namespace=${namespace}&table=${table}`}
                                    className="text-muted-foreground hover:text-foreground font-medium"
                                >
                                    {table}
                                </Link>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground font-medium">Optimize</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Title Section */}
                <div className="bg-muted/5 border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <SettingsIcon className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Table Optimization</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure and run Iceberg optimization operations including compaction, snapshot expiration, and orphan
                                file cleanup
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-7xl mx-auto p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column - File Distribution */}
                            <div>
                                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                    Current File Distribution
                                </h2>
                                <FileDistributionSection tableId={table} catalog={catalog} namespace={namespace} />
                            </div>

                            {/* Right Column - Optimization Settings */}
                            <div>
                                <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                    Optimization Settings
                                </h2>
                                <Card className="border-muted/70 shadow-sm">
                                    <CardContent className="space-y-6 pt-6">
                                        {/* Snapshot Retention */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Snapshot retention</Label>
                                                    <p className="text-sm text-muted-foreground">Removing old snapshots.</p>
                                                </div>
                                                <Switch checked={snapshotRetention} onCheckedChange={setSnapshotRetention} />
                                            </div>
                                            {snapshotRetention && (
                                                <div className="grid gap-4 pl-4 pt-2">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="retention-period">Retention period (days)</Label>
                                                        <Input
                                                            id="retention-period"
                                                            type="number"
                                                            min="1"
                                                            value={retentionPeriod}
                                                            onChange={(e) => setRetentionPeriod(e.target.value)}
                                                            placeholder="5"
                                                            className="border-muted-foreground/20"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="min-snapshots">Minimum snapshots to retain</Label>
                                                        <Input
                                                            id="min-snapshots"
                                                            type="number"
                                                            min="1"
                                                            value={minSnapshotsToKeep}
                                                            onChange={(e) => setMinSnapshotsToKeep(e.target.value)}
                                                            placeholder="1"
                                                            className="border-muted-foreground/20"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Compaction */}
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <div className="space-y-0.5">
                                                <Label className="text-base">Compaction</Label>
                                                <p className="text-sm text-muted-foreground">Combine small data files into larger files.</p>
                                            </div>
                                            <Switch checked={compaction} onCheckedChange={setCompaction} />
                                        </div>

                                        {/* Orphan File Deletion */}
                                        <div className="space-y-4 pt-2 border-t">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Orphan file deletion</Label>
                                                    <p className="text-sm text-muted-foreground">
                                                        Automatically clean up unused files periodically.
                                                    </p>
                                                </div>
                                                <Switch checked={orphanFileDeletion} onCheckedChange={setOrphanFileDeletion} />
                                            </div>
                                            {orphanFileDeletion && (
                                                <div className="grid gap-2 pl-4 pt-2">
                                                    <Label htmlFor="orphan-retention">Delete orphan files after (days)</Label>
                                                    <Input
                                                        id="orphan-retention"
                                                        type="number"
                                                        min="1"
                                                        value={orphanFileRetention}
                                                        onChange={(e) => setOrphanFileRetention(e.target.value)}
                                                        placeholder="3"
                                                        className="border-muted-foreground/20"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-background py-4 px-6">
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="border-muted-foreground/20">
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleOptimize()}
                            disabled={isLoading}
                            className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Run Optimization
                        </Button>
                    </div>
                </div>

                {/* Progress Dialog */}
                <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Optimization Progress</DialogTitle>
                            <DialogDescription>Running optimization operations. This may take several minutes.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            {optimizationSteps.map((step) => (
                                <div key={step.name} className="flex items-center gap-4">
                                    <div className="flex-shrink-0">
                                        {step.status === "pending" && <Circle className="h-5 w-5 text-muted-foreground" />}
                                        {step.status === "running" && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                                        {step.status === "done" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                        {step.status === "error" && <Circle className="h-5 w-5 text-red-500" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium">{step.name}</div>
                                        {step.status === "error" && <div className="text-sm text-red-500">{step.error}</div>}
                                        {step.status === "done" && step.result && (
                                            <div className="text-sm text-muted-foreground">
                                                {step.name === "Compaction" &&
                                                    step.result?.rewrittenDataFilesCount != null &&
                                                    step.result?.addedDataFilesCount != null && (
                                                        <>
                                                            Rewritten: {step.result.rewrittenDataFilesCount} files, Added:{" "}
                                                            {step.result.addedDataFilesCount} files
                                                        </>
                                                    )}
                                                {step.name === "Snapshot Expiration" &&
                                                    step.result?.deletedDataFilesCount != null &&
                                                    step.result?.deletedManifestFilesCount != null && (
                                                        <>
                                                            Deleted: {step.result.deletedDataFilesCount} data files,{" "}
                                                            {step.result.deletedManifestFilesCount} manifest files
                                                        </>
                                                    )}
                                                {step.name === "Orphan File Cleanup" && step.result?.orphanFileLocations != null && (
                                                    <>Cleaned: {step.result.orphanFileLocations.length} orphan files</>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowProgressDialog(false)}
                                className="border-muted-foreground/20"
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </SheetContent>
        </Sheet>
    )
}
