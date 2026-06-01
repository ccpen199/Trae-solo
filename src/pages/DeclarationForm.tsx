import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import Card from "@/components/Card"
import { createDeclaration, getVessels, getSeaAreas } from "@/api"
import type { Vessel, SeaArea, DeclarationCrew } from "@/types"
import { useAppStore } from "@/store/app"

export default function DeclarationForm() {
  const navigate = useNavigate()
  const { currentOwnerName, getRoleConfig } = useAppStore()
  const roleConfig = getRoleConfig()
  const [vessels, setVessels] = useState<Vessel[]>([])
  const [seaAreas, setSeaAreas] = useState<SeaArea[]>([])
  const [form, setForm] = useState({
    vessel_id: "",
    sea_area: "",
    departure_time: "",
    expected_return: "",
    work_permit: "",
    work_permit_status: "有效",
    insurance_status: "已投保",
  })
  const [crews, setCrews] = useState<DeclarationCrew[]>([{ name: "", id_number: "", role: "", phone: "" }])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getVessels().then(res => {
      if (res.success && res.data) {
        let list = res.data.list
        if (!roleConfig.canViewAllVessels) {
          list = list.filter(v => v.owner_name === currentOwnerName)
        }
        setVessels(list)
      }
    })
    getSeaAreas().then(res => { if (res.success && res.data) setSeaAreas(res.data) })
  }, [roleConfig.canViewAllVessels, currentOwnerName])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.vessel_id) errs.vessel_id = "请选择渔船"
    if (!form.sea_area) errs.sea_area = "请选择海域"
    if (!form.departure_time) errs.departure_time = "请选择出海时间"
    if (!form.expected_return) errs.expected_return = "请选择预计返港时间"
    if (form.departure_time && form.expected_return && new Date(form.expected_return) <= new Date(form.departure_time)) {
      errs.expected_return = "返港时间须晚于出海时间"
    }
    const validCrews = crews.filter(c => c.name.trim() && c.id_number.trim() && c.role.trim())
    if (validCrews.length === 0) {
      errs.crews = "请至少填写 1 名完整的船员信息（姓名、证件号、职务）"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await createDeclaration({
        ...form,
        vessel_id: Number(form.vessel_id),
        crews: crews.filter(c => c.name.trim()),
      })
      navigate("/declarations")
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

  const updateCrew = (idx: number, field: keyof DeclarationCrew, value: string) => {
    setCrews(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const addCrew = () => setCrews(prev => [...prev, { name: "", id_number: "", role: "", phone: "" }])
  const removeCrew = (idx: number) => setCrews(prev => prev.filter((_, i) => i !== idx))

  const inputCls = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors[field] ? "border-red-300" : "border-slate-200"}`

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/declarations")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </button>

      <Card title="新建出海申报">
        <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
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
              <label className="block text-sm font-medium text-slate-700 mb-1">作业海域 *</label>
              <select value={form.sea_area} onChange={e => update("sea_area", e.target.value)} className={inputCls("sea_area")}>
                <option value="">请选择海域</option>
                {seaAreas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              {errors.sea_area && <p className="text-xs text-red-500 mt-1">{errors.sea_area}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">出海时间 *</label>
              <input type="datetime-local" value={form.departure_time} onChange={e => update("departure_time", e.target.value)} className={inputCls("departure_time")} />
              {errors.departure_time && <p className="text-xs text-red-500 mt-1">{errors.departure_time}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">预计返港时间 *</label>
              <input type="datetime-local" value={form.expected_return} onChange={e => update("expected_return", e.target.value)} className={inputCls("expected_return")} />
              {errors.expected_return && <p className="text-xs text-red-500 mt-1">{errors.expected_return}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">作业许可证号</label>
              <input value={form.work_permit} onChange={e => update("work_permit", e.target.value)} className={inputCls("work_permit")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">许可证状态</label>
              <select value={form.work_permit_status} onChange={e => update("work_permit_status", e.target.value)} className={inputCls("work_permit_status")}>
                <option value="有效">有效</option>
                <option value="无效">无效</option>
                <option value="过期">过期</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">保险状态</label>
            <select value={form.insurance_status} onChange={e => update("insurance_status", e.target.value)} className={inputCls("insurance_status")}>
              <option value="已投保">已投保</option>
              <option value="未投保">未投保</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">船员名单</label>
              <button type="button" onClick={addCrew} className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700">
                <Plus className="w-4 h-4" /> 添加船员
              </button>
            </div>
            {errors.crews && <p className="text-sm text-red-500 mb-2">{errors.crews}</p>}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
                <div className="col-span-3">姓名 *</div>
                <div className="col-span-3">身份证号 *</div>
                <div className="col-span-2">职务 *</div>
                <div className="col-span-3">联系方式</div>
                <div className="col-span-1 text-center">操作</div>
              </div>
              <div className="divide-y divide-slate-100">
                {crews.map((crew, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-3 py-2 items-center">
                    <div className="col-span-3">
                      <input
                        placeholder="请输入姓名"
                        value={crew.name}
                        onChange={e => updateCrew(idx, "name", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        placeholder="请输入证件号"
                        value={crew.id_number}
                        onChange={e => updateCrew(idx, "id_number", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={crew.role}
                        onChange={e => updateCrew(idx, "role", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      >
                        <option value="">选择职务</option>
                        <option value="船长">船长</option>
                        <option value="轮机长">轮机长</option>
                        <option value="大副">大副</option>
                        <option value="水手">水手</option>
                        <option value="船员">船员</option>
                        <option value="厨师">厨师</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        placeholder="手机号码"
                        value={crew.phone}
                        onChange={e => updateCrew(idx, "phone", e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {crews.length > 1 && (
                        <button type="button" onClick={() => removeCrew(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">注：带 * 为必填项，至少填写 1 名船员信息</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors">
              {submitting ? "提交中..." : "提交申报"}
            </button>
            <button type="button" onClick={() => navigate("/declarations")} className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              取消
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
