"use client"

import { useMemo } from "react"

import { cn } from "@/lib/utils"
import { highlightSQL } from "@/lib/sql-highlighter"

export function SqlCodeBlock({
  sql,
  className,
}: {
  sql: string
  className?: string
}) {
  const html = useMemo(() => highlightSQL(sql), [sql])

  return (
    <div
      className={cn("sql-codeblock w-full max-w-full overflow-auto", className)}
      // Prism returns HTML spans for syntax highlighting.
      // `highlightSQL` also escapes raw `<`/`>` in fallback mode.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

