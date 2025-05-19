"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Plus,
  Search,
  Settings,
  Shield,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { useCatalogs } from "../hooks/useCatalogs"
import { CreateCatalogModal } from "./CreateCatalogModal"

// Mock data for catalogs
const catalogs = [
  {
    id: "1",
    name: "nimtable_catalog",
    namespaceCount: 5,
    tableCount: 24,
    storageSize: "42.7 GB",
    lastModified: "2 hours ago",
    status: "Healthy",
    type: "Native",
  },
  {
    id: "2",
    name: "analytics_catalog",
    namespaceCount: 3,
    tableCount: 12,
    storageSize: "18.3 GB",
    lastModified: "1 day ago",
    status: "Healthy",
    type: "Native",
  },
  {
    id: "3",
    name: "staging_catalog",
    namespaceCount: 2,
    tableCount: 8,
    storageSize: "7.5 GB",
    lastModified: "3 days ago",
    status: "Needs Attention",
    type: "Native",
  },
  {
    id: "4",
    name: "external_data_source",
    namespaceCount: 4,
    tableCount: 16,
    storageSize: "23.1 GB",
    lastModified: "12 hours ago",
    status: "Healthy",
    type: "Mirrored",
  },
  {
    id: "5",
    name: "legacy_warehouse",
    namespaceCount: 1,
    tableCount: 5,
    storageSize: "3.2 GB",
    lastModified: "5 days ago",
    status: "Error",
    type: "Mirrored",
  },
]

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Healthy":
        return <Check className="h-4 w-4" />
      case "Needs Attention":
        return <AlertTriangle className="h-4 w-4" />
      case "Error":
        return <X className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Healthy":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "Needs Attention":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200"
      case "Error":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    return type === "Mirrored" ? (
      <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
    ) : (
      <Shield className="h-3.5 w-3.5 ml-1.5" />
    )
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

  if (isLoadingCatalogs) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Search Bar */}
      <div className="p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Catalogs</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search catalogs..."
              className="pl-9 h-10"
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
              <Plus className="h-4 w-4 mr-2" />
              Create Catalog
            </Button>
            <Button
              variant="outline"
              className="rounded-l-none border-l-0 px-2"
              onClick={() => setMirrorModalOpen(true)}
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Mirror External Catalog</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Catalogs Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCatalogs?.map((catalog, index) => (
            <Card
              key={index}
              className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium">{catalog}</h3>
                        <span className="text-xs text-gray-500 flex items-center ml-2">
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
                    {/* <Badge
                      variant="outline"
                      className={`flex items-center gap-1 ${getStatusColor(
                        catalog.status
                      )}`}
                    >
                      {getStatusIcon(catalog.status)}
                      {catalog.status}
                    </Badge> */}
                  </div>
                </div>
                <div className="flex border-t">
                  <Link
                    href={`/data/namespaces?catalog=${catalog}`}
                    className="flex-1 py-3 px-4 text-center text-sm font-medium text-blue-600 hover:bg-blue-50"
                  >
                    View Namespaces
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {filteredCatalogs?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
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
