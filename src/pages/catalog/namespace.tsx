// Move the existing page.tsx content here and update it
import { ChevronRight, FolderTree, MenuIcon, MoreVertical, Trash2, PanelRightClose, PanelRightOpen } from "lucide-react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Api, TableIdentifier } from "@/lib/api"
import { useEffect, useState } from "react"
import { cn, errorToString } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useSidebarRefresh } from "@/contexts/sidebar-refresh"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


async function getNamespaceMetadata(catalog: string, namespace: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const response = await api.v1.loadNamespaceMetadata(namespace)
  return response.properties
}

async function getTables(catalog: string, namespace: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const response = await api.v1.listTables(namespace)
  return response.identifiers
}

async function getViews(catalog: string, namespace: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const response = await api.v1.listViews(namespace)
  return response.identifiers
}

async function getChildNamespaces(catalog: string, namespace: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const response = await api.v1.listNamespaces({ parent: namespace })
  return response.namespaces?.map(n => n.join('.')) || []
}

export default function NamespacePage() {
  const { catalog, namespace } = useParams<{ catalog: string, namespace: string }>()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { triggerRefresh } = useSidebarRefresh()
  if (!catalog || !namespace) {
    throw new Error("Invalid namespace")
  }
  
  const [metadata, setMetadata] = useState<Record<string, string> | undefined>(undefined)
  const [tables, setTables] = useState<TableIdentifier[] | undefined>(undefined)
  const [views, setViews] = useState<TableIdentifier[] | undefined>(undefined)
  const [childNamespaces, setChildNamespaces] = useState<string[] | undefined>(undefined)
  const [showDetails, setShowDetails] = useState(true)
  const [showDropDialog, setShowDropDialog] = useState(false)

  useEffect(() => {
    getNamespaceMetadata(catalog, namespace).then(setMetadata)
    getTables(catalog, namespace).then(setTables)
    getViews(catalog, namespace).then(setViews)
    getChildNamespaces(catalog, namespace).then(setChildNamespaces)
  }, [catalog, namespace])

  const handleDropNamespace = async () => {
    try {
      const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
      await api.v1.dropNamespace(namespace)
      toast({
        title: "Namespace dropped successfully",
        description: `Namespace ${namespace} has been dropped`,
      })
      triggerRefresh()
      navigate(`/catalog/${catalog}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to drop namespace",
        description: errorToString(error),
      })
    }
    setShowDropDialog(false)
  }

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
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto border-r">
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
                <DropdownMenuItem onClick={() => setShowDropDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="p-6">
            {/* Child Namespaces List */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">Child Namespaces</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childNamespaces?.map((childNamespace) => (
                    <TableRow key={childNamespace}>
                      <TableCell>
                        <Link 
                          to={`/catalog/${catalog}/namespace/${childNamespace}`}
                          className="hover:underline"
                        >
                          {childNamespace}
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
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

        {/* Details Panel */}
        <div
          className={cn(
            "border-l bg-muted/10 transition-all duration-300 relative",
            showDetails ? "w-[400px]" : "w-0"
          )}
        >
          {!showDetails && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -left-10 top-6"
              onClick={() => setShowDetails(true)}
            >
              <PanelRightOpen className="h-4 w-4" />
            </Button>
          )}

          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Properties</h2>
            {showDetails && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetails(false)}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showDetails && (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metadata && 
                    Object.entries(metadata).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">{key}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Drop Dialog */}
      <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Namespace</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the namespace "{namespace}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDropDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDropNamespace}>
              Drop Namespace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

