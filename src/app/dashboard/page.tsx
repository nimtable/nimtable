"use client"

import { OverviewContext } from "./OverviewProvider"
import { TableWatchlist } from "./TableWatchlist"
import { ActivityFeed } from "./ActivityFeed"
import { useContext } from "react"
import { ConnectCatalogStep } from "@/components/onboarding/connect-catalog-step"
import { Button } from "@/components/ui/button"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { LayoutGrid } from "lucide-react"
import { DashboardKpiGrid } from "./DashboardKpiGrid"
import { DashboardQuickActions } from "./DashboardQuickActions"
import { DashboardRunningJobs } from "./DashboardRunningJobs"
import { DashboardInsights } from "./DashboardInsights"
import { DashboardWhatsChanged } from "./DashboardWhatsChanged"
import { DashboardDataDashboards } from "./DashboardDataDashboards"
import {
  computeHealthScoreDetails,
  getTablesNeedingCompaction,
} from "./dashboard-health"
import { getScheduledTasks, type ScheduledTask } from "@/lib/client"
import { useQuery } from "@tanstack/react-query"

export default function DashboardPage() {
  const { isLoading, isFileDistributionLoading, tables, refresh } =
    useContext(OverviewContext)
  const { enable: enableDemo, demoMode } = useDemoMode()
  const definedTables = tables.filter((t): t is NonNullable<typeof t> =>
    Boolean(t)
  )
  const tablesNeedingCompaction = getTablesNeedingCompaction(definedTables)

  const { data: scheduledTasks } = useQuery<ScheduledTask[]>({
    queryKey: ["scheduled-tasks"],
    queryFn: async () => {
      const response = await getScheduledTasks()
      if (response.error) throw new Error("Failed to fetch scheduled tasks")
      return response.data || []
    },
    enabled: !demoMode, // demo mode already has local demo data in KPI card
  })

  const demoSnapshot = {
    taskFailures: 0,
    runningJobs: 1,
  }

  const taskFailures = demoMode
    ? demoSnapshot.taskFailures
    : (scheduledTasks ?? []).filter((t) => t.lastRunStatus === "FAILED").length
  const runningJobs = demoMode
    ? demoSnapshot.runningJobs
    : (scheduledTasks ?? []).filter((t) => t.lastRunStatus === "RUNNING").length

  const health = computeHealthScoreDetails({
    totalTables: tables.length,
    tablesNeedingCompaction: tablesNeedingCompaction.length,
    failedTasks: taskFailures,
  })

  if (isLoading || isFileDistributionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Top bar (match Optimization layout style) */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-card-foreground" />
              <h2 className="text-base font-normal text-card-foreground">
                Overview
              </h2>
            </div>
            {!demoMode && (
              <Button
                variant="outline"
                size="sm"
                className="bg-card border-input"
                onClick={() => {
                  enableDemo()
                  refresh()
                }}
              >
                Try Demo
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {demoMode
              ? "Demo mode is enabled"
              : "Connect a catalog to start monitoring your Iceberg lakehouse"}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto w-11/12">
            <ConnectCatalogStep
              onSuccess={() => {
                refresh()
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Top bar (match Optimization layout style) */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-card-foreground" />
          <h2 className="text-base font-normal text-card-foreground">
            Overview
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back to your Iceberg lakehouse control center
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="w-full space-y-6">
          <DashboardKpiGrid />
          <DashboardWhatsChanged
            snapshot={{
              healthScore: health.score,
              totalTables: tables.length,
              needsCompaction: tablesNeedingCompaction.length,
              taskFailures,
              runningJobs,
              totalDataBytes: definedTables.reduce(
                (s, t) => s + (t.dataFileSizeInBytes || 0),
                0
              ),
              totalDataRecords: definedTables.reduce(
                (s, t) => s + (t.dataFileRecordCount || 0),
                0
              ),
            }}
          />
          <DashboardDataDashboards />
          <DashboardQuickActions />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DashboardInsights />
            </div>
            <div className="lg:col-span-1">
              <DashboardRunningJobs />
            </div>
          </div>
          <ActivityFeed />
          <TableWatchlist />
        </div>
      </div>
    </div>
  )
}
