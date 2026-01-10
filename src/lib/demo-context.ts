/*
 * Copyright 2026 Nimtable
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

const DEMO_CONTEXT_KEY = "nimtable-demo-context"

export type DemoContext = {
  catalog: string
  namespace: string
  table: string
}

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function setDemoContext(ctx: DemoContext) {
  if (!isBrowser()) return
  window.localStorage.setItem(DEMO_CONTEXT_KEY, JSON.stringify(ctx))
}

export function getDemoContext(): DemoContext | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(DEMO_CONTEXT_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<DemoContext>
    if (!parsed.catalog || !parsed.namespace || !parsed.table) return null
    return {
      catalog: String(parsed.catalog),
      namespace: String(parsed.namespace),
      table: String(parsed.table),
    }
  } catch {
    return null
  }
}

export function clearDemoContext() {
  if (!isBrowser()) return
  window.localStorage.removeItem(DEMO_CONTEXT_KEY)
}
