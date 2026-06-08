"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/AdminLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, RotateCcw } from "lucide-react"
import type { SystemSettings } from "@/lib/admin/settingsStore"

export default function AdminSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/settings")
      if (!response.ok) throw new Error("Failed to fetch settings")
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!settings) return

    try {
      setSaving(true)
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm("Are you sure you want to reset all settings to defaults?")) return

    try {
      setSaving(true)
      const response = await fetch("/api/admin/settings", {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to reset settings")

      toast({
        title: "Success",
        description: "Settings reset to defaults",
      })

      await fetchSettings()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <AdminLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight">Admin Settings</h1>
            <p className="text-pretty text-muted-foreground">
              Configure system preferences and control platform settings.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Basic platform information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  value={settings.platform.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      platform: { ...settings.platform, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-version">Version</Label>
                <Input
                  id="platform-version"
                  value={settings.platform.version}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      platform: { ...settings.platform, version: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-environment">Environment</Label>
                <select
                  id="platform-environment"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={settings.platform.environment}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      platform: {
                        ...settings.platform,
                        environment: e.target.value as 'development' | 'staging' | 'production',
                      },
                    })
                  }
                >
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Temporarily disable public access
                  </p>
                </div>
                <Switch
                  checked={settings.features.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      features: { ...settings.features, maintenanceMode: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Quest Submissions</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new quest submissions
                  </p>
                </div>
                <Switch
                  checked={settings.features.allowQuestSubmissions}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      features: { ...settings.features, allowQuestSubmissions: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Access</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow public browsing
                  </p>
                </div>
                <Switch
                  checked={settings.features.allowPublicAccess}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      features: { ...settings.features, allowPublicAccess: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>External API endpoints and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="horizon-url">Horizon API URL</Label>
                <Input
                  id="horizon-url"
                  value={settings.api.horizonUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      api: { ...settings.api, horizonUrl: e.target.value },
                    })
                  }
                  placeholder="https://horizon.stellar.org"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toml-url">Stellar TOML URL</Label>
                <Input
                  id="toml-url"
                  value={settings.api.stellarTomlUrl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      api: { ...settings.api, stellarTomlUrl: e.target.value },
                    })
                  }
                  placeholder="https://stellar.org/.well-known/stellar.toml"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-timeout">API Timeout (ms)</Label>
                <Input
                  id="api-timeout"
                  type="number"
                  value={settings.api.timeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      api: { ...settings.api, timeout: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cache Settings</CardTitle>
              <CardDescription>Configure cache TTL values (seconds)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-cache">Token Cache TTL</Label>
                <Input
                  id="token-cache"
                  type="number"
                  value={settings.cache.tokenCacheTtl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cache: { ...settings.cache, tokenCacheTtl: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pool-cache">Pool Cache TTL</Label>
                <Input
                  id="pool-cache"
                  type="number"
                  value={settings.cache.poolCacheTtl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cache: { ...settings.cache, poolCacheTtl: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="market-cache">Market Stats Cache TTL</Label>
                <Input
                  id="market-cache"
                  type="number"
                  value={settings.cache.marketStatsCacheTtl}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cache: { ...settings.cache, marketStatsCacheTtl: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
