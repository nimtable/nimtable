"use client"

import { Plus, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { CreateNamespaceModal } from "@/components/namespace/CreateNamespaceModal"

import { useNamespaces } from "../hooks/useNamespaces"
import { useCatalogs } from "../hooks/useCatalogs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FolderIcon, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { useRouter } from "next/navigation"
import { DataHierarchyHeader } from "@/components/data/DataHierarchyHeader"

export function NamespacesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const catalogFromUrl = searchParams.get("catalog")
  const searchFromUrl = searchParams.get("search") || ""

  const [selectedCatalog, setSelectedCatalog] = useState<string>(
    catalogFromUrl || "all"
  )
  const [searchQuery, setSearchQuery] = useState<string>(searchFromUrl)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { catalogs, isLoading: isLoadingCatalogs } = useCatalogs()
  const { demoMode } = useDemoMode()
  // Use useQueries to fetch namespaces for all catalogs in parallel
  const { namespaces: allNamespaces, isLoading: isLoadingNamespaces } =
    useNamespaces(catalogs || [])

  // Update selected catalog if URL parameter changes
  useEffect(() => {
    if (catalogFromUrl) {
      setSelectedCatalog(catalogFromUrl)
    }
  }, [catalogFromUrl])

  // Update search query if URL parameter changes
  useEffect(() => {
    setSearchQuery(searchFromUrl)
  }, [searchFromUrl])

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
    <div className="min-h-screen bg-background">
      <DataHierarchyHeader
        current="namespaces"
        catalog={selectedCatalog !== "all" ? selectedCatalog : undefined}
        count={filteredNamespaces.length}
      />

      {!catalogFromUrl && selectedCatalog === "all" && (
        <div className="px-6 pt-4">
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            You&apos;re viewing <span className="text-foreground">all catalogs</span>. For a clearer
            drill-down experience, start from{" "}
            <Link href="/data/catalogs" className="text-primary hover:text-primary/80">
              Catalogs
            </Link>{" "}
            and click a catalog to browse its namespaces.
          </div>
        </div>
      )}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-card border-input">
                <FolderIcon className="w-4 h-4" />
                {selectedCatalog}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCatalog("all")}>
                All Catalogs
              </DropdownMenuItem>
              {catalogs?.map((catalog) => (
                <DropdownMenuItem
                  key={catalog}
                  onClick={() => setSelectedCatalog(catalog)}
                >
                  {catalog}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search namespaces..."
              className="pl-10 bg-card border-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => !demoMode && setIsCreateModalOpen(true)}
            disabled={demoMode}
          >
            <Plus className="w-4 h-4 mr-0" />
            Create new Namespace
          </Button>
        </div>
      </div>

      {/* Create Namespace Modal */}
      <CreateNamespaceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        catalogs={catalogs || []}
        defaultCatalog={selectedCatalog !== "all" ? selectedCatalog : undefined}
      />

      {/* Namespaces List */}
      <div className="h-[calc(100vh-200px)] overflow-auto p-6">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-table-header border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                  Namespace
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                  Catalog
                </th>
                <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                  Tables
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredNamespaces.map((namespace, index) => (
                <tr
                  key={index}
                  className="group hover:bg-table-row-hover transition-colors cursor-pointer"
                  onClick={() => {
                    router.push(
                      `/data/tables?catalog=${namespace.catalog}&namespace=${namespace.name}`
                    )
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-card-foreground">
                    {namespace.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {namespace.catalog}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {namespace.tableCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredNamespaces.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No namespaces found matching your criteria
          </div>
        )}
      </div>
    </div>
  )
}
