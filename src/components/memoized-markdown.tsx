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

import { marked } from "marked"
import { memo, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw)
}

interface MemoizedMarkdownBlockProps {
  content: string
  variant?: "default" | "user"
}

const MemoizedMarkdownBlock = memo(
  ({ content, variant = "default" }: MemoizedMarkdownBlockProps) => {
    return (
      <div
        className={cn(
          "prose prose-sm max-w-none prose-pre:px-1 prose-pre:rounded prose-code:px-1 prose-code:rounded",
          variant === "user"
            ? "prose-invert prose-pre:bg-blue-700/50 prose-code:bg-blue-700/50"
            : "dark:prose-invert prose-pre:bg-muted prose-code:bg-muted"
        )}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  },
  (
    prevProps: MemoizedMarkdownBlockProps,
    nextProps: MemoizedMarkdownBlockProps
  ) => {
    if (
      prevProps.content !== nextProps.content ||
      prevProps.variant !== nextProps.variant
    )
      return false
    return true
  }
)

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

interface MemoizedMarkdownProps {
  content: string
  id: string
  variant?: "default" | "user"
}

export const MemoizedMarkdown = memo(
  ({ content, id, variant = "default" }: MemoizedMarkdownProps) => {
    const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content])

    return (
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <MemoizedMarkdownBlock
            content={block}
            variant={variant}
            key={`${id}-block_${index}`}
          />
        ))}
      </div>
    )
  }
)

MemoizedMarkdown.displayName = "MemoizedMarkdown"
