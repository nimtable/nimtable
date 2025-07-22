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
  Tag,
  GitCommit,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  Clock,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useMemo } from "react"

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
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getManifestList, getManifestDetails } from "@/lib/data-loader"
import { SnapshotTrend } from "@/components/table/snapshot-trend"
import { Card, CardContent } from "@/components/ui/card"
import type { LoadTableResult } from "@/lib/data-loader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"

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

// Graph node for visualization
interface GraphNode {
  snapshot: Snapshot
  x: number
  y: number
  column: number
  branchColor: string
  branchName: string
  isLatest: boolean
  isBranchHead: boolean
  shortId: string
}

// Graph edge for connections
interface GraphEdge {
  from: GraphNode
  to: GraphNode
  color: string
  fromColumn: number
  toColumn: number
}

// Branch view component with IntelliJ-style git graph visualization
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
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedBranches, setSelectedBranches] = useState<Set<string>>(new Set(["All"]))
  const [isManifestExpanded, setIsManifestExpanded] = useState(false)
  const [manifestList, setManifestList] = useState<{
    snapshot_id: string
    manifest_list_location: string
    manifests: any[]
  } | null>(null)
  const [loadingManifest, setLoadingManifest] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Get all branch names and assign colors
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

    // Generate unique colors for all branches
    const generateColor = (index: number, name: string) => {
      if (name === "main") return "#4CAF50" // green for main
      
      // Use predefined colors for consistent appearance
      const predefinedColors = [
        "#2196F3", // blue
        "#9C27B0", // purple
        "#FF9800", // orange
        "#F44336", // red
        "#00BCD4", // cyan
        "#8BC34A", // light green
        "#FF5722", // deep orange
        "#795548", // brown
        "#607D8B", // blue grey
        "#E91E63", // pink
      ]
      
      if (index < predefinedColors.length) {
        return predefinedColors[index]
      }
      
      // For additional branches, generate colors based on hash of name
      const hash = name.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      
      const hue = Math.abs(hash) % 360
      return `hsl(${hue}, 70%, 50%)`
    }

    return branchList.map((branch, index) => ({
      name: branch,
      color: generateColor(index, branch),
    }))
  }, [snapshots])

  // Handle branch filter
  const handleBranchFilter = (branchName: string) => {
    const newSelection = new Set(selectedBranches)
    
    if (branchName === "All") {
      if (selectedBranches.has("All")) {
        // If All is selected and clicked again, deselect all
        newSelection.clear()
      } else {
        // Select All (which means show all branches)
        newSelection.clear()
        newSelection.add("All")
      }
    } else {
      // Remove "All" if individual branch is selected
      newSelection.delete("All")
      
      if (selectedBranches.has(branchName)) {
        newSelection.delete(branchName)
      } else {
        newSelection.add(branchName)
      }
      
      // If no branches selected, default to "All"
      if (newSelection.size === 0) {
        newSelection.add("All")
      }
    }
    
    setSelectedBranches(newSelection)
  }

  // Build IntelliJ-style graph layout
  const { nodes, edges, filteredSnapshots } = useMemo(() => {
    if (snapshots.length === 0) return { nodes: [], edges: [], filteredSnapshots: [] }

    // Create a map of snapshot ID to snapshot
    const snapshotMap = new Map<string | number, Snapshot>()
    snapshots.forEach((snapshot) => {
      snapshotMap.set(snapshot.id, snapshot)
    })

    // Map each snapshot to its branch (for coloring)
    const snapshotToBranch = new Map<string | number, string>()
    
    // First, find all branch heads and trace their paths
    branches.forEach(branch => {
      // Find the head snapshot for this branch
      const headSnapshot = snapshots.find(s => s.branches.includes(branch.name))
      if (!headSnapshot) return
      
      // Trace the parent chain from head until we hit another branch or root
      let current = headSnapshot
      const visited = new Set<string | number>()
      
      while (current && !visited.has(current.id)) {
        visited.add(current.id)
        
        // If this snapshot already belongs to another branch, stop
        if (snapshotToBranch.has(current.id) && snapshotToBranch.get(current.id) !== branch.name) {
          break
        }
        
        // Assign this snapshot to the current branch
        snapshotToBranch.set(current.id, branch.name)
        
        // Move to parent
        if (current.parentId) {
          const parentSnapshot = snapshotMap.get(current.parentId)
          if (parentSnapshot) {
            current = parentSnapshot
          } else {
            break
          }
        } else {
          break
        }
      }
    })

    // Filter snapshots based on selected branches
    const shouldShowSnapshot = (snapshot: Snapshot) => {
      if (selectedBranches.has("All")) return true
      
      // Show snapshot if it belongs to any selected branch OR if it has no branch assigned
      const assignedBranch = snapshotToBranch.get(snapshot.id)
      return assignedBranch ? selectedBranches.has(assignedBranch) : selectedBranches.size > 0
    }

    // Filter snapshots and maintain parent-child relationships
    const filtered = snapshots.filter(shouldShowSnapshot)
    
    // Sort snapshots by timestamp (newest first for display)
    const sortedSnapshots = [...filtered].sort((a, b) => b.timestamp - a.timestamp)

    // Find all connected components (trees) from filtered snapshots
    const connectedComponents: Set<Snapshot>[] = []
    const visited = new Set<string | number>()

    const dfs = (snapshot: Snapshot, component: Set<Snapshot>) => {
      if (visited.has(snapshot.id)) return
      visited.add(snapshot.id)
      component.add(snapshot)

      // Add all children that are in filtered set
      filtered
        .filter(s => s.parentId === snapshot.id)
        .forEach(child => dfs(child, component))

      // Add parent if exists and is in filtered set
      if (snapshot.parentId && snapshotMap.has(snapshot.parentId)) {
        const parent = snapshotMap.get(snapshot.parentId)!
        if (filtered.includes(parent)) {
          dfs(parent, component)
        }
      }
    }

    // Build connected components from filtered snapshots
    for (const snapshot of filtered) {
      if (!visited.has(snapshot.id)) {
        const component = new Set<Snapshot>()
        dfs(snapshot, component)
        connectedComponents.push(component)
      }
    }

    // Sort components by their earliest snapshot (for consistent ordering)
    connectedComponents.sort((a, b) => {
      const earliestA = Math.min(...Array.from(a).map(s => s.timestamp))
      const earliestB = Math.min(...Array.from(b).map(s => s.timestamp))
      return earliestA - earliestB
    })

    // Create a global branch to color mapping
    const branchToColor = new Map<string, string>()
    branches.forEach(branch => {
      branchToColor.set(branch.name, branch.color)
    })

    // Assign column ranges for each component
    let currentColumn = 0
    const snapshotToColumn = new Map<string | number, number>()

    connectedComponents.forEach(component => {
      const componentArray = Array.from(component)

      // Within each component, assign columns based on branch relationships
      const branchPaths = new Map<string, number>()
      let nextColumnInComponent = currentColumn

      // Sort snapshots in component by timestamp (oldest first for path building)
      const sortedComponent = componentArray.sort((a, b) => a.timestamp - b.timestamp)

      // Build branch paths within this component
      for (const snapshot of sortedComponent) {
        // Get the branch this snapshot belongs to
        const assignedBranch = snapshotToBranch.get(snapshot.id)
        
        if (assignedBranch) {
          // If this is a new branch in this component
          if (!branchPaths.has(assignedBranch)) {
            branchPaths.set(assignedBranch, nextColumnInComponent)
            nextColumnInComponent++
          }
          snapshotToColumn.set(snapshot.id, branchPaths.get(assignedBranch)!)
        } else {
          // For snapshots without branches, assign to the current component's default column
          snapshotToColumn.set(snapshot.id, currentColumn)
        }
      }

      currentColumn = nextColumnInComponent + 1 // Add gap between components
    })

    // Create nodes with positioning
    const nodes: GraphNode[] = []

    sortedSnapshots.forEach((snapshot, rowIndex) => {
      const column = snapshotToColumn.get(snapshot.id) || 0
      
      // Get branch info for this snapshot
      const assignedBranch = snapshotToBranch.get(snapshot.id)
      const isHeadOfBranch = snapshot.branches.length > 0
      
      let branchColor = "#757575" // default gray for no branch
      let branchName = "no branch"
      
      if (assignedBranch) {
        branchColor = branchToColor.get(assignedBranch) || "#757575"
        branchName = assignedBranch
      }

      // Check if this is a branch head (has branch tag)
      const isBranchHead = isHeadOfBranch

      // Check if this is the latest snapshot overall
      const isLatest = rowIndex === 0

      // Create short ID for display
      const shortId = String(snapshot.id).length > 8 
        ? String(snapshot.id).substring(0, 8)
        : String(snapshot.id)

      const node: GraphNode = {
        snapshot,
        x: column * 24 + 20, // Match SVG coordinate system
        y: rowIndex * 56 + 28, // Match row height and center
        column,
        branchColor,
        branchName,
        isLatest,
        isBranchHead,
        shortId,
      }

      nodes.push(node)
    })

    // Create edges - ONLY for actual parent-child relationships in filtered set
    const edges: GraphEdge[] = []
    nodes.forEach(childNode => {
      if (childNode.snapshot.parentId) {
        // Find the parent node by matching snapshot IDs in filtered nodes
        const parentNode = nodes.find(n => n.snapshot.id === childNode.snapshot.parentId)
        
        if (parentNode) {
          // Verify this is a real parent-child relationship
          const actualParent = snapshotMap.get(childNode.snapshot.parentId)
          if (actualParent && actualParent.id === parentNode.snapshot.id) {
            edges.push({
              from: parentNode,
              to: childNode,
              color: childNode.branchColor,
              fromColumn: parentNode.column,
              toColumn: childNode.column,
            })
          }
        }
      }
    })

    return { nodes, edges, filteredSnapshots: sortedSnapshots }
  }, [snapshots, branches, selectedBranches])

  const formatDate = (timestamp: number) => {
    const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp
    const date = new Date(timestampMs)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date)
  }

  const getOperationType = (summary?: Record<string, string>): string => {
    if (!summary) return "unknown"
    return summary.operation || "unknown"
  }

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node)
    // Reset manifest state when selecting a new node
    setIsManifestExpanded(false)
    setManifestList(null)
  }

  const handleManifestExpand = async () => {
    if (!selectedNode) return

    if (isManifestExpanded) {
      setIsManifestExpanded(false)
      return
    }

    if (!manifestList) {
      setLoadingManifest(true)
      try {
        const data = await getManifestList(
          catalog,
          namespace,
          table,
          selectedNode.snapshot.id
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
    setIsManifestExpanded(true)
  }

  const handleTimeTravel = (snapshot: Snapshot) => {
    const query = `-- time travel to snapshot with id ${snapshot.id}\nSELECT * FROM \`${catalog}\`.\`${namespace}\`.\`${table}\` VERSION AS OF ${snapshot.id} LIMIT 100;`
    const encodedQuery = encodeURIComponent(query)
    router.push(`/data/sql-editor?initialQuery=${encodedQuery}`)
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <GitCommit className="mb-4 h-12 w-12 text-muted-foreground/20" />
        <p className="text-sm font-medium">No snapshots to display</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Branch filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-muted-foreground">Branches:</div>
        <Button
          variant={selectedBranches.has("All") ? "default" : "outline"}
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={() => handleBranchFilter("All")}
        >
          All
        </Button>
        {branches.map((branch) => (
          <Button
            key={branch.name}
            variant={selectedBranches.has(branch.name) ? "default" : "outline"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => handleBranchFilter(branch.name)}
            style={{ 
              backgroundColor: selectedBranches.has(branch.name) ? branch.color : undefined,
              borderColor: branch.color,
              color: selectedBranches.has(branch.name) ? "white" : branch.color
            }}
          >
            <div 
              className="h-2 w-2 rounded-full mr-1.5" 
              style={{ backgroundColor: selectedBranches.has(branch.name) ? "white" : branch.color }}
            />
            {branch.name}
          </Button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border bg-background shadow-sm">
        <div className="h-[calc(100vh-400px)] overflow-auto">
          {nodes.length > 0 ? (
            <div className="relative">
              {/* Header */}
              <div className="sticky top-0 z-20 flex items-center border-b bg-background px-4 py-3 text-sm font-medium text-muted-foreground">
                <div className="w-[200px] flex-shrink-0">Graph</div>
                <div className="w-[400px] flex-shrink-0">Message</div>
                <div className="w-[140px] flex-shrink-0">Date</div>
                <div className="flex-1">Snapshot ID</div>
              </div>

              {/* Rows */}
              <div className="relative">
                {/* Single SVG overlay for all connections */}
                <svg 
                  className="absolute top-0 left-4 pointer-events-none"
                  width="200" 
                  height={filteredSnapshots.length * 56}
                  style={{ zIndex: 1 }}
                >
                  {/* Draw vertical guides for each column */}
                  {Array.from(new Set(nodes.map(n => n.column))).map(column => (
                    <line
                      key={`guide-${column}`}
                      x1={column * 24 + 20}
                      y1={0}
                      x2={column * 24 + 20}
                      y2={filteredSnapshots.length * 56}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      opacity="0.2"
                    />
                  ))}
                  
                  {/* Draw all connections */}
                  {edges.map((edge, edgeIndex) => {
                    const fromRowIndex = filteredSnapshots.findIndex(s => s.id === edge.from.snapshot.id)
                    const toRowIndex = filteredSnapshots.findIndex(s => s.id === edge.to.snapshot.id)
                    
                    if (fromRowIndex === -1 || toRowIndex === -1) return null
                    
                    // Use the actual node coordinates for consistency
                    const fromY = edge.from.y
                    const toY = edge.to.y
                    const fromX = edge.from.x
                    const toX = edge.to.x
                    
                    if (edge.fromColumn === edge.toColumn) {
                      // Straight vertical line
                      return (
                        <line
                          key={`edge-${edgeIndex}`}
                          x1={fromX}
                          y1={fromY}
                          x2={toX}
                          y2={toY}
                          stroke={edge.color}
                          strokeWidth="2"
                          opacity="0.8"
                        />
                      )
                    } else {
                      // Curved line for branch merges/diverges
                      const controlY = Math.abs(toY - fromY) < 56 ? 
                        (fromY + toY) / 2 : // Short distance, simple curve
                        fromY + (toY - fromY) * 0.6 // Longer distance, more pronounced curve
                      
                      return (
                        <path
                          key={`edge-${edgeIndex}`}
                          d={`M ${fromX},${fromY} Q ${fromX},${controlY} ${toX},${toY}`}
                          stroke={edge.color}
                          strokeWidth="2"
                          fill="none"
                          opacity="0.8"
                        />
                      )
                    }
                  })}
                </svg>

                {filteredSnapshots.map((snapshot, rowIndex) => {
                  const node = nodes.find(n => n.snapshot.id === snapshot.id)
                  if (!node) return null

                  const operationType = getOperationType(snapshot.summary)
                  
                  return (
                    <div
                      key={snapshot.id}
                      className={`group flex items-center border-b px-4 py-3 transition-colors hover:bg-muted/20 cursor-pointer relative ${
                        selectedNode?.snapshot.id === snapshot.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                      }`}
                      style={{ height: '56px' }}
                      onClick={() => handleNodeClick(node)}
                    >
                      {/* Graph column */}
                      <div className="w-[200px] flex-shrink-0 relative h-full">
                        {/* Node circle */}
                        <div
                          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                          style={{ 
                            backgroundColor: node.branchColor,
                            left: node.x - 8, // Center the 16px circle on the x coordinate
                            top: '12px',
                            zIndex: 10
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleNodeClick(node)
                          }}
                        >
                          {node.isBranchHead && (
                            <GitBranch className="w-2 h-2 text-white ml-0.5 mt-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Message column */}
                      <div className="w-[400px] flex-shrink-0 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {/* Operation indicator */}
                          <div 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: {
                                append: "#22c55e",
                                delete: "#ef4444", 
                                overwrite: "#f59e0b",
                                replace: "#3b82f6",
                                unknown: "#6b7280"
                              }[operationType] || "#6b7280"
                            }}
                          />
                          <span className="text-sm font-medium capitalize">{operationType}</span>
                        </div>
                        
                        {/* Branch/Tag badges */}
                        <div className="flex items-center gap-1">
                          {node.isBranchHead && (
                            <Badge 
                              className="text-xs px-1.5 py-0 text-white border-0"
                              style={{ backgroundColor: node.branchColor }}
                            >
                              <GitBranch className="w-2 h-2 mr-1" />
                              {node.branchName}
                            </Badge>
                          )}
                          
                          {snapshot.tags.map((tag) => (
                            <Badge
                              key={tag}
                              className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0 border-0"
                            >
                              <Tag className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          
                          {node.isLatest && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs px-1.5 py-0 border-0">
                              latest
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Summary info */}
                      {snapshot.summary && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {Object.entries(snapshot.summary)
                            .filter(([key]) => key !== 'operation')
                            .slice(0, 2)
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(', ')
                          }
                        </div>
                      )}
                    </div>

                    {/* Date column */}
                    <div className="w-[140px] flex-shrink-0 text-sm text-muted-foreground">
                      {formatDate(snapshot.timestamp)}
                    </div>

                    {/* Snapshot ID column */}
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {String(snapshot.id)}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTimeTravel(snapshot)
                            }}
                          >
                            <Clock className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Time travel to this snapshot</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(String(snapshot.id))
                              toast({
                                title: "Copied!",
                                description: "Snapshot ID copied to clipboard",
                              })
                            }}
                          >
                            <FileText className="w-3 h-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copy full snapshot ID</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <GitCommit className="mb-4 h-12 w-12 text-muted-foreground/20" />
              <p className="text-sm font-medium">No snapshots match the selected branches</p>
            </div>
          )}
        </div>
      </div>

      {/* Selected node details panel */}
      {selectedNode && (
        <Card className="mt-4 border-muted/70 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Snapshot Details</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedNode(null)
                  setIsManifestExpanded(false)
                  setManifestList(null)
                }}
              >
                ×
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Snapshot ID:</span>
                <p className="font-mono text-xs mt-1 break-all">{String(selectedNode.snapshot.id)}</p>
              </div>
              {selectedNode.snapshot.parentId && (
                <div>
                  <span className="font-medium text-muted-foreground">Parent ID:</span>
                  <p className="font-mono text-xs mt-1 break-all">{String(selectedNode.snapshot.parentId)}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-muted-foreground">Branch:</span>
                <p style={{ color: selectedNode.branchColor }}>
                  {selectedNode.branchName}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Operation:</span>
                <p>{getOperationType(selectedNode.snapshot.summary)}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Date:</span>
                <p>{formatDate(selectedNode.snapshot.timestamp)}</p>
              </div>
            </div>
            {selectedNode.snapshot.tags.length > 0 && (
              <div className="mt-3">
                <span className="font-medium text-muted-foreground text-sm">Tags:</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {selectedNode.snapshot.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-amber-100 text-amber-800 text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                onClick={() => handleTimeTravel(selectedNode.snapshot)}
              >
                <Clock className="w-4 h-4 mr-1" />
                Time Travel to this Snapshot
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleManifestExpand}
                disabled={loadingManifest}
              >
                {isManifestExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1" />
                )}
                {loadingManifest ? "Loading..." : "Manifests"}
              </Button>
            </div>

            {/* Manifest list expansion */}
            {isManifestExpanded && (
              <div className="mt-4 border-t pt-4">
                {loadingManifest ? (
                  <div className="text-sm text-muted-foreground">
                    Loading manifest list...
                  </div>
                ) : manifestList ? (
                  <div className="space-y-4">
                    <div className="text-sm font-medium">Manifest List</div>
                    <div className="text-xs text-muted-foreground">
                      Location: {manifestList.manifest_list_location}
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {manifestList.manifests.map((manifest, index) => (
                        <ManifestItem
                          key={index}
                          manifest={manifest}
                          index={index}
                          catalog={catalog}
                          namespace={namespace}
                          table={table}
                          snapshotId={selectedNode.snapshot.id}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Failed to load manifest list
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
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
