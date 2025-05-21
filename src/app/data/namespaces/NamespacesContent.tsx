"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Database, FolderOpen, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
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

export function NamespacesContent() {
  const searchParams = useSearchParams()
  const catalogFromUrl = searchParams.get("catalog")

  const [selectedCatalog, setSelectedCatalog] = useState<string>(
    catalogFromUrl || "all"
  )
  const [searchQuery, setSearchQuery] = useState<string>("")

  const {
    catalogs,
    isLoading: isLoadingCatalogs,
    refetch: refetchCatalogs,
  } = useCatalogs()
  // Use useQueries to fetch namespaces for all catalogs in parallel
  const { namespaces: allNamespaces, isLoading: isLoadingNamespaces } =
    useNamespaces(catalogs || [])

  // Update selected catalog if URL parameter changes
  useEffect(() => {
    if (catalogFromUrl) {
      setSelectedCatalog(catalogFromUrl)
    }
  }, [catalogFromUrl])


  // Filter namespaces based on selected catalog and search query
  const filteredNamespaces = allNamespaces.filter((namespace) => {
    // Filter by catalog
    if (selectedCatalog !== "all" && namespace.catalog !== selectedCatalog) {
      return false
    }

    // Filter by search query
    if (
      searchQuery &&
      !namespace.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    return true
  })

  // Check if any data is still loading
  const isLoading = isLoadingCatalogs || isLoadingNamespaces

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Search Bar */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Namespaces</h1>
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
                {catalogs?.map((catalog) => (
                  <SelectItem key={catalog} value={catalog}>
                    {catalog}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search namespaces..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Create Namespace Button */}
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Namespace
          </Button>
        </div>
      </div>

      {/* Namespaces List */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Catalog
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tables
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
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNamespaces.map((namespace) => (
                <tr key={namespace.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FolderOpen className="h-5 w-5 text-gray-400 mr-2" />
                      <div className="font-medium text-gray-900">
                        {namespace.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Database className="h-4 w-4 text-gray-400 mr-2" />
                      <div className="text-sm text-gray-500">
                        {namespace.catalog}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {namespace.tableCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {namespace.storageSize}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {namespace.lastModified}
                  </td>
          
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/data/tables?catalog=${namespace.catalog}&namespace=${namespace.name}`}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      View Tables
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredNamespaces.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No namespaces found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
