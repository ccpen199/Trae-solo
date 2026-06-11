import { Share2, Eye, MousePointerClick, ArrowRightLeft, Trophy, Package, Calendar, FileText, Wrench } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import PageHeader from '@/components/PageHeader'
import { shareTrackingData } from '@/data/mockData'

const contentIcons: Record<string, React.ReactNode> = {
  product: <Package size={16} className="text-emerald-600" />,
  activity: <Calendar size={16} className="text-blue-600" />,
  article: <FileText size={16} className="text-amber-600" />,
  tool: <Wrench size={16} className="text-purple-600" />,
}

const contentLabels: Record<string, string> = {
  product: '产品',
  activity: '活动',
  article: '文章',
  tool: '工具',
}

export default function Tracking() {
  const { overview, trend, topContent } = shareTrackingData

  return (
    <div className="p-6 animate-fade-in-up">
      <PageHeader title="分享追踪" subtitle="跟踪分享效果与转化数据" />

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '总分享次数', value: overview.totalShares, icon: <Share2 size={18} className="text-emerald-600" />, color: 'bg-emerald-50' },
          { label: '总浏览量', value: overview.totalViews, icon: <Eye size={18} className="text-blue-600" />, color: 'bg-blue-50' },
          { label: '总点击量', value: overview.totalClicks, icon: <MousePointerClick size={18} className="text-amber-600" />, color: 'bg-amber-50' },
          { label: '转化数', value: overview.conversions, icon: <ArrowRightLeft size={18} className="text-purple-600" />, color: 'bg-purple-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">分享趋势</h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500" />分享</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-400" />浏览</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trend} barGap={4}>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="shares" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} name="分享" />
              <Bar dataKey="views" fill="#60a5fa" radius={[4, 4, 0, 0]} maxBarSize={24} name="浏览" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-amber-500" />
            <h3 className="font-semibold text-gray-900">热门内容</h3>
          </div>
          <div className="space-y-3">
            {topContent.map((item, i) => (
              <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  i === 0 ? 'bg-amber-100 text-amber-700' :
                  i === 1 ? 'bg-gray-100 text-gray-600' :
                  i === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {contentIcons[item.type]}
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Share2 size={11} />{item.shares}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Eye size={11} />{item.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                      <ArrowRightLeft size={11} />{item.conversions}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                      {contentLabels[item.type]}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                      {item.channel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
