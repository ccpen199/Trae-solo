import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  MapPin,
  DollarSign,
  Eye,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  Tag,
  X,
  Play,
} from 'lucide-react'
import { projectApi, type Project } from '@/services/api'
import { cn } from '@/lib/utils'
import Layout from '@/components/Layout'
import ProjectCover from '@/components/ProjectCover'

const industries = ['餐饮', '零售', '教育', '医疗', '服务', '娱乐', '科技', '家居']
const investmentRanges = [
  { label: '10万以下', min: 0, max: 10 },
  { label: '10-30万', min: 10, max: 30 },
  { label: '30-50万', min: 30, max: 50 },
  { label: '50-100万', min: 50, max: 100 },
  { label: '100万以上', min: 100, max: 9999 },
]
const provinces = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '山东']

function InvestmentBadge({ min, max }: { min: number; max: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
      <DollarSign size={12} />
      {min}-{max}万
    </span>
  )
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="relative h-40 overflow-hidden">
        <ProjectCover
          name={project.name}
          brand={project.brand_name}
          industry={project.industry}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {project.mengxintong_certified === 1 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
            <ShieldCheck size={12} />
            盟信通认证
          </div>
        )}
        {project.free_joining === 1 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
            免加盟费
          </div>
        )}
        {project.video_url && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-full">
            <Play size={12} fill="currentColor" />
            视频
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">{project.brand_name}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 truncate">{project.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <InvestmentBadge min={project.investment_min} max={project.investment_max} />
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            <Tag size={12} />
            {project.industry}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin size={14} />
            {project.province} {project.city}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={14} />
            {project.view_count}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)

  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [selectedInvestment, setSelectedInvestment] = useState<{ label: string; min: number; max: number } | null>(null)
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [freeJoiningOnly, setFreeJoiningOnly] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [showFilters, setShowFilters] = useState(true)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize }
      if (selectedIndustry) params.industry = selectedIndustry
      if (selectedInvestment) {
        params.investment_min = selectedInvestment.min
        params.investment_max = selectedInvestment.max
      }
      if (selectedProvince) params.province = selectedProvince
      if (freeJoiningOnly) params.free_joining = 1
      if (keyword) params.keyword = keyword

      const res = await projectApi.list(params)
      if (res.success && res.data) {
        setProjects(res.data.list)
        setTotal(res.data.total)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, selectedIndustry, selectedInvestment, selectedProvince, freeJoiningOnly, keyword])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const totalPages = Math.ceil(total / pageSize)

  const clearFilters = () => {
    setSelectedIndustry('')
    setSelectedInvestment(null)
    setSelectedProvince('')
    setFreeJoiningOnly(false)
    setKeyword('')
    setPage(1)
  }

  const hasActiveFilters = selectedIndustry || selectedInvestment || selectedProvince || freeJoiningOnly || keyword

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索项目名称、品牌..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(1)
                }}
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
                <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-start gap-4">
                <span className="w-20 text-sm text-gray-500 pt-1.5 flex-shrink-0">行业</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedIndustry('')
                      setPage(1)
                    }}
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
                      onClick={() => {
                        setSelectedIndustry(ind)
                        setPage(1)
                      }}
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

              <div className="flex items-start gap-4">
                <span className="w-20 text-sm text-gray-500 pt-1.5 flex-shrink-0">投资门槛</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedInvestment(null)
                      setPage(1)
                    }}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-full transition-colors',
                      !selectedInvestment ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    全部
                  </button>
                  {investmentRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => {
                        setSelectedInvestment(range)
                        setPage(1)
                      }}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        selectedInvestment?.label === range.label ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="w-20 text-sm text-gray-500 pt-1.5 flex-shrink-0">区域</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelectedProvince('')
                      setPage(1)
                    }}
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
                      onClick={() => {
                        setSelectedProvince(prov)
                        setPage(1)
                      }}
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

              <div className="flex items-center gap-4">
                <span className="w-20 text-sm text-gray-500 flex-shrink-0">特殊条件</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freeJoiningOnly}
                    onChange={(e) => {
                      setFreeJoiningOnly(e.target.checked)
                      setPage(1)
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">仅显示免加盟费</span>
                </label>
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            搜索结果：共找到 <span className="font-semibold text-gray-900">{total}</span> 个项目
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                    <div className="h-6 bg-gray-200 rounded-full w-16" />
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pageNum = i + 1
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= page - 1 && pageNum <= page + 1)) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          'w-10 h-10 rounded-lg text-sm font-medium transition-colors',
                          page === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        {pageNum}
                      </button>
                    )
                  }
                  if (pageNum === page - 2 || pageNum === page + 2) {
                    return <span key={pageNum} className="px-2 text-gray-400">...</span>
                  }
                  return null
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无匹配的项目</h3>
            <p className="text-gray-500 mb-4">试试调整筛选条件或搜索关键词</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              清除筛选条件
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
