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

import Link from "next/link"
import { ChevronRight, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TopNavbarProps {
    catalog?: string | null
    namespace?: string | null
    table?: string | null
}

export function TopNavbar({ catalog, namespace, table }: TopNavbarProps) {
    // Determine the current page context
    const isNamespacePage = Boolean(catalog && namespace && !table)

    return (
        <div className="border-b">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {catalog && (
                        <>
                            <Link href={`/catalog?catalog=${catalog}`} className="hover:text-foreground">
                                {catalog}
                            </Link>

                            {namespace && (
                                <>
                                    <ChevronRight className="h-4 w-4" />
                                    <Link
                                        href={`/namespace?catalog=${catalog}&namespace=${namespace}`}
                                        className={isNamespacePage ? "text-foreground" : "hover:text-foreground"}
                                    >
                                        {namespace}
                                    </Link>
                                </>
                            )}

                            {table && (
                                <>
                                    <ChevronRight className="h-4 w-4" />
                                    <span className="text-foreground">{table}</span>
                                </>
                            )}
                        </>
                    )}
                </div>

                <TooltipProvider delayDuration={300}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                asChild
                                className={cn(
                                    "group relative overflow-hidden",
                                    "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
                                    "text-white shadow-md hover:shadow-lg transition-all duration-300",
                                    "border-0 hover:scale-[1.03] transform",
                                )}
                            >
                                <Link
                                    href={catalog ? `/sql-editor?catalog=${catalog}` : "/sql-editor"}
                                    className="flex items-center gap-1.5 px-4 py-2"
                                >
                                    {/* Animated glow effect */}
                                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[length:200%_100%] animate-gradient-x"></div>

                                    {/* Button content */}
                                    <div className="relative flex items-center gap-2">
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
    )
}
