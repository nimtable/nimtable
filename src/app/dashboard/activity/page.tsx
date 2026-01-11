"use client"

import { Clock, GitCompare, Search } from "lucide-react"
import { useContext, useState } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { OverviewContext } from "../OverviewProvider"
import { useQueries } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getTableInfo } from "@/lib/client"
import { formatDate } from "@/lib/format"

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const { tables } = useContext(OverviewContext)

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

  if (isLoading) {
    return <div>Loading...</div>
  }

  const compactionHistory = compactionQueries
    .filter((query) => {
      if (!query.data?.data?.metadata?.snapshots) return false

      if (searchQuery) {
        return query.data?.table
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase())
      }

      return true
    })
    .flatMap((query) => {
      const snapshots = query.data?.data?.metadata?.snapshots || []
      return snapshots.map((snapshot) => ({
        ...snapshot,
        table: query.data?.table,
        catalog: query.data?.catalog,
        namespace: query.data?.namespace,
        timestamp: snapshot["timestamp-ms"] || 0,
      }))
    })
    .sort((a, b) => b.timestamp - a.timestamp)

  return (
    <div className="container mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search by table name or activity description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {compactionHistory.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-6 transition-colors hover:bg-muted/50"
              >
                <div className={`rounded-md bg-green-100 p-2 text-green-600`}>
                  <GitCompare className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">{activity.table}</span>
                    <Badge variant="outline" className="text-xs">
                      Compaction
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Compaction job completed
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{formatDate(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
