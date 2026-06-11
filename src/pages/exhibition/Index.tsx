import { UserCircle, QrCode, Share2, Award, TrendingUp, Users, ShoppingBag, Clock, ArrowUpRight } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { dealerProfile } from '@/data/mockData'

const activities = [
  { id: 1, text: '新增客户赵明华通过扫码关注', time: '10分钟前', type: 'customer' },
  { id: 2, text: '松花粉片分享被查看32次', time: '1小时前', type: 'share' },
  { id: 3, text: '客户王建国完成复购订单', time: '2小时前', type: 'order' },
  { id: 4, text: '夏季健康养生讲座二维码被扫描18次', time: '3小时前', type: 'share' },
  { id: 5, text: '新客户孙丽萍注册成功', time: '5小时前', type: 'customer' },
]

const typeIcon = {
  customer: <Users size={14} className="text-emerald-500" />,
  share: <Share2 size={14} className="text-blue-500" />,
  order: <ShoppingBag size={14} className="text-amber-500" />,
}

export default function ExhibitionIndex() {
  const completionRate = Math.round((dealerProfile.stats.monthlyCompleted / dealerProfile.stats.monthlyTarget) * 100)

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="我的展厅" subtitle="个人数字化展业空间" actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
          <Share2 size={16} />
          分享展厅
        </button>
      } />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                <UserCircle size={40} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">{dealerProfile.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {dealerProfile.level}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>{dealerProfile.region}</span>
                  <span>·</span>
                  <span>团队 {dealerProfile.teamSize} 人</span>
                  <span>·</span>
                  <span>加入于 {dealerProfile.joinDate}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {dealerProfile.certifications.map((cert) => (
                    <span key={cert} className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs border border-amber-200">
                      <Award size={12} />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users size={16} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{dealerProfile.stats.totalCustomers}</p>
                <p className="text-xs text-gray-500 mt-1">累计客户</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users size={16} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{dealerProfile.stats.newCustomers}</p>
                <p className="text-xs text-gray-500 mt-1">本月新客</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp size={16} className="text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">¥{(dealerProfile.monthlySales / 10000).toFixed(1)}万</p>
                <p className="text-xs text-gray-500 mt-1">本月销售</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">月度目标完成率</span>
                <span className="text-sm font-semibold text-emerald-600">{completionRate}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">最近动态</h3>
              <Clock size={16} className="text-gray-400" />
            </div>
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {typeIcon[activity.type as keyof typeof typeIcon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">我的二维码</h3>
            <div className="aspect-square bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-emerald-200">
              <QrCode size={80} className="text-emerald-400 mb-3" />
              <p className="text-sm text-emerald-600 font-medium">扫码访问我的展厅</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                <QrCode size={16} />
                生成二维码
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                <Share2 size={16} />
                分享
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">访问统计</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">分享次数</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900">{dealerProfile.stats.shareCount}</span>
                  <ArrowUpRight size={14} className="text-emerald-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">浏览量</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-gray-900">{dealerProfile.stats.shareViews.toLocaleString()}</span>
                  <ArrowUpRight size={14} className="text-emerald-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">转化率</span>
                <span className="text-sm font-semibold text-emerald-600">{dealerProfile.stats.conversionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">周增长</span>
                <span className="text-sm font-semibold text-emerald-600">+{dealerProfile.stats.weeklyGrowth}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
