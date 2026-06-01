import { useEffect, useState } from 'react'
import { api, Stats } from '@/lib/api'
import { 
  Box, 
  Factory, 
  Wrench, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Repeat
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const res = await api.getStats()
      if (res.success) {
        setStats(res.data)
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8">加载中...</div>
  if (!stats) return <div className="text-center py-8">加载失败</div>

  const statCards = [
    { label: '模具总数', value: stats.totalMolds, icon: Box, color: 'bg-blue-500' },
    { label: '生产中', value: stats.inUseMolds, icon: Factory, color: 'bg-green-500' },
    { label: '维修中', value: stats.maintenanceMolds, icon: Wrench, color: 'bg-orange-500' },
    { label: '空闲可用', value: stats.idleMolds, icon: CheckCircle, color: 'bg-teal-500' },
    { label: '接近寿命', value: stats.nearEndOfLife, icon: AlertTriangle, color: 'bg-red-500' },
    { label: '累计产量', value: stats.totalProduced.toLocaleString(), icon: Clock, color: 'bg-purple-500' },
    { label: '待验收', value: stats.pendingMaintenance, icon: Clock, color: 'bg-yellow-500' },
    { label: '重复故障', value: stats.repeatedFaults, icon: Repeat, color: 'bg-rose-500' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">统计看板</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">系统状态</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">模具状态分布</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600 w-20">生产中</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.totalMolds > 0 ? (stats.inUseMolds / stats.totalMolds) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">{stats.inUseMolds}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm text-gray-600 w-20">维修中</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.totalMolds > 0 ? (stats.maintenanceMolds / stats.totalMolds) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">{stats.maintenanceMolds}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-teal-500 mr-2"></div>
                <span className="text-sm text-gray-600 w-20">空闲</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-teal-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.totalMolds > 0 ? (stats.idleMolds / stats.totalMolds) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">{stats.idleMolds}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">预警信息</h4>
            <div className="space-y-2">
              {stats.nearEndOfLife > 0 && (
                <div className="flex items-center text-red-600 bg-red-50 px-3 py-2 rounded">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  <span className="text-sm">{stats.nearEndOfLife} 套模具接近寿命上限</span>
                </div>
              )}
              {stats.pendingMaintenance > 0 && (
                <div className="flex items-center text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">{stats.pendingMaintenance} 项维修待验收</span>
                </div>
              )}
              {stats.repeatedFaults > 0 && (
                <div className="flex items-center text-rose-600 bg-rose-50 px-3 py-2 rounded">
                  <Repeat className="w-4 h-4 mr-2" />
                  <span className="text-sm">{stats.repeatedFaults} 次重复故障记录</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
