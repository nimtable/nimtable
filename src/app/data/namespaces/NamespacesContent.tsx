"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRight, Database, FolderOpen, Plus, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import Link from "next/link"

import { useNamespaces } from "../hooks/useNamespaces"
import { useCatalogs } from "../hooks/useCatalogs"

export function NamespacesContent() {
  const searchParams = useSearchParams()
  const catalogFromUrl = searchParams.get("catalog")

  const [selectedCatalog, setSelectedCatalog] = useState<string>(
    catalogFromUrl || "all"
  )
  const [searchQuery, setSearchQuery] = useState<string>("")

  const { catalogs, isLoading: isLoadingCatalogs } = useCatalogs()
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
      <div className="flex flex-1 items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Search Bar */}
      <div className="border-b bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search namespaces..."
              className="h-10 pl-9"
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
        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Catalog
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Tables
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
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredNamespaces.map((namespace) => (
                <tr key={namespace.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <FolderOpen className="mr-2 h-5 w-5 text-gray-400" />
                      <div className="font-medium text-gray-900">
                        {namespace.name}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <Database className="mr-2 h-4 w-4 text-gray-400" />
                      <div className="text-sm text-gray-500">
                        {namespace.catalog}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {namespace.tableCount}
                  </td>
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {namespace.storageSize}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {namespace.lastModified}
                  </td> */}

                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <Link
                      href={`/data/tables?catalog=${namespace.catalog}&namespace=${namespace.name}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
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
            <div className="py-8 text-center text-gray-500">
              No namespaces found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
