"use client"

import { ArrowRight, Filter, Loader2, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Choose } from "react-extras"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

import { getCompactionRecommendation } from "@/components/table/file-distribution"
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
        status: getCompactionRecommendation(item).shouldCompact
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
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Search Bar */}
      <div className="border-b bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Tables</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Catalog Selector */}
          <div className="w-48">
            <Select value={selectedCatalog} onValueChange={setSelectedCatalog}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select Catalog" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Catalogs</SelectItem>

                {catalogs.map((catalog) => (
                  <SelectItem key={catalog} value={catalog}>
                    {catalog}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Namespace Selector */}
          <div className="w-48">
            <Select
              value={selectedNamespace}
              onValueChange={setSelectedNamespace}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select Namespace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Namespaces</SelectItem>
                {catalogNamespaces.map((namespace) => (
                  <SelectItem key={namespace.id} value={namespace.name}>
                    {namespace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search tables..."
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={
                  selectedStatus === "all" || selectedStatus === "healthy"
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStatus(
                      selectedStatus === "needs_compaction" ? "all" : "healthy"
                    )
                  } else {
                    setSelectedStatus(
                      selectedStatus === "all" ? "needs_compaction" : "all"
                    )
                  }
                }}
              >
                Healthy
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={
                  selectedStatus === "all" ||
                  selectedStatus === "needs_compaction"
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedStatus(
                      selectedStatus === "healthy" ? "all" : "needs_compaction"
                    )
                  } else {
                    setSelectedStatus(
                      selectedStatus === "all" ? "healthy" : "all"
                    )
                  }
                }}
              >
                Needs Compaction
              </DropdownMenuCheckboxItem>
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
          <div className="flex-1 overflow-auto p-6">
            <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Table Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Namespace
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Data Files
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    ></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredTables.map((table) => (
                    <tr
                      key={`${table.catalog}.${table.namespace}.${table.table}`}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() =>
                        router.push(
                          `/data/tables/table?catalog=${table.catalog}&namespace=${table.namespace}&table=${table.table}`
                        )
                      }
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {table.table}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {table.namespace}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {table.dataFileCount}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {`${(table.dataFileSizeInBytes / (1024 * 1024)).toFixed(2)} MB`}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
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
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-900">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </span>
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
