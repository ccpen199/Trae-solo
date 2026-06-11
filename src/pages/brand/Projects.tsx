import { useEffect, useState } from 'react'
import { projectApi, type Project } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import {
  FolderKanban,
  Plus,
  Edit2,
  Eye,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  AlertCircle,
  X,
  Check,
  Clock,
  XCircle,
  DollarSign,
  MapPin,
  EyeOff,
} from 'lucide-react'

interface ProjectFormData {
  name: string
  industry: string
  category: string
  investment_min: number
  investment_max: number
  free_joining: number
  area_required: string
  profit_model: string
  description: string
  province: string
  city: string
  address: string
}

const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const statusIcons: Record<string, React.ElementType> = {
  draft: EyeOff,
  pending: Clock,
  approved: Check,
  rejected: XCircle,
}

const industries = ['餐饮', '零售', '教育', '服务', '科技', '医疗', '其他']
const categories = [
  '火锅',
  '奶茶',
  '快餐',
  '便利店',
  '服装店',
  '培训机构',
  '美容美发',
  '其他',
]

export default function Projects() {
  const user = useAuthStore((state) => state.user)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    industry: '',
    category: '',
    investment_min: 0,
    investment_max: 0,
    free_joining: 0,
    area_required: '',
    profit_model: '',
    description: '',
    province: '',
    city: '',
    address: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [showDetail, setShowDetail] = useState<Project | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [user?.id, statusFilter])

  const fetchProjects = async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const params: any = { brand_id: user.id, pageSize: 100 }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const res = await projectApi.list(params)
      if (res.success) {
        setProjects(res.data?.list || [])
      }
    } catch (err) {
      setError('加载项目列表失败')
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.industry.includes(searchTerm) ||
      p.category.includes(searchTerm)
  )

  const handleAdd = () => {
    setEditingProject(null)
    setFormData({
      name: '',
      industry: '',
      category: '',
      investment_min: 0,
      investment_max: 0,
      free_joining: 0,
      area_required: '',
      profit_model: '',
      description: '',
      province: '',
      city: '',
      address: '',
    })
    setShowModal(true)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      industry: project.industry,
      category: project.category,
      investment_min: project.investment_min,
      investment_max: project.investment_max,
      free_joining: project.free_joining,
      area_required: project.area_required,
      profit_model: project.profit_model,
      description: project.description,
      province: project.province,
      city: project.city,
      address: project.address,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.industry || !formData.category) {
      alert('请填写必填项')
      return
    }

    setSubmitting(true)
    try {
      if (editingProject) {
        const res = await projectApi.update(editingProject.id, formData)
        if (res.success) {
          setShowModal(false)
          fetchProjects()
        }
      } else {
        const res = await projectApi.create({
          ...formData,
          brand_id: user?.id,
          status: 'pending',
        })
        if (res.success) {
          setShowModal(false)
          fetchProjects()
        }
      }
    } catch (err) {
      console.error('Failed to submit project:', err)
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitForReview = async (project: Project) => {
    if (!confirm('确定要提交审核吗？提交后将无法修改。')) return
    try {
      const res = await projectApi.review(project.id, {
        status: 'pending',
        comment: '申请审核',
      })
      if (res.success) {
        fetchProjects()
      }
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert('提交审核失败')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">项目管理</h1>
          <p className="text-gray-500 mt-1">管理您的招商项目，提交审核后可对外展示</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          新增项目
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索项目名称、行业、类别..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="pending">审核中</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['all', 'draft', 'pending', 'approved'] as const).map((status) => {
          const count =
            status === 'all'
              ? projects.length
              : projects.filter((p) => p.status === status).length
          const label =
            status === 'all'
              ? '全部项目'
              : statusLabels[status]
          const StatusIcon = status === 'all' ? FolderKanban : statusIcons[status]
          return (
            <div
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                statusFilter === status
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    statusFilter === status
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <StatusIcon
                    className={`w-5 h-5 ${
                      statusFilter === status
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无项目数据</p>
            <button
              onClick={handleAdd}
              className="mt-4 text-blue-500 hover:text-blue-600 text-sm"
            >
              + 创建第一个项目
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredProjects.map((project) => {
              const StatusIcon = statusIcons[project.status] || EyeOff
              return (
                <div
                  key={project.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {project.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[project.status]}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusLabels[project.status]}
                        </span>
                        {project.mengxintong_certified === 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            <Check className="w-3 h-3" />
                            盟信通认证
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <FolderKanban className="w-4 h-4" />
                          {project.industry} · {project.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ¥{project.investment_min?.toLocaleString()} -¥{project.investment_max?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {project.province} {project.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {project.view_count || 0} 次浏览
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setShowDetail(project)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {project.status === 'draft' && (
                        <>
                          <button
                            onClick={() => handleEdit(project)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleSubmitForReview(project)}
                            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            提交审核
                          </button>
                        </>
                      )}
                      {project.status === 'rejected' && (
                        <button
                          onClick={() => handleEdit(project)}
                          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="修改后重新提交"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingProject ? '编辑项目' : '新增项目'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入项目名称"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所属行业 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) =>
                      setFormData({ ...formData, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择行业</option>
                    {industries.map((i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目类别 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择类别</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    投资金额下限（元）
                  </label>
                  <input
                    type="number"
                    value={formData.investment_min}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investment_min: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    投资金额上限（元）
                  </label>
                  <input
                    type="number"
                    value={formData.investment_max}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investment_max: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    加盟费（元）
                  </label>
                  <input
                    type="number"
                    value={formData.free_joining}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        free_joining: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    面积要求
                  </label>
                  <input
                    type="text"
                    value={formData.area_required}
                    onChange={(e) =>
                      setFormData({ ...formData, area_required: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：50-100㎡"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    盈利模式
                  </label>
                  <input
                    type="text"
                    value={formData.profit_model}
                    onChange={(e) =>
                      setFormData({ ...formData, profit_model: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：直营、加盟、联营"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    项目描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="请输入项目详细描述..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    省份
                  </label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({ ...formData, province: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：浙江省"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    城市
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：杭州市"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    详细地址
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入详细地址"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {editingProject ? '保存修改' : '提交审核'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                项目详情
              </h2>
              <button
                onClick={() => setShowDetail(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">
                      {showDetail.name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[showDetail.status]}`}
                    >
                      {statusLabels[showDetail.status]}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    创建于{' '}
                    {new Date(showDetail.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">行业</p>
                    <p className="font-medium text-gray-800">
                      {showDetail.industry}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">类别</p>
                    <p className="font-medium text-gray-800">
                      {showDetail.category}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">投资金额</p>
                    <p className="font-medium text-gray-800">
                      ¥{showDetail.investment_min?.toLocaleString()} -¥{showDetail.investment_max?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">加盟费</p>
                    <p className="font-medium text-gray-800">
                      ¥{showDetail.free_joining?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">面积要求</p>
                    <p className="font-medium text-gray-800">
                      {showDetail.area_required || '-'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">盈利模式</p>
                    <p className="font-medium text-gray-800">
                      {showDetail.profit_model || '-'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">项目描述</p>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {showDetail.description || '暂无描述'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">公司地址</p>
                  <p className="text-gray-700">
                    {showDetail.province} {showDetail.city} {showDetail.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
