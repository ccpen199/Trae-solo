import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ClipboardList,
  Shield,
  Star,
  Heart,
  Award,
  Settings,
  Headphones,
  LogOut,
  ChevronRight,
  Crown,
  CreditCard,
  Wallet,
  Bell,
  HelpCircle,
  Users,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import { useAuthStore } from '../../store/useAuthStore'

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const menuGroups = [
    {
      title: '我的服务',
      items: [
        { icon: ClipboardList, label: '我的订单', desc: '3 笔进行中', path: '/orders', badge: '3', color: 'blue' as const },
        { icon: Shield, label: '我的保单', desc: '2 份有效', path: '/insurance/policies', badge: null, color: 'green' as const },
        { icon: Star, label: '我的评价', desc: '查看全部评价', path: '#', badge: null, color: 'yellow' as const },
        { icon: Heart, label: '我的收藏', desc: '12 位收藏师傅', path: '#', badge: '12', color: 'red' as const },
      ],
    },
    {
      title: '账户与认证',
      items: [
        { icon: Award, label: '认证中心', desc: '已完成实名认证', path: '/certification', badge: null, color: 'purple' as const },
        { icon: Wallet, label: '我的钱包', desc: '余额 ¥ 1,280.00', path: '#', badge: null, color: 'cyan' as const },
        { icon: CreditCard, label: '支付方式', desc: '已绑定 2 张卡', path: '#', badge: null, color: 'orange' as const },
      ],
    },
    {
      title: '其他',
      items: [
        { icon: Bell, label: '消息通知', desc: '管理推送设置', path: '#', badge: null, color: 'blue' as const },
        { icon: Settings, label: '设置', desc: '账号与安全', path: '#', badge: null, color: 'gray' as const },
        { icon: Headphones, label: '联系客服', desc: '7x24小时在线', path: '#', badge: null, color: 'green' as const },
        { icon: HelpCircle, label: '帮助中心', desc: '常见问题解答', path: '#', badge: null, color: 'blue' as const },
      ],
    },
  ]

  const colorBgMap = {
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    yellow: 'bg-amber-100',
    red: 'bg-red-100',
    purple: 'bg-purple-100',
    cyan: 'bg-cyan-100',
    orange: 'bg-orange-100',
    gray: 'bg-gray-100',
  }

  const colorTextMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-amber-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    cyan: 'text-cyan-600',
    orange: 'text-orange-600',
    gray: 'text-gray-600',
  }

  return (
    <div className="pb-6">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-0 right-10 w-40 h-40 rounded-full bg-purple-300/30 blur-2xl" />
          </div>

          <div className="absolute top-4 right-4 flex gap-2">
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <Settings className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-4 -mt-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-5 shadow-xl shadow-blue-500/10"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user?.realName?.[0] || user?.username?.[0] || '张'}
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Tag color="yellow" size="sm">
                    <Crown className="w-3 h-3 mr-0.5" />
                    VIP
                  </Tag>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.realName || user?.username || '测试用户'}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {user?.phone || '138****8888'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Tag color="green" size="sm">已实名认证</Tag>
                  <Tag color="blue" size="sm">信用 A 级</Tag>
                </div>
              </div>
              <button
                onClick={() => navigate('/certification')}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">18</div>
                <div className="text-xs text-gray-500 mt-0.5">总订单</div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className="text-xl font-bold text-gray-900">15</div>
                <div className="text-xs text-gray-500 mt-0.5">已完成</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">4.9</div>
                <div className="text-xs text-gray-500 mt-0.5">平均分</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-4 mt-5">
        <Card padded={false} className="overflow-hidden">
          <div className="grid grid-cols-4">
            {[
              { icon: ClipboardList, label: '我的订单', color: 'bg-blue-100 text-blue-600', path: '/orders' },
              { icon: Shield, label: '我的保单', color: 'bg-green-100 text-green-600', path: '/insurance/policies' },
              { icon: Users, label: '常用师傅', color: 'bg-purple-100 text-purple-600', path: '#' },
              { icon: Star, label: '我的评价', color: 'bg-amber-100 text-amber-600', path: '#' },
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className="py-5 flex flex-col items-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </motion.button>
              )
            })}
          </div>
        </Card>
      </div>

      <div className="px-4 mt-5 space-y-5">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.title}>
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-1">{group.title}</h3>
            <Card padded={false} className="overflow-hidden">
              {group.items.map((item, idx) => {
                const Icon = item.icon
                return (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (groupIdx * 4 + idx) * 0.03 }}
                    whileTap={{ backgroundColor: 'rgb(249, 250, 251)' }}
                    onClick={() => navigate(item.path)}
                    className={`
                      w-full flex items-center gap-4 p-4 text-left transition-colors
                      ${idx !== group.items.length - 1 ? 'border-b border-gray-50' : ''}
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl ${colorBgMap[item.color]} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colorTextMap[item.color]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                        {item.badge && (
                          <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </motion.button>
                )
              })}
            </Card>
          </div>
        ))}
      </div>

      <div className="px-4 mt-6">
        <Button
          variant="secondary"
          icon={<LogOut className="w-4 h-4" />}
          fullWidth
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="!text-red-600 !border-red-200 hover:!bg-red-50"
        >
          退出登录
        </Button>
      </div>

      <div className="text-center mt-6 pb-4">
        <p className="text-xs text-gray-400">城运通 v1.0.0</p>
      </div>
    </div>
  )
}
