// types/api.ts
export interface CreateShortUrlOptions {
  longUrl: string;
  customSlug?: string;
  domain?: string;
  tags?: string[];
  title?: string;
  maxVisits?: number;
  validateUrl?: boolean;
  forwardQuery?: boolean;
  findIfExists?: boolean;
  shortCodeLength?: number;
  validSince?: string;
  validUntil?: string;
  crawlable?: boolean;
}

export interface ShortUrl {
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  dateCreated: string;
  visitsCount: number;
  tags: string[];
  meta: {
    validSince?: string;
    validUntil?: string;
    maxVisits?: number;
    title?: string;
    crawlable?: boolean;
    forwardQuery?: boolean;
  };
  domain?: string;
}

export interface ShortUrlsResponse {
  shortUrls: {
    data: ShortUrl[];
    pagination: Pagination;
  };
}

export interface Pagination {
  currentPage: number;
  pagesCount: number;
  itemsPerPage: number;
  itemsInCurrentPage: number;
  totalItems: number;
}

export interface VisitLocation {
  countryCode: string;
  countryName: string;
  regionName: string;
  cityName: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isEmpty: boolean;
}

export interface Visit {
  referer: string;
  date: string;
  userAgent: string;
  visitLocation: VisitLocation | null;
  potentialBot: boolean;
  visitedUrl: string;
  redirectUrl: string;
}

export interface VisitsResponse {
  visits: {
    data: Visit[];
    pagination: Pagination;
  };
}

export interface VisitsOptions {
  page?: number;
  itemsPerPage?: number;
  startDate?: string;
  endDate?: string;
  domain?: string;
  excludeBots?: boolean;
}

export interface StatsItem {
  name: string;
  count: number;
}

export interface TimeBasedStatsItem {
  date?: string;
  month?: string;
  count: number;
}

export type StatsType = 'countries' | 'cities' | 'browsers' | 'os' | 'referrers' | 'days' | 'months';

export interface StatsOptions {
  startDate?: string;
  endDate?: string;
  domain?: string;
  excludeBots?: boolean;
}

export interface StatsResponse {
  stats: (StatsItem | TimeBasedStatsItem)[];
  total: number;
  nonBots: number;
  bots: number;
}

export interface TagsResponse {
  tags: {
    data: string[];
    stats?: {
      [tag: string]: number;
    };
  };
}
export interface Tag {
  tag: string;
  count: number;
}
export interface QrCodeOptions {
  size?: number;
  format?: 'png' | 'svg';
  margin?: number;
  domain?: string;
}
