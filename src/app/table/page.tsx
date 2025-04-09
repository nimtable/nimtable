/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use client"

import { useEffect, useState } from "react"
import { LayoutList } from "lucide-react"
import { notFound, useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { loadTableData } from "@/lib/data-loader"
import type { LoadTableResult } from "@/lib/data-loader"
import { InfoTab } from "./info"
import { SnapshotsTab } from "./snapshots"
import { TopNavbar } from "@/components/shared/top-navbar"
import { PageLoader } from "@/components/shared/page-loader"

export default function TablePage() {
    const searchParams = useSearchParams()
    const catalog = searchParams.get("catalog")
    const namespace = searchParams.get("namespace")
    const table = searchParams.get("table")
    const isValidParams = catalog && namespace && table

    const { toast } = useToast()
    const [tableData, setTableData] = useState<LoadTableResult | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isValidParams) return

        const fetchTableData = async () => {
            setIsLoading(true)
            try {
                const data = await loadTableData(catalog!, namespace!, table!)
                setTableData(data)
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: `Failed to load table ${catalog}.${namespace}.${table}`,
                    description: errorToString(error),
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchTableData()
    }, [catalog, namespace, table, toast, isValidParams])

    if (!isValidParams) {
        return notFound()
    }

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <PageLoader icon={LayoutList} title="Loading table details" entity={table} entityType="Table" />
            </div>
        )
    }

    if (!tableData) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <p className="text-lg font-medium">Table data not found</p>
                    <p className="text-sm text-muted-foreground">Unable to load data for this table.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full w-full">
            <TopNavbar catalog={catalog} namespace={namespace} table={table} />

            <div className="flex-1 overflow-auto h-full">
                <div className="max-w-6xl mx-auto px-6 py-6">
                    <div className="space-y-8">
                        <InfoTab tableData={tableData} catalog={catalog} namespace={namespace} table={table} />

                        <div>
                            <SnapshotsTab tableData={tableData} catalog={catalog} namespace={namespace} table={table} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
