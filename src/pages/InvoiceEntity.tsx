import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Plus,
  CreditCard,
  MapPin,
  Phone,
  FileText,
  Hash,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
  Building,
  Landmark,
  Copy,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import { requestRaw } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'

interface InvoiceEntityItem {
  id: string
  shipper_id: string
  company_name: string
  tax_no: string
  address: string
  phone: string
  bank_name: string
  bank_account: string
  created_at: string
}

interface FormData {
  company_name: string
  tax_no: string
  address: string
  phone: string
  bank_name: string
  bank_account: string
}

const initialForm: FormData = {
  company_name: '',
  tax_no: '',
  address: '',
  phone: '',
  bank_name: '',
  bank_account: '',
}

export default function InvoiceEntity() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isShipper = user?.role === 'shipper'

  const [entities, setEntities] = useState<InvoiceEntityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(initialForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    loadEntities()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const loadEntities = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await requestRaw<{ success: boolean; list: InvoiceEntityItem[] }>(
        '/api/invoices/invoice-entities',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      setEntities(res.list || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {}
    if (!form.company_name.trim()) {
      errors.company_name = '请输入公司名称'
    } else if (form.company_name.trim().length < 2) {
      errors.company_name = '公司名称至少2个字符'
    }
    if (!form.tax_no.trim()) {
      errors.tax_no = '请输入纳税人识别号'
    } else if (!/^[0-9A-Z]{15,20}$/.test(form.tax_no.trim())) {
      errors.tax_no = '税号格式不正确（15-20位数字或大写字母）'
    }
    if (form.phone && !/^[0-9-\s()]{7,20}$/.test(form.phone.trim())) {
      errors.phone = '电话号码格式不正确'
    }
    if (form.bank_account && !/^\d{10,30}$/.test(form.bank_account.trim())) {
      errors.bank_account = '银行账号应为10-30位数字'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const payload: Record<string, string> = {}
      Object.entries(form).forEach(([k, v]) => {
        const val = v.trim()
        if (val) payload[k] = val
      })
      await requestRaw<{ success: boolean; data: InvoiceEntityItem }>(
        '/api/invoices/invoice-entities',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )
      setToast({ type: 'success', message: '开票主体添加成功' })
      setForm(initialForm)
      setFormErrors({})
      setShowForm(false)
      await loadEntities()
    } catch (e: any) {
      setToast({ type: 'error', message: e.message || '添加失败' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast({ type: 'success', message: '已复制到剪贴板' })
    })
  }

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/invoices')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-500">开票主体管理</h1>
          <p className="text-sm text-gray-500">管理用于开具增值税专用发票的公司信息</p>
        </div>
      </div>

      {toast && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse ${
            toast.type === 'success'
              ? 'bg-mint-50 border border-mint-200 text-mint-700'
              : 'bg-coral-50 border border-coral-200 text-coral-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center">
              <Building className="h-5 w-5 text-navy-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">开票主体数量</p>
              <p className="text-2xl font-bold text-navy-500">{entities.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <FileText className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500">权限</p>
              <p className="text-lg font-bold text-amber-500">
                {isShipper ? '可新增主体' : '只读查看'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isShipper && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`w-full md:w-auto inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              showForm
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm'
            }`}
          >
            {showForm ? (
              <>
                <X className="h-4 w-4" />
                取消添加
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                新增开票主体
              </>
            )}
          </button>
        </div>
      )}

      {showForm && isShipper && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Plus className="h-4 w-4 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold text-navy-500">新增开票主体</h3>
            </div>
            <StatusBadge variant="warning">必填项带 *</StatusBadge>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Building2 className="h-4 w-4 inline mr-1 text-navy-400" />
                  公司名称 <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => updateField('company_name', e.target.value)}
                  placeholder="请输入完整的公司名称"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors ${
                    formErrors.company_name
                      ? 'border-coral-300 bg-coral-50'
                      : 'border-gray-300 focus:bg-white'
                  }`}
                />
                {formErrors.company_name && (
                  <p className="mt-1 text-xs text-coral-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.company_name}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Hash className="h-4 w-4 inline mr-1 text-navy-400" />
                  纳税人识别号（税号） <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.tax_no}
                  onChange={(e) => updateField('tax_no', e.target.value.toUpperCase())}
                  placeholder="15-20位数字或大写字母"
                  maxLength={20}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors uppercase ${
                    formErrors.tax_no
                      ? 'border-coral-300 bg-coral-50'
                      : 'border-gray-300 focus:bg-white'
                  }`}
                />
                {formErrors.tax_no && (
                  <p className="mt-1 text-xs text-coral-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.tax_no}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <MapPin className="h-4 w-4 inline mr-1 text-navy-400" />
                  公司地址
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="如：北京市朝阳区建国路88号"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Phone className="h-4 w-4 inline mr-1 text-navy-400" />
                  联系电话
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="如：010-88888888"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors ${
                    formErrors.phone
                      ? 'border-coral-300 bg-coral-50'
                      : 'border-gray-300 focus:bg-white'
                  }`}
                />
                {formErrors.phone && (
                  <p className="mt-1 text-xs text-coral-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Landmark className="h-4 w-4 inline mr-1 text-navy-400" />
                  开户银行
                </label>
                <input
                  type="text"
                  value={form.bank_name}
                  onChange={(e) => updateField('bank_name', e.target.value)}
                  placeholder="如：中国工商银行北京分行"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <CreditCard className="h-4 w-4 inline mr-1 text-navy-400" />
                  银行账号
                </label>
                <input
                  type="text"
                  value={form.bank_account}
                  onChange={(e) => updateField('bank_account', e.target.value.replace(/\D/g, ''))}
                  placeholder="纯数字账号"
                  maxLength={30}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors ${
                    formErrors.bank_account
                      ? 'border-coral-300 bg-coral-50'
                      : 'border-gray-300 focus:bg-white'
                  }`}
                />
                {formErrors.bank_account && (
                  <p className="mt-1 text-xs text-coral-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.bank_account}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(initialForm)
                  setFormErrors({})
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-navy-500 rounded-lg hover:bg-navy-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    提交中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    确认添加
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <div className="text-center py-8 text-gray-400">加载中...</div>}

      <div className="space-y-3">
        {!loading && entities.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">暂无开票主体</p>
            {isShipper && (
              <p className="text-sm text-gray-400 mb-4">点击上方按钮添加您的第一个开票主体</p>
            )}
            {isShipper && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                立即添加
              </button>
            )}
          </div>
        )}

        {entities.map((entity, idx) => (
          <div
            key={entity.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow border-l-4 border-l-navy-400"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-navy-50 to-navy-100 flex items-center justify-center flex-shrink-0 border border-navy-100">
                  <Building2 className="h-6 w-6 text-navy-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base font-bold text-navy-500 truncate">
                      {entity.company_name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-50 text-navy-600 font-medium">
                      主体 {idx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-400 flex-shrink-0">税号：</span>
                      <span className="font-mono text-gray-700 truncate flex-1">
                        {entity.tax_no}
                      </span>
                      <button
                        onClick={() => handleCopy(entity.tax_no)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-navy-500 transition-colors flex-shrink-0"
                        title="复制"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>

                    {entity.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-400 flex-shrink-0">地址：</span>
                        <span className="text-gray-700 break-words">{entity.address}</span>
                      </div>
                    )}

                    {entity.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-400 flex-shrink-0">电话：</span>
                        <span className="text-gray-700">{entity.phone}</span>
                      </div>
                    )}

                    {(entity.bank_name || entity.bank_account) && (
                      <div className="flex items-start gap-2 text-sm">
                        <Landmark className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-400 flex-shrink-0">银行：</span>
                        <span className="text-gray-700 break-words">
                          {entity.bank_name || '-'}
                          {entity.bank_account && (
                            <span className="font-mono ml-1">
                              {entity.bank_account}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge variant="success">已启用</StatusBadge>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </div>

            {entity.created_at && (
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>添加时间：{entity.created_at.split('T')[0]}</span>
                {entity.bank_name && entity.bank_account && (
                  <span className="flex items-center gap-1 text-mint-600">
                    <CheckCircle className="h-3 w-3" />
                    开票信息完整
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
