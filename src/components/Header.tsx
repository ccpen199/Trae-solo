import { Link, useLocation } from 'react-router-dom'
import { useStore } from '@/store'
import { Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'

const routeLabels: Record<string, string> = {
  '/dashboard': '运营仪表盘',
  '/map': '充电桩地图',
  '/devices': '设备管理',
  '/orders': '订单与计费',
  '/billing': '计费规则',
  '/alerts': '安全与告警',
  '/safety': '安全策略',
  '/users': '用户与信用',
  '/profile': '个人中心',
  '/settlement': '结算与分润',
  '/prediction': '故障预测',
}

export default function Header() {
  const location = useLocation()
  const { alertRecords, realtimeUpdateEnabled, toggleRealtimeUpdate } = useStore()
  const [currentTime, setCurrentTime] = useState(new Date())
  const pendingAlerts = alertRecords.filter((a) => a.status === '待处理').length

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const baseRoute = '/' + location.pathname.split('/')[1]
  const pageTitle = routeLabels[baseRoute] || '智充云'

  return (
    <header className="h-14 bg-dark-800/80 backdrop-blur-sm border-b border-surface-border flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-100">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500 font-din">
          {currentTime.toLocaleDateString('zh-CN')} {currentTime.toLocaleTimeString('zh-CN')}
        </div>

        <button
          onClick={toggleRealtimeUpdate}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
            realtimeUpdateEnabled
              ? 'bg-electric/10 text-electric border border-electric/20'
              : 'bg-dark-600 text-slate-500 border border-surface-border'
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${realtimeUpdateEnabled ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
          {realtimeUpdateEnabled ? '实时更新' : '已暂停'}
        </button>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-alert-green/10 text-alert-green border border-alert-green/20">
          <Wifi className="w-3 h-3" />
          GB/T 32960
        </div>

        <div className="relative">
          <button className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-dark-600 transition-colors">
            <Bell className="w-4 h-4" />
            {pendingAlerts > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-alert-red text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                {pendingAlerts > 9 ? '9+' : pendingAlerts}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 pl-3 border-l border-surface-border">
          <div className="w-7 h-7 rounded-full bg-electric/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-electric">管</span>
          </div>
          <Link to="/profile" className="text-xs text-slate-400 hover:text-electric transition-colors">
            个人中心
          </Link>
        </div>
      </div>
    </header>
  )
}
