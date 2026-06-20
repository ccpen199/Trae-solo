import { useState } from 'react'
import { BedDouble, CheckCircle2, Wrench } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import StatCard from '../../components/StatCard'
import { institutions } from '../../data/mockData'

type BedStatus = 'available' | 'occupied' | 'maintenance'

interface BedInfo {
  id: string
  floor: number
  room: string
  bed: string
  status: BedStatus
  elderName?: string
}

const generateBeds = (instId: string, totalBeds: number, availableBeds: number): BedInfo[] => {
  const beds: BedInfo[] = []
  const maintenanceCount = Math.floor(totalBeds * 0.03)
  const occupiedCount = totalBeds - availableBeds - maintenanceCount
  let floor = 1
  let room = 1
  let bedInRoom = 1
  const roomsPerFloor = 10
  const bedsPerRoom = 2

  for (let i = 0; i < totalBeds; i++) {
    let status: BedStatus
    if (i < occupiedCount) status = 'occupied'
    else if (i < occupiedCount + availableBeds) status = 'available'
    else status = 'maintenance'

    beds.push({
      id: `${instId}-F${floor}-R${room}-B${bedInRoom}`,
      floor,
      room: `${floor}${String(room).padStart(2, '0')}`,
      bed: `${bedInRoom}号床`,
      status,
      elderName: status === 'occupied' ? `老人${i + 1}` : undefined,
    })

    bedInRoom++
    if (bedInRoom > bedsPerRoom) {
      bedInRoom = 1
      room++
      if (room > roomsPerFloor) {
        room = 1
        floor++
      }
    }
  }
  return beds
}

const bedDataMap: Record<string, BedInfo[]> = {}
institutions.forEach((inst) => {
  bedDataMap[inst.id] = generateBeds(inst.id, inst.totalBeds, inst.availableBeds)
})

const trendData = [
  { month: '1月', 可用: 245, 已住: 890, 维护: 12 },
  { month: '2月', 可用: 230, 已住: 905, 维护: 12 },
  { month: '3月', 可用: 255, 已住: 880, 维护: 12 },
  { month: '4月', 可用: 240, 已住: 895, 维护: 15 },
  { month: '5月', 可用: 220, 已住: 910, 维护: 20 },
  { month: '6月', 可用: 275, 已住: 870, 维护: 5 },
]

const statusColors: Record<BedStatus, string> = {
  available: 'bg-green-400 hover:bg-green-500',
  occupied: 'bg-red-400 hover:bg-red-500',
  maintenance: 'bg-yellow-400 hover:bg-yellow-500',
}

const statusLabels: Record<BedStatus, string> = {
  available: '空闲',
  occupied: '入住',
  maintenance: '维护',
}

export default function BedManagement() {
  const [selectedInstId, setSelectedInstId] = useState(institutions[0].id)
  const [hoveredBed, setHoveredBed] = useState<BedInfo | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null)

  const beds = bedDataMap[selectedInstId]

  const totalAll = institutions.reduce((s, i) => s + i.totalBeds, 0)
  const availAll = institutions.reduce((s, i) => s + i.availableBeds, 0)
  const occupiedAll = totalAll - availAll
  const maintenanceAll = Math.floor(totalAll * 0.03)

  const filteredBeds = selectedFloor ? beds.filter((b) => b.floor === selectedFloor) : beds
  const floors = [...new Set(beds.map((b) => b.floor))].sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">床位实时管理</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="总床位数" value={totalAll} icon={<BedDouble className="w-5 h-5" />} color="blue" />
        <StatCard title="空闲床位" value={availAll} icon={<CheckCircle2 className="w-5 h-5" />} color="green" />
        <StatCard title="已入住" value={occupiedAll} icon={<BedDouble className="w-5 h-5" />} color="red" />
        <StatCard title="维护中" value={maintenanceAll} icon={<Wrench className="w-5 h-5" />} color="orange" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-700">床位平面图</h2>
            <select
              value={selectedInstId}
              onChange={(e) => {
                setSelectedInstId(e.target.value)
                setSelectedFloor(null)
                setHoveredBed(null)
              }}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400" />空闲</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400" />入住</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-yellow-400" />维护</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSelectedFloor(null)}
            className={`px-3 py-1 text-xs rounded-lg transition-colors ${selectedFloor === null ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            全部楼层
          </button>
          {floors.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFloor(f)}
              className={`px-3 py-1 text-xs rounded-lg transition-colors ${selectedFloor === f ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {f}F
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="flex flex-wrap gap-1">
            {filteredBeds.map((bed) => (
              <div
                key={bed.id}
                className={`w-5 h-5 rounded-sm cursor-pointer transition-colors ${statusColors[bed.status]}`}
                onMouseEnter={() => setHoveredBed(bed)}
                onMouseLeave={() => setHoveredBed(null)}
              />
            ))}
          </div>

          {hoveredBed && (
            <div className="absolute top-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-48 z-10">
              <div className="text-xs text-slate-400 mb-1">{hoveredBed.room}室 {hoveredBed.bed}</div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${statusColors[hoveredBed.status].split(' ')[0]}`} />
                <span className="text-sm font-medium text-slate-700">{statusLabels[hoveredBed.status]}</span>
              </div>
              {hoveredBed.elderName && (
                <div className="text-xs text-slate-500">入住: {hoveredBed.elderName}</div>
              )}
              <div className="text-xs text-slate-400 mt-1">{hoveredBed.floor}F</div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">机构床位统计</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">机构名称</th>
              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">总床位</th>
              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">空闲</th>
              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">已入住</th>
              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">入住率</th>
              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">入住率可视化</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {institutions.map((inst) => {
              const rate = Math.round(((inst.totalBeds - inst.availableBeds) / inst.totalBeds) * 100)
              return (
                <tr key={inst.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700 font-medium">{inst.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 text-center">{inst.totalBeds}</td>
                  <td className="px-4 py-3 text-sm text-green-600 text-center">{inst.availableBeds}</td>
                  <td className="px-4 py-3 text-sm text-red-600 text-center">{inst.totalBeds - inst.availableBeds}</td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`font-medium ${rate >= 90 ? 'text-red-600' : rate >= 70 ? 'text-amber-600' : 'text-green-600'}`}>
                      {rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rate >= 90 ? 'bg-red-500' : rate >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-base font-semibold text-slate-700 mb-4">床位可用趋势</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="可用" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="已住" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="维护" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
