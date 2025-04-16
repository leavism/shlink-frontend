"use client";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Settings, BarChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShortUrlList } from "@/components/short-url-list";
import { CreateShortUrl } from "@/components/create-short-url";
import { ShlinkStats } from "@/components/shlink-stats";
import { ApiSettings } from "@/components/api-settings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShortUrls } from "@/lib/api-service";
import { ShortUrl } from "@/types/api";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("urls");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [selectedShortCode, setSelectedShortCode] = useState<string | null>(null);
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Load settings from localStorage if available
    const savedApiKey = localStorage.getItem("shlinkApiKey");
    const savedApiUrl = localStorage.getItem("shlinkApiUrl");
    if (savedApiKey && savedApiUrl) {
      setApiKey(savedApiKey);
      setApiUrl(savedApiUrl);
      setIsConfigured(true);
    }
  }, []);

  useEffect(() => {
    // Load short URLs when first entering the stats tab and we're configured
    if (isConfigured && activeTab === "stats") {
      loadShortUrls();
    }
  }, [isConfigured, activeTab]); // Only re-run when these dependencies change

  const loadShortUrls = async () => {
    if (!apiUrl || !apiKey) return;

    setIsLoading(true);
    try {
      const response = await getShortUrls(apiUrl, apiKey, 1, 100);
      setShortUrls(response.shortUrls.data);

      // If we have URLs but none selected, select the first one
      if (response.shortUrls.data.length > 0 && !selectedShortCode) {
        setSelectedShortCode(response.shortUrls.data[0].shortCode);
      } else if (response.shortUrls.data.length === 0) {
        // Clear selection if no URLs exist
        setSelectedShortCode(null);
      } else if (selectedShortCode) {
        // Verify that the currently selected shortCode still exists
        const stillExists = response.shortUrls.data.some(
          url => url.shortCode === selectedShortCode
        );
        if (!stillExists && response.shortUrls.data.length > 0) {
          setSelectedShortCode(response.shortUrls.data[0].shortCode);
        }
      }
    } catch (error) {
      console.error("Failed to load short URLs:", error);
      setShortUrls([]);
      setSelectedShortCode(null);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = (url: string, key: string) => {
    localStorage.setItem("shlinkApiUrl", url);
    localStorage.setItem("shlinkApiKey", key);
    setApiUrl(url);
    setApiKey(key);
    setIsConfigured(true);
  };

  // We'll handle URL selection directly through the dropdown in the stats tab

  return (
    <div className="container mx-auto py-10">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold mb-2">Shlink Dashboard</h1>
          <p className="text-gray-500">Manage your shortened URLs</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>API Settings</DialogTitle>
            </DialogHeader>
            <ApiSettings
              initialApiUrl={apiUrl}
              initialApiKey={apiKey}
              onSave={saveSettings}
            />
          </DialogContent>
        </Dialog>
      </header>
      {!isConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Shlink Dashboard</CardTitle>
            <CardDescription>
              To get started, please configure your Shlink API settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiSettings
              initialApiUrl={apiUrl}
              initialApiKey={apiKey}
              onSave={saveSettings}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="urls" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="urls">Short URLs</TabsTrigger>
            <TabsTrigger value="create">Create URL</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          <TabsContent value="urls">
            <div className="mb-5">
              <Button onClick={() => loadShortUrls()} variant="outline" size="sm">
                Refresh URLs
              </Button>
            </div>
            <ShortUrlList
              apiUrl={apiUrl}
              apiKey={apiKey}
            />
          </TabsContent>
          <TabsContent value="create">
            <CreateShortUrl
              apiUrl={apiUrl}
              apiKey={apiKey}
              onSuccess={() => setActiveTab("urls")}
            />
          </TabsContent>
          <TabsContent value="stats">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Select URL for Statistics
                </CardTitle>
                <CardDescription>
                  Choose a short URL to view its analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-row gap-4 items-end">
                  <div className="flex-1">
                    <Select
                      value={selectedShortCode || ""}
                      onValueChange={setSelectedShortCode}
                      disabled={isLoading}
                    >
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
                  <Button onClick={loadShortUrls} variant="outline" size="sm">
                    Refresh URLs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <Card>
                <CardContent className="text-center py-10">
                  Loading short URLs...
                </CardContent>
              </Card>
            ) : selectedShortCode ? (
              <ShlinkStats
                apiUrl={apiUrl}
                apiKey={apiKey}
                shortCode={selectedShortCode}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-10">
                  <p className="mb-4">Please select a short URL from the dropdown above to view its statistics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
