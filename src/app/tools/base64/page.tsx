import { Metadata } from 'next'
import Base64ToolClient from './client'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Free Base64 Encoder/Decoder - Online Base64 Converter | NextName',
  description: 'Free online Base64 encoder and decoder. Convert text to Base64 and decode Base64 strings instantly. Privacy-focused tool runs locally in your browser - no data uploaded to servers.',
  keywords: [
    'base64 encoder', 'base64 decoder', 'base64 converter', 'online base64 encoder',
    'free base64 decoder', 'base64 encode decode', 'base64 converter tool',
    'base64 encoding online', 'text to base64', 'base64 to text', 'base64 tool',
    'encode base64 online', 'decode base64 online', 'base64 utility'
  ],
  openGraph: {
    title: 'Free Base64 Encoder/Decoder - Online Base64 Converter',
    description: 'Free online Base64 encoder and decoder. Convert text to Base64 and decode Base64 strings instantly. Privacy-focused tool runs locally in your browser.',
    type: 'website',
    url: 'https://nextname.app/tools/base64',
    images: [
      {
        url: '/og-base64.png',
        width: 1200,
        height: 630,
        alt: 'Base64 Encoder Decoder Tool',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Base64 Encoder/Decoder - Online Base64 Converter',
    description: 'Free online Base64 encoder and decoder running locally for privacy protection.',
    images: ['/og-base64.png'],
  },
  alternates: {
    canonical: '/tools/base64',
  },
}

export default function Base64Page() {
  return <Base64ToolClient />
}
