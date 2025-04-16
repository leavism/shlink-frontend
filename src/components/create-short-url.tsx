// components/create-short-url.tsx with Sonner Toast
"use client";

import { useState, useEffect, FC } from 'react';
import { toast } from 'sonner';
import {
  Calendar,
  Check,
  Copy,
  Hash,
  Plus,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createShortUrl, getTags } from '@/lib/api-service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { CreateShortUrlOptions, ShortUrl } from '@/types/api';

interface TagInfo {
  name: string;
  count?: number;
}

interface CreateShortUrlProps {
  apiUrl: string;
  apiKey: string;
  onSuccess?: (shortUrl: ShortUrl) => void;
}

export const CreateShortUrl: FC<CreateShortUrlProps> = ({ apiUrl, apiKey, onSuccess }) => {
  const [longUrl, setLongUrl] = useState<string>('');
  const [customSlug, setCustomSlug] = useState<string>('');
  const [useCustomSlug, setUseCustomSlug] = useState<boolean>(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [validSince, setValidSince] = useState<Date | undefined>(undefined);
  const [validUntil, setValidUntil] = useState<Date | undefined>(undefined);
  const [maxVisits, setMaxVisits] = useState<string>('');
  const [useLimits, setUseLimits] = useState<boolean>(false);
  const [validateUrl, setValidateUrl] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [createdUrl, setCreatedUrl] = useState<ShortUrl | null>(null);
  const [existingTags, setExistingTags] = useState<TagInfo[]>([]);

  useEffect(() => {
    if (apiUrl && apiKey) {
      fetchExistingTags();
    }
  }, [apiUrl, apiKey]);

  const fetchExistingTags = async () => {
    try {
      const result = await getTags(apiUrl, apiKey);

      // Convert the tags data to TagInfo format
      const tagsData: TagInfo[] = result.tags.data.map(tagName => ({
        name: tagName,
        count: result.tags.stats?.[tagName]
      }));

      setExistingTags(tagsData);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      toast.error('Failed to fetch tags');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!longUrl) {
      setError('Long URL is required');
      toast.error('Long URL is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const options: Partial<CreateShortUrlOptions> = {
        tags: selectedTags,
        validateUrl
      };

      if (useCustomSlug && customSlug) {
        options.customSlug = customSlug;
      }

      if (useLimits) {
        if (validSince) {
          options.validSince = format(validSince, "yyyy-MM-dd'T'HH:mm:ssXXX");
        }

        if (validUntil) {
          options.validUntil = format(validUntil, "yyyy-MM-dd'T'HH:mm:ssXXX");
        }

        if (maxVisits && !isNaN(Number(maxVisits))) {
          options.maxVisits = Number(maxVisits);
        }
      }

      // Use toast.promise to show loading/success/error states
      const toastComplete = toast.promise(
        createShortUrl(apiUrl, apiKey, longUrl, options),
        {
          loading: 'Creating short URL...',
          success: 'Short URL created successfully!',
          error: (err) => `Failed to create short URL: ${err.message || 'Unknown error'}`
        }
      );

      const result = await toastComplete.unwrap()

      setCreatedUrl(result);
      setIsSuccess(true);
      resetForm();

      // Notify parent component
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create short URL';
      setError(errorMessage);
      // No need to display toast here as it's handled by toast.promise
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setLongUrl('');
    setCustomSlug('');
    setUseCustomSlug(false);
    setSelectedTags([]);
    setNewTag('');
    setValidSince(undefined);
    setValidUntil(undefined);
    setMaxVisits('');
    setUseLimits(false);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;

    if (!selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      toast(`Tag "${newTag.trim()}" added`, {
        duration: 2000,
      });
    }

    setNewTag('');
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter((t) => t !== tag));
    toast(`Tag "${tag}" removed`, {
      duration: 2000,
    });
  };

  const handleUseExistingTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      toast(`Tag "${tag}" added`, {
        duration: 2000,
      });
    }
  };

  const handleCopyShortUrl = () => {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl.shortUrl);
      toast.success('Short URL copied to clipboard!');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Short URL</CardTitle>
        <CardDescription>
          Generate a new shortened URL for your long link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess && createdUrl ? (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Success!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your short URL has been created successfully
              </AlertDescription>
            </Alert>

            <div className="rounded-lg border p-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">Short URL</Label>
                <div className="flex items-center mt-1">
                  <Input
                    value={createdUrl.shortUrl}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={handleCopyShortUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Target URL</Label>
                <p className="mt-1 break-all text-gray-600">{createdUrl.longUrl}</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsSuccess(false)}>
                  Create Another
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="longUrl">Long URL</Label>
              <Input
                id="longUrl"
                placeholder="https://example.com/your/very/long/url"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customSlug">Custom Slug</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useCustomSlug"
                    checked={useCustomSlug}
                    onCheckedChange={setUseCustomSlug}
                  />
                  <Label htmlFor="useCustomSlug" className="text-sm">
                    Use custom slug
                  </Label>
                </div>
              </div>

              {useCustomSlug && (
                <div className="flex items-center mt-2">
                  <Hash className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="customSlug"
                    placeholder="your-custom-slug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    disabled={!useCustomSlug}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-medium text-sm">Tags</h3>

              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="px-2 py-1 flex items-center">
                    {tag}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-transparent"
                      onClick={() => handleRemoveTag(tag)}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="newTag">Add new tag</Label>
                  <Input
                    id="newTag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Enter tag name..."
                  />
                </div>
                <Button type="button" onClick={handleAddTag}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {existingTags.length > 0 && (
                <div>
                  <Label className="text-sm mb-2 block">Existing tags</Label>
                  <div className="flex flex-wrap gap-1">
                    {existingTags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className={`cursor-pointer ${selectedTags.includes(tag.name) ? 'bg-primary/10' : ''
                          }`}
                        onClick={() => handleUseExistingTag(tag.name)}
                      >
                        {tag.name}
                        {tag.count !== undefined && tag.count > 0 && (
                          <span className="ml-1 text-xs text-gray-500">({tag.count})</span>
                        )}
                        {selectedTags.includes(tag.name) && (
                          <Check className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">Access Limits</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="useLimits"
                    checked={useLimits}
                    onCheckedChange={setUseLimits}
                  />
                  <Label htmlFor="useLimits" className="text-sm">
                    Set access limits
                  </Label>
                </div>
              </div>

              {useLimits && (
                <div className="space-y-4 mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="validSince">Valid Since</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            type="button"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {validSince ? format(validSince, 'PPP') : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={validSince}
                            onSelect={(date) => setValidSince(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            type="button"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {validUntil ? format(validUntil, 'PPP') : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={validUntil}
                            onSelect={(date) => setValidUntil(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxVisits">Maximum Visits</Label>
                    <Input
                      id="maxVisits"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={maxVisits}
                      onChange={(e) => setMaxVisits(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center space-x-2">
              <Checkbox
                id="validateUrl"
                checked={validateUrl}
                onCheckedChange={(checked) => setValidateUrl(checked as boolean)}
              />
              <Label htmlFor="validateUrl">
                Validate URL before shortening
              </Label>
            </div>
          </form>
        )}
      </CardContent>

      {!isSuccess && (
        <CardFooter className="justify-end">
          <Button type="button" variant="outline" className="mr-2" onClick={resetForm}>
            Reset
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !longUrl}
          >
            {isLoading ? 'Creating...' : 'Create Short URL'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
