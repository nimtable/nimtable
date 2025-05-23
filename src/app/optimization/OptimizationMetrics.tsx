import { GitCompare, HardDrive, Snowflake, Timer } from "lucide-react"

type MetricsProps = {
  metrics: {
    tablesNeedingCompaction: {
      value: number
      change: string
      changeType: string
    }
    coldDataNotTiered: {
      value: string
      change: string
      changeType: string
    }
    estimatedStorageSaved: {
      value: string
      change: string
      changeType: string
    }
    queryScanTimeReduction: {
      value: string
      change: string
      changeType: string
    }
  }
}

export function OptimizationMetrics({ metrics }: MetricsProps) {
  const metricsConfig = [
    {
      title: "Tables Needing Compaction",
      value: metrics.tablesNeedingCompaction.value,
      change: metrics.tablesNeedingCompaction.change,
      changeType: metrics.tablesNeedingCompaction.changeType,
      icon: GitCompare,
      color: "bg-amber-500",
    },
    {
      title: "Cold Data Not Tiered",
      value: metrics.coldDataNotTiered.value,
      change: metrics.coldDataNotTiered.change,
      changeType: metrics.coldDataNotTiered.changeType,
      icon: Snowflake,
      color: "bg-blue-500",
    },
    {
      title: "Est. Storage Saved This Month",
      value: metrics.estimatedStorageSaved.value,
      change: metrics.estimatedStorageSaved.change,
      changeType: metrics.estimatedStorageSaved.changeType,
      icon: HardDrive,
      color: "bg-green-500",
    },
    {
      title: "Avg Query Scan Time Reduction",
      value: metrics.queryScanTimeReduction.value,
      change: metrics.queryScanTimeReduction.change,
      changeType: metrics.queryScanTimeReduction.changeType,
      icon: Timer,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricsConfig.map((metric, index) => (
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
                {metric.change} since last week
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
