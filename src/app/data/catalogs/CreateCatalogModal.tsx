"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Database } from "lucide-react"

import { CreateCatalogForm } from "./CreateCatalogForm"
import { Button } from "@/components/ui/button"

interface CreateCatalogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateCatalogModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCatalogModalProps) {
  const renderSubmitButton = ({
    isSubmitting,
    isInputPhase,
    formData,
  }: {
    isSubmitting: boolean
    isInputPhase: boolean
    formData: {
      name: string
      type: string
      uri: string
      warehouse: string
      properties: {
        key: string
        value: string
      }[]
    }
  }) => {
    return (
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        {!isInputPhase && (
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.name ||
              !formData.type ||
              !formData.warehouse
            }
          >
            {isSubmitting ? "Creating..." : "Create Catalog"}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Create New Catalog
          </DialogTitle>
        </DialogHeader>
        <CreateCatalogForm
          onSuccess={() => {
            onOpenChange(false)
            onSuccess?.()
          }}
          renderSubmitButton={renderSubmitButton}
        />
      </DialogContent>
    </Dialog>
  )
}
