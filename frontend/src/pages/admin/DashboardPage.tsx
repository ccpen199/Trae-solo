import { useState, useEffect } from 'react'
import { Users, Wifi, Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { admin, dispatch } from '../../api'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [grids, setGrids] = useState<any[]>([])
  const [risks, setRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [dashRes, gridRes, riskRes]: any[] = await Promise.all([
        admin.getDashboard(),
        dispatch.getGridHeatmap(),
        admin.listRiskAudits({ pageSize: 5 }),
      ])
      setStats(dashRes)
      setGrids(Array.isArray(gridRes) ? gridRes : [])
      const riskData: any = riskRes
      setRisks(Array.isArray(riskData) ? riskData.slice(0, 5) : (riskData?.list || []).slice(0, 5))
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const getGridColor = (level: string) => {
    if (level === 'shortage') return 'bg-red-100 border-red-300 text-red-800'
    if (level === 'oversupply') return 'bg-green-100 border-green-300 text-green-800'
    return 'bg-yellow-100 border-yellow-300 text-yellow-800'
  }

  const getDemandSupplyLevel = (grid: any) => {
    const levels: Record<string, number> = { low: 1, medium: 2, high: 3 }
    const d = levels[grid.demand_level] || 2
    const s = levels[grid.supply_level] || 2
    if (d > s) return 'shortage'
    if (d < s) return 'oversupply'
    return 'balanced'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-secondary">数据看板</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={<Users size={24} />} label="总骑手数" value={stats?.total_riders || 0} accentColor="border-secondary" />
        <StatCard icon={<Wifi size={24} />} label="在线骑手" value={stats?.online_riders || 0} accentColor="border-success" />
        <StatCard icon={<Package size={24} />} label="今日订单" value={stats?.today_orders || 0} accentColor="border-primary" />
        <StatCard icon={<CheckCircle size={24} />} label="完单率" value={`${stats?.completion_rate || 0}%`} accentColor="border-accent" />
        <StatCard icon={<Clock size={24} />} label="平均响应" value={`${stats?.avg_response_time || 0}分`} accentColor="border-warning" />
        <StatCard icon={<Package size={24} />} label="总订单" value={stats?.total_orders || 0} accentColor="border-primary" />
      </div>

      {/* Grid Heatmap */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-display text-lg font-bold text-secondary mb-4">区域运力热力图</h2>
        {grids.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无区域数据</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {grids.map((grid: any) => (
              <div
                key={grid.id || grid.grid_name}
                className={`p-3 rounded-lg border ${getGridColor(getDemandSupplyLevel(grid))}`}
              >
                <p className="font-medium text-sm">{grid.grid_name}</p>
                <div className="text-xs mt-1 opacity-80">
                  在线: {grid.online_riders || 0} | 待派: {grid.pending_orders || 0}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Risk Alerts */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-display text-lg font-bold text-secondary mb-4">最近风险预警</h2>
        {risks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无风险预警</p>
        ) : (
          <div className="space-y-2">
            {risks.map((risk: any) => (
              <div key={risk.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle size={16} className="text-danger shrink-0" />
                <div className="flex-1 text-sm">
                  <span className="font-medium text-secondary">{risk.rider_name || `骑手#${risk.rider_id}`}</span>
                  <span className="text-gray-500 ml-2">{risk.description}</span>
                </div>
                <span className={`status-badge ${risk.risk_level === 'high' ? 'status-appealing' : risk.risk_level === 'medium' ? 'status-delivering' : 'status-pending'}`}>
                  {risk.risk_level === 'high' ? '高' : risk.risk_level === 'medium' ? '中' : '低'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
