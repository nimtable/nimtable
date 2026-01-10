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

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Bot, CheckCircle2, PlugZap, TestTube2 } from "lucide-react"

interface AISettings {
  endpoint: string
  apiKey: string
  modelName: string
  isEnabled: boolean
  hasApiKey?: boolean
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    endpoint: "",
    apiKey: "",
    modelName: "",
    isEnabled: false,
    hasApiKey: false,
  })
  const [updateApiKey, setUpdateApiKey] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [enableLoading, setEnableLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const missingEndpoint = !settings.endpoint?.trim()
  const missingModelName = !settings.modelName?.trim()
  const apiKeyReady =
    Boolean(settings.hasApiKey) && !updateApiKey
      ? true
      : Boolean(settings.apiKey?.trim())
  const missingApiKey = !apiKeyReady

  const isConfigured = !missingEndpoint && !missingModelName && !missingApiKey
  const canTest = isConfigured && !testLoading

  type InlineState =
    | { status: "idle" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }

  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<InlineState>({ status: "idle" })
  const [testState, setTestState] = useState<InlineState>({ status: "idle" })
  const [enableState, setEnableState] = useState<InlineState>({ status: "idle" })

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/ai-settings")
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
          // If no API key exists, show input field by default
          setUpdateApiKey(!data.hasApiKey)
          setLoadError(null)
        }
      } catch (error) {
        console.error("Failed to load AI settings:", error)
        setLoadError("Failed to load AI settings. Please refresh the page.")
      } finally {
        setInitialLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleToggleEnable = async (checked: boolean) => {
    setEnableLoading(true)
    const previousEnabled = settings.isEnabled
    setEnableState({ status: "idle" })

    // If enabling, validate required fields before calling the server.
    // Otherwise users get an error toast while they can't even edit the inputs yet.
    if (checked) {
      // The toggle is disabled when configuration is incomplete, but keep a guard
      // here in case it's triggered programmatically.
      if (!isConfigured) {
        setEnableState({
          status: "error",
          message:
            "Complete API Endpoint, Model Name, and API Key before enabling AI.",
        })
        setEnableLoading(false)
        return
      }
    }

    // Optimistically update UI
    setSettings({ ...settings, isEnabled: checked })

    try {
      const response = await fetch("/api/ai-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          isEnabled: checked,
          // Don't send API key unless updating
          apiKey: updateApiKey ? settings.apiKey : undefined,
        }),
      })

      if (response.ok) {
        setEnableState({
          status: "success",
          message: checked ? "AI is enabled." : "AI is disabled.",
        })

        // Reload settings to get fresh data
        const getResponse = await fetch("/api/ai-settings")
        if (getResponse.ok) {
          const data = await getResponse.json()
          setSettings(data)
          setUpdateApiKey(!data.hasApiKey)
        }
      } else {
        // Revert on error
        setSettings({ ...settings, isEnabled: previousEnabled })
        const error = await response.json()
        throw new Error(error.error || "Failed to update AI settings")
      }
    } catch (error) {
      // Revert on error
      setSettings({ ...settings, isEnabled: previousEnabled })
      console.error("Failed to toggle AI settings:", error)
      setEnableState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to update AI settings",
      })
    } finally {
      setEnableLoading(false)
    }
  }

  const handleSave = async () => {
    setSaveLoading(true)
    setSaveState({ status: "idle" })
    try {
      const response = await fetch("/api/ai-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...settings,
          // Only send API key if user wants to update it
          apiKey: updateApiKey ? settings.apiKey : undefined,
        }),
      })

      if (response.ok) {
        setSaveState({ status: "success", message: "Settings saved." })
        setTestState({ status: "idle" })

        // Reload to get fresh hasApiKey status
        const getResponse = await fetch("/api/ai-settings")
        if (getResponse.ok) {
          const data = await getResponse.json()
          setSettings(data)
          setUpdateApiKey(!data.hasApiKey)
        }
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save AI settings:", error)
      setSaveState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to save AI settings",
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleTest = async () => {
    setTestLoading(true)
    setTestState({ status: "idle" })
    try {
      // Validate settings before testing
      if (!settings.endpoint || !settings.modelName) {
        setTestState({
          status: "error",
          message: "Fill API Endpoint and Model Name before testing.",
        })
        return
      }

      const response = await fetch("/api/ai-settings/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endpoint: settings.endpoint,
          apiKey: updateApiKey ? settings.apiKey : undefined, // Use existing key if not updating
          modelName: settings.modelName,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setTestState({
          status: "success",
          message: `Connected successfully. Response: "${result.response}"`,
        })
      } else {
        setTestState({
          status: "error",
          message: result.message || "Failed to connect to AI endpoint.",
        })
      }
    } catch (error) {
      console.error("Failed to test AI endpoint:", error)
      setTestState({
        status: "error",
        message: "Failed to test AI connection. Please check your settings.",
      })
    } finally {
      setTestLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-card-foreground" />
            <h2 className="text-base font-normal text-card-foreground">
              AI Settings
            </h2>
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Description */}
            <div>
              <Skeleton className="h-4 w-full max-w-md" />
            </div>

            {/* Settings Form */}
            <div className="space-y-6">
              {/* Enable Switch */}
              <div className="flex items-center space-x-2 pb-6 border-b border-border">
                <Skeleton className="h-5 w-10 rounded-full" />
                <Skeleton className="h-5 w-48" />
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-64" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-48" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-6 border-t border-border">
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-36" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full max-w-md" />
                  <Skeleton className="h-3 w-full max-w-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background h-full">
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-card-foreground" />
              <h2 className="text-base font-normal text-card-foreground">
                AI Settings
              </h2>
              <span className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                {settings.isEnabled ? "Enabled" : "Disabled"}
              </span>
              <span className="rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                {isConfigured ? "Configured" : "Not configured"}
              </span>
            </div>
            {enableLoading && (
              <span className="text-xs text-muted-foreground">Updating…</span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Nimtable currently supports OpenAI API-compatible endpoints. If you
            want to use providers like Anthropic Claude, Google Gemini, or AWS
            Bedrock, route them through an OpenAI-compatible gateway and use the
            gateway endpoint here. Nimtable will send AI requests using the
            endpoint, model name, and API key you configure below.
          </p>

          {loadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Could not load settings</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Configure */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-6">
            <div className="flex items-center gap-2">
              <PlugZap className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-card-foreground">
                1) Configure provider
              </h3>
            </div>

            {!isConfigured && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing required fields</AlertTitle>
                <AlertDescription>
                  {missingEndpoint && <p>• API Endpoint is required</p>}
                  {missingModelName && <p>• Model Name is required</p>}
                  {missingApiKey && <p>• API Key is required</p>}
                </AlertDescription>
              </Alert>
            )}

            {saveState.status === "success" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Saved</AlertTitle>
                <AlertDescription>{saveState.message}</AlertDescription>
              </Alert>
            )}

            {saveState.status === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Save failed</AlertTitle>
                <AlertDescription>{saveState.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="endpoint" className="text-sm font-medium">
                  API Endpoint
                </Label>
                <Input
                  id="endpoint"
                  placeholder="https://api.openai.com/v1"
                  value={settings.endpoint}
                  onChange={(e) => {
                    setSettings({ ...settings, endpoint: e.target.value })
                    setSaveState({ status: "idle" })
                    setTestState({ status: "idle" })
                    setEnableState({ status: "idle" })
                  }}
                  className="bg-card border-input"
                />
                <p className="text-xs text-muted-foreground">
                  OpenAI API-compatible base URL.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-key" className="text-sm font-medium">
                    API Key
                  </Label>
                  {settings.hasApiKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newUpdateApiKey = !updateApiKey
                        setUpdateApiKey(newUpdateApiKey)
                        setSaveState({ status: "idle" })
                        setTestState({ status: "idle" })
                        setEnableState({ status: "idle" })
                        if (newUpdateApiKey) {
                          setSettings({ ...settings, apiKey: "" })
                        }
                      }}
                      className="border-input bg-card h-8"
                    >
                      {updateApiKey ? "Keep existing" : "Update"}
                    </Button>
                  )}
                </div>
                {settings.hasApiKey && !updateApiKey ? (
                  <div className="p-3 bg-muted/50 rounded-md border border-border">
                    <p className="text-xs text-muted-foreground">
                      ✓ API key is configured. Click "Update" to change it.
                    </p>
                  </div>
                ) : (
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-..."
                    value={settings.apiKey}
                    onChange={(e) => {
                      setSettings({ ...settings, apiKey: e.target.value })
                      setSaveState({ status: "idle" })
                      setTestState({ status: "idle" })
                      setEnableState({ status: "idle" })
                    }}
                    className="bg-card border-input"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Stored securely. Never shown again after saving.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-name" className="text-sm font-medium">
                  Model Name
                </Label>
                <Input
                  id="model-name"
                  placeholder="gpt-4o-mini"
                  value={settings.modelName}
                  onChange={(e) => {
                    setSettings({ ...settings, modelName: e.target.value })
                    setSaveState({ status: "idle" })
                    setTestState({ status: "idle" })
                    setEnableState({ status: "idle" })
                  }}
                  className="bg-card border-input"
                />
                <p className="text-xs text-muted-foreground">
                  The model identifier for your endpoint.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LoadingButton
                onClick={handleSave}
                loading={saveLoading}
                disabled={saveLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saveLoading ? "Saving..." : "Save"}
              </LoadingButton>
            </div>
          </div>

          {/* Step 2: Test */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5 text-primary" />
              <h3 className="text-base font-semibold text-card-foreground">
                2) Test connection
              </h3>
            </div>

            {testState.status === "success" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Connection successful</AlertTitle>
                <AlertDescription>{testState.message}</AlertDescription>
              </Alert>
            )}

            {testState.status === "error" && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Connection failed</AlertTitle>
                <AlertDescription>{testState.message}</AlertDescription>
              </Alert>
            )}

            <LoadingButton
              variant="outline"
              onClick={handleTest}
              loading={testLoading}
              disabled={!canTest || testLoading}
              className="border-input bg-card hover:bg-muted/50"
            >
              {testLoading ? "Testing..." : "Test Connection"}
            </LoadingButton>
          </div>

          {/* Step 3: Enable */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-card-foreground">
                  3) Enable AI
                </h3>
                <p className="text-sm text-muted-foreground">
                  Turn AI features on or off for your account.
                </p>
              </div>

              {settings.isEnabled ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={enableLoading}
                  onClick={() => handleToggleEnable(false)}
                  className="border-input bg-card hover:bg-muted/50"
                >
                  Disable AI
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!isConfigured || enableLoading}
                  onClick={() => handleToggleEnable(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Enable AI
                </Button>
              )}
            </div>

            {enableState.status === "success" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Updated</AlertTitle>
                <AlertDescription>{enableState.message}</AlertDescription>
              </Alert>
            )}

            {enableState.status === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Update failed</AlertTitle>
                <AlertDescription>{enableState.message}</AlertDescription>
              </Alert>
            )}

            {!settings.isEnabled && !isConfigured && (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Not ready</AlertTitle>
                <AlertDescription>
                  Save API Endpoint, Model Name, and API Key before enabling AI.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
