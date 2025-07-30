import { Metadata } from 'next'
import TLDsPageClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Complete TLD List - All Domain Extensions & Prices | NextName',
  description: 'Browse all available domain extensions (TLDs): .com, .net, .org, country codes, and new gTLDs with real-time pricing from 50+ registrars. Find the perfect domain extension for your project.',
  keywords: [
    'tld list', 'domain extensions', 'top level domains', 'all domain extensions',
    'new tld domains', 'domain suffix list', 'gtld vs cctld', 'domain extension meanings',
    'domain extension prices', 'tld comparison', 'domain suffix guide', 'tld registry',
    'generic tld', 'country code domains', 'new gtld list', 'domain extension search'
  ],
  openGraph: {
    title: 'Complete TLD List - All Domain Extensions & Prices',
    description: 'Browse all available domain extensions (TLDs): .com, .net, .org, country codes, and new gTLDs with real-time pricing from 50+ registrars.',
    type: 'website',
    url: 'https://nextname.app/tlds',
    images: [
      {
        url: '/og-tlds.png',
        width: 1200,
        height: 630,
        alt: 'Complete TLD List - Domain Extensions Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Complete TLD List - All Domain Extensions & Prices',
    description: 'Browse all available domain extensions (TLDs) with real-time pricing from 50+ registrars.',
    images: ['/og-tlds.png'],
  },
  alternates: {
    canonical: '/tlds',
  },
}

export default function TLDsPage() {
  return <TLDsPageClient />
}
