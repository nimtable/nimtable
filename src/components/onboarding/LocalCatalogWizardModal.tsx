"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createCatalog, getCatalogs } from "@/lib/client"
import { errorToString } from "@/lib/utils"

type Step = 1 | 2

export function LocalCatalogWizardModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()

  const [step, setStep] = useState<Step>(1)
  const [isWorking, setIsWorking] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const [warehouse, setWarehouse] = useState("/tmp/warehouse")
  const [catalog, setCatalog] = useState("local")

  useEffect(() => {
    if (!open) return
    setLastError(null)
    setStep(1)
  }, [open])

  const canContinue = useMemo(
    () => Boolean(warehouse.trim()) && Boolean(catalog.trim()),
    [warehouse, catalog]
  )

  async function ensureCatalogExists(): Promise<void> {
    const result = await createCatalog({
      body: {
        name: catalog.trim(),
        type: "hadoop",
        uri: "",
        warehouse: warehouse.trim(),
        properties: {},
      },
      throwOnError: false,
    })

    if (!result.error) return

    // Idempotent UX: if the catalog already exists, treat as success.
    const catalogs = await getCatalogs({ throwOnError: false })
    if (!catalogs.error && (catalogs.data || []).includes(catalog.trim())) {
      return
    }

    const status = result.response?.status
    const statusText = result.response?.statusText
    const message = errorToString(result.error)
    throw new Error(
      status
        ? `HTTP ${status}${statusText ? ` ${statusText}` : ""}: ${message}`
        : message
    )
  }

  async function handleCreate() {
    setIsWorking(true)
    setLastError(null)
    try {
      await ensureCatalogExists()
      toast({
        title: "Local catalog ready",
        description: `Created or reused catalog "${catalog}".`,
      })

      // Requirement: after creating local catalog, take the user to Catalogs.
      window.location.assign("/data/catalogs")
    } catch (e) {
      const msg = errorToString(e)
      setLastError(msg)
      toast({
        variant: "destructive",
        title: "Failed to create local catalog",
        description: msg,
      })
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create local Iceberg catalog</DialogTitle>
          <DialogDescription>
            Create a Hadoop catalog backed by a local filesystem warehouse
            directory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step <span className="font-medium text-foreground">{step}</span> /
              2
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLastError(null)
                setStep(1)
              }}
            >
              Reset
            </Button>
          </div>

          <Separator />

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="local-warehouse">
                  Warehouse path (inside Nimtable)
                </Label>
                <Input
                  id="local-warehouse"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  placeholder="/tmp/warehouse"
                />
                <p className="text-xs text-muted-foreground">
                  Iceberg stores table data + metadata files under this
                  directory.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local-catalog">Catalog name</Label>
                <Input
                  id="local-catalog"
                  value={catalog}
                  onChange={(e) => setCatalog(e.target.value)}
                  placeholder="local"
                />
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                <div className="font-medium text-foreground">
                  What this creates
                </div>
                <div className="mt-1 text-muted-foreground">
                  An Iceberg Hadoop catalog pointing to{" "}
                  <code>{warehouse || "…"}</code>.
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm">
                Nimtable will register a REST endpoint at{" "}
                <code>/api/catalog/{catalog}/...</code>.
              </p>
              <p className="text-xs text-muted-foreground">
                After creation, you will be redirected to the Catalogs page to
                confirm the catalog exists.
              </p>
            </div>
          )}

          {lastError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <div className="font-medium">Error</div>
              <div className="mt-1 text-muted-foreground">{lastError}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isWorking}
          >
            Close
          </Button>

          {step === 1 && (
            <Button
              onClick={() => setStep(2)}
              disabled={!canContinue || isWorking}
            >
              Continue
            </Button>
          )}

          {step === 2 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                disabled={isWorking}
              >
                Back
              </Button>
              <Button onClick={handleCreate} disabled={isWorking}>
                {isWorking ? "Creating..." : "Create local catalog"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
