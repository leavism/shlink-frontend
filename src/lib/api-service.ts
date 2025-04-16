import {
  CreateShortUrlOptions,
  QrCodeOptions,
  ShortUrl,
  ShortUrlsResponse,
  StatsItem,
  StatsOptions,
  StatsResponse,
  StatsType,
  TagsResponse,
  TimeBasedStatsItem,
  Visit,
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
  const { page = 1, itemsPerPage = 10, startDate, endDate, domain, excludeBots } = options;

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

  if (excludeBots !== undefined) {
    endpoint += `&excludeBots=${excludeBots ? 'true' : 'false'}`;
  }

  return callApi<VisitsResponse>(apiUrl, apiKey, endpoint);
}

/**
 * Parse user agent string to extract browser information
 */
function parseBrowser(userAgent: string): string {
  if (!userAgent) return 'Unknown';

  const browserRegexes = [
    { name: 'Firefox', regex: /Firefox\/([0-9.]+)/ },
    { name: 'Chrome', regex: /Chrome\/([0-9.]+)/ },
    { name: 'Safari', regex: /Safari\/([0-9.]+)/ },
    { name: 'Edge', regex: /Edg(e)?\/([0-9.]+)/ },
    { name: 'Internet Explorer', regex: /MSIE|Trident/ }
  ];

  for (const browser of browserRegexes) {
    if (browser.regex.test(userAgent)) {
      return browser.name;
    }
  }

  return 'Unknown';
}

/**
 * Parse user agent string to extract operating system information
 */
function parseOS(userAgent: string): string {
  if (!userAgent) return 'Unknown';

  const osRegexes = [
    { name: 'Windows', regex: /Windows NT/ },
    { name: 'macOS', regex: /Mac OS X/ },
    { name: 'iOS', regex: /iPhone|iPad|iPod/ },
    { name: 'Android', regex: /Android/ },
    { name: 'Linux', regex: /Linux/ }
  ];

  for (const os of osRegexes) {
    if (os.regex.test(userAgent)) {
      return os.name;
    }
  }

  return 'Unknown';
}

/**
 * Fetch all visits for a short URL (handling pagination)
 */
async function getAllVisits(
  apiUrl: string,
  apiKey: string,
  shortCode: string,
  options: VisitsOptions = {}
): Promise<Visit[]> {
  const { itemsPerPage = 100, ...otherOptions } = options;
  let allVisits: Visit[] = [];
  let currentPage = 1;
  let totalPages = 1;

  do {
    const response = await getVisits(apiUrl, apiKey, shortCode, {
      ...otherOptions,
      itemsPerPage,
      page: currentPage
    });

    allVisits = [...allVisits, ...response.visits.data];
    totalPages = response.visits.pagination.pagesCount;
    currentPage++;
  } while (currentPage <= totalPages);

  return allVisits;
}

/**
 * Process visits data into statistics
 */
function processVisitsToStats(
  visits: Visit[],
  type: StatsType,
  excludeBots: boolean = false
): StatsResponse {
  const filteredVisits = excludeBots
    ? visits.filter(visit => !visit.potentialBot)
    : visits;

  let stats: (StatsItem | TimeBasedStatsItem)[] = [];
  const total = visits.length;
  const nonBots = visits.filter(visit => !visit.potentialBot).length;
  const bots = visits.filter(visit => visit.potentialBot).length;

  switch (type) {
    case 'countries': {
      // Group visits by country
      const countryMap = new Map<string, number>();

      filteredVisits.forEach(visit => {
        const country = visit.visitLocation?.countryName || 'Unknown';
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });

      stats = Array.from(countryMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      break;
    }

    case 'cities': {
      // Group visits by city
      const cityMap = new Map<string, number>();

      filteredVisits.forEach(visit => {
        const city = visit.visitLocation?.cityName || 'Unknown';
        cityMap.set(city, (cityMap.get(city) || 0) + 1);
      });

      stats = Array.from(cityMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      break;
    }

    case 'browsers': {
      // Group visits by browser
      const browserMap = new Map<string, number>();

      filteredVisits.forEach(visit => {
        const browser = parseBrowser(visit.userAgent || '');
        browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
      });

      stats = Array.from(browserMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      break;
    }

    case 'os': {
      // Group visits by operating system
      const osMap = new Map<string, number>();

      filteredVisits.forEach(visit => {
        const os = parseOS(visit.userAgent || '');
        osMap.set(os, (osMap.get(os) || 0) + 1);
      });

      stats = Array.from(osMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      break;
    }

    case 'referrers': {
      // Group visits by referrer
      const referrerMap = new Map<string, number>();

      filteredVisits.forEach(visit => {
        const referrer = visit.referer || 'Direct / Unknown';
        referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);
      });

      stats = Array.from(referrerMap.entries()).map(([name, count]) => ({
        name,
        count
      }));
      break;
    }

    case 'days': {
      // Group visits by day
      const dayMap = new Map<string, number>();

      filteredVisits.forEach(visit => {
        // Format date as YYYY-MM-DD
        const date = visit.date ? new Date(visit.date).toISOString().split('T')[0] : 'Unknown';
        dayMap.set(date, (dayMap.get(date) || 0) + 1);
      });

      // Sort days chronologically
      const sortedDays = Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));

      stats = sortedDays.map(([date, count]) => ({
        date,
        count
      }));
      break;
    }

    case 'months': {
      // Group visits by month
      const monthMap = new Map<string, number>();

      filteredVisits.forEach(visit => {
        // Format date as YYYY-MM
        const date = visit.date ?
          new Date(visit.date).toISOString().substring(0, 7) : 'Unknown';
        monthMap.set(date, (monthMap.get(date) || 0) + 1);
      });

      // Sort months chronologically
      const sortedMonths = Array.from(monthMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]));

      stats = sortedMonths.map(([month, count]) => ({
        month,
        count
      }));
      break;
    }
  }

  return {
    stats,
    total,
    nonBots,
    bots
  };
}

/**
 * Get visit stats with different type options (total, countries, browsers, etc.)
 * by processing raw visit data
 */
export async function getVisitStats(
  apiUrl: string,
  apiKey: string,
  shortCode: string,
  type: StatsType = 'countries',
  options: StatsOptions = {}
): Promise<StatsResponse> {
  // Fetch all visits across all pages
  const visits = await getAllVisits(apiUrl, apiKey, shortCode, options);

  // Process the visits into stats based on the type
  return processVisitsToStats(visits, type, options.excludeBots);
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
  shortCode: string,
  options: QrCodeOptions = {}
): string {
  const { size = 300, format = 'png', margin = 0, domain } = options;

  let endpoint = `${shortCode}/qr-code?size=${size}&format=${format}&margin=${margin}`;

  if (domain) {
    endpoint += `&domain=${encodeURIComponent(domain)}`;
  }

  // Direct image URL that can be used in img src
  return `${apiUrl}/${endpoint}`;
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
