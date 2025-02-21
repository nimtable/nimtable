import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { ChevronRight, Database, PanelRightClose, PanelRightOpen } from "lucide-react"
import { Link } from "react-router-dom"

import { Api, LoadTableResult, Schema, StructField } from "@/lib/api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { cn, errorToString } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

async function loadTableData(catalog: string, namespace: string, table: string) {
  const api = new Api({ baseUrl: `/api/catalog/${catalog}` })
  const response = await api.v1.loadTable('', namespace, table)
  return response
}

export default function TablePage() {
  const { catalog, namespace, table } = useParams<{ catalog: string, namespace: string, table: string }>()
  const { toast } = useToast()
  if (!catalog || !namespace || !table) {
    throw new Error("Invalid table path")
  }

  const [tableData, setTableData] = useState<LoadTableResult | undefined>(undefined)
  const [showDetails, setShowDetails] = useState(true)

  useEffect(() => {
    loadTableData(catalog, namespace, table)
      .then(setTableData)
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error loading table",
          description: errorToString(error),
        })
      })
  }, [catalog, namespace, table, toast])

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
          <span className="text-foreground">{table}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto border-r">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <Database className="h-4 w-4" />
              <h1 className="text-xl font-semibold">{table}</h1>
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

            {/* Snapshots Section */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Snapshots</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Snapshot ID</TableHead>
                    <TableHead>Parent ID</TableHead>
                    <TableHead>Sequence Number</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.metadata.snapshots?.map((snapshot) => (
                    <TableRow key={snapshot["snapshot-id"]}>
                      <TableCell>{snapshot["snapshot-id"]}</TableCell>
                      <TableCell>{snapshot["parent-snapshot-id"] || '-'}</TableCell>
                      <TableCell>{snapshot["sequence-number"] || '-'}</TableCell>
                      <TableCell>
                        {new Date(snapshot["timestamp-ms"]).toLocaleString()}
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
            "border-l bg-muted/10 transition-all duration-300",
            showDetails ? "w-[400px]" : "w-0"
          )}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold">Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelRightOpen className="h-4 w-4" />
              )}
            </Button>
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
    </div>
  )
}
