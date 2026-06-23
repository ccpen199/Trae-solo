import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'
import { useShopStore } from '@/stores/shopStore'
import { useAuthStore } from '@/stores/authStore'
import EmptyState from '@/components/EmptyState'
import { cn } from '@/lib/utils'

export default function ShopCart() {
  const navigate = useNavigate()
  const { cart, loading, fetchCart, removeFromCart, updateCartItem, placeOrder } = useShopStore()
  const { isLoggedIn } = useAuthStore()

  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchCart()
  }, [])

  const toggleSelectItem = (id: number) => {
    setSelectedItems(selectedItems.includes(id)
      ? selectedItems.filter(i => i !== id)
      : [...selectedItems, id]
    )
  }

  const selectAll = () => {
    if (selectedItems.length === cart.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(cart.map(item => item.id))
    }
  }

  const handleQuantityChange = async (id: number, newQuantity: number) => {
    if (newQuantity < 1) return
    await updateCartItem(id, newQuantity)
  }

  const handleRemove = async (id: number) => {
    if (confirm('确定要删除这件商品吗？')) {
      await removeFromCart(id)
      setSelectedItems(selectedItems.filter(i => i !== id))
    }
  }

  const handleCheckout = async () => {
    if (selectedItems.length === 0) {
      alert('请选择要结算的商品')
      return
    }
    try {
      await placeOrder()
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        navigate('/shop')
      }, 2000)
    } catch (err: any) {
      alert(err.message || '结算失败')
    }
  }

  const selectedCartItems = cart.filter(item => selectedItems.includes(item.id))
  const totalPrice = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="heading-font text-xl font-bold text-text-primary mb-2">订单提交成功</h2>
          <p className="text-text-secondary">正在跳转到商城首页...</p>
        </div>
      </div>
    )
  }

  if (loading && cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-6 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-stone-200 rounded w-1/4" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-stone-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-stone-200 rounded w-3/4" />
                    <div className="h-4 bg-stone-200 rounded w-1/4" />
                    <div className="h-8 bg-stone-200 rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-6 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-xl transition">
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h1 className="heading-font text-xl font-bold text-text-primary flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-primary" />
            购物车
          </h1>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-xl mb-6 flex items-center justify-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">平台禁止活体交易，所有商品均为合规宠物用品</span>
        </div>

        {cart.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-8 h-8 text-stone-400" />}
            title="购物车是空的"
            description="快去挑选心仪的商品吧"
            action={{ label: '去逛逛', onClick: () => navigate('/shop') }}
          />
        ) : (
          <>
            <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedItems.length === cart.length && cart.length > 0}
                  onChange={selectAll}
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary"
                />
                <span className="font-medium text-text-primary">全选</span>
                <span className="text-sm text-text-secondary ml-auto">
                  已选 {selectedItems.length}/{cart.length} 件
                </span>
              </label>
            </div>

            <div className="space-y-4 mb-6">
              {cart.map((item: any, index: number) => (
                <div
                  key={item.id}
                  className={cn(
                    'bg-white rounded-2xl p-4 shadow-sm opacity-0 animate-slideUp',
                    `stagger-${Math.min((index % 6) + 1, 6)}`
                  )}
                >
                  <div className="flex gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary mt-10 flex-shrink-0"
                    />
                    <Link to={`/shop/${item.productId}`} className="flex-shrink-0">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-50">
                        <img
                          src={item.image || `https://picsum.photos/200/200?random=${item.id}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        {item.isCompliant && (
                          <div className="absolute top-1 left-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle className="w-2.5 h-2.5" />
                            合规
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/shop/${item.productId}`}>
                        <h3 className="font-medium text-text-primary line-clamp-2 mb-1">{item.name}</h3>
                      </Link>
                      <div className="text-xs text-emerald-600 mb-2">
                        {item.approvalNo || '京饲审(2024)第XXX号'}
                      </div>
                      <div className="text-lg font-bold text-primary mb-3">¥{item.price}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-stone-200 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-stone-50 transition"
                            disabled={loading}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-1.5 font-medium min-w-[40px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-stone-50 transition"
                            disabled={loading}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-text-primary">
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="p-2 text-text-secondary hover:text-danger hover:bg-danger/5 rounded-lg transition"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-4 shadow-lg">
              <div className="container mx-auto max-w-4xl flex items-center justify-between">
                <div>
                  <span className="text-text-secondary">已选 {selectedItems.length} 件</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-text-secondary">合计：</span>
                    <span className="text-2xl font-bold text-primary">¥{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0 || loading}
                  className={cn(
                    'px-8 py-3 rounded-xl font-medium transition-all',
                    selectedItems.length > 0 && !loading
                      ? 'bg-primary text-white hover:bg-primary-600 active:scale-95'
                      : 'bg-stone-200 text-text-secondary cursor-not-allowed'
                  )}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    '去结算'
                  )}
                </button>
              </div>
            </div>

            <div className="h-24" />
          </>
        )}
      </div>
    </div>
  )
}
