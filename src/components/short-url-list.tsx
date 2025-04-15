// components/short-url-list.tsx
"use client";

import { useState, useEffect, FC } from 'react';
import {
  BarChart as BarChartIcon,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  QrCode,
  SearchIcon,
  Trash
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { getShortUrls, deleteShortUrl, getVisits, getQrCode, updateShortUrl } from '@/lib/api-service';
import { ShortUrl, Visit } from '@/types/api';

interface QrCodeDialogProps {
  shortUrl: ShortUrl | null;
  apiUrl: string;
  apiKey: string;
  isOpen: boolean;
  onClose: () => void;
}

// QR Code Dialog component
const QrCodeDialog: FC<QrCodeDialogProps> = ({ shortUrl, apiUrl, apiKey, isOpen, onClose }) => {
  const [size, setSize] = useState<number>(300);

  if (!shortUrl) return null;

  const qrCodeUrl = getQrCode(apiUrl, apiKey, shortUrl.shortCode, {
    size,
    domain: shortUrl.domain || undefined
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>QR Code for {shortUrl.shortUrl}</DialogTitle>
          <DialogDescription>
            Scan this QR code to access the shortened URL
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <img
            src={qrCodeUrl}
            alt={`QR Code for ${shortUrl.shortUrl}`}
            className="mb-4 border border-gray-200 rounded-lg"
          />

          <div className="w-full flex items-center space-x-4">
            <Label htmlFor="qr-size" className="min-w-20">Size (px):</Label>
            <Input
              id="qr-size"
              type="number"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              min="100"
              max="1000"
              step="50"
              className="w-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button asChild variant="outline">
            <a href={qrCodeUrl} download={`qrcode-${shortUrl.shortCode}.png`}>
              Download
            </a>
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface UrlDetailsDialogProps {
  shortUrl: ShortUrl | null;
  apiUrl: string;
  apiKey: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

// URL Details Dialog component
const UrlDetailsDialog: FC<UrlDetailsDialogProps> = ({
  shortUrl,
  apiUrl,
  apiKey,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>(shortUrl?.tags || []);
  const [newTag, setNewTag] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('details');

  useEffect(() => {
    if (isOpen && shortUrl && activeTab === 'visits') {
      loadVisits();
    }
  }, [isOpen, shortUrl, activeTab]);

  useEffect(() => {
    if (shortUrl) {
      setTags(shortUrl.tags || []);
    }
  }, [shortUrl]);

  const loadVisits = async () => {
    if (!shortUrl) return;

    setIsLoading(true);
    try {
      const result = await getVisits(apiUrl, apiKey, shortUrl.shortCode, {
        domain: shortUrl.domain || undefined,
        itemsPerPage: 50
      });
      setVisits(result.visits.data);
    } catch (error) {
      console.error('Failed to load visits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim() || !shortUrl) return;

    const newTags = [...tags, newTag.trim()];
    setTags(newTags);
    setNewTag('');

    try {
      await updateShortUrl(apiUrl, apiKey, shortUrl.shortCode, {
        tags: newTags
      }, shortUrl.domain || undefined);

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!shortUrl) return;

    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);

    try {
      await updateShortUrl(apiUrl, apiKey, shortUrl.shortCode, {
        tags: newTags
      }, shortUrl.domain || undefined);

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update tags:', error);
    }
  };

  if (!shortUrl) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Short URL Details</DialogTitle>
          <DialogDescription>
            Details and statistics for <span className="font-mono">{shortUrl.shortUrl}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="visits">Visits</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Short URL</Label>
                  <div className="flex items-center mt-1">
                    <span className="font-mono">{shortUrl.shortUrl}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-2"
                            onClick={() => navigator.clipboard.writeText(shortUrl.shortUrl)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy URL</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Target URL</Label>
                  <div className="flex items-center mt-1">
                    <span className="font-mono truncate max-w-[200px]">{shortUrl.longUrl}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-2"
                            onClick={() => window.open(shortUrl.longUrl, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Open URL</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="mt-1">{formatDate(shortUrl.dateCreated)}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Visits</Label>
                  <p className="mt-1">{shortUrl.visitsCount}</p>
                </div>
              </div>

              {shortUrl.meta && (
                <div className="grid grid-cols-2 gap-4">
                  {shortUrl.meta.validSince && (
                    <div>
                      <Label className="text-sm font-medium">Valid Since</Label>
                      <p className="mt-1">{formatDate(shortUrl.meta.validSince)}</p>
                    </div>
                  )}

                  {shortUrl.meta.validUntil && (
                    <div>
                      <Label className="text-sm font-medium">Valid Until</Label>
                      <p className="mt-1">{formatDate(shortUrl.meta.validUntil)}</p>
                    </div>
                  )}

                  {shortUrl.meta.maxVisits && (
                    <div>
                      <Label className="text-sm font-medium">Max Visits</Label>
                      <p className="mt-1">{shortUrl.meta.maxVisits}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {shortUrl.tags.length > 0 ? (
                    shortUrl.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="visits">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : visits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>OS</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Referrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{formatDate(visit.date)}</TableCell>
                      <TableCell>{visit.browser || 'Unknown'}</TableCell>
                      <TableCell>{visit.os || 'Unknown'}</TableCell>
                      <TableCell>
                        {visit.visitLocation ? (
                          `${visit.visitLocation.countryName || ''} ${visit.visitLocation.cityName || ''}`
                        ) : (
                          'Unknown'
                        )}
                      </TableCell>
                      <TableCell className="truncate max-w-[200px]">
                        {visit.referer || 'Direct'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-gray-500">No visits recorded yet</p>
            )}
          </TabsContent>

          <TabsContent value="tags">
            <div className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="new-tag">Add new tag</Label>
                  <Input
                    id="new-tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Enter tag name..."
                  />
                </div>
                <Button onClick={handleAddTag}>Add</Button>
              </div>

              <div>
                <Label className="text-sm font-medium">Current Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-2 py-1 flex items-center">
                        {tag}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ShortUrlListProps {
  apiUrl: string;
  apiKey: string;
}

// Main ShortUrlList component
export const ShortUrlList: FC<ShortUrlListProps> = ({ apiUrl, apiKey }) => {
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedUrl, setSelectedUrl] = useState<ShortUrl | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState<boolean>(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [selectedUrlForDelete, setSelectedUrlForDelete] = useState<ShortUrl | null>(null);

  useEffect(() => {
    loadShortUrls();
  }, [apiUrl, apiKey, page, itemsPerPage]);

  const loadShortUrls = async () => {
    if (!apiUrl || !apiKey) return;

    setIsLoading(true);
    try {
      const result = await getShortUrls(
        apiUrl,
        apiKey,
        page,
        itemsPerPage,
        searchTerm
      );

      setShortUrls(result.shortUrls.data || []);
      setTotalPages(Math.ceil(result.shortUrls.pagination.totalItems / itemsPerPage));
    } catch (error) {
      console.error('Failed to load short URLs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadShortUrls();
  };

  const handleDelete = async () => {
    if (!selectedUrlForDelete) return;

    try {
      await deleteShortUrl(
        apiUrl,
        apiKey,
        selectedUrlForDelete.shortCode,
        selectedUrlForDelete.domain || undefined
      );

      // Refresh the list
      loadShortUrls();

      setSelectedUrlForDelete(null);
    } catch (error) {
      console.error('Failed to delete short URL:', error);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    // Add toast notification here if needed
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Short URLs</CardTitle>
          <CardDescription>Manage all your shortened URLs</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <Input
              placeholder="Search by URL or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : shortUrls.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Short URL</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shortUrls.map((url) => (
                    <TableRow key={`${url.domain || 'default'}-${url.shortCode}`}>
                      <TableCell className="font-mono">{url.shortUrl}</TableCell>
                      <TableCell>{formatDate(url.dateCreated)}</TableCell>
                      <TableCell>{url.visitsCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {url.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {url.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{url.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCopyUrl(url.shortUrl)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy URL</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUrl(url);
                                    setIsQrDialogOpen(true);
                                  }}
                                >
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>QR Code</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUrl(url);
                                    setIsDetailsDialogOpen(true);
                                  }}
                                >
                                  <BarChartIcon className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Analytics</TooltipContent>
                            </Tooltip>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => setSelectedUrlForDelete(url)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Short URL</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this short URL? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setSelectedUrlForDelete(null)}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete} className="bg-red-600">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <LinkIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-4 text-lg font-medium">No short URLs found</h3>
              <p className="text-gray-500 mt-2">
                Create your first short URL to get started
              </p>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter>
            <Pagination className="w-full justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => page > 1 ? setPage(page - 1) : undefined}
                    className={page === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = page > 3 ? page - 3 + i + 1 : i + 1;
                  if (pageNumber <= totalPages) {
                    return (
                      <PaginationItem key={pageNumber}>
                        <PaginationLink
                          onClick={() => setPage(pageNumber)}
                          isActive={page === pageNumber}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => page < totalPages ? setPage(page + 1) : undefined}
                    className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>

      {/* QR Code Dialog */}
      <QrCodeDialog
        shortUrl={selectedUrl}
        apiUrl={apiUrl}
        apiKey={apiKey}
        isOpen={isQrDialogOpen}
        onClose={() => setIsQrDialogOpen(false)}
      />

      {/* URL Details Dialog */}
      <UrlDetailsDialog
        shortUrl={selectedUrl}
        apiUrl={apiUrl}
        apiKey={apiKey}
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        onUpdate={loadShortUrls}
      />
    </>
  );
};
