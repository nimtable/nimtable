"use client"

import { ExternalLink, FolderTreeIcon, Info, Plus, Search, MoreHorizontal, Unlink } from "lucide-react"
import { useQueries } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import type React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCatalogConfig } from "@/lib/data-loader"
import { getCatalogDetails, loadTableData } from "@/lib/data-loader"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { deleteCatalog } from "@/lib/client/sdk.gen"
import { useQueryClient } from "@tanstack/react-query"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { CreateCatalogModal } from "./CreateCatalogModal"
import { LocalCatalogWizardModal } from "@/components/onboarding/LocalCatalogWizardModal"
import { useNamespaces } from "../hooks/useNamespaces"
import { useCatalogs } from "../hooks/useCatalogs"
import { useAllTables } from "../hooks/useTables"
import { DataHierarchyHeader } from "@/components/data/DataHierarchyHeader"

export function CatalogsContent() {
  const {
    catalogs,
    isLoading: isLoadingCatalogs,
    refetch: refetchCatalogs,
  } = useCatalogs()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { namespaces } = useNamespaces(catalogs || [])
  const { tables, isLoading: isLoadingTables } = useAllTables()
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [mirrorModalOpen, setMirrorModalOpen] = useState<boolean>(false)
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [localCatalogOpen, setLocalCatalogOpen] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    catalogName: "",
    endpoint: "",
    credentials: "",
    readOnly: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null)
  const [disconnectCatalogName, setDisconnectCatalogName] = useState<
    string | null
  >(null)
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

  const catalogDetailsQueries = useQueries({
    queries: (catalogs || []).map((catalog) => ({
      queryKey: ["catalog-details", catalog],
      queryFn: () => getCatalogDetails(catalog),
      enabled: !!catalog,
    })),
  })

  const catalogDetailsMap = catalogDetailsQueries.reduce(
    (acc, query, index) => {
      if (query.data && catalogs?.[index]) {
        acc[catalogs[index]] = query.data
      }
      return acc
    },
    {} as Record<string, any>
  )

  const isLocalCatalog = (catalogName: string) => {
    const cfg = catalogDetailsMap[catalogName]
    const type = cfg?.type
    const warehouse = cfg?.warehouse
    return (
      type === "hadoop" &&
      typeof warehouse === "string" &&
      warehouse.trim().startsWith("/")
    )
  }

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

  const handleInfoClick = (catalog: string) => {
    router.push(`/data/namespaces?catalog=${encodeURIComponent(catalog)}`)
  }

  const handleDisconnectCatalog = async (catalogName: string) => {
    try {
      await deleteCatalog({
        path: {
          catalogName,
        },
        query: {
          purge: false,
        },
      })

      // Clear cached data so other pages (e.g., Dashboard metrics) don't keep showing stale catalog tables.
      queryClient.removeQueries({
        predicate: (q) => {
          const key = q.queryKey
          const root = Array.isArray(key) ? key[0] : key
          return (
            root === "catalogs" ||
            root === "namespaces" ||
            root === "tables" ||
            root === "catalog-config" ||
            root === "catalog-details" ||
            root === "table-metadata" ||
            root === "namespace-children"
          )
        },
      })

      toast({
        title: "Catalog disconnected from Nimtable",
        description:
          "This removed the catalog metadata from Nimtable. External catalog and Iceberg tables/data were not deleted.",
      })

      await refetchCatalogs()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to disconnect catalog from Nimtable",
        description: errorToString(error),
      })
    }
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
    <div className="flex flex-1 flex-col overflow-hidden bg-background min-h-screen">
      <LocalCatalogWizardModal
        open={localCatalogOpen}
        onOpenChange={setLocalCatalogOpen}
      />
      <DataHierarchyHeader
        current="catalogs"
        count={filteredCatalogs?.length || 0}
      />
      {/* Search and actions bar */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search catalogs..."
              className="pl-10 bg-card border-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add catalog
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Connect catalog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocalCatalogOpen(true)}>
                <FolderTreeIcon className="mr-2 h-4 w-4" />
                Create local Iceberg catalog
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setMirrorModalOpen(true)}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Mirror external catalog
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Catalogs Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTreeIcon className="w-5 h-5 text-card-foreground" />
              <h2 className="text-base font-normal text-card-foreground">
                Catalogs ({filteredCatalogs?.length})
              </h2>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-table-header border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    Name
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    Namespaces
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    Tables
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    Storage size
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    Last modified
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-normal text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredCatalogs.map((catalog, index) => (
                  <tr
                    key={index}
                    className="group hover:bg-table-row-hover transition-colors cursor-pointer"
                    onClick={() => {
                      handleInfoClick(catalog)
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-card-foreground">
                      <div className="flex items-center gap-2">
                        <span>{catalog}</span>
                        {isLocalCatalog(catalog) && (
                          <span className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            Local
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                      <a
                        href={`/data/namespaces?catalog=${encodeURIComponent(catalog)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary/80"
                        title="View namespaces"
                      >
                        {catalogStats[catalog]?.namespaceCount || 0}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                      <a
                        href={`/data/tables?catalog=${encodeURIComponent(catalog)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary/80"
                        title="View tables"
                      >
                        {catalogStats[catalog]?.tableCount || 0}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                      {isLoadingTables ||
                      catalogConfigs.some((q) => q.isLoading) ||
                      tableMetadataQueries.some((q) => q.isLoading) ? (
                        <div className="h-4 w-16 inline-block animate-pulse rounded bg-gray-200" />
                      ) : catalogStats[catalog]?.storageSize ? (
                        `${(catalogStats[catalog].storageSize / (1024 * 1024)).toFixed(2)} MB`
                      ) : (
                        "0 MB"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                      <span>
                        {isLoadingTables ||
                        catalogConfigs.some((q) => q.isLoading) ||
                        tableMetadataQueries.some((q) => q.isLoading) ? (
                          <div className="h-4 w-16 animate-pulse rounded inline-block bg-gray-200" />
                        ) : catalogStats[catalog]?.lastModified ? (
                          formatDistanceToNow(
                            catalogStats[catalog].lastModified,
                            { addSuffix: true }
                          )
                        ) : (
                          "Never"
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8"
                            title="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer hover:!bg-accent hover:!text-accent-foreground focus:!bg-accent focus:!text-accent-foreground"
                          >
                            <Link
                              href={`/data/catalog?catalog=${encodeURIComponent(catalog)}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Info className="h-4 w-4" />
                              Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                            onSelect={(e) => {
                              e.preventDefault()
                              setDisconnectCatalogName(catalog)
                            }}
                          >
                            <Unlink className="h-4 w-4" />
                            Disconnect
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCatalogs?.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No catalogs found matching your criteria
            </div>
          )}
        </div>
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

      {/* Disconnect confirmation */}
      <AlertDialog
        open={disconnectCatalogName !== null}
        onOpenChange={(open) => {
          if (!open) setDisconnectCatalogName(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect from Nimtable?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this catalog from Nimtable&apos;s database. It
              will{" "}
              <span className="font-medium">
                not delete the external catalog
              </span>{" "}
              or any <span className="font-medium">Iceberg tables/data</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!disconnectCatalogName) return
                void handleDisconnectCatalog(disconnectCatalogName)
                setDisconnectCatalogName(null)
              }}
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
