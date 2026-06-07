import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Shield, ChevronLeft, ChevronRight, Link as LinkIcon, ShoppingCart } from 'lucide-react'
import { api } from '@/lib/api'

interface Category {
  id: number
  name: string
  type: string
  icon: string | null
  sort_order: number
}

interface Product {
  id: number
  name: string
  price: number
  original_price: number
  cover_image: string | null
  merchant_name: string
  sales: number
  traceability_code: string | null
  category_id: number
}

export default function Products() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const pageSize = 12

  const totalPages = Math.ceil(total / pageSize)

  useEffect(() => {
    api.get<Category[]>('/categories?type=product')
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (selectedCategory) params.set('category_id', String(selectedCategory))
    api.get<{ list: Product[]; total: number }>(`/products?${params.toString()}`)
      .then((data) => {
        setProducts(data.list)
        setTotal(data.total)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, selectedCategory])

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">广电优选</h1>
        <p className="text-gray-500 mt-1">贵州特色好物</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === null ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          全部
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">加载中...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">暂无商品</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="bg-amber-50 h-40 flex items-center justify-center relative">
                  <Package className="w-12 h-12 text-amber-300" />
                  {product.traceability_code && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      溯源
                    </span>
                  )}
                  <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    广电担保
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                  {product.merchant_name && (
                    <p className="text-xs text-gray-400 mt-1 truncate">{product.merchant_name}</p>
                  )}
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-red-500">¥{product.price}</span>
                    {product.original_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">¥{product.original_price}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">已售 {product.sales}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {product.traceability_code && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`) }}
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                      >
                        <LinkIcon className="w-3 h-3" />
                        查看溯源
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`) }}
                      className="flex-1 flex items-center justify-center gap-1 text-xs bg-red-500 text-white py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      立即购买
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
