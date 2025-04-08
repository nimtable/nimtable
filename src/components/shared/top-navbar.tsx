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
import Link from "next/link"
import { ChevronRight, Code, Settings, Database, FolderTree, TableIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { OptimizeSheet } from "@/components/table/optimize-sheet"

interface TopNavbarProps {
    catalog?: string | null
    namespace?: string | null
    table?: string | null
}

export function TopNavbar({ catalog, namespace, table }: TopNavbarProps) {
    // Add state for the optimize sheet
    const [showOptimizeSheet, setShowOptimizeSheet] = useState(false)

    // Determine the current page context
    const isTablePage = Boolean(catalog && namespace && table)
    const isNamespacePage = Boolean(catalog && namespace && !table)

    // Build SQL editor URL with appropriate query parameters
    const sqlEditorUrl = catalog
        ? `/sql-editor?catalog=${catalog}${namespace ? `&namespace=${namespace}` : ''}${table ? `&table=${table}` : ''}`
        : '/sql-editor';

    return (
        <div className="border-b">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2 text-sm">
                    {catalog && (
                        <>
                            <Link
                                href={`/catalog?catalog=${catalog}`}
                                className="text-muted-foreground hover:text-blue-500 hover:underline transition-colors flex items-center gap-1"
                            >
                                <Database className="h-3.5 w-3.5 text-blue-500" />
                                {catalog}
                            </Link>

                            {namespace && (
                                <>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    <Link
                                        href={`/namespace?catalog=${catalog}&namespace=${namespace}`}
                                        className={cn(
                                            "hover:text-blue-500 hover:underline transition-colors flex items-center gap-1",
                                            isNamespacePage ? "text-foreground font-medium" : "text-muted-foreground",
                                        )}
                                    >
                                        <FolderTree className="h-3.5 w-3.5 text-blue-500" />
                                        {namespace}
                                    </Link>
                                </>
                            )}

                            {table && (
                                <>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-foreground font-medium flex items-center gap-1">
                                        <TableIcon className="h-3.5 w-3.5 text-blue-500" />
                                        {table}
                                    </span>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Only show the Optimize button on table pages */}
                    {isTablePage && (
                        <TooltipProvider delayDuration={300}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className={cn(
                                            "group relative overflow-hidden",
                                            "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
                                            "text-white shadow-md hover:shadow-lg transition-all duration-300",
                                            "border-0 hover:scale-[1.03] transform",
                                        )}
                                        onClick={() => setShowOptimizeSheet(true)}
                                    >
                                        {/* Animated glow effect */}
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-400/0 via-purple-400/30 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-gradient-x"></div>

                                        {/* Button content */}
                                        <div className="relative flex items-center gap-2 py-2">
                                            <div className="p-1 bg-white/20 rounded-md flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                                <Settings className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <span className="font-medium">Optimize Table</span>
                                        </div>

                                        {/* Subtle pulse effect */}
                                        <span className="absolute -inset-3 block rounded-full bg-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    <p>Optimize table</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className={cn(
                                        "group relative overflow-hidden",
                                        "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                                        "text-white shadow-md hover:shadow-lg transition-all duration-300",
                                        "border-0 hover:scale-[1.03] transform",
                                    )}
                                    asChild
                                >
                                    <Link href={sqlEditorUrl}>
                                        {/* Animated glow effect */}
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-gradient-x"></div>

                                        {/* Button content */}
                                        <div className="relative flex items-center gap-2 py-2">
                                            <div className="p-1 bg-white/20 rounded-md flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                                <Code className="h-3.5 w-3.5 text-white" />
                                            </div>
                                            <span className="font-medium">SQL Query</span>
                                        </div>

                                        {/* Subtle pulse effect */}
                                        <span className="absolute -inset-3 block rounded-full bg-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></span>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Open SQL editor</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Add the OptimizeSheet component */}
            {isTablePage && (
                <OptimizeSheet
                    open={showOptimizeSheet}
                    onOpenChange={setShowOptimizeSheet}
                    catalog={catalog ?? ""}
                    namespace={namespace ?? ""}
                    table={table ?? ""}
                />
            )}
        </div>
    );
}
