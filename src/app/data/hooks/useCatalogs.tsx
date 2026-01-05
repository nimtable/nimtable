import { useQuery } from "@tanstack/react-query"

import { getCatalogs } from "@/lib/client"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { DEMO_CATALOGS } from "@/lib/demo-data"

export function useCatalogs() {
  const { demoMode } = useDemoMode()
  const { data, ...props } = useQuery({
    queryKey: ["catalogs"],
    queryFn: () => getCatalogs(),
    enabled: !demoMode,
  })

  if (demoMode) {
    return {
      catalogs: DEMO_CATALOGS,
      isLoading: false,
      isError: false,
      refetch: async () => ({ data: DEMO_CATALOGS }),
    }
  }

  return {
    catalogs: data?.data || [],
    ...props,
  }
}
