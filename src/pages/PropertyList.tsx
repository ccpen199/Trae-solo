import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Grid3X3, List, ArrowUpDown, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import PropertyCard from '@/components/PropertyCard'

const propertyTypes = [
  { value: 'all', label: '全部' },
  { value: 'apartment', label: '公寓' },
  { value: 'house', label: '别墅' },
  { value: 'villa', label: '联排' },
  { value: 'commercial', label: '商铺' },
]

const listingTypes = [
  { value: 'all', label: '全部' },
  { value: 'new', label: '新房' },
  { value: 'sale', label: '二手房' },
  { value: 'rent', label: '租房' },
]

const layouts = [
  { value: 'all', label: '不限' },
  { value: '1', label: '一室' },
  { value: '2', label: '两室' },
  { value: '3', label: '三室' },
  { value: '4', label: '四室及以上' },
]

const priceRanges = [
  { value: 'all', label: '不限', min: 0, max: Infinity },
  { value: '0-200', label: '200万以下', min: 0, max: 2000000 },
  { value: '200-500', label: '200-500万', min: 2000000, max: 5000000 },
  { value: '500-800', label: '500-800万', min: 5000000, max: 8000000 },
  { value: '800-1000', label: '800-1000万', min: 8000000, max: 10000000 },
  { value: '1000+', label: '1000万以上', min: 10000000, max: Infinity },
]

const cities = [
  { value: 'all', label: '全部城市' },
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '广州', label: '广州' },
  { value: '深圳', label: '深圳' },
  { value: '杭州', label: '杭州' },
  { value: '成都', label: '成都' },
]

const sortOptions = [
  { value: 'default', label: '默认排序' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' },
  { value: 'area-asc', label: '面积从小到大' },
  { value: 'area-desc', label: '面积从大到小' },
  { value: 'newest', label: '最新发布' },
]

const demoProperties = [
  { id: 1, title: '朝阳区豪华三居室 南北通透 学区房', price: 8900000, area: 125, layout: '3室2厅2卫', address: '望京SOHO附近', city: '北京', district: '朝阳区', images: JSON.stringify(['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 2, title: '海淀区中关村精装两居室 近地铁', price: 6200000, area: 89, layout: '2室1厅1卫', address: '中关村大街', city: '北京', district: '海淀区', images: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 3, title: '国贸CBD高端公寓 精装修拎包入住', price: 12500000, area: 156, layout: '4室2厅3卫', address: '国贸三期旁', city: '北京', district: '朝阳区', images: JSON.stringify(['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'new' },
  { id: 4, title: '通州副中心河景别墅 带花园车库', price: 15800000, area: 280, layout: '5室3厅4卫', address: '大运河森林公园旁', city: '北京', district: '通州区', images: JSON.stringify(['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'villa', listingType: 'new' },
  { id: 5, title: '西城区金融街温馨一居 学区房', price: 4500000, area: 55, layout: '1室1厅1卫', address: '金融街', city: '北京', district: '西城区', images: JSON.stringify(['https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 6, title: '丰台区科技园精装两居 满五唯一', price: 4200000, area: 78, layout: '2室1厅1卫', address: '总部基地', city: '北京', district: '丰台区', images: JSON.stringify(['https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 7, title: '东城区东直门精装公寓出租', price: 12000, area: 68, layout: '1室1厅1卫', address: '东直门', city: '北京', district: '东城区', images: JSON.stringify(['https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'rent' },
  { id: 8, title: '昌平区未来科学城新房团购', price: 3800000, area: 95, layout: '3室1厅2卫', address: '未来科学城', city: '北京', district: '昌平区', images: JSON.stringify(['https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'new' },
]

export default function PropertyList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('default')
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [filters, setFilters] = useState({
    propertyType: 'all',
    listingType: 'all',
    priceRange: 'all',
    layout: 'all',
    city: 'all',
  })

  const activeFilterCount = Object.entries(filters).filter(([, value]) => value !== 'all').length

  const filteredProperties = demoProperties.filter((p) => {
    const selectedPriceRange = priceRanges.find((range) => range.value === filters.priceRange) || priceRanges[0]
    const roomCount = parseInt(p.layout, 10)
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filters.propertyType === 'all' || p.propertyType === filters.propertyType
    const matchesListing = filters.listingType === 'all' || p.listingType === filters.listingType
    const matchesCity = filters.city === 'all' || p.city === filters.city
    const matchesPrice = filters.priceRange === 'all' ||
      (p.price >= selectedPriceRange.min && p.price <= selectedPriceRange.max)
    const matchesLayout = filters.layout === 'all' ||
      (filters.layout === '4' ? roomCount >= 4 : roomCount === Number(filters.layout))
    return matchesSearch && matchesType && matchesListing && matchesCity && matchesPrice && matchesLayout
  })

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      case 'area-asc': return a.area - b.area
      case 'area-desc': return b.area - a.area
      default: return 0
    }
  })

  const clearFilters = () => {
    setFilters({
      propertyType: 'all',
      listingType: 'all',
      priceRange: 'all',
      layout: 'all',
      city: 'all',
    })
  }

  return (
    <div className="min-h-screen bg-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">房源中心</h1>
          <p className="text-slate-500">海量优质房源，智能筛选，VR全景看房</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索小区、地址、商圈..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors',
                  showFilters || activeFilterCount > 0
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                <SlidersHorizontal size={18} strokeWidth={1.5} />
                筛选
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-teal-600 text-white text-xs rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <ArrowUpDown size={16} strokeWidth={1.5} />
                  {sortOptions.find(o => o.value === sortBy)?.label}
                  <ChevronDown size={16} strokeWidth={1.5} />
                </button>
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value)
                          setShowSortDropdown(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm transition-colors',
                          sortBy === option.value
                            ? 'bg-teal-50 text-teal-600 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'grid' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                  )}
                >
                  <Grid3X3 size={18} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    viewMode === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
                  )}
                >
                  <List size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">筛选条件</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <X size={14} strokeWidth={1.5} />
                清除筛选
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">房源类型</label>
                <div className="flex flex-wrap gap-2">
                  {propertyTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFilters({ ...filters, propertyType: type.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        filters.propertyType === type.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">交易类型</label>
                <div className="flex flex-wrap gap-2">
                  {listingTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setFilters({ ...filters, listingType: type.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        filters.listingType === type.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">价格区间</label>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setFilters({ ...filters, priceRange: range.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        filters.priceRange === range.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">户型</label>
                <div className="flex flex-wrap gap-2">
                  {layouts.map((layout) => (
                    <button
                      key={layout.value}
                      onClick={() => setFilters({ ...filters, layout: layout.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        filters.layout === layout.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">城市</label>
                <div className="flex flex-wrap gap-2">
                  {cities.slice(0, 6).map((city) => (
                    <button
                      key={city.value}
                      onClick={() => setFilters({ ...filters, city: city.value })}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm transition-colors',
                        filters.city === city.value
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 text-sm text-slate-500">
          共找到 <span className="text-teal-600 font-semibold">{sortedProperties.length}</span> 套房源
        </div>

        {sortedProperties.length > 0 ? (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          )}>
            {sortedProperties.map((property) => (
              viewMode === 'list' ? (
                <div key={property.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-72 h-48 md:h-auto">
                      <img
                        src={JSON.parse(property.images)[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <Link to={`/properties/${property.id}`} className="text-lg font-semibold text-slate-900 hover:text-teal-600">
                          {property.title}
                        </Link>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-500">¥{property.price.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <span>{property.layout}</span>
                        <span>{property.area}㎡</span>
                        <span>{property.district}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <PropertyCard key={property.id} {...property} />
              )
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-16 text-center shadow-md">
            <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Search size={32} className="text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无符合条件的房源</h3>
            <p className="text-slate-500">试试调整筛选条件或搜索关键词</p>
          </div>
        )}
      </div>
    </div>
  )
}
