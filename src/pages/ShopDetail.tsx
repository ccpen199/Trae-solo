import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Plus, Minus, CheckCircle, AlertCircle, Star, ChevronRight, Eye } from 'lucide-react'
import { useShopStore } from '@/stores/shopStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { cn } from '@/lib/utils'

const complianceChecklist = [
  { label: '生产许可证齐全', passed: true },
  { label: '产品质量检验合格', passed: true },
  { label: '非活体动物', passed: true },
  { label: '符合国家宠物饲料/用品标准', passed: true },
]

export default function ShopDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentProduct, loading, fetchProduct, addToCart, fetchCart } = useShopStore()
  const { isLoggedIn } = useAuthStore()

  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [addedToCart, setAddedToCart] = useState(false)
  const [showComplianceReport, setShowComplianceReport] = useState(false)

  useEffect(() => {
    if (id) fetchProduct(parseInt(id))
    fetchCart()
  }, [id])

  const productImages = currentProduct?.images || [
    currentProduct?.image || `https://picsum.photos/600/600?random=${id}`,
    `https://picsum.photos/600/600?random=${parseInt(id!) + 1}`,
    `https://picsum.photos/600/600?random=${parseInt(id!) + 2}`,
    `https://picsum.photos/600/600?random=${parseInt(id!) + 3}`,
  ]

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      alert('请先登录')
      return
    }
    try {
      await addToCart(parseInt(id!), quantity)
      setAddedToCart(true)
      setTimeout(() => setAddedToCart(false), 1500)
    } catch (err: any) {
      alert(err.message || '加入购物车失败')
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    navigate('/shop/cart')
  }

  if (loading && !currentProduct) {
    return (
      <div className="min-h-screen bg-cream py-6 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-6 bg-stone-200 rounded w-1/4 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="aspect-square bg-stone-200 rounded-2xl mb-4" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-16 h-16 bg-stone-200 rounded-lg" />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-stone-200 rounded w-3/4" />
                <div className="h-6 bg-stone-200 rounded w-1/4" />
                <div className="h-32 bg-stone-200 rounded" />
                <div className="h-12 bg-stone-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <EmptyState title="商品不存在" description="该商品可能已下架" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-6 px-4">
      {showComplianceReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowComplianceReport(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-text-primary mb-4">合规审查报告</h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-text-secondary">审批文号</span>
                <span className="font-medium">{currentProduct.approvalNo || '京饲审(2024)第001234号'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-text-secondary">生产许可证</span>
                <span className="font-medium">{currentProduct.licenseNo || 'SC10611011500888'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-text-secondary">检验报告编号</span>
                <span className="font-medium">{currentProduct.inspectionNo || 'JY20240315001'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-stone-100">
                <span className="text-text-secondary">审核日期</span>
                <span className="font-medium">{currentProduct.reviewDate || '2024-03-15'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary">有效期至</span>
                <span className="font-medium">{currentProduct.validUntil || '2029-03-14'}</span>
              </div>
            </div>
            <button
              onClick={() => setShowComplianceReport(false)}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <Link to="/shop" className="text-text-secondary hover:text-text-primary text-sm">
            返回商城
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-stone-50">
              <img
                src={productImages[activeImage]}
                alt={currentProduct.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {productImages.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition',
                    activeImage === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={img} alt={`缩略图${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-text-secondary">{currentProduct.category}</span>
                <span className="text-xs text-text-secondary">·</span>
                <span className="text-xs text-text-secondary">{currentProduct.brand}</span>
                {currentProduct.isCompliant && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full ml-auto">
                    <CheckCircle className="w-3 h-3" />
                    已合规
                  </span>
                )}
              </div>
              <h1 className="heading-font text-2xl font-bold text-text-primary mb-3">
                {currentProduct.name}
              </h1>
              <div className="flex items-end gap-3 mb-4">
                <span className="text-3xl font-bold text-primary">¥{currentProduct.price}</span>
                {currentProduct.originalPrice && (
                  <span className="text-lg text-text-secondary line-through">
                    ¥{currentProduct.originalPrice}
                  </span>
                )}
                {currentProduct.originalPrice && (
                  <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded">
                    省¥{currentProduct.originalPrice - currentProduct.price}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm text-text-secondary mb-6">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {currentProduct.viewCount || 0} 浏览
                </span>
                <span className="flex items-center gap-1">
                  已售 {currentProduct.salesCount || 0}
                </span>
                <span className={cn(
                  currentProduct.stock > 0 ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {currentProduct.stock > 0 ? `库存${currentProduct.stock}件` : '暂时缺货'}
                </span>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm text-text-secondary">数量</span>
                <div className="flex items-center border border-stone-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-stone-50 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(currentProduct.stock || 99, quantity + 1))}
                    className="p-2 hover:bg-stone-50 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={loading || currentProduct.stock <= 0}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    addedToCart
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary/10 text-primary hover:bg-primary/20'
                  )}
                >
                  {addedToCart ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      已添加
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      加入购物车
                    </>
                  )}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={loading || currentProduct.stock <= 0}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary-600 active:scale-95',
                    (loading || currentProduct.stock <= 0) && 'opacity-50 cursor-not-allowed active:scale-100'
                  )}
                >
                  立即购买
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-800">合规审查</h3>
                  <p className="text-sm text-emerald-600">已通过平台合规审查</p>
                </div>
              </div>

              <div className="text-sm text-emerald-700 mb-3">
                <span className="font-medium">审批文号：</span>
                {currentProduct.approvalNo || '京饲审(2024)第001234号'}
              </div>

              {currentProduct.inspectionReport && (
                <div className="text-sm text-emerald-700 mb-4">
                  <span className="font-medium">检验报告：</span>
                  {currentProduct.inspectionReport}
                </div>
              )}

              <button
                onClick={() => setShowComplianceReport(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 mb-4"
              >
                查看合规报告
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                {complianceChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="heading-font text-lg font-bold text-text-primary mb-4">商品详情</h2>
          <div className="prose prose-sm max-w-none text-text-secondary">
            <p className="whitespace-pre-wrap mb-6">
              {currentProduct.description || '优质宠物用品，为爱宠提供健康、安全、舒适的生活体验。精选优质原材料，严格按照国家标准生产，通过多重质量检测，确保每一件商品都安全可靠。'}
            </p>

            {currentProduct.ingredients && (
              <div className="mb-6">
                <h3 className="font-semibold text-text-primary mb-2">主要成分</h3>
                <p>{currentProduct.ingredients}</p>
              </div>
            )}

            {currentProduct.usage && (
              <div className="mb-6">
                <h3 className="font-semibold text-text-primary mb-2">使用说明</h3>
                <p>{currentProduct.usage}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-font text-lg font-bold text-text-primary">用户评价</h2>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-4 h-4',
                      star <= (currentProduct.rating || 4.5)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-stone-300'
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-text-secondary">
                {currentProduct.rating || 4.5} ({currentProduct.reviewCount || 128}条评价)
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {(currentProduct.reviews || [
              { author: '用户***8', rating: 5, content: '质量很好，我家狗狗很喜欢吃，会回购的！', date: '2024-03-10' },
              { author: '用户***3', rating: 5, content: '包装完好，物流很快，产品合规让人放心。', date: '2024-03-08' },
            ]).map((review: any, i: number) => (
              <div key={i} className="py-3 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-text-primary">{review.author}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, s) => (
                      <Star
                        key={s}
                        className={cn(
                          'w-3 h-3',
                          s < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-stone-300'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-text-secondary ml-auto">{review.date}</span>
                </div>
                <p className="text-sm text-text-secondary">{review.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
