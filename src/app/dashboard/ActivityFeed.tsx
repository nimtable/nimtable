import { ArrowRight, Clock, GitCompare, Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { enUS } from "date-fns/locale"
import Link from "next/link"

import { OverviewContext } from "./OverviewProvider"
import { Skeleton } from "@/components/ui/skeleton"
import { useQueries } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { getTableInfo } from "@/lib/client"
import { useContext } from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ActivityFeed() {
  const { tables, isLoading: isLoadingTables } = useContext(OverviewContext)

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
    .slice(0, 5)

  if (isLoadingTables || isLoading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
        </div>
        <div className="divide-y">
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
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Star className="h-8 w-8 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-medium">No recent activity</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Recent Activity</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-sm">
          <Link href="/dashboard/activity">View all</Link>
        </Button>
      </div>
      <div className="divide-y">
        {compactionHistory.map((activity, index) => (
          <div key={index} className="flex items-center gap-4 px-6 py-4">
            <div className={`rounded-md bg-green-100 p-2 text-green-600`}>
              <GitCompare className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 font-medium">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-gray-900 truncate">
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
                <span className="text-gray-500 flex-shrink-0">
                  — Compaction job completed
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                  locale: enUS,
                })}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              <Link
                href={`/data/tables/table?catalog=${activity.catalog}&namespace=${activity.namespace}&table=${activity.table}`}
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
