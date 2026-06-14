import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Weight,
  User,
  Phone,
  Package,
  FileText,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { useAuthStore } from '@/stores/authStore'
import { requestRaw } from '@/utils/api'

interface FreightDetail {
  id: string
  origin: string
  destination: string
  goods_type: string
  weight: number
  freight_fee: number
  need_vat: number
  status: string
  shipper_name: string
  shipper_phone: string
  invoice_company_name: string
  invoice_tax_no: string
  description: string
  created_at: string
}

export default function FreightDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const isDriver = user?.role === 'driver'

  const [freight, setFreight] = useState<FreightDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!id) return
    const token = localStorage.getItem('token')
    requestRaw<{ success: boolean; data: FreightDetail }>(`/api/freights/${id}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(res => setFreight(res.data)).catch(e => setError(e.message))
  }, [id])

  const handleAccept = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      await requestRaw<{ success: boolean; data: any }>(`/api/freights/${id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: user?.id }),
      })
      setToast('接单成功！')
      setTimeout(() => navigate('/orders'), 1200)
    } catch (e: any) {
      setError(e.message || '接单失败')
    } finally {
      setLoading(false)
    }
  }

  if (!freight && !error) {
    return <div className="text-center py-16 text-gray-400">加载中...</div>
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-navy-500">货源详情</h1>
      </div>

      {toast && (
        <div className="mb-4 p-3 bg-mint-50 border border-mint-200 text-mint-700 rounded-lg text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          {toast}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-coral-50 border border-coral-200 text-coral-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {freight && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                <span className="text-xl font-bold text-gray-900">
                  {freight.origin} → {freight.destination}
                </span>
              </div>
              <StatusBadge variant={freight.status === 'open' ? 'warning' : 'info'}>
                {freight.status === 'open' ? '待接单' : freight.status === 'accepted' ? '已接单' : '已取消'}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Package className="h-4 w-4 text-gray-400" />
                <span>货物：{freight.goods_type}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Weight className="h-4 w-4 text-gray-400" />
                <span>重量：{freight.weight}吨</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                <span className="text-amber-500 text-lg">¥{freight.freight_fee?.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4 text-gray-400" />
                <span>运费总额</span>
              </div>
            </div>

            {freight.need_vat ? (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge variant="warning">需专票</StatusBadge>
                </div>
                <p className="text-sm text-amber-700">
                  开票主体：{freight.invoice_company_name || '-'}
                </p>
                {freight.invoice_tax_no && (
                  <p className="text-xs text-amber-600 mt-0.5">税号：{freight.invoice_tax_no}</p>
                )}
              </div>
            ) : null}

            {freight.description && (
              <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                备注：{freight.description}
              </p>
            )}

            <p className="mt-4 text-xs text-gray-400">发布时间：{freight.created_at}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">货主信息</h2>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-navy-50 flex items-center justify-center">
                <User className="h-6 w-6 text-navy-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{freight.shipper_name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {freight.shipper_phone || '未提供'}
                </p>
              </div>
            </div>
          </div>

          {isDriver && (
            <div className="space-y-3">
              {freight.status === 'open' ? (
                <button
                  onClick={handleAccept}
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '接单中...' : '确认接单'}
                </button>
              ) : (
                <div className="text-center py-4 text-gray-500 bg-white rounded-xl border border-gray-100">
                  该货源已被接单
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
