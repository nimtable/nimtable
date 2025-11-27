"use client"

import { OnboardingTrigger } from "@/components/onboarding/onboarding-trigger"
import { OverviewContext } from "./OverviewProvider"
import { MetricsSummary } from "./MetricsSummary"
import { TableWatchlist } from "./TableWatchlist"
import { ActivityFeed } from "./ActivityFeed"
import { useContext } from "react"
import { ConnectCatalogStep } from "@/components/onboarding/connect-catalog-step"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"

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

  if (tables.length === 0) {
    return (
      <div className="min-h-screen max-w-3xl w-full mx-auto bg-background pt-0 pb-6">
        <div className="mb-0 text-center"></div>

        {/* Header */}
        <div className="mt-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome to Nimtable
          </h1>
        </div>
        <ConnectCatalogStep
          onSuccess={() => {
            refresh()
          }}
        />
      </div>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
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
    </DashboardLayout>
  )
}
