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
  GitBranch,
  FileText,
  Info,
  ChevronDown,
  ChevronRight,
  GitCommit,
} from "lucide-react"
import { useState, useMemo } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getManifestDetails } from "@/lib/data-loader"
import { SnapshotTrend } from "@/components/table/snapshot-trend"
import { Card, CardContent } from "@/components/ui/card"
import type { LoadTableResult } from "@/lib/data-loader"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { BranchView } from "@/components/table/branch-graph"

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
  isCompaction?: boolean
}

interface ManifestDetails {
  manifest_path: string
  files: any[]
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
          className="flex h-4 w-4 items-center justify-center rounded hover:bg-muted/40"
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        <div className="flex flex-1 items-center gap-2">
          <FileText className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          <span className="flex-1 font-mono">{manifest.path}</span>
          <div className="flex items-center gap-2">
            <Badge
              className={`${getContentBadgeColor(manifest.content)} px-1.5 py-0 text-[10px]`}
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
                <button className="rounded p-1 hover:bg-muted/40">
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
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Path: {manifest.path}</div>
                      <div>Content: {manifest.content}</div>
                      <div>Sequence Number: {manifest.sequence_number}</div>
                      <div>Partition Spec ID: {manifest.partition_spec_id}</div>
                      <div>Length: {formatFileSize(manifest.length)}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Statistics</div>
                    <div className="space-y-1 text-xs text-muted-foreground">
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
                      {manifest.deleted_files_count > 0 && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border">
                          ⚠️ Note: Only non-deleted entries are displayed.{" "}
                          {manifest.deleted_files_count} deleted entries in the
                          manifest are not shown.
                        </div>
                      )}
                      {manifestDetails.files.length > 0 ? (
                        <div className="max-h-[300px] space-y-3 overflow-y-auto">
                          {manifestDetails.files.map((file, fileIndex) => (
                            <div
                              key={fileIndex}
                              className="space-y-1 border-l-2 border-muted pl-2 font-mono text-xs"
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
                        <div className="pl-2 text-xs text-muted-foreground">
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
        <div className="ml-6 mt-2 rounded bg-muted/5 p-4">
          {loadingDetails ? (
            <div className="text-xs text-muted-foreground">
              Loading manifest details...
            </div>
          ) : manifestDetails ? (
            <div className="space-y-4">
              <div className="text-sm font-medium">Files</div>
              {manifest.deleted_files_count > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded border">
                  ⚠️ Note: Only non-deleted entries are displayed.{" "}
                  {manifest.deleted_files_count} deleted entries in the manifest
                  are not shown.
                </div>
              )}
              {manifestDetails.files.length > 0 ? (
                <div className="max-h-[300px] space-y-3 overflow-y-auto">
                  {manifestDetails.files.map((file, fileIndex) => (
                    <div
                      key={fileIndex}
                      className="space-y-1 border-l-2 border-muted pl-2 font-mono text-xs"
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
                <div className="pl-2 text-xs text-muted-foreground">
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

export function SnapshotsTab({
  tableData,
  catalog,
  namespace,
  table,
}: SnapshotsTabProps) {
  // Process snapshots, branches and tags into a unified data structure
  const snapshots = useMemo(() => {
    const result: Snapshot[] = []

    // First, create snapshot objects
    if (tableData.metadata.snapshots) {
      tableData.metadata.snapshots.forEach((snapshot) => {
        const summary = snapshot.summary || {}

        // A compaction operation is typically a replace operation.
        const isCompaction = summary.operation === "replace"

        result.push({
          id: snapshot["snapshot-id"],
          parentId: snapshot["parent-snapshot-id"],
          timestamp: snapshot["timestamp-ms"],
          branches: [],
          tags: [],
          summary: summary,
          isCompaction: isCompaction,
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
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
        Version Control
      </h3>

      {snapshots.length === 0 ? (
        <Card className="overflow-hidden border-muted/70 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitCommit className="mb-4 h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm font-medium">No snapshots found</p>
            <p className="mt-1 text-xs text-muted-foreground">
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
          <Card className="overflow-hidden border-muted/70 shadow-sm">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-1.5">
                <GitBranch className="h-4 w-4" />
                <span className="font-medium">Branch View</span>
              </div>

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
              <BranchView
                snapshots={snapshots}
                catalog={catalog}
                namespace={namespace}
                table={table}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
