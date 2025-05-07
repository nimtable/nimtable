"use client"

import { useState } from "react"
import {
  BarChart2,
  Clock,
  FileText,
  Filter,
  GitCompare,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock activity data
const activities = [
  {
    id: 1,
    type: "compaction",
    table: "customer_orders",
    timestamp: "2 hours ago",
    description: "Compaction job completed",
    icon: GitCompare,
    iconColor: "bg-green-100 text-green-600",
  },
  {
    id: 2,
    type: "stats",
    table: "product_inventory",
    timestamp: "4 hours ago",
    description: "Statistics updated",
    icon: BarChart2,
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    id: 3,
    type: "schema",
    table: "user_events",
    timestamp: "Yesterday",
    description: "Schema changed: 2 columns added",
    icon: FileText,
    iconColor: "bg-amber-100 text-amber-600",
  },
  {
    id: 4,
    type: "compaction",
    table: "transaction_history",
    timestamp: "Yesterday",
    description: "Compaction job completed",
    icon: GitCompare,
    iconColor: "bg-green-100 text-green-600",
  },
  {
    id: 5,
    type: "stats",
    table: "marketing_campaigns",
    timestamp: "2 days ago",
    description: "Statistics updated",
    icon: BarChart2,
    iconColor: "bg-blue-100 text-blue-600",
  },
  {
    id: 6,
    type: "schema",
    table: "website_analytics",
    timestamp: "3 days ago",
    description: "Schema changed: 1 column removed",
    icon: FileText,
    iconColor: "bg-amber-100 text-amber-600",
  },
]

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || activity.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Activity Log</h1>
          <p className="text-muted-foreground">View all data lake activities</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by table name or activity description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="compaction">Compaction</SelectItem>
            <SelectItem value="stats">Statistics</SelectItem>
            <SelectItem value="schema">Schema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Recent Activities</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-6 flex items-center gap-4 hover:bg-muted/50 transition-colors"
              >
                <div className={`p-2 rounded-md ${activity.iconColor}`}>
                  <activity.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{activity.table}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
