import { NextNameLogo } from '@/components/logo'
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <NextNameLogo className="text-foreground" />
            </div>
          </div>
        </div>
      </header>

      {/* Loading Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          {/* Loading Spinner */}
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          
          {/* Loading Text */}
          <div className="space-y-2">
            <h2 className="text-lg font-medium text-foreground">
              正在加载...
            </h2>
            <p className="text-sm text-muted-foreground">
              请稍候，页面正在准备中
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 NextName. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
