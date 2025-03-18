// Move the existing page.tsx content here and update it
import { ChevronRight, FolderTree, MenuIcon, MoreVertical, Trash2 } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Api, TableIdentifier } from "@/lib/api"
import { useEffect, useState } from "react"


async function getNamespaceMetadata(catalog: string, namespace: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const response = await api.v1.loadNamespaceMetadata('', namespace)
  return response.properties
}

async function getTables(catalog: string, namespace: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const response = await api.v1.listTables('', namespace)
  return response.identifiers
}

async function getViews(catalog: string, namespace: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const response = await api.v1.listViews('', namespace)
  return response.identifiers
}

export default function NamespacePage() {
  const { catalog, namespace } = useParams<{ catalog: string, namespace: string }>()
  if (!catalog || !namespace) {
    throw new Error("Invalid namespace")
  }
  
  const [metadata, setMetadata] = useState<Record<string, string> | undefined>(undefined)
  const [tables, setTables] = useState<TableIdentifier[] | undefined>(undefined)
  const [views, setViews] = useState<TableIdentifier[] | undefined>(undefined)
  useEffect(() => {
    getNamespaceMetadata(catalog, namespace).then(setMetadata)
    getTables(catalog, namespace).then(setTables)
    getViews(catalog, namespace).then(setViews)
  }, [catalog, namespace])

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <Link to={`/catalog/${catalog}`} className="hover:text-foreground">
            Namespaces
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{namespace}</span>
        </div>
      </div>
      <div className="flex flex-1">
        <div className="flex-1 border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <FolderTree className="h-4 w-4" />
              <h1 className="text-xl font-semibold">{`${namespace}`}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="p-6">
            {/* Properties Table */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">Properties</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metadata?.properties && 
                    Object.entries(metadata.properties).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>

            {/* Tables List */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">Tables</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables?.map((table) => (
                    <TableRow key={table.name}>
                      <TableCell>
                        <Link 
                          to={`/catalog/${catalog}/namespace/${namespace}/table/${table.name}`}
                          className="hover:underline"
                        >
                          {table.name}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Views List */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold">Views</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {views?.map((view) => (
                    <TableRow key={view.name}>
                      <TableCell>
                        <Link 
                          to={`/catalog/${catalog}/namespace/${namespace}/view/${view.name}`}
                          className="hover:underline"
                        >
                          {view.name}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  )
}

