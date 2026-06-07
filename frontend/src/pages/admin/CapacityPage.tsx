import { useState, useEffect } from 'react'
import { Map, Users, Package } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { admin } from '../../api'

export default function CapacityPage() {
  const [grids, setGrids] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCapacity()
  }, [])

  const loadCapacity = async () => {
    try {
      const res: any = await admin.getCapacity()
      setGrids(Array.isArray(res) ? res : [])
    } catch {
      setGrids([])
    } finally {
      setLoading(false)
    }
  }

  const getGridColor = (level: string) => {
    if (level === 'shortage') return 'bg-red-50 border-red-200 text-red-800'
    if (level === 'oversupply') return 'bg-green-50 border-green-200 text-green-800'
    return 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }

  const getGridBadge = (level: string) => {
    if (level === 'shortage') return '运力不足'
    if (level === 'oversupply') return '运力充足'
    return '供需平衡'
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

  const totalOnline = grids.reduce((sum: number, g: any) => sum + (g.online_riders || 0), 0)
  const totalPending = grids.reduce((sum: number, g: any) => sum + (g.pending_orders || 0), 0)

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-secondary">运力看板</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={<Users size={24} />} label="总在线骑手" value={totalOnline} accentColor="border-success" />
        <StatCard icon={<Package size={24} />} label="总待派订单" value={totalPending} accentColor="border-primary" />
        <StatCard icon={<Map size={24} />} label="区域数量" value={grids.length} accentColor="border-secondary" />
      </div>

      {/* Grid Cards */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h2 className="font-display text-lg font-bold text-secondary mb-4">区域运力分布</h2>
        {grids.length === 0 ? (
          <p className="text-gray-400 text-center py-8">暂无区域运力数据</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {grids.map((grid: any) => (
              <div
                key={grid.grid_id || grid.grid_name}
                className={`p-4 rounded-xl border ${getGridColor(getDemandSupplyLevel(grid))}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold">{grid.grid_name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 font-medium">
                    {getGridBadge(getDemandSupplyLevel(grid))}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="opacity-70">在线骑手</span>
                    <p className="font-bold">{grid.online_riders || 0}</p>
                  </div>
                  <div>
                    <span className="opacity-70">待派订单</span>
                    <p className="font-bold">{grid.pending_orders || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
