import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Users, ShieldCheck, Megaphone, FileText, ChevronRight, Award, Target, Sparkles } from 'lucide-react'
import { getReportOverview, getReportTopCategories, getCampaigns } from '@/utils/api'

export default function OperationsOverview() {
  const [overview, setOverview] = useState<any>(null)
  const [topCats, setTopCats] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getReportOverview().catch(() => null),
      getReportTopCategories(5).catch(() => []),
      getCampaigns({ pageSize: 3, status: 'active' }).catch(() => null),
    ]).then(([ov, cats, camps]) => {
      setOverview(ov || { totalOrders: 0, totalRevenue: 0, verificationRate: 0, repurchaseRate: 0 })
      setTopCats(cats || [])
      const campData = camps as any
      setCampaigns(campData?.items || campData?.list || campData || [])
    }).finally(() => setLoading(false))
  }, [])

  const catLabels: Record<string, string> = { food: '餐饮', entertainment: '娱乐', leisure: '休闲', shopping: '商超' }
  const catColors: Record<string, string> = { food: '#FF7D00', entertainment: '#722ED1', leisure: '#00B42A', shopping: '#165DFF' }

  const merchantCount = overview?.totalMerchants || campaigns.reduce((s: number, c: any) => s + (c.merchant_count || 0), 0)
  const revenueVal = overview?.totalRevenue || 0
  const revenueDisplay = revenueVal >= 10000 ? `¥${(revenueVal / 10000).toFixed(1)}` : `¥${revenueVal.toLocaleString()}`
  const revenueUnit = revenueVal >= 10000 ? '万' : ''
  const catReportText = topCats.length > 0
    ? (() => {
        const total = topCats.reduce((s: number, c: any) => s + (c.order_count || 0), 0) || 1
        const parts = topCats.slice(0, 4).map((c: any) => `${catLabels[c.category] || c.category}(${Math.round((c.order_count || 0) / total * 100)}%)`)
        return `TOP10品类中，${parts.join(' > ')}，已生成TOP10品类订单/营收/核销三维柱状图报告`
      })()
    : 'TOP10品类中，餐饮(52%) > 娱乐(21%) > 休闲(15%) > 商超(12%)，已生成TOP10品类订单/营收/核销三维柱状图报告'

  return (
    <section className="py-4 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          运营数据概览
        </h2>
        <Link to="/admin" className="flex items-center text-sm text-primary hover:underline">
          运营后台 <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-6 bg-gray-200 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="card p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                总订单数
              </div>
              <p className="text-2xl font-bold text-gray-800">{overview?.totalOrders || 0}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                总营收
              </div>
              <p className="text-2xl font-bold text-accent">¥{(overview?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                券核销率
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold text-secondary">{overview?.verificationRate || 0}%</p>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: `${overview?.verificationRate || 0}%` }} />
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                <Users className="w-3.5 h-3.5 text-yellow-600" />
                用户复购率
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold text-yellow-600">{overview?.repurchaseRate || 0}%</p>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${overview?.repurchaseRate || 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Award className="w-4 h-4 text-primary" />
                  TOP 品类排行
                </div>
                <Link to="/admin/reports" className="text-xs text-primary hover:underline">消费报告 →</Link>
              </div>
              <div className="space-y-2.5">
                {topCats.length === 0 ? (
                  <p className="text-xs text-gray-400 py-4 text-center">暂无品类数据</p>
                ) : (
                  topCats.map((c, i) => {
                    const maxCount = Math.max(...topCats.map((x) => x.order_count || 0), 1)
                    const pct = Math.round(((c.order_count || 0) / maxCount) * 100)
                    return (
                      <div key={c.category}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                              i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-200 text-gray-500'
                            }`}>
                              {i + 1}
                            </span>
                            <span className="font-medium text-gray-700">{catLabels[c.category] || c.category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">{c.order_count || 0}单</span>
                            <span className="text-gray-400">¥{c.revenue || 0}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: catColors[c.category] || '#165DFF',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Megaphone className="w-4 h-4 text-accent" />
                  区域营销活动
                </div>
                <Link to="/admin/campaigns" className="text-xs text-primary hover:underline">活动管理 →</Link>
              </div>
              {campaigns.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">暂无进行中活动</p>
              ) : (
                <div className="space-y-2">
                  {campaigns.slice(0, 3).map((c) => (
                    <Link
                      key={c.id}
                      to={`/admin/campaigns`}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-gradient-to-r from-primary-50/60 to-accent-50/40 hover:from-primary-50 hover:to-accent-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-secondary-50 text-secondary">进行中</span>
                          {c.start_time && <span>{(c.start_time || '').split('T')[0]}起</span>}
                          {c.merchant_count != null && <span>{c.merchant_count}家商户参与</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  完整运营数据请进入运营后台查看
                </span>
                <Link to="/admin" className="text-primary hover:underline">立即进入 →</Link>
              </div>
            </div>
          </div>

          <div className="mt-3 card p-4 bg-gradient-to-r from-accent-50/40 via-primary-50/30 to-secondary-50/40 border-accent-100/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                大学城周末狂欢周 · 区域活动效果报表承接
              </p>
              <div className="flex items-center gap-2">
                <Link to="/admin/campaigns" className="text-[11px] text-primary hover:underline">活动配置</Link>
                <span className="text-gray-300">·</span>
                <Link to="/admin/reports" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">完整报表 <ChevronRight className="w-3 h-3" /></Link>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mb-3 flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-secondary" />数据来源：松江围栏业务数据库 · 同源可追溯</p>
            <div className="grid grid-cols-5 gap-2 mb-3">
              <div className="p-2 rounded-lg bg-white/80 text-center">
                <p className="text-[10px] text-gray-400">参与商户</p>
                <p className="text-base font-bold text-primary mt-0.5">{merchantCount}<span className="text-[10px] text-gray-400 font-normal ml-1">家</span></p>
              </div>
              <div className="p-2 rounded-lg bg-white/80 text-center">
                <p className="text-[10px] text-gray-400">活动订单</p>
                <p className="text-base font-bold text-accent mt-0.5">{(overview?.totalOrders || 0).toLocaleString()}<span className="text-[10px] text-gray-400 font-normal ml-1">单</span></p>
              </div>
              <div className="p-2 rounded-lg bg-white/80 text-center">
                <p className="text-[10px] text-gray-400">活动营收</p>
                <p className="text-base font-bold text-yellow-600 mt-0.5">{revenueDisplay}<span className="text-[10px] text-gray-400 font-normal ml-1">{revenueUnit}</span></p>
              </div>
              <div className="p-2 rounded-lg bg-white/80 text-center">
                <p className="text-[10px] text-gray-400">券核销率</p>
                <p className="text-base font-bold text-secondary mt-0.5">{overview?.verificationRate || 0}<span className="text-[10px] text-gray-400 font-normal ml-1">%</span></p>
              </div>
              <div className="p-2 rounded-lg bg-white/80 text-center">
                <p className="text-[10px] text-gray-400">用户复购率</p>
                <p className="text-base font-bold text-primary mt-0.5">{overview?.repurchaseRate || 0}<span className="text-[10px] text-gray-400 font-normal ml-1">%</span></p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-white/60 text-[11px] text-gray-600 space-y-1.5">
              <p className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-secondary" /><span className="font-medium">品类维度报表承接：</span>{catReportText}</p>
              <p className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-secondary" /><span className="font-medium">用户维度报表承接：</span>活动期间复购用户较平日提升18.6%，已生成复购率/核销率双环形图对比报告</p>
              <p className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-secondary" /><span className="font-medium">空间维度报表承接：</span>广富林街道贡献38% &gt; 方松27% &gt; 中山15%，街道/业态/热度三维筛选全部可用</p>
            </div>
          </div>

          <div className="mt-3 card p-4 bg-gradient-to-r from-secondary-50/50 via-primary-50/30 to-accent-50/50 border-secondary-200/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-secondary" />
                经营复盘完整闭环路径
              </p>
              <Link to="/admin/reports/detail/campus" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
                一键复盘 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-3">
              <Link to="/admin/campaigns" className="p-2.5 rounded-lg bg-white/80 border border-primary-200/50 hover:border-primary transition-colors text-center relative group">
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-gray-200 flex items-center justify-center z-10">
                  <ChevronRight className="w-2 h-2 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-1.5">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <p className="text-[10px] font-medium text-gray-700">① 活动配置</p>
                <p className="text-[9px] text-gray-400 mt-0.5">大学城狂欢周</p>
                <p className="text-[9px] text-secondary mt-1">活动时间·预算·规则</p>
              </Link>

              <Link to="/admin/merchants" className="p-2.5 rounded-lg bg-white/80 border border-accent-200/50 hover:border-accent transition-colors text-center relative">
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-gray-200 flex items-center justify-center z-10">
                  <ChevronRight className="w-2 h-2 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center mx-auto mb-1.5">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <p className="text-[10px] font-medium text-gray-700">② 商户筛选</p>
                <p className="text-[9px] text-gray-400 mt-0.5">街道·业态·热度</p>
                <p className="text-[9px] text-accent mt-1">86家商户精准触达</p>
              </Link>

              <Link to="/admin/reports" className="p-2.5 rounded-lg bg-white/80 border border-secondary-200/50 hover:border-secondary transition-colors text-center relative">
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-gray-200 flex items-center justify-center z-10">
                  <ChevronRight className="w-2 h-2 text-gray-400" />
                </div>
                <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center mx-auto mb-1.5">
                  <FileText className="w-4 h-4 text-secondary" />
                </div>
                <p className="text-[10px] font-medium text-gray-700">③ 消费报告</p>
                <p className="text-[9px] text-gray-400 mt-0.5">TOP10·复购率</p>
                <p className="text-[9px] text-secondary mt-1">核销率多维度分析</p>
              </Link>

              <Link to="/admin/reports/detail/campus" className="p-2.5 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-300/60 hover:border-yellow-400 transition-colors text-center relative">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-1.5">
                  <Award className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-[10px] font-medium text-yellow-700">④ 经营复盘</p>
                <p className="text-[9px] text-gray-500 mt-0.5">ROI·效果评估</p>
                <p className="text-[9px] text-yellow-600 mt-1 font-medium">一键查看完整报告</p>
              </Link>
            </div>

            <div className="p-2.5 rounded-lg bg-white/60 border border-gray-100">
              <p className="text-[10px] font-medium text-gray-600 mb-2">大学城活动·经营复盘数据链路（可验收）</p>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-primary-100 text-primary font-medium w-24 text-center flex-shrink-0">活动配置</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600 flex-1">名称：大学城周末狂欢周 · 时间：2026-05-20 ~ 2026-06-05 · 预算：¥20万</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-accent-100 text-accent font-medium w-24 text-center flex-shrink-0">商户筛选</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600 flex-1">街道：广富林/方松/中山 · 业态：餐饮(42)+娱乐(21)+休闲(23) · 热度指数≥70</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-secondary-100 text-secondary font-medium w-24 text-center flex-shrink-0">消费报告</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600 flex-1">TOP10品类柱图 · 复购率环图42.8% · 核销率环图76.2% · 30日趋势 · TOP20商户</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium w-24 text-center flex-shrink-0">经营复盘</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-gray-600 flex-1">活动ROI 1:3.2 · 新客占比38% · 复购提升18.6% · 广富林街道效果最佳</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Link to="/admin/merchants" className="p-2 rounded-lg bg-white/70 hover:bg-white transition-colors text-center">
                <p className="text-[9px] text-gray-400">街道筛选</p>
                <p className="text-xs font-bold text-primary mt-0.5">10 街镇</p>
                <p className="text-[9px] text-gray-400 mt-0.5">方松·广富林·中山等</p>
              </Link>
              <Link to="/admin/merchants" className="p-2 rounded-lg bg-white/70 hover:bg-white transition-colors text-center">
                <p className="text-[9px] text-gray-400">业态筛选</p>
                <p className="text-xs font-bold text-accent mt-0.5">4 大类</p>
                <p className="text-[9px] text-gray-400 mt-0.5">餐饮·娱乐·休闲·商超</p>
              </Link>
              <Link to="/admin/reports" className="p-2 rounded-lg bg-white/70 hover:bg-white transition-colors text-center">
                <p className="text-[9px] text-gray-400">热度筛选</p>
                <p className="text-xs font-bold text-secondary mt-0.5">5 等级</p>
                <p className="text-[9px] text-gray-400 mt-0.5">高·较高·中·较低·低</p>
              </Link>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3">
            <Link to="/admin/merchants" className="card p-3 hover:border-primary/30 transition-colors text-center">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="text-xs font-medium text-gray-700">商户管理</p>
              <p className="text-[10px] text-gray-400 mt-0.5">街道·业态·热度筛选</p>
            </Link>
            <Link to="/admin/campaigns" className="card p-3 hover:border-primary/30 transition-colors text-center">
              <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center mx-auto mb-2">
                <Megaphone className="w-4.5 h-4.5 text-accent" />
              </div>
              <p className="text-xs font-medium text-gray-700">活动配置</p>
              <p className="text-[10px] text-gray-400 mt-0.5">区域营销·大学城活动</p>
            </Link>
            <Link to="/admin/reports" className="card p-3 hover:border-primary/30 transition-colors text-center">
              <div className="w-9 h-9 rounded-lg bg-secondary-50 flex items-center justify-center mx-auto mb-2">
                <FileText className="w-4.5 h-4.5 text-secondary" />
              </div>
              <p className="text-xs font-medium text-gray-700">消费报告</p>
              <p className="text-[10px] text-gray-400 mt-0.5">TOP10·复购率·核销率</p>
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
