import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User, Phone, Shield, Settings, Bell, LogOut, PawPrint, Home, Heart,
  MessageCircle, Star, ChevronRight, Edit, FileText
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import { cn } from '@/lib/utils'

const roleLabels: Record<string, string> = {
  admin: '管理员',
  owner: '宠物主人',
  adopter: '领养人',
  vet: '兽医',
}

const verifyStatusLabels: Record<string, { label: string; status: string }> = {
  unverified: { label: '未认证', status: 'warning' },
  pending: { label: '审核中', status: 'pending' },
  verified: { label: '已认证', status: 'success' },
  rejected: { label: '认证失败', status: 'rejected' },
}

const quickActions = [
  { key: 'pets', label: '我的宠物', icon: PawPrint, path: '/pets', color: 'text-primary', bg: 'bg-primary/10' },
  { key: 'adoptions', label: '我的领养', icon: Home, path: '/profile/adoptions', color: 'text-secondary', bg: 'bg-secondary/10' },
  { key: 'breeding', label: '我的配种', icon: Heart, path: '/profile/breeding', color: 'text-pink-500', bg: 'bg-pink-50' },
  { key: 'qa', label: '我的问答', icon: MessageCircle, path: '/profile/qa', color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'favorites', label: '我的收藏', icon: Star, path: '/profile/favorites', color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'notifications', label: '消息通知', icon: Bell, path: '/profile/notifications', color: 'text-purple-500', bg: 'bg-purple-50' },
]

const settingsItems = [
  { key: 'security', label: '账号安全', icon: Shield, path: '/profile/security' },
  { key: 'notifications', label: '通知设置', icon: Bell, path: '/profile/settings/notifications' },
  { key: 'settings', label: '通用设置', icon: Settings, path: '/profile/settings' },
]

interface ActivityItem {
  id: number
  type: string
  title: string
  date: string
  status?: string
  description?: string
}

const mockActivities: ActivityItem[] = [
  { id: 1, type: 'adoption', title: '申请领养英短蓝猫', date: '2024-06-15', status: 'approved', description: '您的领养申请已通过' },
  { id: 2, type: 'qa', title: '回答了金毛掉毛问题', date: '2024-06-10', status: 'success', description: '获得了28个赞' },
  { id: 3, type: 'post', title: '发布了社区动态', date: '2024-06-08', status: 'pending', description: '正在审核中' },
  { id: 4, type: 'adoption', title: '发布领养信息', date: '2024-06-01', status: 'approved', description: '小花的领养信息已上线' },
]

export default function Profile() {
  const { user, isLoggedIn, loading, fetchMe, logout } = useAuthStore()
  const [activities] = useState<ActivityItem[]>(mockActivities)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

  const verifyStatus = user?.verify_status ? verifyStatusLabels[user.verify_status] : verifyStatusLabels.unverified

  if (loading && !user) {
    return (
      <div className="container mx-auto py-8 max-w-4xl animate-fadeIn">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-stone-200 rounded w-32" />
          <div className="bg-white rounded-2xl p-6 h-48" />
        </div>
      </div>
    )
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="container mx-auto py-16 text-center animate-fadeIn">
        <User className="w-16 h-16 text-stone-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-text-primary mb-2">请先登录</h2>
        <p className="text-text-secondary mb-6">登录后可查看个人中心</p>
        <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
          去登录
        </Link>
      </div>
    )
  }

  const avatarUrl = user.avatar_url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=portrait%20of%20person%20avatar&image_size=square`

  return (
    <div className="container mx-auto py-8 max-w-4xl animate-fadeIn">
      <h1 className="heading-font text-2xl font-bold text-text-primary mb-6">个人中心</h1>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-slideUp stagger-1">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="relative">
            <img
              src={avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-lg"
            />
            <button className="absolute -bottom-1 -right-1 p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary-600 transition-colors">
              <Edit className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-text-primary">{user.name}</h2>
              <StatusBadge status={verifyStatus.status} label={verifyStatus.label} />
              <StatusBadge status="info" label={roleLabels[user.role] || user.role} />
            </div>
            <p className="text-text-secondary flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4" /> {user.phone}
            </p>
            {user.real_name && (
              <p className="text-sm text-text-secondary">
                真实姓名: {user.real_name}
              </p>
            )}
            {user.vet_license && (
              <p className="text-sm text-text-secondary">
                兽医执照: {user.vet_license}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            {user.verify_status !== 'verified' && (
              <Link
                to="/profile/verify"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-600 active:scale-95 transition-all"
              >
                <Shield className="w-4 h-4" />
                {user.verify_status === 'pending' ? '查看审核进度' : '去实名认证'}
              </Link>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-stone-200 text-text-secondary text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-slideUp stagger-2">
        <h3 className="font-semibold text-text-primary text-lg mb-4">快捷功能</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.key}
                to={action.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-stone-50 transition-colors group"
              >
                <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110', action.bg)}>
                  <Icon className={cn('w-6 h-6', action.color)} />
                </div>
                <span className="text-sm text-text-primary font-medium">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm animate-slideUp stagger-3">
        <h3 className="font-semibold text-text-primary text-lg mb-4">最近动态</h3>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无动态记录</p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors',
                  `stagger-${Math.min(index + 1, 6)}`
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  activity.type === 'adoption' ? 'bg-primary/10' :
                  activity.type === 'qa' ? 'bg-blue-50' :
                  'bg-secondary/10'
                )}>
                  {activity.type === 'adoption' ? (
                    <Home className={cn('w-4 h-4', activity.type === 'adoption' ? 'text-primary' : 'text-secondary')} />
                  ) : activity.type === 'qa' ? (
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  ) : (
                    <FileText className="w-4 h-4 text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary truncate">{activity.title}</p>
                    {activity.status && <StatusBadge status={activity.status} size="sm" />}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-text-secondary truncate">{activity.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-text-secondary flex-shrink-0">
                  {activity.date}
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm animate-slideUp stagger-4">
        <h3 className="font-semibold text-text-primary text-lg mb-4">设置</h3>
        <div className="space-y-1">
          {settingsItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.key}
                to={item.path}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <div className="p-2 bg-stone-100 rounded-lg">
                  <Icon className="w-4 h-4 text-text-secondary" />
                </div>
                <span className="flex-1 text-text-primary font-medium">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
