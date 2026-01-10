"use client"

import Link from "next/link"
import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarClock, ExternalLink, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getScheduledTasks, type ScheduledTask } from "@/lib/client"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { summarizeScheduledTasks } from "./dashboard-health"

function formatWhen(dateString?: string) {
  if (!dateString) return "Unknown"
  const timestamp = typeof dateString === "string" ? parseFloat(dateString) : 0
  const ms = timestamp < 1e12 ? timestamp * 1000 : timestamp
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms))
}

function demoTasks(): ScheduledTask[] {
  const emptyParams = {} as ScheduledTask["parameters"]
  return [
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

export function DashboardRunningJobs() {
  const { demoMode } = useDemoMode()

  const { data: scheduledTasks, isLoading } = useQuery<ScheduledTask[]>({
    queryKey: ["scheduled-tasks", demoMode],
    queryFn: async () => {
      if (demoMode) return demoTasks()
      const res = await getScheduledTasks()
      if (res.error) throw new Error("Failed to fetch scheduled tasks")
      return res.data || []
    },
  })

  const summary = useMemo(
    () => summarizeScheduledTasks(scheduledTasks),
    [scheduledTasks]
  )

  const running = summary.running.slice(0, 5)

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-normal text-card-foreground">
            Running Jobs
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-primary !hover:text-primary hover:bg-muted/50"
        >
          <Link href="/jobs" className="flex items-center gap-1">
            View all
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading scheduled tasks…
          </div>
        ) : running.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground/50" />
            <h3 className="mt-2 text-sm font-medium text-card-foreground">
              No jobs running
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule optimizations to run automatically.
            </p>
            <Link href="/jobs" className="mt-4">
              <Button variant="outline" className="bg-card border-input">
                Configure scheduled tasks
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {running.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-normal text-card-foreground">
                      {task.taskName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      RUNNING
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">
                    {task.catalogName}.{task.namespace}.{task.tableName}
                  </div>
                </div>
                <div className="shrink-0 text-xs text-muted-foreground">
                  since {formatWhen(task.lastRunAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
