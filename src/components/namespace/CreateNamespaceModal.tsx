/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client"

import { useState } from "react"
import { Plus, Trash2, FolderTree } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createNamespace } from "@/lib/data-loader"

interface CreateNamespaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogs: string[]
  defaultCatalog?: string
  parentNamespace?: string // For creating sub-namespaces
}

interface NamespaceFormData {
  catalog: string
  namespace: string
  properties: { key: string; value: string }[]
}

export function CreateNamespaceModal({
  open,
  onOpenChange,
  catalogs,
  defaultCatalog,
  parentNamespace,
}: CreateNamespaceModalProps) {
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<NamespaceFormData>({
    catalog: defaultCatalog || "",
    namespace: "",
    properties: [],
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCatalogChange = (value: string) => {
    setFormData((prev) => ({ ...prev, catalog: value }))
  }

  const handlePropertyChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    setFormData((prev) => {
      const newProperties = [...prev.properties]
      newProperties[index] = { ...newProperties[index], [field]: value }
      return { ...prev, properties: newProperties }
    })
  }

  const addProperty = () => {
    setFormData((prev) => ({
      ...prev,
      properties: [...prev.properties, { key: "", value: "" }],
    }))
  }

  const removeProperty = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index),
    }))
  }

  const resetForm = () => {
    setFormData({
      catalog: defaultCatalog || "",
      namespace: "",
      properties: [],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.catalog) {
        throw new Error("Catalog is required")
      }
      if (!formData.namespace.trim()) {
        throw new Error("Namespace name is required")
      }

      // Convert properties array to object
      const properties = formData.properties.reduce(
        (acc, { key, value }) => {
          if (key && value) {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, string>
      )

      // If we have a parent namespace, prepend it to the new namespace name
      const finalNamespace = parentNamespace 
        ? `${parentNamespace}.${formData.namespace.trim()}`
        : formData.namespace.trim()

      await createNamespace(formData.catalog, finalNamespace, properties)

      toast({
        title: "Namespace created successfully",
        description: `Namespace "${finalNamespace}" has been created in catalog "${formData.catalog}".`,
      })

      // Invalidate queries to refresh the namespace list
      queryClient.invalidateQueries({ queryKey: ["namespaces"] })
      queryClient.invalidateQueries({ queryKey: ["namespaces", formData.catalog] })

      resetForm()
      onOpenChange(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred"
      console.error("Create Namespace Error:", error)
      toast({
        variant: "destructive",
        title: "Failed to create namespace",
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <FolderTree className="h-4 w-4 text-blue-600" />
            </div>
            {parentNamespace ? `Create Sub-namespace under ${parentNamespace}` : "Create New Namespace"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="catalog">Catalog</Label>
            <Select 
              value={formData.catalog} 
              onValueChange={handleCatalogChange}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a catalog" />
              </SelectTrigger>
              <SelectContent>
                {catalogs.map((catalog) => (
                  <SelectItem key={catalog} value={catalog}>
                    {catalog}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="namespace">
              {parentNamespace ? "Sub-namespace Name" : "Namespace Name"}
            </Label>
            <Input
              id="namespace"
              name="namespace"
              value={formData.namespace}
              onChange={handleChange}
              placeholder={
                parentNamespace 
                  ? "e.g., staging (will create: " + parentNamespace + ".staging)"
                  : "e.g., data_warehouse or analytics.staging"
              }
              disabled={isSubmitting}
              required
            />
            <p className="text-sm text-muted-foreground">
              {parentNamespace ? (
                <>
                  Enter the name for the sub-namespace. It will be created as <strong>{parentNamespace}.{formData.namespace || "[name]"}</strong>
                </>
              ) : (
                "Use dot notation for nested namespaces (e.g., analytics.staging)"
              )}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Properties (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProperty}
                className="h-8"
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Property
              </Button>
            </div>
            <div className="space-y-3">
              {formData.properties.map((property, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Key"
                    value={property.key}
                    onChange={(e) =>
                      handlePropertyChange(index, "key", e.target.value)
                    }
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Input
                    placeholder="Value"
                    value={property.value}
                    onChange={(e) =>
                      handlePropertyChange(index, "value", e.target.value)
                    }
                    className="flex-1"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProperty(index)}
                    className="h-9 w-9"
                    disabled={isSubmitting}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {formData.properties.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No properties configured. Click "Add Property" to add custom properties.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.catalog ||
                !formData.namespace.trim()
              }
            >
              {isSubmitting ? "Creating..." : "Create Namespace"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
