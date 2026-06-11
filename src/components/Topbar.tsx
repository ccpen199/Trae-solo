import { useAppStore } from '@/store/useAppStore'
import { useLocation } from 'react-router-dom'
import { Bell, Search, Menu, ChevronRight } from 'lucide-react'

const pageTitles: Record<string, string> = {
  '/': '首页概览',
  '/exhibition': '展业空间',
  '/exhibition/qrcode': '专属二维码',
  '/exhibition/customers': '客户关系图谱',
  '/exhibition/tracking': '传播效果追踪',
  '/products': '产品中心',
  '/products/trace': '批次溯源',
  '/products/inventory': '库存同步',
  '/products/promotions': '促销活动',
  '/stores': '生活馆',
  '/stores/appointments': '预约到店',
  '/stores/services': '服务记录',
  '/stores/reviews': '评价聚合',
  '/compliance': '合规风控',
  '/compliance/speech': '话术识别',
  '/compliance/aml': '反洗钱校验',
  '/compliance/geofence': '地理围栏',
  '/training': '培训激励',
  '/training/courses': '课件中心',
  '/training/exams': '考试题库',
  '/training/rankings': '业绩排行',
  '/dashboard': '数据看板',
  '/dashboard/fission': '裂变图谱',
  '/dashboard/sales': '动销分析',
  '/dashboard/saturation': '饱和度预警',
}

export default function Topbar() {
  const { toggleSidebar, currentUser } = useAppStore()
  const location = useLocation()

  const title = pageTitles[location.pathname] || '新时代展业平台'

  const breadcrumbs = location.pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => {
      const path = '/' + arr.slice(0, index + 1).join('/')
      return { label: pageTitles[path] || segment, path }
    })

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-400">首页</span>
          {breadcrumbs.map((crumb) => (
            <span key={crumb.path} className="flex items-center gap-1.5">
              <ChevronRight size={14} className="text-gray-300" />
              <span className="text-gray-700 font-medium">{crumb.label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索功能、产品、客户..."
            className="pl-9 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 text-xs font-bold">
            {currentUser.name[0]}
          </div>
          <span className="text-sm text-gray-700">{currentUser.name}</span>
        </div>
      </div>
    </header>
  )
}
