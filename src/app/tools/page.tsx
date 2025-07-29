import { Metadata } from 'next'
import dynamic from 'next/dynamic'

// 动态导入客户端组件，启用代码分割
const ToolsPageClient = dynamic(() => import('./client-optimized'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
})

export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Free Developer Tools - Online Utilities & Converters | NextName',
  description: 'Free collection of developer tools: Base64 encoder, JSON formatter, QR code generator, password generator, hash generator, and more. All tools run locally for privacy protection.',
  keywords: [
    'developer tools online', 'web development tools', 'online utilities', 'free developer tools',
    'base64 encoder decoder', 'json formatter online', 'qr code generator', 'password generator',
    'hash generator online', 'uuid generator', 'jwt decoder', 'regex tester', 'url encoder',
    'timestamp converter', 'color converter', 'text diff tool', 'cron expression generator'
  ],
  openGraph: {
    title: 'Free Developer Tools - Online Utilities & Converters',
    description: 'Free collection of developer tools: Base64 encoder, JSON formatter, QR code generator, and more. All tools run locally for privacy protection.',
    type: 'website',
    url: 'https://nextname.app/tools',
    images: [
      {
        url: '/og-tools.png',
        width: 1200,
        height: 630,
        alt: 'Free Developer Tools Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Developer Tools - Online Utilities & Converters',
    description: 'Free collection of developer tools running locally for privacy protection.',
    images: ['/og-tools.png'],
  },
  alternates: {
    canonical: '/tools',
  },
}

export default function ToolsPage() {
  return <ToolsPageClient />
}
