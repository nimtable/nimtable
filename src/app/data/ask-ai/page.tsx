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
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SidebarInset } from "@/components/ui/sidebar"
import { SqlEditorNavbar } from "@/components/shared/sql-editor-navbar"
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

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  toolInvocations?: Array<{
    toolName: string
    toolCallId: string
    args: any
    result?: any
  }>
}

export default function AskAIPage() {
  const { toast } = useToast()
  const [isCopying, setIsCopying] = useState<string | null>(null)
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>(
    {}
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, setInput, handleSubmit, isLoading, error } = useChat(
    {
      api: "/api/agent/chat",
      maxSteps: 5,
    }
  )

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

  const renderToolInvocations = (message: any) => {
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
              {message.toolInvocations.map((invocation: any, index: number) => (
                <div key={index}>{renderToolInvocation(invocation)}</div>
              ))}
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
    "Count how many records are in each table",
    "Show me tables with more than 1 million rows",
  ]

  return (
    <SidebarInset className="bg-muted/5">
      <div className="flex h-full flex-col">
        <SqlEditorNavbar title="AI Assistant" icon="ai" />

        <div className="flex-1 flex flex-col p-6 min-h-0">
          <div className="mx-auto max-w-4xl flex flex-col h-full">
            <div className="mb-6 flex-shrink-0">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="h-6 w-6 text-blue-500" />
                Ask AI
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask questions about your data in natural language. I can help
                you explore catalogs, tables, schemas, and generate SQL and
                execute queries.
              </p>
            </div>

            {/* Chat Messages - Now takes full available height */}
            <Card className="flex-1 border-muted/70 shadow-sm flex flex-col min-h-0">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="flex flex-col h-full">
                  {/* Messages Area - Takes most of the available space */}
                  <div className="flex-1 overflow-auto p-4 space-y-4 min-h-0">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          Welcome to Nimtable AI Assistant
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md">
                          I can help you explore your Iceberg data lake. Ask me
                          anything about your catalogs, namespaces, tables, or
                          generate and execute SQL queries.
                        </p>

                        <div className="w-full max-w-lg">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">
                            Try asking:
                          </h4>
                          <div className="space-y-2">
                            {exampleQueries.map((query, index) => (
                              <button
                                key={index}
                                onClick={() => setInput(query)}
                                className="w-full text-left p-3 rounded-md border border-muted/50 hover:border-blue-300 hover:bg-blue-50/50 transition-colors text-sm"
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
                              "flex gap-3",
                              message.role === "assistant"
                                ? "justify-start"
                                : "justify-end"
                            )}
                          >
                            {message.role === "assistant" && (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                                <Bot className="h-4 w-4 text-blue-600" />
                              </div>
                            )}

                            <div
                              className={cn(
                                "max-w-[80%] rounded-lg px-4 py-2",
                                message.role === "assistant"
                                  ? "bg-muted/50 text-foreground"
                                  : "bg-blue-600 text-white"
                              )}
                            >
                              {/* Tool Invocations - Now shown BEFORE the content */}
                              {message.role === "assistant" &&
                                renderToolInvocations(message)}

                              <div className="prose prose-sm max-w-none">
                                {message.content
                                  .split("\n")
                                  .map((line, index) => (
                                    <p key={index} className="mb-2 last:mb-0">
                                      {line}
                                    </p>
                                  ))}
                              </div>

                              {message.role === "assistant" && (
                                <div className="mt-2 flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleCopy(message.content, message.id)
                                    }
                                    className="h-6 px-2 text-xs"
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
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                        ))}

                        {isLoading && (
                          <div className="flex gap-3 justify-start">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                              <Bot className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="bg-muted/50 rounded-lg px-4 py-2">
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">
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

                  {/* Input Area - Fixed at bottom */}
                  <div className="border-t border-muted/50 p-4 flex-shrink-0">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask me anything about your Iceberg data..."
                        className="min-h-[44px] max-h-32 resize-none"
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
                        className="shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>

                    {error && (
                      <div className="mt-2 text-sm text-destructive">
                        Error: {error.message}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}
