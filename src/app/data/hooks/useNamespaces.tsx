import { useQueries } from "@tanstack/react-query"

import { loadNamespacesAndTables } from "@/lib/data-loader"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { DEMO_NAMESPACE_TABLES } from "@/lib/demo-data"

export interface Namespace {
  id: string
  name: string
  catalog: string
  tableCount: number
  tables: string[]
}

export function useNamespaces(catalogs: string[]) {
  const { demoMode } = useDemoMode()

  // Use useQueries to fetch namespaces for all catalogs in parallel
  const namespaceQueries = useQueries({
    queries:
      catalogs?.map((catalog) => ({
        queryKey: ["namespaces", catalog],
        queryFn: () => loadNamespacesAndTables(catalog),
        enabled: !!catalog && !demoMode,
      })) || [],
  })

  if (demoMode) {
    const namespaces = catalogs.flatMap((catalog) =>
      (DEMO_NAMESPACE_TABLES[catalog] || []).map((ns) => ({
        id: ns.name,
        name: ns.shortName,
        catalog,
        tableCount: ns.tables.length,
        tables: ns.tables,
      }))
    )

    return {
      namespaces,
      isLoading: false,
      error: false,
    }
  }

  // Combine all namespaces data
  const allNamespaces = namespaceQueries
    .flatMap((query, index) => {
      if (!query.data) return []
      const catalog = catalogs?.[index] || ""
      return query.data.map((ns) => ({
        id: ns.name,
        name: ns.shortName,
        catalog: catalog,
        tableCount: ns.tables.length,
        tables: ns.tables,
      }))
    })
    .filter(Boolean)

  return {
    namespaces: allNamespaces,
    isLoading: namespaceQueries.some((query) => query.isLoading),
    error: namespaceQueries.some((query) => query.error),
  }
}
