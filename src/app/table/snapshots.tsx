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
import {
  GitBranch,
  Tag,
  GitCommit,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import type { LoadTableResult } from "@/lib/data-loader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { getManifestList, getManifestDetails } from "@/lib/data-loader"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { SnapshotTrend } from "@/components/table/snapshot-trend"

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

interface ManifestDetails {
  manifest_path: string
  files: any[]
}

function SnapshotItem({
  snapshot,
  isLatest,
  catalog,
  namespace,
  table,
}: {
  snapshot: Snapshot
  isLatest?: boolean
  catalog: string
  namespace: string
  table: string
}) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)
  const [manifestList, setManifestList] = useState<{
    snapshot_id: string
    manifest_list_location: string
    manifests: any[]
  } | null>(null)
  const [loadingManifest, setLoadingManifest] = useState(false)
  const router = useRouter()

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

  const handleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    if (!manifestList) {
      setLoadingManifest(true)
      try {
        const data = await getManifestList(
          catalog,
          namespace,
          table,
          snapshot.id
        )
        setManifestList(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load manifest list",
          description: errorToString(error),
        })
      } finally {
        setLoadingManifest(false)
      }
    }
    setIsExpanded(true)
  }

  const handleTimeTravel = () => {
    const query = `-- time travel to snapshot with id ${snapshot.id}\nSELECT * FROM \`${catalog}\`.\`${namespace}\`.\`${table}\` VERSION AS OF ${snapshot.id} LIMIT 100;`
    // Encode the query for URL
    const encodedQuery = encodeURIComponent(query)
    router.push(`/sql-editor?initialQuery=${encodedQuery}`)
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center py-2 px-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors">
        <div className="w-8 flex-shrink-0 flex items-center">
          <button
            onClick={handleExpand}
            className="flex items-center justify-center w-4 h-4 rounded hover:bg-muted/40"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          <div className={`h-2 w-2 rounded-full ${operationColor} ml-2`} />
        </div>

        {/* Snapshot ID - full */}
        <div className="font-mono text-xs text-muted-foreground w-[300px] flex-shrink-0 pl-4 flex items-center gap-2">
          <span className="flex-1">{String(snapshot.id)}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0"
                  onClick={handleTimeTravel}
                >
                  <Clock className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Time travel to this snapshot</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Date */}
        <div className="text-xs text-muted-foreground w-[140px] flex-shrink-0">
          {formatDate(snapshot.timestamp)}
        </div>

        {/* Operation type */}
        <div className="text-xs font-medium w-[100px] flex-shrink-0">
          {operationType}
        </div>

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

      {/* Manifest list expansion */}
      {isExpanded && (
        <div className="bg-muted/5 border-b last:border-b-0">
          {loadingManifest ? (
            <div className="p-4 text-sm text-muted-foreground">
              Loading manifest list...
            </div>
          ) : manifestList ? (
            <div className="p-4 space-y-4">
              <div className="text-sm font-medium">Manifest List</div>
              <div className="text-xs text-muted-foreground">
                Location: {manifestList.manifest_list_location}
              </div>
              <div className="space-y-2">
                {manifestList.manifests.map((manifest, index) => (
                  <ManifestItem
                    key={index}
                    manifest={manifest}
                    index={index}
                    catalog={catalog}
                    namespace={namespace}
                    table={table}
                    snapshotId={snapshot.id}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Failed to load manifest list
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ManifestItem({
  manifest,
  index,
  catalog,
  namespace,
  table,
  snapshotId,
}: {
  manifest: any
  index: number
  catalog: string
  namespace: string
  table: string
  snapshotId: string | number
}) {
  const { toast } = useToast()
  const [isExpanded, setIsExpanded] = useState(false)
  const [manifestDetails, setManifestDetails] =
    useState<ManifestDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  const handleExpand = async () => {
    if (isExpanded) {
      setIsExpanded(false)
      return
    }

    if (!manifestDetails) {
      setLoadingDetails(true)
      try {
        const data = await getManifestDetails(
          catalog,
          namespace,
          table,
          snapshotId,
          index
        )
        setManifestDetails(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load manifest details",
          description: errorToString(error),
        })
      } finally {
        setLoadingDetails(false)
      }
    }
    setIsExpanded(true)
  }

  // Helper function to get content badge color
  const getContentBadgeColor = (content: string) => {
    switch (content) {
      case "DATA":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "DELETES":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={handleExpand}
          className="flex items-center justify-center w-4 h-4 rounded hover:bg-muted/40"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        <div className="flex items-center gap-2 flex-1">
          <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="font-mono flex-1">{manifest.path}</span>
          <div className="flex items-center gap-2">
            <Badge
              className={`${getContentBadgeColor(manifest.content)} text-[10px] px-1.5 py-0`}
            >
              {manifest.content}
            </Badge>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-green-600 dark:text-green-400">
                +{manifest.added_files_count}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">
                {manifest.existing_files_count}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-red-600 dark:text-red-400">
                -{manifest.deleted_files_count}
              </span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <button className="p-1 rounded hover:bg-muted/40">
                  <Info className="h-3 w-3 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Manifest Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Basic Information</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Path: {manifest.path}</div>
                      <div>Content: {manifest.content}</div>
                      <div>Sequence Number: {manifest.sequence_number}</div>
                      <div>Partition Spec ID: {manifest.partition_spec_id}</div>
                      <div>Length: {formatFileSize(manifest.length)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Statistics</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {manifest.added_files_count !== undefined && (
                        <div>Added Files: {manifest.added_files_count}</div>
                      )}
                      {manifest.existing_files_count !== undefined && (
                        <div>
                          Existing Files: {manifest.existing_files_count}
                        </div>
                      )}
                      {manifest.deleted_files_count !== undefined && (
                        <div>Deleted Files: {manifest.deleted_files_count}</div>
                      )}
                      {manifest.added_rows_count !== undefined && (
                        <div>Added Rows: {manifest.added_rows_count}</div>
                      )}
                      {manifest.existing_rows_count !== undefined && (
                        <div>Existing Rows: {manifest.existing_rows_count}</div>
                      )}
                      {manifest.deleted_rows_count !== undefined && (
                        <div>Deleted Rows: {manifest.deleted_rows_count}</div>
                      )}
                    </div>
                  </div>

                  {manifestDetails && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Files</div>
                      {manifestDetails.files.length > 0 ? (
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {manifestDetails.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="text-xs font-mono pl-2 space-y-1 border-l-2 border-muted"
                            >
                              <div className="text-muted-foreground">
                                Path: {file.file_path}
                              </div>
                              <div className="text-muted-foreground">
                                Size: {formatFileSize(file.file_size_in_bytes)},
                                Records: {file.record_count}
                              </div>
                              {file.content && (
                                <div className="text-muted-foreground">
                                  Content: {file.content}, Format:{" "}
                                  {file.file_format}
                                </div>
                              )}
                              {file.equality_ids &&
                                file.equality_ids.length > 0 && (
                                  <div className="text-muted-foreground">
                                    Equality Fields:{" "}
                                    {file.equality_ids.join(", ")}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground pl-2">
                          No files in this manifest
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Manifest details expansion */}
      {isExpanded && (
        <div className="ml-6 mt-2 bg-muted/5 rounded p-4">
          {loadingDetails ? (
            <div className="text-xs text-muted-foreground">
              Loading manifest details...
            </div>
          ) : manifestDetails ? (
            <div className="space-y-4">
              <div className="text-sm font-medium">Files</div>
              {manifestDetails.files.length > 0 ? (
                <div className="space-y-3">
                  {manifestDetails.files.map((file, fileIndex) => (
                    <div
                      key={fileIndex}
                      className="text-xs font-mono pl-2 space-y-1"
                    >
                      <div className="text-muted-foreground">
                        Path: {file.file_path}
                      </div>
                      <div className="text-muted-foreground">
                        Size: {formatFileSize(file.file_size_in_bytes)},
                        Records: {file.record_count}
                      </div>
                      {file.content && (
                        <div className="text-muted-foreground">
                          Content: {file.content}, Format: {file.file_format}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground pl-2">
                  No files in this manifest
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Failed to load manifest details
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// Branch view component
function BranchView({
  snapshots,
  catalog,
  namespace,
  table,
}: {
  snapshots: Snapshot[]
  catalog: string
  namespace: string
  table: string
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
            <div className="flex items-center py-2 px-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
              <div className="w-8 flex-shrink-0">
                {/* Expand button column */}
              </div>
              <div className="w-[300px] flex-shrink-0 pl-4">Snapshot ID</div>
              <div className="w-[140px] flex-shrink-0">Date</div>
              <div className="w-[100px] flex-shrink-0">Operation</div>
              <div className="flex-1">References</div>
            </div>

            {/* Snapshot items */}
            <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
              {snapshotsByBranch[branch].map((snapshot, index) => (
                <SnapshotItem
                  key={snapshot.id}
                  snapshot={snapshot}
                  isLatest={index === 0}
                  catalog={catalog}
                  namespace={namespace}
                  table={table}
                />
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
  catalog,
  namespace,
  table,
}: {
  snapshots: Snapshot[]
  catalog: string
  namespace: string
  table: string
}) {
  // Sort snapshots by timestamp (newest first)
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => b.timestamp - a.timestamp)
  }, [snapshots])

  return (
    <div className="p-4">
      <div className="border rounded-md overflow-hidden bg-background shadow-sm">
        {/* Header row */}
        <div className="flex items-center py-2 px-3 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
          <div className="w-8 flex-shrink-0">{/* Expand button column */}</div>
          <div className="w-[300px] flex-shrink-0 pl-4">Snapshot ID</div>
          <div className="w-[140px] flex-shrink-0">Date</div>
          <div className="w-[100px] flex-shrink-0">Operation</div>
          <div className="flex-1">References</div>
        </div>

        {/* Snapshot items */}
        <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
          {sortedSnapshots.map((snapshot, index) => (
            <SnapshotItem
              key={snapshot.id}
              snapshot={snapshot}
              isLatest={index === 0}
              catalog={catalog}
              namespace={namespace}
              table={table}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SnapshotsTab({
  tableData,
  catalog,
  namespace,
  table,
}: SnapshotsTabProps) {
  // const { toast } = useToast()
  // const [manifestListData, setManifestListData] = useState<{
  //     snapshot_id: string
  //     manifest_list_location: string
  //     manifests: any[]
  // } | null>(null)

  const [activeView, setActiveView] = useState<string>("timeline")

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
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
        Version Control
      </h3>

      {snapshots.length === 0 ? (
        <Card className="border-muted/70 shadow-sm overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCommit className="h-12 w-12 mb-4 text-muted-foreground/20" />
            <p className="text-sm font-medium">No snapshots found</p>
            <p className="text-xs mt-1 text-muted-foreground">
              This table doesn&apos;t have any version history yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <SnapshotTrend
            catalog={catalog}
            namespace={namespace}
            table={table}
            snapshots={snapshots}
          />
          <Card className="border-muted/70 shadow-sm overflow-hidden">
            <Tabs
              defaultValue="timeline"
              value={activeView}
              onValueChange={setActiveView}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <TabsList>
                  <TabsTrigger
                    value="timeline"
                    className="flex items-center gap-1.5"
                  >
                    <Calendar className="h-4 w-4" />
                    Snapshots
                  </TabsTrigger>
                  <TabsTrigger
                    value="branch"
                    className="flex items-center gap-1.5"
                  >
                    <GitBranch className="h-4 w-4" />
                    Branch View
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

              <div className="h-[calc(100vh-300px)] overflow-auto">
                <TabsContent value="timeline" className="mt-0 h-full">
                  <TimelineView
                    snapshots={snapshots}
                    catalog={catalog}
                    namespace={namespace}
                    table={table}
                  />
                </TabsContent>

                <TabsContent value="branch" className="mt-0 h-full">
                  <BranchView
                    snapshots={snapshots}
                    catalog={catalog}
                    namespace={namespace}
                    table={table}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  )
}
