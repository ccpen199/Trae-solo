import { useLocation } from 'react-router-dom'
import { Users, Package, AlertTriangle, User } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/': '数据概览',
  '/riders': '骑手管理',
  '/orders': '订单调度',
  '/grids': '运力网格',
  '/training': '培训管理',
  '/monitoring': '履约监控',
  '/analytics': '数据分析',
}

export default function Navbar() {
  const location = useLocation()
  const { overview } = useAppStore()

  const currentPath = Object.keys(pageTitles).find(
    (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )
  const pageTitle = pageTitles[currentPath || '/'] || '数据概览'

  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center">
      <div className="ml-64">
        <h2 className="text-xl font-semibold text-gray-900">{pageTitle}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">
            在线骑手: {overview?.riders.online ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full">
          <Package className="h-4 w-4" />
          <span className="text-sm font-medium">
            待处理: {overview?.orders.pending ?? 0}
          </span>
        </div>
        <div className="relative flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">
            告警: {overview?.alerts.active ?? 0}
          </span>
          {(overview?.alerts.active ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="ml-2 flex items-center gap-2">
          <div className={cn(
            'flex items-center justify-center h-9 w-9 rounded-full bg-gray-200 text-gray-600'
          )}>
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  )
}
