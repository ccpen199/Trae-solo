import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Search,
  Building2,
  TrendingUp,
  DollarSign,
  Filter,
  X,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react'
import { projectApi, type Project } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const provinces = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '山东', '河南', '福建', '湖南', '安徽', '河北', '辽宁', '陕西']
const industries = ['餐饮', '零售', '教育', '医疗', '服务', '娱乐', '科技', '家居']

interface CityData {
  name: string
  province: string
  projectCount: number
  opportunityCount: number
  avgInvestment: string
  growthRate: string
  hotProjects: Project[]
}

const mockCityData: CityData[] = [
  { name: '北京', province: '北京', projectCount: 156, opportunityCount: 328, avgInvestment: '50-80万', growthRate: '+15.2%', hotProjects: [] },
  { name: '上海', province: '上海', projectCount: 142, opportunityCount: 298, avgInvestment: '55-90万', growthRate: '+12.8%', hotProjects: [] },
  { name: '广州', province: '广东', projectCount: 128, opportunityCount: 265, avgInvestment: '40-70万', growthRate: '+18.5%', hotProjects: [] },
  { name: '深圳', province: '广东', projectCount: 135, opportunityCount: 278, avgInvestment: '60-100万', growthRate: '+20.1%', hotProjects: [] },
  { name: '杭州', province: '浙江', projectCount: 98, opportunityCount: 215, avgInvestment: '45-75万', growthRate: '+16.7%', hotProjects: [] },
  { name: '南京', province: '江苏', projectCount: 86, opportunityCount: 189, avgInvestment: '40-65万', growthRate: '+14.3%', hotProjects: [] },
  { name: '成都', province: '四川', projectCount: 105, opportunityCount: 235, avgInvestment: '35-60万', growthRate: '+22.4%', hotProjects: [] },
  { name: '武汉', province: '湖北', projectCount: 92, opportunityCount: 198, avgInvestment: '35-55万', growthRate: '+17.9%', hotProjects: [] },
  { name: '西安', province: '陕西', projectCount: 78, opportunityCount: 168, avgInvestment: '30-50万', growthRate: '+19.6%', hotProjects: [] },
  { name: '郑州', province: '河南', projectCount: 85, opportunityCount: 182, avgInvestment: '25-45万', growthRate: '+21.2%', hotProjects: [] },
  { name: '长沙', province: '湖南', projectCount: 72, opportunityCount: 156, avgInvestment: '30-50万', growthRate: '+16.8%', hotProjects: [] },
  { name: '济南', province: '山东', projectCount: 68, opportunityCount: 145, avgInvestment: '35-55万', growthRate: '+15.1%', hotProjects: [] },
  { name: '合肥', province: '安徽', projectCount: 65, opportunityCount: 138, avgInvestment: '25-40万', growthRate: '+18.3%', hotProjects: [] },
  { name: '福州', province: '福建', projectCount: 58, opportunityCount: 125, avgInvestment: '30-50万', growthRate: '+14.7%', hotProjects: [] },
  { name: '石家庄', province: '河北', projectCount: 62, opportunityCount: 132, avgInvestment: '25-40万', growthRate: '+13.9%', hotProjects: [] },
  { name: '沈阳', province: '辽宁', projectCount: 55, opportunityCount: 118, avgInvestment: '20-35万', growthRate: '+11.5%', hotProjects: [] },
]

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string; trend?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

function CityCard({ city, onClick, isSelected }: { city: CityData; onClick: () => void; isSelected: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl p-4 border border-gray-100 shadow-sm cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 border-blue-500'
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin size={16} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{city.name}</h4>
            <p className="text-xs text-gray-500">{city.province}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          <TrendingUp size={10} />
          {city.growthRate}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-gray-500 text-xs">项目数</p>
          <p className="font-semibold text-gray-900">{city.projectCount}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-gray-500 text-xs">商机数</p>
          <p className="font-semibold text-orange-600">{city.opportunityCount}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-500">平均投资</span>
        <span className="font-medium text-gray-900">{city.avgInvestment}</span>
      </div>
    </div>
  )
}

function MapVisualization({ selectedCity, onCitySelect }: { selectedCity: CityData | null; onCitySelect: (city: CityData) => void }) {
  const getCityPosition = (name: string) => {
    const positions: Record<string, { x: number; y: number }> = {
      '北京': { x: 75, y: 25 },
      '上海': { x: 78, y: 48 },
      '广州': { x: 68, y: 82 },
      '深圳': { x: 65, y: 85 },
      '杭州': { x: 80, y: 55 },
      '南京': { x: 72, y: 50 },
      '成都': { x: 35, y: 55 },
      '武汉': { x: 60, y: 52 },
      '西安': { x: 45, y: 40 },
      '郑州': { x: 62, y: 38 },
      '长沙': { x: 62, y: 65 },
      '济南': { x: 75, y: 40 },
      '合肥': { x: 70, y: 55 },
      '福州': { x: 82, y: 70 },
      '石家庄': { x: 68, y: 30 },
      '沈阳': { x: 85, y: 20 },
    }
    return positions[name] || { x: 50, y: 50 }
  }

  const getDotSize = (count: number) => {
    if (count >= 150) return 'w-6 h-6'
    if (count >= 100) return 'w-5 h-5'
    if (count >= 70) return 'w-4 h-4'
    return 'w-3 h-3'
  }

  const getDotColor = (count: number, isSelected: boolean) => {
    if (isSelected) return 'bg-blue-600 ring-4 ring-blue-300'
    if (count >= 150) return 'bg-red-500'
    if (count >= 100) return 'bg-orange-500'
    if (count >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MapPin size={20} className="text-blue-600" />
        商机分布地图
      </h3>
      <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-xl h-96 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 10 20 Q 20 10, 40 15 Q 60 10, 80 20 Q 95 30, 90 50 Q 95 70, 80 85 Q 60 95, 40 90 Q 20 95, 10 80 Q 5 60, 10 40 Q 5 25, 10 20"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              strokeDasharray="1 1"
            />
            <path
              d="M 25 30 Q 35 25, 50 30 Q 65 25, 75 35 Q 80 50, 70 65 Q 55 75, 40 70 Q 25 75, 20 60 Q 15 45, 25 30"
              fill="none"
              stroke="#10b981"
              strokeWidth="0.3"
              strokeDasharray="0.5 0.5"
            />
          </svg>
        </div>

        {mockCityData.map((city) => {
          const pos = getCityPosition(city.name)
          const isSelected = selectedCity?.name === city.name
          return (
            <div
              key={city.name}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => onCitySelect(city)}
            >
              <div
                className={cn(
                  'rounded-full flex items-center justify-center text-white text-xs font-bold transition-all hover:scale-125 animate-pulse',
                  getDotSize(city.projectCount),
                  getDotColor(city.projectCount, isSelected)
                )}
              >
                {city.projectCount >= 100 ? city.projectCount : ''}
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {city.name} - {city.opportunityCount}个商机
                </div>
              </div>
            </div>
          )
        })}

        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">图例</p>
          <div className="space-y-1.5">
            {[
              { color: 'bg-red-500', label: '≥150个项目' },
              { color: 'bg-orange-500', label: '100-149个项目' },
              { color: 'bg-yellow-500', label: '70-99个项目' },
              { color: 'bg-green-500', label: '<70个项目' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={cn('w-3 h-3 rounded-full', item.color)} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MapView() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [cities, setCities] = useState<CityData[]>(mockCityData)
  const [hotProjects, setHotProjects] = useState<Project[]>([])
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchHotProjects = async () => {
      setLoading(true)
      try {
        const res = await projectApi.list({ pageSize: 6 })
        if (res.success && res.data) {
          setHotProjects(res.data.list)
        }
      } catch (error) {
        console.error('Failed to fetch hot projects:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHotProjects()
  }, [])

  useEffect(() => {
    let filtered = [...mockCityData]
    if (selectedProvince) {
      filtered = filtered.filter((c) => c.province === selectedProvince)
    }
    if (keyword) {
      filtered = filtered.filter((c) => c.name.includes(keyword) || c.province.includes(keyword))
    }
    setCities(filtered)
    if (selectedCity && !filtered.find((c) => c.name === selectedCity.name)) {
      setSelectedCity(null)
    }
  }, [selectedProvince, keyword, selectedCity])

  const totalProjects = cities.reduce((sum, c) => sum + c.projectCount, 0)
  const totalOpportunities = cities.reduce((sum, c) => sum + c.opportunityCount, 0)

  const clearFilters = () => {
    setSelectedProvince('')
    setSelectedIndustry('')
    setKeyword('')
    setSelectedCity(null)
  }

  const hasActiveFilters = selectedProvince || selectedIndustry || keyword

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={MapPin}
            label="覆盖城市"
            value={cities.length.toString()}
            color="bg-blue-500"
          />
          <StatCard
            icon={Building2}
            label="项目总数"
            value={totalProjects.toString()}
            trend="+15.8%"
            color="bg-green-500"
          />
          <StatCard
            icon={TrendingUp}
            label="商机总数"
            value={totalOpportunities.toString()}
            trend="+18.2%"
            color="bg-orange-500"
          />
          <StatCard
            icon={DollarSign}
            label="平均投资"
            value="35-60万"
            color="bg-purple-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索城市名称..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors',
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              <Filter size={18} />
              筛选
              {hasActiveFilters && (
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">!</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-start gap-4">
                <span className="w-20 text-sm text-gray-500 pt-1.5 flex-shrink-0">省份</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedProvince('')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition-colors',
                      !selectedProvince ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    全部
                  </button>
                  {provinces.map((prov) => (
                    <button
                      key={prov}
                      onClick={() => setSelectedProvince(prov)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        selectedProvince === prov ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {prov}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="w-20 text-sm text-gray-500 pt-1.5 flex-shrink-0">行业</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedIndustry('')}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition-colors',
                      !selectedIndustry ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    全部
                  </button>
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setSelectedIndustry(ind)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        selectedIndustry === ind ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <X size={14} />
                    清除筛选
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MapVisualization selectedCity={selectedCity} onCitySelect={setSelectedCity} />

            {selectedCity && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MapPin size={20} className="text-blue-600" />
                    {selectedCity.name} 热门商机
                  </h3>
                  <button
                    onClick={() => setSelectedCity(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="p-4">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : hotProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hotProjects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 truncate">{project.name}</h4>
                            <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-orange-600 font-medium">
                              {project.investment_min}-{project.investment_max}万
                            </span>
                            <span className="text-gray-400">|</span>
                            <span className="text-gray-500">{project.industry}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle size={32} className="text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">暂无热门商机</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-orange-500" />
                  商机热度排行
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {cities
                  .sort((a, b) => b.opportunityCount - a.opportunityCount)
                  .slice(0, 10)
                  .map((city, index) => (
                    <div
                      key={city.name}
                      onClick={() => setSelectedCity(city)}
                      className={cn(
                        'px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors',
                        selectedCity?.name === city.name && 'bg-blue-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            index === 0 ? 'bg-yellow-500 text-white' : '',
                            index === 1 ? 'bg-gray-400 text-white' : '',
                            index === 2 ? 'bg-orange-600 text-white' : '',
                            index > 2 ? 'bg-gray-100 text-gray-600' : ''
                          )}
                        >
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{city.name}</p>
                          <p className="text-xs text-gray-500">{city.province}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600 text-sm">{city.opportunityCount}</p>
                        <p className="text-xs text-green-600">{city.growthRate}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <h3 className="font-semibold text-lg mb-2">发现本地商机</h3>
              <p className="text-blue-100 text-sm mb-4">
                基于您的位置和投资偏好，为您推荐最适合的加盟项目
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                立即探索
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
