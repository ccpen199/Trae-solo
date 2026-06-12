import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuthStore, useToastStore } from '@/store'
import { FileUp, Loader2, CheckCircle2, Download, ShieldCheck, Eye, EyeOff, FileText, Award, GraduationCap, Briefcase, AlertCircle, X, Clock, Archive, FileCheck, ShieldAlert } from 'lucide-react'

interface ParseResult { education?: any[]; work?: any[]; certifications?: any[]; basic?: any }
interface PrivacySettings { phone: 'visible' | 'hidden' | 'masked'; email: 'visible' | 'hidden' | 'masked'; address: 'visible' | 'hidden' | 'masked'; id_card: 'visible' | 'hidden' | 'masked'; emergency_contact: 'visible' | 'hidden' | 'masked' }
interface ResumeData { id: string; basic_info?: any; education?: any[]; work?: any[]; certifications?: any[]; privacy_settings?: PrivacySettings; parsed?: boolean; parsed_at?: string; created_at?: string }

const PRIVACY_FIELDS = [
  { key: 'phone', label: '手机号', description: '联系电话' },
  { key: 'email', label: '邮箱', description: '电子邮箱' },
  { key: 'address', label: '住址', description: '居住地址' },
  { key: 'id_card', label: '身份证号', description: '身份证号码' },
  { key: 'emergency_contact', label: '紧急联系人', description: '紧急联系人信息' },
]

const PRIVACY_OPTIONS = [
  { value: 'visible', label: '可见', color: 'bg-green-100 text-green-700 border-green-200', icon: Eye },
  { value: 'masked', label: '脱敏', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: ShieldCheck },
  { value: 'hidden', label: '隐藏', color: 'bg-stone-100 text-stone-600 border-stone-200', icon: EyeOff },
]

const DEFAULT_PRIVACY: PrivacySettings = { phone: 'masked', email: 'masked', address: 'hidden', id_card: 'hidden', emergency_contact: 'hidden' }

function parseJsonField(jsonStr: string | null | undefined): any {
  if (!jsonStr) return {}
  try { return JSON.parse(jsonStr) } catch { return {} }
}

function getPrivacyFeedbackMessage(fieldLabel: string, newValue: 'visible' | 'hidden' | 'masked'): string {
  if (newValue === 'visible') return `${fieldLabel}将对招聘方完全可见`
  if (newValue === 'masked') return `${fieldLabel}将以脱敏形式展示给招聘方`
  return `${fieldLabel}将完全隐藏，招聘方无法查看`
}

function maskValue(value: string | undefined, type: string): string {
  if (!value || value === '-') return '-'
  if (type === 'phone') return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  if (type === 'email') { const [local, domain] = value.split('@'); return domain ? `${local.slice(0, 2)}***@${domain}` : `${local.slice(0, 2)}***` }
  if (type === 'id_card') return value.replace(/(.{4}).*(.{4})/, '$1**********$2')
  if (type === 'address') return value.length > 4 ? `${value.slice(0, 2)}***${value.slice(-2)}` : '***'
  if (type === 'emergency_contact') return value.length > 2 ? `${value.slice(0, 1)}***` : '***'
  return '***'
}

export default function Resume() {
  const { user } = useAuthStore()
  const { toast } = useToastStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [resume, setResume] = useState<ResumeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [parsing, setParsing] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [privacyFeedback, setPrivacyFeedback] = useState<Record<string, string>>({})
  const [privacySaveSuccess, setPrivacySaveSuccess] = useState(false)

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportResult, setExportResult] = useState<{ filename: string; size: number; url: string } | null>(null)

  const [showDesensPreview, setShowDesensPreview] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [archiving, setArchiving] = useState(false)

  const resumeStatus = !resume ? 'none' : resume.parsed ? 'parsed' : 'pending'

  const fetchResume = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>(`/resumes?talent_id=${user?.id}`)
      if (res.success && res.data && res.data.length > 0) {
        const item = res.data[0]
        const basic = parseJsonField(item.basic_info)
        const education = item.education ? (typeof item.education === 'string' ? JSON.parse(item.education) : item.education) : []
        const work = item.work ? (typeof item.work === 'string' ? JSON.parse(item.work) : item.work) : []
        const certifications = item.certifications ? (typeof item.certifications === 'string' ? JSON.parse(item.certifications) : item.certifications) : []
        const privacy_settings = item.privacy_settings ? (typeof item.privacy_settings === 'string' ? JSON.parse(item.privacy_settings) : item.privacy_settings) : DEFAULT_PRIVACY
        setResume({ id: String(item.id), basic_info: basic, education, work, certifications, privacy_settings, parsed: item.parsed, parsed_at: item.parsed_at, created_at: item.created_at })
        setPrivacy({ ...DEFAULT_PRIVACY, ...privacy_settings })
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { if (user?.id) fetchResume() }, [user?.id])

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setParsing(true)
    setParseResult(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await apiFetch<{ success: boolean; data: ParseResult }>('/resumes/parse', { method: 'POST', body: formData, headers: {} })
      if (res.success && res.data) {
        setParseResult(res.data)
        toast('success', `解析完成：已解析 ${res.data.education?.length || 0} 条教育经历, ${res.data.work?.length || 0} 条工作经历, ${res.data.certifications?.length || 0} 项执业资质`)
        if (resume?.id) {
          await apiFetch(`/resumes/${resume.id}`, { method: 'PUT', body: JSON.stringify({ basic_info: res.data.basic, education: res.data.education, work: res.data.work, certifications: res.data.certifications, parsed: true, parsed_at: new Date().toISOString() }) })
          fetchResume()
        }
      }
    } catch (err: any) { toast('error', err.message || '解析失败') } finally { setParsing(false) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePrivacyChange = (fieldKey: string, fieldValue: 'visible' | 'hidden' | 'masked', fieldLabel: string) => {
    setPrivacy(p => ({ ...p, [fieldKey]: fieldValue }))
    const msg = getPrivacyFeedbackMessage(fieldLabel, fieldValue)
    setPrivacyFeedback(prev => ({ ...prev, [fieldKey]: msg }))
    setPrivacySaveSuccess(false)
  }

  const savePrivacy = async () => {
    if (!resume?.id) return
    setSavingPrivacy(true)
    try {
      await apiFetch(`/resumes/${resume.id}`, { method: 'PUT', body: JSON.stringify({ privacy_settings: privacy }) })
      setPrivacySaveSuccess(true)
      setPrivacyFeedback({})
      fetchResume()
      setTimeout(() => setPrivacySaveSuccess(false), 4000)
    } catch (err: any) { toast('error', err.message || '保存失败') } finally { setSavingPrivacy(false) }
  }

  const startExport = () => {
    setShowExportModal(true)
    setExportResult(null)
    setExportProgress(0)
  }

  const confirmExport = async () => {
    if (!resume?.id) return
    setShowExportModal(false)
    setExportingPdf(true)
    setExportProgress(0)

    let current = 0
    progressTimerRef.current = setInterval(() => {
      current += Math.random() * 12
      if (current > 90) current = 90
      setExportProgress(Math.round(current))
    }, 200)

    try {
      const res = await apiFetch<{ success: boolean; data: { url: string; filename: string; size: number } }>(`/resumes/${resume.id}/export`)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      if (res.success && res.data) {
        setExportProgress(100)
        setTimeout(() => {
          setExportResult({ filename: res.data.filename, size: res.data.size, url: res.data.url })
          setExportingPdf(false)
        }, 400)
      }
    } catch (err: any) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setExportingPdf(false)
      setExportProgress(0)
      toast('error', err.message || '导出失败')
    }
  }

  const handleArchive = async () => {
    setShowArchiveConfirm(false)
    setArchiving(true)
    try {
      await apiFetch(`/resumes/${resume?.id}/archive`, { method: 'POST' })
      toast('success', '归档申请已提交，我们将在3个工作日内处理')
    } catch (err: any) { toast('error', err.message || '归档申请失败') } finally { setArchiving(false) }
  }

  const desensPreviewData = () => {
    if (!resume?.basic_info) return []
    return PRIVACY_FIELDS.map(f => {
      const rawValue = String(resume.basic_info?.[f.key] || '-')
      const setting = privacy[f.key as keyof PrivacySettings]
      let display = rawValue
      if (setting === 'hidden') display = '******'
      else if (setting === 'masked') display = maskValue(rawValue, f.key)
      return { key: f.key, label: f.label, raw: rawValue, display, setting }
    })
  }

  if (loading) return <div className="text-center text-stone-500 py-20"><Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />加载中...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold">我的简历</h1>
          <div className="flex items-center">
            {resumeStatus === 'none' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-stone-100 text-stone-500 border border-stone-200">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />未创建
              </span>
            )}
            {resumeStatus === 'pending' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />待解析
                <button onClick={() => fileInputRef.current?.click()} disabled={parsing} className="ml-1 underline hover:text-amber-800 disabled:opacity-50">
                  {parsing ? '解析中...' : '立即解析'}
                </button>
              </span>
            )}
            {resumeStatus === 'parsed' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />已解析
                {resume.parsed_at && (
                  <span className="text-green-600 ml-1">
                    <Clock className="w-3 h-3 inline -mt-0.5" />
                    {new Date(resume.parsed_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={parsing} className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition-colors">
            {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} {parsing ? '解析中...' : '智能解析'}
          </button>
          <button onClick={startExport} disabled={exportingPdf || !resume} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition-colors">
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} {exportingPdf ? '导出中...' : '导出PDF'}
          </button>
        </div>
      </div>

      {exportingPdf && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-800">正在生成PDF文件...</span>
            <span className="text-sm text-blue-600 font-mono">{exportProgress}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${exportProgress}%` }} />
          </div>
        </div>
      )}

      {exportResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-green-800 mb-1">PDF导出成功</div>
              <div className="flex items-center gap-3 text-sm text-green-700 mb-3">
                <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {exportResult.filename}</span>
                <span>{exportResult.size}KB</span>
              </div>
              <div className="flex gap-2">
                <a href={exportResult.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium transition-colors">
                  <Download className="w-3.5 h-3.5" /> 下载文件
                </a>
                <button onClick={() => setExportResult(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 text-xs font-medium transition-colors">
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowExportModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-800">确认导出PDF</h3>
              <button onClick={() => setShowExportModal(false)} className="p-1 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-5 h-5 text-stone-500" /></button>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-500">简历名称</span>
                <span className="text-stone-800 font-medium">{resume?.basic_info?.name || '我的简历'}_简历</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-500">预计大小</span>
                <span className="text-stone-800 font-medium">约 200-500 KB</span>
              </div>
              <div className="flex justify-between text-sm p-3 bg-stone-50 rounded-lg">
                <span className="text-stone-500">导出格式</span>
                <span className="text-stone-800 font-medium">PDF</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowExportModal(false)} className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm font-medium transition-colors">取消</button>
              <button onClick={confirmExport} className="flex-1 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> 确认导出
              </button>
            </div>
          </div>
        </div>
      )}

      {parseResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-green-800 mb-3">简历解析完成</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-1"><GraduationCap className="w-4 h-4 text-teal-600" /> 教育经历</div>
                  <div className="text-2xl font-bold text-stone-800">{parseResult.education?.length || 0} 条</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-1"><Briefcase className="w-4 h-4 text-teal-600" /> 工作经历</div>
                  <div className="text-2xl font-bold text-stone-800">{parseResult.work?.length || 0} 条</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-1"><Award className="w-4 h-4 text-amber-500" /> 执业资质</div>
                  <div className="text-2xl font-bold text-stone-800">{parseResult.certifications?.length || 0} 项</div>
                </div>
              </div>
              <button onClick={() => setParseResult(null)} className="mt-3 text-xs text-stone-500 hover:text-stone-700">收起详情</button>
            </div>
          </div>
        </div>
      )}

      {!resume ? (
        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-stone-200">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-stone-400" /></div>
          <h3 className="font-heading font-bold text-lg mb-2">暂无简历</h3>
          <p className="text-sm text-stone-500 mb-6">上传您的简历PDF，我们将智能解析内容，帮您快速完善求职档案</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => fileInputRef.current?.click()} disabled={parsing} className="px-6 py-2.5 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 text-sm font-medium flex items-center gap-2 transition-colors">
              {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} {parsing ? '解析中...' : '智能简历解析'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-teal-600" /> 基本信息</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  ['姓名', resume.basic_info?.name || '-'],
                  ['性别', resume.basic_info?.gender || '-'],
                  ['年龄', resume.basic_info?.age ? `${resume.basic_info.age}岁` : '-'],
                  ['手机号', resume.basic_info?.phone || '-'],
                  ['邮箱', resume.basic_info?.email || '-'],
                  ['学历', resume.basic_info?.education || '-'],
                ].map(([label, value]) => (
                  <div key={label}><span className="text-stone-500">{label}:</span> <span className="text-stone-800 font-medium">{value}</span></div>
                ))}
              </div>
            </div>

            {resume.education && resume.education.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-teal-600" /> 教育经历</h2>
                {resume.education.map((edu: any, i: number) => (
                  <div key={i} className={`${i > 0 ? 'border-t border-stone-100 pt-4 mt-4' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div><div className="font-medium text-stone-800">{edu.school}</div><div className="text-sm text-stone-500 mt-0.5">{edu.degree} · {edu.major}</div></div>
                      <div className="text-sm text-stone-500">{edu.period || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resume.work && resume.work.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-teal-600" /> 工作经历</h2>
                {resume.work.map((w: any, i: number) => (
                  <div key={i} className={`${i > 0 ? 'border-t border-stone-100 pt-4 mt-4' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <div><div className="font-medium text-stone-800">{w.institution} · {w.department} · {w.title}</div></div>
                      <div className="text-sm text-stone-500">{w.period || '-'}</div>
                    </div>
                    {w.description && <p className="text-sm text-stone-600 mt-1">{w.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {resume.certifications && resume.certifications.length > 0 && (
              <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> 执业资质</h2>
                <div className="space-y-2">
                  {resume.certifications.map((cert: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-stone-50 rounded"><span className="text-sm text-stone-800">{cert.name || cert}</span>{cert.date && <span className="text-xs text-stone-500">{cert.date}</span>}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-stone-200">
              <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-teal-600" /> 隐私设置</h2>
              <p className="text-sm text-stone-500 mb-4">设置您的敏感字段在求职展示中的可见范围</p>

              {privacySaveSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="text-sm text-green-700 font-medium">隐私设置已保存成功</span>
                </div>
              )}

              <div className="space-y-4">
                {PRIVACY_FIELDS.map(field => {
                  const feedback = privacyFeedback[field.key]
                  return (
                    <div key={field.key} className="p-3 bg-stone-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div><div className="text-sm font-medium text-stone-800">{field.label}</div><div className="text-xs text-stone-500">{field.description}</div></div>
                      </div>
                      <div className="flex gap-1">
                        {PRIVACY_OPTIONS.map(opt => {
                          const Icon = opt.icon
                          const active = privacy[field.key as keyof PrivacySettings] === opt.value
                          return (
                            <button key={opt.value} onClick={() => handlePrivacyChange(field.key, opt.value as 'visible' | 'hidden' | 'masked', field.label)} className={`flex-1 py-1.5 px-2 rounded border text-xs font-medium flex items-center justify-center gap-1 transition-colors ${active ? opt.color : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'}`}>
                              <Icon className="w-3 h-3" /> {opt.label}
                            </button>
                          )
                        })}
                      </div>
                      {feedback && (
                        <div className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {feedback}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <button onClick={savePrivacy} disabled={savingPrivacy} className="w-full mt-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {savingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {savingPrivacy ? '保存中...' : '保存设置'}
              </button>

              <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
                <button onClick={() => setShowDesensPreview(prev => !prev)} className="w-full py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  <Eye className="w-4 h-4" /> {showDesensPreview ? '收起脱敏预览' : '数据脱敏预览'}
                </button>

                {showDesensPreview && (
                  <div className="space-y-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
                    <div className="text-xs font-medium text-stone-500 mb-2 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" /> 脱敏效果预览</div>
                    {desensPreviewData().map(item => (
                      <div key={item.key} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-100 last:border-0">
                        <span className="text-stone-600">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 text-xs line-through">{item.raw}</span>
                          <span className="text-stone-800 font-medium font-mono">{item.display}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={() => setShowArchiveConfirm(true)} disabled={archiving} className="w-full py-2 border border-amber-300 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                  {archiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />} {archiving ? '提交中...' : '申请归档'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-amber-50 rounded-lg p-6 border border-teal-100">
              <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-5 h-5 text-teal-600" /><h3 className="font-heading font-bold text-stone-800">简历解析提示</h3></div>
              <p className="text-sm text-stone-600 mb-4">支持 PDF、Word 格式，系统将自动提取：</p>
              <ul className="text-sm text-stone-600 space-y-1">• 基本信息与联系方式<br />• 教育经历与学历<br />• 工作经历与职称<br />• 执业证书与资质</ul>
              <button onClick={() => fileInputRef.current?.click()} disabled={parsing} className="w-full mt-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} {parsing ? '解析中...' : '立即解析'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowArchiveConfirm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-800">确认申请归档</h3>
              <button onClick={() => setShowArchiveConfirm(false)} className="p-1 hover:bg-stone-100 rounded-lg transition-colors"><X className="w-5 h-5 text-stone-500" /></button>
            </div>
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">归档说明</p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• 归档后简历数据将进入只读状态</li>
                    <li>• 个人敏感信息将按当前隐私设置进行脱敏</li>
                    <li>• 归档申请提交后约3个工作日完成处理</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowArchiveConfirm(false)} className="flex-1 py-2.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm font-medium transition-colors">取消</button>
              <button onClick={handleArchive} className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Archive className="w-4 h-4" /> 确认归档
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
