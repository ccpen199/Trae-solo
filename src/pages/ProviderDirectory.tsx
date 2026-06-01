import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Star,
  MapPin,
  Wrench,
  Phone,
  Clock,
  Award,
  Shield,
  Calendar,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  MessageCircle,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Provider } from '../../api/types'

interface ProviderDetail extends Provider {
  description: string
  certifications: string[]
  experience: number
  responseTime: string
  completionRate: number
  reviews: Array<{
    id: number
    user: string
    avatar: string
    rating: number
    date: string
    content: string
    service: string
    helpful: number
  }>
  priceRange: {
    min: number
    max: number
    unit: string
  }
  available: boolean
}

const serviceFilters = [
  { value: 'all', label: '全部服务' },
  { value: '家具拆装', label: '家具拆装' },
  { value: '家电安装', label: '家电安装' },
  { value: '空调移机', label: '空调移机' },
  { value: '热水器安装', label: '热水器安装' },
  { value: '整体橱柜', label: '整体橱柜' },
]

const areaFilters = [
  { value: 'all', label: '全部区域' },
  { value: '朝阳区', label: '朝阳区' },
  { value: '海淀区', label: '海淀区' },
  { value: '东城区', label: '东城区' },
  { value: '西城区', label: '西城区' },
  { value: '丰台区', label: '丰台区' },
]

const sortOptions = [
  { value: 'rating', label: '评分优先' },
  { value: 'booked', label: '预约最多' },
  { value: 'price_asc', label: '价格最低' },
  { value: 'price_desc', label: '价格最高' },
]

const ProviderDirectory: React.FC = () => {
  const { addNotification } = useAppStore()
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<number | null>(null)
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<ProviderDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [showBookSuccess, setShowBookSuccess] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const result = await api.bulk.providers.list()
      if (result.success && result.data) {
        setProviders(result.data as Provider[])
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error)
      addNotification({ type: 'error', message: '获取服务商列表失败' })
    } finally {
      setLoading(false)
    }
  }

  const fetchProviderDetail = async (id: number) => {
    try {
      const result = await api.bulk.providers.get(id)
      if (result.success && result.data) {
        setSelectedProvider(result.data as ProviderDetail)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch provider detail:', error)
      addNotification({ type: 'error', message: '获取服务商详情失败' })
    }
  }

  const handleBook = async (providerId: number) => {
    setBooking(providerId)
    try {
      const result = await api.bulk.providers.book(providerId)
      if (result.success) {
        setShowBookSuccess(true)
        setTimeout(() => {
          setShowBookSuccess(false)
          setShowDetailModal(false)
        }, 2000)
        addNotification({ type: 'success', message: '预约成功！服务商会尽快与您联系' })
      }
    } catch (error) {
      addNotification({ type: 'error', message: '预约失败，请重试' })
    } finally {
      setBooking(null)
    }
  }

  const filteredProviders = providers
    .filter(p => {
      if (searchQuery && !p.name.includes(searchQuery) && !p.services.includes(searchQuery)) return false
      if (serviceFilter !== 'all' && !p.services.includes(serviceFilter)) return false
      if (areaFilter !== 'all' && !p.service_area.includes(areaFilter)) return false
      if (minRating > 0 && p.rating < minRating) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'booked':
          return b.booked_count - a.booked_count
        case 'price_asc':
          return (b.booked_count || 0) - (a.booked_count || 0)
        case 'price_desc':
          return (a.booked_count || 0) - (b.booked_count || 0)
        default:
          return 0
      }
    })

  const renderStars = (rating: number, size = 14) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.floor(rating) ? 'text-sf-yellow fill-sf-yellow' : 'text-sf-light/30'}
        />
      ))}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display text-sf-light">家具拆装服务商目录</h1>
        <p className="text-sf-light/50 text-sm mt-1">选择专业认证的拆装服务商，为您的大件物品保驾护航</p>
      </div>

      <div className="glass rounded-2xl p-6 mb-6 border border-sf-blue/30">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-light/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索服务商名称或服务项目..."
              className="w-full h-12 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 h-12 rounded-lg border transition-all ${
                showFilters
                  ? 'bg-sf-red/10 border-sf-red/50 text-sf-red'
                  : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
              }`}
            >
              <Filter size={18} />
              筛选
              {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-12 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-sf-blue/20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-sf-light/70 mb-3">服务类型</label>
              <div className="flex flex-wrap gap-2">
                {serviceFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setServiceFilter(filter.value)}
                    className={`px-3 h-8 rounded-lg border text-sm transition-all ${
                      serviceFilter === filter.value
                        ? 'bg-sf-red/10 border-sf-red/50 text-sf-red'
                        : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-sf-light/70 mb-3">服务区域</label>
              <div className="flex flex-wrap gap-2">
                {areaFilters.map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setAreaFilter(filter.value)}
                    className={`px-3 h-8 rounded-lg border text-sm transition-all ${
                      areaFilter === filter.value
                        ? 'bg-sf-blue/10 border-sf-blue/50 text-sf-blue'
                        : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-sf-light/70 mb-3">最低评分</label>
              <div className="flex items-center gap-4">
                {[0, 3, 4, 4.5].map(rating => (
                  <button
                    key={rating}
                    onClick={() => setMinRating(rating)}
                    className={`px-3 h-8 rounded-lg border text-sm transition-all ${
                      minRating === rating
                        ? 'bg-sf-yellow/10 border-sf-yellow/50 text-sf-yellow'
                        : 'bg-sf-dark/50 border-sf-blue/20 text-sf-light/70 hover:border-sf-blue/40'
                    }`}
                  >
                    {rating === 0 ? '全部' : `${rating}分以上`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sf-light/50 text-sm">
          共找到 <span className="text-sf-light">{filteredProviders.length}</span> 家服务商
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="text-sf-red animate-spin" />
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-sf-blue/30">
          <div className="w-20 h-20 bg-sf-dark rounded-full flex items-center justify-center mx-auto mb-4">
            <Wrench size={36} className="text-sf-light/30" />
          </div>
          <h3 className="text-lg font-display text-sf-light mb-2">暂无符合条件的服务商</h3>
          <p className="text-sf-light/50 text-sm">请尝试调整筛选条件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider, index) => (
            <div
              key={provider.id}
              className="glass rounded-2xl p-6 border border-sf-blue/30 card-hover cursor-pointer"
              onClick={() => fetchProviderDetail(provider.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-sf-red to-sf-orange rounded-xl flex items-center justify-center">
                    <Wrench size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display text-sf-light">{provider.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {renderStars(provider.rating)}
                      <span className="text-sm text-sf-light/70">{provider.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="px-2 py-1 bg-sf-green/10 text-sf-green text-xs rounded-full">
                    可预约
                  </span>
                  <span className="text-sf-light/50 text-xs">已预约 {provider.booked_count} 次</span>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-sf-light/70">
                  <MapPin size={14} className="text-sf-blue shrink-0" />
                  <span className="truncate">{provider.service_area}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-sf-light/70">
                  <Wrench size={14} className="text-sf-yellow shrink-0" />
                  <span className="truncate">{provider.services}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-sf-light/70">
                  <Phone size={14} className="text-sf-green shrink-0" />
                  <span>{provider.contact}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <Award size={14} className="text-sf-yellow" />
                <span className="text-xs text-sf-light/50">资质认证服务商</span>
                <Shield size={14} className="text-sf-green ml-auto" />
                <span className="text-xs text-sf-light/50">安全保障</span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  fetchProviderDetail(provider.id)
                }}
                className="w-full h-10 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors text-sm font-medium"
              >
                查看详情并预约
              </button>
            </div>
          ))}
        </div>
      )}

      {showDetailModal && selectedProvider && (
        <div className="fixed inset-0 bg-sf-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-2xl border border-sf-blue/30 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-sf-blue/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-sf-red to-sf-orange rounded-xl flex items-center justify-center">
                  <Wrench size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-display text-sf-light">{selectedProvider.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-2">
                      {renderStars(selectedProvider.rating, 16)}
                      <span className="text-sf-light/70">{selectedProvider.rating}</span>
                    </div>
                    <span className="text-sf-light/30">|</span>
                    <span className="text-sf-light/50 text-sm">已服务 {selectedProvider.booked_count} 次</span>
                    <span className="text-sf-light/30">|</span>
                    <span className="text-sf-green text-sm">
                      {selectedProvider.completionRate || 100}% 完成率
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-10 h-10 rounded-lg hover:bg-sf-dark flex items-center justify-center text-sf-light/50 hover:text-sf-light transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {showBookSuccess ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-sf-green/10 rounded-full flex items-center justify-center mb-6">
                    <Check size={48} className="text-sf-green" />
                  </div>
                  <h3 className="text-2xl font-display text-sf-light mb-2">预约成功！</h3>
                  <p className="text-sf-light/50 text-center">服务商会在30分钟内与您联系确认服务详情</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-sf-dark/50 rounded-xl">
                      <h4 className="text-sf-light/70 text-sm mb-4 flex items-center gap-2">
                        <Shield size={16} className="text-sf-green" />
                        资质认证
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedProvider.certifications || ['企业营业执照', '工人技能认证', '安全生产许可证', '售后服务保障']).map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-sf-green/10 text-sf-green text-xs rounded-full border border-sf-green/30"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-sf-dark/50 rounded-xl">
                      <h4 className="text-sf-light/70 text-sm mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-sf-yellow" />
                        服务信息
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-sf-light/50">从业经验</span>
                          <span className="text-sf-light">{selectedProvider.experience || 5} 年</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sf-light/50">响应时间</span>
                          <span className="text-sf-light">{selectedProvider.responseTime || '30分钟内'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sf-light/50">服务区域</span>
                          <span className="text-sf-light">{selectedProvider.service_area}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sf-light/50">价格范围</span>
                          <span className="text-sf-red font-medium">
                            ¥{selectedProvider.priceRange?.min || 100} - ¥{selectedProvider.priceRange?.max || 500}/{selectedProvider.priceRange?.unit || '次'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-display text-sf-light mb-3 flex items-center gap-2">
                      <Wrench size={18} className="text-sf-red" />
                      服务项目
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.services.split(/[,，]/).map((service, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light/70 text-sm"
                        >
                          {service.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-display text-sf-light mb-3 flex items-center gap-2">
                      <AlertCircle size={18} className="text-sf-yellow" />
                      服务商介绍
                    </h4>
                    <p className="text-sf-light/70 leading-relaxed">
                      {selectedProvider.description || `${selectedProvider.name}是一家专业从事家具拆装、家电安装的服务机构，拥有多名经验丰富的技术工人。我们秉承"专业、高效、安全"的服务理念，为客户提供优质的拆装服务。所有服务人员均经过专业培训，持证上岗，确保每一次服务都让客户满意。`}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-display text-sf-light mb-4 flex items-center gap-2">
                      <MessageCircle size={18} className="text-sf-blue" />
                      用户评价
                      <span className="text-sm text-sf-light/50 font-normal ml-2">
                        ({(selectedProvider.reviews?.length || 5)}条评价)
                      </span>
                    </h4>

                    <div className="space-y-4">
                      {(selectedProvider.reviews || [
                        {
                          id: 1,
                          user: '张先生',
                          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
                          rating: 5,
                          date: '2024-01-15',
                          content: '师傅非常专业，衣柜拆装很熟练，动作也很麻利。提前到达，服务态度很好，收费透明，非常满意！',
                          service: '衣柜拆装',
                          helpful: 28,
                        },
                        {
                          id: 2,
                          user: '李女士',
                          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
                          rating: 5,
                          date: '2024-01-10',
                          content: '空调移机服务很棒，师傅很细心，抽真空、安装测试都很到位。价格也比其他家实惠，推荐！',
                          service: '空调移机',
                          helpful: 35,
                        },
                        {
                          id: 3,
                          user: '王先生',
                          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
                          rating: 4,
                          date: '2024-01-05',
                          content: '整体服务不错，家具拆装很专业。唯一小建议是希望能带更全的工具，当时找了邻居借了一个扳手。',
                          service: '全屋家具拆装',
                          helpful: 15,
                        },
                      ]).map(review => (
                        <div key={review.id} className="p-5 bg-sf-dark/50 rounded-xl">
                          <div className="flex items-start gap-4">
                            <img
                              src={review.avatar}
                              alt={review.user}
                              className="w-10 h-10 rounded-full bg-sf-dark shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-sf-light font-medium">{review.user}</span>
                                  {renderStars(review.rating, 12)}
                                </div>
                                <span className="text-sf-light/40 text-xs shrink-0">{review.date}</span>
                              </div>
                              <div className="text-xs text-sf-blue mt-1">{review.service}</div>
                              <p className="text-sf-light/70 text-sm mt-3 leading-relaxed">{review.content}</p>
                              <button className="flex items-center gap-1 mt-3 text-sf-light/50 hover:text-sf-green text-xs transition-colors">
                                <ThumbsUp size={12} />
                                有帮助 ({review.helpful})
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!showBookSuccess && (
              <div className="p-6 border-t border-sf-blue/20 bg-sf-dark/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sf-light/50 text-sm">参考价格</div>
                    <div className="text-2xl font-display text-sf-red mt-1">
                      ¥{selectedProvider.priceRange?.min || 100} 起
                    </div>
                  </div>
                  <button
                    onClick={() => handleBook(selectedProvider.id)}
                    disabled={booking === selectedProvider.id}
                    className="flex items-center gap-2 px-8 h-12 bg-sf-red text-white rounded-lg hover:bg-sf-red/90 transition-colors disabled:opacity-50"
                  >
                    {booking === selectedProvider.id ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        预约中...
                      </>
                    ) : (
                      <>
                        <Calendar size={18} />
                        立即预约
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderDirectory
