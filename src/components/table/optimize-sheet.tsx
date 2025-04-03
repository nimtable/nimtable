"use client"

import { useEffect, useState } from "react"
import { ChevronRight, SettingsIcon, CheckCircle2, Circle, Loader2, X } from "lucide-react"
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

type OptimizationStep = {
    name: string
    status: "pending" | "running" | "done" | "error"
    error?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result?: any
}

interface DistributionItem {
    count: number
    percentage: number
}

interface DistributionData {
    [range: string]: DistributionItem
}

// Define the order of size ranges
const rangeOrder = ["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"]

function FileDistributionSection({
    tableId,
    catalog,
    namespace,
}: { tableId: string; catalog: string; namespace: string }) {
    const [loading, setLoading] = useState(true)
    const [distribution, setDistribution] = useState<DistributionData>({})

    useEffect(() => {
        async function fetchDistribution() {
            try {
                setLoading(true)
                // Simulate API call with mock data
                await new Promise((resolve) => setTimeout(resolve, 800))

                // Mock distribution data
                setDistribution({
                    "0-8M": { count: 42, percentage: 15 },
                    "8M-32M": { count: 78, percentage: 28 },
                    "32M-128M": { count: 103, percentage: 37 },
                    "128M-512M": { count: 45, percentage: 16 },
                    "512M+": { count: 12, percentage: 4 },
                })
            } catch (error) {
                console.error("Failed to fetch distribution data", error)
            } finally {
                setLoading(false)
            }
        }

        if (tableId && catalog && namespace) {
            fetchDistribution()
        }
    }, [tableId, catalog, namespace])

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
    const sortedDistributionEntries = Object.entries(distribution).sort((a, b) => {
        const indexA = rangeOrder.indexOf(a[0])
        const indexB = rangeOrder.indexOf(b[0])
        return indexA - indexB
    })

    // Calculate total files
    const totalFiles = Object.values(distribution).reduce((sum, item) => sum + item.count, 0)

    return (
        <Card className="border-muted/70 shadow-sm h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">File Size Distribution</CardTitle>
                <CardDescription>Current distribution of file sizes in the table</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="font-medium">Total Files: {totalFiles}</span>
                    <span className="text-muted-foreground">Optimizing improves file size distribution</span>
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
                    <div className="text-sm">
                        <p className="mb-2 font-medium text-foreground">Optimization Recommendation:</p>
                        <p className="text-muted-foreground">
                            This table has {distribution["0-8M"]?.count || 0} small files that could benefit from compaction.
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
    const [tableData, setTableData] = useState<LoadTableResult | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)
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

            // Simulate API call with a delay
            await new Promise((resolve) => setTimeout(resolve, 1500))

            // Mock successful response
            const mockResults = {
                Compaction: { rewrittenDataFilesCount: 45, addedDataFilesCount: 12 },
                "Snapshot Expiration": { deletedDataFilesCount: 23, deletedManifestFilesCount: 5 },
                "Orphan File Cleanup": { orphanFileLocations: Array(8).fill("s3://path/to/orphan/file") },
            }

            setOptimizationSteps((steps) => {
                const newSteps = [...steps]
                newSteps[index] = {
                    ...step,
                    status: "done",
                    result: mockResults[step.name as keyof typeof mockResults],
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

    const handleOptimize = async (action: "schedule" | "run") => {
        if (action === "run") {
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
        } else {
            // Handle schedule case (just update properties)
            try {
                setIsLoading(true)

                // Simulate API call with a delay
                await new Promise((resolve) => setTimeout(resolve, 1000))

                toast({
                    title: "Optimization scheduled",
                    description: "Table optimization has been scheduled successfully.",
                })
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Failed to schedule optimization",
                    description: errorToString(error),
                })
            } finally {
                setIsLoading(false)
            }
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-full p-0 flex flex-col h-full">
                {/* Header */}
                <div className="border-b bg-background">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 mr-2">
                                <X className="h-4 w-4" />
                            </Button>
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
                                Configure and run optimization operations for your table
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
                            onClick={() => handleOptimize("schedule")}
                            disabled={isLoading}
                            variant="outline"
                            className="border-blue-500/50 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                            Schedule
                        </Button>
                        <Button
                            onClick={() => handleOptimize("run")}
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
                            {optimizationSteps.map((step, _index) => (
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
