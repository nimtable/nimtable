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

import { useState } from "react"
import { LayoutList, Database, FileText } from "lucide-react"
import { notFound, useSearchParams } from "next/navigation"
import { loadTableData } from "@/lib/data-loader"
import type { LoadTableResult } from "@/lib/data-loader"
import { InfoTab } from "./info"
import { DataPreview } from "./data-preview"
import { SnapshotsTab } from "./snapshots"
import { TopNavbar } from "@/components/shared/top-navbar"
import { PageLoader } from "@/components/shared/page-loader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "@tanstack/react-query"


export default function TablePage() {
    const searchParams = useSearchParams()
    const catalog = searchParams.get("catalog")
    const namespace = searchParams.get("namespace")
    const table = searchParams.get("table")
    const isValidParams = catalog && namespace && table

    const [activeTab, setActiveTab] = useState("info")

    const { data: tableData, isPending } = useQuery<LoadTableResult>({
        queryKey: ["table", catalog, namespace, table],
        queryFn: async () => {
            if (!isValidParams) return undefined as unknown as LoadTableResult
            return await loadTableData(catalog!, namespace!, table!)
        },
        enabled: !!isValidParams,

    })

    if (!isValidParams) {
        return notFound()
    }

    if (isPending) {
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
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
                            <TabsTrigger value="info" className="flex items-center gap-1.5">
                                <FileText className="h-4 w-4" />
                                <span>Info</span>
                            </TabsTrigger>
                            <TabsTrigger value="data" className="flex items-center gap-1.5">
                                <Database className="h-4 w-4" />
                                <span>Data Preview</span>
                            </TabsTrigger>
                            <TabsTrigger value="snapshots" className="flex items-center gap-1.5">
                                <LayoutList className="h-4 w-4" />
                                <span>Version Control</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-8 mt-0">
                            <InfoTab tableData={tableData} catalog={catalog} namespace={namespace} table={table} />
                        </TabsContent>

                        <TabsContent value="data" className="space-y-8 mt-0">
                            <DataPreview catalog={catalog} namespace={namespace} table={table} />
                        </TabsContent>

                        <TabsContent value="snapshots" className="space-y-8 mt-0">
                            <SnapshotsTab tableData={tableData} catalog={catalog} namespace={namespace} table={table} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
