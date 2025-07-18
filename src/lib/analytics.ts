// Google Analytics utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  }
};

// Track events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Track domain searches
export const trackDomainSearch = (query: string, type: string) => {
  event({
    action: 'search',
    category: 'domain',
    label: `${type}:${query}`,
  });
};

// Track WHOIS queries
export const trackWhoisQuery = (domain: string) => {
  event({
    action: 'whois_query',
    category: 'domain',
    label: domain,
  });
};

// Track price comparisons
export const trackPriceComparison = (domain: string) => {
  event({
    action: 'price_comparison',
    category: 'domain',
    label: domain,
  });
};
