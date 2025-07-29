import { getAllSupportedTLDs } from '@/lib/tld-data';
import { TldItem } from '@/types';
import HomePageContent from '@/components/home-page-content';
import { Metadata } from 'next';

export const runtime = 'edge'; // Keep runtime for edge compatibility

// 首页专门的SEO优化配置
export const metadata: Metadata = {
  title: 'Domain Search & WHOIS Lookup - Find Your Perfect Domain | NextName',
  description: 'Search domain availability instantly with our AI-powered tool. Compare prices from 50+ registrars, get WHOIS data, and discover your perfect domain name. Free domain checker with comprehensive TLD explorer.',
  keywords: [
    'domain search', 'domain availability checker', 'whois lookup', 'domain name generator',
    'domain price comparison', 'free domain search', 'domain registrar comparison',
    'ai domain suggestions', 'domain availability', 'instant domain lookup',
    'domain checker tool', 'tld explorer', 'domain research', 'domain finder'
  ],
  openGraph: {
    title: 'Domain Search & WHOIS Lookup - Find Your Perfect Domain',
    description: 'Search domain availability instantly with our AI-powered tool. Compare prices from 50+ registrars and get comprehensive WHOIS data.',
    type: 'website',
    url: 'https://nextname.app',
    images: [
      {
        url: '/og-homepage.png',
        width: 1200,
        height: 630,
        alt: 'NextName - AI-Powered Domain Search Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Domain Search & WHOIS Lookup - Find Your Perfect Domain',
    description: 'Search domain availability instantly with our AI-powered tool. Compare prices from 50+ registrars.',
    images: ['/og-homepage.png'],
  },
  alternates: {
    canonical: '/',
  },
}

export default async function Page() {
  const allTlds = await getAllSupportedTLDs();
  
  // Real pricing data for popular TLDs
  const tldPrices: { [key: string]: string } = {
    '.com': '$7.49',
    '.net': '$7.64', 
    '.org': '$5.62',
    '.cn': '¥25',
    '.io': '$9.99',
    '.ai': '$68.98'
  };
  
  const popularTLDs = allTlds.map((item: TldItem) => ({ 
    name: item.tld, 
    price: tldPrices[item.tld] || '$12.99' // Default fallback for other TLDs
  }));

  return <HomePageContent popularTLDs={popularTLDs} />;
}