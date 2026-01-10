import { ArrowRight, Clock, GitCompare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import Link from "next/link"

import { OverviewContext } from "./OverviewProvider"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueries } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { getTableInfo } from "@/lib/client"
import { useContext, useMemo, useState } from "react"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { DEMO_TABLE_METADATA, getDemoTableKey } from "@/lib/demo-data"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ActivityFeed() {
  const { tables, isLoading: isLoadingTables } = useContext(OverviewContext)
  const { demoMode } = useDemoMode()
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "all">("30d")
  const onTimeRangeChange = (v: string) => {
    if (v === "7d" || v === "30d" || v === "all") setTimeRange(v)
  }

  const compactionQueries = useQueries({
    queries: tables.map((table) => ({
      queryKey: [
        "compactionHistory",
        table?.table,
        table?.catalog,
        table?.namespace,
      ],
      queryFn: () => {
        if (!table) return null
        if (demoMode) {
          const key = getDemoTableKey(
            table.catalog,
            table.namespace,
            table.table
          )
          const data = DEMO_TABLE_METADATA[key]
          return {
            data,
            table: table.table,
            catalog: table.catalog,
            namespace: table.namespace,
          }
        }
        return getTableInfo({
          path: {
            catalog: table.catalog,
            namespace: table.namespace,
            table: table.table,
          },
        }).then((res) => {
          return {
            data: res.data,
            table: table.table,
            catalog: table.catalog,
            namespace: table.namespace,
          }
        })
      },
      enabled: !!table,
    })),
  })

  const isLoading = compactionQueries.some((query) => query.isLoading)

  const compactionHistory = compactionQueries
    .filter((query) => query.data?.data?.metadata?.snapshots)
    .flatMap((query) => {
      const snapshots = query.data?.data?.metadata?.snapshots || []
      return snapshots
        .filter((snapshot) => snapshot.summary?.operation === "replace")
        .map((snapshot) => ({
          ...snapshot,
          table: query.data?.table,
          catalog: query.data?.catalog,
          namespace: query.data?.namespace,
          timestamp: snapshot["timestamp-ms"] || 0,
        }))
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 50)

  const filteredHistory = useMemo(() => {
    const now = Date.now()
    const windowMs =
      timeRange === "7d"
        ? 7 * 24 * 60 * 60 * 1000
        : timeRange === "30d"
          ? 30 * 24 * 60 * 60 * 1000
          : null
    const withinWindow = (ts: number) => {
      if (!windowMs) return true
      const ms = ts < 1e12 ? ts * 1000 : ts
      return now - ms <= windowMs
    }
    return compactionHistory
      .filter((a) => withinWindow(a.timestamp))
      .slice(0, 5)
  }, [compactionHistory, timeRange])

  if (isLoadingTables || isLoading) {
    return (
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-normal text-card-foreground">
              Recent Activity
            </h2>
          </div>
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-9 w-9 rounded-md" />
              <div className="min-w-0 flex-1">
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (compactionHistory.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-normal text-card-foreground">
              Recent Activity
            </h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-medium text-card-foreground">
            No recent activity
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Run an optimization or schedule tasks to see activity here.
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/optimization">
              <Button variant="outline" className="bg-card border-input">
                Open optimization
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline" className="bg-card border-input">
                Configure tasks
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-normal text-card-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="h-8 w-[120px] bg-card border-input">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-primary hover:text-primary! hover:bg-muted/50"
          >
            <Link
              href="/dashboard/activity"
              className="text-primary hover:text-primary"
            >
              View all
            </Link>
          </Button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {filteredHistory.map((activity, index) => (
          <div
            key={index}
            className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50 transition-colors"
          >
            <div className="rounded-md bg-green-100 p-2 text-green-600">
              <GitCompare className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-normal">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-card-foreground truncate">
                      {activity?.catalog}.{activity?.namespace}.
                      {activity?.table}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {activity?.catalog}.{activity?.namespace}.
                      {activity?.table}
                    </p>
                  </TooltipContent>
                </Tooltip>
                <span className="text-muted-foreground shrink-0">
                  — Compaction job completed
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(
                  new Date(
                    activity.timestamp < 1e12
                      ? activity.timestamp * 1000
                      : activity.timestamp
                  ),
                  {
                    addSuffix: true,
                    locale: enUS,
                  }
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary hover:text-primary! hover:bg-muted/50"
            >
              <Link
                href={`/data/tables/table?catalog=${activity.catalog}&namespace=${activity.namespace}&table=${activity.table}`}
                className="text-primary hover:text-primary"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
