"use client"

import { Eye, Star } from "lucide-react"
import { useContext } from "react"

import { getCompactionRecommendation } from "@/components/table/file-distribution"
import { OverviewContext } from "./OverviewProvider"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function TableWatchlist() {
  const { tables, isFileDistributionLoading } = useContext(OverviewContext)

  const tablesNeedingCompaction = tables
    .map((table) => {
      if (table) {
        const recommendation = getCompactionRecommendation(table)
        return recommendation.shouldCompact ? table : null
      }
      return null
    })
    .filter((item) => item !== null)

  if (isFileDistributionLoading) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Watchlist</h2>
          </div>
        </div>
        <div className="divide-y">
          {[1, 2, 3].map((index) => (
            <div key={index} className="px-6 py-4">
              <div className="mb-2 flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-28" />
              </div>
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (tablesNeedingCompaction.length === 0) {
    return (
      <div className="rounded-lg border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Watchlist</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Star className="h-8 w-8 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-medium">
            No tables need compaction
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            All tables are in good condition
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold">Watchlist</h2>
        </div>
      </div>
      <div className="divide-y">
        {tablesNeedingCompaction.map((table, index) => (
          <div key={index} className="px-6 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-medium">{table.table}</h3>

              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 hover:bg-amber-200"
              >
                <span className="flex items-center pt-0.5">
                  Needs Compaction
                </span>
              </Badge>
            </div>

            <div className="mt-3 flex gap-2">
              {/* <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <GitCompare className="h-3 w-3" />
                Compact
              </Button> */}
              <Link
                href={`/data/tables/table?catalog=${table.catalog}&namespace=${table.namespace}&table=${table.table}`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
