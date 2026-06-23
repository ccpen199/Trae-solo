import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Search, Filter, Clock, Calendar, PawPrint, UserCheck, Award, Dog, Cat } from 'lucide-react'
import { useBreedingStore } from '@/stores/breedingStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

const speciesOptions = [
  { value: 'all', label: '全部' },
  { value: 'dog', label: '狗狗', icon: Dog },
  { value: 'cat', label: '猫咪', icon: Cat },
  { value: 'other', label: '其他' },
]

const regionOptions = [
  { value: 'all', label: '选择地区' },
  { value: 'beijing', label: '北京' },
  { value: 'shanghai', label: '上海' },
  { value: 'guangzhou', label: '广州' },
  { value: 'shenzhen', label: '深圳' },
]

const sortOptions = [
  { value: 'created', label: '最新发布' },
  { value: 'fee_asc', label: '费用从低到高' },
  { value: 'fee_desc', label: '费用从高到低' },
  { value: 'match', label: '匹配度优先' },
]

const statusMap: Record<string, { status: string; label: string }> = {
  pending_review: { status: 'warning', label: '待审核' },
  approved: { status: 'success', label: '可配种' },
  matched: { status: 'info', label: '已撮合' },
  agreed: { status: 'info', label: '协议中' },
  in_escrow: { status: 'info', label: '托管中' },
  completed: { status: 'success', label: '已完成' },
}

function calculateAge(birthDate: string): string {
  if (!birthDate) return '未知'
  const birth = new Date(birthDate)
  const now = new Date()
  const years = now.getFullYear() - birth.getFullYear()
  const months = now.getMonth() - birth.getMonth()
  if (years > 0) return `${years}岁`
  if (months > 0) return `${months}个月`
  return '幼崽'
}

export default function BreedingSquare() {
  const { breedings, fetchBreedings } = useBreedingStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    species: 'all',
    region: 'all',
    search: '',
    sort: 'created',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchBreedings()
      setLoading(false)
    }
    load()
  }, [fetchBreedings])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const filteredBreedings = breedings.filter((breeding) => {
    if (filters.species !== 'all' && breeding.species !== filters.species) {
      if (filters.species === 'other') {
        if (['dog', 'cat'].includes(breeding.species)) return false
      } else {
        return false
      }
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = breeding.pet_name?.toLowerCase().includes(searchLower)
      const breedMatch = breeding.breed?.toLowerCase().includes(searchLower)
      if (!nameMatch && !breedMatch) return false
    }
    return true
  })

  const sortedBreedings = [...filteredBreedings].sort((a, b) => {
    if (filters.sort === 'fee_asc') return (a.fee || 0) - (b.fee || 0)
    if (filters.sort === 'fee_desc') return (b.fee || 0) - (a.fee || 0)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const completedCount = breedings.filter((b) => b.status === 'completed').length

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl">
            <h1 className="heading-font text-4xl font-bold mb-3">配种广场</h1>
            <p className="text-xl text-primary-50 mb-8">专业血统撮合 · 费用安全托管</p>
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5" />
                <span>配种需求 <strong className="text-2xl">{breedings.length}</strong> 条</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span>已成功撮合 <strong className="text-2xl">{completedCount}</strong> 次</span>
              </div>
            </div>
            {user && (
              <Link
                to="/breedings/publish"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-primary-50 transition shadow-lg"
              >
                <Heart className="w-5 h-5" />
                发布配种需求
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">筛选</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {speciesOptions.map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleFilterChange('species', opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      filters.species === opt.value
                        ? 'bg-primary text-white'
                        : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="px-4 py-2 rounded-lg text-sm bg-stone-100 text-text-primary border-0 focus:ring-2 focus:ring-primary/30"
            >
              {regionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex-1 min-w-[200px] max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="搜索品种/名称"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg text-sm bg-stone-100 border-0 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 rounded-lg text-sm bg-stone-100 text-text-primary border-0 focus:ring-2 focus:ring-primary/30"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-square bg-stone-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-stone-200 rounded w-1/2" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-6 bg-stone-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedBreedings.length === 0 ? (
          <EmptyState
            title="暂无符合条件的配种信息"
            description="试试调整筛选条件，或查看所有配种信息"
            action={{
              label: '查看全部',
              onClick: () => setFilters({ species: 'all', region: 'all', search: '', sort: 'created' }),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedBreedings.map((breeding, index) => {
              const statusInfo = statusMap[breeding.status] || { status: 'info', label: '进行中' }
              const age = calculateAge(breeding.birth_date)
              const species = breeding.species || 'dog'
              const imgSrc = breeding.pet_avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${species}%20pet%20portrait&image_size=square`

              return (
                <Link
                  key={breeding.id}
                  to={`/breedings/${breeding.id}`}
                  className="bg-white rounded-2xl overflow-hidden card-hover shadow-sm opacity-0 animate-slideUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={breeding.pet_name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                    </div>
                    {breeding.pedigree_cert_url && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-secondary text-white text-xs rounded-full font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        血统认证
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="heading-font text-xl font-semibold text-text-primary">{breeding.pet_name}</h3>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">
                      {[breeding.breed, age, breeding.gender === 'male' ? '公' : breeding.gender === 'female' ? '母' : '未知'].filter(Boolean).join(' · ')}
                    </p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-primary">¥{breeding.fee?.toLocaleString() || 0}</span>
                      <span className="text-sm text-text-secondary ml-1">配种费</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-text-secondary mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{breeding.region || '北京市朝阳区'}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">
                        {breeding.owner_name}
                        {breeding.owner_verified === 'verified' && (
                          <span className="ml-1 text-success">· 已认证</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-1 text-text-secondary">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(breeding.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <span className="text-primary font-medium flex items-center gap-1">
                        查看详情
                        <Calendar className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
