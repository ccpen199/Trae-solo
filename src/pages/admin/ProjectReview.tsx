import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Check,
  X,
  Eye,
  FileText,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Building2,
  DollarSign,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { projectApi, type Project } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import ProjectCover from '@/components/ProjectCover'

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-yellow-100 text-yellow-700' },
  approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', className: 'bg-red-100 text-red-700' },
}

interface ReviewData {
  due_diligence_report: string
  profit_verification: string
  mengxintong_binding: string
  comments: string
}

interface ProjectReviewDetail {
  id: number
  project_id: number
  reviewer_id?: number
  reviewer_name?: string
  status: string
  due_diligence_report?: string
  profit_verification?: string
  mengxintong_binding?: string
  comments?: string
  reviewed_at?: string
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  const config = statusLabels[status] || statusLabels.pending
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full', config.className)}>
      {config.label}
    </span>
  )
}

function ProjectCard({
  project,
  onView,
}: {
  project: Project
  onView: (project: Project) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-36 overflow-hidden">
        <ProjectCover
          name={project.name}
          brand={project.brand_name}
          industry={project.industry}
        />
        <div className="absolute top-3 right-3">
          <StatusBadge status={project.status} />
        </div>
        {project.mengxintong_certified === 1 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
            <ShieldCheck size={12} />
            盟信通认证
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">{project.brand_name}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2 truncate">{project.name}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
            <DollarSign size={12} />
            {project.investment_min}-{project.investment_max}万
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {project.industry}
          </span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin size={14} />
          {project.province} {project.city}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
            project.status !== 'pending' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}>
            <FileText size={12} />
            尽调: {project.status !== 'pending' ? '已提交' : '未提交'}
          </span>
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
            project.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}>
            <TrendingUp size={12} />
            盈利验证: {project.status === 'approved' ? '已完成' : '未完成'}
          </span>
        </div>
        <button
          onClick={() => onView(project)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Eye size={16} />
          查看详情
        </button>
      </div>
    </div>
  )
}

function ReviewModal({
  project,
  onClose,
  onSuccess,
}: {
  project: Project
  onClose: () => void
  onSuccess: () => void
}) {
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [reviewData, setReviewData] = useState<ReviewData>({
    due_diligence_report: '',
    profit_verification: '',
    mengxintong_binding: '',
    comments: '',
  })
  const [existingReview, setExistingReview] = useState<ProjectReviewDetail | null>(null)

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await projectApi.getReview(project.id)
        if (res.success && res.data) {
          setExistingReview(res.data)
          setReviewData({
            due_diligence_report: res.data.due_diligence_report || '',
            profit_verification: res.data.profit_verification || '',
            mengxintong_binding: res.data.mengxintong_binding || '',
            comments: res.data.comments || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch review:', error)
      }
    }
    fetchReview()
  }, [project.id])

  const handleSubmit = async (status: 'approved' | 'rejected') => {
    if (!user) return
    setLoading(true)
    try {
      const res = await projectApi.review(project.id, {
      reviewer_id: user.id,
      status,
      ...reviewData,
    })
    if (res.success) {
      onSuccess()
      onClose()
    }
  } catch (error) {
    console.error('Failed to submit review:', error)
  } finally {
    setLoading(false)
  }
}

  const isReviewed = project.status !== 'pending'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">项目审核</h2>
            <p className="text-sm text-gray-500 mt-1">{project.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">品牌方</p>
              <p className="font-medium text-gray-900">{project.brand_name}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">所属行业</p>
              <p className="font-medium text-gray-900">{project.industry} · {project.category}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">投资金额</p>
              <p className="font-medium text-gray-900">{project.investment_min}-{project.investment_max}万元</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">所在地区</p>
              <p className="font-medium text-gray-900">{project.province} {project.city}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">项目描述</p>
            <p className="text-gray-700">{project.description}</p>
          </div>

          {isReviewed && existingReview && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-blue-600" />
              <span className="font-medium text-blue-900">已有审核记录</span>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">审核人：</span>{existingReview.reviewer_name}</p>
              <p><span className="text-gray-600">审核时间：</span>{existingReview.reviewed_at ? new Date(existingReview.reviewed_at).toLocaleString('zh-CN') : '-'}</p>
              <p><span className="text-gray-600">审核状态：</span>
                <StatusBadge status={existingReview.status} />
              </p>
            </div>
          </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={18} />
              审核表单
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                实地尽调报告
              </label>
              <textarea
                value={reviewData.due_diligence_report}
                onChange={(e) => setReviewData({ ...reviewData, due_diligence_report: e.target.value })}
                disabled={isReviewed}
                placeholder="请输入实地尽调报告内容..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TrendingUp size={16} className="inline mr-1" />
                盈利模型验证
              </label>
              <textarea
                value={reviewData.profit_verification}
                onChange={(e) => setReviewData({ ...reviewData, profit_verification: e.target.value })}
                disabled={isReviewed}
                placeholder="请输入盈利模型验证结果..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ShieldCheck size={16} className="inline mr-1" />
                盟信通认证绑定
              </label>
              <textarea
                value={reviewData.mengxintong_binding}
                onChange={(e) => setReviewData({ ...reviewData, mengxintong_binding: e.target.value })}
                disabled={isReviewed}
                placeholder="请输入盟信通认证绑定信息..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                审核意见
              </label>
              <textarea
                value={reviewData.comments}
                onChange={(e) => setReviewData({ ...reviewData, comments: e.target.value })}
                disabled={isReviewed}
                placeholder="请输入审核意见..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            关闭
          </button>
          {!isReviewed && (
            <>
              <button
                onClick={() => handleSubmit('rejected')}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                驳回
              </button>
              <button
                onClick={() => handleSubmit('approved')}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                通过
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProjectReview() {
  const user = useAuthStore((state) => state.user)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [total, setTotal] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<string>('pending')
  const [keyword, setKeyword] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const statusOptions = [
    { value: 'pending', label: '待审核' },
    { value: 'approved', label: '已通过' },
    { value: 'rejected', label: '已驳回' },
  ]

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, pageSize, status: selectedStatus }
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
  }, [page, pageSize, selectedStatus, keyword])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const totalPages = Math.ceil(total / pageSize)

  const handleReviewSuccess = () => {
    fetchProjects()
  }

  if (user?.role !== 'admin') {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">无权限访问</h3>
            <p className="text-gray-500">该页面仅平台管理员可访问</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'pending').length}</p>
              <p className="text-sm text-gray-500">待审核项目</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status !== 'pending').length}</p>
              <p className="text-sm text-gray-500">已提交尽调报告</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.status === 'approved').length}</p>
              <p className="text-sm text-gray-500">已完成盈利验证</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <ShieldCheck size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.filter(p => p.mengxintong_certified === 1).length}</p>
              <p className="text-sm text-gray-500">盟信通已绑定</p>
            </div>
          </div>
        </div>
      </div>

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
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setSelectedStatus(status.value)
                    setPage(1)
                  }}
                  className={cn(
                    'px-4 py-2.5 text-sm rounded-lg transition-colors',
                    selectedStatus === status.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            共 <span className="font-semibold text-gray-900">{total}</span> 个项目
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-36 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-3/4" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                    <div className="h-6 bg-gray-200 rounded-full w-16" />
                  </div>
                  <div className="h-9 bg-gray-200 rounded-lg w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={setSelectedProject}
                />
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
              <Clock size={28} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无项目</h3>
            <p className="text-gray-500">当前筛选条件下没有项目</p>
          </div>
        )}
      </div>

      {selectedProject && (
        <ReviewModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </>
  )
}
