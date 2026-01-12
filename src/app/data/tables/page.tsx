"use client"

import { TablesContent } from "./TablesContent"
import { CatalogExplorer } from "@/components/data/CatalogExplorer"
import { useSearchParams } from "next/navigation"

function PageBody() {
  const searchParams = useSearchParams()
  const catalogParam = searchParams.get("catalog") || undefined
  const namespaceParam = searchParams.get("namespace") || undefined
  const tableParam = searchParams.get("table") || undefined

  return (
    <div className="flex h-full bg-background">
      <div className="hidden h-full w-80 shrink-0 border-r border-border bg-card/60 lg:flex">
        <CatalogExplorer
          activeCatalog={catalogParam}
          activeNamespace={namespaceParam}
          activeTable={tableParam}
          className="h-full w-full"
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <TablesContent />
      </div>
    </div>
  )
}

export default function TablesPage() {
  return <PageBody />
}
