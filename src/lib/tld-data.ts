import { tldCache, CacheKeys } from '@/lib/cache';
import { NextResponse } from 'next/server';

const TLD_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Enhanced TLD data with market share and metadata
export const tldMetadata: { [key: string]: any } = {
  // Major gTLDs
  'com': { marketShare: 47.1, category: 'generic', popularity: 100 },
  'net': { marketShare: 4.2, category: 'generic', popularity: 85 },
  'org': { marketShare: 3.8, category: 'generic', popularity: 80 },
  'info': { marketShare: 1.8, category: 'generic', popularity: 65 },
  'biz': { marketShare: 1.2, category: 'generic', popularity: 60 },
  'name': { marketShare: 0.3, category: 'generic', popularity: 50 },
  'pro': { marketShare: 0.1, category: 'generic', popularity: 40 },
  
  // Popular new gTLDs
  'io': { marketShare: 0.8, category: 'tech', popularity: 90 },
  'ai': { marketShare: 0.3, category: 'tech', popularity: 85 },
  'dev': { marketShare: 0.2, category: 'tech', popularity: 80 },
  'app': { marketShare: 0.15, category: 'tech', popularity: 75 },
  'tech': { marketShare: 0.12, category: 'tech', popularity: 70 },
  'online': { marketShare: 0.1, category: 'generic', popularity: 65 },
  'site': { marketShare: 0.09, category: 'generic', popularity: 60 },
  'website': { marketShare: 0.08, category: 'generic', popularity: 55 },
  
  // Business TLDs
  'co': { marketShare: 0.9, category: 'business', popularity: 75 },
  'shop': { marketShare: 0.15, category: 'business', popularity: 70 },
  'store': { marketShare: 0.12, category: 'business', popularity: 65 },
  'business': { marketShare: 0.04, category: 'business', popularity: 45 },
  'company': { marketShare: 0.05, category: 'business', popularity: 50 },
  'services': { marketShare: 0.03, category: 'business', popularity: 40 },
  
  // Creative TLDs
  'design': { marketShare: 0.05, category: 'creative', popularity: 45 },
  'art': { marketShare: 0.04, category: 'creative', popularity: 40 },
  'studio': { marketShare: 0.06, category: 'creative', popularity: 50 },
  'photography': { marketShare: 0.03, category: 'creative', popularity: 35 },
  
  // Media TLDs
  'blog': { marketShare: 0.12, category: 'media', popularity: 65 },
  'news': { marketShare: 0.1, category: 'media', popularity: 60 },
  'media': { marketShare: 0.08, category: 'media', popularity: 55 },
  'tv': { marketShare: 0.18, category: 'media', popularity: 60 },
  
  // Personal TLDs
  'me': { marketShare: 0.25, category: 'personal', popularity: 70 },
  'cc': { marketShare: 0.2, category: 'personal', popularity: 65 },
  'ly': { marketShare: 0.05, category: 'personal', popularity: 50 },
  'sh': { marketShare: 0.04, category: 'personal', popularity: 45 },
  'gg': { marketShare: 0.03, category: 'gaming', popularity: 55 },
  
  // Country TLDs (major ones)
  'uk': { marketShare: 2.1, category: 'country', popularity: 75 },
  'de': { marketShare: 1.8, category: 'country', popularity: 70 },
  'cn': { marketShare: 1.5, category: 'country', popularity: 65 },
  'nl': { marketShare: 0.8, category: 'country', popularity: 60 },
  'fr': { marketShare: 0.7, category: 'country', popularity: 55 },
  'au': { marketShare: 0.6, category: 'country', popularity: 50 },
  'ca': { marketShare: 0.5, category: 'country', popularity: 45 },
  'jp': { marketShare: 0.4, category: 'country', popularity: 40 },
  'br': { marketShare: 0.3, category: 'country', popularity: 35 },
  'mx': { marketShare: 0.2, category: 'country', popularity: 30 },
  'it': { marketShare: 0.4, category: 'country', popularity: 45 },
  'es': { marketShare: 0.3, category: 'country', popularity: 40 },
  'be': { marketShare: 0.1, category: 'country', popularity: 30 },
  'eu': { marketShare: 0.2, category: 'country', popularity: 35 },
  'kr': { marketShare: 0.15, category: 'country', popularity: 25 },
  'in': { marketShare: 0.25, category: 'country', popularity: 30 },
  'ru': { marketShare: 0.4, category: 'country', popularity: 35 },
  
  // Other popular TLDs
  'xyz': { marketShare: 0.2, category: 'generic', popularity: 60 },
  'top': { marketShare: 0.18, category: 'generic', popularity: 55 },
  'club': { marketShare: 0.15, category: 'community', popularity: 50 },
  'click': { marketShare: 0.02, category: 'generic', popularity: 30 },
  'link': { marketShare: 0.02, category: 'generic', popularity: 25 }
};

// Function to get all supported TLDs from IANA bootstrap
export async function getAllSupportedTLDs() {
  const now = Date.now();
  
  // Return cached data if still valid
  const cachedAllTlds = tldCache.get(CacheKeys.tldList());
  if (cachedAllTlds && (now - cachedAllTlds.timestamp) < TLD_CACHE_DURATION) {
    return cachedAllTlds.tlds;
  }
  
  try {
    // Fetch current IANA bootstrap data with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch('https://data.iana.org/rdap/dns.json', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Domain-Search-Platform/1.0'
      },
      signal: controller.signal,
      cache: 'force-cache' // Explicitly cache this external data
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch IANA bootstrap: ${response.status}`);
    }
    
    const data = await response.json();
    const tlds = new Set<string>();
    
    // Extract TLDs from bootstrap services
    if (data && data.services) {
      for (const service of data.services) {
        const [serviceTlds, servers] = service;
        if (Array.isArray(serviceTlds) && Array.isArray(servers) && servers.length > 0) {
          serviceTlds.forEach(tld => tlds.add(tld.toLowerCase()));
        }
      }
    }
    
    // Convert to sorted array
    const sortedTlds = Array.from(tlds).sort();
    
    // Categorize TLDs with better performance
    const categorized = categorizeRTlds(sortedTlds);
    
    // Cache the results with timestamp
    const responseData = {
      total: sortedTlds.length,
      tlds: sortedTlds,
      categorized: categorized,
      last_updated: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    tldCache.set(CacheKeys.tldList(), responseData, TLD_CACHE_DURATION); // 24 hours
    
    return sortedTlds;
  } catch (error) {
    console.error('Failed to get supported TLDs:', error);
    
    // Try to return any cached data, even if expired
    const expiredCache = tldCache.get(CacheKeys.tldList());
    if (expiredCache) {
      console.log('⚠️ Using expired cache due to fetch error');
      return expiredCache.tlds;
    }
    
    // Return fallback data
    const fallbackTlds = Object.keys(tldMetadata);
    
    return fallbackTlds;
  }
}

// Optimized TLD categorization function
export function categorizeRTlds(tlds: string[]) {
  const categorizedTlds: { [key: string]: string[] } = {
    generic: [],
    country: [],
    tech: [],
    business: [],
    creative: [],
    media: [],
    finance: [],
    health: [],
    education: [],
    travel: [],
    other: []
  };
  
  // Pre-define category maps for better performance
  const categoryMap = {
    generic: new Set(['com', 'net', 'org', 'info', 'biz', 'name', 'pro']),
    tech: new Set(['tech', 'io', 'ai', 'dev', 'app', 'software', 'computer', 'digital']),
    business: new Set(['shop', 'store', 'business', 'company', 'services', 'enterprise']),
    creative: new Set(['design', 'art', 'studio', 'photography', 'creative', 'gallery']),
    media: new Set(['blog', 'news', 'media', 'tv', 'radio', 'video']),
    finance: new Set(['finance', 'money', 'bank', 'insurance', 'investment']),
    health: new Set(['health', 'care', 'medical', 'fitness', 'wellness']),
    education: new Set(['education', 'school', 'academy', 'university']),
    travel: new Set(['travel', 'hotel', 'restaurant', 'tourism'])
  };
  
  tlds.forEach(tld => {
    if (tld.length === 2) {
      categorizedTlds.country.push(tld);
    } else {
      let categorized = false;
      for (const [category, tldSet] of Object.entries(categoryMap)) {
        if (tldSet.has(tld)) {
          categorizedTlds[category].push(tld);
          categorized = true;
          break;
        }
      }
      if (!categorized) {
        categorizedTlds.other.push(tld);
      }
    }
  });
  
  return categorizedTlds;
}
