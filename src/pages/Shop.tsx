import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Search, Filter, ChevronDown, Plus, CheckCircle, AlertTriangle } from 'lucide-react'
import { useShopStore } from '@/stores/shopStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { cn } from '@/lib/utils'

const categories = {
  food: {
    name: '主粮',
    icon: '🥣',
    subcategories: ['狗粮', '猫粮', '其他粮'],
  },
  snack: {
    name: '零食',
    icon: '🍖',
    subcategories: ['狗零食', '猫零食'],
  },
  health: {
    name: '驱虫保健',
    icon: '💊',
    subcategories: ['体内驱虫', '体外驱虫', '营养品'],
  },
  daily: {
    name: '日用百货',
    icon: '🛒',
    subcategories: ['玩具', '窝具', '食盆', '猫砂'],
  },
  medical: {
    name: '医疗护理',
    icon: '🩹',
    subcategories: ['药品', '护理工具'],
  },
}

const brands = ['皇家', '渴望', '爱肯拿', '麦富迪', '比瑞吉', '伯纳天纯']

export default function Shop() {
  const { products, cart, loading, fetchProducts, addToCart } = useShopStore()
  const { user } = useAuthStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('food')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [complianceFilter, setComplianceFilter] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [addedToCart, setAddedToCart] = useState<number | null>(null)

  useEffect(() => {
    const filters: any = {}
    if (searchQuery) filters.search = searchQuery
    if (selectedSubcategory) filters.category = selectedSubcategory
    if (selectedBrand) filters.brand = selectedBrand
    if (priceRange.min) filters.minPrice = priceRange.min
    if (priceRange.max) filters.maxPrice = priceRange.max
    if (complianceFilter) filters.compliance = complianceFilter
    fetchProducts(filters)
  }, [searchQuery, selectedSubcategory, selectedBrand, priceRange, complianceFilter])

  const handleAddToCart = async (productId: number) => {
    try {
      await addToCart(productId, 1)
      setAddedToCart(productId)
      setTimeout(() => setAddedToCart(null), 1500)
    } catch (err: any) {
      alert(err.message || '加入购物车失败')
    }
  }

  const cartItemCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0)

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square bg-stone-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-stone-200 rounded w-1/2" />
        <div className="h-5 bg-stone-200 rounded w-3/4" />
        <div className="h-4 bg-stone-200 rounded w-1/3" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">平台禁止活体交易，所有商品均为合规宠物用品</span>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4">
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h1 className="heading-font text-2xl font-bold text-text-primary">宠物商城</h1>
              <p className="text-text-secondary mt-1">合规宠物用品，安全放心购</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索商品..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
                />
              </div>
              <Link
                to="/shop/cart"
                className="relative p-2.5 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-white rounded-xl text-text-primary font-medium shadow-sm"
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>

          <div className={cn(
            'lg:w-64 lg:block space-y-4',
            showFilters ? 'block' : 'hidden'
          )}>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-text-primary mb-4">商品分类</h3>
              <div className="space-y-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <div key={key}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-50 transition"
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span className="font-medium">{cat.name}</span>
                      </span>
                      <ChevronDown className={cn('w-4 h-4 transition-transform', expandedCategory === key && 'rotate-180')} />
                    </button>
                    {expandedCategory === key && (
                      <div className="ml-4 mt-1 space-y-1">
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm rounded-lg transition',
                              selectedSubcategory === sub
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-text-secondary hover:text-text-primary hover:bg-stone-50'
                            )}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-text-primary mb-4">价格区间</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  placeholder="最低"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
                <span className="text-text-secondary">-</span>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  placeholder="最高"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-text-primary mb-4">品牌</h3>
              <div className="space-y-2">
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-lg transition',
                      selectedBrand === brand
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-stone-50'
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-text-primary mb-4">合规状态</h3>
              <div className="space-y-2">
                {[
                  { key: 'compliant', label: '已合规审查' },
                  { key: 'pending', label: '待审查' },
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setComplianceFilter(complianceFilter === item.key ? null : item.key)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-lg transition flex items-center gap-2',
                      complianceFilter === item.key
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-stone-50'
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {(selectedSubcategory || selectedBrand || priceRange.min || priceRange.max || complianceFilter) && (
              <button
                onClick={() => {
                  setSelectedSubcategory(null)
                  setSelectedBrand(null)
                  setPriceRange({ min: '', max: '' })
                  setComplianceFilter(null)
                }}
                className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition"
              >
                清除所有筛选
              </button>
            )}
          </div>

          <div className="flex-1">
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title="暂无商品"
                description="请尝试其他筛选条件"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className={cn(
                      'bg-white rounded-2xl overflow-hidden shadow-sm card-hover opacity-0 animate-slideUp',
                      `stagger-${Math.min((index % 6) + 1, 6)}`
                    )}
                  >
                    <Link to={`/shop/${product.id}`} className="block">
                      <div className="relative aspect-square">
                        <img
                          src={product.image || `https://picsum.photos/400/400?random=${product.id}`}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                        {product.isCompliant && (
                          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            合规
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <div className="text-xs text-text-secondary mb-1">
                        {product.category} · {product.brand}
                      </div>
                      <Link to={`/shop/${product.id}`}>
                        <h3 className="font-medium text-text-primary line-clamp-2 mb-2 h-10">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="text-xs text-emerald-600 mb-2 truncate">
                        {product.approvalNo || '京饲审(2024)第XXX号'}
                      </div>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <span className="text-xl font-bold text-primary">¥{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-text-secondary line-through ml-2">
                              ¥{product.originalPrice}
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          product.stock > 0
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-red-50 text-red-600'
                        )}>
                          {product.stock > 0 ? `库存${product.stock}` : '缺货'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product.id)}
                        disabled={loading || product.stock <= 0}
                        className={cn(
                          'w-full py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                          addedToCart === product.id
                            ? 'bg-emerald-500 text-white'
                            : product.stock > 0
                              ? 'bg-primary text-white hover:bg-primary-600 active:scale-95'
                              : 'bg-stone-200 text-text-secondary cursor-not-allowed'
                        )}
                      >
                        {addedToCart === product.id ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            已添加
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            加入购物车
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {products.length > 0 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-2.5 bg-white text-text-primary font-medium rounded-xl border border-stone-200 hover:bg-stone-50 transition">
                  加载更多
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
