import Link from "next/link"
import {
  ArrowRight,
  BarChart2,
  Clock,
  FileText,
  GitCompare,
} from "lucide-react"

import { Button } from "@/components/ui/button"

export function ActivityFeed() {
  // Mock data for recent activities
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

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-lg">Recent Activity</h2>
        </div>
        <Button variant="ghost" size="sm" className="text-sm">
          <Link href="/dashboard/activity">View all</Link>
        </Button>
      </div>
      <div className="divide-y">
        {activities.map((activity) => (
          <div key={activity.id} className="px-6 py-4 flex items-center gap-4">
            <div className={`p-2 rounded-md ${activity.iconColor}`}>
              <activity.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">
                <span className="text-gray-900">{activity.table}</span>
                <span className="text-gray-500"> — {activity.description}</span>
              </p>
              <p className="text-sm text-gray-500">{activity.timestamp}</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
