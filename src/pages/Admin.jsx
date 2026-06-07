import { useState, useEffect, useCallback } from 'react'
import { Shield, EyeOff, Database, DollarSign, Plus, X, Star, Loader2, History, TrendingUp, FileText, Eye as EyeIcon, Clock, Target, BarChart3, CheckCircle2, AlertCircle, RefreshCw, Play, ArrowUpDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { api } from '../utils/api'

const TABS = [
  { key: 'enterprises', label: '企业信用', icon: Shield },
  { key: 'privacy', label: '隐私脱敏', icon: EyeOff },
  { key: 'datasets', label: 'AI数据集', icon: Database },
  { key: 'salary', label: '薪酬基准', icon: DollarSign },
]

const creditLevelColor = {
  A: 'bg-emerald-50 text-emerald-700',
  'B+': 'bg-teal-50 text-teal-700',
  B: 'bg-amber-50 text-amber-700',
  C: 'bg-red-50 text-red-700',
}

const creditScoreBar = (score) => {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}

const datasetStatusColor = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-50 text-slate-500',
  archived: 'bg-amber-50 text-amber-700',
}
const datasetStatusLabel = { active: '活跃', inactive: '停用', archived: '归档' }

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      >
        <option value="">{placeholder || '-- 请选择 --'}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </div>
  )
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState('enterprises')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [enterprises, setEnterprises] = useState([])
  const [creditModal, setCreditModal] = useState(false)
  const [creditTarget, setCreditTarget] = useState(null)
  const [creditForm, setCreditForm] = useState({ credit_score: 60, credit_level: 'B', reason: '' })

  const [privacyRules, setPrivacyRules] = useState([])

  const [datasets, setDatasets] = useState([])
  const [datasetModal, setDatasetModal] = useState(false)
  const [datasetForm, setDatasetForm] = useState({ name: '', description: '', category: '', record_count: 0, quality_score: 0, status: 'active', data_scope: '' })

  const [salaryBenchmarks, setSalaryBenchmarks] = useState([])
  const [salaryFilters, setSalaryFilters] = useState({ industry: '', function_type: '', career_level: '', location: '' })
  const [salaryModal, setSalaryModal] = useState(false)
  const [salaryForm, setSalaryForm] = useState({ industry: '', function_type: '', career_level: '', location: '', p25: '', p50: '', p75: '', p90: '' })

  const [enterpriseDetail, setEnterpriseDetail] = useState(null)
  const [enterpriseDetailModal, setEnterpriseDetailModal] = useState(false)
  const [creditHistory, setCreditHistory] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  const [sandboxPreview, setSandboxPreview] = useState(false)
  const [sandboxData, setSandboxData] = useState(null)
  const [desensitizationLogs, setDesensitizationLogs] = useState([])
  const [loadingSandbox, setLoadingSandbox] = useState(false)

  const [datasetDetail, setDatasetDetail] = useState(null)
  const [datasetDetailModal, setDatasetDetailModal] = useState(false)
  const [loadingDatasetDetail, setLoadingDatasetDetail] = useState(false)

  const [salaryDetail, setSalaryDetail] = useState(null)
  const [salaryDetailModal, setSalaryDetailModal] = useState(false)
  const [salaryHistory, setSalaryHistory] = useState([])
  const [salaryChartData, setSalaryChartData] = useState([])
  const [loadingSalaryDetail, setLoadingSalaryDetail] = useState(false)

  const fetchEnterprises = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/enterprises')
      setEnterprises(Array.isArray(data) ? data : [])
    } catch { setEnterprises([]) }
    finally { setLoading(false) }
  }, [])

  const fetchPrivacyRules = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/privacy-rules')
      setPrivacyRules(Array.isArray(data) ? data : [])
    } catch { setPrivacyRules([]) }
    finally { setLoading(false) }
  }, [])

  const fetchDatasets = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/admin/ai-datasets')
      setDatasets(Array.isArray(data) ? data : [])
    } catch { setDatasets([]) }
    finally { setLoading(false) }
  }, [])

  const fetchSalaryBenchmarks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (salaryFilters.industry) params.set('industry', salaryFilters.industry)
      if (salaryFilters.function_type) params.set('function_type', salaryFilters.function_type)
      if (salaryFilters.career_level) params.set('career_level', salaryFilters.career_level)
      if (salaryFilters.location) params.set('location', salaryFilters.location)
      const qs = params.toString()
      const data = await api.get(`/admin/salary-benchmarks${qs ? `?${qs}` : ''}`)
      setSalaryBenchmarks(Array.isArray(data) ? data : [])
    } catch { setSalaryBenchmarks([]) }
    finally { setLoading(false) }
  }, [salaryFilters])

  const fetchEnterpriseDetail = async (enterpriseId) => {
    setLoadingDetail(true)
    try {
      const [detail, history] = await Promise.all([
        api.get(`/admin/enterprises/${enterpriseId}/detail`),
        api.get(`/admin/enterprises/${enterpriseId}/credit-history`),
      ])
      setEnterpriseDetail(detail)
      setCreditHistory(Array.isArray(history) ? history : [])
    } catch (error) {
      console.error('获取企业详情失败:', error)
    } finally {
      setLoadingDetail(false)
    }
  }

  const fetchSandboxPreview = async () => {
    setLoadingSandbox(true)
    try {
      const [preview, logs] = await Promise.all([
        api.get('/admin/privacy-sandbox/preview'),
        api.get('/admin/privacy-sandbox/logs'),
      ])
      setSandboxData(preview)
      setDesensitizationLogs(Array.isArray(logs) ? logs : [])
    } catch (error) {
      console.error('获取沙箱预览失败:', error)
    } finally {
      setLoadingSandbox(false)
    }
  }

  const fetchDatasetDetail = async (datasetId) => {
    setLoadingDatasetDetail(true)
    try {
      const detail = await api.get(`/admin/ai-datasets/${datasetId}/detail`)
      setDatasetDetail(detail)
    } catch (error) {
      console.error('获取数据集详情失败:', error)
    } finally {
      setLoadingDatasetDetail(false)
    }
  }

  const fetchSalaryDetail = async (salaryId) => {
    setLoadingSalaryDetail(true)
    try {
      const [detail, history, chartData] = await Promise.all([
        api.get(`/admin/salary-benchmarks/${salaryId}/detail`),
        api.get(`/admin/salary-benchmarks/${salaryId}/history`),
        api.get(`/admin/salary-benchmarks/${salaryId}/chart-data`),
      ])
      setSalaryDetail(detail)
      setSalaryHistory(Array.isArray(history) ? history : [])
      setSalaryChartData(Array.isArray(chartData) ? chartData : [])
    } catch (error) {
      console.error('获取薪酬详情失败:', error)
    } finally {
      setLoadingSalaryDetail(false)
    }
  }

  const updateSalaryBenchmark = async (salaryId, data) => {
    try {
      await api.put(`/admin/salary-benchmarks/${salaryId}`, data)
      fetchSalaryDetail(salaryId)
      fetchSalaryBenchmarks()
    } catch (error) {
      console.error('更新薪酬基准失败:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'enterprises') fetchEnterprises()
    else if (activeTab === 'privacy') fetchPrivacyRules()
    else if (activeTab === 'datasets') fetchDatasets()
    else if (activeTab === 'salary') fetchSalaryBenchmarks()
  }, [activeTab, fetchEnterprises, fetchPrivacyRules, fetchDatasets, fetchSalaryBenchmarks])

  const submitCredit = async () => {
    if (!creditTarget) return
    setSubmitting(true)
    try {
      await api.put(`/admin/enterprises/${creditTarget.id}/credit`, {
        credit_score: creditForm.credit_score,
        credit_level: creditForm.credit_level,
        action_type: 'manual_adjust',
        score_change: creditForm.credit_score - creditTarget.credit_score,
        reason: creditForm.reason,
      })
      setCreditModal(false)
      setCreditTarget(null)
      fetchEnterprises()
    } catch {} finally { setSubmitting(false) }
  }

  const togglePrivacyRule = async (ruleId, currentEnabled) => {
    const updatedRules = privacyRules.map((r) =>
      r.id === ruleId ? { ...r, enabled: currentEnabled ? 0 : 1 } : r
    )
    setPrivacyRules(updatedRules)
    try {
      await api.put('/admin/privacy-rules', {
        rules: [{ id: ruleId, enabled: !currentEnabled }],
      })
    } catch {
      setPrivacyRules(privacyRules)
    }
  }

  const submitDataset = async () => {
    setSubmitting(true)
    try {
      await api.post('/admin/ai-datasets', datasetForm)
      setDatasetModal(false)
      setDatasetForm({ name: '', description: '', category: '', record_count: 0, quality_score: 0, status: 'active', data_scope: '' })
      fetchDatasets()
    } catch {} finally { setSubmitting(false) }
  }

  const submitSalary = async () => {
    setSubmitting(true)
    try {
      await api.post('/admin/salary-benchmarks', {
        ...salaryForm,
        p25: salaryForm.p25 ? Number(salaryForm.p25) : null,
        p50: salaryForm.p50 ? Number(salaryForm.p50) : null,
        p75: salaryForm.p75 ? Number(salaryForm.p75) : null,
        p90: salaryForm.p90 ? Number(salaryForm.p90) : null,
      })
      setSalaryModal(false)
      setSalaryForm({ industry: '', function_type: '', career_level: '', location: '', p25: '', p50: '', p75: '', p90: '' })
      fetchSalaryBenchmarks()
    } catch {} finally { setSubmitting(false) }
  }

  const openCreditModal = (ent) => {
    setCreditTarget(ent)
    setCreditForm({ credit_score: ent.credit_score || 60, credit_level: ent.credit_level || 'B', reason: '' })
    setCreditModal(true)
  }

  const openEnterpriseDetail = async (ent) => {
    setEnterpriseDetailModal(true)
    setEnterpriseDetail(null)
    setCreditHistory([])
    await fetchEnterpriseDetail(ent.id)
  }

  const openSandboxPreview = async () => {
    setSandboxPreview(true)
    setSandboxData(null)
    setDesensitizationLogs([])
    await fetchSandboxPreview()
  }

  const openDatasetDetail = async (ds) => {
    setDatasetDetailModal(true)
    setDatasetDetail(null)
    await fetchDatasetDetail(ds.id)
  }

  const openSalaryDetail = async (sb) => {
    setSalaryDetailModal(true)
    setSalaryDetail(null)
    setSalaryHistory([])
    setSalaryChartData([])
    await fetchSalaryDetail(sb.id)
  }

  const formatWan = (val) => {
    if (val == null) return '-'
    return `${(val / 10000).toFixed(val % 10000 === 0 ? 0 : 1)}万`
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">后台管理</h1>
          <p className="mt-2 text-sm text-slate-500">企业信用、隐私脱敏、数据集和薪酬基准管理</p>
        </div>
      </section>

      <div className="flex gap-1 rounded-lg border border-border bg-slate-50 p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'enterprises' && (
        <>
          {loading ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="animate-pulse p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-slate-200" />
                ))}
              </div>
            </div>
          ) : enterprises.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <Shield size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">暂无企业数据</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">企业名称</th>
                      <th className="px-4 py-3 text-left font-semibold">行业</th>
                      <th className="px-4 py-3 text-left font-semibold">规模</th>
                      <th className="px-4 py-3 text-left font-semibold">信用分</th>
                      <th className="px-4 py-3 text-left font-semibold">信用等级</th>
                      <th className="px-4 py-3 text-left font-semibold">履约率</th>
                      <th className="px-4 py-3 text-left font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {enterprises.map((ent) => (
                      <tr key={ent.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{ent.name}</td>
                        <td className="px-4 py-3 text-slate-700">{ent.industry || '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{ent.scale || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900 w-8">{ent.credit_score}</span>
                            <div className="flex-1 h-2 rounded-full bg-slate-100 max-w-[80px]">
                              <div
                                className={`h-2 rounded-full ${creditScoreBar(ent.credit_score)}`}
                                style={{ width: `${ent.credit_score}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${creditLevelColor[ent.credit_level] || 'bg-slate-50 text-slate-500'}`}>
                            {ent.credit_level}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {ent.contract_fulfillment_rate != null ? `${(ent.contract_fulfillment_rate * 100).toFixed(0)}%` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEnterpriseDetail(ent)}
                              className="text-xs font-medium text-slate-600 hover:text-slate-800 hover:underline"
                            >
                              查看详情
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => openCreditModal(ent)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              调整信用
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'privacy' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openSandboxPreview}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-200"
            >
              <Play size={16} />
              沙箱预览
            </button>
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="animate-pulse p-6 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-slate-200" />
                ))}
              </div>
            </div>
          ) : privacyRules.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <EyeOff size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">暂无脱敏规则</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">字段名</th>
                      <th className="px-4 py-3 text-left font-semibold">规则类型</th>
                      <th className="px-4 py-3 text-left font-semibold">匹配模式</th>
                      <th className="px-4 py-3 text-left font-semibold">替换模板</th>
                      <th className="px-4 py-3 text-left font-semibold">启用</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {privacyRules.map((rule) => (
                      <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{rule.field_name}</td>
                        <td className="px-4 py-3 text-slate-700">{rule.rule_type}</td>
                        <td className="px-4 py-3 text-slate-700 font-mono text-xs">{rule.pattern || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 font-mono text-xs">{rule.replacement || '-'}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => togglePrivacyRule(rule.id, rule.enabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              rule.enabled ? 'bg-primary' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                rule.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'datasets' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setDatasetModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              <Plus size={16} />
              新增数据集
            </button>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-5 shadow-sm h-44" />
              ))}
            </div>
          ) : datasets.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <Database size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">暂无数据集</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {datasets.map((ds) => (
                <div key={ds.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{ds.name}</h3>
                    <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${datasetStatusColor[ds.status] || 'bg-slate-50 text-slate-500'}`}>
                      {datasetStatusLabel[ds.status] || ds.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{ds.description || '-'}</p>
                  {ds.category && (
                    <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {ds.category}
                    </span>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>记录数 <strong className="text-slate-900">{(ds.record_count ?? 0).toLocaleString()}</strong></span>
                    <span className="flex items-center gap-1">质量 <Stars rating={ds.quality_score || 0} /></span>
                  </div>
                  {ds.data_scope && (
                    <p className="mt-1.5 text-xs text-slate-400">范围: {ds.data_scope}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-border">
                    <button
                      onClick={() => openDatasetDetail(ds)}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'salary' && (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={salaryFilters.industry}
                onChange={(e) => setSalaryFilters((f) => ({ ...f, industry: e.target.value }))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">全部行业</option>
                {['互联网', '人工智能', '金融科技', '医疗健康', '智能制造'].map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
              <select
                value={salaryFilters.function_type}
                onChange={(e) => setSalaryFilters((f) => ({ ...f, function_type: e.target.value }))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">全部职能</option>
                {['技术', '产品', '数据', '设计'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <select
                value={salaryFilters.career_level}
                onChange={(e) => setSalaryFilters((f) => ({ ...f, career_level: e.target.value }))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">全部职级</option>
                {['P5', 'P6', 'P7', 'P8'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select
                value={salaryFilters.location}
                onChange={(e) => setSalaryFilters((f) => ({ ...f, location: e.target.value }))}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">全部城市</option>
                {['北京', '上海', '深圳', '杭州', '广州'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setSalaryModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              <Plus size={16} />
              新增薪酬基准
            </button>
          </div>

          {loading ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="animate-pulse p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 rounded bg-slate-200" />
                ))}
              </div>
            </div>
          ) : salaryBenchmarks.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-16 text-center shadow-sm">
              <DollarSign size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-400">暂无薪酬基准数据</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">行业</th>
                      <th className="px-4 py-3 text-left font-semibold">职能</th>
                      <th className="px-4 py-3 text-left font-semibold">职级</th>
                      <th className="px-4 py-3 text-left font-semibold">城市</th>
                      <th className="px-4 py-3 text-right font-semibold">P25</th>
                      <th className="px-4 py-3 text-right font-semibold">P50</th>
                      <th className="px-4 py-3 text-right font-semibold">P75</th>
                      <th className="px-4 py-3 text-right font-semibold">P90</th>
                      <th className="px-4 py-3 text-left font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {salaryBenchmarks.map((sb) => (
                      <tr key={sb.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-700">{sb.industry}</td>
                        <td className="px-4 py-3 text-slate-700">{sb.function_type}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{sb.career_level}</td>
                        <td className="px-4 py-3 text-slate-700">{sb.location || '-'}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatWan(sb.p25)}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatWan(sb.p50)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatWan(sb.p75)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatWan(sb.p90)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openSalaryDetail(sb)}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={creditModal} onClose={() => setCreditModal(false)} title={`调整信用 - ${creditTarget?.name || ''}`}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              信用分: {creditForm.credit_score}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={creditForm.credit_score}
              onChange={(e) => setCreditForm((f) => ({ ...f, credit_score: Number(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
          <SelectField
            label="信用等级"
            value={creditForm.credit_level}
            onChange={(v) => setCreditForm((f) => ({ ...f, credit_level: v }))}
            options={[
              { value: 'A', label: 'A' },
              { value: 'B+', label: 'B+' },
              { value: 'B', label: 'B' },
              { value: 'C', label: 'C' },
            ]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">调整原因</label>
            <textarea
              value={creditForm.reason}
              onChange={(e) => setCreditForm((f) => ({ ...f, reason: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="输入调整原因..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setCreditModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitCredit}
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '确认调整'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={datasetModal} onClose={() => setDatasetModal(false)} title="新增数据集">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">名称</label>
            <input
              type="text"
              value={datasetForm.name}
              onChange={(e) => setDatasetForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="数据集名称"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">描述</label>
            <textarea
              value={datasetForm.description}
              onChange={(e) => setDatasetForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="数据集描述..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">分类</label>
              <input
                type="text"
                value={datasetForm.category}
                onChange={(e) => setDatasetForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="分类标签"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">数据范围</label>
              <input
                type="text"
                value={datasetForm.data_scope}
                onChange={(e) => setDatasetForm((f) => ({ ...f, data_scope: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="数据范围"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">记录数</label>
              <input
                type="number"
                min={0}
                value={datasetForm.record_count}
                onChange={(e) => setDatasetForm((f) => ({ ...f, record_count: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">质量评分 (0-5)</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={datasetForm.quality_score}
                onChange={(e) => setDatasetForm((f) => ({ ...f, quality_score: Number(e.target.value) }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <SelectField
            label="状态"
            value={datasetForm.status}
            onChange={(v) => setDatasetForm((f) => ({ ...f, status: v }))}
            options={[
              { value: 'active', label: '活跃' },
              { value: 'inactive', label: '停用' },
              { value: 'archived', label: '归档' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setDatasetModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitDataset}
              disabled={submitting || !datasetForm.name}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '创建'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={salaryModal} onClose={() => setSalaryModal(false)} title="新增薪酬基准">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">行业</label>
              <input
                type="text"
                value={salaryForm.industry}
                onChange={(e) => setSalaryForm((f) => ({ ...f, industry: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="行业"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">职能</label>
              <input
                type="text"
                value={salaryForm.function_type}
                onChange={(e) => setSalaryForm((f) => ({ ...f, function_type: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="职能类型"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">职级</label>
              <input
                type="text"
                value={salaryForm.career_level}
                onChange={(e) => setSalaryForm((f) => ({ ...f, career_level: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="如 P6"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">城市</label>
              <input
                type="text"
                value={salaryForm.location}
                onChange={(e) => setSalaryForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="城市"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">P25 (元)</label>
              <input
                type="number"
                value={salaryForm.p25}
                onChange={(e) => setSalaryForm((f) => ({ ...f, p25: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">P50 (元)</label>
              <input
                type="number"
                value={salaryForm.p50}
                onChange={(e) => setSalaryForm((f) => ({ ...f, p50: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">P75 (元)</label>
              <input
                type="number"
                value={salaryForm.p75}
                onChange={(e) => setSalaryForm((f) => ({ ...f, p75: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">P90 (元)</label>
              <input
                type="number"
                value={salaryForm.p90}
                onChange={(e) => setSalaryForm((f) => ({ ...f, p90: e.target.value }))}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setSalaryModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">取消</button>
            <button
              onClick={submitSalary}
              disabled={submitting || !salaryForm.industry || !salaryForm.function_type || !salaryForm.career_level}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '创建'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={enterpriseDetailModal} onClose={() => setEnterpriseDetailModal(false)} title="企业信用评级详情">
        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !enterpriseDetail ? (
          <div className="text-center py-12 text-slate-400">暂无数据</div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <History size={14} />
                  信用历史
                </div>
                <div className="text-2xl font-bold text-slate-900">{enterpriseDetail.credit_history_score || '-'}</div>
                <div className="text-xs text-slate-400 mt-1">{enterpriseDetail.credit_history_desc || '历史信用评分平均值'}</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <CheckCircle2 size={14} />
                  履约记录
                </div>
                <div className="text-2xl font-bold text-slate-900">{enterpriseDetail.contract_fulfillment_score || '-'}</div>
                <div className="text-xs text-slate-400 mt-1">{enterpriseDetail.contract_fulfillment_desc || '合同履约完成率'}</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <Clock size={14} />
                  付款时效
                </div>
                <div className="text-2xl font-bold text-slate-900">{enterpriseDetail.payment_timeliness_score || '-'}</div>
                <div className="text-xs text-slate-400 mt-1">{enterpriseDetail.payment_timeliness_desc || '平均付款时效评分'}</div>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <Star size={14} />
                  合作评级
                </div>
                <div className="text-2xl font-bold text-slate-900">{enterpriseDetail.cooperation_rating || '-'}</div>
                <div className="text-xs text-slate-400 mt-1">{enterpriseDetail.cooperation_desc || '合作伙伴综合评价'}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <ArrowUpDown size={14} />
                信用变更记录
              </h4>
              <div className="space-y-3">
                {creditHistory.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">暂无变更记录</p>
                ) : (
                  creditHistory.map((record, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${record.score_change >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        {idx < creditHistory.length - 1 && <div className="w-px h-full bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{record.action_type || '信用调整'}</span>
                          <span className={`text-xs font-medium ${record.score_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {record.score_change >= 0 ? '+' : ''}{record.score_change} 分
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{record.reason || '-'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{record.created_at || '-'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={sandboxPreview} onClose={() => setSandboxPreview(false)} title="隐私脱敏沙箱预览">
        {loadingSandbox ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !sandboxData ? (
          <div className="text-center py-12 text-slate-400">暂无数据</div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <EyeIcon size={14} />
                脱敏前后数据对比
              </h4>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">字段</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">原始数据</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">脱敏后</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sandboxData.examples && sandboxData.examples.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium text-slate-900">{item.field}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-xs">{item.original}</td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-xs">{item.desensitized}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <FileText size={14} />
                脱敏规则说明
              </h4>
              <div className="space-y-2">
                {sandboxData.rules && sandboxData.rules.map((rule, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 text-sm">{rule.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${rule.enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                        {rule.enabled ? '已启用' : '已禁用'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <History size={14} />
                脱敏日志
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {desensitizationLogs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">暂无日志</p>
                ) : (
                  desensitizationLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="flex-1">
                        <span className="text-slate-700">{log.action}</span>
                        <span className="text-slate-400 ml-2">{log.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={datasetDetailModal} onClose={() => setDatasetDetailModal(false)} title="数据集详情">
        {loadingDatasetDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !datasetDetail ? (
          <div className="text-center py-12 text-slate-400">暂无数据</div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-slate-500 mb-1">
                  <Database size={14} />
                  样本量
                </div>
                <div className="text-xl font-bold text-slate-900">{(datasetDetail.sample_count || 0).toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-slate-500 mb-1">
                  <CheckCircle2 size={14} />
                  标注质量
                </div>
                <div className="text-xl font-bold text-slate-900">{datasetDetail.annotation_quality || '-'}%</div>
              </div>
              <div className="rounded-lg border border-border p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-slate-500 mb-1">
                  <Target size={14} />
                  准确率
                </div>
                <div className="text-xl font-bold text-slate-900">{datasetDetail.accuracy || '-'}%</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">基本信息</h4>
              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">数据集名称</span>
                  <span className="font-medium text-slate-900">{datasetDetail.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">分类</span>
                  <span className="text-slate-700">{datasetDetail.category || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">创建时间</span>
                  <span className="text-slate-700">{datasetDetail.created_at || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">数据范围</span>
                  <span className="text-slate-700">{datasetDetail.data_scope || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">训练状态</span>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    datasetDetail.training_status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    datasetDetail.training_status === 'training' ? 'bg-blue-50 text-blue-700' :
                    datasetDetail.training_status === 'failed' ? 'bg-red-50 text-red-700' :
                    'bg-slate-50 text-slate-500'
                  }`}>
                    {datasetDetail.training_status_label || datasetDetail.training_status || '未开始'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <History size={14} />
                版本历史
              </h4>
              <div className="space-y-2">
                {datasetDetail.versions && datasetDetail.versions.map((v, idx) => (
                  <div key={idx} className="rounded-lg border border-border p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 text-sm">v{v.version}</div>
                      <div className="text-xs text-slate-500">{v.description}</div>
                    </div>
                    <div className="text-xs text-slate-400">{v.created_at}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={salaryDetailModal} onClose={() => setSalaryDetailModal(false)} title="薪酬基准详情">
        {loadingSalaryDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !salaryDetail ? (
          <div className="text-center py-12 text-slate-400">暂无数据</div>
        ) : (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">P25</div>
                <div className="text-base font-bold text-slate-900">{formatWan(salaryDetail.p25)}</div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">P50</div>
                <div className="text-base font-bold text-slate-900">{formatWan(salaryDetail.p50)}</div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">P75</div>
                <div className="text-base font-bold text-slate-900">{formatWan(salaryDetail.p75)}</div>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <div className="text-xs text-slate-500 mb-1">P90</div>
                <div className="text-base font-bold text-slate-900">{formatWan(salaryDetail.p90)}</div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp size={14} />
                分位值走势图
              </h4>
              <div className="rounded-lg border border-border p-4 h-56">
                {salaryChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">暂无走势图数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salaryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} />
                      <Tooltip
                        formatter={(value) => [`${(value / 10000).toFixed(1)}万`, '']}
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line type="monotone" dataKey="p25" name="P25" stroke="#94a3b8" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="p50" name="P50" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="p75" name="P75" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="p90" name="P90" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <History size={14} />
                更新记录
              </h4>
              <div className="space-y-3">
                {salaryHistory.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">暂无更新记录</p>
                ) : (
                  salaryHistory.map((record, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {idx < salaryHistory.length - 1 && <div className="w-px h-full bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="font-medium text-slate-900">{record.action || '数据更新'}</div>
                        <p className="text-xs text-slate-500 mt-1">{record.description || '-'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{record.created_at || '-'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <RefreshCw size={14} />
                手动更新
              </h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">P25 (元)</label>
                  <input
                    type="number"
                    defaultValue={salaryDetail.p25 || ''}
                    className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    id="update-p25"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">P50 (元)</label>
                  <input
                    type="number"
                    defaultValue={salaryDetail.p50 || ''}
                    className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    id="update-p50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">P75 (元)</label>
                  <input
                    type="number"
                    defaultValue={salaryDetail.p75 || ''}
                    className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    id="update-p75"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">P90 (元)</label>
                  <input
                    type="number"
                    defaultValue={salaryDetail.p90 || ''}
                    className="w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                    id="update-p90"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => {
                    const data = {
                      p25: Number(document.getElementById('update-p25').value) || null,
                      p50: Number(document.getElementById('update-p50').value) || null,
                      p75: Number(document.getElementById('update-p75').value) || null,
                      p90: Number(document.getElementById('update-p90').value) || null,
                    }
                    updateSalaryBenchmark(salaryDetail.id, data)
                  }}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                >
                  确认更新
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
