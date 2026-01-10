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

import type { ScheduledTask } from "@/lib/client"
import type { DistributionData } from "@/lib/data-loader"
import { getOptimizationRecommendation } from "@/components/table/file-distribution"

type OverviewTable = DistributionData & {
  table: string
  catalog: string
  namespace: string
}

export function getTablesNeedingCompaction(tables: OverviewTable[]) {
  return tables
    .map((table) => {
      const rec = getOptimizationRecommendation(table)
      return rec.shouldOptimize ? table : null
    })
    .filter((t): t is OverviewTable => t !== null)
}

export function computeHealthScore({
  totalTables,
  tablesNeedingCompaction,
  failedTasks,
}: {
  totalTables: number
  tablesNeedingCompaction: number
  failedTasks: number
}) {
  return computeHealthScoreDetails({
    totalTables,
    tablesNeedingCompaction,
    failedTasks,
  }).score
}

export function computeHealthScoreDetails({
  totalTables,
  tablesNeedingCompaction,
  failedTasks,
}: {
  totalTables: number
  tablesNeedingCompaction: number
  failedTasks: number
}) {
  // Lightweight heuristic (no backend history required):
  // - penalize compaction backlog (up to 45 points)
  // - penalize failed scheduled tasks (up to 35 points)
  // keep within [0, 100]
  const backlogRatio =
    totalTables > 0 ? tablesNeedingCompaction / totalTables : 0
  const backlogPenalty = Math.min(45, Math.round(backlogRatio * 60))
  const failuresPenalty = Math.min(35, failedTasks * 10)
  const raw = 100 - backlogPenalty - failuresPenalty
  const score = Math.max(0, Math.min(100, raw))
  return {
    score,
    breakdown: {
      backlogPenalty,
      failuresPenalty,
      totalTables,
      tablesNeedingCompaction,
      failedTasks,
    },
  }
}

export function summarizeScheduledTasks(tasks: ScheduledTask[] | undefined) {
  const t = tasks ?? []
  const running = t.filter((x) => x.lastRunStatus === "RUNNING")
  const failed = t.filter((x) => x.lastRunStatus === "FAILED")
  const enabled = t.filter((x) => x.enabled)
  return { running, failed, enabled, total: t }
}
