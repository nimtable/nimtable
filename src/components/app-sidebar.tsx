"use client"

import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  FolderTree,
  ActivityIcon as Function,
  LayoutGrid,
  Table,
} from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// This is sample data - replace with your actual data structure
const catalogs = [
  {
    id: "unity",
    name: "unity",
    namespaces: [
      {
        id: "default",
        name: "default",
        tables: [
          { id: "marksheet", name: "marksheet" },
          { id: "marksheet_uniform", name: "marksheet_uniform" },
          { id: "numbers", name: "numbers" },
          { id: "user_countries", name: "user_countries" },
        ],
        volumes: [
          { id: "json_files", name: "json_files" },
          { id: "txt_files", name: "txt_files" },
        ],
        functions: [
          { id: "lowercase", name: "lowercase" },
          { id: "sum", name: "sum" },
        ],
      },
    ],
  },
]

function TreeItem({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  children?: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton className="w-full">
          {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          {Icon && <Icon className="h-4 w-4 shrink-0" />}
          <span>{label}</span>
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6">{children}</CollapsibleContent>
    </Collapsible>
  )
}

function TableItem({ name }: { name: string }) {
  return (
    <SidebarMenuButton asChild className="pl-6">
      <a href={`#${name}`}>
        <Table className="h-4 w-4 shrink-0" />
        <span>{name}</span>
      </a>
    </SidebarMenuButton>
  )
}

function VolumeItem({ name }: { name: string }) {
  return (
    <SidebarMenuButton asChild className="pl-6">
      <a href={`#${name}`}>
        <FileText className="h-4 w-4 shrink-0" />
        <span>{name}</span>
      </a>
    </SidebarMenuButton>
  )
}

function FunctionItem({ name }: { name: string }) {
  return (
    <SidebarMenuButton asChild className="pl-6">
      <a href={`#${name}`}>
        <Function className="h-4 w-4 shrink-0" />
        <span>{name}</span>
      </a>
    </SidebarMenuButton>
  )
}

export function AppSidebar() {
  const [selectedCatalog, setSelectedCatalog] = React.useState(catalogs[0])

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-2 py-2">
        <Select
          defaultValue={selectedCatalog.id}
          onValueChange={(value) => setSelectedCatalog(catalogs.find((catalog) => catalog.id === value) || catalogs[0])}
        >
          <SelectTrigger>
            <Database className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Select catalog" />
          </SelectTrigger>
          <SelectContent>
            {catalogs.map((catalog) => (
              <SelectItem key={catalog.id} value={catalog.id}>
                {catalog.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Browse</h2>
          <SidebarMenu>
            {selectedCatalog.namespaces.map((namespace) => (
              <SidebarMenuItem key={namespace.id}>
                <TreeItem label={namespace.name} icon={FolderTree}>
                  <SidebarMenu>
                    <TreeItem label="Tables" icon={LayoutGrid}>
                      <SidebarMenu>
                        {namespace.tables.map((table) => (
                          <SidebarMenuItem key={table.id}>
                            <TableItem name={table.name} />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </TreeItem>
                    <TreeItem label="Volumes" icon={LayoutGrid}>
                      <SidebarMenu>
                        {namespace.volumes.map((volume) => (
                          <SidebarMenuItem key={volume.id}>
                            <VolumeItem name={volume.name} />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </TreeItem>
                    <TreeItem label="Functions" icon={LayoutGrid}>
                      <SidebarMenu>
                        {namespace.functions.map((func) => (
                          <SidebarMenuItem key={func.id}>
                            <FunctionItem name={func.name} />
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </TreeItem>
                  </SidebarMenu>
                </TreeItem>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

