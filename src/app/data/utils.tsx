import { useQueries } from "@tanstack/react-query"
import { Namespace } from "./hooks/useNamespaces"
import { Table } from "./hooks/useTables"
import { loadTableData } from "@/lib/data-loader"

export const useCatalogStats = (
  catalogs: string[],
  namespaces: Namespace[],
  tables: Table[]
) => {
  // Get table metadata for each table
  const tableMetadataQueries = useQueries({
    queries: tables.map((table) => ({
      queryKey: ["table-metadata", table.catalog, table.namespace, table.table],
      queryFn: () => loadTableData(table.catalog, table.namespace, table.table),
      enabled: !!table.catalog && !!table.namespace && !!table.table,
    })),
  })

  const tableMetadataMap = tableMetadataQueries.reduce(
    (acc, query, index) => {
      if (query.data && tables[index]) {
        const key = `${tables[index].catalog}.${tables[index].namespace}.${tables[index].table}`
        acc[key] = query.data
      }
      return acc
    },
    {} as Record<string, any>
  )

  // Calculate catalog stats
  const catalogStats = catalogs?.reduce(
    (acc, catalog) => {
      const catalogNamespaces = namespaces.filter(
        (ns) => ns.catalog === catalog
      )
      const catalogTables = tables.filter((t) => t.catalog === catalog)
      const totalStorageSize = catalogTables.reduce((sum, table) => {
        return sum + (table.dataFileSizeInBytes || 0)
      }, 0)

      acc[catalog] = {
        namespaceCount: catalogNamespaces.length,
        tableCount: catalogTables.length,
        storageSize: totalStorageSize,
        lastModified:
          catalogTables.length > 0
            ? new Date(
                Math.max(
                  ...catalogTables.map((t) => {
                    const key = `${t.catalog}.${t.namespace}.${t.table}`
                    return (
                      tableMetadataMap[key]?.metadata?.["last-updated-ms"] || 0
                    )
                  })
                )
              )
            : new Date(),
      }
      return acc
    },
    {} as Record<
      string,
      {
        namespaceCount: number
        tableCount: number
        storageSize: number
        lastModified: Date
      }
    >
  )

  return catalogStats
}
