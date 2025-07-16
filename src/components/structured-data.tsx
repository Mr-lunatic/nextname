import React from 'react';

const siteUrl = 'https://nextname.app';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextName',
  url: siteUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  description: 'AI-powered domain search and price comparison tool.',
  featureList: [
    'Smart Domain Search',
    'Registrar Price Comparison',
    'WHOIS Lookup',
    'AI Recommendations'
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD'
  },
  author: {
    '@type': 'Organization',
    name: 'NextName'
  }
};

export const StructuredData = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
  />
);
