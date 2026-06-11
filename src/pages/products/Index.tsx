import { useState } from 'react'
import { Package, Search, Filter } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { products } from '@/data/mockData'

const categories = ['全部', '营养保健', '膳食代餐', '功能饮品', '日化护理', '美容养颜']

export default function ProductsIndex() {
  const [activeCategory, setActiveCategory] = useState('全部')
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = products.filter((p) => {
    const matchCategory = activeCategory === '全部' || p.category === activeCategory
    const matchSearch = p.name.includes(searchQuery) || p.batchCode.includes(searchQuery)
    return matchCategory && matchSearch
  })

  return (
    <div className="page-container animate-fade-in-up">
      <PageHeader title="产品中心" subtitle="产品信息管理与查询" actions={
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
          <Filter className="w-4 h-4" />
          筛选
        </button>
      } />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="搜索产品名称或批次号..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((product, i) => (
          <div
            key={product.id}
            className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Package className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                  <span className="text-xs text-gray-400">{product.category}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {product.status === 'active' ? '在售' : '下架'}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">价格</span>
                <span className="font-semibold text-emerald-600">¥{product.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">批次号</span>
                <span className="text-gray-700 font-mono text-xs">{product.batchCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">库存</span>
                <span className={product.stock === 0 ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                  {product.stock === 0 ? '缺货' : `${product.stock}件`}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>未找到匹配的产品</p>
        </div>
      )}
    </div>
  )
}
