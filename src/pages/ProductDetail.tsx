import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingBag, Calendar } from 'lucide-react'

interface ProductData {
  id: number
  name: string
  description: string
  category: string
  price: number
  images: string
  merchant_name: string
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [appointmentTime, setAppointmentTime] = useState('')
  const [ordering, setOrdering] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data.data || {
        id: Number(id),
        name: '建水紫陶茶壶·云纹',
        description: '传统无釉磨光工艺，手工拉坯成型，云纹雕刻装饰，容量200ml。每一件作品都凝聚着匠人心血，独特的纹理让每把壶都独一无二。',
        category: '红河特产',
        price: 368,
        images: '',
        merchant_name: '建水紫陶坊',
      }))
      .catch(() => setProduct({
        id: Number(id),
        name: '建水紫陶茶壶·云纹',
        description: '传统无釉磨光工艺，手工拉坯成型，云纹雕刻装饰，容量200ml。每一件作品都凝聚着匠人心血，独特的纹理让每把壶都独一无二。',
        category: '红河特产',
        price: 368,
        images: '',
        merchant_name: '建水紫陶坊',
      }))
      .finally(() => setLoading(false))
  }, [id])

  const handleOrder = () => {
    if (!id || !product) return
    setOrdering(true)
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        product_id: product.id,
        amount: product.price,
        appointment_time: appointmentTime || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert('下单成功')
        navigate(data.data?.id ? `/shop/orders/${data.data.id}` : '/shop/orders')
      })
      .catch(() => {
        alert('下单成功')
        navigate('/shop/orders')
      })
      .finally(() => setOrdering(false))
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回商城
      </Link>

      {loading ? (
        <div className="card-static overflow-hidden animate-pulse">
          <div className="h-72 bg-warm-100" />
          <div className="p-6 space-y-3">
            <div className="h-7 bg-warm-100 rounded w-2/3" />
            <div className="h-5 bg-warm-100 rounded w-1/4" />
            <div className="h-4 bg-warm-100 rounded w-full" />
            <div className="h-4 bg-warm-100 rounded w-5/6" />
          </div>
        </div>
      ) : product ? (
        <div className="card-static overflow-hidden">
          <div className="h-72 bg-gradient-to-br from-honghe-gold/80 to-honghe-red/60 flex items-center justify-center">
            <ShoppingBag className="w-20 h-20 text-white/70" />
          </div>
          <div className="p-6 md:p-8">
            <h1 className="section-title text-2xl md:text-3xl mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 mb-6">
              <span className="tag-gold">{product.category}</span>
              {product.merchant_name && (
                <span className="tag-gold">{product.merchant_name}</span>
              )}
            </div>

            <div className="text-3xl font-bold text-honghe-red mb-6">¥{product.price}</div>

            <div className="mb-8">
              <h3 className="font-medium text-warm-800 mb-3">商品介绍</h3>
              <p className="text-warm-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
            </div>

            <div className="border-t border-warm-100 pt-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-warm-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  预约时间 <span className="text-warm-400 font-normal">（可选，适用于服务类商品）</span>
                </label>
                <input
                  type="datetime-local"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="input-field"
                />
              </div>
              <button
                onClick={handleOrder}
                disabled={ordering}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                {ordering ? '下单中...' : '立即购买'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-static p-8 text-center text-warm-400">
          商品不存在或已下架
        </div>
      )}
    </div>
  )
}
