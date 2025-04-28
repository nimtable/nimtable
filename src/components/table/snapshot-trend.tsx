/*
 * Copyright 2025 Nimtable
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

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { getFileDistribution } from "@/lib/data-loader"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SnapshotTrendProps {
    catalog: string
    namespace: string
    table: string
    snapshots: Array<{
        id: string | number
        timestamp: number
    }>
}

type TrendType = "size" | "records" | "files"
type TimeGranularity = "snapshot" | "day" | "week" | "month" | "quarter" | "year"

export function SnapshotTrend({ catalog, namespace, table, snapshots }: SnapshotTrendProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [trendType, setTrendType] = useState<TrendType>("size")
    const [granularity, setGranularity] = useState<TimeGranularity>("snapshot")
    const [data, setData] = useState<Array<{
        timestamp: number
        dataSize: number
        recordCount: number
        fileCount: number
    }>>([])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const results = await Promise.all(
                snapshots.map(async (snapshot) => {
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
                        fileCount: distribution.dataFileCount
                    }
                })
            )
            setData(results.sort((a, b) => a.timestamp - b.timestamp))
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Failed to fetch snapshot data",
                description: errorToString(error),
            })
        } finally {
            setLoading(false)
        }
    }, [catalog, namespace, table, snapshots, toast])

    useEffect(() => {
        if (snapshots.length > 0) {
            fetchData()
        }
    }, [snapshots, fetchData])

    const getAggregatedData = () => {
        if (data.length === 0) return []

        if (granularity === "snapshot") {
            return data
        }

        const grouped = new Map<string, { timestamp: number, dataSize: number, recordCount: number, fileCount: number }>()
        data.forEach(item => {
            const date = new Date(item.timestamp)
            let key: string
            let timestamp: number

            switch (granularity) {
                case "day":
                    key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
                    timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
                    break
                case "week":
                    const weekStart = new Date(date)
                    weekStart.setDate(date.getDate() - date.getDay())
                    key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`
                    timestamp = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).getTime()
                    break
                case "month":
                    key = `${date.getFullYear()}-${date.getMonth() + 1}`
                    timestamp = new Date(date.getFullYear(), date.getMonth(), 1).getTime()
                    break
                case "quarter":
                    const quarter = Math.floor(date.getMonth() / 3)
                    key = `${date.getFullYear()}-Q${quarter + 1}`
                    timestamp = new Date(date.getFullYear(), quarter * 3, 1).getTime()
                    break
                case "year":
                    key = `${date.getFullYear()}`
                    timestamp = new Date(date.getFullYear(), 0, 1).getTime()
                    break
            }

            if (!grouped.has(key) || item.timestamp > grouped.get(key)!.timestamp) {
                grouped.set(key, {
                    timestamp: item.timestamp,
                    dataSize: item.dataSize,
                    recordCount: item.recordCount,
                    fileCount: item.fileCount
                })
            }
        })

        return Array.from(grouped.values()).sort((a, b) => a.timestamp - b.timestamp)
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const formatChartDate = (timestamp: number) => {
        const date = new Date(timestamp)
        switch (granularity) {
            case "snapshot":
                return date.toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            case "day":
                return date.toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric'
                })
            case "week":
                return `Week ${Math.ceil(date.getDate() / 7)}`
            case "month":
                return date.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short'
                })
            case "quarter":
                return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
            case "year":
                return date.getFullYear().toString()
        }
    }

    const formatSize = (bytes: number) => {
        const units = ['B', 'KB', 'MB', 'GB', 'TB']
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

    if (loading) {
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

    const getDescription = () => {
        switch (trendType) {
            case "size":
                return "Historical data size changes over time"
            case "records":
                return "Historical record count changes over time"
            case "files":
                return "Historical file count changes over time"
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
                    <div>
                        <CardTitle className="text-base">Snapshot Trend</CardTitle>
                        <CardDescription>{getDescription()}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select value={granularity} onValueChange={(value: TimeGranularity) => setGranularity(value)}>
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
                        <ToggleGroup
                            type="single"
                            value={trendType}
                            onValueChange={(value: TrendType) => setTrendType(value)}
                        >
                            <ToggleGroupItem value="size" aria-label="Show size trend">
                                Size
                            </ToggleGroupItem>
                            <ToggleGroupItem value="records" aria-label="Show record trend">
                                Records
                            </ToggleGroupItem>
                            <ToggleGroupItem value="files" aria-label="Show file trend">
                                Files
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={aggregatedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                            formatter={(value: number) => getFormatter()(value)}
                            labelFormatter={(label: number) => formatDate(label)}
                        />
                        <Line
                            type="monotone"
                            dataKey={getDataKey()}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
} 