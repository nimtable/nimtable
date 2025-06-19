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
            ? "text-white prose-headings:text-white prose-p:text-white prose-li:text-white prose-strong:text-white prose-em:text-white prose-code:text-white prose-pre:bg-blue-700/50 prose-code:bg-blue-700/50 prose-a:text-blue-200 hover:prose-a:text-blue-100"
            : "text-gray-900 dark:text-gray-100 prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-900 dark:prose-p:text-gray-100 prose-li:text-gray-900 dark:prose-li:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-em:text-gray-800 dark:prose-em:text-gray-200 prose-pre:bg-muted prose-code:bg-muted prose-code:text-gray-800 dark:prose-code:text-gray-200"
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
