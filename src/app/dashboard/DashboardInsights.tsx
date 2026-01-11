"use client"

import Link from "next/link"
import { useContext, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { OverviewContext } from "./OverviewProvider"
import { getScheduledTasks, type ScheduledTask } from "@/lib/client"
import {
  getTablesNeedingCompaction,
  summarizeScheduledTasks,
} from "./dashboard-health"

export function DashboardInsights() {
  const { tables } = useContext(OverviewContext)

  const { data: scheduledTasks } = useQuery<ScheduledTask[]>({
    queryKey: ["scheduled-tasks"],
    queryFn: async () => {
      const res = await getScheduledTasks()
      if (res.error) throw new Error("Failed to fetch scheduled tasks")
      return res.data || []
    },
  })

  const tablesNeedingCompaction = useMemo(() => {
    const definedTables = tables.filter((t): t is NonNullable<typeof t> =>
      Boolean(t)
    )
    return getTablesNeedingCompaction(definedTables)
  }, [tables])

  const scheduledSummary = useMemo(
    () => summarizeScheduledTasks(scheduledTasks),
    [scheduledTasks]
  )

  const insights = useMemo(() => {
    const list: Array<{
      key: string
      title: string
      description: string
      tone: "good" | "warn"
      ctaHref: string
      ctaLabel: string
    }> = []

    if (tablesNeedingCompaction.length > 0) {
      list.push({
        key: "compaction",
        title: `${tablesNeedingCompaction.length} tables need compaction`,
        description:
          "Reduce small files and improve query performance with a quick optimization pass.",
        tone: "warn",
        ctaHref: "/optimization",
        ctaLabel: "Open optimization",
      })
    } else {
      list.push({
        key: "compaction-good",
        title: "Compaction backlog is clear",
        description: "No tables currently need compaction. Nice work.",
        tone: "good",
        ctaHref: "/optimization",
        ctaLabel: "Review tables",
      })
    }

    if (scheduledSummary.total.length === 0) {
      list.push({
        key: "no-tasks",
        title: "No scheduled tasks configured",
        description:
          "Automate compaction and retention with scheduled optimizations.",
        tone: "warn",
        ctaHref: "/jobs",
        ctaLabel: "Set up tasks",
      })
    } else if (scheduledSummary.failed.length > 0) {
      list.push({
        key: "failed-tasks",
        title: `${scheduledSummary.failed.length} scheduled tasks failing`,
        description:
          "Investigate recent failures to keep the lakehouse healthy.",
        tone: "warn",
        ctaHref: "/jobs",
        ctaLabel: "View failures",
      })
    } else {
      list.push({
        key: "tasks-good",
        title: "Scheduled tasks look healthy",
        description: `${scheduledSummary.enabled.length} tasks enabled. No failures detected.`,
        tone: "good",
        ctaHref: "/jobs",
        ctaLabel: "Manage tasks",
      })
    }

    return list.slice(0, 3)
  }, [scheduledSummary, tablesNeedingCompaction.length])

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-normal text-card-foreground">
            Insights
          </h2>
        </div>
      </div>
      <div className="divide-y divide-border">
        {insights.map((i) => (
          <div key={i.key} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {i.tone === "good" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <h3 className="text-sm font-normal text-card-foreground">
                    {i.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      i.tone === "good"
                        ? "text-xs bg-green-50 text-green-700 border-green-200"
                        : "text-xs bg-amber-50 text-amber-700 border-amber-200"
                    }
                  >
                    {i.tone === "good" ? "Healthy" : "Action"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {i.description}
                </p>
              </div>
              <Link href={i.ctaHref} className="shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card border-input hover:bg-muted/50"
                >
                  {i.ctaLabel}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
