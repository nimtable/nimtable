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
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot } from "lucide-react"

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
  const [loading, setLoading] = useState(false)
  const [switchLoading, setSwitchLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { toast } = useToast()

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
        }
      } catch (error) {
        console.error("Failed to load AI settings:", error)
        toast({
          title: "Error",
          description: "Failed to load AI settings",
          variant: "destructive",
        })
      } finally {
        setInitialLoading(false)
      }
    }

    loadSettings()
  }, [toast])

  const handleToggleEnable = async (checked: boolean) => {
    setSwitchLoading(true)
    const previousEnabled = settings.isEnabled

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
        toast({
          title: checked
            ? "AI Configuration Enabled"
            : "AI Configuration Disabled",
          description: checked
            ? "Custom AI settings are now active"
            : "Using default Nimtable AI service",
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
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update AI settings",
        variant: "destructive",
      })
    } finally {
      setSwitchLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
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
        toast({
          title: "Success",
          description: "AI settings saved successfully",
        })

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
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save AI settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setLoading(true)
    try {
      // Validate settings before testing
      if (!settings.endpoint || !settings.modelName) {
        toast({
          title: "Error",
          description:
            "Please configure endpoint and model name before testing",
          variant: "destructive",
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
        toast({
          title: "Connection Successful! ✅",
          description: `Test response: "${result.response}" | Tokens used: ${result.usage?.totalTokens || 0}`,
        })
      } else {
        toast({
          title: "Connection Failed ❌",
          description: result.message || "Failed to connect to AI endpoint",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to test AI endpoint:", error)
      toast({
        title: "Test Failed",
        description:
          "Failed to test AI connection. Please check your settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-background h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-card-foreground" />
            <h2 className="text-m font-normal text-card-foreground">
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
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground">
              Configure your AI endpoint and API key. When enabled, Nimtable
              will use your custom settings.
            </p>
          </div>

          {/* Settings Form */}
          <div className="space-y-6">
            {/* Enable Switch */}
            <div className="flex items-center space-x-2 pb-6 border-b border-border">
              <Switch
                id="ai-enabled"
                checked={settings.isEnabled}
                onCheckedChange={handleToggleEnable}
                disabled={switchLoading}
              />
              <Label htmlFor="ai-enabled" className="text-sm font-medium">
                Enable custom AI configuration
                {switchLoading && (
                  <span className="ml-2 text-sm text-muted-foreground font-normal">
                    Updating...
                  </span>
                )}
              </Label>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="endpoint" className="text-sm font-medium">
                  API Endpoint
                </Label>
                <Input
                  id="endpoint"
                  placeholder="https://api.openai.com/v1"
                  value={settings.endpoint}
                  onChange={(e) =>
                    setSettings({ ...settings, endpoint: e.target.value })
                  }
                  disabled={!settings.isEnabled}
                  className="bg-card border-input"
                />
                <p className="text-xs text-muted-foreground">
                  Must be OpenAI-compatible API endpoint
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
                        // Clear API key input when switching to update mode
                        if (newUpdateApiKey) {
                          setSettings({ ...settings, apiKey: "" })
                        }
                      }}
                      disabled={!settings.isEnabled}
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
                    onChange={(e) =>
                      setSettings({ ...settings, apiKey: e.target.value })
                    }
                    disabled={!settings.isEnabled}
                    className="bg-card border-input"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  Your API key will be stored securely
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="model-name" className="text-sm font-medium">
                  Model Name
                </Label>
                <Input
                  id="model-name"
                  placeholder="gpt-4"
                  value={settings.modelName}
                  onChange={(e) =>
                    setSettings({ ...settings, modelName: e.target.value })
                  }
                  disabled={!settings.isEnabled}
                  className="bg-card border-input"
                />
                <p className="text-xs text-muted-foreground">
                  The model name to use for AI requests
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t border-border">
              <div className="flex gap-2">
                <LoadingButton
                  onClick={handleSave}
                  loading={loading}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Configuration
                </LoadingButton>
                <LoadingButton
                  variant="outline"
                  onClick={handleTest}
                  loading={loading}
                  disabled={
                    !settings.isEnabled ||
                    !settings.endpoint ||
                    !settings.modelName ||
                    (!settings.hasApiKey &&
                      (!updateApiKey || !settings.apiKey)) ||
                    loading
                  }
                  className="border-input bg-card hover:bg-muted/50"
                >
                  {loading ? "Testing..." : "Test Connection"}
                </LoadingButton>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                {settings.isEnabled ? (
                  <div>
                    <p>
                      • Test connection will send a simple "Hello" request to
                      verify your configuration.
                    </p>
                    <p>
                      • Enable/disable changes are saved automatically. Click
                      "Save Configuration" for other settings.
                    </p>
                  </div>
                ) : (
                  <p>
                    • AI is disabled. Enable to use your custom settings.
                    Enable/disable changes are saved automatically.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
