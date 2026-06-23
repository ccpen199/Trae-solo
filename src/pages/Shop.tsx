import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Store } from 'lucide-react'

interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
  images: string
  merchant_name: string
}

const CATEGORIES = ['全部', '红河特产', '生活服务', '二手闲置']

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        const items = data.data || []
        setProducts(items)
      })
      .catch(() => {
        setProducts([
          { id: 1, name: '建水紫陶茶壶·云纹', description: '传统无釉磨光工艺，手工拉坯成型', category: '红河特产', price: 368, images: '', merchant_name: '建水紫陶坊' },
          { id: 2, name: '建水紫陶花瓶·梯田', description: '以元阳梯田为灵感创作，浮雕工艺', category: '红河特产', price: 588, images: '', merchant_name: '建水紫陶坊' },
          { id: 3, name: '家政清洁服务', description: '专业保洁人员上门服务，3小时深度清洁', category: '生活服务', price: 198, images: '', merchant_name: '红河家政' },
          { id: 4, name: '蒙自过桥米线·经典套餐', description: '老母鸡高汤底，18种配菜', category: '红河特产', price: 68, images: '', merchant_name: '蒙自菊花过桥米线' },
          { id: 5, name: '二手自行车·捷安特', description: '九成新，适合日常通勤', category: '二手闲置', price: 450, images: '', merchant_name: '个人闲置' },
          { id: 6, name: '家电维修上门', description: '冰箱空调洗衣机专业维修，先检测后报价', category: '生活服务', price: 50, images: '', merchant_name: '诚信家电维修' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredProducts = activeCategory === '全部'
    ? products
    : products.filter((p) => p.category === activeCategory)

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">本地商城</h1>
        <Link to="/shop/merchant/apply" className="btn-secondary text-sm !px-4 !py-2 inline-flex items-center gap-1">
          <Store className="w-4 h-4" /> 商家入驻
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-honghe-red text-white'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <Link to="/shop/orders" className="btn-primary text-sm !px-4 !py-2 inline-flex items-center gap-1 mb-6">
        <ShoppingBag className="w-4 h-4" /> 我的订单
      </Link>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-static overflow-hidden animate-pulse">
              <div className="h-48 bg-warm-100" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-warm-100 rounded w-3/4" />
                <div className="h-4 bg-warm-100 rounded w-full" />
                <div className="h-5 bg-warm-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Link
              key={product.id}
              to={`/shop/product/${product.id}`}
              className="card overflow-hidden group"
            >
              <div className="h-48 bg-gradient-to-br from-honghe-gold/80 to-honghe-red/60 flex items-center justify-center text-white/90 relative overflow-hidden">
                <ShoppingBag className="w-12 h-12 opacity-60" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <div className="p-4">
                <h3 className="font-medium text-warm-800 mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-warm-500 line-clamp-2 mb-3 h-10">{product.description}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-honghe-red font-bold text-lg">¥{product.price}</span>
                  <span className="tag-gold">{product.category}</span>
                </div>
                {product.merchant_name && (
                  <span className="tag-gold">{product.merchant_name}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card-static p-12 text-center text-warm-400">
          暂无商品
        </div>
      )}
    </div>
  )
}
