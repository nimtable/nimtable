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
import { GitBranchIcon, GitCommit } from "lucide-react"
import { useMemo } from "react"
import { SnapshotTrend } from "@/components/table/snapshot-trend"
import { Card, CardContent } from "@/components/ui/card"
import type { LoadTableResult } from "@/lib/data-loader"
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
                <GitBranchIcon className="w-5 h-5 text-primary" />
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
