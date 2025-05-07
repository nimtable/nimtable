import { ActivityFeed } from "./ActivityFeed"
import { MetricsSummary } from "./MetricsSummary"
import { TableWatchlist } from "./TableWatchlist"

export default function DashboardPage() {
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl w-full mx-auto px-6 py-8">
        <h1 className="text-3xl font-semibold mb-2">Overview</h1>
        <p className="text-gray-500 mb-8">
          Welcome back to your Iceberg lakehouse control center
        </p>

        <MetricsSummary />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
          <div>
            <TableWatchlist />
          </div>
        </div>
      </div>
    </div>
  )
}
