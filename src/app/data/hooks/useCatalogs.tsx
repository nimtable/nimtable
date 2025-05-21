import { useQuery } from "@tanstack/react-query"

import { getCatalogs } from "@/lib/client"

export function useCatalogs() {
  const { data, ...props} = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => getCatalogs(),
  })

  return {
    catalogs: data?.data || [],
    ...props,
  }
}
