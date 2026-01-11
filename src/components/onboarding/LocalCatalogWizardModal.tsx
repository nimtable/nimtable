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
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createCatalog, getCatalogs } from "@/lib/client"
import { runQuery } from "@/lib/data-loader"
import { errorToString } from "@/lib/utils"
import { SqlCodeBlock } from "@/components/shared/SqlCodeBlock"
import { ChevronDown, Copy } from "lucide-react"

type Step = 1 | 2 | 3 | 4

export function LocalCatalogWizardModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const MAX_DEMO_ROWS = 100000

  const [step, setStep] = useState<Step>(1)
  const [isWorking, setIsWorking] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [seedSql, setSeedSql] = useState<string[] | null>(null)
  const [seedSummary, setSeedSummary] = useState<string | null>(null)
  const [seedError, setSeedError] = useState<string | null>(null)
  const [stepSql, setStepSql] = useState<Record<number, string[]>>({})
  const [stepStatus, setStepStatus] = useState<
    Record<number, "idle" | "working" | "done" | "error">
  >({ 1: "idle", 2: "idle", 3: "idle", 4: "idle" })
  const [stepError, setStepError] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
    4: null,
  })

  const [warehouse, setWarehouse] = useState("/tmp/warehouse")
  const [catalog, setCatalog] = useState("local")
  const [createDemo, setCreateDemo] = useState(true)
  const [demoNamespace, setDemoNamespace] = useState("nimtable_demo")
  const [demoTable, setDemoTable] = useState("sample")
  const [demoRows, setDemoRows] = useState(1000)

  useEffect(() => {
    if (!open) return
    setLastError(null)
    setSeedSql(null)
    setSeedSummary(null)
    setSeedError(null)
    setStepSql({})
    setStepStatus({ 1: "idle", 2: "idle", 3: "idle", 4: "idle" })
    setStepError({ 1: null, 2: null, 3: null, 4: null })
    setStep(1)
  }, [open])

  // If the user edits earlier inputs, later steps should be re-run.
  useEffect(() => {
    setStepStatus({ 1: "idle", 2: "idle", 3: "idle", 4: "idle" })
    setStepSql({})
    setStepError({ 1: null, 2: null, 3: null, 4: null })
    setSeedSql(null)
    setSeedSummary(null)
    setSeedError(null)
    setLastError(null)
    setStep(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warehouse, catalog])

  useEffect(() => {
    setStepStatus((prev) => ({ ...prev, 2: "idle", 3: "idle", 4: "idle" }))
    setStepSql((prev) => {
      const { 2: _2, 3: _3, 4: _4, ...rest } = prev
      return rest
    })
    setStepError((prev) => ({ ...prev, 2: null, 3: null, 4: null }))
  }, [demoNamespace])

  useEffect(() => {
    setStepStatus((prev) => ({ ...prev, 3: "idle", 4: "idle" }))
    setStepSql((prev) => {
      const { 3: _3, 4: _4, ...rest } = prev
      return rest
    })
    setStepError((prev) => ({ ...prev, 3: null, 4: null }))
  }, [demoTable])

  useEffect(() => {
    setStepStatus((prev) => ({ ...prev, 4: "idle" }))
    setStepSql((prev) => {
      const { 4: _4, ...rest } = prev
      return rest
    })
    setStepError((prev) => ({ ...prev, 4: null }))
  }, [demoRows])

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

  async function runStep(stepToRun: Step) {
    setIsWorking(true)
    setLastError(null)
    setSeedSummary(null)
    setSeedError(null)
    setStepStatus((prev) => ({ ...prev, [stepToRun]: "working" }))
    setStepError((prev) => ({ ...prev, [stepToRun]: null }))

    try {
      const trimmedCatalog = catalog.trim()
      const namespace = demoNamespace.trim()
      const table = demoTable.trim()

      // Guard against empty catalog name (would hit /api/catalogs//seed-demo and fall back to createCatalog).
      if (!trimmedCatalog) {
        toast({
          variant: "destructive",
          title: "Catalog name is required",
          description: "Please go back to Step 1 and set a catalog name.",
        })
        setStep(1)
        return
      }

      if (stepToRun === 1) {
        await ensureCatalogExists()

        setStepStatus((prev) => ({ ...prev, 1: "done" }))
        toast({
          title: "Catalog ready",
          description: `Created or reused catalog "${trimmedCatalog}".`,
        })
        // Auto-advance to next meaningful step.
        if (createDemo) {
          setStep(2)
        } else {
          window.location.assign("/data/catalogs")
        }
        return
      }

      // Ensure steps are run in order.
      if (stepToRun >= 2 && stepStatus[1] !== "done") {
        toast({
          variant: "destructive",
          title: "Create the catalog first",
          description: "Please complete Step 1 before creating a namespace.",
        })
        setStep(1)
        return
      }
      if (stepToRun >= 3 && stepStatus[2] !== "done") {
        toast({
          variant: "destructive",
          title: "Create the namespace first",
          description: "Please complete Step 2 before creating a table.",
        })
        setStep(2)
        return
      }
      if (stepToRun >= 4 && stepStatus[3] !== "done") {
        toast({
          variant: "destructive",
          title: "Create the table first",
          description: "Please complete Step 3 before populating the table.",
        })
        setStep(3)
        return
      }

      if (!createDemo) {
        throw new Error("Demo data creation is disabled.")
      }

      const qCatalog = quoteIdent(trimmedCatalog)
      const qNamespace = quoteIdent(namespace)
      const qTable = quoteIdent(table)

      const statements: string[] = []

      if (stepToRun === 2) {
        const sql = `CREATE NAMESPACE IF NOT EXISTS ${qCatalog}.${qNamespace}`
        statements.push(sql)
        await runQuery(sql)
        setSeedSummary(`Created namespace ${trimmedCatalog}.${namespace}.`)
      } else if (stepToRun === 3) {
        const sql =
          `CREATE TABLE IF NOT EXISTS ${qCatalog}.${qNamespace}.${qTable} (` +
          `id BIGINT, name STRING, created_at TIMESTAMP` +
          `) USING iceberg`
        statements.push(sql)
        await runQuery(sql)
        setSeedSummary(`Created table ${trimmedCatalog}.${namespace}.${table}.`)
      } else {
        // Step 4: populate (skip insert if table already has rows)
        const countSql = `SELECT count(*) AS c FROM ${qCatalog}.${qNamespace}.${qTable}`
        statements.push(countSql)
        const countResult = await runQuery(countSql)
        const count =
          typeof countResult.rows?.[0]?.[0] === "number"
            ? (countResult.rows[0][0] as number)
            : Number(countResult.rows?.[0]?.[0] ?? 0)

        if (Number.isFinite(count) && count > 0) {
          setSeedSummary(
            `Table ${trimmedCatalog}.${namespace}.${table} already has data; skipped insert.`
          )
        } else {
          const rows = Math.max(
            0,
            Math.min(MAX_DEMO_ROWS, Math.floor(Number(demoRows) || 0))
          )
          if (rows <= 0) {
            setSeedSummary(
              `No rows inserted into ${trimmedCatalog}.${namespace}.${table}.`
            )
          } else {
            const insertSql =
              `INSERT INTO ${qCatalog}.${qNamespace}.${qTable} ` +
              `SELECT CAST(id + 1 AS BIGINT) AS id, ` +
              `concat('user_', CAST(id + 1 AS STRING)) AS name, ` +
              `current_timestamp() AS created_at ` +
              `FROM range(${rows})`
            statements.push(insertSql)
            await runQuery(insertSql)
            setSeedSummary(
              `Inserted ${rows} row(s) into ${trimmedCatalog}.${namespace}.${table}.`
            )
          }
        }
      }

      setStepSql((prev) => ({ ...prev, [stepToRun]: statements }))
      setSeedSql(statements)

      setStepStatus((prev) => ({ ...prev, [stepToRun]: "done" }))

      // Auto-advance (no manual Next clicks).
      if (stepToRun === 2) setStep(3)
      if (stepToRun === 3) setStep(4)
      if (stepToRun === 4) window.location.assign("/data/catalogs")
    } catch (e) {
      const msg = errorToString(e)
      setStepStatus((prev) => ({ ...prev, [stepToRun]: "error" }))
      setStepError((prev) => ({ ...prev, [stepToRun]: msg }))
      toast({
        variant: "destructive",
        title: "Step failed",
        description: msg,
      })
    } finally {
      setIsWorking(false)
    }
  }

  const trimmedCatalog = catalog.trim() || "local"
  const trimmedNamespace = demoNamespace.trim() || "nimtable_demo"
  const trimmedTable = demoTable.trim() || "sample"
  const demoFqn = `${trimmedCatalog}.${trimmedNamespace}.${trimmedTable}`

  const previewSqlNamespace = `CREATE NAMESPACE IF NOT EXISTS \`${trimmedCatalog}\`.\`${trimmedNamespace}\`;`

  const previewSqlTable = `CREATE TABLE IF NOT EXISTS \`${trimmedCatalog}\`.\`${trimmedNamespace}\`.\`${trimmedTable}\` (id BIGINT, name STRING, created_at TIMESTAMP) USING iceberg;`

  const clampedRows = Math.max(
    0,
    Math.min(MAX_DEMO_ROWS, Math.floor(Number(demoRows) || 0))
  )
  const previewSqlPopulateStatements = [
    `SELECT count(*) AS c FROM \`${trimmedCatalog}\`.\`${trimmedNamespace}\`.\`${trimmedTable}\`;`,
    ...(clampedRows > 0
      ? [
          `INSERT INTO \`${trimmedCatalog}\`.\`${trimmedNamespace}\`.\`${trimmedTable}\` ` +
            `SELECT CAST(id + 1 AS BIGINT) AS id, ` +
            `concat('user_', CAST(id + 1 AS STRING)) AS name, ` +
            `current_timestamp() AS created_at ` +
            `FROM range(${clampedRows});`,
        ]
      : []),
  ]
  const previewSqlPopulate = previewSqlPopulateStatements.join("\n")

  function quoteIdent(v: string) {
    return "`" + (v || "").replace(/`/g, "``") + "`"
  }

  function normalizeSqlForCompare(sql: string) {
    return (sql || "")
      .trim()
      .replace(/;+\s*$/g, "")
      .replace(/\s+/g, " ")
      .toLowerCase()
  }

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast({ title: "Copied", description: label })
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: errorToString(e),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create local Iceberg catalog</DialogTitle>
          <DialogDescription>
            Set up a local catalog and (optionally) create a demo table so you
            can start exploring immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 min-h-0 overflow-y-auto pr-1">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Step <span className="font-medium text-foreground">{step}</span> /
              4
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLastError(null)
                setSeedSql(null)
                setSeedSummary(null)
                setSeedError(null)
                setStep(1)
              }}
            >
              Reset
            </Button>
          </div>

          <Separator />

          {step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="local-warehouse">
                      Warehouse path (inside Nimtable Docker container)
                    </Label>
                    <Input
                      id="local-warehouse"
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      placeholder="/tmp/warehouse"
                    />
                    <p className="text-xs text-muted-foreground">
                      The <span className="font-medium">warehouse</span> is the
                      folder where Iceberg stores table data and metadata files.
                      This path is inside the Nimtable container filesystem.
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
                    <p className="text-xs text-muted-foreground">
                      This is just a friendly name you’ll use inside Nimtable.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Create demo data (recommended)
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        We’ll create a namespace, a table, and insert a few rows
                        so you have something to browse immediately.
                      </p>
                    </div>
                    <Switch
                      checked={createDemo}
                      onCheckedChange={setCreateDemo}
                      aria-label="Create demo data"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                <div className="font-medium text-foreground">Summary</div>
                <div className="mt-1 text-muted-foreground">
                  We’ll create or reuse a local Iceberg Hadoop catalog named{" "}
                  <code>{trimmedCatalog}</code> pointing to{" "}
                  <code>{warehouse.trim() || "…"}</code>.
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Create namespace
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      A namespace is like a database/schema that groups tables.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-namespace">Namespace name</Label>
                    <Input
                      id="demo-namespace"
                      value={demoNamespace}
                      onChange={(e) => setDemoNamespace(e.target.value)}
                      placeholder="nimtable_demo"
                    />
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                    <div className="font-medium text-foreground">
                      After this step
                    </div>
                    <div className="mt-1 text-muted-foreground space-y-1">
                      <div>
                        - Catalog: <code>{trimmedCatalog}</code> (warehouse{" "}
                        <code>{warehouse.trim() || "…"}</code>)
                      </div>
                      <div>
                        - Namespace:{" "}
                        <code>
                          {trimmedCatalog}.{trimmedNamespace}
                        </code>
                      </div>
                    </div>
                  </div>

                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        Advanced: view SQL (create namespace)
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-foreground">
                          Spark SQL (runs inside Nimtable)
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            copyText("SQL copied", previewSqlNamespace)
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                      <SqlCodeBlock sql={previewSqlNamespace} />
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    Create table
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This creates an Iceberg table under your demo namespace.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Namespace</Label>
                      <Input value={demoNamespace} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="demo-table">Table name</Label>
                      <Input
                        id="demo-table"
                        value={demoTable}
                        onChange={(e) => setDemoTable(e.target.value)}
                        placeholder="sample"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                    <div className="font-medium text-foreground">
                      Table schema
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      <div>
                        <code>id</code> BIGINT
                      </div>
                      <div>
                        <code>name</code> STRING
                      </div>
                      <div>
                        <code>created_at</code> TIMESTAMP
                      </div>
                    </div>
                  </div>

                  {seedSummary && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                      <div className="font-medium text-foreground">
                        Last result
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {seedSummary}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const executed = (stepSql[3] || []).join("\n")
                    const showExecuted =
                      executed &&
                      normalizeSqlForCompare(executed) !==
                        normalizeSqlForCompare(previewSqlTable)
                    const copyTarget = showExecuted ? executed : previewSqlTable
                    return (
                      <Collapsible>
                        <div className="flex items-center justify-between">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                            >
                              Advanced: SQL
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => copyText("SQL copied", copyTarget)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <CollapsibleContent className="mt-2 space-y-3">
                          <div>
                            <div className="mb-2 text-xs font-medium text-foreground">
                              Will run
                            </div>
                            <SqlCodeBlock sql={previewSqlTable} />
                          </div>
                          {showExecuted && (
                            <div>
                              <div className="mb-2 text-xs font-medium text-foreground">
                                Executed
                              </div>
                              <SqlCodeBlock sql={executed} />
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="text-sm font-medium text-foreground">
                    Populate table
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Inserts a few sample rows into <code>{demoFqn}</code>.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="demo-rows">
                      Rows to insert (0-{MAX_DEMO_ROWS.toLocaleString()})
                    </Label>
                    <Input
                      id="demo-rows"
                      type="number"
                      min={0}
                      max={MAX_DEMO_ROWS}
                      value={demoRows}
                      onChange={(e) => setDemoRows(Number(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      This demo can insert many rows. We cap it at{" "}
                      {MAX_DEMO_ROWS.toLocaleString()} to keep it safe.
                    </p>
                  </div>

                  {seedSummary && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                      <div className="font-medium text-foreground">
                        Last result
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        {seedSummary}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const executed = (stepSql[4] || []).join("\n")
                    const showExecuted =
                      executed &&
                      normalizeSqlForCompare(executed) !==
                        normalizeSqlForCompare(previewSqlPopulate)
                    const copyTarget = showExecuted
                      ? executed
                      : previewSqlPopulate
                    return (
                      <Collapsible>
                        <div className="flex items-center justify-between">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                            >
                              Advanced: SQL
                              <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => copyText("SQL copied", copyTarget)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy
                          </Button>
                        </div>
                        <CollapsibleContent className="mt-2 space-y-3">
                          <div>
                            <div className="mb-2 text-xs font-medium text-foreground">
                              Will run
                            </div>
                            <SqlCodeBlock sql={previewSqlPopulate} />
                          </div>
                          {showExecuted && (
                            <div>
                              <div className="mb-2 text-xs font-medium text-foreground">
                                Executed
                              </div>
                              <SqlCodeBlock sql={executed} />
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          )}

          {lastError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <div className="font-medium">Error</div>
              <div className="mt-1 text-muted-foreground">{lastError}</div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isWorking}
          >
            Close
          </Button>

          {step === 1 && (
            <Button
              type="button"
              onClick={() => runStep(1)}
              disabled={!canContinue || isWorking}
            >
              {stepStatus[1] === "working" ? "Creating..." : "Create catalog"}
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
              <Button
                type="button"
                onClick={() => runStep(2)}
                disabled={!createDemo || isWorking}
              >
                {stepStatus[2] === "working"
                  ? "Running..."
                  : "Create namespace"}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep(2)
                }}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => runStep(3)}
                disabled={!createDemo || isWorking}
              >
                {stepStatus[3] === "working" ? "Running..." : "Create table"}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => runStep(4)}
                disabled={!createDemo || isWorking}
              >
                {stepStatus[4] === "working" ? "Running..." : "Populate table"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
