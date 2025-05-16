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
import Prism from "prismjs"
import "prismjs/components/prism-sql"
import "@/styles/sql-editor.css"

/**
 * Highlights SQL code using Prism.js
 * @param sql The SQL code to highlight
 * @returns HTML string with syntax highlighting
 */
export function highlightSQL(sql: string): string {
  try {
    // Highlight the SQL code
    const highlighted = Prism.highlight(sql, Prism.languages.sql, "sql")

    // Wrap in pre and code tags with custom styling
    return `<pre class="language-sql" style="margin: 0; padding: 0; background: transparent;"><code class="language-sql" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; line-height: 1.5;">${highlighted}</code></pre>`
  } catch (error) {
    console.error("Error highlighting SQL:", error)
    // Fallback to plain text if highlighting fails
    return `<pre style="margin: 0; padding: 0; background: transparent;">${sql.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`
  }
}
