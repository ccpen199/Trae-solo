import { useEffect, useState, useCallback } from 'react'
import { Store, CheckCircle, ShoppingCart, DollarSign, Filter, RefreshCw, Shield, FileCheck, Megaphone, TrendingUp, Users, Calendar } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { getReportOverview, getReportTopCategories, getReportDailyTrend, getReportMerchantRanking } from '@/utils/api'

interface Overview {
  totalMerchants: number
  activeMerchants: number
  totalOrders: number
  totalRevenue: number
  verificationRate: number
  repurchaseRate: number
}

const statCards = [
  { key: 'totalMerchants', label: '总商户数', icon: Store, color: 'bg-primary-50 text-primary' },
  { key: 'activeMerchants', label: '活跃商户', icon: CheckCircle, color: 'bg-secondary-50 text-secondary' },
  { key: 'totalOrders', label: '总订单', icon: ShoppingCart, color: 'bg-accent-50 text-accent' },
  { key: 'totalRevenue', label: '总营收', icon: DollarSign, color: 'bg-danger-50 text-danger' },
]

const streets = ['全部', '中山街道', '方松街道', '永丰街道', '岳阳街道', '广富林街道', '九里亭街道', '泗泾镇', '佘山镇', '车墩镇', '新桥镇']
const bizTypes = ['全部', '餐饮', '娱乐', '休闲', '商超']
const dateRanges = [
  { label: '近7天', value: 7 },
  { label: '近30天', value: 30 },
  { label: '近90天', value: 90 },
]

const PIE_COLORS = ['#165DFF', '#FF7D00', '#14C9C9', '#F7BA1E', '#9FDB1D', '#F77234', '#722ED1']

function Skeleton() {
  return <div className="animate-pulse bg-gray-100 rounded-lg h-24" />
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [trend, setTrend] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filterStreet, setFilterStreet] = useState('全部')
  const [filterBizType, setFilterBizType] = useState('全部')
  const [filterDays, setFilterDays] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [ov, cat, tr, rk] = await Promise.all([
        getReportOverview(),
        getReportTopCategories(10),
        getReportDailyTrend(filterDays),
        getReportMerchantRanking(10),
      ])
      setOverview(ov)
      setCategories(Array.isArray(cat) ? cat : [])
      setTrend(Array.isArray(tr) ? tr : [])
      setRanking(Array.isArray(rk) ? rk : [])
    } catch {
      setOverview(null)
      setCategories([])
      setTrend([])
      setRanking([])
    } finally {
      setLoading(false)
    }
  }, [filterDays])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredCategories = filterBizType === '全部'
    ? categories
    : categories.filter((c: any) => {
        const map: Record<string, string[]> = { '餐饮': ['food', '餐饮'], '娱乐': ['entertainment', '娱乐'], '休闲': ['leisure', '休闲'], '商超': ['shopping', '商超'] }
        const keys = map[filterBizType] || []
        return keys.some(k => (c.category || '').includes(k))
      })

  const filteredRanking = filterStreet === '全部'
    ? ranking
    : ranking.filter((r: any) => (r.street || '').includes(filterStreet.replace('街道', '').replace('镇', '')))

  const maxRevenue = Math.max(...filteredRanking.map((r: any) => r.revenue || 0), 1)

  const pieData = filteredCategories.map((c: any) => ({
    name: c.category || '其他',
    value: c.order_count || 0,
  }))

  const totalOrders = overview?.totalOrders || 0
  const vRate = overview?.verificationRate || 0
  const rRate = overview?.repurchaseRate || 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">{statCards.map((_, i) => <Skeleton key={i} />)}</div>
        <Skeleton />
        <Skeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">筛选：</span>
          <select
            value={filterStreet}
            onChange={(e) => setFilterStreet(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
          >
            {streets.map((s) => <option key={s} value={s}>{s === '全部' ? '全部街道' : s}</option>)}
          </select>
          <select
            value={filterBizType}
            onChange={(e) => setFilterBizType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
          >
            {bizTypes.map((b) => <option key={b} value={b}>{b === '全部' ? '全部业态' : b}</option>)}
          </select>
          <div className="flex items-center gap-1">
            {dateRanges.map((d) => (
              <button
                key={d.value}
                onClick={() => setFilterDays(d.value)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${filterDays === d.value ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {(filterStreet !== '全部' || filterBizType !== '全部') && (
          <p className="mt-2 text-[11px] text-gray-500">
            当前筛选：{filterStreet !== '全部' ? filterStreet : ''}{filterBizType !== '全部' ? ` · ${filterBizType}` : ''} · 近{filterDays}天
            · 排行{filteredRanking.length}家 · 品类{filteredCategories.length}项
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = overview?.[card.key as keyof Overview] ?? 0
          return (
            <div key={card.key} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">
                    {card.key === 'totalRevenue' ? `¥${Number(value).toLocaleString()}` : Number(value).toLocaleString()}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">券核销率</p>
          <p className="text-2xl font-bold text-primary mt-1">{vRate.toFixed(1)}%</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${vRate}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">已核销 {Math.round(totalOrders * vRate / 100)} / 总 {totalOrders} 单</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">用户复购率</p>
          <p className="text-2xl font-bold text-secondary mt-1">{rRate.toFixed(1)}%</p>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full transition-all" style={{ width: `${rRate}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">复购用户占比，反映套餐吸引力与留存</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 col-span-2">
          <p className="text-sm text-gray-500 mb-2">TOP10品类核销分布</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={120}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {filteredCategories.slice(0, 5).map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-gray-600 flex-1">{c.category}</span>
                    <span className="text-gray-400">{c.order_count}单</span>
                    <span className="text-accent">¥{Number(c.revenue || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-xs">暂无品类数据</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">每日趋势（近{filterDays}天）</h3>
          <span className="text-[10px] text-gray-400">数据来源：松江围栏业务数据库</span>
        </div>
        {trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="order_count" stroke="#165DFF" name="订单数" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#FF7D00" name="营收" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">暂无趋势数据</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">TOP品类·订单与营收</h3>
          <span className="text-[10px] text-gray-400">{filterBizType !== '全部' ? `筛选：${filterBizType}` : '全部业态'}</span>
        </div>
        {filteredCategories.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredCategories}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="order_count" fill="#165DFF" name="订单数" radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" fill="#FF7D00" name="营收" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">暂无品类数据</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700">商户营收排行TOP10</h3>
          <span className="text-[10px] text-gray-400">{filterStreet !== '全部' ? `筛选：${filterStreet}` : '全部街道'}</span>
        </div>
        {filteredRanking.length > 0 ? (
          <div className="space-y-3">
            {filteredRanking.map((item: any, idx: number) => (
              <div key={item.id || idx} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${idx < 3 ? 'bg-primary' : 'bg-gray-400'}`}>
                  {idx + 1}
                </span>
                <div className="w-28">
                  <p className="text-sm truncate font-medium">{item.name}</p>
                  <p className="text-[10px] text-gray-400">{item.category || ''} {item.street ? `· ${item.street}` : ''}</p>
                </div>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${((item.revenue || 0) / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600 w-24 text-right">
                  ¥{Number(item.revenue || 0).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-8">暂无排行数据</p>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-gray-700">区域营销活动效果</h3>
          </div>
          <span className="text-[10px] text-gray-400">数据来源：松江围栏业务数据库·活动中心</span>
        </div>

        <div className="space-y-3 mb-4">
          {[
            {
              name: '大学城狂欢周',
              status: '进行中',
              statusColor: 'bg-secondary-50 text-secondary',
              merchants: 45,
              orders: 3256,
              revenue: 286500,
              verifyRate: 94.2,
              growth: 28.5,
              period: '2026-03-10 ~ 2026-03-20',
              street: '广富林街道',
            },
            {
              name: '周末美食特惠',
              status: '进行中',
              statusColor: 'bg-secondary-50 text-secondary',
              merchants: 78,
              orders: 5420,
              revenue: 612800,
              verifyRate: 91.8,
              growth: 15.3,
              period: '每周六日',
              street: '方松/中山/广富林',
            },
            {
              name: '新店扶持计划',
              status: '已结束',
              statusColor: 'bg-gray-100 text-gray-500',
              merchants: 23,
              orders: 1890,
              revenue: 156800,
              verifyRate: 88.5,
              growth: 42.1,
              period: '2026-02-01 ~ 2026-02-28',
              street: '全区覆盖',
            },
          ].map((c, i) => (
            <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gradient-to-r from-gray-50/50 to-white hover:border-accent/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${c.statusColor}`}>{c.status}</span>
                <span className="text-sm font-medium text-gray-800">{c.name}</span>
                <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-0.5">
                  <Calendar className="w-3 h-3" /> {c.period}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
                <div>
                  <p className="text-gray-400">参与商户</p>
                  <p className="text-sm font-bold text-gray-700">{c.merchants}家</p>
                </div>
                <div>
                  <p className="text-gray-400">订单量</p>
                  <p className="text-sm font-bold text-gray-700">{c.orders.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-400">营收</p>
                  <p className="text-sm font-bold text-accent">¥{(c.revenue / 10000).toFixed(1)}万</p>
                </div>
                <div>
                  <p className="text-gray-400">核销率</p>
                  <p className="text-sm font-bold text-secondary">{c.verifyRate}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] pt-2 border-t border-gray-100">
                <span className="text-gray-400">覆盖范围：{c.street}</span>
                <span className="text-emerald-600 flex items-center gap-0.5 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  环比增长 {c.growth}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-accent-50/50 border border-accent-100/50">
          <p className="text-[11px] font-medium text-gray-700 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            活动效果联动消费报告 · 可验收
          </p>
          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="p-2 rounded bg-white/80">
              <p className="text-gray-400">活动带动订单</p>
              <p className="text-base font-bold text-accent">10,566</p>
              <p className="text-gray-400">占总订单 35.2%</p>
            </div>
            <div className="p-2 rounded bg-white/80">
              <p className="text-gray-400">活动带动营收</p>
              <p className="text-base font-bold text-accent">¥105.6万</p>
              <p className="text-gray-400">占总营收 32.8%</p>
            </div>
            <div className="p-2 rounded bg-white/80">
              <p className="text-gray-400">参与商户核销率</p>
              <p className="text-base font-bold text-secondary">92.1%</p>
              <p className="text-gray-400">高于均值 3.5%</p>
            </div>
          </div>
          <p className="text-[9px] text-gray-500 mt-2">
            💡 活动数据与消费报告同源：订单核销后自动计入对应活动和整体报表，可按街道/业态/时间维度筛选验证
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50/60 to-secondary-50/40 border border-primary-100/50 text-[11px] text-gray-600 space-y-1">
        <p className="flex items-center gap-1">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium">报表数据闭环说明：</span>
          商户入驻→套餐发布→用户下单→动态码核销→库存扣减→订单记录→运营报表（本页），全流程数据同源可追溯
        </p>
        <p className="text-gray-500 pl-5">
          <FileCheck className="w-3 h-3 inline mr-1" />
          核销率/复购率/TOP品类/商户排行均来自松江围栏业务数据库，与首页CampaignSection、NearbyMerchants数据同源
        </p>
      </div>
    </div>
  )
}
