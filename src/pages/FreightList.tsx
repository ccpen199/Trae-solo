import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Weight, PackagePlus, Filter } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { requestRaw } from '@/utils/api'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'

interface FreightItem {
  id: string
  origin: string
  destination: string
  goods_type: string
  weight: number
  freight_fee: number
  need_vat: number
  status: string
  shipper_name: string
  invoice_company_name: string
  description: string
  created_at: string
}

export default function FreightList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [freights, setFreights] = useState<FreightItem[]>([])
  const [needVatFilter, setNeedVatFilter] = useState('')
  const [originFilter, setOriginFilter] = useState('')

  useEffect(() => {
    loadFreights()
  }, [needVatFilter])

  const loadFreights = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = '/api/freights?pageSize=50&status=open'
      if (needVatFilter) url += `&needVat=${needVatFilter}`
      if (originFilter) url += `&origin=${encodeURIComponent(originFilter)}`
      const res = await requestRaw<{ success: boolean; list: FreightItem[]; total: number }>(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      setFreights(res.list || [])
    } catch {}
  }

  return (
    <div>
      <PageHeader
        title="货源大厅"
        action={
          user?.role === 'shipper'
            ? { label: '发布货源', icon: PackagePlus, onClick: () => navigate('/freight/create') }
            : undefined
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">筛选</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={needVatFilter}
            onChange={(e) => setNeedVatFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          >
            <option value="">全部发票</option>
            <option value="true">需专票</option>
            <option value="false">普通</option>
          </select>
          <input
            type="text"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            placeholder="搜索出发地"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && loadFreights()}
          />
        </div>
      </div>

      <div className="space-y-3">
        {freights.length === 0 && (
          <div className="text-center py-16 text-gray-400">暂无可接货源</div>
        )}
        {freights.map((freight) => (
          <div
            key={freight.id}
            onClick={() => navigate(`/freight/${freight.id}`)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <span className="text-base font-semibold text-gray-900">
                    {freight.origin} → {freight.destination}
                  </span>
                  {freight.need_vat ? (
                    <StatusBadge variant="warning">专票</StatusBadge>
                  ) : null}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <PackagePlus className="h-3.5 w-3.5" />
                    {freight.goods_type}
                  </span>
                  <span className="flex items-center gap-1">
                    <Weight className="h-3.5 w-3.5" />
                    {freight.weight}吨
                  </span>
                  {freight.invoice_company_name && (
                    <span className="text-xs text-amber-600">开票：{freight.invoice_company_name}</span>
                  )}
                </div>
                {freight.description && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{freight.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-500">¥{freight.freight_fee?.toFixed(2)}</p>
                <p className="text-xs text-gray-400">{freight.shipper_name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {user?.role === 'shipper' && (
        <button
          onClick={() => navigate('/freight/create')}
          className="fixed bottom-20 right-6 md:bottom-8 md:right-8 h-14 w-14 rounded-full bg-amber-500 text-white shadow-lg flex items-center justify-center hover:bg-amber-600 transition-colors z-10"
        >
          <PackagePlus className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
