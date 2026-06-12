import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react'

interface ResumeRecord {
  id: string
  name: string
  department: string
  title: string
  maskedFields: string[]
  maskedAt: string | null
  originalData: Record<string, string>
  maskedData: Record<string, string>
}

const FIELD_LABELS: Record<string, string> = {
  phone: '手机号',
  email: '邮箱',
  id_card: '身份证号',
  address: '住址',
}

function parseJsonField(jsonStr: string | null | undefined): any {
  if (!jsonStr) return {}
  try {
    return JSON.parse(jsonStr)
  } catch {
    return {}
  }
}

export default function DataMasking() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([])
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [maskingId, setMaskingId] = useState<string | null>(null)

  const fetchResumes = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>('/resumes')
      if (res.success && res.data) {
        setResumes(
          res.data.map((item) => {
            const basic = parseJsonField(item.basic_info)
            const maskedFields: string[] = item.masked_fields
              ? (typeof item.masked_fields === 'string' ? JSON.parse(item.masked_fields) : item.masked_fields)
              : []
            const originalData: Record<string, string> = {}
            if (basic.phone) originalData.phone = basic.phone
            if (basic.email) originalData.email = basic.email
            if (basic.id_card) originalData.id_card = basic.id_card
            if (basic.address) originalData.address = basic.address
            return {
              id: String(item.id),
              name: basic.name || item.talent_name || '-',
              department: basic.department || '-',
              title: basic.title || '-',
              maskedFields: maskedFields.map((f: string) => FIELD_LABELS[f] || f),
              maskedAt: item.masked_at || null,
              originalData,
              maskedData: {},
            }
          })
        )
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  const handleMask = async (id: string) => {
    setMaskingId(id)
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>('/admin/resumes/mask', {
        method: 'POST',
        body: JSON.stringify({ resume_ids: [Number(id)] }),
      })
      if (res.success && res.data && res.data.length > 0) {
        const masked = res.data[0]
        const basic = parseJsonField(masked.basic_info)
        const maskedFields = masked.masked_fields
          ? (typeof masked.masked_fields === 'string' ? JSON.parse(masked.masked_fields) : masked.masked_fields)
          : []
        const maskedData: Record<string, string> = {}
        if (basic.phone) maskedData.phone = basic.phone
        if (basic.email) maskedData.email = basic.email
        if (basic.id_card) maskedData.id_card = basic.id_card
        if (basic.address) maskedData.address = basic.address
        setResumes((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  maskedFields: maskedFields.map((f: string) => FIELD_LABELS[f] || f),
                  maskedAt: new Date().toISOString().split('T')[0],
                  maskedData,
                }
              : r
          )
        )
      }
    } catch {
    } finally {
      setMaskingId(null)
    }
  }

  const previewResume = resumes.find((r) => r.id === previewId)

  const getPreviewValue = (fieldLabel: string) => {
    if (!previewResume) return ''
    const fieldKey = Object.entries(FIELD_LABELS).find(([, v]) => v === fieldLabel)?.[0] || fieldLabel
    if (showOriginal) {
      return previewResume.originalData[fieldKey] || '未录入'
    }
    return previewResume.maskedData[fieldKey] || `${fieldLabel}已脱敏`
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">数据脱敏</h1>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50">
                    <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">姓名</th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">科室</th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">职称</th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">脱敏字段</th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">脱敏时间</th>
                    <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">操作</th>
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
                          {resume.maskedFields.length > 0 ? (
                            resume.maskedFields.map((f) => (
                              <span key={f} className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-xs">{f}</span>
                            ))
                          ) : (
                            <span className="text-xs text-stone-400">未脱敏</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-stone-500">{resume.maskedAt || '-'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          {resume.maskedFields.length === 0 && (
                            <button
                              onClick={() => handleMask(resume.id)}
                              disabled={maskingId === resume.id}
                              className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium hover:bg-teal-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
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
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    showOriginal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {showOriginal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showOriginal ? '显示原始' : '显示脱敏'}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-stone-500">姓名</div>
                  <div className="text-sm font-medium text-stone-800">{previewResume.name}</div>
                </div>
                <div>
                  <div className="text-xs text-stone-500">科室 / 职称</div>
                  <div className="text-sm text-stone-800">{previewResume.department} · {previewResume.title}</div>
                </div>
                {previewResume.maskedFields.length > 0 && (
                  previewResume.maskedFields.map((field) => (
                    <div key={field}>
                      <div className="text-xs text-stone-500">{field}</div>
                      <div className={`text-sm font-mono ${showOriginal ? 'text-red-600' : 'text-stone-800'}`}>
                        {getPreviewValue(field)}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button onClick={() => setPreviewId(null)} className="mt-4 w-full py-1.5 border border-stone-300 rounded-lg text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                关闭预览
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
