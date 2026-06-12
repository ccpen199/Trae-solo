import React from 'react'
import { X, Loader2, CheckCircle2, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToastStore } from '@/store'

interface PrivacySettings { phone: 'visible' | 'hidden' | 'masked'; email: 'visible' | 'hidden' | 'masked'; address: 'visible' | 'hidden' | 'masked'; id_card: 'visible' | 'hidden' | 'masked'; emergency_contact: 'visible' | 'hidden' | 'masked' }
interface PrivacyModalProps { open: boolean; onClose: () => void; resumeId?: string; initialSettings?: PrivacySettings }

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

export default function PrivacyModal({ open, onClose, resumeId, initialSettings }: PrivacyModalProps) {
  const { toast } = useToastStore()
  const [privacy, setPrivacy] = React.useState<PrivacySettings>(DEFAULT_PRIVACY)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => { if (open) setPrivacy({ ...DEFAULT_PRIVACY, ...initialSettings }) }, [open, initialSettings])

  if (!open) return null

  const save = async () => {
    if (!resumeId) { toast('error', '请先创建简历'); return }
    setSaving(true)
    try {
      await apiFetch(`/resumes/${resumeId}`, { method: 'PUT', body: JSON.stringify({ privacy_settings: privacy }) })
      const hidden = Object.values(privacy).filter(v => v === 'hidden').length
      const masked = Object.values(privacy).filter(v => v === 'masked').length
      const visible = Object.values(privacy).filter(v => v === 'visible').length
      toast('success', `隐私设置已保存：${hidden} 个字段隐藏, ${masked} 个字段脱敏, ${visible} 个字段可见`)
      setTimeout(onClose, 500)
    } catch (err: any) { toast('error', err.message || '保存失败') } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold">隐私字段授权</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-stone-500 mb-4">设置您的敏感字段在求职展示中的可见范围</p>
        <div className="space-y-3">
          {PRIVACY_FIELDS.map(field => (
            <div key={field.key} className="p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div><div className="text-sm font-medium text-stone-800">{field.label}</div><div className="text-xs text-stone-500">{field.description}</div></div>
              </div>
              <div className="flex gap-1">
                {PRIVACY_OPTIONS.map(opt => {
                  const Icon = opt.icon
                  const active = privacy[field.key as keyof PrivacySettings] === opt.value
                  return (
                    <button key={opt.value} onClick={() => setPrivacy(p => ({ ...p, [field.key]: opt.value }))} className={`flex-1 py-1.5 px-2 rounded border text-xs font-medium flex items-center justify-center gap-1 transition-colors ${active ? opt.color : 'bg-white border-stone-200 text-stone-400 hover:border-stone-300'}`}>
                      <Icon className="w-3 h-3" /> {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">取消</button>
          <button onClick={save} disabled={saving} className="flex-1 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 disabled:opacity-50 flex items-center justify-center gap-1 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
