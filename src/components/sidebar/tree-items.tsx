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

import * as React from "react"
import { ChevronDown, ChevronRight, FolderTree, Table } from "lucide-react"
import Link from "next/link"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import type { NamespaceTables } from "@/lib/data-loader"

export function TableItem({ catalog, namespace, name }: { catalog: string; namespace: string; name: string }) {
    return (
        <SidebarMenuButton
            asChild
            className="pl-6 text-sm font-normal text-muted-foreground hover:text-foreground transition-colors"
        >
            <Link href={`/table?catalog=${catalog}&namespace=${namespace}&table=${name}`}>
                <Table className="h-4 w-4 shrink-0 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors" />
                <span>{name}</span>
            </Link>
        </SidebarMenuButton>
    )
}

export function NamespaceTreeItem({ catalog, namespace }: { catalog: string; namespace: NamespaceTables }) {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="group">
            <CollapsibleTrigger asChild>
                <SidebarMenuButton className="w-full font-medium transition-colors">
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform" />
                    ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 transition-transform" />
                    )}
                    <Link
                        href={`/namespace?catalog=${catalog}&namespace=${namespace.name}`}
                        className="flex items-center gap-2 flex-1 hover:text-blue-500 hover:underline transition-colors"
                    >
                        <FolderTree className="h-4 w-4 shrink-0 text-blue-500" />
                        <span>{namespace.shortName}</span>
                    </Link>
                </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 pt-1 animate-in slide-in-from-left-1 duration-150">
                <SidebarMenu>
                    {namespace.tables.map((table) => (
                        <SidebarMenuItem key={table} className="mt-0.5">
                            <TableItem catalog={catalog} namespace={namespace.name} name={table} />
                        </SidebarMenuItem>
                    ))}

                    {/* Display child namespaces */}
                    {namespace.children.map((child) => (
                        <SidebarMenuItem key={child.name} className="mt-1">
                            <NamespaceTreeItem catalog={catalog} namespace={child} />
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </CollapsibleContent>
        </Collapsible>
    )
}
