import { useEffect, useState } from 'react'
import { franchiseeApi, type Franchisee } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  Check,
  DollarSign,
  Store,
  Handshake,
  Repeat2,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit2,
} from 'lucide-react'

const stages: Array<'lead' | 'signed' | 'opened' | 'repurchase'> = [
  'lead',
  'signed',
  'opened',
  'repurchase',
]

const stageLabels: Record<string, string> = {
  lead: '线索',
  signed: '签约',
  opened: '开店',
  repurchase: '复购',
}

const stageColors: Record<string, string> = {
  lead: 'bg-blue-500',
  signed: 'bg-green-500',
  opened: 'bg-purple-500',
  repurchase: 'bg-orange-500',
}

const stageBgColors: Record<string, string> = {
  lead: 'bg-blue-50',
  signed: 'bg-green-50',
  opened: 'bg-purple-50',
  repurchase: 'bg-orange-50',
}

const stageTextColors: Record<string, string> = {
  lead: 'text-blue-600',
  signed: 'text-green-600',
  opened: 'text-purple-600',
  repurchase: 'text-orange-600',
}

const stageBadgeColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700',
  signed: 'bg-green-100 text-green-700',
  opened: 'bg-purple-100 text-purple-700',
  repurchase: 'bg-orange-100 text-orange-700',
}

const stageIcons: Record<string, React.ElementType> = {
  lead: Users,
  signed: Handshake,
  opened: Store,
  repurchase: Repeat2,
}

interface StageConversionData {
  signed_amount?: number
  signed_date?: string
  store_name?: string
  store_address?: string
  opened_date?: string
  repurchase_amount?: number
  repurchase_date?: string
}

export default function Franchisees() {
  const user = useAuthStore((state) => state.user)
  const [allFranchisees, setAllFranchisees] = useState<Franchisee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStage, setActiveStage] = useState<string>('all')
  const [showDetail, setShowDetail] = useState<Franchisee | null>(null)
  const [showConversion, setShowConversion] = useState<{
    franchisee: Franchisee
    targetStage: string
  } | null>(null)
  const [conversionData, setConversionData] = useState<StageConversionData>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchFranchisees()
  }, [user?.id])

  const fetchFranchisees = async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await franchiseeApi.list({
        brand_id: user.id,
        pageSize: 100,
      })
      if (res.success) {
        setAllFranchisees(res.data?.list || [])
      }
    } catch (err) {
      setError('加载加盟商列表失败')
      console.error('Failed to fetch franchisees:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredFranchisees = allFranchisees.filter(
    (f) =>
      (activeStage === 'all' || f.stage === activeStage) &&
      (f.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contact_phone.includes(searchTerm) ||
        (f.project_name && f.project_name.includes(searchTerm)))
  )

  const franchiseesByStage = stages.reduce((acc, stage) => {
    acc[stage] = filteredFranchisees.filter((f) => f.stage === stage)
    return acc
  }, {} as Record<string, Franchisee[]>)

  const getNextStage = (currentStage: string): string | null => {
    const currentIndex = stages.indexOf(currentStage as any)
    if (currentIndex < stages.length - 1) {
      return stages[currentIndex + 1]
    }
    return null
  }

  const handleStageConversion = async () => {
    if (!showConversion) return

    const { franchisee, targetStage } = showConversion
    const updateData: any = { stage: targetStage }

    if (targetStage === 'signed') {
      if (!conversionData.signed_amount) {
        alert('请填写签约金额')
        return
      }
      updateData.signed_amount = conversionData.signed_amount
      updateData.signed_date =
        conversionData.signed_date || new Date().toISOString().split('T')[0]
    } else if (targetStage === 'opened') {
      if (!conversionData.store_name || !conversionData.store_address) {
        alert('请填写门店名称和地址')
        return
      }
      updateData.store_name = conversionData.store_name
      updateData.store_address = conversionData.store_address
      updateData.opened_date =
        conversionData.opened_date || new Date().toISOString().split('T')[0]
    } else if (targetStage === 'repurchase') {
      if (!conversionData.repurchase_amount) {
        alert('请填写复购金额')
        return
      }
      updateData.repurchase_amount = conversionData.repurchase_amount
      updateData.repurchase_date =
        conversionData.repurchase_date || new Date().toISOString().split('T')[0]
    }

    setSubmitting(true)
    try {
      const res = await franchiseeApi.update(franchisee.id, updateData)
      if (res.success) {
        setShowConversion(null)
        setConversionData({})
        fetchFranchisees()
      }
    } catch (err) {
      console.error('Failed to update franchisee stage:', err)
      alert('阶段转换失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const openConversionModal = (
    franchisee: Franchisee,
    targetStage: string
  ) => {
    setShowConversion({ franchisee, targetStage })
    setConversionData({})
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
            onClick={fetchFranchisees}
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
          <h1 className="text-2xl font-bold text-gray-800">加盟商管理</h1>
          <p className="text-gray-500 mt-1">
            管理加盟商全生命周期，从线索到复购的全过程跟踪
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索加盟商姓名、电话、项目名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStage('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeStage === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          全部 ({filteredFranchisees.length})
        </button>
        {stages.map((stage) => {
          const StageIcon = stageIcons[stage]
          const count = franchiseesByStage[stage]?.length || 0
          return (
            <button
              key={stage}
              onClick={() => setActiveStage(stage)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeStage === stage
                  ? `${stageColors[stage]} text-white`
                  : `bg-white text-gray-600 hover:${stageBgColors[stage]} border border-gray-200`
              }`}
            >
              <StageIcon className="w-4 h-4" />
              {stageLabels[stage]} ({count})
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>生命周期流程</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto py-2">
        {stages.map((stage, index) => {
          const StageIcon = stageIcons[stage]
          const count = franchiseesByStage[stage]?.length || 0
          return (
            <div key={stage} className="flex items-center">
              <div
                className={`flex flex-col items-center px-4 py-3 rounded-xl ${stageBgColors[stage]} min-w-[100px]`}
              >
                <div
                  className={`w-10 h-10 rounded-full ${stageColors[stage]} flex items-center justify-center mb-1`}
                >
                  <StageIcon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`text-sm font-medium ${stageTextColors[stage]}`}
                >
                  {stageLabels[stage]}
                </span>
                <span className="text-2xl font-bold text-gray-800">{count}</span>
              </div>
              {index < stages.length - 1 && (
                <div className="flex items-center gap-1 mx-2">
                  <ArrowRight className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const franchisees = franchiseesByStage[stage] || []
          const StageIcon = stageIcons[stage]
          const nextStage = getNextStage(stage)

          return (
            <div
              key={stage}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className={`p-4 ${stageBgColors[stage]} border-b border-gray-100`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg ${stageColors[stage]} flex items-center justify-center`}
                    >
                      <StageIcon className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800">
                      {stageLabels[stage]}
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageBadgeColors[stage]}`}
                  >
                    {franchisees.length} 人
                  </span>
                </div>
              </div>

              <div className="p-3 max-h-[500px] overflow-y-auto">
                {franchisees.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无{stageLabels[stage]}数据</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {franchisees.map((franchisee) => (
                      <div
                        key={franchisee.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full ${stageBgColors[stage]} flex items-center justify-center flex-shrink-0`}
                              >
                                <span
                                  className={`text-sm font-medium ${stageTextColors[stage]}`}
                                >
                                  {franchisee.contact_name?.charAt(0) || '加'}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-800 text-sm truncate">
                                  {franchisee.contact_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {franchisee.project_name || '未分配项目'}
                                </p>
                              </div>
                            </div>

                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">
                                  {franchisee.contact_phone}
                                </span>
                              </div>
                              {franchisee.intended_amount && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <DollarSign className="w-3 h-3 flex-shrink-0" />
                                  <span>
                                    意向金额：¥
                                    {franchisee.intended_amount.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {franchisee.signed_amount && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <DollarSign className="w-3 h-3 flex-shrink-0" />
                                  <span>
                                    签约金额：¥
                                    {franchisee.signed_amount.toLocaleString()}
                                  </span>
                                </div>
                              )}
                              {franchisee.store_name && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Store className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">
                                    {franchisee.store_name}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  {new Date(
                                    franchisee.created_at
                                  ).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 ml-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setShowDetail(franchisee)}
                                className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                title="查看详情"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {nextStage && (
                                <button
                                  onClick={() =>
                                    openConversionModal(franchisee, nextStage)
                                  }
                                  className={`p-1.5 text-gray-400 hover:${stageTextColors[nextStage]} hover:${stageBgColors[nextStage]} rounded transition-colors`}
                                  title={`转为${stageLabels[nextStage]}`}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            {nextStage && (
                              <span className="text-[10px] text-gray-400">
                                转{stageLabels[nextStage]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                加盟商详情
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
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl ${stageBgColors[showDetail.stage]} flex items-center justify-center`}
                  >
                    <span
                      className={`text-2xl font-bold ${stageTextColors[showDetail.stage]}`}
                    >
                      {showDetail.contact_name?.charAt(0) || '加'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {showDetail.contact_name}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${stageBadgeColors[showDetail.stage]}`}
                    >
                      {stageLabels[showDetail.stage]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">联系电话</p>
                    <p className="font-medium text-gray-800">
                      {showDetail.contact_phone}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">意向项目</p>
                    <p className="font-medium text-gray-800 truncate">
                      {showDetail.project_name || '-'}
                    </p>
                  </div>
                  {showDetail.intended_amount && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">意向金额</p>
                      <p className="font-medium text-gray-800">
                        ¥{showDetail.intended_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {showDetail.signed_amount && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">签约金额</p>
                      <p className="font-medium text-gray-800">
                        ¥{showDetail.signed_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {showDetail.signed_date && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">签约日期</p>
                      <p className="font-medium text-gray-800">
                        {showDetail.signed_date}
                      </p>
                    </div>
                  )}
                  {showDetail.store_name && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">门店名称</p>
                      <p className="font-medium text-gray-800 truncate">
                        {showDetail.store_name}
                      </p>
                    </div>
                  )}
                  {showDetail.store_address && (
                    <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500">门店地址</p>
                      <p className="font-medium text-gray-800">
                        {showDetail.store_address}
                      </p>
                    </div>
                  )}
                  {showDetail.opened_date && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">开店日期</p>
                      <p className="font-medium text-gray-800">
                        {showDetail.opened_date}
                      </p>
                    </div>
                  )}
                  {showDetail.repurchase_amount && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">复购金额</p>
                      <p className="font-medium text-gray-800">
                        ¥{showDetail.repurchase_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {showDetail.repurchase_date && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">复购日期</p>
                      <p className="font-medium text-gray-800">
                        {showDetail.repurchase_date}
                      </p>
                    </div>
                  )}
                </div>

                {showDetail.notes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">备注</p>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {showDetail.notes}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-400">
                  创建时间：
                  {new Date(showDetail.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConversion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800">
                转为 {stageLabels[showConversion.targetStage]}
              </h2>
              <button
                onClick={() => {
                  setShowConversion(null)
                  setConversionData({})
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  加盟商：<span className="font-medium">{showConversion.franchisee.contact_name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  当前阶段：{stageLabels[showConversion.franchisee.stage]} →{' '}
                  <span className={stageTextColors[showConversion.targetStage]}>
                    {stageLabels[showConversion.targetStage]}
                  </span>
                </p>
              </div>

              <div className="space-y-4">
                {showConversion.targetStage === 'signed' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        签约金额（元）<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={conversionData.signed_amount || ''}
                        onChange={(e) =>
                          setConversionData({
                            ...conversionData,
                            signed_amount: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入签约金额"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        签约日期
                      </label>
                      <input
                        type="date"
                        value={conversionData.signed_date || ''}
                        onChange={(e) =>
                          setConversionData({
                            ...conversionData,
                            signed_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {showConversion.targetStage === 'opened' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        门店名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={conversionData.store_name || ''}
                        onChange={(e) =>
                          setConversionData({
                            ...conversionData,
                            store_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入门店名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        门店地址 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={conversionData.store_address || ''}
                        onChange={(e) =>
                          setConversionData({
                            ...conversionData,
                            store_address: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入门店地址"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        开店日期
                      </label>
                      <input
                        type="date"
                        value={conversionData.opened_date || ''}
                        onChange={(e) =>
                          setConversionData({
                            ...conversionData,
                            opened_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {showConversion.targetStage === 'repurchase' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        复购金额（元）<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={conversionData.repurchase_amount || ''}
                        onChange={(e) =>
                          setConversionData({
                            ...conversionData,
                            repurchase_amount: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入复购金额"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        复购日期
                      </label>
                      <input
                        type="date"
                        value={conversionData.repurchase_date || ''}
                        onChange={(e) =>
                          setConversionData({
                            ...conversionData,
                            repurchase_date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  setShowConversion(null)
                  setConversionData({})
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleStageConversion}
                disabled={submitting}
                className={`px-6 py-2 ${stageColors[showConversion.targetStage]} text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                确认转换
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
