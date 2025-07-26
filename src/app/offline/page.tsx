import { Metadata } from 'next'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WifiOff, RotateCcw, Home, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: '离线模式 - NextName',
  description: '您当前处于离线状态，部分功能可能无法使用。',
  robots: {
    index: false,
    follow: false,
  },
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <div className="container mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
            <WifiOff className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            您当前处于离线状态
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            网络连接似乎出现了问题。不过，您仍然可以使用部分已缓存的功能。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                可用功能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• 浏览已缓存的域名信息</li>
                <li>• 使用开发者工具（本地运行）</li>
                <li>• 查看TLD列表</li>
                <li>• 访问帮助页面</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <WifiOff className="w-5 h-5 mr-2" />
                需要网络的功能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li>• 实时域名搜索</li>
                <li>• 价格比较</li>
                <li>• WHOIS查询</li>
                <li>• 最新数据更新</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center space-y-4">
          <Button 
            onClick={() => window.location.reload()} 
            className="mr-4"
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重试连接
          </Button>
          
          <Link href="/">
            <Button variant="outline" size="lg">
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </Link>
        </div>

        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">💡 提示</h3>
          <p className="text-gray-600 dark:text-gray-300">
            NextName 支持离线缓存，部分内容会自动保存在您的设备上。
            当网络恢复时，我们会自动同步最新数据。
          </p>
        </div>
      </div>
    </div>
  )
}