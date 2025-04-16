"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { ShlinkStats } from "@/components/shlink-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { getShortUrls } from "@/lib/api-service"
import type { ShortUrl } from "@/types/api"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function StatsPage() {
  const [apiKey, setApiKey] = useState<string>("")
  const [apiUrl, setApiUrl] = useState<string>("")
  const [isConfigured, setIsConfigured] = useState<boolean>(false)
  const [selectedShortCode, setSelectedShortCode] = useState<string | null>(null)
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

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

  useEffect(() => {
    if (isConfigured) {
      loadShortUrls()
    }
  }, [isConfigured])

  const loadShortUrls = async () => {
    if (!apiUrl || !apiKey) return

    setIsLoading(true)
    try {
      const response = await getShortUrls(apiUrl, apiKey, 1, 100)
      setShortUrls(response.shortUrls.data)

      // If we have URLs but none selected, select the first one
      if (response.shortUrls.data.length > 0 && !selectedShortCode) {
        setSelectedShortCode(response.shortUrls.data[0].shortCode)
      } else if (response.shortUrls.data.length === 0) {
        // Clear selection if no URLs exist
        setSelectedShortCode(null)
      } else if (selectedShortCode) {
        // Verify that the currently selected shortCode still exists
        const stillExists = response.shortUrls.data.some((url) => url.shortCode === selectedShortCode)
        if (!stillExists && response.shortUrls.data.length > 0) {
          setSelectedShortCode(response.shortUrls.data[0].shortCode)
        }
      }
    } catch (error) {
      console.error("Failed to load short URLs:", error)
      setShortUrls([])
      setSelectedShortCode(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AppShell apiConfigured={isConfigured}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">Analyze traffic to your shortened URLs</p>
        </div>

        {isConfigured ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Select URL for Statistics</CardTitle>
                <CardDescription>Choose a short URL to view its analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Select value={selectedShortCode || ""} onValueChange={setSelectedShortCode} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a short URL" />
                      </SelectTrigger>
                      <SelectContent>
                        {shortUrls.map((url) => (
                          <SelectItem key={url.shortCode} value={url.shortCode}>
                            {url.shortCode} ({url.longUrl.substring(0, 30)}...)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={loadShortUrls} variant="outline" size="sm" disabled={isLoading}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh URLs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-[400px] w-full" />
                </CardContent>
              </Card>
            ) : selectedShortCode ? (
              <ShlinkStats apiUrl={apiUrl} apiKey={apiKey} shortCode={selectedShortCode} />
            ) : (
              <Card>
                <CardContent className="text-center py-10">
                  <p className="mb-4">Please select a short URL from the dropdown above to view its statistics</p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <h2 className="text-lg font-semibold">API Not Configured</h2>
            <p className="mt-2 text-muted-foreground">Please configure your Shlink API settings to view statistics</p>
            <Button className="mt-4" asChild>
              <Link href="/settings">Configure API</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
