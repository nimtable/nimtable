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

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { LoadingButton } from "@/components/ui/loading-button"
import { ArrowLeft } from "lucide-react"

interface AISettings {
  endpoint: string
  apiKey: string
  modelName: string
  isEnabled: boolean
  hasApiKey?: boolean
}

export default function AISettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<AISettings>({
    endpoint: "https://api.openai.com/v1",
    apiKey: "",
    modelName: "gpt-4",
    isEnabled: false,
    hasApiKey: false
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
          title: checked ? "AI Configuration Enabled" : "AI Configuration Disabled",
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
        description: error instanceof Error ? error.message : "Failed to update AI settings",
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
        description: error instanceof Error ? error.message : "Failed to save AI settings",
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
          description: "Please configure endpoint and model name before testing",
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
        description: "Failed to test AI connection. Please check your settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-4 -ml-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Card>
            <CardHeader>
              <CardTitle>AI Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">Loading...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>AI Settings</CardTitle>
            <CardDescription>
              Configure your AI endpoint and API key. When enabled, your custom settings will be used instead of the default Nimtable AI service.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="ai-enabled"
                checked={settings.isEnabled}
                onCheckedChange={handleToggleEnable}
                disabled={switchLoading}
              />
              <Label htmlFor="ai-enabled">
                Enable custom AI configuration
                {switchLoading && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    Updating...
                  </span>
                )}
              </Label>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  placeholder="https://api.openai.com/v1"
                  value={settings.endpoint}
                  onChange={(e) =>
                    setSettings({ ...settings, endpoint: e.target.value })
                  }
                  disabled={!settings.isEnabled}
                />
                <p className="text-sm text-muted-foreground">
                  Must be OpenAI-compatible API endpoint
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-key">API Key</Label>
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
                    >
                      {updateApiKey ? "Keep existing" : "Update"}
                    </Button>
                  )}
                </div>
                
                {settings.hasApiKey && !updateApiKey ? (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
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
                  />
                )}
                
                <p className="text-sm text-muted-foreground">
                  Your API key will be stored securely
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model-name">Model Name</Label>
                <Input
                  id="model-name"
                  placeholder="gpt-4"
                  value={settings.modelName}
                  onChange={(e) =>
                    setSettings({ ...settings, modelName: e.target.value })
                  }
                  disabled={!settings.isEnabled}
                />
                <p className="text-sm text-muted-foreground">
                  The model name to use for AI requests
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex gap-2">
                <LoadingButton
                  onClick={handleSave}
                  loading={loading}
                  disabled={loading}
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
                    (!settings.hasApiKey && (!updateApiKey || !settings.apiKey)) ||
                    loading
                  }
                >
                  {loading ? "Testing..." : "Test Connection"}
                </LoadingButton>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {settings.isEnabled ? (
                  <div>
                    <p>• Test connection will send a simple "Hello" request to verify your configuration.</p>
                    <p>• Enable/disable changes are saved automatically. Click "Save Configuration" for other settings.</p>
                  </div>
                ) : (
                  <p>• Using default Nimtable AI service. Enable/disable changes are saved automatically.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 