import { useQuery } from "@tanstack/react-query"

import { loadTableData } from "@/lib/data-loader"

export function useTableData(
  catalog: string,
  namespace: string,
  table: string
) {
  const result = useQuery({
    queryKey: ["tableData", catalog, namespace, table],
    queryFn: () => loadTableData(catalog, namespace, table),
  })

  return result
}
