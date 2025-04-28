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

interface SnapshotTrendProps {
    catalog: string
    namespace: string
    table: string
    snapshots: Array<{
        id: string | number
        timestamp: number
    }>
}

type TrendType = "size" | "records"

export function SnapshotTrend({ catalog, namespace, table, snapshots }: SnapshotTrendProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [trendType, setTrendType] = useState<TrendType>("size")
    const [data, setData] = useState<Array<{
        timestamp: number
        dataSize: number
        recordCount: number
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
                        recordCount: distribution.dataFileRecordCount
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
        return new Date(timestamp).toLocaleDateString()
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

    return (
        <Card className="border-muted/70 shadow-sm">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-base">Snapshot Trend</CardTitle>
                        <CardDescription>
                            {trendType === "size" ? "Historical data size changes over time" : "Historical record count changes over time"}
                        </CardDescription>
                    </div>
                    <ToggleGroup
                        type="single"
                        value={trendType}
                        onValueChange={(value: TrendType) => setTrendType(value)}
                        className="ml-4"
                    >
                        <ToggleGroupItem value="size" aria-label="Show size trend">
                            Size
                        </ToggleGroupItem>
                        <ToggleGroupItem value="records" aria-label="Show record trend">
                            Records
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={formatChartDate}
                            tick={{ fontSize: 12 }}
                            padding={{ left: 20, right: 20 }}
                        />
                        <YAxis
                            tickFormatter={trendType === "size" ? formatSize : formatRecordCount}
                            tick={{ fontSize: 12 }}
                            width={100}
                            padding={{ top: 20, bottom: 20 }}
                        />
                        <Tooltip
                            formatter={(value: number) => trendType === "size" ? formatSize(value) : formatRecordCount(value)}
                            labelFormatter={(label: number) => formatDate(label)}
                        />
                        <Line
                            type="monotone"
                            dataKey={trendType === "size" ? "dataSize" : "recordCount"}
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