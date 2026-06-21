import { Bell, Search, Settings, User, ChevronDown, Zap, RefreshCw } from 'lucide-react'
import { useAppStore } from '@/store'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { currentUser, alerts } = useAppStore()
  const navigate = useNavigate()
  const pendingAlerts = alerts.filter((a) => a.status !== 'resolved').length

  return (
    <header className="h-16 bg-white border-b border-slate2-100 flex items-center px-6 gap-4 flex-shrink-0 shadow-sm">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <h1 className="text-lg font-bold text-slate2-800">{getPageTitle()}</h1>
        <div className="hidden lg:flex items-center gap-1 text-xs text-slate2-400 ml-4">
          <span>数字物流协同平台</span>
          <ChevronDown className="w-3 h-3 -rotate-90" />
          <span className="text-slate2-600">{getPageTitle()}</span>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="flex-1 max-w-md ml-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate2-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="搜索订单号、车牌号、运单号、保单号..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate2-50 border border-transparent text-sm text-slate2-700 placeholder:text-slate2-400 focus:outline-none focus:bg-white focus:border-primary-300 focus:ring-2 focus:ring-primary-50 transition-all-smooth"
          />
          <kbd className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate2-200 bg-white text-[10px] text-slate2-400 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-2 ml-auto">
        {/* 实时同步状态 */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-50 text-success-600">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-xs font-medium">ERP实时同步中</span>
        </div>

        {/* 快捷操作 */}
        <button
          onClick={() => navigate('/cargo/publish')}
          className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all-smooth"
        >
          <Zap className="w-4 h-4" />
          快速发布
        </button>

        {/* 告警通知 */}
        <button
          onClick={() => navigate('/tracking/alerts')}
          className="relative w-10 h-10 rounded-lg hover:bg-slate2-50 flex items-center justify-center text-slate2-500 hover:text-primary-600 transition-all-smooth"
        >
          <Bell className="w-5 h-5" />
          {pendingAlerts > 0 && (
            <span className={`absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
              pendingAlerts >= 5
                ? 'bg-accent-500 text-white animate-blink shadow-alert'
                : 'bg-accent-400 text-white'
            }`}>
              {pendingAlerts}
            </span>
          )}
        </button>

        {/* 设置 */}
        <button className="w-10 h-10 rounded-lg hover:bg-slate2-50 flex items-center justify-center text-slate2-500 hover:text-primary-600 transition-all-smooth">
          <Settings className="w-5 h-5" />
        </button>

        {/* 分割线 */}
        <div className="w-px h-8 bg-slate2-100 mx-1" />

        {/* 用户信息 */}
        <button className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate2-50 transition-all-smooth">
          <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate2-800">{currentUser.name}</div>
            <div className="text-[11px] text-slate2-400 truncate max-w-[160px]">{currentUser.company}</div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate2-400" />
        </button>
      </div>
    </header>
  )
}

function getPageTitle() {
  const { currentRoute } = useAppStore.getState()
  const titleMap: Record<string, string> = {
    '/dashboard': '数据总览仪表盘',
    '/cargo': '货源订单管理',
    '/cargo/publish': '发布货源',
    '/cargo/erp-config': 'ERP系统对接配置',
    '/capacity': '运力池分级管理',
    '/capacity/return': '返程车源匹配',
    '/tracking': '货物运输追踪总览',
    '/tracking/alerts': '异常告警处理中心',
    '/insurance': '中国人保货物保险服务',
    '/insurance/apply': '在线货物投保',
    '/insurance/policies': '电子保单管理',
    '/insurance/claims': '理赔申请中心',
    '/service': '后市场增值服务中心',
    '/service/etc': 'ETC充值服务',
    '/service/fuel': '油卡折扣结算',
    '/service/maintenance': '车辆维保预约',
  }
  return titleMap[currentRoute] || '数字物流协同平台'
}
