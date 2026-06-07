import { useState } from 'react'
import { Shield, Users, Building2, BarChart3, CheckCircle, XCircle, Clock, Calendar, DollarSign, AlertTriangle, Eye, TrendingUp, Home, Video, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuTabs = [
  { id: 'dashboard', label: '数据看板', icon: BarChart3 },
  { id: 'reviews', label: '内容审核', icon: Shield },
  { id: 'kols', label: 'KOL管理', icon: Users },
  { id: 'companies', label: '公司年审', icon: Building2 },
]

const demoReviews = [
  { id: 1, title: '2024年北京房价走势分析与预测', author: '房产研究员', type: 'article', submittedAt: '2024-01-15 10:30', status: 'pending', reason: '' },
  { id: 2, title: '揭秘开发商不会告诉你的10个秘密', author: '资深博主', type: 'article', submittedAt: '2024-01-15 11:20', status: 'pending', reason: '疑似含敏感内容' },
  { id: 3, title: '朝阳区最新楼盘直播预告', author: '张顾问', type: 'live', submittedAt: '2024-01-15 14:00', status: 'pending', reason: '' },
  { id: 4, title: '50万装出100万效果的秘诀', author: '装修达人', type: 'video', submittedAt: '2024-01-15 15:30', status: 'pending', reason: '' },
]

const demoKOLs = [
  { id: 1, name: '张顾问', type: '房产专家', followers: 125000, totalLives: 156, rating: 4.9, shareRatio: 50, schedule: '2024-01-18 14:00', settlement: 'unsettled', amount: 25800 },
  { id: 2, name: '李设计师', type: '设计师', followers: 89000, totalLives: 89, rating: 4.8, shareRatio: 45, schedule: '2024-01-20 19:00', settlement: 'settled', amount: 18500 },
  { id: 3, name: '王律师', type: '房产律师', followers: 67000, totalLives: 45, rating: 5.0, shareRatio: 55, schedule: '', settlement: 'unsettled', amount: 12300 },
  { id: 4, name: '陈工长', type: '装修专家', followers: 56000, totalLives: 78, rating: 4.7, shareRatio: 40, schedule: '2024-01-22 20:00', settlement: 'settled', amount: 9800 },
]

const demoCompanies = [
  { id: 1, name: '东易日盛装饰', qualification: '一级资质', certificationDate: '2023-12-15', nextReviewDate: '2024-12-15', status: 'normal', daysLeft: 334 },
  { id: 2, name: '业之峰装饰', qualification: '甲级设计', certificationDate: '2023-06-20', nextReviewDate: '2024-06-20', status: 'warning', daysLeft: 156 },
  { id: 3, name: '金螳螂家装', qualification: '上市企业', certificationDate: '2022-03-10', nextReviewDate: '2024-03-10', status: 'urgent', daysLeft: 55 },
  { id: 4, name: '尚品本色装饰', qualification: '二级资质', certificationDate: '2024-01-05', nextReviewDate: '2025-01-05', status: 'normal', daysLeft: 355 },
]

const dashboardStats = [
  { label: '今日新增用户', value: '1,234', trend: '+12.5%', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: '今日直播数', value: '89', trend: '+8.2%', icon: Video, color: 'text-red-500', bg: 'bg-red-50' },
  { label: '今日房源发布', value: '256', trend: '+15.3%', icon: Home, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: '待审核内容', value: '42', trend: '-5.2%', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
]

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [reviewActions, setReviewActions] = useState<Record<number, string>>({})
  const [annualReviewActions, setAnnualReviewActions] = useState<Record<number, boolean>>({})

  const handleReviewAction = (id: number, action: 'approve' | 'reject') => {
    setReviewActions((prev) => ({ ...prev, [id]: action }))
  }

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">管理后台</h1>
          <p className="text-slate-500">内容审核、KOL管理、公司年审、数据看板</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {menuTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-200'
                  : 'bg-white text-slate-600 hover:bg-teal-50 shadow-md'
              )}
            >
              <tab.icon size={18} strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardStats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                      <stat.icon size={24} className={stat.color} strokeWidth={1.5} />
                    </div>
                    <span className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'
                    )}>
                      <TrendingUp size={14} strokeWidth={1.5} />
                      {stat.trend}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-slate-900 mb-6">用户增长趋势</h3>
                <div className="h-64 flex items-end gap-2">
                  {[65, 78, 92, 85, 98, 110, 125, 118, 135, 142, 138, 156].map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-gradient-to-t from-teal-500 to-teal-400 rounded-t-lg transition-all hover:from-teal-600 hover:to-teal-500"
                        style={{ height: `${(value / 160) * 100}%` }}
                      />
                      <span className="text-xs text-slate-400 mt-2">{index + 1}月</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-semibold text-slate-900 mb-6">内容类型分布</h3>
                <div className="space-y-4">
                  {[
                    { label: '文章', value: 45, color: 'bg-teal-500' },
                    { label: '视频', value: 30, color: 'bg-amber-500' },
                    { label: '直播', value: 15, color: 'bg-red-500' },
                    { label: '图集', value: 10, color: 'bg-blue-500' },
                  ].map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium text-slate-900">{item.value}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">内容审核队列</h3>
              <p className="text-sm text-slate-500 mt-1">共 {demoReviews.length} 条内容待审核</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">内容标题</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">作者</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">类型</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">提交时间</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">状态</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demoReviews.map((review) => (
                    <tr key={review.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Eye size={16} className="text-teal-600 cursor-pointer hover:text-teal-700" strokeWidth={1.5} />
                          <span className="font-medium text-slate-900">{review.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{review.author}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {review.type === 'article' ? '文章' : review.type === 'video' ? '视频' : '直播'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{review.submittedAt}</td>
                      <td className="px-6 py-4">
                        {review.reason ? (
                          <span className="flex items-center gap-1 text-amber-600 text-sm">
                            <AlertTriangle size={14} strokeWidth={1.5} />
                            {review.reason}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-slate-500 text-sm">
                            <Clock size={14} strokeWidth={1.5} />
                            待审核
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!reviewActions[review.id] ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleReviewAction(review.id, 'approve')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              <CheckCircle size={14} strokeWidth={1.5} />
                              通过
                            </button>
                            <button
                              onClick={() => handleReviewAction(review.id, 'reject')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              <XCircle size={14} strokeWidth={1.5} />
                              驳回
                            </button>
                          </div>
                        ) : (
                          <span className={cn(
                            'flex items-center justify-center gap-1 text-sm font-medium',
                            reviewActions[review.id] === 'approve' ? 'text-green-600' : 'text-red-600'
                          )}>
                            {reviewActions[review.id] === 'approve' ? (
                              <><CheckCircle size={14} strokeWidth={1.5} /> 已通过</>
                            ) : (
                              <><XCircle size={14} strokeWidth={1.5} /> 已驳回</>
                            )}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'kols' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">KOL合作管理</h3>
              <p className="text-sm text-slate-500 mt-1">管理KOL直播排期、分成结算</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">KOL</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">类型</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">粉丝数</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">直播场次</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">评分</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">分成比例</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">排期</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">待结算</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demoKOLs.map((kol) => (
                    <tr key={kol.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <span className="text-teal-600 font-semibold">{kol.name.charAt(0)}</span>
                          </div>
                          <span className="font-medium text-slate-900">{kol.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                          {kol.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-slate-900">
                        {(kol.followers / 10000).toFixed(1)}万
                      </td>
                      <td className="px-6 py-4 text-center text-slate-600">{kol.totalLives}</td>
                      <td className="px-6 py-4 text-center font-medium text-amber-500">{kol.rating}</td>
                      <td className="px-6 py-4 text-center text-slate-600">{kol.shareRatio}%</td>
                      <td className="px-6 py-4">
                        {kol.schedule ? (
                          <span className="flex items-center gap-1 text-teal-600 text-sm">
                            <Calendar size={14} strokeWidth={1.5} />
                            {kol.schedule}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">暂无排期</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <DollarSign size={14} className={kol.settlement === 'unsettled' ? 'text-amber-500' : 'text-green-500'} strokeWidth={1.5} />
                          <span className={cn(
                            'font-semibold',
                            kol.settlement === 'unsettled' ? 'text-amber-500' : 'text-green-600'
                          )}>
                            ¥{kol.amount.toLocaleString()}
                          </span>
                        </div>
                        <span className={cn(
                          'text-xs',
                          kol.settlement === 'unsettled' ? 'text-amber-500' : 'text-green-600'
                        )}>
                          {kol.settlement === 'unsettled' ? '待结算' : '已结算'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={20} className="text-amber-500 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="font-medium text-amber-800">年审提醒</p>
                <p className="text-sm text-amber-700">有 {demoCompanies.filter(c => c.status !== 'normal').length} 家装修公司即将到期需要年审</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">装修公司年审管理</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">公司名称</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">资质等级</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">认证日期</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">下次年审</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">剩余天数</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {demoCompanies.map((company) => (
                      <tr key={company.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">{company.name}</td>
                        <td className="px-6 py-4 text-slate-600">{company.qualification}</td>
                        <td className="px-6 py-4 text-center text-slate-500">{company.certificationDate}</td>
                        <td className="px-6 py-4 text-center text-slate-600">{company.nextReviewDate}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
                            company.status === 'urgent' ? 'bg-red-100 text-red-700' :
                            company.status === 'warning' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          )}>
                            {company.status === 'urgent' && <AlertTriangle size={12} strokeWidth={1.5} />}
                            {company.daysLeft}天
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setAnnualReviewActions((prev) => ({ ...prev, [company.id]: true }))}
                            className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-200 transition-colors"
                          >
                            {annualReviewActions[company.id] ? '已发起年审' : '处理年审'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
