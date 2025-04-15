// components/api-settings.tsx
"use client";

import { useState, useEffect, FC } from 'react';
import { toast } from 'sonner';
import { KeyRound, Server, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DialogFooter, } from '@/components/ui/dialog';
import { checkHealth } from '@/lib/api-service';

interface ApiSettingsProps {
  initialApiUrl?: string;
  initialApiKey?: string;
  onSave: (apiUrl: string, apiKey: string) => void;
}

interface ConnectionStatus {
  success: boolean;
  message: string;
}

export const ApiSettings: FC<ApiSettingsProps> = ({
  initialApiUrl = '',
  initialApiKey = '',
  onSave
}) => {
  const [apiUrl, setApiUrl] = useState<string>(initialApiUrl);
  const [apiKey, setApiKey] = useState<string>(initialApiKey);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  useEffect(() => {
    setApiUrl(initialApiUrl);
    setApiKey(initialApiKey);
  }, [initialApiUrl, initialApiKey]);

  const handleTestConnection = async () => {
    if (!apiUrl) {
      setConnectionStatus({
        success: false,
        message: 'API URL is required'
      });
      toast.error('API URL is required');
      return;
    }

    setIsChecking(true);
    setConnectionStatus(null);

    // Using toast.promise to show loading/success/error states
    try {
      const isHealthy = toast.promise(
        checkHealth(apiUrl),
        {
          loading: 'Testing connection...',
          success: 'Connection successful!',
          error: 'Connection failed'
        }
      );

      if (isHealthy) {
        setConnectionStatus({
          success: true,
          message: 'Connection successful! Shlink API is healthy.'
        });
      } else {
        setConnectionStatus({
          success: false,
          message: 'Connection failed. Shlink API is not responding.'
        });
        toast.error('Connection failed. Shlink API is not responding.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setConnectionStatus({
        success: false,
        message: `Connection error: ${errorMessage}`
      });
      // No need for explicit toast here as it's handled by toast.promise
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = () => {
    if (!apiUrl || !apiKey) {
      toast.error('API URL and API Key are required');
      return;
    }

    onSave(apiUrl, apiKey);
    toast.success('API settings saved successfully');
  };

  return (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="apiUrl">Shlink API URL</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                id="apiUrl"
                placeholder="https://your-shlink-instance.com"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isChecking || !apiUrl}
            >
              {isChecking ? 'Checking...' : 'Test'}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            The URL of your Shlink API, including protocol and domain
          </p>
        </div>

        {connectionStatus && (
          <Alert
            variant={connectionStatus.success ? 'default' : 'destructive'}
            className={connectionStatus.success ? 'bg-green-50 border-green-200' : undefined}
          >
            {connectionStatus.success ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : null}
            <AlertTitle>{connectionStatus.success ? 'Success' : 'Error'}</AlertTitle>
            <AlertDescription>{connectionStatus.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              id="apiKey"
              type="password"
              placeholder="Your Shlink API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-gray-500">
            API key for authentication. You can generate this in your Shlink instance
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button
          onClick={handleSave}
          disabled={!apiUrl || !apiKey}
        >
          Save Settings
        </Button>
      </DialogFooter>
    </>
  );
};
