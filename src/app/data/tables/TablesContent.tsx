"use client"

import {
  ArrowLeft,
  ChevronDown,
  FolderIcon,
  Loader2,
  Search,
  TableIcon,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Choose } from "react-extras"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { getOptimizationRecommendation } from "@/components/table/file-distribution"
import { useNamespaces } from "../hooks/useNamespaces"
import { useCatalogs } from "../hooks/useCatalogs"
import { useAllTables } from "../hooks/useTables"

export function TablesContent() {
  const { catalogs } = useCatalogs()
  const { namespaces: allNamespaces } = useNamespaces(catalogs || [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const catalogFromUrl = searchParams.get("catalog")
  const namespaceFromUrl = searchParams.get("namespace")

  const { tables, isLoading, isFileDistributionLoading } = useAllTables()

  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "needs_compaction" | "healthy"
  >("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [selectedNamespace, setSelectedNamespace] = useState<string>(
    namespaceFromUrl || "all"
  )
  const [selectedCatalog, setSelectedCatalog] = useState<string>(
    catalogFromUrl || catalogs[0] || "all"
  )

  useEffect(() => {
    if (!selectedCatalog && catalogs.length > 0) {
      setSelectedCatalog(catalogs[0])
    }
  }, [catalogs, selectedCatalog])

  // Update selected catalog and namespace if URL parameters change
  useEffect(() => {
    if (catalogFromUrl) {
      setSelectedCatalog(catalogFromUrl)
    }
    if (namespaceFromUrl) {
      setSelectedNamespace(namespaceFromUrl)
    }
  }, [catalogFromUrl, namespaceFromUrl])

  // Get namespaces for the selected catalog
  const catalogNamespaces = allNamespaces.filter(
    (ns) => ns.catalog === selectedCatalog
  )

  const filteredTables = tables
    .map((item) => {
      return {
        ...item,
        status: getOptimizationRecommendation(item).shouldOptimize
          ? "needs_compaction"
          : "healthy",
      }
    })
    .filter((table) => {
      if (
        searchQuery &&
        !table.table.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      if (selectedCatalog !== "all" && table.catalog !== selectedCatalog) {
        return false
      }
      if (
        selectedNamespace !== "all" &&
        table.namespace !== selectedNamespace
      ) {
        return false
      }
      if (selectedStatus !== "all" && table.status !== selectedStatus) {
        return false
      }
      return true
    })

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Catalog and namespace selector with search bar */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-card border-input">
                <FolderIcon className="w-4 h-4" />
                {selectedCatalog !== "all" ? selectedCatalog : "All Catalogs"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCatalog("all")}>
                All Catalogs
              </DropdownMenuItem>
              {catalogs.map((catalog) => (
                <DropdownMenuItem
                  key={catalog}
                  onClick={() => setSelectedCatalog(catalog)}
                >
                  {catalog !== "all" ? catalog : "All Catalogs"}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-card border-input">
                <FolderIcon className="w-4 h-4" />
                {selectedNamespace}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedNamespace("all")}>
                All Namespaces
              </DropdownMenuItem>
              {catalogNamespaces.map((namespace) => (
                <DropdownMenuItem
                  key={namespace.id}
                  onClick={() => setSelectedNamespace(namespace.name)}
                >
                  {namespace.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tables..."
              className="pl-10 bg-card border-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href={`/data/namespaces?catalog=${selectedCatalog}`}
            className="text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <TableIcon className="w-5 h-5 text-card-foreground" />
              <h2 className="text-m font-normal text-card-foreground">
                {catalogFromUrl}
              </h2>
            </div>
            <span className="px-2 py-1 text-xs font-normal bg-muted text-muted-foreground rounded">
              {namespaceFromUrl}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-foreground">
          <span className="text-sm text-muted-foreground">View by:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 bg-transparent"
              >
                {selectedStatus === "all"
                  ? "All status"
                  : selectedStatus === "healthy"
                    ? "Healthy"
                    : "Needs Compaction"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedStatus("all")}>
                All status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedStatus("healthy")}>
                Healthy
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSelectedStatus("needs_compaction")}
              >
                Needs Compaction
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table List */}
      <Choose>
        <Choose.When condition={isFileDistributionLoading || isLoading}>
          <div className="flex-1 overflow-auto p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        </Choose.When>
        <Choose.When condition={filteredTables.length === 0}>
          <div className="flex-1 overflow-auto p-6">
            <div className="py-8 text-center text-gray-500">
              No tables found matching your criteria
            </div>
          </div>
        </Choose.When>
        <Choose.Otherwise>
          <div className="h-[calc(100vh-200px)] overflow-auto p-6">
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <table className="w-full">
                <thead className="bg-table-header border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Namespaces
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Storage size (GB)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                      Data Files
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {filteredTables.map((table, index) => (
                    <tr
                      key={index}
                      className="group hover:bg-table-row-hover transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-card-foreground">
                        {table.table}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {table.namespace}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {table.status === "needs_compaction" ? (
                          <Badge
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200"
                            variant="outline"
                          >
                            Needs Compaction
                          </Badge>
                        ) : (
                          <Badge
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                            variant="outline"
                          >
                            Healthy
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-left">
                        {`${(table.dataFileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                          {table.dataFileCount}

                          <a
                            href={`/data/tables/table?catalog=${table.catalog}&namespace=${table.namespace}&table=${table.table}`}
                            className="text-primary hover:text-primary/80 font-normal flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View details
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {catalogNamespaces?.map((item) => item.tables).flat().length ===
                0 && (
                <div className="py-8 text-center text-gray-500">
                  No tables found matching your criteria
                </div>
              )}
            </div>
          </div>
        </Choose.Otherwise>
      </Choose>
    </div>
  )
}
