import { useState, useMemo } from 'react'
import { mockMaterials } from '@/store/platformStore'
import { usePlatformStore } from '@/store/platformStore'
import {
  Search,
  ShoppingBag,
  Star,
  Shield,
  MapPin,
  Leaf,
  Package,
  ChevronDown,
  Filter,
  Heart,
  ShoppingCart,
  Truck,
  Award,
  BadgeCheck,
} from 'lucide-react'

const allCategories = ['全部', '瓷砖', '涂料', '地板', '卫浴', '橱柜', '灯具', '门窗', '管材']

export default function Materials() {
  const { materialCategory, setMaterialCategory } = usePlatformStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [showEcoOnly, setShowEcoOnly] = useState(false)
  const [showSelfOnly, setShowSelfOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'rating'>('default')
  const [cart, setCart] = useState<Record<string, number>>({})

  const filtered = useMemo(() => {
    let result = mockMaterials.filter((m) => {
      if (materialCategory !== '全部' && m.category !== materialCategory) return false
      if (searchQuery && !m.name.includes(searchQuery) && !m.brand.includes(searchQuery)) return false
      if (showEcoOnly && !m.ecoLevel) return false
      if (showSelfOnly && !m.isSelfOperated) return false
      return true
    })
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.price - a.price)
    if (sortBy === 'rating') result = [...result].sort((a, b) => b.rating - a.rating)
    return result
  }, [materialCategory, searchQuery, showEcoOnly, showSelfOnly, sortBy])

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = mockMaterials.find((m) => m.id === id)
    return sum + (product ? product.price * qty : 0)
  }, 0)
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0)

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))
  }

  return (
    <div className="p-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-title">建材集采商城</h1>
          <p className="mt-1 text-surface-500">齐家自营SKU+第三方品牌入驻，所有商品标注产地/环保等级/服务包</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button className="btn-secondary relative">
              <ShoppingCart size={16} className="mr-1.5" />
              采购清单
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
          {cartCount > 0 && (
            <div className="text-sm text-surface-600 dark:text-surface-400">
              合计: <span className="font-bold text-brand-600 dark:text-brand-400">¥{cartTotal.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="搜索建材、品牌..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setMaterialCategory(cat)}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${
                materialCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showEcoOnly}
            onChange={(e) => setShowEcoOnly(e.target.checked)}
            className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          />
          <Leaf size={14} className="text-accent-500" /> 仅看环保认证
        </label>
        <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showSelfOnly}
            onChange={(e) => setShowSelfOnly(e.target.checked)}
            className="rounded border-surface-300 text-brand-600 focus:ring-brand-500"
          />
          <BadgeCheck size={14} className="text-brand-500" /> 仅看自营
        </label>
        <div className="ml-auto flex items-center gap-1">
          <Filter size={14} className="text-surface-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-surface-300 bg-white px-2 py-1 text-sm text-surface-700 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-300"
          >
            <option value="default">默认排序</option>
            <option value="price_asc">价格从低到高</option>
            <option value="price_desc">价格从高到低</option>
            <option value="rating">评分最高</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((product) => (
          <div key={product.id} className="card group overflow-hidden">
            <div className="relative h-44 overflow-hidden bg-surface-100 dark:bg-surface-700">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {product.isSelfOperated && (
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-medium text-white">
                  <BadgeCheck size={10} /> 自营
                </div>
              )}
              {product.ecoLevel && product.ecoLevel !== '-' && (
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-accent-600 px-2 py-0.5 text-[10px] font-medium text-white">
                  <Leaf size={10} /> {product.ecoLevel}
                </div>
              )}
              <button
                onClick={() => addToCart(product.id)}
                className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-600 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-surface-800/90"
              >
                <ShoppingCart size={14} />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                  {product.brand}
                </span>
                <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                  {product.category}
                </span>
              </div>
              <h3 className="mb-2 text-sm font-medium text-surface-900 dark:text-white line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h3>
              <div className="mb-2 flex items-center gap-2 text-xs text-surface-500">
                <span className="flex items-center gap-0.5"><MapPin size={10} /> {product.origin}</span>
              </div>
              <div className="mb-3 flex items-center gap-1.5">
                <Truck size={12} className="text-brand-500" />
                <span className="text-xs text-surface-500 line-clamp-1">{product.servicePackage}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-lg font-bold text-red-500">¥{product.price}</span>
                  <span className="text-xs text-surface-400">/{product.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="fill-warn-400 text-warn-400" />
                  <span className="text-xs text-surface-500">{product.rating}</span>
                  <span className="text-xs text-surface-400">({product.sales})</span>
                </div>
              </div>
              {cart[product.id] && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-50 px-3 py-1.5 dark:bg-brand-900/20">
                  <span className="text-xs text-brand-600 dark:text-brand-400">已加入采购清单 x{cart[product.id]}</span>
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
                    ¥{(product.price * cart[product.id]).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-surface-400">
          <ShoppingBag size={48} className="mb-4" />
          <p className="text-lg">没有找到匹配的建材商品</p>
          <p className="text-sm">请调整筛选条件</p>
        </div>
      )}
    </div>
  )
}
