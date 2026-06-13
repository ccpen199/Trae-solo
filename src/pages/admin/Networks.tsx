import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, MapPin, Phone, Clock, Edit3, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react'

interface NetworkPoint {
  id: string
  name: string
  address: string
  phone: string
  business_hours: string
  lat: number
  lng: number
  service_radius: number
  coverage_polygon: number[][]
  status: 'active' | 'inactive'
}

const BOUNDS = { minLat: 30.9, maxLat: 31.5, minLng: 121.1, maxLng: 121.8 }
const W = 400, H = 280

function project(lng: number, lat: number) {
  return {
    x: ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * W,
    y: (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * H,
  }
}

function rToSvg(r: number) {
  return (r / 111 / (BOUNDS.maxLng - BOUNDS.minLng)) * W
}

const emptyForm: typeof formInit = { name: '', address: '', phone: '', business_hours: '', lat: 31.23, lng: 121.47, service_radius: 3, status: 'active' as const }

const formInit = { name: '', address: '', phone: '', business_hours: '', lat: 0, lng: 0, service_radius: 0, status: 'active' as 'active' | 'inactive' }

export default function Networks() {
  const [list, setList] = useState<NetworkPoint[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchList = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' })
    if (search) params.set('name', search)
    if (statusFilter) params.set('status', statusFilter)
    const res = await fetch(`/api/networks?${params}`)
    const json = await res.json()
    if (json.success) {
      setList(json.data.list)
      setTotal(json.data.total)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchList() }, [fetchList])

  const selected = list.find((n) => n.id === selectedId) || null

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * W
    const svgY = ((e.clientY - rect.top) / rect.height) * H
    const lng = BOUNDS.minLng + (svgX / W) * (BOUNDS.maxLng - BOUNDS.minLng)
    const lat = BOUNDS.minLat + (1 - svgY / H) * (BOUNDS.maxLat - BOUNDS.minLat)
    setForm((p) => ({ ...p, lat: parseFloat(lat.toFixed(4)), lng: parseFloat(lng.toFixed(4)) }))
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (n: NetworkPoint) => {
    setEditingId(n.id)
    setForm({ name: n.name, address: n.address, phone: n.phone, business_hours: n.business_hours, lat: n.lat, lng: n.lng, service_radius: n.service_radius, status: n.status })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const body = { name: form.name, address: form.address, phone: form.phone, business_hours: form.business_hours, lat: form.lat, lng: form.lng, service_radius: form.service_radius, status: form.status }
    if (editingId) {
      await fetch(`/api/networks/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch('/api/networks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false)
    setShowForm(false)
    fetchList()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await fetch(`/api/networks/${deleteId}`, { method: 'DELETE' })
    setDeleteId(null)
    if (selectedId === deleteId) setSelectedId(null)
    fetchList()
  }

  const set = (k: string, v: string | number) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <div className="flex gap-4 h-[calc(100vh-7rem)]">
      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-lighter" />
            <input className="input-field pl-9 text-sm" placeholder="搜索网点名称" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="input-field w-24 text-sm" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as '' | 'active' | 'inactive'); setPage(1) }}>
            <option value="">全部</option>
            <option value="active">营业中</option>
            <option value="inactive">停业</option>
          </select>
        </div>

        <button onClick={openAdd} className="btn-primary flex items-center justify-center gap-1.5 text-sm py-2">
          <Plus className="w-4 h-4" /> 新增网点
        </button>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
          {list.map((n) => (
            <div key={n.id} onClick={() => setSelectedId(n.id)} className={`card p-3 cursor-pointer transition-all ${selectedId === n.id ? 'ring-2 ring-accent shadow-md' : 'card-hover'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-navy truncate">{n.name}</span>
                <span className={n.status === 'active' ? 'badge-success' : 'badge-danger'}>{n.status === 'active' ? '营业中' : '停业'}</span>
              </div>
              <div className="space-y-0.5 ml-0.5">
                <p className="text-xs text-text-light flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" />{n.address}</p>
                <p className="text-xs text-text-light flex items-center gap-1"><Clock className="w-3 h-3 flex-shrink-0" />{n.business_hours}</p>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button onClick={(e) => { e.stopPropagation(); openEdit(n) }} className="text-xs text-accent hover:text-accent-dark flex items-center gap-0.5"><Edit3 className="w-3 h-3" />编辑</button>
                <button onClick={(e) => { e.stopPropagation(); setDeleteId(n.id) }} className="text-xs text-danger hover:text-red-700 flex items-center gap-0.5"><Trash2 className="w-3 h-3" />删除</button>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="text-center text-sm text-text-lighter py-8">暂无网点数据</p>}
        </div>

        {total > 20 && (
          <div className="flex items-center justify-center gap-2 text-xs text-text-light">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-outline px-2 py-1 text-xs disabled:opacity-40">上一页</button>
            <span>{page} / {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)} className="btn-outline px-2 py-1 text-xs disabled:opacity-40">下一页</button>
          </div>
        )}
      </div>

      <div className="flex-1 card p-4 flex flex-col">
        <h2 className="section-title text-sm mb-2">网点分布图</h2>
        <div className="flex-1 bg-surface/50 rounded-lg overflow-hidden">
          <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" onClick={handleMapClick} style={{ cursor: 'crosshair' }}>
            <rect width={W} height={H} fill="#E8ECF1" rx="4" />
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * (H / 7)} x2={W} y2={i * (H / 7)} stroke="#D2D8E0" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={`v${i}`} x1={i * (W / 7)} y1="0" x2={i * (W / 7)} y2={H} stroke="#D2D8E0" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <text key={`lh${i}`} x="4" y={i * (H / 7) + 12} fontSize="7" fill="#A0AEC0">{(BOUNDS.maxLat - i * ((BOUNDS.maxLat - BOUNDS.minLat) / 7)).toFixed(2)}</text>
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <text key={`lv${i}`} x={i * (W / 7) + 2} y={H - 4} fontSize="7" fill="#A0AEC0">{(BOUNDS.minLng + i * ((BOUNDS.maxLng - BOUNDS.minLng) / 7)).toFixed(2)}</text>
            ))}
            {list.map((n) => {
              const { x, y } = project(n.lng, n.lat)
              const r = rToSvg(n.service_radius)
              const isSel = n.id === selectedId
              return (
                <g key={n.id} onClick={(e) => { e.stopPropagation(); setSelectedId(n.id) }} style={{ cursor: 'pointer' }}>
                  <circle cx={x} cy={y} r={r} fill={isSel ? '#FF6B35' : '#0F2B46'} opacity={0.07} />
                  <circle cx={x} cy={y} r={r} fill="none" stroke={isSel ? '#FF6B35' : '#0F2B46'} strokeWidth="1" strokeDasharray="4 3" opacity={0.35} />
                  <circle cx={x} cy={y} r={isSel ? 8 : 6} fill={isSel ? '#FF6B35' : '#0F2B46'} />
                  <circle cx={x} cy={y} r={isSel ? 3.5 : 2.5} fill="white" />
                  <text x={x} y={y - (isSel ? 12 : 10)} fontSize="8" fill={isSel ? '#FF6B35' : '#0F2B46'} textAnchor="middle" fontWeight="600">{n.name}</text>
                </g>
              )
            })}
          </svg>
        </div>
        {selected && (
          <div className="mt-3 p-3 bg-surface rounded-lg flex items-center gap-4 text-xs">
            <span className="font-bold text-navy">{selected.name}</span>
            <span className="text-text-light flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.address}</span>
            <span className="text-text-light flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span>
            <span className="text-accent font-medium">半径 {selected.service_radius}km</span>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy text-lg">{editingId ? '编辑网点' : '新增网点'}</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-text-lighter" /></button>
            </div>
            <div className="space-y-3">
              <input className="input-field text-sm" placeholder="网点名称" value={form.name} onChange={(e) => set('name', e.target.value)} />
              <input className="input-field text-sm" placeholder="地址" value={form.address} onChange={(e) => set('address', e.target.value)} />
              <input className="input-field text-sm" placeholder="联系电话" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              <input className="input-field text-sm" placeholder="营业时间 (如 08:00-20:00)" value={form.business_hours} onChange={(e) => set('business_hours', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <input className="input-field text-sm" placeholder="纬度" type="number" step="0.0001" value={form.lat} onChange={(e) => set('lat', parseFloat(e.target.value) || 0)} />
                <input className="input-field text-sm" placeholder="经度" type="number" step="0.0001" value={form.lng} onChange={(e) => set('lng', parseFloat(e.target.value) || 0)} />
              </div>
              <p className="text-xs text-text-lighter">💡 点击地图可自动填入坐标</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-light">服务半径 (km)</span>
                <input className="input-field w-24 text-sm text-center" type="number" step="0.5" min="0.5" max="20" value={form.service_radius} onChange={(e) => set('service_radius', parseFloat(e.target.value) || 1)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-light">状态</span>
                <button onClick={() => set('status', form.status === 'active' ? 'inactive' : 'active')} className="flex items-center gap-2 text-sm">
                  {form.status === 'active' ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8 text-text-lighter" />}
                  <span className={form.status === 'active' ? 'text-success font-medium' : 'text-text-lighter'}>{form.status === 'active' ? '营业中' : '停业'}</span>
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="btn-outline flex-1 text-sm">取消</button>
              <button onClick={handleSave} disabled={saving || !form.name} className="btn-primary flex-1 text-sm disabled:opacity-50">{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-slide-up text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6 text-danger" />
            </div>
            <h3 className="font-bold text-navy text-lg mb-1">确认删除</h3>
            <p className="text-sm text-text-light mb-5">删除后不可恢复，确定要删除该网点吗？</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-outline flex-1 text-sm">取消</button>
              <button onClick={handleDelete} className="bg-danger text-white font-medium rounded-lg px-6 py-2.5 flex-1 text-sm hover:bg-red-700 active:scale-95 transition-all">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
