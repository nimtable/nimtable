"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Plus, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useCatalogs } from "../hooks/useCatalogs"
import { useNamespaces } from "../hooks/useNamespaces"
import { TableDetailPanel } from "./tableDetailPanel"

export function TablesContent() {
  const { catalogs } = useCatalogs()
  const { namespaces: allNamespaces } = useNamespaces(catalogs || [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const catalogFromUrl = searchParams.get("catalog")
  const namespaceFromUrl = searchParams.get("namespace")

  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [selectedNamespace, setSelectedNamespace] = useState<string>(
    namespaceFromUrl || "all"
  )
  const [selectedCatalog, setSelectedCatalog] = useState<string>(
    catalogFromUrl || catalogs[0]
  )
  const [searchQuery, setSearchQuery] = useState<string>("")

  if (!selectedCatalog && catalogs.length > 0) {
    setSelectedCatalog(catalogs[0])
  }

  // Update selected catalog and namespace if URL parameters change
  useEffect(() => {
    if (catalogFromUrl) {
      setSelectedCatalog(catalogFromUrl)
    }
    if (namespaceFromUrl) {
      setSelectedNamespace(namespaceFromUrl)
    }
  }, [catalogFromUrl, namespaceFromUrl])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "Needs Compaction":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200"
      case "Schema Drift":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  // Get namespaces for the selected catalog
  const catalogNamespaces = allNamespaces.filter(
    (ns) => ns.catalog === selectedCatalog
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Search Bar */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
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
                <SelectItem value="all">All Namespaces</SelectItem>

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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search tables..."
              className="pl-9 h-10"
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
              <DropdownMenuCheckboxItem checked>
                Healthy
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Needs Compaction
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Schema Drift
              </DropdownMenuCheckboxItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Last Modified</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Last 24 hours
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Last 7 days
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked>
                Last 30 days
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Table Button */}
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Table
          </Button>
        </div>
      </div>

      {/* Table List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Table Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Namespace
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Storage Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Last Modified
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {catalogNamespaces.map((namespace, index) => {
                return namespace.tables.map((table, oindex) => (
                  <tr
                    key={namespace.name + "." + table}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      router.push(
                        `/data/tables/table?catalog=${selectedCatalog}&namespace=${namespace.name}&table=${table}`
                      )
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{table}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {namespace.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      storageSize
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      lastModified
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant="outline"
                        // className={getStatusColor(table.status)}
                      >
                        {/* {table.status} */}
                        status
                      </Badge>
                    </td>
                  </tr>
                ))
              })}
            </tbody>
          </table>

          {catalogNamespaces?.map((item) => item.tables).flat().length ===
            0 && (
            <div className="text-center py-8 text-gray-500">
              No tables found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
