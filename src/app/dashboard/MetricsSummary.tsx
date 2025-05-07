import { AlertTriangle, Database, GitCompare, HardDrive } from "lucide-react"

export function MetricsSummary() {
  // Mock data for metrics
  const metrics = [
    {
      title: "Total Tables",
      value: "248",
      icon: Database,
      color: "bg-blue-500",
      change: "+12 this month",
      changeType: "positive",
    },
    {
      title: "Tables Needing Compaction",
      value: "37",
      icon: GitCompare,
      color: "bg-amber-500",
      change: "+5 since yesterday",
      changeType: "negative",
    },
    {
      title: "Tables with Schema Drift",
      value: "14",
      icon: AlertTriangle,
      color: "bg-red-500",
      change: "-3 this week",
      changeType: "positive",
    },
    {
      title: "Total Storage",
      value: "1.8 PB",
      icon: HardDrive,
      color: "bg-purple-500",
      change: "+120 GB this week",
      changeType: "neutral",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
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
      ))}
    </div>
  )
}
