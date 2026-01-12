 "use client"

import { NamespacesContent } from "./NamespacesContent"
import { CatalogExplorer } from "@/components/data/CatalogExplorer"
import { useSearchParams } from "next/navigation"

function PageBody() {
  const searchParams = useSearchParams()
  const catalogParam = searchParams.get("catalog") || undefined
  const namespaceParam = searchParams.get("namespace") || undefined

  return (
    <div className="flex h-full bg-background">
      <div className="hidden h-full w-80 shrink-0 border-r border-border bg-card/60 lg:flex">
        <CatalogExplorer
          activeCatalog={catalogParam}
          activeNamespace={namespaceParam}
          className="h-full w-full"
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <NamespacesContent />
      </div>
    </div>
  )
}

export default function NamespacesPage() {
  return <PageBody />
}
