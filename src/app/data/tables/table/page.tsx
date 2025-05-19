"use client"

import { useSearchParams } from "next/navigation"
import { LayoutList } from "lucide-react"

import { PageLoader } from "@/components/shared/page-loader"

import { useTableData } from "../../hooks/useTableData"

export default function TablePage() {
  const params = useSearchParams()
  const catalog = params.get("catalog")
  const namespace = params.get("namespace")
  const table = params.get("table")
  const { data, isLoading, error } = useTableData(
    catalog as string,
    namespace as string,
    table as string
  )
  console.log(1111, data)

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <PageLoader
          icon={LayoutList}
          title="Loading table details"
          entity={table as string}
          entityType="Table"
        />
      </div>
    )
  }

  return <div>TablePage1</div>
}
