import { useQuery } from "@tanstack/react-query"

import { loadTableData } from "@/lib/data-loader"

export function useTableData(
  catalog: string,
  namespace: string,
  table: string
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tableData", catalog, namespace, table],
    queryFn: () => loadTableData(catalog, namespace, table),
  })

  return {
    data,
    isLoading: isLoading,
    error: error,
  }
}
