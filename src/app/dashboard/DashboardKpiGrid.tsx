"use client"

import { useContext, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Activity, AlertTriangle, Database, GitCompare } from "lucide-react"

import { OverviewContext } from "./OverviewProvider"
import { getScheduledTasks, type ScheduledTask } from "@/lib/client"
import { useDemoMode } from "@/contexts/demo-mode-context"
import {
  computeHealthScore,
  getTablesNeedingCompaction,
  summarizeScheduledTasks,
} from "./dashboard-health"

function demoScheduledTasks(): ScheduledTask[] {
  // Minimal demo tasks to make the dashboard feel alive in demo mode.
  const emptyParams = {} as ScheduledTask["parameters"]
  return [
    {
      id: 1,
      taskName: "daily-compaction",
      taskType: "OPTIMIZE",
      enabled: true,
      catalogName: "s3-tables-catalog-demo",
      namespace: "public",
      tableName: "t_compact",
      cronExpression: "0 2 * * *",
      cronDescription: "Every day at 2:00 AM",
      nextRunAt: String(Date.now() + 1000 * 60 * 30),
      lastRunAt: String(Date.now() - 1000 * 60 * 60 * 20),
      lastRunStatus: "SUCCESS",
      lastRunMessage: "Completed",
      createdAt: String(Date.now() - 1000 * 60 * 60 * 24 * 30),
      updatedAt: String(Date.now() - 1000 * 60 * 60 * 24),
      createdBy: "demo",
      parameters: emptyParams,
    },
    {
      id: 2,
      taskName: "hourly-snapshot-expiration",
      taskType: "OPTIMIZE",
      enabled: true,
      catalogName: "s3-tables-catalog-demo",
      namespace: "public",
      tableName: "datagen_t",
      cronExpression: "0 * * * *",
      cronDescription: "Every hour",
      nextRunAt: String(Date.now() + 1000 * 60 * 8),
      lastRunAt: String(Date.now() - 1000 * 60 * 5),
      lastRunStatus: "RUNNING",
      lastRunMessage: "In progress",
      createdAt: String(Date.now() - 1000 * 60 * 60 * 24 * 7),
      updatedAt: String(Date.now() - 1000 * 60 * 60),
      createdBy: "demo",
      parameters: emptyParams,
    },
  ]
}

export function DashboardKpiGrid() {
  const { tables, isFileDistributionLoading } = useContext(OverviewContext)
  const { demoMode } = useDemoMode()

  const { data: scheduledTasks, isLoading: isLoadingTasks } = useQuery<
    ScheduledTask[]
  >({
    queryKey: ["scheduled-tasks"],
    queryFn: async () => {
      if (demoMode) return demoScheduledTasks()
      const response = await getScheduledTasks()
      if (response.error) throw new Error("Failed to fetch scheduled tasks")
      return response.data || []
    },
  })

  const tablesNeedingCompaction = useMemo(() => {
    const definedTables = tables.filter(
      (t): t is NonNullable<typeof t> => Boolean(t)
    )
    return getTablesNeedingCompaction(definedTables)
  }, [tables])

  const scheduledSummary = useMemo(
    () => summarizeScheduledTasks(scheduledTasks),
    [scheduledTasks]
  )

  const healthScore = useMemo(() => {
    return computeHealthScore({
      totalTables: tables.length,
      tablesNeedingCompaction: tablesNeedingCompaction.length,
      failedTasks: scheduledSummary.failed.length,
    })
  }, [tables.length, tablesNeedingCompaction.length, scheduledSummary.failed])

  const healthLabel =
    healthScore >= 90
      ? "Excellent"
      : healthScore >= 75
        ? "Good"
        : healthScore >= 55
          ? "Fair"
          : "Needs attention"

  return (
    <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
      {/* Health */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
              Lakehouse Health
            </p>
            <p className="mt-2 text-2xl font-normal text-card-foreground">
              {healthScore}
              <span className="ml-2 text-sm text-muted-foreground">/ 100</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{healthLabel}</p>
          </div>
          <div className="rounded-md bg-primary p-2.5 text-primary-foreground">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Total tables */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
              Total Tables
            </p>
            <p className="mt-2 text-2xl font-normal text-card-foreground">
              {tables.length}
            </p>
          </div>
          <div className="rounded-md bg-primary p-2.5 text-primary-foreground">
            <Database className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Compaction backlog */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
              Needs Compaction
            </p>
            <div className="mt-2 text-2xl font-normal text-card-foreground">
              {isFileDistributionLoading ? (
                <div className="mt-4 h-4 w-16 animate-pulse rounded bg-muted" />
              ) : (
                tablesNeedingCompaction.length
              )}
            </div>
          </div>
          <div className="rounded-md bg-amber-500 p-2.5 text-white">
            <GitCompare className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Scheduled task failures */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
              Task Failures
            </p>
            <div className="mt-2 text-2xl font-normal text-card-foreground">
              {isLoadingTasks ? (
                <div className="mt-4 h-4 w-16 animate-pulse rounded bg-muted" />
              ) : (
                scheduledSummary.failed.length
              )}
            </div>
            {!isLoadingTasks && scheduledSummary.running.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {scheduledSummary.running.length} running
              </p>
            )}
          </div>
          <div className="rounded-md bg-red-500 p-2.5 text-white">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
