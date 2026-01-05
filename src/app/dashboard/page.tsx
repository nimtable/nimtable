"use client"

import { OverviewContext } from "./OverviewProvider"
import { MetricsSummary } from "./MetricsSummary"
import { TableWatchlist } from "./TableWatchlist"
import { ActivityFeed } from "./ActivityFeed"
import { useContext } from "react"
import { ConnectCatalogStep } from "@/components/onboarding/connect-catalog-step"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { Button } from "@/components/ui/button"
import { useDemoMode } from "@/contexts/demo-mode-context"

export default function DashboardPage() {
  const { isLoading, isFileDistributionLoading, tables, refresh } =
    useContext(OverviewContext)
  const { enable: enableDemo, demoMode } = useDemoMode()

  if (isLoading || isFileDistributionLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-3xl">
            <div className="relative mb-6">
              <h1 className="text-2xl font-semibold text-card-foreground text-center">
                {demoMode ? "Demo Mode" : "Welcome to Nimtable"}
              </h1>
              {!demoMode && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      enableDemo()
                      refresh()
                    }}
                  >
                    Try Demo
                  </Button>
                </div>
              )}
            </div>
            <ConnectCatalogStep
              onSuccess={() => {
                refresh()
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <div>
              <h1 className="mb-2 text-2xl font-semibold text-card-foreground">
                Overview
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome back to your Iceberg lakehouse control center
              </p>
            </div>

            <MetricsSummary />

            <div className="space-y-6">
              <ActivityFeed />
              <TableWatchlist />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
