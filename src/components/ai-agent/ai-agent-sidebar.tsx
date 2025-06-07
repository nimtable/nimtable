/*
 * Copyright 2025 Nimtable
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Bot, 
  Send, 
  User, 
  Loader2, 
  Copy, 
  Check, 
  Table as TableIcon,
  Database,
  ChevronDown,
  ChevronRight,
  Minimize2
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { DataTable } from "@/components/query/data-table"
import { createColumns } from "@/components/query/columns"
import { useToast } from "@/hooks/use-toast"
import { useChat } from "ai/react"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { MemoizedMarkdown } from "@/components/memoized-markdown"
import { ToolInvocation, UIMessage } from "ai"
import { useAIAgent } from "@/contexts/ai-agent-context"

export function AIAgentSidebar() {
  const { isOpen, closeAgent } = useAIAgent()
  const { toast } = useToast()
  const [isCopying, setIsCopying] = useState<string | null>(null)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat({
    api: "/api/agent/chat",
    maxSteps: 5,
    experimental_throttle: 50,
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCopy = async (text: string, id: string) => {
    if (!navigator.clipboard) {
      toast({
        variant: "destructive",
        title: "Clipboard API is not available",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setIsCopying(id)
      toast({ title: "Copied to clipboard" })
      setTimeout(() => setIsCopying(null), 2000)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to copy to clipboard",
      })
    }
  }

  const renderQueryResults = (result: any) => {
    if (result?.error) {
      return (
        <div className="overflow-hidden rounded-md border border-destructive/30 mt-3">
          <div className="border-b border-destructive/30 bg-destructive/5 px-3 py-2">
            <h4 className="flex items-center gap-1.5 font-medium text-destructive text-sm">
              Error executing query
            </h4>
          </div>
          <div className="p-3">
            <pre className="whitespace-pre-wrap rounded-md bg-destructive/5 p-2 font-mono text-xs text-destructive/90">
              {result.error}
            </pre>
          </div>
        </div>
      )
    }

    if (result?.columns && result?.rows) {
      return (
        <div className="mt-3 overflow-hidden rounded-md border">
          <div className="border-b bg-muted/30 px-3 py-2">
            <h4 className="flex items-center gap-1.5 font-medium text-sm">
              <TableIcon className="h-4 w-4 text-blue-500" />
              Query Results ({result.rowCount} rows)
            </h4>
          </div>
          <div className="p-0">
            <DataTable
              columns={createColumns(result.columns)}
              data={result.rows.map((row: any[]) => {
                const obj: { [key: string]: any } = {}
                result.columns.forEach((col: string, idx: number) => {
                  obj[col] = row[idx]
                })
                return obj
              })}
              searchable={true}
              searchColumn={result.columns[0]}
            />
          </div>
        </div>
      )
    }

    return null
  }

  const renderToolInvocation = (invocation: any) => {
    const { toolName, args, result } = invocation

    return (
      <div className="mt-3 rounded-md border border-blue-200 bg-blue-50/50">
        <div className="border-b border-blue-200 bg-blue-100/50 px-3 py-2">
          <h4 className="flex items-center gap-1.5 font-medium text-blue-700 text-sm">
            <Database className="h-4 w-4" />
            {toolName === "executeSQL" && "Executing SQL Query"}
            {toolName === "getCatalogs" && "Getting Catalogs"}
            {toolName === "getNamespaces" && "Getting Namespaces"}
            {toolName === "getTables" && "Getting Tables"}
            {toolName === "getTableSchema" && "Getting Table Schema"}
          </h4>
        </div>
        <div className="p-3">
          {toolName === "executeSQL" && (
            <div>
              <div className="mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Query:
                </span>
                <div className="mt-1 rounded bg-gray-100 p-2 font-mono text-sm">
                  {args.query}
                </div>
              </div>
              {result && renderQueryResults(result)}
            </div>
          )}

          {toolName !== "executeSQL" && (
            <div>
              {args && Object.keys(args).length > 0 && (
                <div className="mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Parameters:
                  </span>
                  <div className="mt-1 rounded bg-gray-100 p-2 font-mono text-xs">
                    {JSON.stringify(args, null, 2)}
                  </div>
                </div>
              )}
              {result && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Result:
                  </span>
                  <div className="mt-1 rounded bg-gray-100 p-2 font-mono text-xs max-h-40 overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const toggleToolExpansion = (messageId: string) => {
    setExpandedTools((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  const renderToolInvocations = (message: UIMessage) => {
    if (!message.toolInvocations || message.toolInvocations.length === 0) {
      return null
    }

    const isExpanded = expandedTools[message.id] || false
    const toolCount = message.toolInvocations.length

    return (
      <div className="mb-3">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleToolExpansion(message.id)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-2 w-full justify-start bg-blue-50/50 hover:bg-blue-100/50 border border-blue-200/50"
            >
              <div className="flex items-center gap-2 text-blue-700">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <Database className="h-3 w-3" />
                <span className="text-xs font-medium">
                  {toolCount} tool call{toolCount > 1 ? "s" : ""} executed
                </span>
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="space-y-2">
              {message.toolInvocations.map(
                (invocation: ToolInvocation, index: number) => (
                  <div key={index}>{renderToolInvocation(invocation)}</div>
                )
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  }

  const exampleQueries = [
    "Show me all available catalogs and their tables",
    "What are the columns in the customer table?", 
    "Get the top 10 rows from the sales table",
    "Count how many records are in each table"
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 z-[100] w-96 bg-background border-l border-muted/50 shadow-2xl">
      <Card className="h-full rounded-none border-0 flex flex-col">
        <CardHeader className="border-b border-muted/50 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold">Nimtable Copilot</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeAgent}
              className="h-8 w-8 p-0 hover:bg-muted/50"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-auto p-4 space-y-4 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Welcome to Nimtable Copilot
                </h3>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                  I can help you explore your Iceberg data lake. Ask me anything about your catalogs, tables, or data.
                </p>

                <div className="w-full max-w-xs">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">
                    Try asking:
                  </h4>
                  <div className="space-y-1">
                    {exampleQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(query)}
                        className="w-full text-left p-2 rounded-md border border-muted/50 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-xs"
                      >
                        "{query}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      message.role === "assistant" ? "justify-start" : "justify-end"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <Bot className="h-3 w-3 text-blue-600" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2",
                        message.role === "assistant"
                          ? "bg-muted/50 text-foreground"
                          : "bg-blue-600 text-white"
                      )}
                    >
                      {message.role === "assistant" && renderToolInvocations(message)}

                      <div className="prose prose-sm max-w-none">
                        <MemoizedMarkdown
                          id={message.id}
                          content={message.content}
                          variant={message.role === "user" ? "user" : "default"}
                        />
                      </div>

                      {message.role === "assistant" && (
                        <div className="mt-2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(message.content, message.id)}
                            className="h-5 px-1 text-xs"
                          >
                            {isCopying === message.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {message.role === "user" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600">
                        <User className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100">
                      <Bot className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="bg-muted/50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-xs text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-muted/50 p-3 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your data..."
                className="min-h-[36px] max-h-24 resize-none text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="sm"
                className="shrink-0 h-9 w-9 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {error && (
              <div className="mt-2 text-xs text-destructive">
                Error: {error.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 