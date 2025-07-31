import { ReactNode } from 'react'

// Configure Edge Runtime for Cloudflare Pages
export const runtime = 'edge'

interface SearchLayoutProps {
  children: ReactNode
}

export default function SearchLayout({ children }: SearchLayoutProps) {
  return children
}
