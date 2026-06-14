import { useState, useEffect, useRef } from 'react'
import {
  LayoutGrid,
  List,
  ShieldCheck,
  CreditCard,
  Home,
  Heart,
  Shield,
  Car,
  Building,
  Award,
  Landmark,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  History,
  ShieldAlert,
  Settings,
  Users,
  FileText,
  Calendar,
  Hash,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Filter,
  Edit3,
  Save,
  X,
  Zap,
  Copy,
  TrendingUp,
  Target,
} from 'lucide-react'
import {
  certificates,
  certificateCategories,
  exemptionScenarios,
  certSubCategories,
  authRecords,
  authAuditRecords,
} from '@/data'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

type TabKey = 'library' | 'exempt' | 'auth'

const categoryIconMap: Record<string, React.ReactNode> = {
  cat_1: <CreditCard className="w-5 h-5" />,
  cat_2: <Home className="w-5 h-5" />,
  cat_3: <Heart className="w-5 h-5" />,
  cat_4: <Shield className="w-5 h-5" />,
  cat_5: <Car className="w-5 h-5" />,
  cat_6: <Building className="w-5 h-5" />,
  cat_7: <Award className="w-5 h-5" />,
  cat_8: <Landmark className="w-5 h-5" />,
}

const statusConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  valid: { label: '有效', badge: 'gov-badge gov-badge-green', icon: <CheckCircle className="w-3 h-3" /> },
  expired: { label: '已过期', badge: 'gov-badge gov-badge-red', icon: <XCircle className="w-3 h-3" /> },
  expiring_soon: { label: '即将过期', badge: 'gov-badge gov-badge-yellow', icon: <AlertTriangle className="w-3 h-3" /> },
}

const authStatusConfig: Record<string, { label: string; badge: string }> = {
  active: { label: '授权中', badge: 'gov-badge gov-badge-green' },
  expired: { label: '已过期', badge: 'gov-badge gov-badge-gray' },
  revoked: { label: '已撤销', badge: 'gov-badge gov-badge-red' },
}

const authScopeLabels: Record<string, string> = {
  read: '读取',
  verify: '核验',
  full: '完全',
}

const auditActionLabels: Record<string, string> = {
  grant: '授权',
  revoke: '撤销',
  call: '调用',
  expire: '到期',
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'library', label: '证照库' },
  { key: 'exempt', label: '免证办' },
  { key: 'auth', label: '授权管理' },
]

const revokeReasons = [
  '业务调整',
  '安全考虑',
  '不再需要',
  '超时未使用',
  '其他原因',
]

const partySuggestions = [
  '深圳市公安局',
  '深圳市民政局',
  '深圳市住房公积金管理中心',
  '深圳市市场监督管理局',
  '深圳市社会保险基金管理局',
  '深圳市规划和自然资源局',
  '深圳市医疗保障局',
  '深圳市教育局',
  '深圳市税务局',
  '深圳市人力资源和社会保障局',
]

const expiryPresets = [
  { label: '3个月', days: 90 },
  { label: '半年', days: 180 },
  { label: '1年', days: 365 },
  { label: '2年', days: 730 },
  { label: '永久', days: 36500 },
]

type AuthStatusFilter = 'all' | 'active' | 'revoked' | 'expired'
type RevokeStep = 1 | 2 | 3

export default function Certificates() {
  const [activeTab, setActiveTab] = useState<TabKey>('library')
  const [selectedExemptId, setSelectedExemptId] = useState<string>(exemptionScenarios[0]?.id ?? '')
  const [selectedAuthId, setSelectedAuthId] = useState<string | null>(null)
  const [showRevokeDialog, setShowRevokeDialog] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeRemark, setRevokeRemark] = useState('')
  const [revokeStep, setRevokeStep] = useState<RevokeStep>(1)
  const [showCallSuccess, setShowCallSuccess] = useState(false)
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [isAdjustMode, setIsAdjustMode] = useState(false)
  const [authSearchQuery, setAuthSearchQuery] = useState('')
  const [authStatusFilter, setAuthStatusFilter] = useState<AuthStatusFilter>('all')
  const [showPartySuggestions, setShowPartySuggestions] = useState(false)
  const [formParty, setFormParty] = useState('')
  const [formScope, setFormScope] = useState<'read' | 'verify' | 'full'>('read')
  const [formCertIds, setFormCertIds] = useState<string[]>([])
  const [formExpiryDate, setFormExpiryDate] = useState('')
  const [formPurpose, setFormPurpose] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [callCountDisplay, setCallCountDisplay] = useState(0)
  const [showCategoryTree, setShowCategoryTree] = useState(false)
  const [isExemptionCalling, setIsExemptionCalling] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [expandedTreeCategories, setExpandedTreeCategories] = useState<string[]>(['cat_1', 'cat_2', 'cat_3', 'cat_4', 'cat_5', 'cat_6', 'cat_7', 'cat_8'])

  const {
    certViewMode,
    setCertViewMode,
    certCategoryFilter,
    setCertCategoryFilter,
    certSubCategoryFilter,
    setCertSubCategoryFilter,
    revokedAuthIds,
    authRecordsList,
    authAuditRecordsList,
    addAuthRecord,
    updateAuthRecord,
    addAuthAuditRecord,
    revokeAuthV2,
    exemptionCallCount,
    incrementExemptionCall,
    exemptionCallHistory,
    activeExemptionId,
    setActiveExemptionId,
    exemptionCertsVerified,
    exemptionFormFilled,
    exemptionServiceStep,
  } = useStore()

  const filteredSubCategories =
    certCategoryFilter === 'all'
      ? certSubCategories
      : certSubCategories.filter((sc) => sc.parentId === certCategoryFilter)

  const filteredCerts = certificates.filter((c) => {
    if (certCategoryFilter !== 'all' && c.category !== certCategoryFilter) return false
    if (certSubCategoryFilter !== 'all' && c.subCategory !== certSubCategoryFilter) return false
    return true
  })

  const totalSubCategoryCount = certSubCategories.length
  const totalCertCategories = certificateCategories.length
  const totalCertTypes = 407

  const quickAccessCategories = [
    { id: 'cat_8', name: '不动产权证', icon: Landmark, count: 61, subCount: 3 },
    { id: 'cat_3', name: '婚姻证件', icon: Heart, count: 28, subCount: 3 },
    { id: 'cat_5', name: '驾驶证件', icon: Car, count: 32, subCount: 3 },
    { id: 'cat_2', name: '居住证件', icon: Building, count: 36, subCount: 3 },
  ]

  const serviceStatusSteps = [
    { label: '未开始', key: 0 },
    { label: '资料调取中', key: 1 },
    { label: '自动填充中', key: 2 },
    { label: '待确认', key: 3 },
    { label: '办理中', key: 4 },
    { label: '已完成', key: 5 },
  ]

  const getExemptionCallCount = (scenarioId: string) => {
    return exemptionCallCount[scenarioId] || 0
  }

  const getExemptionCallHistory = (scenarioId: string) => {
    const storeHistory = exemptionCallHistory[scenarioId] || []
    const scenario = exemptionScenarios.find((s) => s.id === scenarioId)
    const mockRecords = scenario?.callRecords.map((r) => ({
      date: r.date,
      time: '09:30:00',
      success: r.success,
      certCount: scenario.replacedCerts.length,
      operator: '系统自动',
      scenario: scenario.name,
    })) || []
    return [...storeHistory, ...mockRecords]
  }

  const getServiceStep = (scenarioId: string) => {
    return exemptionServiceStep[scenarioId] || 0
  }

  const handleQuickCategoryClick = (catId: string) => {
    setCertCategoryFilter(catId)
    setCertSubCategoryFilter('all')
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleClearFilters = () => {
    setCertCategoryFilter('all')
    setCertSubCategoryFilter('all')
  }

  const toggleTreeCategory = (catId: string) => {
    setExpandedTreeCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  const handleCopyField = (value: string, fieldName: string) => {
    navigator.clipboard.writeText(value)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleCallExemptEnhanced = () => {
    if (!selectedScenario || isExemptionCalling) return
    setIsExemptionCalling(true)
    setTimeout(() => {
      incrementExemptionCall(selectedScenario.id, selectedScenario.replacedCerts.length, selectedScenario.name)
      setIsExemptionCalling(false)
      setShowCallSuccess(true)
      setTimeout(() => setShowCallSuccess(false), 3000)
    }, 1500)
  }

  const selectedScenario = exemptionScenarios.find((s) => s.id === selectedExemptId)

  const getCertById = (id: string) => certificates.find((c) => c.id === id)

  const getEffectiveAuthStatus = (auth: (typeof authRecordsList)[0]) => {
    if (revokedAuthIds.includes(auth.id)) return 'revoked'
    return auth.status
  }

  const filteredAuthRecords = authRecordsList.filter((record) => {
    const keyword = authSearchQuery.trim().toLowerCase()
    const certNames = record.certIds
      .map((certId) => getCertById(certId)?.name || '')
      .join(' ')
      .toLowerCase()
    if (
      keyword &&
      !record.party.toLowerCase().includes(keyword) &&
      !record.purpose?.toLowerCase().includes(keyword) &&
      !certNames.includes(keyword)
    ) {
      return false
    }
    if (authStatusFilter !== 'all' && getEffectiveAuthStatus(record) !== authStatusFilter) return false
    return true
  })

  const effectiveSelectedAuthId =
    selectedAuthId && filteredAuthRecords.some((record) => record.id === selectedAuthId)
      ? selectedAuthId
      : activeTab === 'auth'
      ? filteredAuthRecords[0]?.id ?? null
      : selectedAuthId

  const selectedAuth = authRecordsList.find((a) => a.id === effectiveSelectedAuthId)
  const selectedAuthAudits = authAuditRecordsList.filter((a) => a.authId === effectiveSelectedAuthId)

  useEffect(() => {
    if (activeTab !== 'auth') return

    const selectedStillVisible = filteredAuthRecords.some((record) => record.id === selectedAuthId)
    if (selectedStillVisible) return

    setSelectedAuthId(filteredAuthRecords[0]?.id ?? null)
  }, [activeTab, filteredAuthRecords, selectedAuthId])

  const groupedCerts = certificateCategories.map((cat) => ({
    ...cat,
    certs: certificates.filter((c) => c.category === cat.id),
  }))

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    )
  }

  const toggleCertSelection = (certId: string) => {
    setFormCertIds((prev) =>
      prev.includes(certId) ? prev.filter((id) => id !== certId) : [...prev, certId]
    )
  }

  const filteredPartySuggestions = partySuggestions.filter((p) =>
    p.includes(formParty)
  ).filter((p) => p !== formParty)

  const today = new Date().toISOString().split('T')[0]

  const isFormValid = formParty.trim() !== '' && formCertIds.length > 0 && formExpiryDate >= today

  const openNewAuthDialog = () => {
    setIsAdjustMode(false)
    setFormParty('')
    setFormScope('read')
    setFormCertIds([])
    setFormExpiryDate('')
    setFormPurpose('')
    setExpandedCategories([])
    setShowPartySuggestions(false)
    setShowAuthDialog(true)
  }

  const openAdjustDialog = () => {
    if (!selectedAuth) return
    setIsAdjustMode(true)
    setFormParty(selectedAuth.party)
    setFormScope(selectedAuth.authScope)
    setFormCertIds([...selectedAuth.certIds])
    setFormExpiryDate(selectedAuth.expiryDate)
    setFormPurpose(selectedAuth.purpose || '')
    setExpandedCategories([...new Set(selectedAuth.certIds.map((id) => getCertById(id)?.category).filter(Boolean) as string[])])
    setShowPartySuggestions(false)
    setShowAuthDialog(true)
  }

  const handleAuthSubmit = () => {
    if (!isFormValid) return

    if (isAdjustMode && selectedAuth) {
      updateAuthRecord(selectedAuth.id, {
        authScope: formScope,
        certIds: formCertIds,
        expiryDate: formExpiryDate,
        purpose: formPurpose,
      })
      addAuthAuditRecord({
        authId: selectedAuth.id,
        action: 'grant',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        operator: '当前用户',
        details: `调整授权：范围变更为${authScopeLabels[formScope]}，证照${formCertIds.length}项`,
      })
    } else {
      const newRecord = {
        party: formParty,
        certIds: formCertIds,
        authDate: today,
        expiryDate: formExpiryDate,
        authScope: formScope,
        purpose: formPurpose,
      }
      addAuthRecord(newRecord)
      const newAuth = authRecordsList[0]
      if (newAuth) {
        setSelectedAuthId(newAuth.id)
      }
    }

    setShowAuthDialog(false)
  }

  const handleRevokeStep1Next = () => {
    if (revokeReason) {
      setRevokeStep(2)
    }
  }

  const handleRevokeConfirm = () => {
    if (selectedAuthId && revokeReason) {
      revokeAuthV2(selectedAuthId, revokeReason)
      setRevokeStep(3)
      setTimeout(() => {
        setShowRevokeDialog(false)
        setRevokeStep(1)
        setRevokeReason('')
        setRevokeRemark('')
      }, 2000)
    }
  }

  const openRevokeDialog = () => {
    setRevokeStep(1)
    setRevokeReason('')
    setRevokeRemark('')
    setShowRevokeDialog(true)
  }

  const applyExpiryPreset = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    setFormExpiryDate(date.toISOString().split('T')[0])
  }

  useEffect(() => {
    if (selectedAuth && selectedAuth.callCount > 0) {
      const target = selectedAuth.callCount
      const duration = 1000
      const steps = 30
      const increment = target / steps
      let current = 0
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setCallCountDisplay(target)
          clearInterval(timer)
        } else {
          setCallCountDisplay(Math.floor(current))
        }
      }, duration / steps)
      return () => clearInterval(timer)
    } else {
      setCallCountDisplay(0)
    }
  }, [selectedAuth?.id, selectedAuth?.callCount])

  const handleCategoryChange = (cat: string) => {
    setCertCategoryFilter(cat)
    setCertSubCategoryFilter('all')
  }

  const handleCallExempt = () => {
    setShowCallSuccess(true)
    setTimeout(() => setShowCallSuccess(false), 3000)
  }

  const getSubCategoryForCert = (certId: string) => {
    const cert = getCertById(certId)
    if (!cert) return null
    const subCat = certSubCategories.find((sc) => sc.id === cert.subCategory)
    return subCat?.name || ''
  }

  const getSubCategoryById = (subCatId: string) => {
    return certSubCategories.find((sc) => sc.id === subCatId)
  }

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab)
    if (tab === 'auth' && !selectedAuthId) {
      setSelectedAuthId(filteredAuthRecords[0]?.id ?? authRecordsList[0]?.id ?? null)
    }
  }

  return (
    <div className="p-6 space-y-4 relative">
      {showCallSuccess && selectedScenario && (
        <div className="fixed top-6 right-6 z-50 bg-gov-green text-white px-5 py-4 rounded-lg shadow-xl flex items-start gap-3 animate-pulse">
          <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">免证办调用成功！</div>
            <div className="text-xs opacity-90 mt-1">
              成功调用 {selectedScenario.replacedCerts.length} 项证照，节省 {selectedScenario.totalSavedTime} 分钟
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              'px-5 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab.key ? 'text-gov-blue' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <div className="space-y-4">
          <div className="gov-card p-4 bg-gradient-to-r from-gov-navy/5 to-gov-blue/5 border-gov-blue/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gov-blue" />
                  <span className="text-sm text-gray-600">
                    当前证照库覆盖
                    <span className="text-gov-blue font-bold text-lg mx-1">{totalCertCategories}</span>
                    大类 ·
                    <span className="text-gov-blue font-bold text-lg mx-1">{totalSubCategoryCount}</span>
                    子分类 · 共
                    <span className="text-gov-gold font-bold text-lg mx-1">{totalCertTypes}</span>
                    类电子证照
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryTree(!showCategoryTree)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                  showCategoryTree
                    ? 'bg-gov-blue text-white shadow-md'
                    : 'bg-white text-gov-blue border border-gov-blue/30 hover:bg-gov-blue/5'
                )}
              >
                <Target className="w-4 h-4" />
                按业务分类复核
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {quickAccessCategories.map((qc) => {
              const IconComp = qc.icon
              const isSelected = certCategoryFilter === qc.id
              return (
                <button
                  key={qc.id}
                  onClick={() => handleQuickCategoryClick(qc.id)}
                  className={cn(
                    'gov-card p-4 text-left transition-all hover:shadow-lg',
                    isSelected
                      ? 'border-gov-gold bg-amber-50 ring-2 ring-gov-gold/30'
                      : 'hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-2.5 rounded-lg transition-colors',
                        isSelected ? 'bg-gov-gold text-white' : 'bg-blue-50 text-gov-blue'
                      )}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{qc.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{qc.subCount} 子类 · {qc.count}类</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">点击筛选</span>
                    <ChevronRight className={cn('w-4 h-4 transition-colors', isSelected ? 'text-gov-gold' : 'text-gray-300')} />
                  </div>
                </button>
              )
            })}
          </div>

          {showCategoryTree && (
            <div className="gov-card p-5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gov-navy flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gov-blue" />
                  分类复核目录
                </h4>
                <span className="text-xs text-gray-400">总计 407 类证照</span>
              </div>
              <div className="space-y-1">
                {certificateCategories.map((cat) => {
                  const isExpanded = expandedTreeCategories.includes(cat.id)
                  const subCats = certSubCategories.filter((sc) => sc.parentId === cat.id)
                  const hasCerts = certificates.some((c) => c.category === cat.id)
                  const subTotal = subCats.reduce((sum, sc) => sum + sc.count, 0)
                  return (
                    <div key={cat.id} className="border border-gray-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleTreeCategory(cat.id)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <div className="p-1.5 bg-blue-50 text-gov-blue rounded">
                            {categoryIconMap[cat.id]}
                          </div>
                          <span className="font-medium text-gray-700 text-sm">{cat.name}</span>
                          {hasCerts && (
                            <CheckCircle2 className="w-4 h-4 text-gov-green" />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            {subCats.length} 子分类 · {subTotal} 类
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="px-4 py-2 bg-white space-y-1">
                          {subCats.map((sc) => {
                            const hasSubCerts = certificates.some((c) => c.subCategory === sc.id)
                            return (
                              <div
                                key={sc.id}
                                className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-50 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span className="text-sm text-gray-600">{sc.name}</span>
                                  {hasSubCerts && (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-gov-green" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-400">{sc.count} 类</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div ref={resultsRef} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5',
                      certCategoryFilter === 'all'
                        ? 'bg-gov-blue text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    全部
                  </button>
                  {certificateCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5',
                        certCategoryFilter === cat.id
                          ? 'bg-gov-blue text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {categoryIconMap[cat.id]}
                      {cat.name}
                    </button>
                  ))}
                  {(certCategoryFilter !== 'all' || certSubCategoryFilter !== 'all') && (
                    <button
                      onClick={handleClearFilters}
                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      清除筛选
                    </button>
                  )}
                </div>
                {certCategoryFilter !== 'all' && (
                  <div className="flex items-center gap-2 flex-wrap mt-2 pl-6">
                    <span className="text-xs text-gray-400">子分类：</span>
                    <button
                      onClick={() => setCertSubCategoryFilter('all')}
                      className={cn(
                        'px-2.5 py-1 rounded text-xs transition-colors',
                        certSubCategoryFilter === 'all'
                          ? 'bg-blue-100 text-gov-blue font-medium'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      全部
                    </button>
                    {filteredSubCategories.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => setCertSubCategoryFilter(sc.id)}
                        className={cn(
                          'px-2.5 py-1 rounded text-xs transition-colors',
                          certSubCategoryFilter === sc.id
                            ? 'bg-blue-100 text-gov-blue font-medium'
                            : 'text-gray-500 hover:text-gray-700'
                        )}
                      >
                        {sc.name}
                      </button>
                    ))}
                  </div>
                )}
                {certSubCategoryFilter !== 'all' && (
                  <div className="flex items-center gap-2 mt-2 pl-6">
                    <span className="text-xs text-gray-400">已选：</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-gov-gold border border-gov-gold/30 rounded-full text-xs font-medium">
                      {getSubCategoryById(certSubCategoryFilter)?.name}
                      <button
                        onClick={() => setCertSubCategoryFilter('all')}
                        className="hover:text-gov-gold/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    筛选结果：
                    <span className="text-gov-blue font-bold text-base mx-1">{filteredCerts.length}</span>
                    张证照 / 共
                    <span className="text-gray-600 font-semibold mx-1">
                      {certCategoryFilter === 'all'
                        ? totalCertTypes
                        : certificateCategories.find((c) => c.id === certCategoryFilter)?.count || 0}
                    </span>
                    类
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
                  <button
                    onClick={() => setCertViewMode('grid')}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      certViewMode === 'grid' ? 'bg-white shadow-sm text-gov-blue' : 'text-gray-400'
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCertViewMode('list')}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      certViewMode === 'list' ? 'bg-white shadow-sm text-gov-blue' : 'text-gray-400'
                    )}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {certViewMode === 'grid' ? (
              <div className="grid grid-cols-4 gap-4">
                {filteredCerts.map((cert) => {
                  const st = statusConfig[cert.status]
                  const subCatName = getSubCategoryForCert(cert.id)
                  return (
                    <div key={cert.id} className="gov-card p-4 space-y-3 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-50 text-gov-blue rounded-lg">
                            {categoryIconMap[cert.category]}
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">{subCatName}</div>
                          </div>
                        </div>
                        <span className={cn(st.badge, 'flex items-center gap-1 shrink-0')}>
                          {st.icon}
                          {st.label}
                        </span>
                      </div>
                      <div className="font-semibold text-sm leading-tight">{cert.name}</div>
                      <div className="font-mono text-xs text-gray-400">{cert.credentialNo}</div>
                      <div className="text-xs text-gray-500">
                        <span className="text-gray-400">签发机关：</span>
                        {cert.issuer}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {cert.issueDate} ~ {cert.expiryDate}
                      </div>
                      <div className="pt-2 border-t border-gray-100">
                        <button className="text-xs text-gov-blue hover:text-gov-navy flex items-center gap-0.5 font-medium">
                          <Eye className="w-3.5 h-3.5" />
                          查看详情
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="gov-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs">
                      <th className="text-left px-4 py-3 font-medium">类型</th>
                      <th className="text-left px-4 py-3 font-medium">子分类</th>
                      <th className="text-left px-4 py-3 font-medium">证照名称</th>
                      <th className="text-left px-4 py-3 font-medium">证件编号</th>
                      <th className="text-left px-4 py-3 font-medium">签发机关</th>
                      <th className="text-left px-4 py-3 font-medium">有效期</th>
                      <th className="text-left px-4 py-3 font-medium">状态</th>
                      <th className="text-left px-4 py-3 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCerts.map((cert) => {
                      const st = statusConfig[cert.status]
                      const subCatName = getSubCategoryForCert(cert.id)
                      return (
                        <tr key={cert.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">{categoryIconMap[cert.category]}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">{subCatName}</td>
                          <td className="px-4 py-3 font-medium">{cert.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{cert.credentialNo}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{cert.issuer}</td>
                          <td className="px-4 py-3 text-xs text-gray-400">
                            {cert.issueDate} ~ {cert.expiryDate}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(st.badge, 'flex items-center gap-1 w-fit')}>
                              {st.icon}
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-gov-blue text-xs hover:text-gov-navy">查看详情</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'exempt' && (
        <div className="flex gap-4 min-h-[700px]">
          <div className="w-72 shrink-0 space-y-2 overflow-y-auto">
            {exemptionScenarios.map((s) => {
              const totalCalls = getExemptionCallCount(s.id) + s.callRecords.length
              const currentStep = getServiceStep(s.id)
              const isSelected = selectedExemptId === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedExemptId(s.id)
                    setActiveExemptionId(s.id)
                  }}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    isSelected
                      ? 'border-gov-blue bg-blue-50 shadow-md'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm text-gray-800">{s.name}</div>
                    <span className="gov-badge gov-badge-blue text-xs shrink-0">
                      <Zap className="w-3 h-3 mr-1" />
                      {totalCalls} 次
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    {s.department}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-gray-500">替代 {s.replacedCerts.length} 项证照</span>
                    <span className="text-gov-gold font-medium">{s.savingsTime}</span>
                  </div>
                  {currentStep > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gov-gold rounded-full transition-all"
                            style={{ width: `${(currentStep / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {serviceStatusSteps[currentStep]?.label}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <div className="flex-1 gov-card p-6 overflow-y-auto">
            {selectedScenario ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gov-navy">{selectedScenario.name}</h3>
                  <p className="text-sm text-gray-500 mt-2">{selectedScenario.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="gov-badge gov-badge-blue">
                      <Users className="w-3 h-3 mr-1" />
                      {selectedScenario.department}
                    </span>
                    <span className="gov-badge gov-badge-yellow">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {selectedScenario.savingsTime}
                    </span>
                  </div>
                </div>

                <div className="gov-section-title text-base">事项办理状态</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getServiceStep(selectedScenario.id) >= 5 ? (
                        <CheckCircle2 className="w-5 h-5 text-gov-green" />
                      ) : getServiceStep(selectedScenario.id) > 0 ? (
                        <Zap className="w-5 h-5 text-gov-gold animate-pulse" />
                      ) : (
                        <Clock className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-700">
                        {serviceStatusSteps[getServiceStep(selectedScenario.id)]?.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      步骤 {getServiceStep(selectedScenario.id)} / 5
                    </span>
                  </div>
                  <div className="relative">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gov-blue to-gov-gold rounded-full transition-all duration-500"
                        style={{ width: `${(getServiceStep(selectedScenario.id) / 5) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      {serviceStatusSteps.map((step, idx) => (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full border-2 transition-colors',
                              idx <= getServiceStep(selectedScenario.id)
                                ? 'border-gov-blue bg-gov-blue'
                                : 'border-gray-300 bg-white'
                            )}
                          />
                          <span
                            className={cn(
                              'text-xs mt-1',
                              idx <= getServiceStep(selectedScenario.id)
                                ? 'text-gov-blue font-medium'
                                : 'text-gray-400'
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gov-blue" />
                    调取证照清单
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs">
                          <th className="text-left px-4 py-2.5 font-medium">证照名称</th>
                          <th className="text-left px-4 py-2.5 font-medium">证照核验</th>
                          <th className="text-left px-4 py-2.5 font-medium">状态</th>
                          <th className="text-left px-4 py-2.5 font-medium">来源</th>
                          <th className="text-left px-4 py-2.5 font-medium">调用时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedScenario.replacedCertIds.map((certId, idx) => {
                          const cert = getCertById(certId)
                          const isVerified = exemptionCertsVerified[selectedScenario.id]
                          const isFirstHighlight = isVerified && idx === 0
                          const callHistory = getExemptionCallHistory(selectedScenario.id)
                          const lastCall = callHistory[idx] || callHistory[0]
                          return (
                            <tr
                              key={certId}
                              className={cn(
                                'border-t border-gray-100 transition-colors',
                                isFirstHighlight && 'bg-amber-50/50'
                              )}
                            >
                              <td className="px-4 py-3 font-medium text-gray-700">
                                <div className="flex items-center gap-2">
                                  {cert ? categoryIconMap[cert.category] : <CreditCard className="w-4 h-4 text-gray-300" />}
                                  <span>{cert?.name || selectedScenario.replacedCerts[idx]}</span>
                                  {isFirstHighlight && (
                                    <span className="gov-badge gov-badge-yellow text-xs">
                                      本次调用
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                {isVerified ? (
                                  <span className="gov-badge gov-badge-green flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3" />
                                    已核验
                                  </span>
                                ) : (
                                  <span className="gov-badge gov-badge-gray flex items-center gap-1 w-fit">
                                    <Clock className="w-3 h-3" />
                                    待核验
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="gov-badge gov-badge-green flex items-center gap-1 w-fit">
                                  <CheckCircle className="w-3 h-3" />
                                  已调用
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-gov-blue" />
                                  <span>深圳市电子证照库</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-400">
                                {lastCall?.date || '-'}
                                {lastCall?.time && <span className="ml-1">{lastCall.time}</span>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gov-blue" />
                    自动填充表单
                    {exemptionFormFilled[selectedScenario.id] && (
                      <span className="gov-badge gov-badge-green text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        已自动填充
                      </span>
                    )}
                  </h4>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedScenario.formFields.map((field, idx) => {
                        const isFilled = exemptionFormFilled[selectedScenario.id]
                        const sourceCert = getCertById(field.sourceCert)
                        const fieldKey = `${selectedScenario.id}-${idx}`
                        const isCopied = copiedField === fieldKey
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs text-gray-400">{field.name}</label>
                              {isFilled && (
                                <span className="text-xs text-gov-green flex items-center gap-0.5">
                                  <CheckCircle2 className="w-3 h-3" />
                                  已填充
                                </span>
                              )}
                            </div>
                            <div
                              className={cn(
                                'px-3 py-2.5 bg-white border rounded text-sm font-mono transition-all flex items-center justify-between group',
                                isFilled
                                  ? 'border-green-300 text-gray-700 bg-green-50/50'
                                  : 'border-gray-200 text-gray-400'
                              )}
                            >
                              <div className="flex-1">
                                {field.value}
                                {isFilled && sourceCert && (
                                  <div className="text-xs text-gray-400 mt-0.5 font-sans">
                                    来源：{sourceCert.name}
                                  </div>
                                )}
                              </div>
                              {isFilled && (
                                <button
                                  onClick={() => handleCopyField(field.value, fieldKey)}
                                  className="ml-2 p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gov-blue transition-colors opacity-0 group-hover:opacity-100"
                                  title="复制填充内容"
                                >
                                  {isCopied ? (
                                    <CheckCircle2 className="w-4 h-4 text-gov-green" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-gov-blue" />
                    调用历史
                  </h4>
                  <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="relative">
                      <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
                      <div className="space-y-4">
                        {getExemptionCallHistory(selectedScenario.id).map((record, idx) => {
                          const isLatest = idx === 0 && exemptionCallCount[selectedScenario.id] > 0
                          return (
                            <div key={idx} className={cn('relative pl-6', isLatest && 'animate-pulse')}>
                              <div
                                className={cn(
                                  'absolute left-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                  record.success
                                    ? 'border-gov-green bg-green-50'
                                    : 'border-red-400 bg-red-50',
                                  isLatest && 'ring-2 ring-gov-green/30'
                                )}
                              >
                                {record.success ? (
                                  <CheckCircle className="w-2.5 h-2.5 text-gov-green" />
                                ) : (
                                  <XCircle className="w-2.5 h-2.5 text-red-400" />
                                )}
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={cn('text-sm font-medium', record.success ? 'text-gray-700' : 'text-red-500')}>
                                    {record.success ? '调用成功' : '调用失败'}
                                  </span>
                                  {isLatest && (
                                    <span className="gov-badge gov-badge-blue text-xs">最新</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                  <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {record.certCount} 项证照
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {record.operator}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {record.date} {record.time}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gov-gold" />
                    节省统计
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gov-gold">
                        {selectedScenario.totalSavedTime *
                          (selectedScenario.callRecords.length + getExemptionCallCount(selectedScenario.id))}
                      </div>
                      <div className="text-xs text-amber-600 mt-1">累计节省时间（分钟）</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gov-blue">
                        {selectedScenario.replacedCerts.length}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">减少提交材料（项）</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gov-green">
                        {selectedScenario.callRecords.length + getExemptionCallCount(selectedScenario.id)}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">累计调用次数</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCallExemptEnhanced}
                  disabled={isExemptionCalling || getServiceStep(selectedScenario.id) >= 5}
                  className={cn(
                    'w-full py-3 rounded-md font-medium transition-all flex items-center justify-center gap-2',
                    isExemptionCalling
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : getServiceStep(selectedScenario.id) >= 5
                      ? 'bg-gov-green text-white hover:brightness-110'
                      : 'gov-btn-gold'
                  )}
                >
                  {isExemptionCalling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      调用中...
                    </>
                  ) : getServiceStep(selectedScenario.id) >= 5 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      事项已完成
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      立即调用免证办
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                请选择左侧场景查看详情
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'auth' && (
        <div className="flex gap-4 min-h-[700px]">
          <div className="w-80 shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索授权机构..."
                  value={authSearchQuery}
                  onChange={(e) => setAuthSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue"
                />
                {authSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAuthSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="清除授权搜索"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={openNewAuthDialog}
                className="gov-btn-primary px-3 py-2 flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                新增授权
                </button>
              </div>

              <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
              {[
                { key: 'all', label: '全部' },
                { key: 'active', label: '授权中' },
                { key: 'revoked', label: '已撤销' },
                { key: 'expired', label: '已过期' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setAuthStatusFilter(tab.key as AuthStatusFilter)}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-medium rounded transition-colors',
                    authStatusFilter === tab.key
                      ? 'bg-white text-gov-blue shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
                ))}
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-gov-blue">
                当前筛选到 <span className="font-semibold">{filteredAuthRecords.length}</span> 条授权记录
                {authSearchQuery.trim() && (
                  <span>，关键词：{authSearchQuery.trim()}</span>
                )}
                {authStatusFilter !== 'all' && (
                  <span>，状态：{authStatusConfig[authStatusFilter].label}</span>
                )}
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {filteredAuthRecords.map((record) => {
                  const status = getEffectiveAuthStatus(record)
                  const st = authStatusConfig[status]
                  const isSelected = effectiveSelectedAuthId === record.id
                return (
                  <button
                    key={record.id}
                    onClick={() => setSelectedAuthId(record.id)}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border transition-colors',
                      isSelected
                        ? 'border-gov-blue bg-blue-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm text-gray-800">{record.party}</div>
                      <span className={cn(st.badge, 'shrink-0')}>{st.label}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      授权证照 <span className="text-gray-600 font-medium">{record.certIds.length}</span> 项
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>已调用 {record.callCount} 次</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </button>
                )
              })}
              {filteredAuthRecords.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-200 bg-white py-8 text-center text-sm text-gray-400">
                  <Search className="mx-auto mb-2 h-5 w-5 text-gray-300" />
                  <div>未找到匹配的授权记录</div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthSearchQuery('')
                      setAuthStatusFilter('all')
                    }}
                    className="mt-3 text-xs font-medium text-gov-blue hover:text-gov-navy"
                  >
                    清除搜索与筛选
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 gov-card p-6 overflow-y-auto">
            {selectedAuth ? (
              <div className="space-y-6">
                {getEffectiveAuthStatus(selectedAuth) === 'revoked' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-red-700">
                        该授权已于 {selectedAuth.revokeTime?.slice(0, 16)} 撤销
                      </div>
                      <div className="text-xs text-red-600 mt-1">
                        原因：{selectedAuth.revokeReason}
                      </div>
                      {selectedAuth.revokeOperator && (
                        <div className="text-xs text-red-500 mt-1">
                          操作人：{selectedAuth.revokeOperator}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gov-blue" />
                    授权详情
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">授权机构</div>
                      <div className="text-sm font-medium text-gray-700">{selectedAuth.party}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400">授权范围</div>
                      <div className="text-sm font-medium text-gray-700">
                        {authScopeLabels[selectedAuth.authScope]}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        授权日期
                      </div>
                      <div className="text-sm text-gray-600">{selectedAuth.authDate}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        到期日期
                      </div>
                      <div className="text-sm text-gray-600">{selectedAuth.expiryDate}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        调用次数
                      </div>
                      <div className="text-sm text-gray-600 font-mono font-semibold">
                        {callCountDisplay.toLocaleString()} 次
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        最后调用
                      </div>
                      <div className="text-sm text-gray-600">{selectedAuth.lastCalled}</div>
                    </div>
                    {selectedAuth.purpose && (
                      <div className="col-span-2 space-y-1">
                        <div className="text-xs text-gray-400">用途说明</div>
                        <div className="text-sm text-gray-600">{selectedAuth.purpose}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gov-blue" />
                    授权证照
                  </h4>
                  <div className="space-y-2">
                    {selectedAuth.certIds.map((certId) => {
                      const cert = getCertById(certId)
                      return (
                        <div
                          key={certId}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="p-1.5 bg-blue-50 text-gov-blue rounded">
                            {cert ? categoryIconMap[cert.category] : <CreditCard className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-700">
                              {cert?.name || certId}
                            </div>
                            {cert && (
                              <div className="text-xs text-gray-400 font-mono">{cert.credentialNo}</div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-gov-gold" />
                    调用边界
                  </h4>
                  <div
                    className={cn(
                      'rounded-lg p-4 space-y-2 relative',
                      getEffectiveAuthStatus(selectedAuth) === 'revoked'
                        ? 'bg-gray-100 border border-gray-200'
                        : 'bg-amber-50 border border-amber-200'
                    )}
                  >
                    {getEffectiveAuthStatus(selectedAuth) === 'revoked' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg z-10">
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-sm font-medium text-red-600">
                            授权已撤销，所有调用权限已失效
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle
                        className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-400'
                            : 'text-gov-green'
                        )}
                      />
                      <span
                        className={cn(
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                        )}
                      >
                        可读取证照基础信息
                      </span>
                    </div>
                    {selectedAuth.authScope === 'verify' && (
                      <div className="flex items-start gap-2 text-sm">
                        <CheckCircle
                          className={cn(
                            'w-4 h-4 shrink-0 mt-0.5',
                            getEffectiveAuthStatus(selectedAuth) === 'revoked'
                              ? 'text-gray-400'
                              : 'text-gov-green'
                          )}
                        />
                        <span
                          className={cn(
                            getEffectiveAuthStatus(selectedAuth) === 'revoked'
                              ? 'text-gray-400'
                              : 'text-gray-600'
                          )}
                        >
                          可进行身份核验
                        </span>
                      </div>
                    )}
                    {selectedAuth.authScope === 'full' && (
                      <>
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle
                            className={cn(
                              'w-4 h-4 shrink-0 mt-0.5',
                              getEffectiveAuthStatus(selectedAuth) === 'revoked'
                                ? 'text-gray-400'
                                : 'text-gov-green'
                            )}
                          />
                          <span
                            className={cn(
                              getEffectiveAuthStatus(selectedAuth) === 'revoked'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            )}
                          >
                            可进行身份核验
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle
                            className={cn(
                              'w-4 h-4 shrink-0 mt-0.5',
                              getEffectiveAuthStatus(selectedAuth) === 'revoked'
                                ? 'text-gray-400'
                                : 'text-gov-green'
                            )}
                          />
                          <span
                            className={cn(
                              getEffectiveAuthStatus(selectedAuth) === 'revoked'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            )}
                          >
                            可获取完整证照信息
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex items-start gap-2 text-sm">
                      <XCircle
                        className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-300'
                            : 'text-red-400'
                        )}
                      />
                      <span
                        className={cn(
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                        )}
                      >
                        不可修改证照内容
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <XCircle
                        className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-300'
                            : 'text-red-400'
                        )}
                      />
                      <span
                        className={cn(
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                        )}
                      >
                        不可转借授权权限
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <AlertTriangle
                        className={cn(
                          'w-4 h-4 shrink-0 mt-0.5',
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-300'
                            : 'text-gov-gold'
                        )}
                      />
                      <span
                        className={cn(
                          getEffectiveAuthStatus(selectedAuth) === 'revoked'
                            ? 'text-gray-400'
                            : 'text-gray-600'
                        )}
                      >
                        授权期限：{selectedAuth.authDate} 至 {selectedAuth.expiryDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-gov-blue" />
                    审计记录
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs">
                          <th className="text-left px-4 py-2.5 font-medium">操作</th>
                          <th className="text-left px-4 py-2.5 font-medium">时间</th>
                          <th className="text-left px-4 py-2.5 font-medium">操作人</th>
                          <th className="text-left px-4 py-2.5 font-medium">详情</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAuthAudits.map((audit) => (
                          <tr key={audit.id} className="border-t border-gray-100">
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  'gov-badge',
                                  audit.action === 'grant' && 'gov-badge-green',
                                  audit.action === 'revoke' && 'gov-badge-red',
                                  audit.action === 'call' && 'gov-badge-blue',
                                  audit.action === 'expire' && 'gov-badge-gray'
                                )}
                              >
                                {auditActionLabels[audit.action]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400">{audit.timestamp}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{audit.operator}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{audit.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {getEffectiveAuthStatus(selectedAuth) === 'active' ? (
                  <div className="pt-4 border-t border-gray-100 flex gap-3">
                    <button
                      onClick={openAdjustDialog}
                      className="gov-btn-secondary flex items-center"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      调整授权
                    </button>
                    <button
                      onClick={openRevokeDialog}
                      className="gov-btn-secondary text-red-500 border-red-200 hover:bg-red-50 ml-auto"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      取消授权
                    </button>
                  </div>
                ) : getEffectiveAuthStatus(selectedAuth) === 'revoked' ? (
                  <div className="pt-4 border-t border-gray-100">
                    <button
                      disabled
                      className="gov-btn-secondary bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      已撤销
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                请选择左侧授权记录查看详情
              </div>
            )}
          </div>
        </div>
      )}

      {showAuthDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[560px] max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-800">
                  {isAdjustMode ? '调整授权' : '新增授权'}
                </h3>
                <button
                  onClick={() => {
                    setShowAuthDialog(false)
                    setShowPartySuggestions(false)
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    授权机构 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formParty}
                      onChange={(e) => setFormParty(e.target.value)}
                      onFocus={() => setShowPartySuggestions(true)}
                      onBlur={() => setTimeout(() => setShowPartySuggestions(false), 200)}
                      placeholder="请输入或选择授权机构名称"
                      className={cn(
                        'w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 transition-colors',
                        formParty.trim() === '' ? 'border-red-300' : 'border-gray-200 focus:border-gov-blue'
                      )}
                    />
                    {showPartySuggestions && filteredPartySuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[60] max-h-48 overflow-y-auto">
                        {filteredPartySuggestions.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              setFormParty(p)
                              setShowPartySuggestions(false)
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-gov-blue transition-colors"
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {formParty && (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-gov-green" />
                      已选 {formParty}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    授权范围 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'read', label: '读取', desc: '仅可读取证照基础信息' },
                      { value: 'verify', label: '核验', desc: '可读取信息并进行身份核验' },
                      { value: 'full', label: '完全', desc: '可获取完整证照信息并核验' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormScope(opt.value as 'read' | 'verify' | 'full')}
                        className={cn(
                          'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex items-start gap-3',
                          formScope === opt.value
                            ? 'border-gov-blue bg-blue-50 ring-2 ring-gov-blue/20'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div
                          className={cn(
                            'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                            formScope === opt.value ? 'border-gov-blue' : 'border-gray-300'
                          )}
                        >
                          {formScope === opt.value && (
                            <div className="w-2 h-2 rounded-full bg-gov-blue" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            'font-semibold',
                            formScope === opt.value ? 'text-gov-blue' : 'text-gray-800'
                          )}>
                            {opt.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    授权证照 <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-2">（已选 {formCertIds.length} 项）</span>
                  </label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {groupedCerts.map((cat) => {
                      const isExpanded = expandedCategories.includes(cat.id)
                      const catCerts = certificates.filter((c) => c.category === cat.id)
                      const allSelected = catCerts.length > 0 && catCerts.every((c) => formCertIds.includes(c.id))
                      return (
                        <div key={cat.id}>
                          <button
                            type="button"
                            onClick={() => toggleCategoryExpand(cat.id)}
                            className="w-full px-3 py-2.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <div className="p-1 bg-blue-50 text-gov-blue rounded">
                                {categoryIconMap[cat.id]}
                              </div>
                              <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                              <span className="text-xs text-gray-400">{catCerts.length} 张证照</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (allSelected) {
                                  catCerts.forEach((c) => {
                                    if (formCertIds.includes(c.id)) toggleCertSelection(c.id)
                                  })
                                } else {
                                  catCerts.forEach((c) => {
                                    if (!formCertIds.includes(c.id)) toggleCertSelection(c.id)
                                  })
                                }
                              }}
                              className="text-xs text-gov-blue hover:text-gov-navy font-medium"
                            >
                              {allSelected ? '取消全选' : '全选'}
                            </button>
                          </button>
                          {isExpanded && (
                            <div className="px-3 py-2 space-y-1 bg-white">
                              {catCerts.map((cert) => {
                                const checked = formCertIds.includes(cert.id)
                                return (
                                  <label
                                    key={cert.id}
                                    className={cn(
                                      'flex items-start gap-2 px-2 py-2 rounded cursor-pointer transition-colors',
                                      checked ? 'bg-blue-50' : 'hover:bg-gray-50'
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                                        checked ? 'bg-gov-blue border-gov-blue' : 'border-gray-300'
                                      )}
                                    >
                                      {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </div>
                                    <div className="flex-1" onClick={() => toggleCertSelection(cert.id)}>
                                      <div className={cn(
                                        'text-sm',
                                        checked ? 'text-gov-blue font-medium' : 'text-gray-700'
                                      )}>
                                        {cert.name}
                                      </div>
                                      <div className="text-xs text-gray-400 font-mono">{cert.credentialNo}</div>
                                      <div className="text-xs text-gray-400">{cert.issuer}</div>
                                    </div>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {formCertIds.length === 0 && (
                    <div className="text-xs text-red-500">请至少选择一项证照</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    授权期限 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {expiryPresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyExpiryPreset(preset.days)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200 text-gray-600 hover:border-gov-blue hover:text-gov-blue hover:bg-blue-50 transition-colors"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={formExpiryDate}
                    min={today}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 transition-colors',
                      formExpiryDate < today ? 'border-red-300' : 'border-gray-200 focus:border-gov-blue'
                    )}
                  />
                  {formExpiryDate && formExpiryDate < today && (
                    <div className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      到期日期不能早于今天
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">用途说明（选填）</label>
                  <textarea
                    value={formPurpose}
                    onChange={(e) => setFormPurpose(e.target.value)}
                    rows={3}
                    placeholder="请输入用途说明（选填）"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue resize-none transition-colors"
                  />
                </div>
              </div>

              <div className="pt-5 mt-5 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowAuthDialog(false)
                    setShowPartySuggestions(false)
                  }}
                  className="flex-1 gov-btn-secondary"
                >
                  取消
                </button>
                <button
                  onClick={handleAuthSubmit}
                  disabled={!isFormValid}
                  className={cn(
                    'flex-1 gov-btn-primary',
                    !isFormValid && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {isAdjustMode ? '保存修改' : '提交授权'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRevokeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {revokeStep === 1 && '步骤 1/3 · 撤销申请'}
                    {revokeStep === 2 && '步骤 2/3 · 二次确认'}
                    {revokeStep === 3 && '撤销成功'}
                  </h3>
                  {revokeStep < 3 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {revokeStep === 1 && '请选择撤销授权的原因'}
                      {revokeStep === 2 && '撤销后以下权限将永久失效，请仔细核对'}
                    </p>
                  )}
                </div>
                {revokeStep < 3 && (
                  <button
                    onClick={() => {
                      setShowRevokeDialog(false)
                      setRevokeStep(1)
                      setRevokeReason('')
                      setRevokeRemark('')
                    }}
                    className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {revokeStep < 3 && (
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                          step === revokeStep
                            ? 'bg-gov-blue text-white ring-4 ring-gov-blue/20'
                            : step < revokeStep
                            ? 'bg-gov-green text-white'
                            : 'bg-gray-100 text-gray-400'
                        )}
                      >
                        {step < revokeStep ? <CheckCircle2 className="w-4 h-4" /> : step}
                      </div>
                      {step < 3 && (
                        <div
                          className={cn(
                            'w-8 h-0.5 rounded transition-colors',
                            step < revokeStep ? 'bg-gov-green' : 'bg-gray-200'
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-5">
              {revokeStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">撤销原因</label>
                    <div className="space-y-2">
                      {revokeReasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setRevokeReason(reason)}
                          className={cn(
                            'w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors',
                            revokeReason === reason
                              ? 'border-gov-blue bg-blue-50 text-gov-blue font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">补充说明</label>
                    <textarea
                      value={revokeRemark}
                      onChange={(e) => setRevokeRemark(e.target.value)}
                      rows={3}
                      placeholder="请输入补充说明（选填）"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue resize-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {revokeStep === 2 && selectedAuth && (
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-800">撤销信息摘要</div>
                    </div>
                    <div className="px-4 py-3 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">授权机构</span>
                        <span className="font-medium text-gray-800">{selectedAuth.party}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">授权范围</span>
                        <span className="font-medium text-gray-800">{authScopeLabels[selectedAuth.authScope]}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">授权证照数量</span>
                        <span className="font-medium text-gray-800">{selectedAuth.certIds.length} 项</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">已调用次数</span>
                        <span className="font-medium text-gray-800 font-mono">{selectedAuth.callCount} 次</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">撤销原因</span>
                        <span className="font-medium text-red-600">{revokeReason}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">授权到期日</span>
                        <span className="font-medium text-gray-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {selectedAuth.expiryDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">涉及证照</div>
                    <div className="space-y-1.5">
                      {selectedAuth.certIds.slice(0, 3).map((certId) => {
                        const cert = getCertById(certId)
                        return (
                          <div key={certId} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md text-sm">
                            <div className="p-1 bg-blue-50 text-gov-blue rounded">
                              {cert ? categoryIconMap[cert.category] : <CreditCard className="w-3 h-3" />}
                            </div>
                            <span className="text-gray-700">{cert?.name || certId}</span>
                          </div>
                        )
                      })}
                      {selectedAuth.certIds.length > 3 && (
                        <div className="text-xs text-gray-400 pl-1">
                          等 {selectedAuth.certIds.length} 项证照
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-red-600">
                      此操作不可撤销，撤销后该机构将无法调用任何已授权的证照信息
                    </div>
                  </div>
                </div>
              )}

              {revokeStep === 3 && selectedAuth && (
                <div className="text-center py-4 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-gov-green animate-pulse" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-800">
                      已成功撤销对 {selectedAuth.party} 的授权
                    </div>
                    <div className="text-sm text-gray-500 mt-2">
                      所有调用权限已失效，审计记录已自动生成
                    </div>
                  </div>
                </div>
              )}
            </div>

            {revokeStep < 3 && (
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                {revokeStep === 1 ? (
                  <>
                    <button
                      onClick={() => {
                        setShowRevokeDialog(false)
                        setRevokeStep(1)
                        setRevokeReason('')
                        setRevokeRemark('')
                      }}
                      className="flex-1 gov-btn-secondary"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleRevokeStep1Next}
                      disabled={!revokeReason}
                      className={cn(
                        'flex-1 gov-btn-primary',
                        !revokeReason && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      下一步
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setRevokeStep(1)}
                      className="flex-1 gov-btn-secondary"
                    >
                      上一步
                    </button>
                    <button
                      onClick={handleRevokeConfirm}
                      className="flex-1 gov-btn-secondary text-red-500 border-red-200 bg-red-50 hover:bg-red-100 font-medium"
                    >
                      确认撤销
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
