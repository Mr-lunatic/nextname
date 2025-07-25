import '../styles/globals.css'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { TranslationProvider } from '@/contexts/TranslationContext'
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
  // SEO and Metadata Configuration
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NextName - Find Your Perfect Domain',
    template: '%s | NextName',
  },
  description: 'Fast, comprehensive, and accurate domain search tool. Compare 50+ registrar prices, get real-time WHOIS info, discover hidden domain treasures.',
  
  // Icons
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

  // Open Graph (for social media previews)
  openGraph: {
    title: 'NextName - Find Your Perfect Domain',
    description: 'The ultimate tool for domain discovery and price comparison.',
    url: siteUrl,
    siteName: 'NextName',
    images: [
      {
        url: '/og-image.png', // Recommended: Create and add an Open Graph image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'NextName Logo and a search bar',
      },
    ],
    locale: 'en_US', // Default locale
    type: 'website',
  },

  // Twitter Card (for Twitter previews)
  twitter: {
    card: 'summary_large_image',
    title: 'NextName - Find Your Perfect Domain',
    description: 'Fast, comprehensive, and accurate domain search tool.',
    images: ['/og-image.png'], // Recommended: Use the same OG image
  },

  // Canonical URL
  alternates: {
    canonical: '/',
  },

  // Web App Manifest
  manifest: '/site.webmanifest',
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider initialLocale={locale}>
            {children}
          </TranslationProvider>
        </ThemeProvider>
        <StructuredData />
      </body>
    </html>
  )
}
