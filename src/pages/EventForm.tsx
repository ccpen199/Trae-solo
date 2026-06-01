import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import Card from "@/components/Card"
import { createEvent, getVessels } from "@/api"
import type { Vessel } from "@/types"
import { useAppStore } from "@/store/app"

const eventTypes = ["越界", "失联", "恶劣天气", "证书过期", "违规作业"]

export default function EventForm() {
  const navigate = useNavigate()
  const { currentRole } = useAppStore()
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [form, setForm] = useState({
    vessel_id: "",
    event_type: "",
    title: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getVessels().then(res => { if (res.success && res.data) setVessels(res.data.list) })
  }, [])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.vessel_id) errs.vessel_id = "请选择渔船"
    if (!form.event_type) errs.event_type = "请选择事件类型"
    if (!form.title.trim()) errs.title = "请输入事件标题"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await createEvent({
        ...form,
        vessel_id: Number(form.vessel_id),
        created_by: currentRole,
      })
      navigate("/events")
    } catch (err) {
      alert(err instanceof Error ? err.message : "创建失败")
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors[field] ? "border-red-300" : "border-slate-200"}`

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/events")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </button>

      <Card title="上报事件">
        <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">渔船 *</label>
              <select value={form.vessel_id} onChange={e => update("vessel_id", e.target.value)} className={inputCls("vessel_id")}>
                <option value="">请选择渔船</option>
                {vessels.map(v => <option key={v.id} value={v.id}>{v.name} ({v.code})</option>)}
              </select>
              {errors.vessel_id && <p className="text-xs text-red-500 mt-1">{errors.vessel_id}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">事件类型 *</label>
              <select value={form.event_type} onChange={e => update("event_type", e.target.value)} className={inputCls("event_type")}>
                <option value="">请选择</option>
                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.event_type && <p className="text-xs text-red-500 mt-1">{errors.event_type}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">事件标题 *</label>
            <input value={form.title} onChange={e => update("title", e.target.value)} className={inputCls("title")} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">事件描述</label>
            <textarea
              value={form.description}
              onChange={e => update("description", e.target.value)}
              rows={4}
              className={inputCls("description")}
              placeholder="详细描述事件情况..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">上报人</label>
            <input value={currentRole} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors">
              {submitting ? "提交中..." : "提交"}
            </button>
            <button type="button" onClick={() => navigate("/events")} className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              取消
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
