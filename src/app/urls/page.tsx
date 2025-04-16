"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { ShortUrlList } from "@/components/short-url-list"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function UrlsPage() {
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

  return (
    <AppShell apiConfigured={isConfigured}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Short URLs</h1>
            <p className="text-muted-foreground">Manage all your shortened URLs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" id="refresh-urls">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <Link href="/create">
                <Plus className="mr-2 h-4 w-4" />
                Create URL
              </Link>
            </Button>
          </div>
        </div>

        {isConfigured ? (
          <ShortUrlList apiUrl={apiUrl} apiKey={apiKey} />
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <h2 className="text-lg font-semibold">API Not Configured</h2>
            <p className="mt-2 text-muted-foreground">Please configure your Shlink API settings to view your URLs</p>
            <Button className="mt-4" asChild>
              <Link href="/settings">Configure API</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
