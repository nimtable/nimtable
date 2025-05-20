"use client"

import { useChat } from "@ai-sdk/react"
import { Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { MemoizedMarkdown } from "@/components/memoized-markdown"

export default function ChatbotPage() {
  // Use API route for communication
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
    reload,
  } = useChat({
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm the Nimtable Copilot. How can I help you today?",
        createdAt: new Date(),
      },
    ],
    experimental_throttle: 50,
  })

  // Auto-scroll to the latest message
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Safely execute scrolling in the next render frame to avoid infinite loops
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [messages])

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <Card className="w-full h-[calc(100vh-6rem)] shadow-lg">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-center">Nimtable AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="p-4 flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="h-[calc(100vh-16rem)] pr-4 overflow-y-auto"
          >
            <div className="flex flex-col gap-4">
              {error && (
                <>
                  <div>An error occurred: {error.message}</div>
                  <button type="button" onClick={() => reload()}>
                    Retry
                  </button>
                </>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-4",
                    message.role === "user"
                      ? "ml-auto bg-muted text-primary-foreground"
                      : ""
                  )}
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  ) : (
                    <User className="h-5 w-5 mt-0.5 flex-shrink-0 text-primary" />
                  )}
                  <div className="text-sm prose">
                    {message.content ? (
                      <MemoizedMarkdown
                        id={message.id}
                        content={message.content}
                      />
                    ) : (
                      message.parts?.map((part, i) => {
                        if (part.type === "text") {
                          return (
                            <div key={`${message.id}-${i}`}>{part.text}</div>
                          )
                        }
                        return null
                      })
                    )}
                  </div>
                </div>
              ))}

              {status === "streaming" && (
                <div className="flex items-start gap-3 rounded-lg p-4 bg-muted animate-pulse">
                  <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-current animate-bounce"></div>
                    <div
                      className="h-2 w-2 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-current animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form className="flex w-full gap-2" onSubmit={handleSubmit}>
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={handleInputChange}
              className="flex-1"
              disabled={status === "streaming"}
            />
            <Button
              type="submit"
              size="icon"
              disabled={status === "streaming" || !input.trim()}
            >
              <span className="sr-only">Send</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
