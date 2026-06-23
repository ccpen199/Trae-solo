import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MapPin, Search, Filter, Clock, Calendar, PawPrint, UserCheck } from 'lucide-react'
import { useAdoptionStore } from '@/stores/adoptionStore'
import { useAuthStore } from '@/stores/authStore'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'

const speciesOptions = [
  { value: 'all', label: '全部' },
  { value: 'dog', label: '狗狗' },
  { value: 'cat', label: '猫咪' },
  { value: 'other', label: '其他' },
]

const ageOptions = [
  { value: 'all', label: '不限' },
  { value: 'young', label: '幼年' },
  { value: 'adult', label: '成年' },
  { value: 'senior', label: '老年' },
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
  { value: 'updated', label: '最近更新' },
]

const statusMap: Record<string, { status: string; label: string }> = {
  pending_review: { status: 'warning', label: '待审核' },
  approved: { status: 'success', label: '可领养' },
  rejected: { status: 'danger', label: '已拒绝' },
  completed: { status: 'info', label: '已领养' },
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

function getAgeCategory(birthDate: string): string {
  if (!birthDate) return 'all'
  const age = calculateAge(birthDate)
  if (age.includes('岁') && parseInt(age) >= 7) return 'senior'
  if (age.includes('岁') && parseInt(age) >= 1) return 'adult'
  return 'young'
}

export default function AdoptionCenter() {
  const { adoptions, stats, fetchAdoptions } = useAdoptionStore()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    species: 'all',
    age: 'all',
    region: 'all',
    search: '',
    sort: 'created',
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await fetchAdoptions()
      setLoading(false)
    }
    load()
  }, [fetchAdoptions])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const filteredAdoptions = adoptions.filter((adoption) => {
    if (filters.species !== 'all' && adoption.species !== filters.species) {
      if (filters.species === 'other') {
        if (['dog', 'cat'].includes(adoption.species)) {
          return false
        }
      } else {
        return false
      }
    }
    if (filters.age !== 'all') {
      const category = getAgeCategory(adoption.birth_date)
      if (category !== filters.age) return false
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const nameMatch = adoption.pet_name?.toLowerCase().includes(searchLower)
      const breedMatch = adoption.breed?.toLowerCase().includes(searchLower)
      if (!nameMatch && !breedMatch) return false
    }
    return true
  })

  const sortedAdoptions = [...filteredAdoptions].sort((a, b) => {
    if (filters.sort === 'updated') {
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl">
            <h1 className="heading-font text-4xl font-bold mb-3">领养中心</h1>
            <p className="text-xl text-primary-50 mb-8">给每一个生命一个温暖的家</p>
            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5" />
                <span>今日待领养 <strong className="text-2xl">{stats?.available || 0}</strong> 只</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span>已成功领养 <strong className="text-2xl">{stats?.completed || 0}</strong> 只</span>
              </div>
            </div>
            {user && (
              <Link
                to="/adoptions/publish"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-semibold rounded-xl hover:bg-primary-50 transition shadow-lg"
              >
                <Heart className="w-5 h-5" />
                我要送养
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
              {speciesOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange('species', opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filters.species === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-stone-200" />
            <div className="flex flex-wrap gap-2">
              {ageOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange('age', opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filters.age === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-stone-100 text-text-secondary hover:bg-stone-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
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
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedAdoptions.length === 0 ? (
          <EmptyState
            title="暂无符合条件的领养信息"
            description="试试调整筛选条件，或查看所有领养信息"
            action={{
              label: '查看全部',
              onClick: () => setFilters({ species: 'all', age: 'all', region: 'all', search: '', sort: 'created' }),
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAdoptions.map((adoption, index) => {
              const statusInfo = statusMap[adoption.status] || { status: 'info', label: '进行中' }
              const age = calculateAge(adoption.birth_date)
              const imgSrc = adoption.pet_avatar || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20${adoption.species}%20pet%20portrait&image_size=square`

              return (
                <Link
                  key={adoption.id}
                  to={`/adoptions/${adoption.id}`}
                  className="bg-white rounded-2xl overflow-hidden card-hover shadow-sm opacity-0 animate-slideUp"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={adoption.pet_name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <StatusBadge status={statusInfo.status} label={statusInfo.label} />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="heading-font text-xl font-semibold text-text-primary">{adoption.pet_name}</h3>
                    </div>
                    <p className="text-sm text-text-secondary mb-3">
                      {[adoption.breed, age, adoption.gender === 'male' ? '公' : adoption.gender === 'female' ? '母' : '未知'].filter(Boolean).join(' · ')}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-text-secondary mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>北京市朝阳区</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-text-secondary">
                        {adoption.owner_name}
                        {adoption.owner_verified === 'verified' && (
                          <span className="ml-1 text-success">· 已认证</span>
                        )}
                      </span>
                    </div>
                    {adoption.requirements && (
                      <p className="text-sm text-text-secondary line-clamp-2 mb-4 bg-stone-50 p-3 rounded-lg">
                        要求：{adoption.requirements}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-text-secondary">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(adoption.created_at).toLocaleDateString('zh-CN')}</span>
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
