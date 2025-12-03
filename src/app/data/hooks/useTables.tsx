import { DistributionItem, getFileDistribution } from "@/lib/data-loader"
import { useQueries } from "@tanstack/react-query"
import { useNamespaces } from "./useNamespaces"
import { useCatalogs } from "./useCatalogs"

export interface Table {
  table: string
  catalog: string
  namespace: string
  ranges: {
    [range: string]: DistributionItem
  }
  dataFileCount: number
  positionDeleteFileCount: number
  eqDeleteFileCount: number
  dataFileSizeInBytes: number
  positionDeleteFileSizeInBytes: number
  eqDeleteFileSizeInBytes: number
  dataFileRecordCount: number
  positionDeleteFileRecordCount: number
  eqDeleteFileRecordCount: number
}
export const useAllTables = () => {
  const {
    catalogs,
    isLoading: isLoadingCatalogs,
    refetch: refetchCatalogs,
  } = useCatalogs()

  const { namespaces, isLoading: isLoadingNamespaces } = useNamespaces(catalogs)

  const tablesNames = namespaces.flatMap((namespace) => {
    return namespace.tables.map((table) => {
      return {
        table: table,
        namespace: namespace.name,
        catalog: namespace.catalog,
      }
    })
  })

  const tablesQueries = useQueries({
    queries:
      tablesNames.map((table) => {
        return {
          queryKey: ["tables", table.catalog, table.namespace, table.table],
          queryFn: () =>
            getFileDistribution(
              table.catalog,
              table.namespace,
              table.table
            ).then((data) => {
              return {
                ...data,
                table: table.table,
                catalog: table.catalog,
                namespace: table.namespace,
              }
            }),
          enabled: !!table.catalog && !!table.namespace && !!table.table,
        }
      }) || [],
  })

  const tables = tablesQueries
    .map((query) => {
      return query.data
    })
    .filter((table) => table !== undefined)

  return {
    tables,
    isLoading: isLoadingCatalogs || isLoadingNamespaces,
    isFileDistributionLoading: tablesQueries.some((query) => query.isLoading),
    error: tablesQueries.some((query) => query.error),
    refetchCatalogs,
  }
}
