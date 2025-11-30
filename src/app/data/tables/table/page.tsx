"use client"

import {
  ArrowLeft,
  Database,
  FileText,
  LayoutList,
  Plus,
  RefreshCw,
  TableIcon,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OptimizeSheet } from "@/components/table/optimize-sheet"
import { PageLoader } from "@/components/shared/page-loader"
import { DataPreview } from "@/app/table/data-preview"
import { SnapshotsTab } from "@/app/table/snapshots"
import { Button } from "@/components/ui/button"
import { InfoTab } from "@/app/table/info"

import { useTableData } from "../../hooks/useTableData"
import { ScrewdriverWrenchIcon } from "@/components/icon"

export default function TablePage() {
  const params = useSearchParams()
  const catalog = params.get("catalog")
  const namespace = params.get("namespace")
  const table = params.get("table")
  const tab = params.get("tab")
  const isValidParams = catalog && namespace && table

  const { data, isFetching, isRefetching, refetch } = useTableData(
    catalog as string,
    namespace as string,
    table as string
  )

  const [showOptimizeSheet, setShowOptimizeSheet] = useState(false)
  const [activeTab, setActiveTab] = useState(tab || "info")
  const [refreshKey, setRefreshKey] = useState(0)

  // Sync activeTab with URL parameter
  useEffect(() => {
    setActiveTab(tab || "info")
  }, [tab])

  const handleRefresh = () => {
    refetch()
    // Trigger data distribution refresh as well
    setRefreshKey((prev) => prev + 1)
  }

  // Build SQL editor URL with appropriate query parameters
  const sqlEditorUrl = catalog
    ? `/data/sql-editor?catalog=${catalog}${namespace ? `&namespace=${namespace}` : ""}${table ? `&table=${table}` : ""}`
    : "/data/sql-editor"

  if (isFetching) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <PageLoader
          icon={LayoutList}
          title="Loading table details"
          entity={table as string}
          entityType="Table"
        />
      </div>
    )
  }

  if (!isValidParams) {
    return <div>Invalid params</div>
  }

  if (!data) {
    return null
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="bg-card px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/data/catalog?catalog=${catalog}`}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-card-foreground" />
              <h2 className="text-m font-normal text-card-foreground">
                {table}
              </h2>
            </div>
            <span className="px-2 py-1 text-xs font-normal bg-muted text-muted-foreground rounded">
              Table details
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            <span>{isRefetching ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => setShowOptimizeSheet(true)}
            className="btn-secondary"
          >
            <ScrewdriverWrenchIcon className="w-4 h-4" />
            <span>Optimize table</span>
          </button>

          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Link href={sqlEditorUrl} className="flex items-center">
              <Plus className="w-4 h-4" />
              <span>SQL Query</span>
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <div className="bg-card border-b border-border px-6 py-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              <span>Info</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1.5">
              <Database className="h-4 w-4" />
              <span>Data Preview</span>
            </TabsTrigger>
            <TabsTrigger
              value="snapshots"
              className="flex items-center gap-1.5"
            >
              <LayoutList className="h-4 w-4" />
              <span>Version Control</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="info" className="space-y-4">
          <InfoTab
            tableData={data}
            catalog={catalog}
            namespace={namespace}
            table={table}
            refreshKey={refreshKey}
          />
        </TabsContent>

        <TabsContent value="data">
          <DataPreview catalog={catalog} namespace={namespace} table={table} />
        </TabsContent>

        <TabsContent value="snapshots">
          <SnapshotsTab
            tableData={data}
            catalog={catalog}
            namespace={namespace}
            table={table}
          />
        </TabsContent>
      </Tabs>

      <OptimizeSheet
        open={showOptimizeSheet}
        onOpenChange={setShowOptimizeSheet}
        catalog={catalog as string}
        namespace={namespace as string}
        table={table as string}
      />
    </div>
  )
}
