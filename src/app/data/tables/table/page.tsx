"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Code,
  Database,
  Download,
  FileText,
  LayoutList,
  RefreshCw,
  Settings,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageLoader } from "@/components/shared/page-loader"
import { OptimizeSheet } from "@/components/table/optimize-sheet"
import { DataPreview } from "@/app/table/data-preview"
import { InfoTab } from "@/app/table/info"
import { SnapshotsTab } from "@/app/table/snapshots"

import { useTableData } from "../../hooks/useTableData"

export default function TablePage() {
  const params = useSearchParams()
  const catalog = params.get("catalog")
  const namespace = params.get("namespace")
  const table = params.get("table")
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
    ? `/sql-editor?catalog=${catalog}${namespace ? `&namespace=${namespace}` : ""}${table ? `&table=${table}` : ""}`
    : "/sql-editor"

  if (isFetching) {
    return (
      <div className="w-full h-full flex items-center justify-center">
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
    <div className="max-w-7xl w-full mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
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
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRefetching ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOptimizeSheet(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Optimize Table
          </Button>

          <Button size="sm">
            <Link href={sqlEditorUrl} className="flex items-center">
              <Code className="w-4 h-4 mr-2" />
              <span>SQL Query</span>
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
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
