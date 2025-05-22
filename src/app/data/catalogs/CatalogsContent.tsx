"use client"

import { ExternalLink, Plus, Search, Trash2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { deleteCatalog } from "@/lib/client"
import { errorToString } from "@/lib/utils"

import { CreateCatalogModal } from "./CreateCatalogModal"
import { useCatalogs } from "../hooks/useCatalogs"

export function CatalogsContent() {
  const {
    catalogs,
    isLoading: isLoadingCatalogs,
    refetch: refetchCatalogs,
  } = useCatalogs()
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

  if (isLoadingCatalogs) {
    return <div>Loading...</div>
  }

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
                        <span className="ml-2 flex items-center text-xs text-gray-500">
                          {/* {catalog.type}
                          {getTypeIcon(catalog.type)} */}
                          catalogType
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Namespaces:</span>
                          <span className="font-medium">
                            {/* {catalog.namespaceCount} */}
                            namespaceCount
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Tables:</span>
                          <span className="font-medium">
                            {/* {catalog.tableCount} */}
                            tableCount
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Storage Size:</span>
                          <span className="font-medium">
                            {/* {catalog.storageSize} */}
                            storageSize
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="w-32">Last Modified:</span>
                          {/* <span>{catalog.lastModified}</span> */}
                          lastModified
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
