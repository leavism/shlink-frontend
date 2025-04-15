// lib/api-service.ts
import {
  CreateShortUrlOptions,
  QrCodeOptions,
  ShortUrl,
  ShortUrlsResponse,
  StatsOptions,
  StatsResponse,
  StatsType,
  TagsResponse,
  VisitsOptions,
  VisitsResponse
} from '@/types/api';

/**
 * Base function to call the Shlink API
 */
async function callApi<T>(
  apiUrl: string,
  apiKey: string,
  endpoint: string,
  method: string = 'GET',
  body: unknown = null
): Promise<T> {
  const url = `${apiUrl}/rest/v3/${endpoint}`;

  const headers: HeadersInit = {
    'X-Api-Key': apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const options: RequestInit = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `API request failed with status ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

/**
 * Get list of short URLs with pagination
 */
export async function getShortUrls(
  apiUrl: string,
  apiKey: string,
  page: number = 1,
  itemsPerPage: number = 10,
  searchTerm: string = '',
  tags: string[] = [],
  orderBy: string = 'dateCreated-DESC'
): Promise<ShortUrlsResponse> {
  let endpoint = `short-urls?page=${page}&itemsPerPage=${itemsPerPage}&orderBy=${orderBy}`;

  if (searchTerm) {
    endpoint += `&searchTerm=${encodeURIComponent(searchTerm)}`;
  }

  if (tags && tags.length > 0) {
    endpoint += `&tags[]=${tags.join('&tags[]=')}`;
  }

  return callApi<ShortUrlsResponse>(apiUrl, apiKey, endpoint);
}

/**
 * Create a new short URL
 */
export async function createShortUrl(
  apiUrl: string,
  apiKey: string,
  longUrl: string,
  options: Partial<CreateShortUrlOptions> = {}
): Promise<ShortUrl> {
  const payload: CreateShortUrlOptions = {
    longUrl,
    ...options
  };

  return callApi<ShortUrl>(apiUrl, apiKey, 'short-urls', 'POST', payload);
}

/**
 * Get details for a specific short URL
 */
export async function getShortUrl(
  apiUrl: string,
  apiKey: string,
  shortCode: string,
  domain: string | null = null
): Promise<ShortUrl> {
  let endpoint = `short-urls/${shortCode}`;

  if (domain) {
    endpoint += `?domain=${encodeURIComponent(domain)}`;
  }

  return callApi<ShortUrl>(apiUrl, apiKey, endpoint);
}

/**
 * Update a short URL
 */
export async function updateShortUrl(
  apiUrl: string,
  apiKey: string,
  shortCode: string,
  updates: Partial<CreateShortUrlOptions>,
  domain: string | null = null
): Promise<ShortUrl> {
  let endpoint = `short-urls/${shortCode}`;

  if (domain) {
    endpoint += `?domain=${encodeURIComponent(domain)}`;
  }

  return callApi<ShortUrl>(apiUrl, apiKey, endpoint, 'PATCH', updates);
}

/**
 * Delete a short URL
 */
export async function deleteShortUrl(
  apiUrl: string,
  apiKey: string,
  shortCode: string,
  domain: string | null = null
): Promise<void> {
  let endpoint = `short-urls/${shortCode}`;

  if (domain) {
    endpoint += `?domain=${encodeURIComponent(domain)}`;
  }

  return callApi<void>(apiUrl, apiKey, endpoint, 'DELETE');
}

/**
 * Get visits for a short URL
 */
export async function getVisits(
  apiUrl: string,
  apiKey: string,
  shortCode: string,
  options: VisitsOptions = {}
): Promise<VisitsResponse> {
  const { page = 1, itemsPerPage = 10, startDate, endDate, domain } = options;

  let endpoint = `short-urls/${shortCode}/visits?page=${page}&itemsPerPage=${itemsPerPage}`;

  if (startDate) {
    endpoint += `&startDate=${encodeURIComponent(startDate)}`;
  }

  if (endDate) {
    endpoint += `&endDate=${encodeURIComponent(endDate)}`;
  }

  if (domain) {
    endpoint += `&domain=${encodeURIComponent(domain)}`;
  }

  return callApi<VisitsResponse>(apiUrl, apiKey, endpoint);
}

/**
 * Get visit stats with different type options (total, countries, browsers, etc.)
 */
export async function getVisitStats(
  apiUrl: string,
  apiKey: string,
  type: StatsType = 'countries',
  options: StatsOptions = {}
): Promise<StatsResponse> {
  const { startDate, endDate, domain, excludeBots } = options;

  let endpoint = `visits/stats?type=${type}`;

  if (startDate) {
    endpoint += `&startDate=${encodeURIComponent(startDate)}`;
  }

  if (endDate) {
    endpoint += `&endDate=${encodeURIComponent(endDate)}`;
  }

  if (domain) {
    endpoint += `&domain=${encodeURIComponent(domain)}`;
  }

  if (excludeBots !== undefined) {
    endpoint += `&excludeBots=${excludeBots ? 'true' : 'false'}`;
  }

  return callApi<StatsResponse>(apiUrl, apiKey, endpoint);
}

/**
 * Get all tags
 */
export async function getTags(
  apiUrl: string,
  apiKey: string
): Promise<TagsResponse> {
  return callApi<TagsResponse>(apiUrl, apiKey, 'tags');
}

/**
 * Generate QR code for a short URL
 */
export function getQrCode(
  apiUrl: string,
  apiKey: string,
  shortCode: string,
  options: QrCodeOptions = {}
): string {
  const { size = 300, format = 'png', margin = 0, domain } = options;

  let endpoint = `short-urls/${shortCode}/qr-code?size=${size}&format=${format}&margin=${margin}`;

  if (domain) {
    endpoint += `&domain=${encodeURIComponent(domain)}`;
  }

  // Direct image URL that can be used in img src
  return `${apiUrl}/rest/v3/${endpoint}&apiKey=${apiKey}`;
}

/**
 * Check API health
 */
export async function checkHealth(apiUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/rest/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}
