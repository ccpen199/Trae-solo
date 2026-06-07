import { useState, type ComponentType } from 'react'
import { User, Heart, Bookmark, Clock, Settings, Award, FileText, Building, ChevronRight, Camera, Edit3, CheckCircle, XCircle, Clock as ClockIcon } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

const menuItems = [
  { id: 'favorites', label: '我的收藏', icon: Bookmark, count: 28 },
  { id: 'orders', label: '装修订单', icon: Building, count: 2 },
  { id: 'history', label: '浏览历史', icon: Clock, count: 156 },
  { id: 'certification', label: '认证管理', icon: Award, count: 0 },
  { id: 'settings', label: '账号设置', icon: Settings, count: 0 },
]

const demoFavorites = [
  { id: 1, type: 'property', title: '朝阳区豪华三居室 南北通透 学区房', price: 8900000, image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400&h=300' },
  { id: 2, type: 'property', title: '海淀区中关村精装两居室 近地铁', price: 6200000, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400&h=300' },
  { id: 3, type: 'content', title: '装修避坑指南：10个最容易忽略的细节', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=400&h=300' },
  { id: 4, type: 'company', title: '东易日盛装饰', rating: 4.9, image: 'https://picsum.photos/seed/company1/400/300' },
]

const demoOrders = [
  { id: 1, company: '东易日盛装饰', stage: '施工', status: '进行中', progress: 60, budget: 158000, startDate: '2024-01-01' },
  { id: 2, company: '业之峰装饰', stage: '设计', status: '待确认', progress: 20, budget: 142000, startDate: '2024-02-15' },
]

const demoHistory = [
  { id: 1, type: 'property', title: '国贸CBD高端公寓 精装修拎包入住', time: '2小时前', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=200&h=150' },
  { id: 2, type: 'live', title: '朝阳公园旁精品三居室 直播带看中', time: '昨天', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=200&h=150' },
  { id: 3, type: 'content', title: '2024年北京房价走势分析与预测', time: '3天前', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=200&h=150' },
  { id: 4, type: 'property', title: '通州副中心河景别墅 带花园车库', time: '1周前', image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=200&h=150' },
]

const certificationOptions = [
  { value: 'agent', label: '置业顾问', desc: '发布房源、直播带看', status: 'none' },
  { value: 'designer', label: '设计师', desc: '设计方案、直播分享', status: 'pending' },
  { value: 'company', label: '装修公司', desc: '装修服务、报价接单', status: 'approved' },
  { value: 'expert', label: '专业人士', desc: '律师/估价师/监理', status: 'rejected' },
]

export default function Profile() {
  const user = useAuthStore((state) => state.user)
  const showLoginModal = useUIStore((state) => state.showLoginModal)
  const [activeTab, setActiveTab] = useState('favorites')

  if (!user) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <User size={40} className="text-slate-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">请先登录</h2>
          <p className="text-slate-500 mb-8">登录后可查看个人中心内容</p>
          <button
            onClick={showLoginModal}
            className="btn-primary px-8 py-3"
          >
            立即登录
          </button>
        </div>
      </div>
    )
  }

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: ComponentType<any> }> = {
    approved: { label: '已通过', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    pending: { label: '审核中', color: 'text-amber-600', bg: 'bg-amber-50', icon: ClockIcon },
    rejected: { label: '已拒绝', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    none: { label: '未认证', color: 'text-slate-500', bg: 'bg-slate-50', icon: Award },
  }

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-4xl font-bold text-white">{user.username.charAt(0)}</span>
                  </div>
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <Camera size={14} className="text-slate-600" strokeWidth={1.5} />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-4">{user.username}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  账号类型：{user.role === 'user' ? '普通用户' : user.role}
                </p>
                <button className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 mx-auto">
                  <Edit3 size={14} strokeWidth={1.5} />
                  编辑资料
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-600">28</p>
                  <p className="text-xs text-slate-500">收藏</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">2</p>
                  <p className="text-xs text-slate-500">订单</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">156</p>
                  <p className="text-xs text-slate-500">足迹</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-6 py-4 transition-colors border-b border-slate-50 last:border-b-0',
                    activeTab === item.id
                      ? 'bg-teal-50 text-teal-600 border-l-4 border-teal-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <item.icon size={20} strokeWidth={1.5} />
                  <span className="flex-1 text-left font-medium">{item.label}</span>
                  {item.count > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight size={16} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {activeTab === 'favorites' && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-slate-900 mb-6">我的收藏</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demoFavorites.map((item) => (
                    <Link
                      key={item.id}
                      to={item.type === 'property' ? `/properties/${item.id}` : item.type === 'content' ? `/content/${item.id}` : '#'}
                      className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all"
                    >
                      <img src={item.image} alt="" className="w-24 h-18 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 line-clamp-2">{item.title}</h4>
                        {item.price && (
                          <p className="text-amber-500 font-semibold mt-1">¥{item.price.toLocaleString()}</p>
                        )}
                        {item.rating && (
                          <p className="text-teal-600 font-medium mt-1">评分 {item.rating}</p>
                        )}
                        <span className="text-xs text-slate-400 mt-1 inline-block">
                          {item.type === 'property' ? '房源' : item.type === 'content' ? '内容' : '装修公司'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-900">我的装修订单</h3>
                  <Link to="/renovation" className="text-teal-600 hover:text-teal-700 text-sm">
                    发起新订单 →
                  </Link>
                </div>
                <div className="space-y-4">
                  {demoOrders.map((order) => (
                    <div key={order.id} className="p-5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-slate-900">{order.company}</h4>
                          <p className="text-sm text-slate-500">合同金额：¥{order.budget.toLocaleString()}</p>
                        </div>
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          order.status === '进行中' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
                        )}>
                          {order.status}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">当前阶段：{order.stage}</span>
                          <span className="text-teal-600 font-medium">{order.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">开工日期：{order.startDate}</span>
                        <button className="text-teal-600 hover:text-teal-700 font-medium">
                          查看详情 →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-slate-900">浏览历史</h3>
                  <button className="text-red-500 hover:text-red-600 text-sm">
                    清空历史
                  </button>
                </div>
                <div className="space-y-3">
                  {demoHistory.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <img src={item.image} alt="" className="w-20 h-14 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {item.type === 'property' ? '房源' : item.type === 'live' ? '直播' : '内容'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'certification' && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-slate-900 mb-2">认证管理</h3>
                <p className="text-sm text-slate-500 mb-6">选择您的专业身份，提交认证材料后即可开通相应权限</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {certificationOptions.map((option) => {
                    const status = statusConfig[option.status]
                    const StatusIcon = status.icon
                    return (
                      <div key={option.value} className="p-5 rounded-xl border border-slate-100 hover:border-teal-200 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">{option.label}</h4>
                            <p className="text-sm text-slate-500">{option.desc}</p>
                          </div>
                          <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
                            <StatusIcon size={12} strokeWidth={1.5} />
                            {status.label}
                          </span>
                        </div>
                        <button className={cn(
                          'w-full py-2 rounded-lg text-sm font-medium transition-colors',
                          option.status === 'none'
                            ? 'bg-teal-600 text-white hover:bg-teal-700'
                            : option.status === 'rejected'
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                        )}>
                          {option.status === 'none' ? '提交认证' : option.status === 'rejected' ? '重新提交' : option.status === 'pending' ? '审核中...' : '已认证'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-slate-900 mb-6">账号设置</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                      <input
                        type="text"
                        defaultValue={user.username}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">手机号</label>
                      <input
                        type="tel"
                        defaultValue={user.phone || '未绑定'}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">邮箱</label>
                      <input
                        type="email"
                        defaultValue={user.email || '未绑定'}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <hr className="border-slate-100" />

                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">账号安全</h4>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-teal-600" strokeWidth={1.5} />
                        <div>
                          <p className="font-medium text-slate-900">修改密码</p>
                          <p className="text-sm text-slate-500">上次修改：3个月前</p>
                        </div>
                      </div>
                      <button className="text-teal-600 hover:text-teal-700 text-sm font-medium">
                        修改 →
                      </button>
                    </div>
                  </div>

                  <button className="w-full btn-primary py-3 mt-6">
                    保存修改
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
