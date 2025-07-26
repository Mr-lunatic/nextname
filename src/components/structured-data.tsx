import React from 'react';

const siteUrl = 'https://nextname.app';

// 主要的 WebApplication 结构化数据
const webApplicationData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextName',
  alternateName: 'NextName - Domain Search Tool',
  url: siteUrl,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  description: 'AI-powered domain search and price comparison tool with comprehensive WHOIS lookup and registrar price comparison.',
  featureList: [
    'Smart Domain Search',
    'Registrar Price Comparison', 
    'WHOIS Lookup',
    'AI Domain Recommendations',
    'TLD Explorer',
    'Developer Tools'
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock'
  },
  author: {
    '@type': 'Organization',
    name: 'NextName',
    url: siteUrl
  },
  publisher: {
    '@type': 'Organization',
    name: 'NextName',
    url: siteUrl
  },
  datePublished: '2025-01-01',
  dateModified: new Date().toISOString().split('T')[0],
  inLanguage: ['en', 'zh-CN'],
  isAccessibleForFree: true,
  browserRequirements: 'Requires JavaScript. Supports Chrome 90+, Firefox 88+, Safari 14+, Edge 90+',
  screenshot: `${siteUrl}/og-image.png`,
  softwareVersion: '1.0.0',
  applicationSubCategory: 'Domain Tools'
};

// WebSite 结构化数据
const webSiteData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'NextName',
  url: siteUrl,
  description: 'Find your perfect domain with AI-powered search and comprehensive price comparison.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${siteUrl}/search?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  },
  publisher: {
    '@type': 'Organization',
    name: 'NextName',
    url: siteUrl
  },
  copyrightYear: new Date().getFullYear(),
  inLanguage: ['en', 'zh-CN']
};

// Organization 结构化数据
const organizationData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'NextName',
  url: siteUrl,
  description: 'Leading domain search and analysis platform',
  foundingDate: '2025',
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    url: `${siteUrl}/about`
  },
  sameAs: []
};

// SoftwareApplication 结构化数据（针对工具页面）
const softwareApplicationData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'NextName Developer Tools',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web Browser',
  description: 'Comprehensive suite of developer tools including Base64 converter, JSON formatter, hash generators, and more.',
  url: `${siteUrl}/tools`,
  featureList: [
    'Base64 Encoder/Decoder',
    'JSON Formatter',
    'Hash Generators (MD5, SHA1, SHA256)',
    'Password Generator',
    'UUID Generator',
    'QR Code Generator',
    'Color Converter',
    'Text Diff Tool',
    'Regex Tester',
    'Timestamp Converter'
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock'
  },
  isAccessibleForFree: true,
  browserRequirements: 'Modern web browser with JavaScript enabled'
};

// 合并所有结构化数据
const combinedStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    webApplicationData,
    webSiteData,
    organizationData,
    softwareApplicationData
  ]
};

export const StructuredData = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedStructuredData) }}
  />
);
