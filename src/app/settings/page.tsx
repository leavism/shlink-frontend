"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ApiSettings } from "@/components/api-settings"
import { AppShell } from "@/components/layout/app-shell"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string>("")
  const [apiUrl, setApiUrl] = useState<string>("")
  const [isConfigured, setIsConfigured] = useState<boolean>(false)

  useEffect(() => {
    // Load settings from localStorage if available
    const savedApiKey = localStorage.getItem("shlinkApiKey")
    const savedApiUrl = localStorage.getItem("shlinkApiUrl")
    if (savedApiKey && savedApiUrl) {
      setApiKey(savedApiKey)
      setApiUrl(savedApiUrl)
      setIsConfigured(true)
    }
  }, [])

  const saveSettings = (url: string, key: string) => {
    localStorage.setItem("shlinkApiUrl", url)
    localStorage.setItem("shlinkApiKey", key)
    setApiUrl(url)
    setApiKey(key)
    setIsConfigured(true)
  }

  return (
    <AppShell apiConfigured={isConfigured}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your Shlink API connection settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>Connect to your Shlink instance by providing the API URL and key</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiSettings initialApiUrl={apiUrl} initialApiKey={apiKey} onSave={saveSettings} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
