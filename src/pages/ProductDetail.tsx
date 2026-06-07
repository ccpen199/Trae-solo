import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Package, Shield, Minus, Plus, MapPin, Phone, BadgeCheck } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface Product {
  id: number
  name: string
  description: string | null
  price: number
  original_price: number
  cover_image: string | null
  images: string[]
  stock: number
  sales: number
  traceability_code: string | null
  traceability_info: string | null
  merchant_name: string | null
  merchant_logo: string | null
  merchant_address: string | null
}

interface AddressForm {
  consignee: string
  phone: string
  address: string
}

const TRACE_STEPS = [
  { label: '原产地', icon: '🏔️' },
  { label: '加工', icon: '🏭' },
  { label: '质检', icon: '✅' },
  { label: '物流', icon: '🚚' },
  { label: '销售', icon: '🏪' },
]

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [addressForm, setAddressForm] = useState<AddressForm>({ consignee: '', phone: '', address: '' })
  const [ordering, setOrdering] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!id) return
    api.get<Product>(`/products/${id}`)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleBuy = () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    setShowAddressModal(true)
  }

  const handleOrder = async () => {
    if (!id || !addressForm.consignee || !addressForm.phone || !addressForm.address) return
    setOrdering(true)
    setMessage(null)
    try {
      await api.post('/orders', {
        product_id: Number(id),
        quantity,
        consignee: addressForm.consignee,
        phone: addressForm.phone,
        address: addressForm.address,
      })
      setMessage({ type: 'success', text: '下单成功！' })
      setShowAddressModal(false)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '下单失败' })
    } finally {
      setOrdering(false)
    }
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">加载中...</div>
  }

  if (!product) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">商品不存在</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-amber-50 rounded-xl h-80 lg:h-96 flex items-center justify-center">
          <Package className="w-24 h-24 text-amber-300" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-bold text-red-500">¥{product.price}</span>
            {product.original_price > product.price && (
              <span className="text-lg text-gray-400 line-through">¥{product.original_price}</span>
            )}
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>库存：{product.stock}</p>
            <p>已售：{product.sales}</p>
          </div>

          {product.merchant_name && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="font-medium text-gray-700">{product.merchant_name}</p>
              {product.merchant_address && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {product.merchant_address}
                </p>
              )}
            </div>
          )}

          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">数量</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {message && (
            <div className={`mt-4 px-4 py-3 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleBuy}
            disabled={product.stock === 0}
            className="mt-6 w-full bg-red-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {product.stock === 0 ? '已售罄' : '立即购买'}
          </button>
        </div>
      </div>

      {product.description && (
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">商品详情</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{product.description}</p>
        </div>
      )}

      {product.traceability_code && (
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            货品溯源
          </h2>

          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">溯源码</p>
            <p className="text-xl font-mono font-bold text-green-700">{product.traceability_code}</p>
          </div>

          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-green-200" />
            <div className="relative flex justify-between">
              {TRACE_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-lg z-10">
                    {step.icon}
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {product.traceability_info && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 whitespace-pre-wrap">{product.traceability_info}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <BadgeCheck className="w-6 h-6 text-amber-600 shrink-0" />
        <span className="font-medium text-amber-800">广电信用担保</span>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">填写收货地址</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">收货人</label>
                <input
                  type="text"
                  value={addressForm.consignee}
                  onChange={(e) => setAddressForm((f) => ({ ...f, consignee: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="请输入收货人姓名"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">手机号</label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">收货地址</label>
                <textarea
                  value={addressForm.address}
                  onChange={(e) => setAddressForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  rows={3}
                  placeholder="请输入详细收货地址"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddressModal(false)}
                className="flex-1 border border-gray-200 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleOrder}
                disabled={ordering || !addressForm.consignee || !addressForm.phone || !addressForm.address}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {ordering ? '提交中...' : '确认下单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
