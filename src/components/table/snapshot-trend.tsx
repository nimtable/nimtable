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
"use client"

import { useState, useMemo } from "react"
import { GitBranch, Info } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { getFileDistribution } from "@/lib/data-loader"
import { analyzeBranches, type SnapshotWithBranch } from "@/lib/branch-utils"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

interface SnapshotTrendProps {
  catalog: string
  namespace: string
  table: string
  snapshots: SnapshotWithBranch[]
}

type TrendType = "size" | "records" | "files"
type TimeGranularity =
  | "snapshot"
  | "day"
  | "week"
  | "month"
  | "quarter"
  | "year"

// Define the type for trend data
interface TrendDataPoint {
  timestamp: number
  dataSize: number
  recordCount: number
  fileCount: number
  isCompaction?: boolean
}

// ISO week helper
function getISOWeek(date: Date) {
  const tmp = new Date(date.getTime())
  tmp.setHours(0, 0, 0, 0)
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
  const week1 = new Date(tmp.getFullYear(), 0, 4)
  return (
    tmp.getFullYear() +
    "-W" +
    String(
      1 +
        Math.round(
          ((tmp.getTime() - week1.getTime()) / 86400000 -
            3 +
            ((week1.getDay() + 6) % 7)) /
            7
        )
    ).padStart(2, "0")
  )
}

export function SnapshotTrend({
  catalog,
  namespace,
  table,
  snapshots,
}: SnapshotTrendProps) {
  const [trendType, setTrendType] = useState<TrendType>("size")
  const [granularity, setGranularity] = useState<TimeGranularity>("snapshot")
  const [selectedBranch, setSelectedBranch] = useState<string>("main")

  // Use shared branch analysis logic
  const branchAnalysis = useMemo(() => analyzeBranches(snapshots), [snapshots])

  // Get all available branches from snapshots
  const availableBranches = branchAnalysis.branchNames

  // Ensure main branch is available and set as default
  useMemo(() => {
    if (availableBranches.length > 0 && !availableBranches.includes("main")) {
      setSelectedBranch(availableBranches[0])
    }
  }, [availableBranches])

  // Filter snapshots by selected branch using shared logic
  const filteredSnapshots = useMemo(() => {
    return branchAnalysis.filterByBranch(selectedBranch)
  }, [branchAnalysis, selectedBranch])

  const { data, isPending } = useQuery<TrendDataPoint[]>({
    queryKey: [
      "snapshot-distribution",
      catalog,
      namespace,
      table,
      filteredSnapshots,
      selectedBranch,
    ],
    queryFn: async () => {
      if (filteredSnapshots.length === 0) return []

      const results = await Promise.all(
        filteredSnapshots.map(async (snapshot) => {
          const distribution = await getFileDistribution(
            catalog,
            namespace,
            table,
            String(snapshot.id)
          )
          return {
            timestamp: snapshot.timestamp,
            dataSize: distribution.dataFileSizeInBytes,
            recordCount: distribution.dataFileRecordCount,
            fileCount: distribution.dataFileCount,
            isCompaction: snapshot.isCompaction,
          }
        })
      )
      return results.sort((a, b) => a.timestamp - b.timestamp)
    },
    enabled: filteredSnapshots.length > 0,
    meta: {
      errorMessage: "Failed to fetch snapshot trend data for the table.",
    },
  })

  const getAggregatedData = () => {
    if (!data || data.length === 0) return []

    if (granularity === "snapshot") {
      return data
    }

    const grouped = new Map<string, TrendDataPoint>()
    data.forEach((item) => {
      // If timestamp is in seconds (less than 1e12), convert to milliseconds
      const timestampMs =
        item.timestamp < 1e12 ? item.timestamp * 1000 : item.timestamp
      const date = new Date(timestampMs)
      let key: string

      switch (granularity) {
        case "day":
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
          break
        case "week": {
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`
          break
        }
        case "month":
          key = `${date.getFullYear()}-${date.getMonth() + 1}`
          break
        case "quarter": {
          const quarter = Math.floor(date.getMonth() / 3)
          key = `${date.getFullYear()}-Q${quarter + 1}`
          break
        }
        case "year":
          key = `${date.getFullYear()}`
          break
      }

      if (!grouped.has(key) || item.timestamp > grouped.get(key)!.timestamp) {
        grouped.set(key, {
          timestamp: item.timestamp,
          dataSize: item.dataSize,
          recordCount: item.recordCount,
          fileCount: item.fileCount,
          isCompaction: item.isCompaction,
        })
      }
    })

    return Array.from(grouped.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    )
  }

  const formatDate = (timestamp: number) => {
    // If timestamp is in seconds (less than 1e12), convert to milliseconds
    const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp
    return new Date(timestampMs).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const formatChartDate = (timestamp: number) => {
    // If timestamp is in seconds (less than 1e12), convert to milliseconds
    const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp
    const date = new Date(timestampMs)
    switch (granularity) {
      case "snapshot":
        return date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      case "day":
        return date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      case "week":
        return getISOWeek(date)
      case "month":
        return date.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
        })
      case "quarter":
        return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
      case "year":
        return date.getFullYear().toString()
    }
  }

  const formatSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const formatRecordCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const formatFileCount = (count: number) => {
    return count.toString()
  }

  if (isPending) {
    return (
      <Card className="border-muted/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Snapshot Trend</CardTitle>
          <CardDescription>Loading snapshot data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-4 w-48 bg-muted/50 rounded mb-2"></div>
            <div className="h-4 w-32 bg-muted/50 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (filteredSnapshots.length === 0) {
    return (
      <Card className="border-muted/70 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base">Snapshot Trend</CardTitle>
              <CardDescription>
                {selectedBranch && selectedBranch !== "All"
                  ? `No snapshots found for branch '${selectedBranch}'`
                  : "No snapshots found"}
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <Select
                value={selectedBranch}
                onValueChange={(value: string) => setSelectedBranch(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <GitBranch className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Branches</SelectItem>
                  {availableBranches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">No trend data available</p>
            <p className="text-xs mt-1">
              {availableBranches.length > 0
                ? "Try selecting a different branch above"
                : "This table has no snapshot history"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getDescription = () => {
    const branchText =
      selectedBranch && selectedBranch !== "All"
        ? ` for branch '${selectedBranch}'`
        : ""

    switch (trendType) {
      case "size":
        return `Historical data size changes over time${branchText}`
      case "records":
        return `Historical record count changes over time${branchText}`
      case "files":
        return `Historical file count changes over time${branchText}`
    }
  }

  const getDataKey = () => {
    switch (trendType) {
      case "size":
        return "dataSize"
      case "records":
        return "recordCount"
      case "files":
        return "fileCount"
    }
  }

  const getFormatter = () => {
    switch (trendType) {
      case "size":
        return formatSize
      case "records":
        return formatRecordCount
      case "files":
        return formatFileCount
    }
  }

  const aggregatedData = getAggregatedData()

  return (
    <Card className="border-muted/70 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-card-foreground">
              Snapshot Trend
            </h3>
            <div className="relative group">
              <Info className="w-4 h-4 text-muted-foreground hover:text-card-foreground cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                {getDescription()}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 pl-3 rounded-lg text-sm mr-auto">
            <button
              className={cn(
                "px-4 py-1.5 rounded-md text-foreground font-medium transition-colors",
                trendType === "size"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
              )}
              onClick={() => setTrendType("size")}
            >
              Size
            </button>
            <button
              className={cn(
                "px-4 py-1.5 rounded-md text-foreground font-medium transition-colors",
                trendType === "records"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
              )}
              onClick={() => setTrendType("records")}
            >
              Records
            </button>
            <button
              className={cn(
                "px-4 py-1.5 rounded-md text-foreground font-medium transition-colors",
                trendType === "files"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors"
              )}
              onClick={() => setTrendType("files")}
            >
              Files
            </button>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedBranch}
              onValueChange={(value: string) => setSelectedBranch(value)}
            >
              <SelectTrigger className="w-[140px]">
                <GitBranch className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Branches</SelectItem>
                {availableBranches.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={granularity}
              onValueChange={(value: TimeGranularity) => setGranularity(value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Time Granularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="snapshot">By Snapshot</SelectItem>
                <SelectItem value="day">By Day</SelectItem>
                <SelectItem value="week">By Week</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
                <SelectItem value="quarter">By Quarter</SelectItem>
                <SelectItem value="year">By Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={aggregatedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatChartDate}
              tick={{ fontSize: 12 }}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis
              tickFormatter={getFormatter()}
              tick={{ fontSize: 12 }}
              width={100}
              padding={{ top: 20, bottom: 20 }}
            />
            <Tooltip
              formatter={(value: number, _name: string, _props: any) => {
                const formattedValue = getFormatter()(value)
                return formattedValue
              }}
              labelFormatter={(label: number, payload: any) => {
                const data = payload[0]?.payload
                const date = formatDate(label)
                if (data?.isCompaction) {
                  return (
                    <div>
                      <div>{date}</div>
                      <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Compaction
                      </div>
                    </div>
                  )
                }
                return date
              }}
            />
            <Line
              type="monotone"
              dataKey={getDataKey()}
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
            {aggregatedData.map(
              (point, index) =>
                point.isCompaction && (
                  <ReferenceDot
                    key={index}
                    x={point.timestamp}
                    y={point[getDataKey()]}
                    r={4}
                    fill="#3b82f6"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
