import { useQueries } from "@tanstack/react-query"

import { loadNamespacesAndTables } from "@/lib/data-loader"
import type { NamespaceTables } from "@/lib/data-loader"

export interface Namespace {
  id: string
  name: string
  catalog: string
  tableCount: number
  tables: string[]
}

export function useNamespaces(catalogs: string[]) {
  // Use useQueries to fetch namespaces for all catalogs in parallel
  const namespaceQueries = useQueries({
    queries:
      catalogs?.map((catalog) => ({
        queryKey: ["namespaces", catalog],
        queryFn: () => loadNamespacesAndTables(catalog),
        enabled: !!catalog,
      })) || [],
  })

  // Combine all namespaces data, flattening nested namespaces
  const allNamespaces = namespaceQueries
    .flatMap((query, index) => {
      if (!query.data) return []
      const catalog = catalogs?.[index] || ""
      const flatten = (ns: NamespaceTables): Namespace[] => [
        {
          id: ns.name,
          name: ns.name,
          catalog: catalog,
          tableCount: ns.tables.length,
          tables: ns.tables,
        },
        ...ns.children.flatMap(flatten),
      ]
      return query.data.flatMap(flatten)
    })
    .filter(Boolean)

  return {
    namespaces: allNamespaces,
    isLoading: namespaceQueries.some((query) => query.isLoading),
    error: namespaceQueries.some((query) => query.error),
  }
}
