"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Plus, Search } from "lucide-react"
import { useEffect, useState } from "react"

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

import { useNamespaces } from "../hooks/useNamespaces"
import { useCatalogs } from "../hooks/useCatalogs"

export function TablesContent() {
  const { catalogs } = useCatalogs()
  const { namespaces: allNamespaces } = useNamespaces(catalogs || [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const catalogFromUrl = searchParams.get("catalog")
  const namespaceFromUrl = searchParams.get("namespace")

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

  // Get namespaces for the selected catalog
  const catalogNamespaces = allNamespaces.filter(
    (ns) => ns.catalog === selectedCatalog
  )

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
                  Storage Size
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Last Modified
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
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
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-gray-900">{table}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {namespace.name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      storageSize
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      lastModified
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
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
            <div className="py-8 text-center text-gray-500">
              No tables found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
