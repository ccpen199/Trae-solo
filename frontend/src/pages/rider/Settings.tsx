import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, Bike, Shield, MapPin,
  Zap, Layers, Filter, Ruler,
  CreditCard, Wallet,
  Bell, Lock, HelpCircle, ChevronRight, LogOut
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

type OrderMode = 'grab' | 'dispatch' | 'mixed'

interface MenuItem {
  icon: typeof ShieldCheck
  label: string
  value?: string
  tag?: { text: string; color: 'green' | 'blue' | 'yellow' | 'red' | 'orange' | 'purple' | 'cyan' | 'gray' }
  onClick?: () => void
}

const IDENTITY_ITEMS: MenuItem[] = [
  { icon: ShieldCheck, label: '实名认证', tag: { text: '已认证', color: 'green' } },
  { icon: Bike, label: '车辆信息', tag: { text: '未完善', color: 'yellow' } },
  { icon: Shield, label: '保险信息', tag: { text: '未完善', color: 'yellow' } },
  { icon: MapPin, label: '服务区域', value: '西湖区、拱墅区' },
]

const ORDER_MODES: { key: OrderMode; label: string; desc: string }[] = [
  { key: 'grab', label: '抢单', desc: '自主选择订单' },
  { key: 'dispatch', label: '派单', desc: '系统智能分配' },
  { key: 'mixed', label: '混合', desc: '抢单+派单' },
]

export default function RiderSettings() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [orderMode, setOrderMode] = useState<OrderMode>('mixed')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const orderSettingItems: MenuItem[] = [
    { icon: Zap, label: '接单模式', value: ORDER_MODES.find((m) => m.key === orderMode)?.label },
    { icon: Filter, label: '品类偏好', value: '全部品类' },
    { icon: Ruler, label: '最大接单距离', value: '5km' },
  ]

  const financeItems: MenuItem[] = [
    { icon: CreditCard, label: '银行卡', value: '尾号8888' },
    { icon: Wallet, label: '提现设置', value: '自动提现' },
  ]

  const otherItems: MenuItem[] = [
    { icon: Bell, label: '通知设置' },
    { icon: Lock, label: '隐私设置' },
    { icon: HelpCircle, label: '帮助中心' },
  ]

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function renderMenuGroup(title: string, items: MenuItem[]) {
    return (
      <Card>
        <div className="text-sm font-bold text-gray-900 mb-2">{title}</div>
        <div className="divide-y divide-gray-50">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <span className="text-sm text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.tag && <Tag color={item.tag.color} size="sm">{item.tag.text}</Tag>}
                  {item.value && <span className="text-sm text-gray-400">{item.value}</span>}
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            )
          })}
        </div>
      </Card>
    )
  }

  return (
    <div className="p-4 space-y-4 pb-8">
      <h1 className="text-xl font-bold text-gray-900">骑手设置</h1>

      {renderMenuGroup('身份认证', IDENTITY_ITEMS)}

      <Card>
        <div className="text-sm font-bold text-gray-900 mb-2">接单设置</div>

        <div className="py-3 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-sm text-gray-700">接单模式</span>
          </div>
          <div className="flex gap-2">
            {ORDER_MODES.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setOrderMode(mode.key)}
                className={`
                  flex-1 py-2.5 px-3 rounded-xl text-center transition-all
                  ${orderMode === mode.key
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <div className="text-sm font-medium">{mode.label}</div>
                <div className={`text-xs mt-0.5 ${orderMode === mode.key ? 'text-white/70' : 'text-gray-400'}`}>
                  {mode.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          <button className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Filter className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-700">品类偏好</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">全部品类</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </button>
          <button className="w-full flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-gray-50 -mx-1 px-1 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm text-gray-700">最大接单距离</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">5km</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          </button>
        </div>
      </Card>

      {renderMenuGroup('财务', financeItems)}
      {renderMenuGroup('其他', otherItems)}

      <Button
        variant="danger"
        fullWidth
        size="lg"
        icon={<LogOut className="w-5 h-5" />}
        onClick={() => setShowLogoutModal(true)}
      >
        退出登录
      </Button>

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowLogoutModal(false)}>
          <div className="bg-white rounded-2xl p-6 mx-8 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">确认退出登录？</h3>
              <p className="text-sm text-gray-500 mb-6">退出后需要重新登录才能继续接单</p>
              <div className="flex gap-3">
                <Button variant="secondary" size="md" fullWidth onClick={() => setShowLogoutModal(false)}>
                  取消
                </Button>
                <Button variant="danger" size="md" fullWidth onClick={handleLogout}>
                  确认退出
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
