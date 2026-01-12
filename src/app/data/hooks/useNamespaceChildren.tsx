import { useQuery } from "@tanstack/react-query"

import { loadNamespaceChildren } from "@/lib/data-loader"

export function useNamespaceChildren(catalog: string, namespace?: string) {
  return useQuery({
    queryKey: ["namespace-children", catalog, namespace || "root"],
    queryFn: () => loadNamespaceChildren(catalog, namespace),
    enabled: !!catalog,
    staleTime: 30_000,
  })
}
