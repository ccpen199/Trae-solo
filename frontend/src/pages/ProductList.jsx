import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingCart } from 'lucide-react'
import { productApi } from '../api'

export default function ProductList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getProducts({ limit: 20, category: selectedCategory || undefined }),
        productApi.getCategories(),
      ])
      setProducts(productsRes.data.data.list)
      setCategories(categoriesRes.data.data)
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="搜索商品..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2"
          >
            <ShoppingCart className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white px-4 py-2 sticky top-14 z-10 border-b">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => {
              setSelectedCategory('')
              loadData()
            }}
            className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
              !selectedCategory
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category)
                loadData()
              }}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无商品</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <img
                  src={product.images}
                  alt={product.name}
                  className="w-full h-36 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                  <div className="flex items-baseline justify-between mt-2">
                    <div>
                      <span className="text-red-500 font-bold">¥{product.price}</span>
                      {product.original_price && (
                        <span className="text-xs text-gray-400 line-through ml-1">
                          ¥{product.original_price}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">已售{product.sales || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
