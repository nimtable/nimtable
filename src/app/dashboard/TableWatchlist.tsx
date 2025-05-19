"use client"

import { useState } from "react"
import { BarChart2, Eye, GitCompare, MoreHorizontal, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function TableWatchlist() {
  // Mock data for watchlist tables
  const [watchlistTables, setWatchlistTables] = useState([
    {
      id: "1",
      name: "customer_orders",
      status: "Healthy",
      lastModified: "2 hours ago",
    },
    {
      id: "2",
      name: "product_inventory",
      status: "Needs Compaction",
      lastModified: "1 day ago",
    },
    {
      id: "3",
      name: "user_events",
      status: "Schema Drift",
      lastModified: "3 days ago",
    },
    {
      id: "4",
      name: "transaction_history",
      status: "Healthy",
      lastModified: "5 days ago",
    },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "Needs Compaction":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200"
      case "Schema Drift":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold text-lg">Watchlist</h2>
        </div>
      </div>
      <div className="divide-y">
        {watchlistTables.map((table) => (
          <div key={table.id} className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{table.name}</h3>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {/* <MoreHorizontal className="h-4 w-4" /> */}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={getStatusColor(table.status)}>
                {table.status}
              </Badge>
              <p className="text-xs text-gray-500">{table.lastModified}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <GitCompare className="h-3 w-3" />
                Compact
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <BarChart2 className="h-3 w-3" />
                Stats
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Eye className="h-3 w-3" />
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
