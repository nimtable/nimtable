"use client"
import { getOptimizationRecommendation } from "@/components/table/file-distribution"
import { OverviewContext } from "./OverviewProvider"
import { Database, GitCompare } from "lucide-react"
import { useContext } from "react"

export function MetricsSummary() {
  const { tables, isFileDistributionLoading } = useContext(OverviewContext)

  const tablesNeedingCompaction = tables
    .map((table) => table && getOptimizationRecommendation(table))
    .filter((item) => item?.shouldOptimize)

  return (
    <div className="grid grid-cols-2 gap-6">
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
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-normal text-muted-foreground uppercase tracking-wider">
              Tables Needing Compaction
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
      {/* {metrics.map((metric, index) => (
        <div key={index} className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                {metric.title}
              </p>
              <p className="text-3xl font-semibold mt-2">{metric.value}</p>
              <p
                className={`text-xs mt-2 ${
                  metric.changeType === "positive"
                    ? "text-green-600"
                    : metric.changeType === "negative"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {metric.change}
              </p>
            </div>
            <div className={`${metric.color} p-3 rounded-md text-white`}>
              <metric.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))} */}
    </div>
  )
}
