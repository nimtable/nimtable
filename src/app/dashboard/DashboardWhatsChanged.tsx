"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowDownRight, ArrowUpRight, History, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type Snapshot = {
  at: number
  healthScore: number
  totalTables: number
  needsCompaction: number
  taskFailures: number
  runningJobs: number
  totalDataBytes: number
  totalDataRecords: number
}

const STORAGE_KEY = "nimtable.dashboard.lastSnapshot.v1"

function formatDelta(n: number) {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n}`
}

function formatWhen(ts: number) {
  const diffMs = Date.now() - ts
  const mins = Math.floor(diffMs / (60 * 1000))
  if (mins < 2) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function DashboardWhatsChanged({
  snapshot,
}: {
  snapshot: Omit<Snapshot, "at"> & { at?: number }
}) {
  const [previous, setPrevious] = useState<Snapshot | null>(null)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        setPrevious(JSON.parse(raw) as Snapshot)
      }
    } catch {
      setPrevious(null)
    }
  }, [])

  useEffect(() => {
    const now: Snapshot = {
      at: snapshot.at ?? Date.now(),
      healthScore: snapshot.healthScore,
      totalTables: snapshot.totalTables,
      needsCompaction: snapshot.needsCompaction,
      taskFailures: snapshot.taskFailures,
      runningJobs: snapshot.runningJobs,
      totalDataBytes: snapshot.totalDataBytes,
      totalDataRecords: snapshot.totalDataRecords,
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(now))
    } catch {
      // ignore
    }
  }, [
    snapshot.at,
    snapshot.healthScore,
    snapshot.needsCompaction,
    snapshot.runningJobs,
    snapshot.taskFailures,
    snapshot.totalTables,
    snapshot.totalDataBytes,
    snapshot.totalDataRecords,
  ])

  const changes = useMemo(() => {
    if (!previous) return []
    const list: Array<{
      key: string
      label: string
      delta: number
      tone: "good" | "warn" | "neutral"
    }> = []

    const healthDelta = snapshot.healthScore - previous.healthScore
    if (healthDelta !== 0) {
      list.push({
        key: "health",
        label: "Health score",
        delta: healthDelta,
        tone: healthDelta > 0 ? "good" : "warn",
      })
    }

    const compactionDelta = snapshot.needsCompaction - previous.needsCompaction
    if (compactionDelta !== 0) {
      list.push({
        key: "compaction",
        label: "Tables needing compaction",
        delta: compactionDelta,
        tone: compactionDelta > 0 ? "warn" : "good",
      })
    }

    const failuresDelta = snapshot.taskFailures - previous.taskFailures
    if (failuresDelta !== 0) {
      list.push({
        key: "failures",
        label: "Task failures",
        delta: failuresDelta,
        tone: failuresDelta > 0 ? "warn" : "good",
      })
    }

    const tablesDelta = snapshot.totalTables - previous.totalTables
    if (tablesDelta !== 0) {
      list.push({
        key: "tables",
        label: "Total tables",
        delta: tablesDelta,
        tone: "neutral",
      })
    }

    const bytesDelta = snapshot.totalDataBytes - previous.totalDataBytes
    if (bytesDelta !== 0) {
      list.push({
        key: "bytes",
        label: "Data size",
        delta: bytesDelta,
        tone: "neutral",
      })
    }

    const recordsDelta = snapshot.totalDataRecords - previous.totalDataRecords
    if (recordsDelta !== 0) {
      list.push({
        key: "records",
        label: "Record count",
        delta: recordsDelta,
        tone: "neutral",
      })
    }

    return list.slice(0, 3)
  }, [
    previous,
    snapshot.healthScore,
    snapshot.needsCompaction,
    snapshot.taskFailures,
    snapshot.totalTables,
    snapshot.totalDataBytes,
    snapshot.totalDataRecords,
  ])

  if (!previous) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-normal text-card-foreground">
              Since last visit
            </span>
            <Badge variant="outline" className="text-xs">
              First time here
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            We’ll start tracking changes from now on.
          </span>
        </div>
      </div>
    )
  }

  const unchanged = changes.length === 0

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-normal text-card-foreground">
            Since last visit
          </span>
          <span className="text-xs text-muted-foreground">
            ({formatWhen(previous.at)})
          </span>
        </div>
        {unchanged ? (
          <Badge
            variant="outline"
            className="text-xs bg-green-50 text-green-700 border-green-200"
          >
            Stable
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs">
            Updated
          </Badge>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {unchanged ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Minus className="h-4 w-4" />
            No material changes detected. Everything looks steady.
          </div>
        ) : (
          changes.map((c) => {
            const Icon = c.delta > 0 ? ArrowUpRight : ArrowDownRight
            const badgeClass =
              c.tone === "good"
                ? "bg-green-50 text-green-700 border-green-200"
                : c.tone === "warn"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-muted text-muted-foreground border-border"
            return (
              <div
                key={c.key}
                className="flex items-center justify-between rounded-md border border-border bg-muted/10 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-sm text-card-foreground">
                    {formatDelta(c.delta)}
                  </div>
                </div>
                <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                  <Icon className="mr-1 h-3.5 w-3.5" />
                  {c.tone === "good"
                    ? "Good"
                    : c.tone === "warn"
                      ? "Attention"
                      : "Info"}
                </Badge>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

