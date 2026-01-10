"use client"

import { CreateCatalogForm } from "@/app/data/catalogs/CreateCatalogForm"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Check, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

type ConnectCatalogStepProps = {
  onSuccess: () => void
}

export function ConnectCatalogStep({ onSuccess }: ConnectCatalogStepProps) {
  const [isConnected, setIsConnected] = useState(false)
  const router = useRouter()

  const handleConnect = async () => {
    setIsConnected(true)
    onSuccess()
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="space-y-2 text-center">
        <h3 className="text-lg font-semibold">Connect your first catalog</h3>
        <p className="text-sm text-muted-foreground">
          Nimtable needs an Iceberg catalog connection before it can discover
          tables and compute insights.
        </p>
      </div>
      <Separator className="my-6" />

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
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name || !formData.type}
              >
                {isSubmitting ? "Connecting..." : "Connect and validate"}
              </Button>
            </div>
          )
        }}
      />

      {isConnected && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            <span>Catalog connected</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/data/catalogs")}
            >
              Browse catalogs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
