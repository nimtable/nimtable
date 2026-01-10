"use client"

import { useContext, useMemo } from "react"
import { useQueries } from "@tanstack/react-query"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  ChartColumn,
  Clock,
  Layers,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { OverviewContext } from "./OverviewProvider"
import { getTableInfo } from "@/lib/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDemoMode } from "@/contexts/demo-mode-context"
import { DEMO_TABLE_METADATA, getDemoTableKey } from "@/lib/demo-data"

type SnapshotSummary = Record<string, any>

function ms(ts: number) {
  return ts < 1e12 ? ts * 1000 : ts
}

function dayKey(ts: number) {
  const d = new Date(ms(ts))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatDayLabel(key: string) {
  const [y, m, d] = key.split("-").map((x) => parseInt(x, 10))
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function bucketFreshness(hoursAgo: number) {
  if (hoursAgo <= 1) return "0–1h"
  if (hoursAgo <= 6) return "1–6h"
  if (hoursAgo <= 24) return "6–24h"
  if (hoursAgo <= 72) return "1–3d"
  if (hoursAgo <= 168) return "3–7d"
  return "7d+"
}

export function DashboardDataDashboards() {
  const { tables } = useContext(OverviewContext)
  const { demoMode } = useDemoMode()

  const definedTables = useMemo(
    () => tables.filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [tables]
  )

  const totals = useMemo(() => {
    const totalDataBytes = definedTables.reduce(
      (sum, t) => sum + (t.dataFileSizeInBytes || 0),
      0
    )
    const totalRecords = definedTables.reduce(
      (sum, t) => sum + (t.dataFileRecordCount || 0),
      0
    )
    return { totalDataBytes, totalRecords }
  }, [definedTables])

  // Fetch table metadata (snapshots) for trends & freshness.
  const tableInfoQueries = useQueries({
    queries: definedTables.map((table) => ({
      queryKey: ["tableInfo", table.catalog, table.namespace, table.table, demoMode],
      queryFn: async () => {
        if (demoMode) {
          const key = getDemoTableKey(table.catalog, table.namespace, table.table)
          return DEMO_TABLE_METADATA[key]
        }
        const res = await getTableInfo({
          path: {
            catalog: table.catalog,
            namespace: table.namespace,
            table: table.table,
          },
        })
        return res.data
      },
      enabled: !!table,
      staleTime: 60_000,
    })),
  })

  const snapshotsByTable = useMemo(() => {
    return tableInfoQueries
      .map((q, idx) => {
        const t = definedTables[idx]
        const snapshots = (q.data as any)?.metadata?.snapshots ?? []
        const lastUpdated =
          (q.data as any)?.metadata?.["last-updated-ms"] ??
          (snapshots?.[snapshots.length - 1]?.["timestamp-ms"] ?? 0)
        return {
          catalog: t.catalog,
          namespace: t.namespace,
          table: t.table,
          snapshots,
          lastUpdated,
        }
      })
      .filter((x) => x.table)
  }, [definedTables, tableInfoQueries])

  // 1) Change trend (snapshots per day, and "added-records" if present)
  const changeTrend = useMemo(() => {
    const days = new Map<
      string,
      { day: string; changes: number; addedRecords: number }
    >()
    for (const t of snapshotsByTable) {
      for (const s of t.snapshots as any[]) {
        const k = dayKey(s["timestamp-ms"] || 0)
        const entry = days.get(k) ?? { day: k, changes: 0, addedRecords: 0 }
        entry.changes += 1
        const summary: SnapshotSummary | undefined = s.summary
        const added = Number(summary?.["added-records"] ?? 0)
        if (!Number.isNaN(added)) entry.addedRecords += added
        days.set(k, entry)
      }
    }
    const data = Array.from(days.values()).sort((a, b) =>
      a.day.localeCompare(b.day)
    )
    // Only show last 30 points max to keep it readable.
    return data.slice(Math.max(0, data.length - 30)).map((d) => ({
      ...d,
      label: formatDayLabel(d.day),
    }))
  }, [snapshotsByTable])

  const hasAddedRecords = useMemo(
    () => changeTrend.some((d) => d.addedRecords > 0),
    [changeTrend]
  )

  // 2) Freshness distribution (tables bucketed by lastUpdated)
  const freshness = useMemo(() => {
    const buckets = new Map<string, number>()
    const now = Date.now()
    for (const t of snapshotsByTable) {
      const hoursAgo = (now - ms(t.lastUpdated || 0)) / (60 * 60 * 1000)
      const k = bucketFreshness(hoursAgo)
      buckets.set(k, (buckets.get(k) ?? 0) + 1)
    }
    const order = ["0–1h", "1–6h", "6–24h", "1–3d", "3–7d", "7d+"]
    return order.map((k) => ({ bucket: k, tables: buckets.get(k) ?? 0 }))
  }, [snapshotsByTable])

  // 3) Layout health (small file % and delete files)
  const layoutTop = useMemo(() => {
    const rows = definedTables.map((t) => {
      const smallPct = Number(t.ranges?.["0-8M"]?.percentage ?? 0)
      const deleteFiles = (t.positionDeleteFileCount || 0) + (t.eqDeleteFileCount || 0)
      return {
        id: `${t.catalog}.${t.namespace}.${t.table}`,
        catalog: t.catalog,
        namespace: t.namespace,
        table: t.table,
        smallPct,
        deleteFiles,
      }
    })
    rows.sort((a, b) => b.smallPct - a.smallPct)
    return rows.slice(0, 6)
  }, [definedTables])

  // 4) Anomaly insights (simple, explainable heuristics)
  const anomalies = useMemo(() => {
    const list: Array<{
      key: string
      title: string
      detail: string
      tone: "warn" | "good"
      href: string
      cta: string
    }> = []

    // Freshness anomaly: tables not updated in > 7d
    const stale = snapshotsByTable
      .map((t) => {
        const hoursAgo = (Date.now() - ms(t.lastUpdated || 0)) / (60 * 60 * 1000)
        return { ...t, hoursAgo }
      })
      .filter((t) => t.hoursAgo > 168)
      .slice(0, 3)
    if (stale.length > 0) {
      list.push({
        key: "stale",
        title: `${stale.length} tables look stale`,
        detail: `No updates for > 7 days (top: ${stale[0].catalog}.${stale[0].namespace}.${stale[0].table}).`,
        tone: "warn",
        href: `/data/tables/table?catalog=${stale[0].catalog}&namespace=${stale[0].namespace}&table=${stale[0].table}`,
        cta: "Inspect table",
      })
    }

    // Layout anomaly: small files heavy on top table
    const worst = layoutTop[0]
    if (worst && worst.smallPct >= 30) {
      list.push({
        key: "small-files",
        title: "Small files may be hurting performance",
        detail: `${worst.table} has ~${Math.round(worst.smallPct)}% files under 8MB.`,
        tone: "warn",
        href: "/optimization",
        cta: "Open optimization",
      })
    }

    // Change anomaly: spike in changes yesterday vs previous 7-day avg
    if (changeTrend.length >= 8) {
      const last = changeTrend[changeTrend.length - 1].changes
      const prev7 = changeTrend
        .slice(Math.max(0, changeTrend.length - 8), changeTrend.length - 1)
        .reduce((s, d) => s + d.changes, 0)
      const avg = prev7 / 7
      if (avg > 0 && last >= avg * 2.5) {
        list.push({
          key: "change-spike",
          title: "Change volume spiked recently",
          detail: `Yesterday had ${last} snapshot commits vs ~${avg.toFixed(1)}/day baseline.`,
          tone: "warn",
          href: "/dashboard/activity",
          cta: "View activity",
        })
      }
    }

    if (list.length === 0) {
      list.push({
        key: "all-good",
        title: "Data signals look steady",
        detail: "No major anomalies detected in freshness, change volume, or layout health.",
        tone: "good",
        href: "/data/tables",
        cta: "Browse tables",
      })
    }

    return list.slice(0, 3)
  }, [changeTrend, layoutTop, snapshotsByTable])

  const formatBytes = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB", "TB"]
    let v = bytes
    let i = 0
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024
      i++
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Data Growth */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-normal text-card-foreground">
              Data Growth
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {formatBytes(totals.totalDataBytes)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {totals.totalRecords.toLocaleString()} records
            </Badge>
          </div>
        </div>
        <div className="p-6">
          {!hasAddedRecords ? (
            <div className="text-sm text-muted-foreground">
              We can show full growth trends once snapshot summaries include
              record/byte deltas (or when metrics are persisted server-side). For
              now, you can use “Changes over time” as a growth proxy.
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={changeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="addedRecords"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.18}
                    name="Added records"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Changes & Freshness */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center gap-2">
            <ChartColumn className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-normal text-card-foreground">
              Changes & Freshness
            </h2>
          </div>
          <Link href="/dashboard/activity">
            <Button variant="ghost" size="sm" className="text-primary">
              View activity <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-2">
          <div className="h-44">
            <div className="mb-2 text-xs text-muted-foreground">
              Snapshot commits (last 30d)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={changeTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="changes"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.15}
                  name="Commits"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-44">
            <div className="mb-2 text-xs text-muted-foreground">
              Table freshness (last update)
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={freshness}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="tables" fill="#a855f7" name="Tables" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Layout Health */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-normal text-card-foreground">
              Layout Health
            </h2>
          </div>
          <Link href="/optimization">
            <Button variant="ghost" size="sm" className="text-primary">
              Optimize <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="p-6">
          <div className="mb-3 text-xs text-muted-foreground">
            Top tables by small-file percentage (&lt; 8MB)
          </div>
          <div className="space-y-2">
            {layoutTop.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-md border border-border bg-muted/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-card-foreground">
                    {t.catalog}.{t.namespace}.{t.table}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    delete files: {t.deleteFiles}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {Math.round(t.smallPct)}% small
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomaly Insights */}
      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-normal text-card-foreground">
              Anomaly Insights
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            updated from metadata
          </div>
        </div>
        <div className="divide-y divide-border">
          {anomalies.map((a) => (
            <div key={a.key} className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        a.tone === "good"
                          ? "text-xs bg-green-50 text-green-700 border-green-200"
                          : "text-xs bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {a.tone === "good" ? "Stable" : "Attention"}
                    </Badge>
                    <div className="text-sm text-card-foreground">{a.title}</div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {a.detail}
                  </div>
                </div>
                <Link href={a.href} className="shrink-0">
                  <Button variant="outline" size="sm" className="bg-card border-input">
                    {a.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

