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

import { useEffect, useState } from "react"
import {
  ChevronRight,
  SettingsIcon,
  CheckCircle2,
  Circle,
  Loader2,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Cpu,
  GitCommit,
} from "lucide-react"
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import Link from "next/link"
import {
  getFileDistribution,
  runOptimizationOperation,
  type DistributionData,
  type OptimizationOperation,
} from "@/lib/data-loader"
import { FileStatistics } from "@/components/table/file-statistics"
import { FileDistributionLoading } from "@/components/table/file-distribution-loading"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@/components/ui/alert"

type OptimizationStep = {
  name: string
  status: "pending" | "running" | "done" | "error"
  error?: string

  result?: any
}

// Define the order of size ranges
const rangeOrder = ["0-8M", "8M-32M", "32M-128M", "128M-512M", "512M+"]

function FileDistributionSection({
  tableId,
  catalog,
  namespace,
}: {
  tableId: string
  catalog: string
  namespace: string
}) {
  const {
    data: distribution,
    isPending,
    isError,
    refetch,
  } = useQuery<DistributionData>({
    queryKey: ["file-distribution", catalog, namespace, tableId],
    queryFn: async () => {
      return await getFileDistribution(catalog, namespace, tableId)
    },
    enabled: !!(tableId && catalog && namespace),
    meta: {
      errorMessage: "Failed to fetch file distribution data for the table.",
    },
  })

  if (isPending || isError) {
    return <FileDistributionLoading />
  }

  // Sort the distribution data according to our predefined size order
  const sortedDistributionEntries = Object.entries(distribution.ranges).sort(
    (a, b) => {
      const indexA = rangeOrder.indexOf(a[0])
      const indexB = rangeOrder.indexOf(b[0])
      return indexA - indexB
    }
  )

  // Calculate total files
  const totalFiles = Object.values(distribution.ranges).reduce(
    (sum, item) => sum + item.count,
    0
  )

  return (
    <Card className="border-muted/70 shadow-sm h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">File Size Distribution</CardTitle>
        <CardDescription>
          Current distribution of file sizes in the table
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center mb-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Total Files: {totalFiles}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => refetch()}
              disabled={isPending}
            >
              <RefreshCw
                className={`h-3 w-3 ${isPending ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="space-y-5">
          {sortedDistributionEntries.map(([range, data]) => (
            <div key={range} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      range === "0-8M"
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
                  className={`h-full rounded-full ${
                    range === "0-8M"
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
            <p className="mb-2 font-medium text-foreground">
              Optimization Recommendation:
            </p>
            <p className="text-muted-foreground">
              This table has {distribution.ranges["0-8M"]?.count || 0} small
              files that could benefit from compaction.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface CompactionHistoryItem {
  id: string | number
  timestamp: number
  rewrittenDataFilesCount: number
  addedDataFilesCount: number
  rewrittenBytesCount: number
  failedDataFilesCount: number
}

function CompactionHistory({
  catalog,
  namespace,
  table,
}: {
  catalog: string
  namespace: string
  table: string
}) {
  const { data: tableData } = useQuery({
    queryKey: ["table", catalog, namespace, table],
    queryFn: async () => {
      const response = await fetch(
        `/api/catalog/${catalog}/namespace/${namespace}/table/${table}`
      )
      if (!response.ok) {
        throw new Error("Failed to fetch table data")
      }
      return await response.json()
    },
  })

  // Format timestamp to be more compact
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  if (!tableData?.metadata?.snapshots) {
    return null
  }

  // Filter snapshots with operation type "replace" and sort by timestamp
  const compactionHistory = tableData.metadata.snapshots
    .filter((snapshot: any) => snapshot.summary?.operation === "replace")
    .map((snapshot: any) => ({
      id: snapshot["snapshot-id"],
      timestamp: snapshot["timestamp-ms"],
      rewrittenDataFilesCount:
        snapshot.summary?.["rewritten-data-files-count"] || 0,
      addedDataFilesCount: snapshot.summary?.["added-data-files-count"] || 0,
      rewrittenBytesCount: snapshot.summary?.["rewritten-bytes-count"] || 0,
      failedDataFilesCount: snapshot.summary?.["failed-data-files-count"] || 0,
    }))
    .sort(
      (a: CompactionHistoryItem, b: CompactionHistoryItem) =>
        b.timestamp - a.timestamp
    )

  if (compactionHistory.length === 0) {
    return (
      <Card className="border-muted/70 shadow-sm overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GitCommit className="h-12 w-12 mb-4 text-muted-foreground/20" />
          <p className="text-sm font-medium">No compaction history</p>
          <p className="text-xs mt-1 text-muted-foreground">
            This table doesn&apos;t have any compaction operations yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-muted/70 shadow-sm overflow-hidden">
      <div className="border rounded-md overflow-hidden bg-background">
        {/* Header row */}
        <div className="flex items-center py-2 px-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
          <div className="w-8 flex-shrink-0">{/* Expand button column */}</div>
          <div className="w-[300px] flex-shrink-0 pl-4">Snapshot ID</div>
          <div className="w-[140px] flex-shrink-0">Date</div>
          <div className="w-[100px] flex-shrink-0">Operation</div>
        </div>

        {/* History items */}
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
          {compactionHistory.map(
            (item: CompactionHistoryItem) => (
              <div
                key={item.id}
                className="flex items-center py-2 px-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <div className="w-8 flex-shrink-0 flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500 ml-2" />
                </div>

                {/* Snapshot ID */}
                <div className="font-mono text-xs text-muted-foreground w-[300px] flex-shrink-0 pl-4">
                  {String(item.id)}
                </div>

                {/* Date */}
                <div className="text-xs text-muted-foreground w-[140px] flex-shrink-0">
                  {formatDate(item.timestamp)}
                </div>

                {/* Operation type */}
                <div className="text-xs font-medium w-[100px] flex-shrink-0">
                  Compaction
                </div>
              </div>
            )
          )}
        </div>
      </div>
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

export function OptimizeSheet({
  open,
  onOpenChange,
  catalog,
  namespace,
  table,
}: OptimizeSheetProps) {
  const { toast } = useToast()
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [optimizationSteps, setOptimizationSteps] = useState<
    OptimizationStep[]
  >([])

  // Optimization settings
  const [snapshotRetention, setSnapshotRetention] = useState(true)
  const [retentionPeriod, setRetentionPeriod] = useState("5")
  const [minSnapshotsToKeep, setMinSnapshotsToKeep] = useState("1")
  const [compaction, setCompaction] = useState(true)
  const [targetFileSizeBytes, setTargetFileSizeBytes] =
    useState<number>(536870912) // 512MB in bytes
  const [strategy, setStrategy] = useState("binpack")
  const [sortOrder, setSortOrder] = useState("")
  const [whereClause, setWhereClause] = useState("")

  // Get system information
  const { data: systemInfo } = useQuery<{
    cpuCount: number
    maxMemory: number
  }>({
    queryKey: ["system-info"],
    queryFn: async () => {
      const response = await fetch("/api/optimize/system-info")
      if (response.ok) {
        const data = await response.json()
        return data
      }
      return undefined
    },
  })

  // Update optimization steps based on enabled settings
  useEffect(() => {
    const steps: OptimizationStep[] = []

    if (snapshotRetention) {
      steps.push({ name: "Snapshot Expiration", status: "pending" })
    }

    if (compaction) {
      steps.push({ name: "Compaction", status: "pending" })
    }

    setOptimizationSteps(steps)
  }, [snapshotRetention, compaction])

  // Define the optimization mutation
  const optimizeMutation = useMutation({
    mutationFn: async ({
      step,
      index,
    }: {
      step: OptimizationStep
      index: number
    }) => {
      setOptimizationSteps((steps) => {
        const newSteps = [...steps]
        newSteps[index] = { ...step, status: "running" }
        return newSteps
      })

      return await runOptimizationOperation(
        step.name as OptimizationOperation,
        catalog,
        namespace,
        table,
        {
          snapshotRetention,
          retentionPeriod,
          minSnapshotsToKeep,
          compaction,
          targetFileSizeBytes: compaction ? targetFileSizeBytes : undefined,
          strategy: compaction ? strategy : undefined,
          sortOrder: compaction ? sortOrder : undefined,
          whereClause: compaction ? whereClause : undefined,
        }
      )
    },
    meta: {
      errorMessage: "Failed to run optimization operation.",
    },
    onSuccess: (result, { step, index }) => {
      setOptimizationSteps((steps) => {
        const newSteps = [...steps]
        newSteps[index] = {
          ...step,
          status: "done",
          result,
        }
        return newSteps
      })
    },
    onError: (error, { step, index }) => {
      setOptimizationSteps((steps) => {
        const newSteps = [...steps]
        newSteps[index] = {
          ...step,
          status: "error",
          error: errorToString(error),
        }
        return newSteps
      })

      toast({
        variant: "destructive",
        title: `Failed to run ${step.name}`,
        description: errorToString(error),
      })
    },
  })

  const handleOptimize = async () => {
    setShowProgressDialog(true)
    setOptimizationSteps((steps) =>
      steps.map((step) => ({ ...step, status: "pending" }))
    )

    // Run steps sequentially
    for (let i = 0; i < optimizationSteps.length; i++) {
      const step = optimizationSteps[i]
      try {
        await optimizeMutation.mutateAsync({ step, index: i })
      } catch (_error) {
        return // Stop on first error
      }
    }

    toast({
      title: "Optimization completed",
      description: "All optimization steps have been completed successfully.",
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-full p-0 flex flex-col h-full"
      >
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
                Configure and run Iceberg optimization operations including
                compaction, snapshot expiration...
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
                <FileDistributionSection
                  tableId={table}
                  catalog={catalog}
                  namespace={namespace}
                />
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
                          <Label className="text-base">
                            Snapshot retention
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Removing old snapshots.
                          </p>
                        </div>
                        <Switch
                          checked={snapshotRetention}
                          onCheckedChange={setSnapshotRetention}
                        />
                      </div>
                      {snapshotRetention && (
                        <div className="grid gap-4 pl-4 pt-2">
                          <div className="grid gap-2">
                            <Label htmlFor="retention-period">
                              Retention period (days)
                            </Label>
                            <Input
                              id="retention-period"
                              type="number"
                              min="1"
                              value={retentionPeriod}
                              onChange={(e) =>
                                setRetentionPeriod(e.target.value)
                              }
                              placeholder="5"
                              className="border-muted-foreground/20"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="min-snapshots">
                              Minimum snapshots to retain
                            </Label>
                            <Input
                              id="min-snapshots"
                              type="number"
                              min="1"
                              value={minSnapshotsToKeep}
                              onChange={(e) =>
                                setMinSnapshotsToKeep(e.target.value)
                              }
                              placeholder="1"
                              className="border-muted-foreground/20"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compaction */}
                    <div className="space-y-4 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-base">Compaction</Label>
                          <p className="text-sm text-muted-foreground">
                            Combine small data files into larger files.
                          </p>
                        </div>
                        <Switch
                          checked={compaction}
                          onCheckedChange={setCompaction}
                        />
                      </div>
                      {compaction && (
                        <div className="grid gap-4 pl-4 pt-2">
                          <div className="grid gap-2">
                            <Label htmlFor="target-file-size">
                              Target file size (MB)
                            </Label>
                            <Input
                              id="target-file-size"
                              type="number"
                              min="1"
                              value={Math.round(
                                targetFileSizeBytes / (1024 * 1024)
                              )}
                              onChange={(e) =>
                                setTargetFileSizeBytes(
                                  Number(e.target.value) * 1024 * 1024 ||
                                    536870912
                                )
                              }
                              placeholder="512"
                              className="border-muted-foreground/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Strategy</Label>
                            <Select
                              value={strategy}
                              onValueChange={(value) => {
                                setStrategy(value)
                                if (value !== "sort") {
                                  setSortOrder("")
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select strategy" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="binpack">Binpack</SelectItem>
                                <SelectItem value="sort">Sort</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                              Choose between binpack (default) or sort strategy
                            </p>
                          </div>

                          {strategy === "sort" && (
                            <div className="space-y-2">
                              <Label>Sort Order</Label>
                              <Input
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                placeholder="e.g., zorder(c1,c2) or id DESC NULLS LAST,name ASC NULLS FIRST"
                              />
                              <p className="text-sm text-muted-foreground">
                                Specify sort order using zorder format (e.g.,
                                zorder(c1,c2)) or sort format (e.g., id DESC
                                NULLS LAST,name ASC NULLS FIRST)
                              </p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>Where Clause</Label>
                            <Input
                              value={whereClause}
                              onChange={(e) => setWhereClause(e.target.value)}
                              placeholder="e.g., id > 1000"
                            />
                            <p className="text-sm text-muted-foreground">
                              Optional filter to specify which files should be
                              rewritten
                            </p>
                          </div>

                          {/* System Resource Information */}
                          <div className="mt-4 pt-4 border-t border-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                              <Cpu className="h-4 w-4 text-blue-500" />
                              <span className="text-sm font-medium">
                                System Resources
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <Cpu className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {systemInfo?.cpuCount ?? "Loading..."}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    CPU Cores
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {systemInfo
                                      ? `${(systemInfo.maxMemory / (1024 * 1024 * 1024)).toFixed(1)} GB`
                                      : "Loading..."}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Max Memory
                                  </p>
                                </div>
                              </div>
                            </div>
                            <Alert variant="warning" className="mt-4">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription className="ml-2">
                                Compaction is performed using Embedded Spark
                                with the above system resources. Please ensure
                                these resources are sufficient for your data
                                size.
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Compaction History */}
            <div className="mt-16">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                Compaction History
              </h2>
              <CompactionHistory
                catalog={catalog}
                namespace={namespace}
                table={table}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t bg-background py-4 px-6">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-muted-foreground/20"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleOptimize()}
              disabled={optimizeMutation.isPending}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {optimizeMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Run Optimization
            </Button>
          </div>
        </div>

        {/* Progress Dialog */}
        <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Optimization Progress</DialogTitle>
              <DialogDescription>
                Running optimization operations. This may take several minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {optimizationSteps.map((step) => (
                <div key={step.name} className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {step.status === "pending" && (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    {step.status === "running" && (
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    )}
                    {step.status === "done" && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    {step.status === "error" && (
                      <Circle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    {step.status === "error" && (
                      <div className="text-sm text-red-500">{step.error}</div>
                    )}
                    {step.status === "done" && step.result && (
                      <div className="text-sm text-muted-foreground">
                        {step.name === "Compaction" &&
                          step.result?.rewrittenDataFilesCount != null &&
                          step.result?.addedDataFilesCount != null && (
                            <>
                              Rewritten: {step.result.rewrittenDataFilesCount}{" "}
                              files, Added: {step.result.addedDataFilesCount}{" "}
                              files
                            </>
                          )}
                        {step.name === "Snapshot Expiration" &&
                          step.result?.deletedDataFilesCount != null &&
                          step.result?.deletedManifestFilesCount != null && (
                            <>
                              Deleted: {step.result.deletedDataFilesCount} data
                              files, {step.result.deletedManifestFilesCount}{" "}
                              manifest files
                            </>
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
