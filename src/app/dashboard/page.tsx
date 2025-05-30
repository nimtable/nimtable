"use client"

import { OnboardingTrigger } from "@/components/onboarding/onboarding-trigger"
import { OverviewContext } from "./OverviewProvider"
import { MetricsSummary } from "./MetricsSummary"
import { TableWatchlist } from "./TableWatchlist"
import { ActivityFeed } from "./ActivityFeed"
import { useContext } from "react"

export default function DashboardPage() {
  const { isLoading, isFileDistributionLoading, tables, refresh } =
    useContext(OverviewContext)

  const handleOnboardingComplete = () => {
    refresh()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
      </div>
    )
  }
  return (
    <div className="bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <h1 className="mb-2 text-3xl font-semibold">Overview</h1>
        <p className="mb-8 text-gray-500">
          Welcome back to your Iceberg lakehouse control center
        </p>

        <MetricsSummary />

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityFeed />
          </div>
          <div>
            <TableWatchlist />
          </div>
        </div>
      </div>
      <OnboardingTrigger
        open={!isFileDistributionLoading && tables.length === 0}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
