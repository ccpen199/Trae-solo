import React, { useRef, useState, useEffect } from 'react'
import { FileUp, X, Loader2, CheckCircle2, GraduationCap, Briefcase, Award } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToastStore } from '@/store'
import { useNavigate } from 'react-router-dom'

interface ParseResult { education?: any[]; work?: any[]; certifications?: any[]; basic?: any }
interface ParseModalProps { open: boolean; onClose: () => void; resumeId?: string; onSuccess?: () => void }

export default function ParseModal({ open, onClose, resumeId, onSuccess }: ParseModalProps) {
  const navigate = useNavigate()
  const { toast } = useToastStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [parsing, setParsing] = useState(false)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)

  useEffect(() => { if (open) { setParsing(false); setParseResult(null) } }, [open])

  if (!open) return null

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
        if (resumeId) await apiFetch(`/resumes/${resumeId}`, { method: 'PUT', body: JSON.stringify({ basic_info: res.data.basic, education: res.data.education, work: res.data.work, certifications: res.data.certifications, parsed: true }) })
        if (onSuccess) onSuccess()
      }
    } catch (err: any) { toast('error', err.message || '解析失败') } finally { setParsing(false) }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold">智能简历解析</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
        </div>
        {!parseResult ? (
          <div className="border-2 border-dashed border-stone-300 rounded-lg p-10 text-center hover:border-teal-400 transition-colors cursor-pointer" onClick={() => !parsing && fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
            {parsing ? <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto mb-3" /> : <FileUp className="w-12 h-12 text-stone-400 mx-auto mb-3" />}
            <div className="text-lg font-medium text-stone-800 mb-1">{parsing ? '正在解析...' : '点击或拖拽上传简历'}</div>
            <div className="text-sm text-stone-500">支持 PDF、Word 格式，不超过 10MB</div>
          </div>
        ) : (
          <div>
            <div className="p-4 bg-green-50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="font-medium text-green-800">解析成功</span></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white p-3 rounded border border-green-100 text-center"><GraduationCap className="w-5 h-5 text-teal-600 mx-auto mb-1" /><div className="text-xl font-bold text-stone-800">{parseResult.education?.length || 0}</div><div className="text-xs text-stone-500">教育经历</div></div>
                <div className="bg-white p-3 rounded border border-green-100 text-center"><Briefcase className="w-5 h-5 text-teal-600 mx-auto mb-1" /><div className="text-xl font-bold text-stone-800">{parseResult.work?.length || 0}</div><div className="text-xs text-stone-500">工作经历</div></div>
                <div className="bg-white p-3 rounded border border-green-100 text-center"><Award className="w-5 h-5 text-amber-500 mx-auto mb-1" /><div className="text-xl font-bold text-stone-800">{parseResult.certifications?.length || 0}</div><div className="text-xs text-stone-500">执业资质</div></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">关闭</button>
              <button onClick={() => { onClose(); navigate('/resume') }} className="flex-1 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors">前往完善</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
