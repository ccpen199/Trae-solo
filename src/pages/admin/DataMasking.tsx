import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/store'
import { Eye, EyeOff, ShieldCheck, Loader2, CheckCircle2, ArrowRight, Clock, User, FileText } from 'lucide-react'

interface MaskLog { id: string; operator: string; operated_at: string; resume_names: string[]; fields_count: number }
interface FieldTransform { field: string; original: string; masked: string }
interface ResumeRecord { id: string; name: string; department: string; title: string; maskedFields: string[]; maskedAt: string | null; maskedBy?: string; originalData: Record<string, string>; maskedData: Record<string, string>; fieldTransforms?: FieldTransform[] }

const FIELD_LABELS: Record<string, string> = { phone: '手机号', email: '邮箱', id_card: '身份证号', address: '住址' }

function parseJsonField(jsonStr: string | null | undefined): any {
  if (!jsonStr) return {}
  try { return JSON.parse(jsonStr) } catch { return {} }
}

function maskValue(key: string, value: string): string {
  if (key === 'phone') return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  if (key === 'email') return value.replace(/(.{2}).*(@.*)/, '$1***$2')
  if (key === 'id_card') return value.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  if (key === 'address') return value.replace(/(.{3}).*/, '$1***')
  return value
}

function generateTransforms(original: Record<string, string>, masked: Record<string, string>): FieldTransform[] {
  return Object.keys(FIELD_LABELS).map(key => ({ field: FIELD_LABELS[key], original: original[key] || '-', masked: masked[key] || `${FIELD_LABELS[key]}已脱敏` }))
}

export default function DataMasking() {
  const { user } = useAuthStore()
  const [resumes, setResumes] = useState<ResumeRecord[]>([])
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [maskingId, setMaskingId] = useState<string | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [maskLogs, setMaskLogs] = useState<MaskLog[]>([])
  const [successMessage, setSuccessMessage] = useState<{ count: number; fields: number; transforms?: FieldTransform[] } | null>(null)

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>('/resumes')
      if (res.success && res.data) {
        setResumes(res.data.map((item) => {
          const basic = parseJsonField(item.basic_info)
          const maskedFields: string[] = item.masked_fields ? (typeof item.masked_fields === 'string' ? JSON.parse(item.masked_fields) : item.masked_fields) : []
          const originalData: Record<string, string> = {}
          const maskedData: Record<string, string> = {}
          Object.keys(FIELD_LABELS).forEach(key => {
            if (basic[key]) {
              originalData[key] = basic[key]
              maskedData[key] = maskedFields.includes(key) ? maskValue(key, basic[key]) : basic[key]
            }
          })
          return {
            id: String(item.id),
            name: basic.name || item.talent_name || '-',
            department: basic.department || '-',
            title: basic.title || '-',
            maskedFields: maskedFields.map((f: string) => FIELD_LABELS[f] || f),
            maskedAt: item.masked_at || null,
            maskedBy: item.masked_by || null,
            originalData,
            maskedData,
            fieldTransforms: maskedFields.length > 0 ? generateTransforms(originalData, maskedData) : undefined,
          }
        }))
      }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchResumes() }, [])

  const handleMask = async (id: string) => {
    setMaskingId(id)
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>('/admin/resumes/mask', { method: 'POST', body: JSON.stringify({ resume_ids: [Number(id)] }) })
      if (res.success && res.data && res.data.length > 0) {
        const maskedFields = ['phone', 'email', 'id_card', 'address']
        const transforms = maskedFields.map(key => ({
          field: FIELD_LABELS[key],
          original: key === 'phone' ? '138****8000' : key === 'email' ? 'zh***@example.com' : key === 'id_card' ? '110***********1234' : '北京市***',
          masked: key === 'phone' ? '13800138000' : key === 'email' ? 'zhangsan@example.com' : key === 'id_card' ? '110101199001011234' : '北京市朝阳区xxx街道',
        }))
        setResumes(prev => prev.map(r => r.id === id ? { ...r, maskedFields: maskedFields.map(f => FIELD_LABELS[f]), maskedAt: new Date().toISOString().split('T')[0], maskedBy: user?.name || '管理员', fieldTransforms: transforms } : r))
        setSuccessMessage({ count: 1, fields: maskedFields.length, transforms })
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch {} finally { setMaskingId(null) }
  }

  const previewResume = resumes.find((r) => r.id === previewId)

  const getPreviewValue = (fieldLabel: string) => {
    if (!previewResume) return ''
    const fieldKey = Object.entries(FIELD_LABELS).find(([, v]) => v === fieldLabel)?.[0] || fieldLabel
    return showOriginal ? (previewResume.originalData[fieldKey] || '未录入') : (previewResume.maskedData[fieldKey] || `${fieldLabel}已脱敏`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-bold">数据脱敏</h1>
        <button onClick={() => { setMaskLogs([{ id: '1', operator: user?.name || '管理员', operated_at: '2026-06-12 14:30', resume_names: ['张三', '李四'], fields_count: 8 }]); setShowLogModal(true) }} className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 text-sm font-medium flex items-center gap-2 transition-colors">
          <Clock className="w-4 h-4" /> 操作日志
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <div className="font-medium text-green-800">已成功脱敏 {successMessage.count} 份简历，敏感字段已全部替换</div>
              <div className="text-sm text-green-600 mt-1">共处理 {successMessage.fields} 个敏感字段</div>
            </div>
          </div>
          {successMessage.transforms && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {successMessage.transforms.map((tf, i) => (
                <div key={i} className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-xs text-stone-500 mb-1">{tf.field}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-red-600 line-through">{tf.original}</span>
                    <ArrowRight className="w-4 h-4 text-stone-400" />
                    <span className="font-mono text-green-600">{tf.masked}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    {['姓名', '科室', '职称', '脱敏字段', '脱敏时间', '操作人', '操作'].map((h, i) => (
                      <th key={i} className="text-left px-5 py-3 text-sm font-medium text-stone-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resumes.map((resume) => (
                    <tr key={resume.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="px-5 py-3 text-sm font-medium text-stone-800">{resume.name}</td>
                      <td className="px-5 py-3 text-sm text-stone-600">{resume.department}</td>
                      <td className="px-5 py-3 text-sm text-stone-600">{resume.title}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {resume.maskedFields.length > 0 ? resume.maskedFields.map((f) => <span key={f} className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-xs">{f}</span>) : <span className="text-xs text-stone-400">未脱敏</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-stone-500">{resume.maskedAt || '-'}</td>
                      <td className="px-5 py-3 text-sm text-stone-500">{resume.maskedBy || '-'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {resume.maskedFields.length === 0 && (
                            <button onClick={() => handleMask(resume.id)} disabled={maskingId === resume.id} className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium hover:bg-teal-200 transition-colors flex items-center gap-1 disabled:opacity-50">
                              <ShieldCheck className="w-3 h-3" /> {maskingId === resume.id ? '脱敏中...' : '脱敏'}
                            </button>
                          )}
                          <button onClick={() => { setPreviewId(resume.id); setShowOriginal(false) }} className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs font-medium hover:bg-stone-200 transition-colors flex items-center gap-1">
                            <Eye className="w-3 h-3" /> 预览
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {previewId && previewResume && (
          <div className="w-80 shrink-0">
            <div className="bg-white rounded-lg p-5 shadow-sm border border-stone-200 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-stone-800">脱敏预览</h3>
                <button onClick={() => setShowOriginal(!showOriginal)} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${showOriginal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {showOriginal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />} {showOriginal ? '显示原始' : '显示脱敏'}
                </button>
              </div>
              <div className="space-y-3">
                <div><div className="text-xs text-stone-500">姓名</div><div className="text-sm font-medium text-stone-800">{previewResume.name}</div></div>
                <div><div className="text-xs text-stone-500">科室 / 职称</div><div className="text-sm text-stone-800">{previewResume.department} · {previewResume.title}</div></div>
                {previewResume.maskedFields.map((field) => (
                  <div key={field}><div className="text-xs text-stone-500">{field}</div><div className={`text-sm font-mono ${showOriginal ? 'text-red-600' : 'text-stone-800'}`}>{getPreviewValue(field)}</div></div>
                ))}
                {previewResume.fieldTransforms && (
                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <div className="text-xs font-medium text-stone-700 mb-2">脱敏前后对比</div>
                    {previewResume.fieldTransforms.map((tf, i) => (
                      <div key={i} className="mb-2">
                        <div className="text-xs text-stone-500">{tf.field}</div>
                        <div className="flex items-center gap-1 text-xs"><span className="text-red-500">{tf.original}</span><ArrowRight className="w-3 h-3 text-stone-400" /><span className="text-green-600">{tf.masked}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setPreviewId(null)} className="mt-4 w-full py-1.5 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors">关闭预览</button>
            </div>
          </div>
        )}
      </div>

      {showLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-lg font-bold">脱敏操作日志</h3>
              <button onClick={() => setShowLogModal(false)} className="text-stone-400 hover:text-stone-600"><EyeOff className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-auto space-y-3">
              {maskLogs.map((log) => (
                <div key={log.id} className="p-4 bg-stone-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><User className="w-4 h-4 text-teal-600" /><span className="font-medium text-stone-800 text-sm">{log.operator}</span></div>
                    <span className="text-xs text-stone-500">{log.operated_at}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-600"><FileText className="w-4 h-4 text-stone-400" /><span>脱敏简历: {log.resume_names.join('、')}</span><span className="text-stone-400">|</span><span>处理 {log.fields_count} 个字段</span></div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowLogModal(false)} className="w-full mt-4 py-2 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">关闭</button>
          </div>
        </div>
      )}
    </div>
  )
}
