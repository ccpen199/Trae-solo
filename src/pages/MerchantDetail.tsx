import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Store, MapPin, Phone, Package } from 'lucide-react'
import { api } from '@/lib/api'

interface MerchantProduct {
  id: number
  name: string
  price: number
  original_price: number
  cover_image: string | null
  sales: number
}

interface MerchantDetail {
  id: number
  name: string
  description: string | null
  logo: string | null
  cover_image: string | null
  contact_phone: string | null
  address: string | null
  status: string
  products: MerchantProduct[]
}

export default function MerchantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [merchant, setMerchant] = useState<MerchantDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    api.get<MerchantDetail>(`/merchants/${id}`)
      .then(setMerchant)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">加载中...</div>
  }

  if (!merchant) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">商户不存在</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-start gap-5">
          <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center shrink-0">
            <Store className="w-10 h-10 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{merchant.name}</h1>
            {merchant.description && (
              <p className="text-gray-500 mt-2 whitespace-pre-wrap">{merchant.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
              {merchant.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {merchant.address}
                </span>
              )}
              {merchant.contact_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {merchant.contact_phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-500" />
          商品列表
        </h2>

        {merchant.products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">暂无商品</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {merchant.products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="bg-amber-50 h-36 flex items-center justify-center">
                  <Package className="w-10 h-10 text-amber-300" />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-base font-bold text-red-500">¥{product.price}</span>
                    {product.original_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">¥{product.original_price}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">已售 {product.sales}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
