"use client"

import Link from "next/link"
import { Cog, DatabaseZap, LayoutGrid, Play, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function DashboardQuickActions() {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-normal text-card-foreground">
            Quick Actions
          </h2>
        </div>
      </div>
      <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <Link href="/data/sql-editor">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-card border-input hover:bg-muted/50"
          >
            <Play className="h-4 w-4 text-primary" />
            New SQL Query
          </Button>
        </Link>
        <Link href="/data/catalogs">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-card border-input hover:bg-muted/50"
          >
            <DatabaseZap className="h-4 w-4 text-primary" />
            Manage Catalogs
          </Button>
        </Link>
        <Link href="/optimization">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-card border-input hover:bg-muted/50"
          >
            <Wand2 className="h-4 w-4 text-primary" />
            Optimize Tables
          </Button>
        </Link>
        <Link href="/jobs">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-card border-input hover:bg-muted/50"
          >
            <Cog className="h-4 w-4 text-primary" />
            Scheduled Tasks
          </Button>
        </Link>
        <Link href="/dashboard/activity">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-card border-input hover:bg-muted/50"
          >
            <LayoutGrid className="h-4 w-4 text-primary" />
            View Activity
          </Button>
        </Link>
      </div>
    </div>
  )
}
