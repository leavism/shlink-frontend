// app/page.tsx
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
import { Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShortUrlList } from "@/components/short-url-list";
import { CreateShortUrl } from "@/components/create-short-url";
import { ShlinkStats } from "@/components/shlink-stats";
import { ApiSettings } from "@/components/api-settings";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("urls");
  const [apiKey, setApiKey] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("");
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

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

  const saveSettings = (url: string, key: string) => {
    localStorage.setItem("shlinkApiUrl", url);
    localStorage.setItem("shlinkApiKey", key);
    setApiUrl(url);
    setApiKey(key);
    setIsConfigured(true);
  };

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
            <ShortUrlList apiUrl={apiUrl} apiKey={apiKey} />
          </TabsContent>

          <TabsContent value="create">
            <CreateShortUrl
              apiUrl={apiUrl}
              apiKey={apiKey}
              onSuccess={() => setActiveTab("urls")}
            />
          </TabsContent>

          <TabsContent value="stats">
            <ShlinkStats apiUrl={apiUrl} apiKey={apiKey} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
