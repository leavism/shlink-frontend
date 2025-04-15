// types/api.ts

/**
 * Common pagination interface for API responses
 */
export interface Pagination {
  currentPage: number;
  pagesCount: number;
  itemsPerPage: number;
  itemsInCurrentPage: number;
  totalItems: number;
}

/**
 * Paginated API response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Short URL metadata
 */
export interface ShortUrlMeta {
  validSince: string | null;
  validUntil: string | null;
  maxVisits: number | null;
}

/**
 * Short URL model
 */
export interface ShortUrl {
  shortCode: string;
  shortUrl: string;
  longUrl: string;
  dateCreated: string;
  visitsCount: number;
  tags: string[];
  domain: string | null;
  meta: ShortUrlMeta;
  title?: string;
  hasRedirectRules?: boolean;
}

/**
 * Short URLs list response
 */
export interface ShortUrlsResponse {
  shortUrls: PaginatedResponse<ShortUrl>;
}

/**
 * Options for creating a new short URL
 */
export interface CreateShortUrlOptions {
  longUrl: string;
  tags?: string[];
  validSince?: string;
  validUntil?: string;
  customSlug?: string;
  maxVisits?: number;
  findIfExists?: boolean;
  domain?: string;
  shortCodeLength?: number;
  validateUrl?: boolean;
  title?: string;
}

/**
 * Visit location information
 */
export interface VisitLocation {
  cityName: string | null;
  countryCode: string | null;
  countryName: string | null;
  regionName: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Visit data model
 */
export interface Visit {
  id: string;
  referer: string | null;
  date: string;
  userAgent: string | null;
  visitLocation: VisitLocation | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  device?: string | null;
  potentialBot: boolean;
}

/**
 * Visits response
 */
export interface VisitsResponse {
  visits: PaginatedResponse<Visit>;
}

/**
 * Stats item for visualization
 */
export interface StatsItem {
  name: string;
  count: number;
}

/**
 * Time-based stats item
 */
export interface TimeBasedStatsItem {
  date?: string;
  month?: string;
  count: number;
}

/**
 * Stats summary counts
 */
export interface StatsSummary {
  total: number;
  nonBots: number;
  bots: number;
}

/**
 * Stats types supported by the API
 */
export type StatsType = 'countries' | 'cities' | 'browsers' | 'os' | 'referrers' | 'days' | 'months';

/**
 * Stats response based on type
 */
export interface StatsResponse extends StatsSummary {
  stats: Array<StatsItem | TimeBasedStatsItem>;
}

/**
 * Tag with usage count
 */
export interface Tag {
  tag: string;
  count: number;
}

/**
 * Tags response
 */
export interface TagsResponse {
  tags: PaginatedResponse<Tag>;
}

/**
 * Options for fetching visits
 */
export interface VisitsOptions {
  page?: number;
  itemsPerPage?: number;
  startDate?: string;
  endDate?: string;
  domain?: string;
  excludeBots?: boolean;
}

/**
 * Options for fetching stats
 */
export interface StatsOptions {
  startDate?: string;
  endDate?: string;
  domain?: string;
  excludeBots?: boolean;
}

/**
 * Options for generating QR codes
 */
export interface QrCodeOptions {
  size?: number;
  format?: 'png' | 'svg';
  margin?: number;
  domain?: string;
  color?: string;
  backgroundColor?: string;
  logo?: string;
}
