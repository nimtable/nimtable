"use client"

import { useContext, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Activity, AlertCircle, Database, GitCompare, Info } from "lucide-react"

import { OverviewContext } from "./OverviewProvider"
import { getScheduledTasks, type ScheduledTask } from "@/lib/client"
import { useDemoMode } from "@/contexts/demo-mode-context"
import {
  computeHealthScoreDetails,
  getTablesNeedingCompaction,
  summarizeScheduledTasks,
} from "./dashboard-health"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

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
    queryKey: ["scheduled-tasks", demoMode],
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

  const health = useMemo(() => {
    return computeHealthScoreDetails({
      totalTables: tables.length,
      tablesNeedingCompaction: tablesNeedingCompaction.length,
      failedTasks: scheduledSummary.failed.length,
    })
  }, [tables.length, tablesNeedingCompaction.length, scheduledSummary.failed])

  const healthScore = health.score

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
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">{healthLabel}</p>
              {tablesNeedingCompaction.length === 0 &&
                scheduledSummary.failed.length === 0 && (
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-green-50 text-green-700 border-green-200"
                  >
                    All clear
                  </Badge>
                )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className="inline-flex items-center rounded border border-border bg-muted/20 px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/40"
                    aria-label="How this score is calculated"
                    type="button"
                  >
                    <Info className="mr-1 h-3 w-3" />
                    Why
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[320px]">
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">How we compute this score</div>
                    <div className="text-xs text-muted-foreground">
                      It’s a lightweight heuristic (no historical time series
                      required). We subtract penalties from 100.
                    </div>
                    <div className="text-xs">
                      <div className="flex items-center justify-between gap-4">
                        <span>Compaction backlog</span>
                        <span className="font-mono">
                          -{health.breakdown.backlogPenalty}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Task failures</span>
                        <span className="font-mono">
                          -{health.breakdown.failuresPenalty}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on {health.breakdown.totalTables} tables,{" "}
                      {health.breakdown.tablesNeedingCompaction} needing
                      compaction, and {health.breakdown.failedTasks} failing
                      tasks.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
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
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
