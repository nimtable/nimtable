"use client"

import { CreateCatalogForm } from "@/app/data/catalogs/CreateCatalogForm"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { useState } from "react"

type ConnectCatalogStepProps = {
  onSuccess: () => void
}

export function ConnectCatalogStep({ onSuccess }: ConnectCatalogStepProps) {
  const [isConnected, setIsConnected] = useState(false)

  const handleConnect = async () => {
    setIsConnected(true)
    onSuccess()
  }

  return (
    <div className="flex flex-col space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Connect to your Iceberg catalog to get started.
      </p>

      <CreateCatalogForm
        onSuccess={() => {
          handleConnect()
        }}
        renderSubmitButton={({ isSubmitting, isInputPhase, formData }) => {
          if (isInputPhase) {
            return null
          }
          return (
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !formData.name}>
                {isSubmitting ? "Connecting..." : "Connect Catalog"}
              </Button>
            </div>
          )
        }}
      />

      {isConnected && (
        <div className="flex items-center justify-center gap-2 text-green-600">
          <Check className="h-5 w-5" />
          <span>Successfully connected!</span>
        </div>
      )}
    </div>
  )
}
