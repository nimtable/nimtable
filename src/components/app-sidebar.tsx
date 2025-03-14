import * as React from "react"
import {
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  Folder,
  FolderTree,
  ActivityIcon as Function,
  LayoutGrid,
  Table,
  View,
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
import { Link, useNavigate, useParams } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"

interface NamespaceTables {
  name: string
  tables: string[]
  views: string[]
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

function TableItem({ catalog, namespace, name }: { catalog: string, namespace: string, name: string }) {
  return (
    <SidebarMenuButton asChild className="pl-6">
      <Link to={`/catalog/${catalog}/namespace/${namespace}/table/${name}`}>
        <Table className="h-4 w-4 shrink-0" />
        <span>{name}</span>
      </Link>
    </SidebarMenuButton>
  )
}

function ViewItem({ catalog, namespace, name }: { catalog: string, namespace: string, name: string }) {
  return (
    <SidebarMenuButton asChild className="pl-6">
      <Link to={`/catalog/${catalog}/namespace/${namespace}/view/${name}`}>
        <View className="h-4 w-4 shrink-0" />
        <span>{name}</span>
      </Link>
    </SidebarMenuButton>
  )
}

async function loadCatalogs(): Promise<string[]> {
  const response = await fetch('/api/catalogs')
  if (!response.ok) {
    throw new Error(`Failed to fetch catalogs: ${response.statusText}`)
  }
  return await response.json()
}

async function loadNamespacesAndTables(catalog: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
  const response = await api.v1.listNamespaces('')
  
  // Each namespace is an array where first element is the namespace name
  const namespacesList = response.namespaces || []

  // Fetch tables for each namespace
  const namespacesWithTables = await Promise.all(
    namespacesList.map(async (namespace: string[]) => {
      const namespaceName = namespace.join('.')
      const tablesResponse = await api.v1.listTables('', namespaceName)
      const viewsResponse = await api.v1.listViews('', namespaceName)
      return {
        name: namespaceName,
        tables: tablesResponse.identifiers?.map((table: any) => table.name),
        views: viewsResponse.identifiers?.map((view: any) => view.name),
      } as NamespaceTables
    })
  )

  return namespacesWithTables
}

export function AppSidebar() {
  const { toast } = useToast()
  const { catalog } = useParams<{ catalog: string }>()
  const navigate = useNavigate()

  const [catalogs, setCatalogs] = React.useState<string[]>([])
  const [namespaces, setNamespaces] = React.useState<NamespaceTables[]>([])
  const [catalogListLoading, setCatalogListLoading] = React.useState(true)
  const [namespacesLoading, setNamespacesLoading] = React.useState(false)

  React.useEffect(() => {
    loadCatalogs()
      .then(setCatalogs)
      .catch((error) => {
        toast({
          title: "Failed to fetch catalogs",
          description: errorToString(error),
          variant: "destructive",
        })
      })
      .finally(() => setCatalogListLoading(false))
  }, [toast])

  React.useEffect(() => {
    if (!catalog) return

    setNamespacesLoading(true)
    loadNamespacesAndTables(catalog)
      .then(setNamespaces)
      .catch((error) => {
        toast({
          title: "Failed to fetch namespaces and tables",
          description: errorToString(error),
          variant: "destructive",
        })
        setNamespaces([])
      })
      .finally(() => setNamespacesLoading(false))
  }, [catalog, toast])

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="border-b px-2 py-2">
          <Select
            disabled={catalogListLoading}
            value={catalog}
            onValueChange={(value) => {
              navigate(`/catalog/${value}`)
            }}
          >
            <SelectTrigger>
              <Database className="mr-2 h-4 w-4" />
              <SelectValue placeholder={catalogListLoading ? "Loading..." : "Select catalog"} />
            </SelectTrigger>
            <SelectContent>
              {catalogs.map((catalog) => (
                <SelectItem key={catalog} value={catalog}>
                  {catalog}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SidebarHeader>
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
                      <TreeItem label="Tables" icon={Folder}>
                        <SidebarMenu>
                          {namespace.tables.map((table) => (
                            <SidebarMenuItem key={table}>
                              <TableItem catalog={catalog!} namespace={namespace.name} name={table} />
                            </SidebarMenuItem>
                          ))}
                        </SidebarMenu>
                      </TreeItem>
                      <TreeItem label="Views" icon={Folder}>
                        <SidebarMenu>
                          {namespace.views.map((view) => (
                            <SidebarMenuItem key={view}>
                              <ViewItem catalog={catalog!} namespace={namespace.name} name={view} />
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

