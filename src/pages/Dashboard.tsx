import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { Home, Video, Building2, Hammer, FileText, Settings, CreditCard, Calendar, MessageSquare, Award, AlertTriangle, UserCheck, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const roleConfig: Record<string, {
  title: string
  subtitle: string
  color: string
  bgColor: string
  quickActions: { icon: any; label: string; to: string; desc: string }[]
}> = {
  user: {
    title: '购房者工作台',
    subtitle: '您的一站式购房装修服务中心',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    quickActions: [
      { icon: Home, label: '收藏房源', to: '/profile', desc: '查看您收藏的房源' },
      { icon: Hammer, label: '我的装修订单', to: '/profile#orders', desc: '跟踪装修进度' },
      { icon: MessageSquare, label: '咨询记录', to: '/profile#messages', desc: '查看与顾问的对话' },
      { icon: CreditCard, label: '报价对比', to: '/renovation/quote-compare', desc: '对比多家装修报价' },
    ]
  },
  host: {
    title: '房产顾问工作台',
    subtitle: '直播管理、房源发布、数据统计',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    quickActions: [
      { icon: Video, label: '开启直播', to: '/live', desc: '开始带看直播' },
      { icon: Building2, label: '发布房源', to: '/properties', desc: '管理您的房源' },
      { icon: BarChart3, label: '数据看板', to: '/profile#stats', desc: '查看直播数据' },
      { icon: Calendar, label: '排期管理', to: '/profile#schedule', desc: '管理直播排期' },
    ]
  },
  designer: {
    title: '设计师工作台',
    subtitle: '案例管理、设计方案、直播分享',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    quickActions: [
      { icon: FileText, label: '我的案例', to: '/profile#cases', desc: '管理装修案例' },
      { icon: Video, label: '设计直播', to: '/live', desc: '分享设计经验' },
      { icon: Award, label: '资质认证', to: '/profile#cert', desc: '专业身份认证' },
      { icon: MessageSquare, label: '客户咨询', to: '/profile#messages', desc: '回复客户咨询' },
    ]
  },
  agent: {
    title: '置业顾问工作台',
    subtitle: '房源管理、客户跟进、成交记录',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    quickActions: [
      { icon: Building2, label: '房源管理', to: '/properties', desc: '发布和管理房源' },
      { icon: UserCheck, label: '客户管理', to: '/profile#clients', desc: '跟进意向客户' },
      { icon: BarChart3, label: '成交记录', to: '/profile#deals', desc: '查看成交数据' },
      { icon: Calendar, label: '带看安排', to: '/profile#schedule', desc: '管理带看日程' },
    ]
  },
  expert: {
    title: '专业人士工作台',
    subtitle: '律师/估价师/监理专业服务',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    quickActions: [
      { icon: Award, label: '资质管理', to: '/profile#cert', desc: '专业资质维护' },
      { icon: Video, label: '专业直播', to: '/live', desc: '分享专业知识' },
      { icon: MessageSquare, label: '咨询回复', to: '/profile#consult', desc: '回复用户咨询' },
      { icon: FileText, label: '服务记录', to: '/profile#services', desc: '查看服务历史' },
    ]
  },
  admin: {
    title: '平台管理后台',
    subtitle: '内容审核、KOL管理、公司年审',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    quickActions: [
      { icon: AlertTriangle, label: '内容审核', to: '/admin', desc: '审核待发布内容' },
      { icon: UserCheck, label: 'KOL管理', to: '/admin#kols', desc: '管理合作主播' },
      { icon: Calendar, label: '年审提醒', to: '/admin#annual', desc: '装修公司年审' },
      { icon: BarChart3, label: '数据仪表盘', to: '/admin#dashboard', desc: '平台运营数据' },
    ]
  },
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  if (!user) {
    navigate('/')
    return null
  }

  const config = roleConfig[user.role] || roleConfig.user
  const Icon = config.quickActions[0]?.icon || Home

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`${config.bgColor} rounded-2xl p-8 mb-8 border border-slate-100`}>
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 ${config.bgColor} rounded-2xl flex items-center justify-center border-2 border-white shadow-lg`}>
              <Icon size={40} className={config.color} strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <h1 className={`text-3xl font-bold ${config.color} mb-2`}>{config.title}</h1>
              <p className="text-slate-600 text-lg">{config.subtitle}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm text-slate-500">欢迎回来，</span>
                <span className="text-sm font-medium text-slate-900">{user.username}</span>
                {user.certificationType && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                    {user.certificationType === 'real_estate_broker' ? '房产经纪人' :
                     user.certificationType === 'interior_designer' ? '室内设计师' :
                     user.certificationType === 'lawyer' ? '律师' :
                     user.certificationType === 'appraiser' ? '估价师' :
                     user.certificationType === 'supervisor' ? '监理' : user.certificationType}
                  </span>
                )}
              </div>
            </div>
            <Link to="/profile" className="px-5 py-2.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200 flex items-center gap-2">
              <Settings size={18} strokeWidth={1.5} />
              个人设置
            </Link>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-6">快捷操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {config.quickActions.map(({ icon: ActionIcon, label, to, desc }) => (
            <Link
              key={label}
              to={to}
              className="group bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-teal-200"
            >
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors',
                config.bgColor,
                'group-hover:bg-teal-50'
              )}>
                <ActionIcon size={28} className={cn(config.color, 'group-hover:text-teal-600')} strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">{label}</h3>
              <p className="text-sm text-slate-500">{desc}</p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-md border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">待办事项</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">完善个人资料</p>
                  <p className="text-sm text-slate-500">补充联系方式和头像，提升信任度</p>
                </div>
                <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">待处理</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <Calendar size={20} className="text-slate-600" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">浏览收藏的房源</p>
                  <p className="text-sm text-slate-500">您收藏了 0 套房源，查看最新动态</p>
                </div>
                <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">进行中</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4">平台服务</h3>
            <div className="space-y-3">
              <Link to="/properties" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Building2 size={20} className="text-teal-600" strokeWidth={1.5} />
                <span className="text-slate-700">找房源</span>
              </Link>
              <Link to="/live" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Video size={20} className="text-red-500" strokeWidth={1.5} />
                <span className="text-slate-700">看直播</span>
              </Link>
              <Link to="/renovation" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <Hammer size={20} className="text-amber-500" strokeWidth={1.5} />
                <span className="text-slate-700">装修服务</span>
              </Link>
              <Link to="/renovation/quote-compare" className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <CreditCard size={20} className="text-blue-500" strokeWidth={1.5} />
                <span className="text-slate-700">报价对比</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
