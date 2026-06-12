import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { apiFetch } from '@/lib/api'
import { Stethoscope, Building2, Phone, Lock, User, CreditCard, ChevronDown, ArrowLeft, Upload, X, Loader2, Clock, Mail, CheckCircle2 } from 'lucide-react'

const practiceCategories = ['临床', '口腔', '公共卫生', '中医', '药学', '护理']
const departments = ['内科', '外科', '儿科', '妇产科', '急诊科', '药学', '影像科', '检验科']
const titles = ['主任医师', '副主任医师', '主治医师', '住院医师']
const institutionTypes = ['三甲医院', '三乙医院', '二甲医院', '社区医院', '民营医院', '诊所']

export default function Register() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<'talent' | 'institution'>('talent')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [statusCheckPhone, setStatusCheckPhone] = useState('')
  const [statusCheckRole, setStatusCheckRole] = useState<'talent' | 'institution'>('talent')
  const [statusResult, setStatusResult] = useState<any>(null)
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certPreview, setCertPreview] = useState('')
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [licensePreview, setLicensePreview] = useState('')
  const certInputRef = useRef<HTMLInputElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const [talentForm, setTalentForm] = useState({
    name: '', phone: '', password: '', practiceCategory: '', department: '', title: '',
  })
  const [institutionForm, setInstitutionForm] = useState({
    institutionName: '', phone: '', password: '', institutionType: '', creditCode: '',
  })

  useEffect(() => {
    const roleParam = searchParams.get('role')
    if (roleParam === 'talent' || roleParam === 'institution') {
      setRole(roleParam)
      setStep(2)
    }
  }, [searchParams])

  const handleCertSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCertFile(file)
      setCertPreview(URL.createObjectURL(file))
    }
  }

  const handleLicenseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLicenseFile(file)
      setLicensePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = role === 'talent' ? { ...talentForm, role } : { ...institutionForm, role }
      const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      login(data.user, data.token)
      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await apiFetch(`/auth/status?phone=${statusCheckPhone}&role=${statusCheckRole}`)
      setStatusResult(data.data || { status: 'pending', message: '审核中' })
    } catch {
      setStatusResult({ status: 'not_found', message: '未找到申请记录' })
    } finally {
      setLoading(false)
    }
  }

  const updateTalent = (field: string, value: string) =>
    setTalentForm((f) => ({ ...f, [field]: value }))
  const updateInstitution = (field: string, value: string) =>
    setInstitutionForm((f) => ({ ...f, [field]: value }))

  const showStatusCheck = searchParams.get('status') === 'check'

  if (showStatusCheck) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-heading text-2xl font-bold">审核进度查询</h1>
            <p className="text-stone-500 mt-2">输入您的手机号查询审核状态</p>
          </div>
          <form onSubmit={handleStatusCheck} className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">查询角色</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStatusCheckRole('talent')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${statusCheckRole === 'talent' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}>
                  医疗人才
                </button>
                <button type="button" onClick={() => setStatusCheckRole('institution')} className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${statusCheckRole === 'institution' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}>
                  医疗机构
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-stone-700 mb-1">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
                <input type="tel" value={statusCheckPhone} onChange={(e) => setStatusCheckPhone(e.target.value)} placeholder="请输入注册时的手机号" className="w-full h-11 pl-10 pr-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <button type="submit" disabled={loading || !statusCheckPhone} className="w-full h-11 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? '查询中...' : '查询状态'}
            </button>
            {statusResult && (
              <div className="mt-4 p-4 bg-stone-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {statusResult.status === 'approved' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-amber-500" />}
                  <span className="font-medium text-stone-800">
                    {statusResult.status === 'approved' ? '审核通过' : statusResult.status === 'rejected' ? '审核未通过' : statusResult.status === 'pending' ? '审核中' : '未找到'}
                  </span>
                </div>
                <p className="text-sm text-stone-600">{statusResult.message || '请耐心等待审核'}</p>
              </div>
            )}
            <button type="button" onClick={() => setSearchParams({})} className="w-full mt-4 text-sm text-teal-700 hover:text-teal-800 font-medium">
              返回注册
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-teal-700" />
              </div>
              <h2 className="font-heading text-xl font-bold mb-2">注册提交成功</h2>
              <p className="text-stone-500 text-sm">您的资料已提交审核，请耐心等待</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="font-heading font-bold text-amber-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> 审核状态追踪
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                  </div>
                  <div>
                    <div className="font-medium text-stone-800 text-sm">当前状态</div>
                    <div className="text-amber-600 text-sm font-medium">待审核</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-stone-400" />
                  </div>
                  <div>
                    <div className="font-medium text-stone-800 text-sm">预计时间</div>
                    <div className="text-stone-500 text-sm">1-3个工作日</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-stone-400" />
                  </div>
                  <div>
                    <div className="font-medium text-stone-800 text-sm">支持联系</div>
                    <div className="text-stone-500 text-sm">客服电话: 400-888-8888</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <button onClick={() => navigate('/')} className="w-full h-11 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 transition-colors">
                返回首页
              </button>
              <button onClick={() => setSearchParams({ status: 'check' })} className="w-full h-11 border border-stone-300 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" /> 查看审核进度
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const SelectField = ({ label, value, onChange, options, icon: Icon }: {
    label: string; value: string; onChange: (v: string) => void; options: string[]; icon?: any
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-1">{label} <span className="text-red-500">*</span></label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />}
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-11 pl-10 pr-10 border border-stone-300 rounded-lg appearance-none focus:ring-2 focus:ring-teal-500">
          <option value="">请选择</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
      </div>
    </div>
  )

  const InputField = ({ label, value, onChange, placeholder, icon: Icon, type = 'text', required = true }: {
    label: string; value: string; onChange: (v: string) => void; placeholder: string; icon: any; type?: string; required?: boolean
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-1">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-3.5 w-4 h-4 text-stone-400" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-11 pl-10 pr-4 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
      </div>
    </div>
  )

  const FileUploadField = ({ label, file, preview, onSelect, onClear, inputRef }: {
    label: string; file: File | null; preview: string; onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void; inputRef: React.RefObject<HTMLInputElement>
  }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-stone-700 mb-1">{label} <span className="text-red-500">*</span></label>
      {preview ? (
        <div className="relative border border-stone-300 rounded-lg overflow-hidden">
          <img src={preview} alt="preview" className="w-full h-32 object-cover" />
          <button type="button" onClick={onClear} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">
            <X className="w-3 h-3" />
          </button>
          <p className="p-2 text-xs text-stone-500 bg-stone-50">{file?.name}</p>
        </div>
      ) : (
        <div onClick={() => inputRef.current?.click()} className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/30 transition-colors">
          <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-stone-700">点击上传{label}</p>
          <p className="text-xs text-stone-500 mt-1">支持 JPG, PNG, PDF 格式</p>
        </div>
      )}
      <input ref={inputRef} type="file" onChange={onSelect} accept="image/*,.pdf" className="hidden" />
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <h1 className="font-heading text-2xl font-bold">选择注册角色</h1>
              <p className="text-stone-500 mt-2">请选择您的身份类型</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setRole('talent'); setStep(2) }} className="bg-white border-2 border-stone-200 rounded-xl p-8 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-center group">
                <Stethoscope className="w-12 h-12 text-teal-700 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-medium text-lg">医疗人才</div>
                <div className="text-sm text-stone-500 mt-1">寻找理想职位</div>
              </button>
              <button onClick={() => { setRole('institution'); setStep(2) }} className="bg-white border-2 border-stone-200 rounded-xl p-8 hover:border-teal-500 hover:bg-teal-50/50 transition-all text-center group">
                <Building2 className="w-12 h-12 text-teal-700 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="font-medium text-lg">医疗机构</div>
                <div className="text-sm text-stone-500 mt-1">发布招聘需求</div>
              </button>
            </div>
            <p className="text-center text-sm text-stone-500 mt-6">
              已有账号？<Link to="/login" className="text-teal-700 hover:text-teal-800 font-medium">立即登录</Link>
            </p>
            <p className="text-center text-sm text-stone-500 mt-2">
              <button onClick={() => setSearchParams({ status: 'check' })} className="text-teal-700 hover:text-teal-800 font-medium">查看审核进度</button>
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-stone-200">
            <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4" /> 返回角色选择
            </button>
            <h2 className="font-heading text-xl font-bold mb-4">
              {role === 'talent' ? '医疗人才注册' : '医疗机构注册'}
            </h2>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

            {role === 'talent' ? (
              <>
                <InputField label="姓名" value={talentForm.name} onChange={(v) => updateTalent('name', v)} placeholder="请输入姓名" icon={User} />
                <InputField label="手机号" value={talentForm.phone} onChange={(v) => updateTalent('phone', v)} placeholder="请输入手机号" icon={Phone} type="tel" />
                <InputField label="密码" value={talentForm.password} onChange={(v) => updateTalent('password', v)} placeholder="请输入密码" icon={Lock} type="password" />
                <SelectField label="执业类别" value={talentForm.practiceCategory} onChange={(v) => updateTalent('practiceCategory', v)} options={practiceCategories} icon={CreditCard} />
                <SelectField label="科室" value={talentForm.department} onChange={(v) => updateTalent('department', v)} options={departments} />
                <SelectField label="职称" value={talentForm.title} onChange={(v) => updateTalent('title', v)} options={titles} />
                <FileUploadField label="资质证书" file={certFile} preview={certPreview} onSelect={handleCertSelect} onClear={() => { setCertFile(null); setCertPreview('') }} inputRef={certInputRef} />
              </>
            ) : (
              <>
                <InputField label="机构名称" value={institutionForm.institutionName} onChange={(v) => updateInstitution('institutionName', v)} placeholder="请输入机构名称" icon={Building2} />
                <InputField label="手机号" value={institutionForm.phone} onChange={(v) => updateInstitution('phone', v)} placeholder="请输入手机号" icon={Phone} type="tel" />
                <InputField label="密码" value={institutionForm.password} onChange={(v) => updateInstitution('password', v)} placeholder="请输入密码" icon={Lock} type="password" />
                <SelectField label="机构类型" value={institutionForm.institutionType} onChange={(v) => updateInstitution('institutionType', v)} options={institutionTypes} icon={Building2} />
                <InputField label="统一社会信用代码" value={institutionForm.creditCode} onChange={(v) => updateInstitution('creditCode', v)} placeholder="请输入信用代码" icon={CreditCard} />
                <FileUploadField label="医疗机构执业许可证" file={licenseFile} preview={licensePreview} onSelect={handleLicenseSelect} onClear={() => { setLicenseFile(null); setLicensePreview('') }} inputRef={licenseInputRef} />
              </>
            )}

            <button type="submit" disabled={loading} className="w-full h-11 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors mt-2 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? '提交中...' : '提交注册'}
            </button>
            <p className="text-center text-sm text-stone-500 mt-4">
              已有账号？<Link to="/login" className="text-teal-700 hover:text-teal-800 font-medium">立即登录</Link>
            </p>
            <p className="text-center text-sm text-stone-500 mt-2">
              <button type="button" onClick={() => setSearchParams({ status: 'check' })} className="text-teal-700 hover:text-teal-800 font-medium">查看审核进度</button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
