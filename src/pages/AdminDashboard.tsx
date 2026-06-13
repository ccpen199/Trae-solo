import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Users, Ticket, TrendingUp, MapPin, Clock, Award, AlertCircle, ChevronLeft, Layers, Zap, Shield } from 'lucide-react'
import { apiGet } from '@/utils/api'
import useAuthStore from '@/stores/authStore'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const [heatmapData, setHeatmapData] = useState<any>(null)
  const [salesRanking, setSalesRanking] = useState<any>(null)
  const [refundAnalysis, setRefundAnalysis] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'heatmap' | 'ranking' | 'refund'>('heatmap')

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') return
    apiGet<any>('/analytics/heatmap/1').then(setHeatmapData).catch(() => {})
    apiGet<any>('/analytics/sales-ranking?type=zone').then(setSalesRanking).catch(() => {})
    apiGet<any>('/analytics/refund-analysis').then(setRefundAnalysis).catch(() => {})
  }, [isLoggedIn, user?.role, activeTab])

  const statsCards = [
    { label: '总场次', value: '24', icon: Ticket, color: 'text-gold-500' },
    { label: '总出票', value: '3,842', icon: BarChart3, color: 'text-green-500' },
    { label: '总营收', value: '¥2,184,560', icon: TrendingUp, color: 'text-gold-500' },
    { label: '上座率', value: '78.5%', icon: MapPin, color: 'text-blue-400' },
  ]

  return (
    <div className="min-h-screen bg-gradient-dark">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <span className="text-gold-400 text-sm">管理员: {user?.realName}</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-gold-400 mb-2">运营数据大屏</h1>
            <p className="text-carbon-400 text-sm">实时监控演出销售与运营指标</p>
          </div>
          <Link to="/admin/organizers" className="wine-gradient-btn text-sm">
            主办方审核
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {statsCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="glass-card p-6 card-hover animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-carbon-400 text-sm">{card.label}</span>
                  <Icon size={20} className={card.color} />
                </div>
                <div className={`font-display text-3xl ${card.color}`}>{card.value}</div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'heatmap', label: '上座率热力图', icon: MapPin },
            { key: 'ranking', label: '区域销量TOP榜', icon: Award },
            { key: 'refund', label: '退票原因分析', icon: AlertCircle },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-wine-800/50 text-gold-400 border border-gold-500/30'
                    : 'glass-card text-carbon-300 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'heatmap' && (
          <div className="glass-card p-8">
            <h2 className="section-title mb-6">上座率热力图</h2>
            {heatmapData?.zones ? (
              <div className="space-y-6">
                {heatmapData.zones.map((zone: any) => (
                  <div key={zone.zoneId} className="border border-carbon-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color }} />
                        <span className="font-medium text-white">{zone.name}</span>
                      </div>
                      <span className="font-display text-xl text-gold-500">
                        {(zone.occupancyRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-3 bg-carbon-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${zone.occupancyRate * 100}%`,
                          backgroundColor: zone.color,
                          boxShadow: `0 0 20px ${zone.color}50`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-carbon-400">
                      <span>已售 {zone.soldSeats} 座</span>
                      <span>共 {zone.totalSeats} 座</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-carbon-500 py-12">加载中...</div>
            )}
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="glass-card p-8">
            <h2 className="section-title mb-6">区域销量TOP榜</h2>
            {salesRanking?.rankings ? (
              <div className="space-y-3">
                {salesRanking.rankings.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-xl bg-carbon-800/30 hover:bg-carbon-800/50 transition"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        idx === 0
                          ? 'bg-gold-500 text-carbon-950'
                          : idx === 1
                          ? 'bg-gray-300 text-carbon-950'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-carbon-700 text-carbon-300'
                      }`}
                    >
                      {item.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{item.name || item.title}</div>
                      <div className="text-xs text-carbon-400">{item.zone ? item.event_title : item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gold-500 font-display">{item.sales || 0} 张</div>
                      <div className="text-xs text-carbon-400">¥{(item.revenue || 0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-carbon-500 py-12">加载中...</div>
            )}
          </div>
        )}

        {activeTab === 'refund' && (
          <div className="glass-card p-8">
            <h2 className="section-title mb-6">退票原因聚类分析</h2>
            {refundAnalysis?.clusters ? (
              <div>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="glass-card p-5 text-center">
                    <div className="text-2xl font-display text-wine-400 mb-1">{refundAnalysis.feeStats?.totalRefunds || 0}</div>
                    <div className="text-xs text-carbon-400">总退票数</div>
                  </div>
                  <div className="glass-card p-5 text-center">
                    <div className="text-2xl font-display text-gold-500 mb-1">
                      ¥{(refundAnalysis.feeStats?.totalRefundAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-carbon-400">退额总额</div>
                  </div>
                  <div className="glass-card p-5 text-center">
                    <div className="text-2xl font-display text-green-400 mb-1">
                      ¥{(refundAnalysis.feeStats?.totalFeeAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-carbon-400">手续费收入</div>
                  </div>
                  <div className="glass-card p-5 text-center">
                    <div className="text-2xl font-display text-blue-400 mb-1">
                      {((refundAnalysis.feeStats?.refundRate || 0) * 100).toFixed(2)}%
                    </div>
                    <div className="text-xs text-carbon-400">退票率</div>
                  </div>
                </div>

                <h3 className="text-lg font-medium text-white mb-4">原因分布</h3>
                <div className="space-y-4 mb-8">
                  {refundAnalysis.clusters.map((c: any, idx: number) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                          <span className="text-white text-sm">{c.label}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gold-500 font-bold">{c.count}</span>
                          <span className="text-carbon-400 ml-2">({(c.percentage * 100).toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-carbon-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${c.percentage * 100}%`, backgroundColor: c.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-medium text-white mb-4">近7日趋势</h3>
                <div className="flex items-end gap-2 h-40">
                  {refundAnalysis.timeDistribution?.map((d: any, idx: number) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-wine-800/80 to-gold-500/80 rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(10, (d.count / 20) * 100)}%` }}
                      />
                      <span className="text-xs text-carbon-400">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-carbon-500 py-12">加载中...</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
