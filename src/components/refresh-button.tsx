'use client'

import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

export function RefreshButton() {
  return (
    <Button 
      onClick={() => window.location.reload()} 
      className="mr-4"
      size="lg"
    >
      <RotateCcw className="w-4 h-4 mr-2" />
      重试连接
    </Button>
  )
}