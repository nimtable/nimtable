"use client"

import { OverviewContext } from "./OverviewProvider"
import { MetricsSummary } from "./MetricsSummary"
import { TableWatchlist } from "./TableWatchlist"
import { ActivityFeed } from "./ActivityFeed"
import { useContext } from "react"
import { ConnectCatalogStep } from "@/components/onboarding/connect-catalog-step"
import { Button } from "@/components/ui/button"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { LayoutGrid } from "lucide-react"

export default function DashboardPage() {
  const { isLoading, isFileDistributionLoading, tables, refresh } =
    useContext(OverviewContext)
  const { enable: enableDemo, demoMode } = useDemoMode()

  if (isLoading || isFileDistributionLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        {/* Top bar (match Optimization layout style) */}
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-card-foreground" />
              <h2 className="text-m font-normal text-card-foreground">
                Overview
              </h2>
            </div>
            {!demoMode && (
              <Button
                variant="outline"
                size="sm"
                className="bg-card border-input"
                onClick={() => {
                  enableDemo()
                  refresh()
                }}
              >
                Try Demo
              </Button>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {demoMode
              ? "Demo mode is enabled"
              : "Connect a catalog to start monitoring your Iceberg lakehouse"}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto w-11/12">
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
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Top bar (match Optimization layout style) */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-card-foreground" />
          <h2 className="text-m font-normal text-card-foreground">Overview</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back to your Iceberg lakehouse control center
        </p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="w-full space-y-6">
          <MetricsSummary />
          <ActivityFeed />
          <TableWatchlist />
        </div>
      </div>
    </div>
  )
}
