"use client"

import Link from "next/link"
import React from "react"

type Props = {
  current: "catalogs" | "namespaces" | "tables" | "table"
  catalog?: string | null
  namespace?: string | null
  table?: string | null
  count?: number
  rightSlot?: React.ReactNode
}

export function DataHierarchyHeader({
  current,
  catalog,
  namespace,
  table,
  count,
  rightSlot,
}: Props) {
  const catalogEncoded = encodeURIComponent(catalog || "")
  const namespaceEncoded = encodeURIComponent(namespace || "")
  const namespaceSearchEncoded = encodeURIComponent(namespace || "")
  const tableSearchEncoded = encodeURIComponent(table || "")

  const title =
    current === "catalogs"
      ? "Catalogs"
      : current === "namespaces"
        ? "Namespaces"
        : current === "tables"
          ? "Tables"
          : "Table details"

  const subtitle =
    current === "catalogs"
      ? "Start here: pick a catalog to browse namespaces and tables"
      : current === "namespaces"
        ? "Pick a namespace to browse tables"
        : current === "tables"
          ? "Pick a table to view details"
          : "Inspect table schema, stats, and data"

  const displayTitle = current === "table" && table ? table : title

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Catalogs", href: "/data/catalogs" },
  ]

  if (current === "namespaces" || current === "tables" || current === "table") {
    crumbs.push({
      label: "Namespaces",
      href: catalog ? `/data/namespaces?catalog=${catalogEncoded}` : "/data/namespaces",
    })
  }
  if (current === "tables" || current === "table") {
    crumbs.push({
      label: "Tables",
      href:
        catalog && namespace
          ? `/data/tables?catalog=${catalogEncoded}&namespace=${namespaceEncoded}`
          : "/data/tables",
    })
  }
  if (current === "table") {
    crumbs.push({ label: "Details" })
  }

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      {/* Row 1: location (breadcrumb) + actions */}
      <div className="flex items-center justify-between gap-4 min-h-9">
        <div className="min-w-0 text-xs text-muted-foreground flex items-center gap-2 flex-wrap leading-none">
          {crumbs.map((c, idx) => (
            <span key={`${c.label}-${idx}`} className="flex items-center gap-2">
              {idx > 0 && <span>/</span>}
              {c.href ? (
                <Link
                  href={c.href}
                  className="hover:text-foreground transition-colors"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </div>

        {rightSlot && <div className="shrink-0 flex items-center">{rightSlot}</div>}
      </div>

      {/* Row 2: title/subtitle + current selection chips (separate from actions to avoid crowding) */}
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-base font-medium text-card-foreground">
              {displayTitle}
            </div>
            {typeof count === "number" && (
              <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                {count}
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">{subtitle}</div>
        </div>

        {(catalog || namespace || table) && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Current:
            </span>

            {catalog && (
              <Link
                href={`/data/namespaces?catalog=${catalogEncoded}`}
                className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Back to this catalog's namespaces"
              >
                Catalog: <span className="text-foreground">{catalog}</span>
              </Link>
            )}

            {namespace && catalog && (
              <Link
                href={`/data/namespaces?catalog=${catalogEncoded}&search=${namespaceSearchEncoded}`}
                className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Back to this namespace"
              >
                Namespace: <span className="text-foreground">{namespace}</span>
              </Link>
            )}

            {table && catalog && namespace && (
              <Link
                href={`/data/tables?catalog=${catalogEncoded}&namespace=${namespaceEncoded}&search=${tableSearchEncoded}`}
                className="px-2 py-1 text-xs rounded bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="Back to tables list filtered to this table"
              >
                Table: <span className="text-foreground">{table}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

