import '../styles/globals.css'
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { TranslationProvider } from '@/contexts/TranslationContext'

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

export const metadata = {
  title: 'NextName - Find Your Perfect Domain',
  description: 'Fast, comprehensive, and accurate domain search tool. Compare 50+ registrar prices, get real-time WHOIS info, discover hidden domain treasures.',
  icons: {
    icon: '/favicon.svg',
  },
}

export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TranslationProvider>
            {children}
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}