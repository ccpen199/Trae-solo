import { useEffect, useState } from 'react'
import { X, MapPin, Package, Clock, Weight } from 'lucide-react'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { api } from '@/utils/api'

interface CargoItem {
  id: string
  fromCity: string
  toCity: string
  cargoType: string
  weight: number
  mode: string
  price: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  driverName?: string
}

const defaultCargo: CargoItem[] = [
  { id: '1', fromCity: '上海', toCity: '杭州', cargoType: '生鲜', weight: 15, mode: '整车', price: 2800, status: 'active', createdAt: '2026-06-01 08:30', driverName: '张伟' },
  { id: '2', fromCity: '北京', toCity: '天津', cargoType: '建材', weight: 30, mode: '整车', price: 1800, status: 'pending', createdAt: '2026-06-01 09:15' },
  { id: '3', fromCity: '广州', toCity: '深圳', cargoType: '电子', weight: 5, mode: '零担', price: 800, status: 'completed', createdAt: '2026-05-31 14:20', driverName: '李强' },
  { id: '4', fromCity: '武汉', toCity: '长沙', cargoType: '冷链', weight: 10, mode: '整车', price: 3200, status: 'active', createdAt: '2026-06-01 10:00', driverName: '王刚' },
  { id: '5', fromCity: '成都', toCity: '重庆', cargoType: '大件', weight: 25, mode: '整车', price: 4500, status: 'pending', createdAt: '2026-06-01 11:30' },
  { id: '6', fromCity: '郑州', toCity: '武汉', cargoType: '日用品', weight: 8, mode: '拼车', price: 1200, status: 'cancelled', createdAt: '2026-05-30 16:45' },
  { id: '7', fromCity: '西安', toCity: '郑州', cargoType: '化工', weight: 20, mode: '整车', price: 5500, status: 'completed', createdAt: '2026-05-29 09:00', driverName: '赵军' },
]

const statusLabels: Record<string, { status: 'pending' | 'active' | 'completed' | 'cancelled'; label: string }> = {
  pending: { status: 'pending', label: '待接单' },
  active: { status: 'active', label: '运输中' },
  completed: { status: 'completed', label: '已完成' },
  cancelled: { status: 'cancelled', label: '已取消' },
}

export default function Cargo() {
  const [cargoList, setCargoList] = useState<CargoItem[]>(defaultCargo)
  const [selected, setSelected] = useState<CargoItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    api.get<CargoItem[]>('/cargo/list').then(setCargoList).catch(() => {})
  }, [])

  const filtered = cargoList.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (typeFilter !== 'all' && c.cargoType !== typeFilter) return false
    return true
  })

  const columns = [
    { key: 'fromCity', title: '出发地', sortable: true, render: (row: CargoItem) => (
      <span className="flex items-center gap-1"><MapPin size={12} className="text-muted" />{row.fromCity}</span>
    )},
    { key: 'toCity', title: '目的地', sortable: true, render: (row: CargoItem) => (
      <span className="flex items-center gap-1"><MapPin size={12} className="text-accent" />{row.toCity}</span>
    )},
    { key: 'cargoType', title: '货物类型', sortable: true, render: (row: CargoItem) => (
      <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{row.cargoType}</span>
    )},
    { key: 'weight', title: '重量', sortable: true, render: (row: CargoItem) => `${row.weight}吨` },
    { key: 'price', title: '运价', sortable: true, render: (row: CargoItem) => (
      <span className="font-mono font-semibold text-accent">¥{row.price.toLocaleString()}</span>
    )},
    { key: 'status', title: '状态', render: (row: CargoItem) => <StatusBadge {...statusLabels[row.status]} /> },
    { key: 'createdAt', title: '创建时间', sortable: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">货源管理</h1>
        <p className="text-sm text-secondary mt-0.5">管理所有发布的货源信息</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-secondary">状态:</span>
        {['all', 'pending', 'active', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-secondary hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? '全部' : statusLabels[s]?.label || s}
          </button>
        ))}
        <span className="text-xs text-secondary ml-4">类型:</span>
        {['all', '生鲜', '冷链', '建材', '大件', '电子', '日用品', '化工'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              typeFilter === t ? 'bg-accent text-white' : 'bg-gray-100 text-secondary hover:bg-gray-200'
            }`}
          >
            {t === 'all' ? '全部' : t}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="card">
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={(row) => setSelected(row)}
            />
          </div>
        </div>

        {selected && (
          <div className="w-80 card relative shrink-0 self-start">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100"
            >
              <X size={14} className="text-muted" />
            </button>
            <h3 className="text-sm font-semibold text-primary mb-4">货源详情</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-muted" />
                <span className="font-medium text-primary">{selected.fromCity} → {selected.toCity}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Package size={14} />
                <span>{selected.cargoType} · {selected.mode}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Weight size={14} />
                <span>{selected.weight}吨</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <Clock size={14} />
                <span>{selected.createdAt}</span>
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">运价</span>
                  <span className="text-xl font-bold font-mono text-accent">¥{selected.price.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">状态</span>
                <StatusBadge {...statusLabels[selected.status]} />
              </div>
              {selected.driverName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-secondary">司机</span>
                  <span className="text-sm font-medium text-primary">{selected.driverName}</span>
                </div>
              )}
              {selected.status === 'pending' && (
                <button className="w-full mt-2 btn-accent text-sm">编辑货源</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
