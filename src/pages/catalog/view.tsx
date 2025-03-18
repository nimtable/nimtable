import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { ChevronRight, View as ViewIcon, PanelRightClose, PanelRightOpen, MoreVertical } from "lucide-react"
import { Link } from "react-router-dom"

import { Api, LoadViewResult, Schema, StructField, ViewVersion } from "@/lib/api"
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

async function loadViewData(catalog: string, namespace: string, view: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
  const response = await api.v1.loadView('', namespace, view)
  return response
}

export default function ViewPage() {
  const { catalog, namespace, view } = useParams<{ catalog: string, namespace: string, view: string }>()
  const { toast } = useToast()
  if (!catalog || !namespace || !view) {
    throw new Error("Invalid view path")
  }

  const [viewData, setViewData] = useState<LoadViewResult | undefined>(undefined)
  const [showDetails, setShowDetails] = useState(true)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [versionDetail, setVersionDetail] = useState<string | null>(null)

  useEffect(() => {
    loadViewData(catalog, namespace, view)
      .then(setViewData)
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Failed to load view",
          description: errorToString(error),
        })
      })
  }, [catalog, namespace, view, toast])

  const handleShowDetail = (version: ViewVersion) => {
    setVersionDetail(JSON.stringify(version, null, 2))
    setShowDetailDialog(true)
  }

  if (!viewData) return null

  const currentVersionId = viewData.metadata["current-version-id"]
  const currentSchemaId = viewData.metadata.versions?.find(v => v["version-id"] === currentVersionId)!["schema-id"];
  const schema = viewData.metadata.schemas?.find(s => s["schema-id"] === currentSchemaId);

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
          <span className="text-muted-foreground">Views</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{view}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <ViewIcon className="h-4 w-4" />
              <h1 className="text-xl font-semibold">{view}</h1>
            </div>
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

            {/* View Version Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Versions</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Schema ID</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewData.metadata.versions?.map(version => (
                    <TableRow key={version["version-id"]}>
                      <TableCell className="font-medium">
                        {version["version-id"]}
                      </TableCell>
                      <TableCell>
                        {new Date(version["timestamp-ms"]).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {version["schema-id"]}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleShowDetail(version)}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
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
                <h3 className="text-sm font-medium text-muted-foreground mb-2">View UUID</h3>
                <p className="text-sm">{viewData.metadata["view-uuid"]}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Location</h3>
                <p className="text-sm">{viewData.metadata.location}</p>
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
                    {viewData.metadata.properties &&
                      Object.entries(viewData.metadata.properties).map(([key, value]) => (
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version Detail</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <textarea
              readOnly
              value={versionDetail || ''}
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
