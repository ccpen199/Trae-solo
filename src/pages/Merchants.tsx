import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, MapPin, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface Merchant {
  id: number
  name: string
  description: string | null
  logo: string | null
  address: string | null
  status: string
  product_count: number
  user_id?: number
}

interface MyMerchant {
  id: number
  name: string
  status: string
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle className="w-4 h-4" /> },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle className="w-4 h-4" /> },
}

export default function Merchants() {
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuthStore()
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [myMerchant, setMyMerchant] = useState<MyMerchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [applyForm, setApplyForm] = useState({ name: '', description: '', contact_phone: '', address: '', owner_name: '', license_no: '' })
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const [applySuccess, setApplySuccess] = useState(false)

  useEffect(() => {
    api.get<{ list: Merchant[]; total: number }>('/merchants?status=approved')
      .then((data) => setMerchants(data.list))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !user) return
    api.get<{ list: Merchant[]; total: number }>('/merchants')
      .then((data) => {
        const mine = data.list.find((m) => m.user_id === user.id)
        if (mine) {
          setMyMerchant({ id: mine.id, name: mine.name, status: mine.status, created_at: (mine as any).created_at || '' })
        }
      })
      .catch(() => {})
  }, [isLoggedIn, user])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplyError('')
    setApplying(true)
    try {
      await api.post('/merchants', applyForm)
      setApplySuccess(true)
      setShowApplyForm(false)
      const data = await api.get<{ list: Merchant[]; total: number }>('/merchants')
      const mine = data.list.find((m) => m.user_id === user?.id)
      if (mine) {
        setMyMerchant({ id: mine.id, name: mine.name, status: mine.status, created_at: (mine as any).created_at || '' })
      }
    } catch (err: any) {
      setApplyError(err.message || '申请失败')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">本地商户</h1>
      </div>

      {isLoggedIn && myMerchant && (
        <div className="mb-6 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            入驻审核进度
          </h2>
          <div className="flex items-center gap-3">
            <span className="font-medium text-gray-900">{myMerchant.name}</span>
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${statusConfig[myMerchant.status]?.color || 'bg-gray-100 text-gray-600'}`}>
              {statusConfig[myMerchant.status]?.icon}
              {statusConfig[myMerchant.status]?.label || myMerchant.status}
            </span>
          </div>
        </div>
      )}

      {isLoggedIn && !myMerchant && !applySuccess && (
        <div className="mb-6">
          {!showApplyForm ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
              <p className="text-blue-700 text-sm">想成为平台商户？入驻后即可发布商品</p>
              <button
                onClick={() => setShowApplyForm(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                申请入驻
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">申请入驻</h2>
              {applyError && <div className="bg-red-50 text-red-600 px-4 py-2 rounded mb-4 text-sm">{applyError}</div>}
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商户名称</label>
                  <input type="text" required value={applyForm.name} onChange={(e) => setApplyForm({ ...applyForm, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">商户简介</label>
                  <textarea value={applyForm.description} onChange={(e) => setApplyForm({ ...applyForm, description: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                    <input type="text" required value={applyForm.owner_name} onChange={(e) => setApplyForm({ ...applyForm, owner_name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                    <input type="tel" required value={applyForm.contact_phone} onChange={(e) => setApplyForm({ ...applyForm, contact_phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                  <input type="text" required value={applyForm.address} onChange={(e) => setApplyForm({ ...applyForm, address: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">营业执照号</label>
                  <input type="text" required value={applyForm.license_no} onChange={(e) => setApplyForm({ ...applyForm, license_no: e.target.value })} className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={applying} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {applying ? '提交中...' : '提交申请'}
                  </button>
                  <button type="button" onClick={() => { setShowApplyForm(false); setApplyError('') }} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {applySuccess && !myMerchant && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-green-700 font-medium">申请已提交，请等待审核</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : merchants.length === 0 ? (
        <div className="text-center py-20 text-gray-400">暂无商户</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {merchants.map((merchant) => (
            <div
              key={merchant.id}
              onClick={() => navigate(`/merchants/${merchant.id}`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center shrink-0">
                  <Store className="w-8 h-8 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{merchant.name}</h3>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">
                      已认证
                    </span>
                  </div>
                  {merchant.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{merchant.description}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                {merchant.address && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {merchant.address}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-gray-500">
                <Package className="w-4 h-4" />
                <span>{merchant.product_count} 件商品</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
