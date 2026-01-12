"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Database,
  Loader2,
  Search,
  Table as TableIcon,
  FolderTree,
} from "lucide-react"
import Link from "next/link"

import { useCatalogs } from "@/app/data/hooks/useCatalogs"
import { useNamespaceChildren } from "@/app/data/hooks/useNamespaceChildren"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

type TreeMode = "navigate" | "select"

type CatalogExplorerProps = {
  mode?: TreeMode
  onSelectTable?: (payload: {
    catalog: string
    namespace: string
    table: string
  }) => void
  className?: string
  activeCatalog?: string
  activeNamespace?: string
  activeTable?: string
}

type NamespaceNodeProps = {
  catalog: string
  namespace: string
  depth: number
  mode: TreeMode
  onSelectTable?: CatalogExplorerProps["onSelectTable"]
  activeNamespace?: string
  activeTable?: string
}

type CatalogRootProps = {
  catalog: string
  mode: TreeMode
  onSelectTable?: CatalogExplorerProps["onSelectTable"]
  activeNamespace?: string
  activeTable?: string
}

function NamespaceNode({
  catalog,
  namespace,
  depth,
  mode,
  onSelectTable,
  activeNamespace,
  activeTable,
}: NamespaceNodeProps) {
  const shouldAutoOpen =
    !!activeNamespace &&
    (activeNamespace === namespace ||
      activeNamespace.startsWith(`${namespace}.`))
  const [isOpen, setIsOpen] = useState(shouldAutoOpen)
  const { data, isFetching } = useNamespaceChildren(
    catalog,
    namespace || undefined
  )
  const hasChildren =
    (data?.namespaces?.length || 0) > 0 || (data?.tables?.length || 0) > 0

  const indent = depth * 12

  return (
    <div className="text-sm">
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-muted transition-colors",
          isOpen && "bg-muted/60"
        )}
        style={{ paddingLeft: indent + 8 }}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={!hasChildren && !isFetching}
      >
        {isFetching ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : hasChildren ? (
          isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}
        <FolderTree className="h-4 w-4 text-blue-500" />
        <span
          className={cn(
            "truncate",
            activeNamespace === namespace && "font-semibold text-foreground"
          )}
        >
          {namespace || "(root)"}
        </span>
      </button>

      {isOpen && (
        <div className="space-y-0.5">
          {(data?.namespaces || []).map((child) => (
            <NamespaceNode
              key={child.name}
              catalog={catalog}
              namespace={child.name}
              depth={depth + 1}
              mode={mode}
              onSelectTable={onSelectTable}
              activeNamespace={activeNamespace}
              activeTable={activeTable}
            />
          ))}

          {namespace &&
            (data?.tables || []).map((table) => (
              <div key={`${namespace}.${table}`} className="pl-[52px]">
                {mode === "select" && onSelectTable ? (
                  <button
                    type="button"
                    onClick={() => onSelectTable({ catalog, namespace, table })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-muted transition-colors",
                      activeNamespace === namespace &&
                        activeTable === table &&
                        "bg-muted/70 font-medium"
                    )}
                  >
                    <TableIcon className="h-4 w-4 text-emerald-600" />
                    <span className="truncate">{table}</span>
                  </button>
                ) : (
                  <Link
                    href={`/data/tables/table?catalog=${encodeURIComponent(
                      catalog
                    )}&namespace=${encodeURIComponent(
                      namespace
                    )}&table=${encodeURIComponent(table)}`}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                      activeNamespace === namespace &&
                        activeTable === table &&
                        "bg-muted/70 text-foreground font-medium"
                    )}
                  >
                    <TableIcon className="h-4 w-4 text-emerald-600" />
                    <span className="truncate">{table}</span>
                  </Link>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function CatalogRoot({
  catalog,
  mode,
  onSelectTable,
  activeNamespace,
  activeTable,
}: CatalogRootProps) {
  const { data, isFetching } = useNamespaceChildren(catalog)
  const namespaces = data?.namespaces || []
  const showEmpty = !isFetching && namespaces.length === 0

  return (
    <div className="ml-2 border-l border-border pl-2">
      {isFetching && namespaces.length === 0 && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading namespaces...
        </div>
      )}

      {namespaces.map((ns) => (
        <NamespaceNode
          key={ns.name}
          catalog={catalog}
          namespace={ns.name}
          depth={1}
          mode={mode}
          onSelectTable={onSelectTable}
          activeNamespace={activeNamespace}
          activeTable={activeTable}
        />
      ))}

      {showEmpty && (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          No namespaces
        </div>
      )}
    </div>
  )
}

export function CatalogExplorer({
  mode = "navigate",
  onSelectTable,
  className,
  activeCatalog,
  activeNamespace,
  activeTable,
}: CatalogExplorerProps) {
  const { catalogs, isLoading } = useCatalogs()
  const [openCatalog, setOpenCatalog] = useState<string | null>(
    activeCatalog ?? null
  )
  const [filter, setFilter] = useState("")

  const filteredCatalogs =
    catalogs?.filter((cat) =>
      cat.toLowerCase().includes(filter.toLowerCase())
    ) || []

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-card",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Database className="h-4 w-4 text-primary" />
        <div className="flex-1 text-sm font-medium text-card-foreground">
          Explorer
        </div>
        <span className="text-xs text-muted-foreground">
          {filteredCatalogs.length}
        </span>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter catalogs..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-2">
        {isLoading ? (
          <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading catalogs...
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            No catalogs
          </div>
        ) : (
          filteredCatalogs.map((catalog) => (
            <div key={catalog} className="mb-1">
              <button
                type="button"
                onClick={() =>
                  setOpenCatalog((prev) => (prev === catalog ? null : catalog))
                }
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 hover:bg-muted transition-colors",
                  openCatalog === catalog && "bg-muted/60"
                )}
              >
                {openCatalog === catalog ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <Database className="h-4 w-4 text-primary" />
                <span className="truncate">{catalog}</span>
              </button>

              {openCatalog === catalog && (
                <CatalogRoot
                  catalog={catalog}
                  mode={mode}
                  onSelectTable={onSelectTable}
                  activeNamespace={
                    activeCatalog === catalog ? activeNamespace : undefined
                  }
                  activeTable={
                    activeCatalog === catalog ? activeTable : undefined
                  }
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
