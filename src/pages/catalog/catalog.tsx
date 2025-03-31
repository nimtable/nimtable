import { MoreVertical, PenSquare, PanelRightClose, PanelRightOpen } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { Api, CatalogConfig } from "@/lib/api"
import { useParams } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { errorToString } from "@/lib/utils"
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"


export default function CatalogPage() {
  const [namespaces, setNamespaces] = useState<string[] | undefined>(undefined)
  const { catalog } = useParams<{ catalog: string }>()
  const [config, setConfig] = useState<CatalogConfig | undefined>(undefined)
  const { toast } = useToast()
  const api = new Api({ baseUrl: `/api/catalog/${catalog}`})
  const [showDetails, setShowDetails] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [newNamespace, setNewNamespace] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [configJson, setConfigJson] = useState<string>("")

  useEffect(() => {
    api.v1.listNamespaces().then((response) => {
      setNamespaces(response.namespaces?.map(n => n.join('.')) || [])
    }).catch((error) => {
      toast({
        variant: "destructive",
        title: "Failed to list namespaces",
        description: errorToString(error),
      })
    })

    api.v1.getConfig().then((response) => {
      setConfig(response)
    }).catch((error) => {
      toast({
        variant: "destructive",
        title: "Failed to get catalog config",  
        description: errorToString(error),
      })
    })

  }, [catalog])

  const handleCreateNamespace = async () => {
    if (!newNamespace.trim()) {
      toast({
        variant: "destructive",
        title: "Invalid namespace",
        description: "Namespace name cannot be empty",
      })
      return
    }

    setIsCreating(true)
    try {
      await api.v1.createNamespace({
        namespace: newNamespace.split('.'),
        properties: {}
      })

      toast({
        title: "Namespace created",
        description: `Successfully created namespace "${newNamespace}"`,
      })

      const response = await api.v1.listNamespaces()
      setNamespaces(response.namespaces?.map(n => n.join('.')) || [])
      
      setCreateDialogOpen(false)
      setNewNamespace("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to create namespace",
        description: errorToString(error),
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditClick = async () => {
    try {
      const response = await fetch(`/api/config/${catalog}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setConfigJson(JSON.stringify(data, null, 2))
      setEditDialogOpen(true)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch config",
        description: errorToString(error),
      })
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
            Catalog
        </div>
      </div>
      <div className="flex flex-1 h-full">
        <div className="flex-1 border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">{catalog}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateDialogOpen(true)}>Create Namespace</Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEditClick}>
                    <PenSquare className="mr-2 h-4 w-4" />
                    <span>View</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="p-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold">Namespaces</h2>
              <div className="rounded-lg border">
                <div className="grid grid-cols-2 gap-4 border-b px-6 py-3 font-medium">
                  <div>Name</div>
                </div>
                <div className="divide-y">
                  {namespaces && namespaces.map((namespace) => (
                    <div key={namespace} className="grid grid-cols-2 gap-4 px-6 py-3">
                      <div>
                        <Link 
                          to={`/catalog/${catalog}/namespace/${namespace}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {namespace}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "border-l bg-muted/10 transition-all duration-300 relative h-full",
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
            <h2 className="text-lg font-semibold">Catalog details</h2>
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
              <dl className="space-y-6">
                {config?.defaults && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-2">Defaults</dt>
                    <dd>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(config.defaults).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium">{key}</TableCell>
                              <TableCell>{value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </dd>
                  </div>
                )}

                {config?.overrides && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-2">Overrides</dt>
                    <dd>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Key</TableHead>
                            <TableHead>Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(config.overrides).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium">{key}</TableCell>
                              <TableCell>{value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Namespace</DialogTitle>
            <DialogDescription>
              Enter a name for the new namespace. Use dots (.) to create nested namespaces.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="name"
              value={newNamespace}
              onChange={(e) => setNewNamespace(e.target.value)}
              placeholder="e.g. my_namespace or parent.child"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                setNewNamespace("")
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateNamespace}
              disabled={isCreating}
            >
              {isCreating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Catalog Configuration</DialogTitle>
            <DialogDescription>
              View the current catalog configuration
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              value={configJson}
              readOnly
              className="font-mono h-[200px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

