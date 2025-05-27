"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sparkles, Copy, Play, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type TryCopilotStepProps = {
  onComplete: () => void
  onPrevious: () => void
  catalogType: "external" | "demo"
  onSelectTable: (tableName: string) => void
  selectedTable: string | null
}

export function TryCopilotStep({
  onComplete,
  onPrevious,
  catalogType,
  onSelectTable,
  selectedTable,
}: TryCopilotStepProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [copiedSQL, setCopiedSQL] = useState(false)

  // Demo tables
  const tables = [
    { id: "1", name: "customer_orders", namespace: "default" },
    { id: "2", name: "user_events", namespace: "default" },
    { id: "3", name: "product_inventory", namespace: "default" },
  ]

  const handleGenerate = () => {
    if (!selectedTable) return

    setIsGenerating(true)

    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false)
      setIsGenerated(true)
    }, 2500)
  }

  const handleCopySQL = () => {
    // Copy SQL to clipboard
    navigator.clipboard.writeText(`SELECT 
  product_id, 
  COUNT(*) as order_count,
  SUM(quantity) as total_quantity,
  SUM(price * quantity) as total_revenue
FROM customer_orders
GROUP BY product_id
ORDER BY total_revenue DESC
LIMIT 10;`)

    setCopiedSQL(true)
    setTimeout(() => setCopiedSQL(false), 2000)
  }

  return (
    <div className="flex flex-col">
      <p className="mb-6 text-gray-600">
        Let's try the Nimtable Copilot to analyze your data. Select a table and
        see how the AI can help you understand and query your data.
      </p>

      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Select a table to analyze
        </label>
        <Select
          value={selectedTable || undefined}
          onValueChange={onSelectTable}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a table" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((table) => (
              <SelectItem key={table.id} value={table.name}>
                {table.name}{" "}
                <span className="text-xs text-gray-500">
                  ({table.namespace})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedTable && (
        <div className="mb-6 overflow-hidden rounded-lg border">
          <div className="flex items-center gap-2 border-b bg-gray-50 p-3">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span className="font-medium">Ask Copilot</span>
          </div>
          <div className="p-4">
            <div className="mb-4 rounded-lg bg-gray-100 p-3 text-gray-700">
              Summarize this table
            </div>

            {!isGenerated ? (
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Generating insights...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Insights
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h3 className="mb-2 font-medium">Table Summary</h3>
                  <p className="text-sm text-gray-600">
                    This table contains customer order information with 1.2M
                    rows. It includes order details like product ID, quantity,
                    price, and timestamps. The data spans from January 2022 to
                    present, with an average of 50K new orders per month.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Key Statistics</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">Total Orders</div>
                      <div className="text-lg font-semibold">1,243,891</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">
                        Unique Customers
                      </div>
                      <div className="text-lg font-semibold">124,532</div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="text-xs text-gray-500">
                        Avg Order Value
                      </div>
                      <div className="text-lg font-semibold">$67.42</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Suggested Query</h3>
                  <div className="overflow-x-auto whitespace-pre rounded-lg bg-gray-800 p-3 font-mono text-sm text-gray-200">
                    {`SELECT 
  product_id, 
  COUNT(*) as order_count,
  SUM(quantity) as total_quantity,
  SUM(price * quantity) as total_revenue
FROM customer_orders
GROUP BY product_id
ORDER BY total_revenue DESC
LIMIT 10;`}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={handleCopySQL}
                    >
                      {copiedSQL ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      {copiedSQL ? "Copied!" : "Copy SQL"}
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Play className="h-3 w-3" />
                      Preview in DuckDB
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <h3 className="flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Copilot Tips
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          <li>• Ask questions in natural language about your data</li>
          <li>• Generate SQL queries for complex analysis</li>
          <li>• Get automatic table summaries and statistics</li>
          <li>• Identify optimization opportunities</li>
        </ul>
      </div>
    </div>
  )
}
