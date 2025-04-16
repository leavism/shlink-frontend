"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Link2, Clock, MousePointerClick, Smartphone } from "lucide-react"
import { getShortUrls, getVisitStats } from "@/lib/api-service"
import type { ShortUrl, StatsResponse } from "@/types/api"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"

interface DashboardOverviewProps {
  apiUrl: string
  apiKey: string
}

export function DashboardOverview({ apiUrl, apiKey }: DashboardOverviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [recentUrls, setRecentUrls] = useState<ShortUrl[]>([])
  const [totalUrls, setTotalUrls] = useState(0)
  const [totalVisits, setTotalVisits] = useState(0)
  const [deviceStats, setDeviceStats] = useState<StatsResponse | null>(null)
  const [timeStats, setTimeStats] = useState<StatsResponse | null>(null)
  const [statsType, setStatsType] = useState<"days" | "months">("days")

  useEffect(() => {
    if (apiUrl && apiKey) {
      loadDashboardData()
    }
  }, [apiUrl, apiKey])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load recent URLs
      const urlsResponse = await getShortUrls(apiUrl, apiKey, 1, 5, "", [], "dateCreated-DESC")
      setRecentUrls(urlsResponse.shortUrls.data)
      setTotalUrls(urlsResponse.shortUrls.pagination.totalItems)

      // Calculate total visits
      const visitCount = urlsResponse.shortUrls.data.reduce((sum, url) => sum + url.visitsCount, 0)
      setTotalVisits(visitCount)

      // Get device stats for all URLs (using the first URL as a sample)
      if (urlsResponse.shortUrls.data.length > 0) {
        const firstUrl = urlsResponse.shortUrls.data[0]
        const osStats = await getVisitStats(apiUrl, apiKey, firstUrl.shortCode, "os")
        setDeviceStats(osStats)

        // Get time-based stats
        const dailyStats = await getVisitStats(apiUrl, apiKey, firstUrl.shortCode, statsType)
        setTimeStats(dailyStats)
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Format time stats data for the chart
  const formatTimeStatsData = () => {
    if (!timeStats || !timeStats.stats.length) return []

    return timeStats.stats.map((item: any) => ({
      name: item.date || item.month || "",
      visits: item.count,
    }))
  }

  // Format device stats data for the chart
  const formatDeviceStatsData = () => {
    if (!deviceStats || !deviceStats.stats.length) return []

    return deviceStats.stats.map((item: any) => ({
      name: item.name,
      visits: item.count,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{totalUrls}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{totalVisits}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Device</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : deviceStats && deviceStats.stats.length > 0 ? (
              <div className="text-2xl font-bold">{(deviceStats.stats[0] as any).name || "Unknown"}</div>
            ) : (
              <div className="text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Visits/URL</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : totalUrls > 0 ? (
              <div className="text-2xl font-bold">{(totalVisits / totalUrls).toFixed(1)}</div>
            ) : (
              <div className="text-2xl font-bold">0</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Visit Trends</CardTitle>
            <CardDescription>
              <Tabs defaultValue="days" onValueChange={(v) => setStatsType(v as "days" | "months")}>
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="days">Daily</TabsTrigger>
                  <TabsTrigger value="months">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : timeStats && timeStats.stats.length > 0 ? (
              <ChartContainer
                config={{
                  visits: {
                    label: "Visits",
                    color: "hsl(var(--chart-1))",
                  },
                }}
              >
                <LineChart data={formatTimeStatsData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip />
                  <Line
                    type="monotone"
                    dataKey="visits"
                    stroke="var(--color-visits)"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No visit data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent URLs</CardTitle>
            <CardDescription>Recently created short URLs</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentUrls.length > 0 ? (
              <div className="space-y-4">
                {recentUrls.slice(0, 5).map((url) => (
                  <div key={url.shortCode} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{url.shortUrl}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{url.longUrl}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MousePointerClick className="h-3 w-3" />
                        <span>{url.visitsCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(url.dateCreated)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No URLs created yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device Distribution</CardTitle>
          <CardDescription>Visits by operating system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : deviceStats && deviceStats.stats.length > 0 ? (
            <ChartContainer
              config={{
                visits: {
                  label: "Visits",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <BarChart data={formatDeviceStatsData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip />
                <Bar dataKey="visits" fill="var(--color-visits)" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No device data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
