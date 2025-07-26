import '../styles/globals.css'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { TranslationProvider } from '@/contexts/TranslationContext'
import { ServiceWorkerProvider } from '@/components/service-worker-provider'
import { PerformanceMonitor } from '@/components/performance-monitor'
import { ErrorBoundary } from '@/components/error-boundary'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { getLocale } from '@/lib/getLocale'
import { StructuredData } from '@/components/structured-data'
import Script from 'next/script'
import type { Metadata } from 'next'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap'
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap'
})

// Base URL for your production site
const siteUrl = 'https://nextname.app';

export const metadata: Metadata = {
  // SEO and Metadata Configuration - Enhanced
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NextName - AI-Powered Domain Search & Price Comparison',
    template: '%s | NextName - Find Your Perfect Domain',
  },
  description: 'Discover the perfect domain with NextName\'s AI-powered search engine. Compare prices from 50+ registrars, get instant WHOIS data, explore 1000+ TLDs, and access developer tools. Fast, comprehensive, and accurate domain research platform.',
  
  // Enhanced Keywords
  keywords: [
    'domain search', 'domain name', 'domain registrar', 'domain price comparison',
    'WHOIS lookup', 'TLD explorer', 'domain availability', 'domain checker',
    'AI domain suggestions', 'domain tools', 'developer tools', 'domain research',
    'cheap domains', 'domain registration', 'domain marketplace'
  ],
  
  // Authors and Publishers
  authors: [{ name: 'NextName Team', url: siteUrl }],
  creator: 'NextName',
  publisher: 'NextName',
  
  // Geographic and Language
  alternates: {
    canonical: '/',
    languages: {
      'en': '/',
      'zh-CN': '/?lang=zh-CN'
    }
  },
  
  // Category and Classification
  category: 'Technology',
  classification: 'Domain Tools',
  
  // Enhanced Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },

  // Enhanced Open Graph
  openGraph: {
    title: 'NextName - AI-Powered Domain Search & Price Comparison',
    description: 'Discover the perfect domain with AI-powered search. Compare prices from 50+ registrars, get instant WHOIS data, explore 1000+ TLDs.',
    url: siteUrl,
    siteName: 'NextName',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NextName - Domain Search Platform',
        type: 'image/png',
      },
      {
        url: '/og-image-square.png', // 正方形版本
        width: 1200,
        height: 1200,
        alt: 'NextName Logo',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    alternateLocale: ['zh_CN'],
    type: 'website',
    countryName: 'United States',
  },

  // Enhanced Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'NextName - AI-Powered Domain Search & Price Comparison',
    description: 'Discover the perfect domain with AI-powered search. Compare prices from 50+ registrars instantly.',
    images: ['/og-image.png'],
    creator: '@NextNameApp', // 如果有Twitter账号
    site: '@NextNameApp',
  },

  // App-specific metadata
  applicationName: 'NextName',
  appleWebApp: {
    capable: true,
    title: 'NextName',
    statusBarStyle: 'default',
  },
  
  // Verification tags (需要时添加)
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },

  // Robots configuration
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Web App Manifest
  manifest: '/site.webmanifest',
  
  // Additional metadata
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#0080FF',
    'color-scheme': 'light dark',
    'format-detection': 'telephone=no',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Dynamically get the locale for the html lang attribute
  const locale = getLocale();

  return (
    <html lang={locale} suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_title: document.title,
                  page_location: window.location.href
                });
              `}
            </Script>
          </>
        )}
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ServiceWorkerProvider>
              <TranslationProvider initialLocale={locale}>
                {children}
                <PerformanceMonitor />
                <PWAInstallPrompt />
              </TranslationProvider>
            </ServiceWorkerProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <StructuredData />
      </body>
    </html>
  )
}
