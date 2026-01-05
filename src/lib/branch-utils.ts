/*
 * Copyright 2026 Nimtable
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

export interface SnapshotWithBranch {
  id: string | number
  parentId?: string | number
  timestamp: number
  branches: string[]
  tags: string[]
  [key: string]: any
}

export interface BranchInfo {
  name: string
  color: string
}

/**
 * Extract all unique branch names from snapshots
 */
export function extractBranches(snapshots: SnapshotWithBranch[]): string[] {
  const branchSet = new Set<string>()
  snapshots.forEach((snapshot) => {
    snapshot.branches.forEach((branch) => branchSet.add(branch))
  })
  return Array.from(branchSet).sort()
}

/**
 * Generate color for a branch based on its index and name
 */
export function generateBranchColor(index: number, name: string): string {
  // Predefined colors for common branches
  const predefinedColors = [
    "#4ade80", // green (for main/master)
    "#f59e0b", // amber
    "#3b82f6", // blue
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#ec4899", // pink
    "#10b981", // emerald
    "#6366f1", // indigo
    "#14b8a6", // teal
    "#eab308", // yellow
    "#d946ef", // fuchsia
    "#f43f5e", // rose
    "#607D8B", // blue grey
    "#E91E63", // pink
  ]

  if (index < predefinedColors.length) {
    return predefinedColors[index]
  }

  // For additional branches, generate colors based on hash of name
  const hash = name.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}

/**
 * Create branch info objects with colors
 */
export function createBranchInfos(branchNames: string[]): BranchInfo[] {
  return branchNames.map((branch, index) => ({
    name: branch,
    color: generateBranchColor(index, branch),
  }))
}

/**
 * Map each snapshot to its primary branch using branch tracing logic.
 * This is the core algorithm that both BranchView and SnapshotTrend use.
 */
export function mapSnapshotsToBranches(
  snapshots: SnapshotWithBranch[],
  branchNames: string[]
): Map<string | number, string> {
  if (snapshots.length === 0) {
    return new Map()
  }

  // Create a map of snapshot ID to snapshot for quick lookup
  const snapshotMap = new Map<string | number, SnapshotWithBranch>()
  snapshots.forEach((snapshot) => {
    snapshotMap.set(snapshot.id, snapshot)
  })

  // Map each snapshot to its branch (for coloring and filtering)
  const snapshotToBranch = new Map<string | number, string>()

  // First, find all branch heads and trace their paths
  branchNames.forEach((branchName) => {
    // Find the head snapshot for this branch
    const headSnapshot = snapshots.find((s) => s.branches.includes(branchName))
    if (!headSnapshot) return

    // Trace the parent chain from head until we hit another branch or root
    let current = headSnapshot
    const visited = new Set<string | number>()

    while (current && !visited.has(current.id)) {
      visited.add(current.id)

      // If this snapshot already belongs to another branch, stop
      if (
        snapshotToBranch.has(current.id) &&
        snapshotToBranch.get(current.id) !== branchName
      ) {
        break
      }

      // Assign this snapshot to the current branch
      snapshotToBranch.set(current.id, branchName)

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

  return snapshotToBranch
}

/**
 * Filter snapshots based on selected branches
 */
export function filterSnapshotsByBranches(
  snapshots: SnapshotWithBranch[],
  selectedBranches: Set<string>,
  snapshotToBranch: Map<string | number, string>
): SnapshotWithBranch[] {
  const shouldShowSnapshot = (snapshot: SnapshotWithBranch) => {
    if (selectedBranches.has("All")) return true

    // Show snapshot if it belongs to any selected branch OR if it has no branch assigned
    const assignedBranch = snapshotToBranch.get(snapshot.id)
    return assignedBranch
      ? selectedBranches.has(assignedBranch)
      : selectedBranches.size > 0
  }

  return snapshots.filter(shouldShowSnapshot)
}

/**
 * Filter snapshots by a single branch (used in SnapshotTrend)
 */
export function filterSnapshotsByBranch(
  snapshots: SnapshotWithBranch[],
  selectedBranch: string,
  snapshotToBranch: Map<string | number, string>
): SnapshotWithBranch[] {
  if (selectedBranch === "All" || !selectedBranch) {
    return snapshots
  }

  return snapshots.filter((snapshot) => {
    const assignedBranch = snapshotToBranch.get(snapshot.id)
    return assignedBranch === selectedBranch
  })
}

/**
 * Complete branch analysis for a set of snapshots
 */
export function analyzeBranches(snapshots: SnapshotWithBranch[]) {
  const branchNames = extractBranches(snapshots)
  const branchInfos = createBranchInfos(branchNames)
  const snapshotToBranch = mapSnapshotsToBranches(snapshots, branchNames)

  return {
    branchNames,
    branchInfos,
    snapshotToBranch,
    filterByBranches: (selectedBranches: Set<string>) =>
      filterSnapshotsByBranches(snapshots, selectedBranches, snapshotToBranch),
    filterByBranch: (selectedBranch: string) =>
      filterSnapshotsByBranch(snapshots, selectedBranch, snapshotToBranch),
  }
}
