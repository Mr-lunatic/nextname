// Domain and TLD related types
export interface TldItem {
  tld: string;
  marketShare: number;
  category: 'generic' | 'country-code' | 'sponsored' | 'infrastructure';
  popularity: number;
}

// Search related types
export type SearchType = 'auto' | 'domain' | 'prefix' | 'suffix'

export interface SearchResult {
  domain: string;
  available: boolean;
  price?: number;
  registrar?: string;
  error?: string;
}

// API response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WHOIS data types
export interface WhoisData {
  domain: string;
  registrar: string;
  registrationDate: string;
  expiryDate: string;
  nameServers: string[];
  status: string[];
  dnssec: boolean;
}

// Price comparison types
export interface PriceInfo {
  registrar: string;
  firstYear: number;
  renewal: number;
  transfer: number;
  currency: string;
  specialOffer?: boolean;
  features: string[];
}

// User preferences types
export interface UserPreferences {
  language: 'en' | 'zh-CN';
  currency: string;
  theme: 'light' | 'dark' | 'system';
  preferredSearchType?: SearchType;
}

// Translation types
export interface TranslationFunction {
  (key: string, params?: Record<string, string | number>): string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}
