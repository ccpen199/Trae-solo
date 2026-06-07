import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBagIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { mallAPI } from '../api/client'

const categoryTabs = [
  { value: '', label: '全部' },
  { value: 'digital', label: '数码电子' },
  { value: 'life', label: '生活服务' },
  { value: 'food', label: '美食餐饮' },
  { value: 'health', label: '健康医疗' },
  { value: 'entertainment', label: '休闲娱乐' },
]

const Mall = () => {
  const [products, setProducts] = useState([])
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = {}
        if (category) params.category = category
        if (search) params.search = search
        const res = await mallAPI.getProducts(params)
        setProducts(res.data || [])
      } catch (err) {
        setError('获取商品失败')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [category])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (category) params.category = category
      if (search) params.search = search
      const res = await mallAPI.getProducts(params)
      setProducts(res.data || [])
    } catch (err) {
      setError('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const categoryLabel = (cat) => {
    const found = categoryTabs.find((c) => c.value === cat)
    return found ? found.label : cat
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">福利商城</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setCategory(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索商品..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          搜索
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">暂无商品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/mall/product/${product.id}`)}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <ShoppingBagIcon className="w-16 h-16 text-indigo-300" />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                    {categoryLabel(product.category)}
                  </span>
                </div>
                <h4 className="font-medium text-gray-800 mb-1">{product.name}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-indigo-600">¥{product.price}</span>
                  <span className="text-xs text-gray-400">{product.stock || 0} 件库存</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Mall
