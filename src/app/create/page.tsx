"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { CreateShortUrl } from "@/components/create-short-url"
import { useRouter } from "next/navigation"
import type { ShortUrl } from "@/types/api"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CreatePage() {
  const [apiKey, setApiKey] = useState<string>("")
  const [apiUrl, setApiUrl] = useState<string>("")
  const [isConfigured, setIsConfigured] = useState<boolean>(false)
  const router = useRouter()

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

  const handleSuccess = () => {
    router.push("/urls")
  }

  return (
    <AppShell apiConfigured={isConfigured}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Short URL</h1>
          <p className="text-muted-foreground">Generate a new shortened URL for your long link</p>
        </div>

        {isConfigured ? (
          <CreateShortUrl apiUrl={apiUrl} apiKey={apiKey} onSuccess={handleSuccess} />
        ) : (
          <div className="rounded-lg border p-8 text-center">
            <h2 className="text-lg font-semibold">API Not Configured</h2>
            <p className="mt-2 text-muted-foreground">Please configure your Shlink API settings to create URLs</p>
            <Button className="mt-4" asChild>
              <Link href="/settings">Configure API</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
