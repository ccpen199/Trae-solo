import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Layers,
  ChevronRight,
  ChevronDown,
  Search,
  Shield,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Zap,
  FolderOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  Play,
  RotateCcw,
  ArrowLeft,
  Settings,
  Users,
  Target,
  TrendingUp,
  Info,
} from 'lucide-react'
import {
  serviceItems,
  serviceCategories,
  jointServices,
  jointFlows,
  precheckResults,
  certificates,
} from '@/data'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

const tabs = [
  { key: 'guide' as const, label: '办事指南', icon: FileText },
  { key: 'precheck' as const, label: '材料预检', icon: CheckCircle },
  { key: 'fill' as const, label: '自动填充', icon: Zap },
  { key: 'joint' as const, label: '联办服务', icon: Layers },
]

const workflowStepLabels = [
  { key: 'guide' as const, label: '办事指南', icon: FileText, step: 1 },
  { key: 'precheck' as const, label: '材料预检', icon: CheckCircle, step: 2 },
  { key: 'fill' as const, label: '自动填充', icon: Zap, step: 3 },
  { key: 'joint' as const, label: '联办服务', icon: Layers, step: 4 },
]

function WorkflowProgressBar() {
  const navigate = useNavigate()
  const {
    activeServiceWorkflowId,
    workflowStepStatus,
    resetWorkflow,
    setSelectedServiceTab,
    workflowStep,
  } = useStore()

  const activeService = useMemo(() => {
    if (!activeServiceWorkflowId) return null
    return serviceItems.find((s) => s.id === activeServiceWorkflowId)
  }, [activeServiceWorkflowId])

  if (!activeServiceWorkflowId || !activeService) return null

  const handleStepClick = (step: 'guide' | 'precheck' | 'fill' | 'joint') => {
    const status = workflowStepStatus[step]
    if (status === 'completed' || status === 'current') {
      setSelectedServiceTab(step)
    }
  }

  const handleExit = () => {
    resetWorkflow()
    navigate('/services')
  }

  return (
    <div className="sticky top-0 z-30 mb-4 -mx-6 bg-gradient-to-r from-gov-navy via-gov-blue to-gov-navy px-6 py-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gov-gold/20 text-gov-gold">
            <Play className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-gov-gold/80">正在办理</p>
            <p className="text-sm font-medium text-white">{activeService.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {workflowStepLabels.map((step, index) => {
            const Icon = step.icon
            const status = workflowStepStatus[step.key]
            const isCompleted = status === 'completed'
            const isCurrent = status === 'current'
            const isClickable = isCompleted || isCurrent

            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => isClickable && handleStepClick(step.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 transition-all',
                    isClickable ? 'cursor-pointer' : 'cursor-default',
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'text-gov-green hover:bg-white/10'
                      : 'text-white/50'
                  )}
                >
                  <div className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                    isCompleted
                      ? 'border-gov-green bg-gov-green text-white'
                      : isCurrent
                      ? 'border-gov-gold bg-gov-gold text-white animate-pulse'
                      : 'border-white/30 text-white/50'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </button>
                {index < workflowStepLabels.length - 1 && (
                  <div className={cn(
                    'mx-1 h-0.5 w-6 sm:w-10',
                    isCompleted ? 'bg-gov-green' : 'bg-white/20'
                  )} />
                )}
              </div>
            )
          })}
        </div>

        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <RotateCcw className="h-4 w-4" />
          退出办理
        </button>
      </div>
    </div>
  )
}

function CategorySidebar({
  activeCategory,
  onSelect,
}: {
  activeCategory: string | null
  onSelect: (id: string) => void
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['sc_1']))
  const [searchQuery, setSearchQuery] = useState('')

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return serviceCategories
    return serviceCategories
      .map((cat) => ({
        ...cat,
        children: cat.children.filter((child) =>
          child.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.children.length > 0
      )
  }, [searchQuery])

  return (
    <div className="w-64 shrink-0 rounded-lg border border-gray-100 bg-white p-4">
      <h3 className="gov-section-title mb-4">服务分类</h3>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索服务分类..."
          className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-gov-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-gov-blue"
        />
      </div>
      <div className="space-y-1">
        {filteredCategories.map((cat) => {
          const isExpanded = expanded.has(cat.id)
          const hasActiveChild = cat.children.some((c) => c.id === activeCategory)

          return (
            <div key={cat.id}>
              <button
                onClick={() => toggleExpand(cat.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  hasActiveChild
                    ? 'bg-gov-blue/10 text-gov-blue'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <span className="flex-1 text-left">{cat.name}</span>
              </button>

              {isExpanded && (
                <div className="ml-4 space-y-0.5 border-l border-gray-200 pl-3">
                  {cat.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onSelect(child.id)}
                      className={cn(
                        'flex w-full items-center rounded px-3 py-1.5 text-sm transition-colors',
                        activeCategory === child.id
                          ? 'bg-gov-blue text-white font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {filteredCategories.length === 0 && (
          <div className="py-4 text-center text-sm text-gray-400">未找到匹配的分类</div>
        )}
      </div>
    </div>
  )
}

function GuideTab({ filteredItems }: { filteredItems: typeof serviceItems }) {
  const navigate = useNavigate()
  const { setActiveServiceWorkflow, activeServiceWorkflowId } = useStore()

  const handleStartWorkflow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveServiceWorkflow(id)
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {filteredItems.map((item) => {
        const isWorkflowActive = activeServiceWorkflowId === item.id

        return (
          <div
            key={item.id}
            className={cn(
              'gov-card p-5 transition-shadow hover:shadow-md relative',
              isWorkflowActive && 'ring-2 ring-gov-gold'
            )}
          >
            {isWorkflowActive && (
              <div className="absolute -top-2 right-4">
                <span className="gov-badge gov-badge-yellow flex items-center gap-1">
                  <Play className="h-3 w-3" />
                  办理中
                </span>
              </div>
            )}
            <div className="mb-3 flex items-start justify-between">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <span className="gov-badge gov-badge-blue shrink-0 ml-2">{item.department}</span>
            </div>
            <p className="mb-3 text-sm text-gray-500 line-clamp-2">{item.description}</p>
            <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-gray-500">
                <FileText className="h-3.5 w-3.5 text-gov-blue" />
                <span>事项编码: {item.guangdongStandard.itemCode}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Zap className="h-3.5 w-3.5 text-gov-green" />
                <span>办件类型: {item.guangdongStandard.serviceType}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>{item.materials.length}项材料</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span>{item.timeLimit}</span>
              </div>
            </div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>网办率</span>
                  <span className="font-medium text-gov-green">{item.onlineRate}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gov-green transition-all"
                    style={{ width: `${item.onlineRate}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/services/${item.id}`)}
                className="flex-1 rounded-md border border-gov-blue bg-gov-blue/5 px-3 py-2 text-sm font-medium text-gov-blue transition-colors hover:bg-gov-blue/10"
              >
                查看详情
              </button>
              <button
                onClick={(e) => handleStartWorkflow(item.id, e)}
                className={cn(
                  'flex-1 rounded-md px-3 py-2 text-sm font-medium text-white transition-colors',
                  isWorkflowActive
                    ? 'bg-gov-gold hover:brightness-110'
                    : 'bg-gov-blue hover:bg-gov-blue/90'
                )}
              >
                {isWorkflowActive ? '继续办理' : '开始办理'}
              </button>
            </div>
          </div>
        )
      })}
      {filteredItems.length === 0 && (
        <div className="col-span-2 py-12 text-center text-gray-400">该分类下暂无服务事项</div>
      )}
    </div>
  )
}

function PrecheckTab() {
  const {
    precheckServiceId,
    setSelectedServiceTab,
    activeServiceWorkflowId,
    precheckCompleted,
    setPrecheckCompleted,
    advanceWorkflowStep,
  } = useStore()
  const [scanning, setScanning] = useState(false)
  const [scanStep, setScanStep] = useState(0)

  const service = useMemo(() => {
    const id = activeServiceWorkflowId || precheckServiceId
    if (id) {
      return serviceItems.find((s) => s.id === id) || serviceItems[0]
    }
    return serviceItems[0]
  }, [precheckServiceId, activeServiceWorkflowId])

  const isWorkflowActive = !!activeServiceWorkflowId

  useEffect(() => {
    if (isWorkflowActive && !precheckCompleted && !scanning) {
      setScanning(true)
      setScanStep(0)

      const duration = service.workflowStepDurations?.precheck || 2000
      const stepDuration = duration / 3

      const timers = [
        setTimeout(() => setScanStep(1), stepDuration),
        setTimeout(() => setScanStep(2), stepDuration * 2),
        setTimeout(() => {
          setScanning(false)
          setScanStep(3)
          setPrecheckCompleted(true)
        }, duration),
      ]

      return () => timers.forEach(clearTimeout)
    }
  }, [isWorkflowActive, precheckCompleted, scanning, service.workflowStepDurations, setPrecheckCompleted])

  const precheckResult = useMemo(() => {
    return precheckResults.find((r) => r.serviceId === service.id)
  }, [service.id])

  const materials = service.materials

  const autoFilled = materials.filter((m) => m.status === 'auto_filled').length
  const provided = materials.filter((m) => m.status === 'provided').length
  const missing = materials.filter((m) => m.status === 'missing').length
  const total = materials.length
  const pending = total - autoFilled - provided - missing

  const getCertName = (certId?: string) => {
    if (!certId) return ''
    const cert = certificates.find((c) => c.id === certId)
    return cert?.name || ''
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pass':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle, iconColor: 'text-gov-green' }
      case 'warning':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: AlertTriangle, iconColor: 'text-yellow-500' }
      case 'fail':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: XCircle, iconColor: 'text-gov-red' }
      case 'auto_filled':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle, iconColor: 'text-gov-green' }
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: AlertTriangle, iconColor: 'text-gray-400' }
    }
  }

  const overallStatus = precheckResult?.overallStatus || (missing > 0 ? 'warning' : 'pass')
  const overallStyle = getStatusStyle(overallStatus)
  const OverallIcon = overallStyle.icon

  const suggestions = precheckResult?.suggestions || [
    '建议完善缺失材料后再提交申请',
    '可通过电子证照库自动获取相关证明材料',
  ]

  const savedTime = Math.round(autoFilled * 15)

  const scanSteps = [
    { label: '扫描证照', icon: Search },
    { label: '智能匹配', icon: Zap },
    { label: '生成报告', icon: FileText },
  ]

  const handleNext = () => {
    if (isWorkflowActive) {
      advanceWorkflowStep()
    } else {
      setSelectedServiceTab('fill')
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-100 bg-white p-5">
        {isWorkflowActive && (
          <div className="mb-5 border-b border-gray-100 pb-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="gov-section-title text-base">第 2 步：材料预检</h3>
            </div>

            <div className="flex items-center justify-center gap-8">
              {scanSteps.map((step, idx) => {
                const StepIcon = step.icon
                const isCompleted = scanStep > idx
                const isCurrent = scanStep === idx && scanning

                return (
                  <div key={idx} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all',
                        isCompleted
                          ? 'border-gov-green bg-gov-green text-white'
                          : isCurrent
                          ? 'border-gov-blue bg-gov-blue text-white animate-pulse'
                          : 'border-gray-200 bg-gray-50 text-gray-400'
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <span className={cn(
                        'mt-2 text-xs font-medium',
                        isCompleted ? 'text-gov-green' : isCurrent ? 'text-gov-blue' : 'text-gray-400'
                      )}>
                        {step.label}
                      </span>
                    </div>
                    {idx < scanSteps.length - 1 && (
                      <div className={cn(
                        'ml-6 h-0.5 w-16',
                        isCompleted ? 'bg-gov-green' : 'bg-gray-200'
                      )} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {scanning ? (
          <div className="py-12 text-center">
            <div className="relative mx-auto mb-6 h-32 w-32">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-24 animate-ping rounded-full bg-gov-blue/20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-gov-blue/30 backdrop-blur-sm" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="h-10 w-10 text-gov-blue animate-pulse" />
              </div>
              <div
                className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-gradient-to-r from-transparent via-gov-blue to-transparent"
                style={{ animation: 'scan-line 1.5s ease-in-out infinite' }}
              />
            </div>
            <p className="text-lg font-medium text-gray-800">正在智能检查材料...</p>
            <p className="mt-2 text-sm text-gray-500">
              正在从电子证照库调取相关证照信息，请勿关闭页面
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="mb-1 font-medium text-gray-900">{service.name}</h4>
                <p className="text-xs text-gray-500">事项编码: {service.guangdongStandard.itemCode}</p>
              </div>
              <span className={cn(
                'gov-badge text-xs',
                service.guangdongStandard.serviceType === '即办件' ? 'gov-badge-green' : 'gov-badge-blue'
              )}>
                {service.guangdongStandard.serviceType}
              </span>
            </div>

            <div className={cn(
              'mb-5 rounded-lg border p-4',
              overallStyle.bg,
              overallStyle.border
            )}>
              <div className="mb-3 flex items-center gap-3">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full bg-white',
                  overallStyle.border,
                  'border-2'
                )}>
                  <OverallIcon className={cn('h-5 w-5', overallStyle.iconColor)} />
                </div>
                <div className="flex-1">
                  <p className={cn('font-medium', overallStyle.text)}>
                    总体结论: {overallStatus === 'pass' ? '通过' : overallStatus === 'warning' ? '需补充' : '不通过'}
                  </p>
                  <p className="text-xs text-gray-500">
                    共 {total} 项材料
                  </p>
                </div>
                {isWorkflowActive && precheckCompleted && (
                  <span className="gov-badge gov-badge-green flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    预检完成
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3 text-center text-sm">
                <div className="rounded-md bg-white/70 p-2">
                  <p className="text-lg font-bold text-gov-green">{autoFilled}</p>
                  <p className="text-xs text-gray-500">自动填充</p>
                </div>
                <div className="rounded-md bg-white/70 p-2">
                  <p className="text-lg font-bold text-gov-blue">{provided}</p>
                  <p className="text-xs text-gray-500">已提供</p>
                </div>
                <div className="rounded-md bg-white/70 p-2">
                  <p className="text-lg font-bold text-gov-red">{missing}</p>
                  <p className="text-xs text-gray-500">缺失</p>
                </div>
                <div className="rounded-md bg-white/70 p-2">
                  <p className="text-lg font-bold text-gray-500">{pending}</p>
                  <p className="text-xs text-gray-500">待补</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-md bg-white/70 px-3 py-2">
                <Clock className="h-4 w-4 text-gov-green" />
                <span className="text-sm text-gray-600">
                  预计节省时间: <span className="font-medium text-gov-green">约 {savedTime} 分钟</span>
                </span>
              </div>
            </div>

            {isWorkflowActive && precheckCompleted && (
              <div className="mb-5 rounded-md bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-gov-green shrink-0" />
                  <div>
                    <p className="font-medium text-green-800">预检通过，下一步：表单自动填充</p>
                    <p className="text-sm text-green-600">
                      {missing > 0
                        ? '部分材料需补充，但您可先进入表单自动填充步骤'
                        : '所有材料已就绪，可进入表单自动填充'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h5 className="font-medium text-gray-800">材料清单</h5>
              {materials.map((mat) => {
                const statusStyle = getStatusStyle(mat.status)
                const StatusIcon = statusStyle.icon
                const certName = getCertName(mat.certLinked)

                return (
                  <div
                    key={mat.id}
                    className="rounded-md border border-gray-100 p-4 transition-colors hover:border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <StatusIcon className={cn('mt-0.5 h-5 w-5 shrink-0', statusStyle.iconColor)} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{mat.name}</span>
                            <span className={cn(
                              'rounded px-1.5 py-0.5 text-[10px] font-medium',
                              mat.type === 'required' ? 'bg-red-50 text-gov-red' :
                              mat.type === 'optional' ? 'bg-gray-100 text-gray-600' :
                              'bg-yellow-50 text-yellow-700'
                            )}>
                              {mat.type === 'required' ? '必填' : mat.type === 'optional' ? '选填' : '条件'}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>格式要求: {mat.format}</span>
                            {mat.certLinked && (
                              <span className="flex items-center gap-1 text-gov-blue">
                                <Shield className="h-3 w-3" />
                                关联证照: {certName}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-400">
                            来源说明: {mat.status === 'auto_filled' ? '电子证照库自动调取' : mat.status === 'provided' ? '用户已上传' : '需用户上传'}
                          </p>
                        </div>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded px-2 py-1 text-xs font-medium',
                        statusStyle.bg,
                        statusStyle.text
                      )}>
                        {mat.status === 'auto_filled' ? '自动填充' : mat.status === 'provided' ? '已提供' : '缺失'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 rounded-md bg-blue-50 p-4">
              <h5 className="mb-2 flex items-center gap-2 font-medium text-gov-blue">
                <Sparkles className="h-4 w-4" />
                预检建议
              </h5>
              <ul className="space-y-1.5">
                {suggestions.map((sug, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gov-blue" />
                    {sug}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleNext}
                className={cn(
                  'flex items-center gap-2 rounded-md px-6 py-2.5 text-sm font-medium text-white transition-colors',
                  isWorkflowActive ? 'bg-gov-gold hover:brightness-110' : 'bg-gov-blue hover:bg-gov-blue/90'
                )}
              >
                下一步：自动填充
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FillTab() {
  const {
    precheckServiceId,
    activeServiceWorkflowId,
    formFillCompleted,
    setFormFillCompleted,
    advanceWorkflowStep,
    setSelectedServiceTab,
  } = useStore()
  const [loading, setLoading] = useState(false)
  const [manualMode, setManualMode] = useState(false)

  const service = useMemo(() => {
    const id = activeServiceWorkflowId || precheckServiceId
    if (id) {
      return serviceItems.find((s) => s.id === id) || serviceItems[0]
    }
    return serviceItems[0]
  }, [precheckServiceId, activeServiceWorkflowId])

  const isWorkflowActive = !!activeServiceWorkflowId

  useEffect(() => {
    if (isWorkflowActive && !formFillCompleted && !loading && !manualMode) {
      setLoading(true)

      const duration = service.workflowStepDurations?.fill || 2000

      const timer = setTimeout(() => {
        setLoading(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isWorkflowActive, formFillCompleted, loading, manualMode, service.workflowStepDurations])

  const getCertName = (certId?: string) => {
    if (!certId) return ''
    const cert = certificates.find((c) => c.id === certId)
    return cert?.name || ''
  }

  const getCertValue = (certId?: string, fieldName?: string) => {
    if (!certId) return ''
    const cert = certificates.find((c) => c.id === certId)
    if (!cert) return ''
    if (fieldName?.includes('Name') || fieldName?.includes('name')) return cert.holderName
    if (fieldName?.includes('idCard') || fieldName?.includes('IdCard') || fieldName?.includes('credential')) return cert.holderId
    if (fieldName?.includes('number') || fieldName?.includes('Number') || fieldName?.includes('code')) return cert.credentialNo
    return cert.holderName
  }

  const formFields = service.formFields

  const basicFields = formFields.filter((f) => f.autoFillSource)
  const contactFields = formFields.filter((f) =>
    !f.autoFillSource && (f.name.includes('contact') || f.name.includes('phone') || f.name.includes('email') || f.name.includes('address') || f.name.includes('Phone'))
  )
  const businessFields = formFields.filter(
    (f) => !basicFields.includes(f) && !contactFields.includes(f)
  )

  const handleConfirm = () => {
    setFormFillCompleted(true)
  }

  const handleNext = () => {
    if (isWorkflowActive) {
      advanceWorkflowStep()
    } else {
      setSelectedServiceTab('joint')
    }
  }

  const handleToggleMode = () => {
    setManualMode(!manualMode)
  }

  const renderField = (field: typeof formFields[0]) => {
    const isAutoFilled = !!field.autoFillSource && !manualMode
    const certName = getCertName(field.autoFillSource)
    const autoValue = isAutoFilled ? getCertValue(field.autoFillSource, field.name) : ''
    const value = field.value || autoValue

    return (
      <div key={field.name} className="space-y-1.5">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-gov-red">*</span>}
          {isAutoFilled && (
            <span className="ml-2 gov-badge gov-badge-yellow flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              已自动填充
            </span>
          )}
        </label>
        {field.type === 'textarea' ? (
          <textarea
            defaultValue={value}
            placeholder={field.placeholder}
            readOnly={isAutoFilled}
            rows={3}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm transition-all',
              isAutoFilled
                ? 'border-green-300 bg-green-50 text-gray-700'
                : 'border-gray-200 text-gray-700 focus:border-gov-blue focus:outline-none focus:ring-1 focus:ring-gov-blue'
            )}
          />
        ) : field.type === 'select' ? (
          <select
            defaultValue={value}
            disabled={isAutoFilled}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm transition-all',
              isAutoFilled
                ? 'border-green-300 bg-green-50 text-gray-700'
                : 'border-gray-200 text-gray-700 focus:border-gov-blue focus:outline-none focus:ring-1 focus:ring-gov-blue'
            )}
          >
            <option value="">请选择</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type}
            defaultValue={value}
            placeholder={field.placeholder}
            readOnly={isAutoFilled}
            className={cn(
              'w-full rounded-md border px-3 py-2 text-sm transition-all',
              isAutoFilled
                ? 'border-green-300 bg-green-50 text-gray-700'
                : 'border-gray-200 text-gray-700 focus:border-gov-blue focus:outline-none focus:ring-1 focus:ring-gov-blue'
            )}
          />
        )}
        {isAutoFilled && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Shield className="h-3 w-3 text-gov-green" />
            来源证照: {certName}
          </p>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6">
        {isWorkflowActive && (
          <div className="mb-6 border-b border-gray-100 pb-4">
            <h3 className="gov-section-title text-base">第 3 步：表单自动填充</h3>
          </div>
        )}
        <div className="py-16 text-center">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 rounded-full border-4 border-gov-blue/20" />
            <div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-gov-blue"
              style={{ animation: 'spin 1s linear infinite' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-gov-gold animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium text-gray-800">正在从电子证照库自动填充...</p>
          <p className="mt-2 text-sm text-gray-500">
            系统正在自动调取您的电子证照信息并填充表单字段
          </p>
          <div className="mt-6 flex justify-center gap-4">
            {['基本信息', '联系信息', '业务信息'].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2"
              >
                <div
                  className="h-2 w-2 rounded-full bg-gov-blue"
                  style={{ animationDelay: `${idx * 0.2}s`, animation: 'pulse 1.5s ease-in-out infinite' }}
                />
                <span className="text-xs text-gray-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-6">
      {isWorkflowActive && (
        <div className="mb-5 border-b border-gray-100 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="gov-section-title text-base">第 3 步：表单自动填充</h3>
            {formFillCompleted && (
              <span className="gov-badge gov-badge-green flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                填充已确认
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-5 flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <h4 className="font-medium text-gray-900">
            {isWorkflowActive ? '自动填充表单' : '自动填充表单预览'}
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            {service.name} · 事项编码: {service.guangdongStandard.itemCode}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="gov-badge gov-badge-green text-xs">
            已自动填充 {basicFields.length} 项
          </span>
          {isWorkflowActive && (
            <button
              onClick={handleToggleMode}
              className="text-xs text-gov-blue hover:underline"
            >
              {manualMode ? '切换为自动填充' : '切换为手动填写'}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {basicFields.length > 0 && (
          <div>
            <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
              <User className="h-4 w-4 text-gov-blue" />
              基本信息
              <span className="ml-auto text-xs font-normal text-gov-green">
                已通过电子证照自动填充
              </span>
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {basicFields.map(renderField)}
            </div>
          </div>
        )}

        {contactFields.length > 0 && (
          <div>
            <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
              <Phone className="h-4 w-4 text-gov-blue" />
              联系信息
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {contactFields.map(renderField)}
            </div>
          </div>
        )}

        {businessFields.length > 0 && (
          <div>
            <h5 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
              <FileText className="h-4 w-4 text-gov-blue" />
              业务信息
            </h5>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {businessFields.map(renderField)}
            </div>
          </div>
        )}
      </div>

      {isWorkflowActive && formFillCompleted && (
        <div className="mt-6 rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-gov-green shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-green-800">填充已确认，可进入联办服务</p>
              <p className="text-sm text-green-600">
                表单信息已确认无误，您可以选择联办服务或单独办理
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="mt-6 rounded-md bg-blue-50 px-4 py-2.5 text-xs text-gov-blue">
        {manualMode
          ? '当前为手动填写模式，请仔细核对并填写所有必填项'
          : '绿色边框字段已通过电子证照自动填充，请确认信息无误'}
      </p>

      <div className="mt-6 flex justify-end gap-3">
        {isWorkflowActive && !formFillCompleted && (
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 rounded-md bg-gov-gold px-8 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
          >
            <CheckCircle className="h-4 w-4" />
            确认填充信息
          </button>
        )}
        {(formFillCompleted || !isWorkflowActive) && (
          <button
            onClick={handleNext}
            className={cn(
              'flex items-center gap-2 rounded-md px-8 py-2.5 text-sm font-medium text-white transition-colors',
              isWorkflowActive ? 'bg-gov-gold hover:brightness-110' : 'bg-gov-blue hover:bg-gov-blue/90'
            )}
          >
            下一步：联办服务
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

function JointTab() {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const {
    activeServiceWorkflowId,
    workflowCompleted,
    setWorkflowCompleted,
    jointServiceSelected,
    setJointServiceSelected,
    resetWorkflow,
  } = useStore()

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getJointFlow = (name: string) => {
    return jointFlows.find((f) => f.name.includes(name.replace('一件事', '')) || name.includes(f.name.replace('联合流程', '')))
  }

  const activeService = useMemo(() => {
    if (!activeServiceWorkflowId) return null
    return serviceItems.find((s) => s.id === activeServiceWorkflowId)
  }, [activeServiceWorkflowId])

  const relatedJoint = useMemo(() => {
    if (!activeService?.relatedJointService) return null
    return jointServices.find((j) => j.id === activeService.relatedJointService)
  }, [activeService])

  const isWorkflowActive = !!activeServiceWorkflowId

  const handleJointSelect = () => {
    setJointServiceSelected(true)
    setWorkflowCompleted(true)
  }

  const handleSoloSubmit = () => {
    setJointServiceSelected(false)
    setWorkflowCompleted(true)
  }

  const handleReturnHome = () => {
    resetWorkflow()
    navigate('/')
  }

  const getNodeStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gov-green text-white'
      case 'running':
        return 'bg-gov-blue text-white animate-pulse'
      case 'error':
        return 'bg-gov-red text-white'
      default:
        return 'bg-gray-200 text-gray-500'
    }
  }

  const getNodeBorderColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-gov-green'
      case 'running':
        return 'border-gov-blue'
      case 'error':
        return 'border-gov-red'
      default:
        return 'border-gray-300'
    }
  }

  const materialsCount = activeService?.materials.length || 0
  const autoFilledCount = activeService?.materials.filter((m) => m.status === 'auto_filled').length || 0
  const savedTime = Math.round(autoFilledCount * 15)

  if (workflowCompleted) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gov-green/10">
            <CheckCircle2 className="h-12 w-12 text-gov-green animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold text-gov-navy font-serif mb-2">
            所有步骤已完成！
          </h2>
          <p className="text-gray-500 mb-8">
            {jointServiceSelected
              ? '您已成功加入联办套餐，我们将为您统一办理'
              : '您已提交单独办理申请，我们将尽快为您处理'}
          </p>

          <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-gray-800 mb-4 text-left">办理摘要</h3>
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">服务事项</span>
                <span className="font-medium text-gray-800">{activeService?.name}</span>
              </div>
              {jointServiceSelected && relatedJoint && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">联办套餐</span>
                  <span className="font-medium text-gov-gold">{relatedJoint.name}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">提交材料</span>
                <span className="font-medium text-gray-800">{materialsCount} 项</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">自动填充</span>
                <span className="font-medium text-gov-green">{autoFilledCount} 项</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">节省时间</span>
                <span className="font-medium text-gov-green">约 {savedTime} 分钟</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">预计完成</span>
                <span className="font-medium text-gray-800">{activeService?.timeLimit}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleReturnHome}
              className="flex items-center gap-2 rounded-md bg-gov-gold px-8 py-3 text-base font-medium text-white transition-all hover:brightness-110"
            >
              <Home className="h-5 w-5" />
              返回首页
            </button>
            <button
              onClick={resetWorkflow}
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <RotateCcw className="h-5 w-5" />
              重新办理
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isWorkflowActive && (
        <div className="rounded-lg border border-gray-100 bg-white p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="gov-section-title text-base">第 4 步：联办服务</h3>
          </div>

          {relatedJoint ? (
            <div className="rounded-lg border-2 border-gov-gold bg-gov-gold/5 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gov-gold/20">
                  <Layers className="h-6 w-6 text-gov-gold" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{relatedJoint.name}</h4>
                    <span className="gov-badge gov-badge-yellow">推荐联办</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{relatedJoint.description}</p>
                  <p className="text-sm text-gov-green font-medium">
                    您办理的 {activeService?.name} 事项可与以下事项联办，精简材料 {relatedJoint.savingsPercent}%
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {relatedJoint.departments.map((dept) => (
                      <span key={dept} className="gov-badge gov-badge-blue text-[10px]">
                        {dept.replace('深圳市', '')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-gov-gold">
                    精简 {relatedJoint.savingsPercent}%
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    办理时限: {relatedJoint.totalTimeLimit}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={handleSoloSubmit}
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  单独办理
                </button>
                <button
                  onClick={handleJointSelect}
                  className="flex items-center gap-2 rounded-md bg-gov-gold px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
                >
                  <Layers className="h-4 w-4" />
                  加入联办套餐
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-blue-50 p-5">
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-gov-blue shrink-0" />
                <div>
                  <p className="font-medium text-gov-blue">暂无推荐联办服务</p>
                  <p className="text-sm text-blue-600 mt-1">
                    您办理的 {activeService?.name} 暂无可联办的服务套餐，可单独提交办理
                  </p>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSoloSubmit}
                  className="flex items-center gap-2 rounded-md bg-gov-gold px-6 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110"
                >
                  <CheckCircle className="h-4 w-4" />
                  提交单独办理
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {jointServices.map((js) => {
          const isExpanded = expandedId === js.id
          const flow = getJointFlow(js.name)
          const isRelated = js.id === relatedJoint?.id

          return (
            <div key={js.id} className={cn(
              'gov-card overflow-hidden transition-all',
              isRelated && isWorkflowActive && 'ring-2 ring-gov-gold'
            )}>
              <div
                onClick={() => toggleExpand(js.id)}
                className="cursor-pointer p-5 transition-colors hover:bg-gray-50"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      isRelated ? 'bg-gov-gold/20' : 'bg-gov-gold/10'
                    )}>
                      <Layers className={cn('h-5 w-5', isRelated ? 'text-gov-gold' : 'text-gov-gold')} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{js.name}</h4>
                        {isRelated && isWorkflowActive && (
                          <span className="gov-badge gov-badge-yellow">
                            推荐
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">{js.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-gov-gold/10 px-2.5 py-1 text-sm font-bold text-gov-gold">
                      精简 {js.savingsPercent}%
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {js.departments.map((dept) => (
                    <span key={dept} className="gov-badge gov-badge-blue text-[10px]">
                      {dept.replace('深圳市', '')}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    办理时限: {js.totalTimeLimit}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-gov-gold" />
                    联办事项: {js.serviceItems.length + 1}个
                  </span>
                </div>
              </div>

              {isExpanded && flow && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                  <h5 className="mb-4 font-medium text-gray-800">办理流程</h5>

                  <div className="mb-4 overflow-x-auto">
                    <div className="flex min-w-max items-start gap-2 pb-2">
                      {flow.nodes.map((node, idx) => {
                        const isShared = node.type === 'material'
                        const isLast = idx === flow.nodes.length - 1
                        const prevNode = flow.nodes[idx - 1]

                        return (
                          <div key={node.id} className="flex items-start">
                            <div className="flex flex-col items-center">
                              <div className={cn(
                                'relative flex h-12 w-28 flex-col items-center justify-center rounded-lg border-2 bg-white p-2 text-center',
                                getNodeBorderColor(node.status),
                                isShared && 'border-gov-gold bg-gov-gold/5'
                              )}>
                                <span className={cn(
                                  'mb-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                                  getNodeStatusColor(node.status)
                                )}>
                                  {node.status === 'completed' ? '✓' : node.status === 'running' ? '●' : idx + 1}
                                </span>
                                <span className="text-[11px] font-medium text-gray-700 line-clamp-1">
                                  {node.name}
                                </span>
                                {isShared && (
                                  <span className="absolute -top-2 -right-2 rounded bg-gov-gold px-1.5 py-0.5 text-[9px] font-bold text-white">
                                    共享
                                  </span>
                                )}
                              </div>
                              <span className="mt-1 text-[10px] text-gray-400">{node.duration}</span>
                            </div>
                            {!isLast && (
                              <div className="flex items-center pt-5">
                                {node.parallel && flow.nodes[idx + 1]?.parallel ? (
                                  <div className="flex h-8 w-6 flex-col items-center justify-center">
                                    <div className="h-0.5 w-3 bg-gray-300" />
                                    <ArrowRight className="h-3 w-3 text-gray-300" />
                                  </div>
                                ) : (
                                  <ArrowRight className="h-5 w-5 text-gray-300" />
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded-full bg-gov-green" />
                      已完成
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded-full bg-gov-blue" />
                      进行中
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded-full bg-gray-300" />
                      待办理
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 rounded-full bg-gov-gold" />
                      并行办理
                    </span>
                  </div>

                  <div className="mb-4 rounded-md bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-700">
                      <span className="font-medium">共享材料提示:</span> 通过联办服务，身份证、营业执照等材料可共享复用，无需重复提交
                    </p>
                  </div>

                  {!isWorkflowActive && (
                    <div className="flex justify-end">
                      <button className="flex items-center gap-2 rounded-md bg-gov-gold px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-gov-gold/90">
                        开始联办
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Services() {
  const { selectedServiceTab, setSelectedServiceTab } = useStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [serviceSearchQuery, setServiceSearchQuery] = useState(() => searchParams.get('q') || '')
  const [onlineOnly, setOnlineOnly] = useState(false)

  const filteredItems = useMemo(() => {
    const keyword = serviceSearchQuery.trim().toLowerCase()

    return serviceItems.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false
      if (onlineOnly && item.onlineRate < 90) return false
      if (!keyword) return true

      return [
        item.name,
        item.description,
        item.department,
        item.guangdongStandard.itemCode,
        item.guangdongStandard.serviceType,
      ].some((field) => field.toLowerCase().includes(keyword))
    })
  }, [activeCategory, onlineOnly, serviceSearchQuery])

  const commitSearchParams = () => {
    const next = new URLSearchParams(searchParams)
    const keyword = serviceSearchQuery.trim()
    if (keyword) next.set('q', keyword)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    setActiveCategory(null)
    setOnlineOnly(false)
    setServiceSearchQuery('')
    setSearchParams({}, { replace: true })
  }

  return (
    <div className="flex gap-6">
      <CategorySidebar activeCategory={activeCategory} onSelect={setActiveCategory} />

      <div className="min-w-0 flex-1">
        <WorkflowProgressBar />
        <div className="mb-5 rounded-lg border border-gray-100 bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">服务搜索与筛选</h3>
              <p className="mt-1 text-xs text-gray-400">按事项名称、部门、事项编码、办件类型搜索，支持只看高网办率服务</p>
            </div>
            <div className="lg:ml-auto flex flex-col gap-3 sm:flex-row">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={serviceSearchQuery}
                  onChange={(event) => setServiceSearchQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitSearchParams()
                  }}
                  placeholder="搜索户籍、社保、医保、证照等事项"
                  className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:border-gov-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-gov-blue"
                />
              </div>
              <button
                type="button"
                onClick={commitSearchParams}
                className="rounded-md bg-gov-blue px-4 py-2 text-sm font-medium text-white hover:bg-gov-blue/90"
              >
                搜索
              </button>
              <button
                type="button"
                onClick={() => setOnlineOnly((value) => !value)}
                className={cn(
                  'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                  onlineOnly
                    ? 'border-gov-blue bg-gov-blue/10 text-gov-blue'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                )}
              >
                仅看高网办率
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                清除筛选
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
            <span>
              查询结果：当前展示 {filteredItems.length} 项服务
              {serviceSearchQuery.trim() && (
                <span className="ml-1 text-gov-blue">
                  搜索结果关键词：{serviceSearchQuery.trim()}
                </span>
              )}
            </span>
            <span>{activeCategory ? '已选择分类筛选' : '全部分类'} · {onlineOnly ? '高网办率优先' : '不限网办率'}</span>
          </div>
        </div>

        <div className="mb-5 flex items-center gap-1 rounded-lg border border-gray-100 bg-white p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = selectedServiceTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setSelectedServiceTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gov-blue text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div>
          {selectedServiceTab === 'guide' && <GuideTab filteredItems={filteredItems} />}
          {selectedServiceTab === 'precheck' && <PrecheckTab />}
          {selectedServiceTab === 'fill' && <FillTab />}
          {selectedServiceTab === 'joint' && <JointTab />}
        </div>
      </div>
    </div>
  )
}
