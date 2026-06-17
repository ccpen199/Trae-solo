import { useState } from 'react'
import { Search, Bike, Star, Package } from 'lucide-react'
import { RIDER_LEVELS } from '../../constants'

interface RiderInfo {
  id: string
  name: string
  phone: string
  level: number
  vehicleType: string
  isOnline: boolean
  status: 'active' | 'banned' | 'reviewing'
  orderCount: number
  rating: number
  todayOrders: number
  area: string
}

const mockRiders: RiderInfo[] = [
  { id: 'R001', name: '王建国', phone: '138****1001', level: 4, vehicleType: '电动车', isOnline: true, status: 'active', orderCount: 523, rating: 4.8, todayOrders: 12, area: '朝阳区' },
  { id: 'R002', name: '李明', phone: '139****1002', level: 3, vehicleType: '电动车', isOnline: true, status: 'active', orderCount: 245, rating: 4.6, todayOrders: 8, area: '海淀区' },
  { id: 'R003', name: '张伟', phone: '137****1003', level: 5, vehicleType: '摩托车', isOnline: false, status: 'active', orderCount: 1012, rating: 4.9, todayOrders: 0, area: '西城区' },
  { id: 'R004', name: '赵强', phone: '136****1004', level: 2, vehicleType: '电动车', isOnline: true, status: 'active', orderCount: 67, rating: 4.3, todayOrders: 5, area: '东城区' },
  { id: 'R005', name: '陈刚', phone: '135****1005', level: 1, vehicleType: '电动车', isOnline: false, status: 'reviewing', orderCount: 0, rating: 0, todayOrders: 0, area: '通州区' },
  { id: 'R006', name: '刘洋', phone: '134****1006', level: 3, vehicleType: '汽车', isOnline: true, status: 'active', orderCount: 312, rating: 4.5, todayOrders: 6, area: '丰台区' },
  { id: 'R007', name: '孙磊', phone: '133****1007', level: 2, vehicleType: '电动车', isOnline: false, status: 'banned', orderCount: 89, rating: 3.8, todayOrders: 0, area: '大兴区' },
  { id: 'R008', name: '周峰', phone: '132****1008', level: 4, vehicleType: '摩托车', isOnline: true, status: 'active', orderCount: 678, rating: 4.7, todayOrders: 10, area: '昌平区' },
]

const statusConfig: Record<RiderInfo['status'], { label: string; color: string }> = {
  active: { label: '活跃', color: '#10B981' },
  banned: { label: '封禁', color: '#EF4444' },
  reviewing: { label: '审核中', color: '#F59E0B' },
}

function getLevelInfo(level: number) {
  return RIDER_LEVELS.find((l) => l.level === level) || RIDER_LEVELS[0]
}

export default function Riders() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RiderInfo['status'] | 'all'>('all')

  const filtered = mockRiders.filter((r) => {
    const matchSearch = !search || r.name.includes(search) || r.id.includes(search) || r.phone.includes(search)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchStatus
  })

  const onlineCount = mockRiders.filter((r) => r.isOnline).length
  const activeCount = mockRiders.filter((r) => r.status === 'active').length
  const totalCount = mockRiders.length

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '1.5rem' }}>
      <h1 className="text-2xl font-bold text-white">骑手活跃度</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">在线骑手</span>
            <Bike className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{onlineCount}</div>
          <div className="mt-1 text-xs text-gray-500">总计 {totalCount} 人</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">活跃骑手</span>
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">{activeCount}</div>
          <div className="mt-1 text-xs text-gray-500">占比 {Math.round((activeCount / totalCount) * 100)}%</div>
        </div>
        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">今日总单量</span>
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">
            {mockRiders.reduce((s, r) => s + r.todayOrders, 0)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜索骑手姓名/ID/手机号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {(['all', 'active', 'banned', 'reviewing'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {s === 'all' ? '全部' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">骑手</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">等级</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">车辆</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">状态</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">在线</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">评分</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">总单量</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">今日</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">区域</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((rider) => {
              const levelInfo = getLevelInfo(rider.level)
              return (
                <tr key={rider.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{rider.name}</div>
                    <div className="text-xs text-gray-500">{rider.id} · {rider.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: levelInfo.color + '20', color: levelInfo.color }}
                    >
                      {levelInfo.name}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{rider.vehicleType}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: statusConfig[rider.status].color + '20', color: statusConfig[rider.status].color }}
                    >
                      {statusConfig[rider.status].label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${rider.isOnline ? 'bg-green-400' : 'bg-gray-600'}`} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-white">{rider.rating || '-'}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">{rider.orderCount}</td>
                  <td className="py-3 px-4 text-right text-white font-medium">{rider.todayOrders}</td>
                  <td className="py-3 px-4 text-gray-400">{rider.area}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
