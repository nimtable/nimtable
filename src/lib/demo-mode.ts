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

export const DEMO_FLAG_KEY = "nimtable-demo-mode"

export function isBrowser(): boolean {
  return typeof window !== "undefined"
}

export function isDemoModeEnabled(): boolean {
  return isBrowser() && window.localStorage.getItem(DEMO_FLAG_KEY) === "true"
}

export function enableDemoMode() {
  if (!isBrowser()) return
  window.localStorage.setItem(DEMO_FLAG_KEY, "true")
}

export function disableDemoMode() {
  if (!isBrowser()) return
  window.localStorage.removeItem(DEMO_FLAG_KEY)
}
