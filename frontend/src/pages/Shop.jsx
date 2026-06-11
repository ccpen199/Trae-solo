import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => {
    loadProducts()
    loadUser()
  }, [category])

  const loadUser = () => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
    }
  }

  const loadProducts = async () => {
    try {
      const url = category === 'all' ? '/shop/products' : `/shop/products?category=${category}`
      const res = await api.get(url)
      setProducts(res.data.products || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (product) => {
    if (!confirm(`确定购买 ${product.name} 吗？`)) return
    try {
      await api.post('/shop/orders', {
        items: [{ product_id: product.id, quantity: 1 }],
        n_coins_used: 0
      })
      alert('下单成功！')
    } catch (err) {
      alert(err.response?.data?.error || '下单失败')
    }
  }

  const categories = [
    { id: 'all', name: '全部' },
    { id: '整车', name: '整车' },
    { id: '配件', name: '配件' }
  ]

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">智选商城</h2>
            <p className="text-white/80 mt-1">精选好物，品质保障</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{user?.n_coins || 0}</div>
            <div className="text-white/70 text-sm">N币余额</div>
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative">
              <div className="w-full h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-5xl">
                  {product.category === '整车' ? '🛴' : '🎒'}
                </span>
              </div>
              {product.is_preorder && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                  预售
                </span>
              )}
              {product.stock === 0 && !product.is_preorder && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-gray-500 text-white text-xs rounded-full">
                  缺货
                </span>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-gray-800 line-clamp-2 h-12">{product.name}</h4>
              <div className="mt-2 flex items-baseline">
                <span className="text-xl font-bold text-red-600">¥{product.price}</span>
                {product.original_price && (
                  <span className="ml-2 text-sm text-gray-400 line-through">
                    ¥{product.original_price}
                  </span>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                库存: {product.stock} 件
              </div>
              <button
                onClick={() => handleBuy(product)}
                disabled={product.stock === 0 && !product.is_preorder}
                className="mt-3 w-full py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {product.is_preorder ? '立即预订' : '立即购买'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🛒</div>
          <p>暂无商品</p>
        </div>
      )}
    </div>
  )
}
