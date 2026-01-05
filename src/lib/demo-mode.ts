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

