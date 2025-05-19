"use client"

import { useState } from "react"
import { Download, Eye, RefreshCw, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type TableDetailProps = {
  table: {
    id: string
    name: string
    namespace: string
    catalog: string
    storageSize: string
    lastModified: string
    status: string
  }
  onClose: () => void
}

export function TableDetailPanel({ table, onClose }: TableDetailProps) {
  const [activeTab, setActiveTab] = useState("schema")

  // Mock schema data
  const schemaFields = [
    {
      name: "id",
      type: "uuid",
      nullPercentage: "0%",
      isPrimaryKey: true,
      description: "Unique identifier for each record",
    },
    {
      name: "user_id",
      type: "uuid",
      nullPercentage: "2%",
      isPrimaryKey: false,
      description: "Reference to the user table",
    },
    {
      name: "product_id",
      type: "uuid",
      nullPercentage: "0%",
      isPrimaryKey: false,
      description: "Reference to the product table",
    },
    {
      name: "quantity",
      type: "integer",
      nullPercentage: "0%",
      isPrimaryKey: false,
      description: "Number of items ordered",
    },
    {
      name: "price",
      type: "decimal(10,2)",
      nullPercentage: "0%",
      isPrimaryKey: false,
      description: "Price per unit at time of order",
    },
    {
      name: "discount",
      type: "decimal(10,2)",
      nullPercentage: "45%",
      isPrimaryKey: false,
      description: "Discount applied to the order",
    },
    {
      name: "created_at",
      type: "timestamp",
      nullPercentage: "0%",
      isPrimaryKey: false,
      description: "When the order was created",
    },
    {
      name: "updated_at",
      type: "timestamp",
      nullPercentage: "0%",
      isPrimaryKey: false,
      description: "When the order was last updated",
    },
    {
      name: "status",
      type: "varchar(20)",
      nullPercentage: "0%",
      isPrimaryKey: false,
      description: "Current status of the order",
    },
    {
      name: "notes",
      type: "text",
      nullPercentage: "78%",
      isPrimaryKey: false,
      description: "Additional notes about the order",
    },
  ]

  // Mock files data
  const filesData = {
    totalFiles: 128,
    totalSize: "2.4 GB",
    avgFileSize: "19.2 MB",
    partitionLayout: "date(created_at)/status",
    fileDistribution: [
      { partition: "2023-05-01/completed", files: 12, size: "240 MB" },
      { partition: "2023-05-01/pending", files: 8, size: "160 MB" },
      { partition: "2023-05-02/completed", files: 15, size: "300 MB" },
      { partition: "2023-05-02/pending", files: 10, size: "200 MB" },
      { partition: "2023-05-03/completed", files: 18, size: "360 MB" },
      { partition: "2023-05-03/pending", files: 7, size: "140 MB" },
      { partition: "2023-05-04/completed", files: 22, size: "440 MB" },
      { partition: "2023-05-04/pending", files: 9, size: "180 MB" },
      { partition: "2023-05-05/completed", files: 17, size: "340 MB" },
      { partition: "2023-05-05/pending", files: 10, size: "200 MB" },
    ],
  }

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white border-l shadow-lg z-10 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">{table.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">{table.catalog}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{table.namespace}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Button size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Run Compaction
          </Button>
          <Button size="sm" variant="outline" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Regenerate Stats
          </Button>
          <Button size="sm" variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
            Export Context
          </Button>
          <Button size="sm" variant="outline" className="gap-1">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="schema"
        className="flex-1 flex flex-col"
        onValueChange={setActiveTab}
      >
        <div className="border-b px-4">
          <TabsList className="h-10">
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="schema" className="p-4 mt-0">
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr,1fr,80px,80px,2fr] gap-2 text-sm font-medium text-muted-foreground">
                <div>Field Name</div>
                <div>Type</div>
                <div>Null %</div>
                <div>PK</div>
                <div>Description</div>
              </div>

              {schemaFields.map((field) => (
                <div
                  key={field.name}
                  className="grid grid-cols-[1fr,1fr,80px,80px,2fr] gap-2 text-sm border-b pb-2"
                >
                  <div className="font-medium">{field.name}</div>
                  <div className="font-mono text-xs bg-gray-100 rounded px-2 py-1 inline-flex items-center">
                    {field.type}
                  </div>
                  <div>{field.nullPercentage}</div>
                  <div>{field.isPrimaryKey ? "✓" : ""}</div>
                  <div className="text-muted-foreground">
                    {field.description}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="files" className="p-4 mt-0">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Total Files
                  </div>
                  <div className="text-2xl font-semibold">
                    {filesData.totalFiles}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Total Size
                  </div>
                  <div className="text-2xl font-semibold">
                    {filesData.totalSize}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Avg File Size
                  </div>
                  <div className="text-2xl font-semibold">
                    {filesData.avgFileSize}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Partition Layout
                  </div>
                  <div className="text-lg font-mono">
                    {filesData.partitionLayout}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  File Distribution by Partition
                </h3>
                <div className="space-y-2">
                  {filesData.fileDistribution.map((partition, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm border-b pb-2"
                    >
                      <div className="font-mono">{partition.partition}</div>
                      <div className="flex gap-4">
                        <span>{partition.files} files</span>
                        <span className="font-medium">{partition.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="p-4 mt-0">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Field Cardinality</h3>
                <div className="space-y-3">
                  {schemaFields.slice(0, 5).map((field) => (
                    <div key={field.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{field.name}</span>
                        <span>
                          {Math.floor(Math.random() * 10000)} distinct values
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${Math.floor(Math.random() * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Null Distribution</h3>
                <div className="space-y-3">
                  {schemaFields
                    .filter((f) => f.nullPercentage !== "0%")
                    .map((field) => (
                      <div key={field.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{field.name}</span>
                          <span>{field.nullPercentage} null</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{
                              width: field.nullPercentage.replace("%", ""),
                            }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="context" className="p-4 mt-0">
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Table Summary</h3>
                <p className="text-sm text-muted-foreground">
                  This table stores customer order information including product
                  details, quantities, pricing, and order status. It's
                  partitioned by date and status for efficient querying of
                  recent and in-progress orders.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">
                  Structured Metadata
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex">
                    <div className="w-32 font-medium">Owner</div>
                    <div>Sales Team</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 font-medium">Created</div>
                    <div>May 1, 2023</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 font-medium">Catalog</div>
                    <div>{table.catalog}</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 font-medium">Namespace</div>
                    <div>{table.namespace}</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 font-medium">SLA</div>
                    <div>99.9% availability</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 font-medium">Retention</div>
                    <div>3 years</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 font-medium">Upstream</div>
                    <div>orders_raw, products</div>
                  </div>
                  <div className="flex">
                    <div className="w-32 font-medium">Downstream</div>
                    <div>order_analytics, financial_summary</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">LLM-Ready Context</h3>
                <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs">
                  <pre className="whitespace-pre-wrap">
                    {`{
  "table_name": "${table.name}",
  "namespace": "${table.namespace}",
  "catalog": "${table.catalog}",
  "description": "Stores customer order information",
  "primary_key": ["id"],
  "foreign_keys": [
    {"column": "user_id", "references": "users.id"},
    {"column": "product_id", "references": "products.id"}
  ],
  "partitioning": "date(created_at)/status",
  "common_queries": [
    "Recent orders by status",
    "Orders by product",
    "User purchase history"
  ]
}`}
                  </pre>
                </div>
                <Button variant="outline" size="sm" className="mt-2 w-full">
                  Copy Context
                </Button>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
