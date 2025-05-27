"use client"

import {
  Code,
  Database,
  FileText,
  LayoutList,
  RefreshCw,
  Settings,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OptimizeSheet } from "@/components/table/optimize-sheet"
import { PageLoader } from "@/components/shared/page-loader"
import { DataPreview } from "@/app/table/data-preview"
import { SnapshotsTab } from "@/app/table/snapshots"
import { Button } from "@/components/ui/button"
import { InfoTab } from "@/app/table/info"

import { useTableData } from "../../hooks/useTableData"

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

  const handleRefresh = () => {
    refetch()
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
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{table}</h2>
          <p className="text-sm text-muted-foreground">
            {catalog} - {namespace}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isRefetching ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOptimizeSheet(true)}
          >
            <Settings className="mr-2 h-4 w-4" />
            Optimize Table
          </Button>

          <Button size="sm">
            <Link href={sqlEditorUrl} className="flex items-center">
              <Code className="mr-2 h-4 w-4" />
              <span>SQL Query</span>
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={tab || "info"} className="space-y-4">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="info" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>Info</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1.5">
            <Database className="h-4 w-4" />
            <span>Data Preview</span>
          </TabsTrigger>
          <TabsTrigger value="snapshots" className="flex items-center gap-1.5">
            <LayoutList className="h-4 w-4" />
            <span>Version Control</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <InfoTab
            tableData={data}
            catalog={catalog}
            namespace={namespace}
            table={table}
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
