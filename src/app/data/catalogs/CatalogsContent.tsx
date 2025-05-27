"use client"

import { ExternalLink, Plus, Search, Trash2 } from "lucide-react"
import { useQueries } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type React from "react"
import Link from "next/link"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { getCatalogConfig } from "@/lib/data-loader"
import { loadTableData } from "@/lib/data-loader"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { deleteCatalog } from "@/lib/client"
import { errorToString } from "@/lib/utils"

import { CreateCatalogModal } from "./CreateCatalogModal"
import { useNamespaces } from "../hooks/useNamespaces"
import { useCatalogs } from "../hooks/useCatalogs"
import { useAllTables } from "../hooks/useTables"

export function CatalogsContent() {
  const {
    catalogs,
    isLoading: isLoadingCatalogs,
    refetch: refetchCatalogs,
  } = useCatalogs()
  const { namespaces, isLoading: isLoadingNamespaces } = useNamespaces(
    catalogs || []
  )
  const { tables, isLoading: isLoadingTables } = useAllTables()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [mirrorModalOpen, setMirrorModalOpen] = useState<boolean>(false)
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    catalogName: "",
    endpoint: "",
    credentials: "",
    readOnly: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null)
  const router = useRouter()

  // Get catalog configurations
  const catalogConfigs = useQueries({
    queries: (catalogs || []).map((catalog) => ({
      queryKey: ["catalog-config", catalog],
      queryFn: () => getCatalogConfig(catalog),
      enabled: !!catalog,
    })),
  })

  const catalogConfigMap = catalogConfigs.reduce(
    (acc, query, index) => {
      if (query.data && catalogs?.[index]) {
        acc[catalogs[index]] = query.data
      }
      return acc
    },
    {} as Record<string, any>
  )

  // Get table metadata for each table
  const tableMetadataQueries = useQueries({
    queries: tables.map((table) => ({
      queryKey: ["table-metadata", table.catalog, table.namespace, table.table],
      queryFn: () => loadTableData(table.catalog, table.namespace, table.table),
      enabled: !!table.catalog && !!table.namespace && !!table.table,
    })),
  })

  const tableMetadataMap = tableMetadataQueries.reduce(
    (acc, query, index) => {
      if (query.data && tables[index]) {
        const key = `${tables[index].catalog}.${tables[index].namespace}.${tables[index].table}`
        acc[key] = query.data
      }
      return acc
    },
    {} as Record<string, any>
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      })
    }
  }

  const handleToggleChange = (checked: boolean) => {
    setFormData({
      ...formData,
      readOnly: checked,
    })
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.catalogName.trim()) {
      errors.catalogName = "Catalog name is required"
    } else if (!/^[a-z0-9_]+$/.test(formData.catalogName)) {
      errors.catalogName =
        "Only lowercase letters, numbers, and underscores allowed"
    }

    if (!formData.endpoint.trim()) {
      errors.endpoint = "REST endpoint is required"
    } else if (!formData.endpoint.startsWith("http")) {
      errors.endpoint = "Must be a valid URL starting with http:// or https://"
    }

    if (!formData.credentials.trim()) {
      errors.credentials = "Access token is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      // Handle form submission
      console.log("Form submitted:", formData)
      setMirrorModalOpen(false)
      // Reset form
      setFormData({
        catalogName: "",
        endpoint: "",
        credentials: "",
        readOnly: true,
      })
    }
  }

  // Filter catalogs based on search query
  const filteredCatalogs = catalogs?.filter((catalog) => {
    if (
      searchQuery &&
      !catalog.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }
    return true
  })

  const handleDeleteClick = (catalog: string) => {
    deleteCatalog({
      path: {
        catalogName: catalog,
      },
    })
      .then(() => {
        toast({
          title: "Catalog deleted successfully",
          description: "The catalog has been removed from the database.",
        })
        refetchCatalogs()
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Failed to delete catalog",
          description: errorToString(error),
        })
      })
  }

  const handleInfoClick = (catalog: string) => {
    router.push(`/data/catalog?catalog=${catalog}`)
  }

  if (isLoadingCatalogs) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
      </div>
    )
  }

  // Calculate catalog stats
  const catalogStats = catalogs?.reduce(
    (acc, catalog) => {
      const catalogNamespaces = namespaces.filter(
        (ns) => ns.catalog === catalog
      )
      const catalogTables = tables.filter((t) => t.catalog === catalog)
      const totalStorageSize = catalogTables.reduce((sum, table) => {
        return sum + (table.dataFileSizeInBytes || 0)
      }, 0)

      acc[catalog] = {
        namespaceCount: catalogNamespaces.length,
        tableCount: catalogTables.length,
        storageSize: totalStorageSize,
        lastModified:
          catalogTables.length > 0
            ? new Date(
                Math.max(
                  ...catalogTables.map((t) => {
                    const key = `${t.catalog}.${t.namespace}.${t.table}`
                    return (
                      tableMetadataMap[key]?.metadata?.["last-updated-ms"] || 0
                    )
                  })
                )
              )
            : new Date(),
      }
      return acc
    },
    {} as Record<
      string,
      {
        namespaceCount: number
        tableCount: number
        storageSize: number
        lastModified: Date
      }
    >
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
      {/* Search Bar */}
      <div className="border-b bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Catalogs</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Search catalogs..."
              className="h-10 pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Create Catalog Button Group */}
          <div className="flex">
            <Button
              className="rounded-r-none"
              onClick={() => setCreateModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Catalog
            </Button>
            <Button
              variant="outline"
              className="rounded-l-none border-l-0 px-2"
              onClick={() => setMirrorModalOpen(true)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Catalogs Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCatalogs?.map((catalog, index) => (
            <Card
              key={index}
              className="overflow-hidden border border-gray-200 transition-shadow duration-200 hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium">{catalog}</h3>
                        <button
                          onClick={() => handleInfoClick(catalog)}
                          className="ml-2 flex items-center text-xs text-blue-500 hover:text-blue-700"
                        >
                          Info
                        </button>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Namespaces:</span>
                          <span className="font-medium">
                            {isLoadingNamespaces ? (
                              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                            ) : (
                              catalogStats[catalog]?.namespaceCount || 0
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Tables:</span>
                          <span className="font-medium">
                            {isLoadingTables ||
                            tableMetadataQueries.some((q) => q.isLoading) ? (
                              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                            ) : (
                              catalogStats[catalog]?.tableCount || 0
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Storage Size:</span>
                          <span className="font-medium">
                            {isLoadingTables ||
                            catalogConfigs.some((q) => q.isLoading) ||
                            tableMetadataQueries.some((q) => q.isLoading) ? (
                              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                            ) : catalogStats[catalog]?.storageSize ? (
                              `${(catalogStats[catalog].storageSize / (1024 * 1024)).toFixed(2)} MB`
                            ) : (
                              "0 MB"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Last Modified:</span>
                          <span>
                            {isLoadingTables ||
                            catalogConfigs.some((q) => q.isLoading) ||
                            tableMetadataQueries.some((q) => q.isLoading) ? (
                              <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                            ) : catalogStats[catalog]?.lastModified ? (
                              formatDistanceToNow(
                                catalogStats[catalog].lastModified,
                                { addSuffix: true }
                              )
                            ) : (
                              "Never"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the catalog and remove it from the database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClick(catalog)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="flex border-t">
                  <Link
                    href={`/data/namespaces?catalog=${catalog}`}
                    className="flex-1 px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    View Namespaces
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredCatalogs?.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No catalogs found matching your criteria
          </div>
        )}
      </div>

      {/* Catalog Info Dialog */}
      <Dialog
        open={!!selectedCatalog}
        onOpenChange={(open) => !open && setSelectedCatalog(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Catalog Information</DialogTitle>
            <DialogDescription>
              Detailed information about catalog: {selectedCatalog}
            </DialogDescription>
          </DialogHeader>
          {selectedCatalog && catalogConfigMap[selectedCatalog] && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Type:</span>
                  <span>
                    {catalogConfigMap[selectedCatalog].defaults?.type || "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Warehouse:</span>
                  <span>
                    {catalogConfigMap[selectedCatalog].defaults?.warehouse ||
                      "N/A"}
                  </span>
                </div>
                {catalogConfigMap[selectedCatalog].defaults?.properties && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">Properties:</h4>
                    <div className="rounded-md bg-gray-50 p-3">
                      <pre className="text-sm">
                        {JSON.stringify(
                          catalogConfigMap[selectedCatalog].defaults.properties,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                )}
                {catalogConfigMap[selectedCatalog].overrides &&
                  Object.keys(catalogConfigMap[selectedCatalog].overrides)
                    .length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium">Overrides:</h4>
                      <div className="rounded-md bg-gray-50 p-3">
                        <pre className="text-sm">
                          {JSON.stringify(
                            catalogConfigMap[selectedCatalog].overrides,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSelectedCatalog(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mirror External Catalog Modal */}
      <Dialog open={mirrorModalOpen} onOpenChange={setMirrorModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Mirror External Catalog</DialogTitle>
            <DialogDescription>
              Connect to an external Iceberg catalog to mirror its data in
              Nimtable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="catalogName">Catalog Name</Label>
              <Input
                id="catalogName"
                name="catalogName"
                placeholder="e.g., external_warehouse"
                value={formData.catalogName}
                onChange={handleInputChange}
                className={formErrors.catalogName ? "border-red-500" : ""}
              />
              {formErrors.catalogName && (
                <p className="text-xs text-red-500">{formErrors.catalogName}</p>
              )}
              <p className="text-xs text-gray-500">
                Use lowercase letters, numbers, and underscores only
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endpoint">REST Catalog Endpoint</Label>
              <Input
                id="endpoint"
                name="endpoint"
                placeholder="https://example.com/api/catalog"
                value={formData.endpoint}
                onChange={handleInputChange}
                className={formErrors.endpoint ? "border-red-500" : ""}
              />
              {formErrors.endpoint && (
                <p className="text-xs text-red-500">{formErrors.endpoint}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credentials">Access Token or Credentials</Label>
              <Input
                id="credentials"
                name="credentials"
                type="password"
                placeholder="Enter access token"
                value={formData.credentials}
                onChange={handleInputChange}
                className={formErrors.credentials ? "border-red-500" : ""}
              />
              {formErrors.credentials && (
                <p className="text-xs text-red-500">{formErrors.credentials}</p>
              )}
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="readOnly"
                checked={formData.readOnly}
                onCheckedChange={handleToggleChange}
              />
              <Label htmlFor="readOnly">Read-only mode</Label>
            </div>
            <p className="text-xs text-gray-500">
              Read-only mode prevents any modifications to the external catalog
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMirrorModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Catalog Modal */}
      <CreateCatalogModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => {
          setCreateModalOpen(false)
          refetchCatalogs()
        }}
      />
    </div>
  )
}
