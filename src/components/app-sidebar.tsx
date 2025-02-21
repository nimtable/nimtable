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
import { Api } from "@/lib/api"
import { useNavigate, useParams } from "react-router-dom"

// Add these interfaces at the top of the file with other imports
interface Catalog {
  name: string
  url: string
  prefix: string
}

interface Namespace {
  name: string
  tables: string[]
}

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
  const {
    catalog,
  } = useParams<{ catalog: string }>()

  const navigate = useNavigate();
  const [catalogs, setCatalogs] = React.useState<Catalog[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [namespaces, setNamespaces] = React.useState<Namespace[]>([])
  const [namespacesLoading, setNamespacesLoading] = React.useState(false)

  // Fetch catalogs on mount
  React.useEffect(() => {
    async function fetchCatalogs() {
      try {
        const response = await fetch('/api/catalogs')
        const data = await response.json()
        setCatalogs(data)
      } catch (error) {
        console.error('Failed to fetch catalogs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCatalogs()
  }, [])

  // Fetch namespaces when catalog changes
  React.useEffect(() => {
    async function fetchNamespacesAndTables() {
      if (!catalog) return;
      
      setNamespacesLoading(true)
      try {
        const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
        const response = await api.v1.listNamespaces('')
        
        // Each namespace is an array where first element is the namespace name
        const namespacesList = response.namespaces || []

        // Fetch tables for each namespace
        const namespacesWithTables = await Promise.all(
          namespacesList.map(async (namespace: string[]) => {
            // Use the first element of the namespace array as the namespace name
            const namespaceName = namespace.join('.')
            const tablesResponse = await api.v1.listTables('', namespaceName)
            
            return {
              name: namespaceName,
              tables: tablesResponse.identifiers?.map((table: any) => table.name),
            } as Namespace
          })
        )

        setNamespaces(namespacesWithTables)
      } catch (error) {
        console.error("Error fetching namespaces and tables:", error)
        setNamespaces([])
      } finally {
        setNamespacesLoading(false)
      }
    }

    fetchNamespacesAndTables()
  }, [catalog])

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-2 py-2">
        <Select
          disabled={isLoading}
          value={catalog}
          onValueChange={(value) => {
            navigate(`/catalog/${value}`)
          }}
        >
          <SelectTrigger>
            <Database className="mr-2 h-4 w-4" />
            <SelectValue placeholder={isLoading ? "Loading..." : "Select catalog"} />
          </SelectTrigger>
          <SelectContent>
            {catalogs.map((catalog) => (
              <SelectItem key={catalog.name} value={catalog.name}>
                {catalog.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-2 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Browse</h2>
          {namespacesLoading ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <SidebarMenu>
              {namespaces.map((namespace) => (
                <SidebarMenuItem key={namespace.name}>
                  <TreeItem label={namespace.name} icon={FolderTree}>
                    <SidebarMenu>
                      <TreeItem label="Tables" icon={LayoutGrid}>
                        <SidebarMenu>
                          {namespace.tables.map((table) => (
                            <SidebarMenuItem key={table}>
                              <TableItem name={table} />
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </TreeItem>
                    </SidebarMenu>
                  </TreeItem>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

