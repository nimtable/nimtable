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
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createCatalog, getCatalogs } from "@/lib/client"
import { setDemoContext } from "@/lib/demo-context"
import { runQuery } from "@/lib/data-loader"
import { errorToString } from "@/lib/utils"

type Step = 1 | 2 | 3 | 4

export function DemoWizardModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()

  const [step, setStep] = useState<Step>(1)
  const [isWorking, setIsWorking] = useState(false)

  const [warehouse, setWarehouse] = useState("/tmp/nimtable-demo-warehouse")
  const [catalog, setCatalog] = useState("demo")
  const [namespace, setNamespace] = useState("quickstart")
  const [table, setTable] = useState("taxi_dataset")
  const [rows, setRows] = useState(500)
  const [resetIfExists, setResetIfExists] = useState(true)

  const [lastError, setLastError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLastError(null)
    setStep(1)
  }, [open])

  const namespaceSql = useMemo(() => {
    return `CREATE NAMESPACE IF NOT EXISTS ${catalog}.${namespace}`
  }, [catalog, namespace])

  const dropSql = useMemo(() => {
    return `DROP TABLE IF EXISTS ${catalog}.${namespace}.${table}`
  }, [catalog, namespace, table])

  const createTableSql = useMemo(() => {
    const safeRows = Math.max(10, Math.min(20000, Math.floor(rows || 0)))
    return `CREATE TABLE ${catalog}.${namespace}.${table}
USING iceberg
AS
SELECT
  id AS ride_id,
  CAST(id % 6 + 1 AS INT) AS passenger_count,
  CAST(id * 0.1 AS DOUBLE) AS trip_distance,
  CAST(id % 100 AS DOUBLE) AS tip_amount,
  current_timestamp() AS created_at
FROM range(0, ${safeRows})`
  }, [catalog, namespace, table, rows])

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

    // Make this step idempotent: if catalog already exists, treat as success.
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

  async function runSingleSql(sql: string): Promise<void> {
    const res = await runQuery(sql)
    if (res.error) throw new Error(res.error)
  }

  async function handleCreateCatalog() {
    setIsWorking(true)
    setLastError(null)
    try {
      await ensureCatalogExists()
      toast({
        title: "Catalog ready",
        description: `Created or reused catalog "${catalog}".`,
      })
      // Requirement: after creating the demo catalog, take the user to Catalogs.
      window.location.assign("/data/catalogs")
    } catch (e) {
      const msg = errorToString(e)
      setLastError(msg)
      toast({
        variant: "destructive",
        title: "Failed to create catalog",
        description: msg,
      })
    } finally {
      setIsWorking(false)
    }
  }

  async function handleCreateTable() {
    setIsWorking(true)
    setLastError(null)
    try {
      if (resetIfExists) {
        await runSingleSql(dropSql)
      }
      await runSingleSql(namespaceSql)
      await runSingleSql(createTableSql)

      toast({
        title: "Demo table created",
        description: `${catalog}.${namespace}.${table} is ready.`,
      })

      // Persist demo context so the UI can show the "Demo ready" banner elsewhere.
      setDemoContext({ catalog, namespace, table })

      // Requirement: after creating the demo catalog/table, send user to Catalogs.
      // Use a hard navigation to avoid any client-side routing race conditions.
      window.location.assign("/data/catalogs")

      // The Catalogs page will fetch fresh state; avoid triggering a Dashboard refresh race here.
    } catch (e) {
      const msg = errorToString(e)
      setLastError(msg)
      toast({
        variant: "destructive",
        title: "Failed to create table",
        description: msg,
      })
    } finally {
      setIsWorking(false)
    }
  }

  const canContinueStep1 = Boolean(warehouse.trim()) && Boolean(catalog.trim())
  const canContinueStep3 =
    Boolean(namespace.trim()) &&
    Boolean(table.trim()) &&
    Number.isFinite(rows) &&
    rows > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Create a real Iceberg demo</DialogTitle>
          <DialogDescription>
            This wizard creates an Iceberg Hadoop catalog and a small Iceberg
            table using Nimtable&apos;s built-in Spark.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step <span className="text-foreground font-medium">{step}</span> /
              4
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLastError(null)
                setStep(1)
              }}
            >
              Reset wizard
            </Button>
          </div>

          <Separator />

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="demo-warehouse">
                  Warehouse path (inside Nimtable)
                </Label>
                <Input
                  id="demo-warehouse"
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  placeholder="/tmp/nimtable-demo-warehouse"
                />
                <p className="text-xs text-muted-foreground">
                  Iceberg stores table data + metadata files under this
                  directory.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo-catalog">Catalog name</Label>
                <Input
                  id="demo-catalog"
                  value={catalog}
                  onChange={(e) => setCatalog(e.target.value)}
                  placeholder="demo"
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
                Create the Iceberg catalog in Nimtable. This registers a REST
                endpoint at <code>/api/catalog/{catalog}/...</code>.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="demo-namespace">Namespace</Label>
                  <Input
                    id="demo-namespace"
                    value={namespace}
                    onChange={(e) => setNamespace(e.target.value)}
                    placeholder="quickstart"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-table">Table</Label>
                  <Input
                    id="demo-table"
                    value={table}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="taxi_dataset"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="demo-rows">Rows to generate (10–20000)</Label>
                  <Input
                    id="demo-rows"
                    type="number"
                    min={10}
                    max={20000}
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <input
                    id="demo-reset"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={resetIfExists}
                    onChange={(e) => setResetIfExists(e.target.checked)}
                  />
                  <Label htmlFor="demo-reset" className="text-sm">
                    Reset table if it already exists
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Generated Spark SQL</Label>
                <Textarea
                  value={
                    (resetIfExists ? `${dropSql}\n\n` : "") +
                    `${namespaceSql}\n\n${createTableSql}`
                  }
                  readOnly
                  className="font-mono text-xs min-h-[180px]"
                />
                <p className="text-xs text-muted-foreground">
                  Nimtable runs this SQL using its built-in Spark engine.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                Demo is ready:{" "}
                <code>
                  {catalog}.{namespace}.{table}
                </code>
              </div>
              <div className="text-sm text-muted-foreground">
                Redirecting to <span className="font-medium">Catalogs</span>…
              </div>
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
              disabled={!canContinueStep1 || isWorking}
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
              <Button onClick={handleCreateCatalog} disabled={isWorking}>
                {isWorking ? "Creating..." : "Create catalog"}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                disabled={isWorking}
              >
                Back
              </Button>
              <Button
                onClick={handleCreateTable}
                disabled={!canContinueStep3 || isWorking}
              >
                {isWorking ? "Creating..." : "Create demo table"}
              </Button>
            </div>
          )}

          {step === 4 && (
            <Button
              onClick={() => {
                onOpenChange(false)
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
