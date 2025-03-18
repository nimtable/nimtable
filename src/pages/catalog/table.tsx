import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ChevronRight, MoreVertical, Table as TableIcon, PanelRightClose, PanelRightOpen, Trash2, PenSquare } from "lucide-react"
import { Link } from "react-router-dom"

import { Api, LoadTableResult, Schema, Snapshot, StructField, SnapshotReference } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn, errorToString } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSidebarRefresh } from "@/contexts/sidebar-refresh"

async function loadTableData(catalog: string, namespace: string, table: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
  const response = await api.v1.loadTable('', namespace, table)
  return response
}

export default function TablePage() {
  const { catalog, namespace, table } = useParams<{ catalog: string, namespace: string, table: string }>()
  const { toast } = useToast()
  const navigate = useNavigate()
  if (!catalog || !namespace || !table) {
    throw new Error("Invalid table path")
  }

  const [tableData, setTableData] = useState<LoadTableResult | undefined>(undefined)
  const [showDetails, setShowDetails] = useState(true)
  const [showDropDialog, setShowDropDialog] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newTableName, setNewTableName] = useState(table)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [snapshotDetail, setSnapshotDetail] = useState<string | null>(null)
  const [detailType, setDetailType] = useState<'snapshot' | 'branch' | 'tag'>('snapshot')
  const [activeTab, setActiveTab] = useState('branches')
  const { triggerRefresh } = useSidebarRefresh()

  useEffect(() => {
    loadTableData(catalog, namespace, table)
      .then(setTableData)
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Failed to load table",
          description: errorToString(error),
        })
      })
  }, [catalog, namespace, table, toast])

  const handleDropTable = async () => {
    try {
      const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
      await api.v1.dropTable('', namespace, table)
      toast({
        title: "Table dropped successfully",
        description: `Table ${table} has been dropped from namespace ${namespace}`,
      })
      triggerRefresh()
      navigate(`/catalog/${catalog}/namespace/${namespace}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to drop table",
        description: errorToString(error),
      })
    }
    setShowDropDialog(false)
  }

  const handleRenameTable = async () => {
    try {
      const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
      await api.v1.renameTable('', {
        source: {
          namespace: namespace.split('/'),
          name: table
        },
        destination: {
          namespace: namespace.split('/'),
          name: newTableName
        }
      })
      toast({
        title: "Table renamed successfully",
        description: `Table ${table} has been renamed to ${newTableName}`,
      })
      triggerRefresh()
      navigate(`/catalog/${catalog}/namespace/${namespace}/table/${newTableName}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to rename table",
        description: errorToString(error),
      })
    }
    setShowRenameDialog(false)
  }

  const handleShowDetail = (data: Snapshot | SnapshotReference, type: 'snapshot' | 'branch' | 'tag') => {
    setDetailType(type)
    setSnapshotDetail(JSON.stringify(data, null, 2))
    setShowDetailDialog(true)
  }

  const handleSnapshotClick = (snapshotId: string | number) => {
    setActiveTab('snapshots')
    setTimeout(() => {
      const element = document.getElementById(`snapshot-${String(snapshotId)}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  if (!tableData) return null

  const schema = tableData.metadata.schemas?.find(
    s => s["schema-id"] === tableData.metadata["current-schema-id"]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="border-b">
        <div className="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
          <Link to={`/catalog/${catalog}`} className="hover:text-foreground">
            Namespaces
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/catalog/${catalog}/namespace/${namespace}`} className="hover:text-foreground">
            {namespace}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-muted-foreground">Tables</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{table}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <TableIcon className="h-4 w-4" />
              <h1 className="text-xl font-semibold">{table}</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                  <PenSquare className="mr-2 h-4 w-4" />
                  <span>Rename</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowDropDialog(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-6 space-y-8">
            {/* Schema Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Schema</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schema?.fields.map((field: StructField) => (
                    <TableRow key={field.id}>
                      <TableCell>{field.id}</TableCell>
                      <TableCell>{field.name}</TableCell>
                      <TableCell>{typeof field.type === 'string' ? field.type : field.type.type}</TableCell>
                      <TableCell>{field.required ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Snapshots Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Snapshots</h2>
              <Tabs defaultValue="branches" className="w-full" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="branches">Branches</TabsTrigger>
                  <TabsTrigger value="tags">Tags</TabsTrigger>
                  <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
                </TabsList>
                <TabsContent value="branches">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Snapshot ID</TableHead>
                        <TableHead>Max Age (ms)</TableHead>
                        <TableHead>Min Snapshots</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.metadata.refs && Object.entries(tableData.metadata.refs)
                        .filter(([_, ref]) => ref.type === "branch")
                        .map(([name, ref]) => (
                          <TableRow key={name}>
                            <TableCell>{name}</TableCell>
                            <TableCell>
                              <span 
                                className="text-primary hover:underline cursor-pointer" 
                                onClick={() => handleSnapshotClick(ref["snapshot-id"])}
                              >
                                {ref["snapshot-id"]}
                              </span>
                            </TableCell> 
                            <TableCell>{ref["max-ref-age-ms"] || '-'}</TableCell>
                            <TableCell>{ref["min-snapshots-to-keep"] || '-'}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleShowDetail(ref, 'branch')}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="tags">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Snapshot ID</TableHead>
                        <TableHead>Max Age (ms)</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.metadata.refs && Object.entries(tableData.metadata.refs)
                        .filter(([_, ref]) => ref.type === "tag")
                        .map(([name, ref]) => (
                          <TableRow key={name}>
                            <TableCell>{name}</TableCell>
                            <TableCell>
                              <span 
                                className="text-primary hover:underline cursor-pointer" 
                                onClick={() => handleSnapshotClick(ref["snapshot-id"])}
                              >
                                {ref["snapshot-id"]}
                              </span>
                            </TableCell>
                            <TableCell>{ref["max-ref-age-ms"] || '-'}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleShowDetail(ref, 'tag')}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="snapshots">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Snapshot ID</TableHead>
                        <TableHead>Parent ID</TableHead>
                        <TableHead>Sequence Number</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableData.metadata.snapshots?.map((snapshot) => (
                        <TableRow key={snapshot["snapshot-id"]} id={`snapshot-${String(snapshot["snapshot-id"])}`}>
                          <TableCell>{snapshot["snapshot-id"]}</TableCell>
                          <TableCell>{snapshot["parent-snapshot-id"] || '-'}</TableCell>
                          <TableCell>{snapshot["sequence-number"] || '-'}</TableCell>
                          <TableCell>
                            {new Date(snapshot["timestamp-ms"]).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleShowDetail(snapshot, 'snapshot')}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              </Tabs>
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
            <h2 className="text-lg font-semibold">Details</h2>
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
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Table UUID</h3>
                <p className="text-sm">{tableData.metadata["table-uuid"]}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
                <p className="text-sm">{tableData.metadata.location}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Last Updated</h3>
                <p className="text-sm">
                  {tableData.metadata["last-updated-ms"] 
                    ? new Date(tableData.metadata["last-updated-ms"]).toLocaleString()
                    : '-'}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Properties</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Key</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.metadata.properties && 
                      Object.entries(tableData.metadata.properties).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{key}</TableCell>
                          <TableCell>{value}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drop Dialog */}
      <Dialog open={showDropDialog} onOpenChange={setShowDropDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Table</DialogTitle>
            <DialogDescription>
              Are you sure you want to drop the table "{table}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDropDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDropTable}>
              Drop Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
            <DialogDescription>
              Enter a new name for the table "{table}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">New table name</Label>
              <Input
                id="name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Enter new table name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameTable}>
              Rename Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailType.charAt(0).toUpperCase() + detailType.slice(1)} Detail</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <textarea
              readOnly
              value={snapshotDetail || ''}
              className="w-full h-64 p-2 border rounded font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
