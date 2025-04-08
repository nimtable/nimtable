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
import { useState, useMemo } from "react"
import { GitBranch, Tag, GitCommit, Calendar } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { LoadTableResult } from "@/lib/data-loader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

interface SnapshotsTabProps {
    tableData: LoadTableResult
    catalog: string
    namespace: string
    table: string
}

interface Snapshot {
    id: string | number
    parentId?: string | number
    timestamp: number
    branches: string[]
    tags: string[]
    summary?: Record<string, string>
}

// Find the SnapshotItem component and replace it with this more minimalistic version:

function SnapshotItem({
    snapshot,
    isLatest,
}: {
    snapshot: Snapshot
    isLatest?: boolean
}) {
    // Get operation type
    const getOperationType = (summary?: Record<string, string>): string => {
        if (!summary) return "unknown"
        return summary.operation || "unknown"
    }

    const operationType = getOperationType(snapshot.summary)

    // Color based on operation type
    const operationColor =
        {
            append: "bg-green-500",
            delete: "bg-red-500",
            overwrite: "bg-amber-500",
            replace: "bg-blue-500",
            unknown: "bg-gray-500",
        }[operationType] || "bg-gray-500"

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

    return (
        <div className="flex items-center gap-2 py-2 px-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
            {/* Snapshot indicator with operation color */}
            <div className={`h-2 w-2 rounded-full ${operationColor} flex-shrink-0`} />

            {/* Snapshot ID - truncated */}
            <div className="font-mono text-xs text-muted-foreground w-16 flex-shrink-0">
                {String(snapshot.id).substring(0, 7)}
            </div>

            {/* Date */}
            <div className="text-xs text-muted-foreground flex-shrink-0 w-24">{formatDate(snapshot.timestamp)}</div>

            {/* Operation type */}
            <div className="text-xs font-medium w-20 flex-shrink-0">{operationType}</div>

            {/* Badges - only show if present */}
            <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                {isLatest && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] px-1.5 py-0 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        latest
                    </Badge>
                )}

                {snapshot.branches.length > 0 &&
                    snapshot.branches.map((branch) => (
                        <Badge
                            key={branch}
                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0 flex items-center gap-0.5 hover:bg-green-100 dark:hover:bg-green-900/30"
                        >
                            <GitBranch className="h-2 w-2" />
                            {branch}
                        </Badge>
                    ))}

                {snapshot.tags.length > 0 &&
                    snapshot.tags.map((tag) => (
                        <Badge
                            key={tag}
                            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-1.5 py-0 flex items-center gap-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        >
                            <Tag className="h-2 w-2" />
                            {tag}
                        </Badge>
                    ))}
            </div>
        </div>
    )
}

// Branch view component
function BranchView({
    snapshots,
}: {
    snapshots: Snapshot[]
}) {
    // Get all branch names
    const branches = useMemo(() => {
        const branchSet = new Set<string>()
        snapshots.forEach((snapshot) => {
            snapshot.branches.forEach((branch) => branchSet.add(branch))
        })

        // Ensure 'main' is first if it exists
        const branchList = Array.from(branchSet)
        if (branchList.includes("main")) {
            branchList.splice(branchList.indexOf("main"), 1)
            branchList.unshift("main")
        }

        return branchList
    }, [snapshots])

    // Create a map of snapshots by branch
    const snapshotsByBranch = useMemo(() => {
        const result: Record<string, Snapshot[]> = {}

        // Initialize with empty arrays
        branches.forEach((branch) => {
            result[branch] = []
        })

        // Add snapshots to their branches
        snapshots.forEach((snapshot) => {
            snapshot.branches.forEach((branch) => {
                if (result[branch]) {
                    result[branch].push(snapshot)
                }
            })
        })

        // Sort snapshots by timestamp (newest first)
        Object.keys(result).forEach((branch) => {
            result[branch].sort((a, b) => b.timestamp - a.timestamp)
        })

        return result
    }, [snapshots, branches])

    return (
        <div className="space-y-6 p-4">
            {/* Branches */}
            {branches.map((branch) => (
                <div key={branch} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-green-50 dark:bg-green-900/30">
                            <GitBranch className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <h3 className="text-sm font-medium">{branch}</h3>
                    </div>

                    {/* Branch snapshots */}
                    <div className="border rounded-md overflow-hidden bg-background ml-4 shadow-sm">
                        {/* Header row */}
                        <div className="flex items-center gap-2 py-2 px-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                            <div className="w-2"></div>
                            <div className="w-16">ID</div>
                            <div className="w-24">Date</div>
                            <div className="w-20">Operation</div>
                            <div className="flex-1">References</div>
                        </div>

                        {/* Snapshot items */}
                        <div className="max-h-[300px] overflow-y-auto">
                            {snapshotsByBranch[branch].map((snapshot, index) => (
                                <SnapshotItem key={snapshot.id} snapshot={snapshot} isLatest={index === 0} />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Timeline view component
function TimelineView({
    snapshots,
}: {
    snapshots: Snapshot[]
}) {
    // Sort snapshots by timestamp (newest first)
    const sortedSnapshots = useMemo(() => {
        return [...snapshots].sort((a, b) => b.timestamp - a.timestamp)
    }, [snapshots])

    return (
        <div className="p-4">
            <div className="border rounded-md overflow-hidden bg-background shadow-sm">
                {/* Header row */}
                <div className="flex items-center gap-2 py-2 px-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
                    <div className="w-2"></div>
                    <div className="w-16">ID</div>
                    <div className="w-24">Date</div>
                    <div className="w-20">Operation</div>
                    <div className="flex-1">References</div>
                </div>

                {/* Snapshot items */}
                <div className="max-h-[400px] overflow-y-auto">
                    {sortedSnapshots.map((snapshot, index) => (
                        <SnapshotItem key={snapshot.id} snapshot={snapshot} isLatest={index === 0} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export function SnapshotsTab({ tableData }: SnapshotsTabProps) {
    // const { toast } = useToast()
    // const [manifestListData, setManifestListData] = useState<{
    //     snapshot_id: string
    //     manifest_list_location: string
    //     manifests: any[]
    // } | null>(null)

    const [activeView, setActiveView] = useState<string>("branch")

    // Process snapshots, branches and tags into a unified data structure
    const snapshots = useMemo(() => {
        const result: Snapshot[] = []

        // First, create snapshot objects
        if (tableData.metadata.snapshots) {
            tableData.metadata.snapshots.forEach((snapshot) => {
                result.push({
                    id: snapshot["snapshot-id"],
                    parentId: snapshot["parent-snapshot-id"],
                    timestamp: snapshot["timestamp-ms"],
                    branches: [],
                    tags: [],
                    summary: snapshot.summary,
                })
            })
        }

        // Then, add branch and tag references
        if (tableData.metadata.refs) {
            Object.entries(tableData.metadata.refs).forEach(([name, ref]) => {
                const snapshotId = ref["snapshot-id"]
                const snapshot = result.find((s) => s.id === snapshotId)

                if (snapshot) {
                    if (ref.type === "branch") {
                        snapshot.branches.push(name)
                    } else if (ref.type === "tag") {
                        snapshot.tags.push(name)
                    }
                }
            })
        }

        return result
    }, [tableData.metadata.snapshots, tableData.metadata.refs])

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <GitCommit className="h-5 w-5 text-blue-500" />
                </div>
                <h2 className="text-xl font-semibold">Version Control</h2>
            </div>

            {snapshots.length === 0 ? (
                <Card className="border-muted/70 shadow-sm overflow-hidden">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <GitCommit className="h-12 w-12 mb-4 text-muted-foreground/20" />
                        <p className="text-sm font-medium">No snapshots found</p>
                        <p className="text-xs mt-1 text-muted-foreground">This table doesn&apos;t have any version history yet</p>
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-muted/70 shadow-sm overflow-hidden">
                    <Tabs defaultValue="branch" value={activeView} onValueChange={setActiveView}>
                        <div className="flex justify-between items-center p-4 border-b">
                            <TabsList>
                                <TabsTrigger value="branch" className="flex items-center gap-1.5">
                                    <GitBranch className="h-4 w-4" />
                                    Branch View
                                </TabsTrigger>
                                <TabsTrigger value="timeline" className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    Timeline View
                                </TabsTrigger>
                            </TabsList>

                            {/* Legend */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                    <span>Append</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                                    <span>Overwrite</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                    <span>Replace</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                    <span>Delete</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[500px] overflow-auto">
                            <TabsContent value="branch" className="mt-0 h-full">
                                <BranchView snapshots={snapshots} />
                            </TabsContent>

                            <TabsContent value="timeline" className="mt-0 h-full">
                                <TimelineView snapshots={snapshots} />
                            </TabsContent>
                        </div>
                    </Tabs>
                </Card>
            )}
        </div>
    )
}
