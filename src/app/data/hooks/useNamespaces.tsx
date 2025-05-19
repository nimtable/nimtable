import { useQueries } from "@tanstack/react-query"

import { loadNamespacesAndTables } from "@/lib/data-loader"

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
        storageSize: "0 GB", // TODO: Get storage size from metadata
        lastModified: "Unknown", // TODO: Get last modified time from metadata
        status: "Healthy", // TODO: Get status from metadata
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
