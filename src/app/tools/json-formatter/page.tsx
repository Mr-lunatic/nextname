import { Metadata } from 'next'
import JsonFormatterClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'JSON Formatter & Validator - Online JSON Beautifier Tool | NextName',
  description: 'Free online JSON formatter, validator and beautifier. Format, validate, minify and prettify JSON data instantly. Privacy-focused tool runs locally in your browser.',
  keywords: [
    'json formatter', 'json validator', 'json beautifier', 'online json formatter',
    'json pretty print', 'json minifier', 'json parser', 'json viewer',
    'format json online', 'validate json online', 'json syntax checker',
    'json tool', 'json editor', 'json lint', 'json prettifier'
  ],
  openGraph: {
    title: 'JSON Formatter & Validator - Online JSON Beautifier Tool',
    description: 'Free online JSON formatter, validator and beautifier. Format, validate, minify and prettify JSON data instantly.',
    type: 'website',
    url: 'https://nextname.app/tools/json-formatter',
    images: [
      {
        url: '/og-json-formatter.png',
        width: 1200,
        height: 630,
        alt: 'JSON Formatter and Validator Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter & Validator - Online JSON Beautifier Tool',
    description: 'Free online JSON formatter and validator running locally for privacy protection.',
    images: ['/og-json-formatter.png'],
  },
  alternates: {
    canonical: '/tools/json-formatter',
  },
}

export default function JsonFormatterPage() {
  return <JsonFormatterClient />
}
