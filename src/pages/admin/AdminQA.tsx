import {
  BarChart3,
  Star,
  ThumbsUp,
  ThumbsDown,
  PieChart as PieIcon,
  Cloud,
  TrendingUp,
  MessageSquare,
  Play,
  ChevronRight,
  Search,
  Filter,
  Calendar,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import StatCard from '@/components/StatCard';
import KeywordCloud from '@/components/KeywordCloud';
import { useAdminStore } from '@/store/useAdminStore';
import { cn } from '@/lib/utils';

export default function AdminQA() {
  const qaAnalysis = useAdminStore((state) => state.qaAnalysis);
  const qaRecords = useAdminStore((state) => state.qaRecords);

  const positiveRate =
    qaAnalysis.totalReviews > 0
      ? ((qaAnalysis.positiveReviews / qaAnalysis.totalReviews) * 100).toFixed(1)
      : '0';

  return (
    <div className="flex min-h-screen bg-cream-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title="质检分析" subtitle="全面监控服务质量，洞察用户反馈与改进方向" />
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="总评价数"
              value={qaAnalysis.totalReviews.toLocaleString()}
              icon={MessageSquare}
              trend={18.2}
              trendLabel="较上月"
              colorScheme="teal"
            />
            <StatCard
              title="平均评分"
              value={qaAnalysis.averageRating}
              suffix="/5.0"
              icon={Star}
              trend={3.5}
              trendLabel="较上月"
              colorScheme="orange"
            />
            <StatCard
              title="好评率"
              value={positiveRate}
              suffix="%"
              icon={ThumbsUp}
              trend={2.1}
              trendLabel="较上月"
              colorScheme="green"
            />
            <StatCard
              title="差评数"
              value={qaAnalysis.negativeReviews}
              icon={ThumbsDown}
              trend={-15.3}
              trendLabel="较上月"
              colorScheme="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-5">
                <PieIcon className="w-5 h-5 text-secondary-600" />
                <h3 className="text-lg font-bold text-secondary-800">差评根因分布</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qaAnalysis.rootCauses}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {qaAnalysis.rootCauses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary-600" />
                  <h3 className="text-lg font-bold text-secondary-800">月度评价趋势</h3>
                </div>
                <div className="flex items-center gap-4 text-xs text-secondary-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-secondary-500" />
                    好评
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary-500" />
                    差评
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={qaAnalysis.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1A535C" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1A535C" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="positive"
                      stroke="#1A535C"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorPositive)"
                      name="好评"
                    />
                    <Area
                      type="monotone"
                      dataKey="negative"
                      stroke="#FF6B35"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorNegative)"
                      name="差评"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Cloud className="w-5 h-5 text-secondary-600" />
                <h3 className="text-lg font-bold text-secondary-800">差评关键词云</h3>
              </div>
              <p className="text-sm text-secondary-500 mb-4">
                基于用户评价文本分析，展示高频出现的负面关键词
              </p>
              <div className="bg-secondary-50/50 rounded-xl min-h-[200px]">
                <KeywordCloud data={qaAnalysis.keywordCloud} />
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-secondary-600" />
                <h3 className="text-lg font-bold text-secondary-800">根因数量对比</h3>
              </div>
              <p className="text-sm text-secondary-500 mb-4">各类差评原因的数量统计</p>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qaAnalysis.rootCauses} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" stroke="#6B7280" fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#6B7280"
                      fontSize={12}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar dataKey="value" name="数量" radius={[0, 6, 6, 0]} barSize={20}>
                      {qaAnalysis.rootCauses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-secondary-600" />
                <h3 className="text-lg font-bold text-secondary-800">质检记录</h3>
                <span className="badge badge-gray">共 {qaRecords.length} 条</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                  <input
                    type="text"
                    placeholder="搜索订单号或关键词..."
                    className="pl-9 pr-4 py-2 bg-secondary-50 border border-transparent rounded-xl text-sm focus:outline-none focus:border-secondary-300 focus:bg-white transition-all w-56"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-secondary-50 text-secondary-600 rounded-xl text-sm font-medium hover:bg-secondary-100 transition-colors">
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary-50/50">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      质检ID
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      关联订单
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      根因分类
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      关键词
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      根因描述
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      评分
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      质检时间
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      录音
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {qaRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-secondary-50/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-secondary-800">
                        #{record.id}
                      </td>
                      <td className="px-5 py-4 text-sm text-secondary-700">
                        <button className="flex items-center gap-1 text-secondary-600 hover:text-secondary-800 font-medium">
                          #{record.order_id}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge badge-orange">{record.root_cause_category}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {record.keywords.map((k) => (
                            <span
                              key={k}
                              className="text-[11px] px-2 py-0.5 bg-secondary-50 text-secondary-600 rounded-full"
                            >
                              {k}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-secondary-600 max-w-xs truncate">
                        {record.root_cause}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-4 h-4',
                                i < record.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-200'
                              )}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-sm text-secondary-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(record.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary-50 text-secondary-600 rounded-lg text-xs font-medium hover:bg-secondary-100 transition-colors">
                          <Play className="w-3 h-3" />
                          播放
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {qaRecords.length === 0 && (
              <div className="p-16 text-center">
                <MessageSquare className="w-14 h-14 mx-auto text-secondary-300 mb-3" />
                <p className="text-secondary-500">暂无质检记录</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
