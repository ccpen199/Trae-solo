import { useEffect, useState } from 'react'
import { Zap, Layers, Users, Package, Loader2 } from 'lucide-react'
import { api, buildQuery } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Zone {
  id: number
  name: string
  online_riders: number
  pending_orders: number
}

interface HeatmapZone {
  id: number
  name: string
  order_count: number
  rider_count: number
  gap: number
}

interface Rider {
  id: number
  name: string
  status: string
  service_score: number
  phone: string
}

interface Order {
  id: number
  order_no: string
  status: string
  pickup_address: string
  delivery_address: string
}

interface DispatchCandidate {
  rider_id: number
  rider_name: string
  score: number
  distance_score: number
  timeliness_score: number
  load_score: number
  fulfillment_score: number
}

function HeatmapGrid({ zones }: { zones: HeatmapZone[] }) {
  const maxOrders = Math.max(...zones.map((z) => z.order_count), 1)
  const cols = Math.ceil(Math.sqrt(zones.length))
  return (
    <svg viewBox="0 0 400 300" className="w-full">
      {zones.map((zone, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const cellW = 400 / cols
        const cellH = 300 / Math.ceil(zones.length / cols)
        const intensity = zone.order_count / maxOrders
        const r = Math.round(30 + intensity * 200)
        const g = Math.round(58 + intensity * 60)
        const b = Math.round(95 - intensity * 50)
        return (
          <g key={zone.id}>
            <rect
              x={col * cellW + 2}
              y={row * cellH + 2}
              width={cellW - 4}
              height={cellH - 4}
              rx={8}
              fill={`rgb(${r},${g},${b})`}
            />
            <text x={col * cellW + cellW / 2} y={row * cellH + cellH / 2 - 10} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              {zone.name.length > 6 ? zone.name.slice(0, 6) + '...' : zone.name}
            </text>
            <text x={col * cellW + cellW / 2} y={row * cellH + cellH / 2 + 8} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10">
              {zone.order_count}单 / {zone.rider_count}人
            </text>
            {zone.gap > 0 && (
              <text x={col * cellW + cellW / 2} y={row * cellH + cellH / 2 + 22} textAnchor="middle" fill="rgba(255,180,50,0.9)" fontSize="9">
                缺口{zone.gap}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function DispatchCenter() {
  const addToast = useAppStore((s) => s.addToast)
  const [zones, setZones] = useState<Zone[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapZone[]>([])
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [riders, setRiders] = useState<Rider[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [candidates, setCandidates] = useState<DispatchCandidate[]>([])
  const [batchResult, setBatchResult] = useState<any>(null)
  const [dispatching, setDispatching] = useState(false)

  useEffect(() => {
    api<Zone[]>('/api/zones').then((r) => {
      if (r.success) setZones(r.data!)
    })
    api<HeatmapZone[]>('/api/zones/heatmap').then((r) => {
      if (r.success) setHeatmap(r.data!)
    })
  }, [])

  useEffect(() => {
    if (!selectedZone) {
      setRiders([])
      setOrders([])
      return
    }
    api<{ list: Rider[] }>(`/api/riders${buildQuery({ zone_id: selectedZone, status: 'online', page_size: 20 })}`).then((r) => {
      if (r.success) setRiders(r.data!.list)
    })
    api<{ list: Order[] }>(`/api/orders${buildQuery({ zone_id: selectedZone, status: 'pending', page_size: 20 })}`).then((r) => {
      if (r.success) setOrders(r.data!.list)
    })
  }, [selectedZone])

  async function handleAutoDispatch(orderId: number) {
    setDispatching(true)
    const res = await api<{ order_id: number; candidates: DispatchCandidate[] }>('/api/zones/dispatch/auto', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    })
    setDispatching(false)
    if (res.success) {
      setCandidates(res.data!.candidates)
      addToast('智能调度完成', 'success')
    } else {
      addToast(res.error || '调度失败', 'error')
    }
  }

  async function handleBatchDispatch() {
    if (!selectedZone) {
      addToast('请选择区域', 'error')
      return
    }
    setDispatching(true)
    const res = await api('/api/zones/dispatch/batch', {
      method: 'POST',
      body: JSON.stringify({ zone_id: Number(selectedZone) }),
    })
    setDispatching(false)
    if (res.success) {
      setBatchResult(res.data)
      addToast('批量调度完成', 'success')
    } else {
      addToast(res.error || '批量调度失败', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">区域调度中心</h1>
        <div className="flex items-center gap-3">
          <select className="select-base" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)}>
            <option value="">选择区域</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
          <button onClick={handleBatchDispatch} disabled={dispatching || !selectedZone} className="btn-accent flex items-center gap-1">
            {dispatching ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />}
            批量调度
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Layers size={16} className="text-primary" /> 区域热力图
        </h2>
        {heatmap.length > 0 ? (
          <HeatmapGrid zones={heatmap} />
        ) : (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Users size={16} className="text-emerald-500" />
            <h3 className="font-semibold text-gray-900">区域在线骑手</h3>
            <span className="text-xs text-gray-400 ml-auto">{riders.length}人</span>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {selectedZone ? (
              riders.length > 0 ? (
                <div className="space-y-2">
                  {riders.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div>
                        <span className="text-sm font-medium text-gray-800">{r.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{r.phone}</span>
                      </div>
                      <span className="text-xs text-gray-500">服务分 {r.service_score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">该区域暂无在线骑手</div>
              )
            ) : (
              <div className="text-center text-gray-400 py-4">请先选择区域</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package size={16} className="text-orange-500" />
            <h3 className="font-semibold text-gray-900">待调度订单</h3>
            <span className="text-xs text-gray-400 ml-auto">{orders.length}单</span>
          </div>
          <div className="p-4 max-h-[300px] overflow-y-auto">
            {selectedZone ? (
              orders.length > 0 ? (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-primary">{o.order_no}</div>
                        <div className="text-xs text-gray-400 truncate">{o.pickup_address} → {o.delivery_address}</div>
                      </div>
                      <button
                        onClick={() => handleAutoDispatch(o.id)}
                        disabled={dispatching}
                        className="btn-primary text-xs px-2.5 py-1 ml-2 flex-shrink-0 flex items-center gap-1"
                      >
                        <Zap size={12} /> 调度
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">该区域暂无待调度订单</div>
              )
            ) : (
              <div className="text-center text-gray-400 py-4">请先选择区域</div>
            )}
          </div>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Zap size={16} className="text-accent" /> 调度候选结果 (Top 5)
          </h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 py-2">排名</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">骑手</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">综合评分</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">距离</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">时效</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">负载</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">履约</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, idx) => (
                <tr key={c.rider_id} className="border-b border-gray-50">
                  <td className="py-2.5 text-sm font-medium">{idx + 1}</td>
                  <td className="py-2.5 text-sm">{c.rider_name}</td>
                  <td className="py-2.5 text-sm font-bold text-primary">{c.score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.distance_score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.timeliness_score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.load_score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.fulfillment_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {batchResult && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Layers size={16} className="text-accent" /> 批量调度结果
          </h3>
          <div className="space-y-3">
            {batchResult.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-800">订单 #{item.order_id}</div>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {item.candidates?.map((c: DispatchCandidate, ci: number) => (
                    <div key={ci} className="text-xs text-gray-600">
                      {ci + 1}. {c.rider_name} ({c.score}分)
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
