import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle } from "lucide-react"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import { createVessel, updateVessel, getVessel, getVesselTypes, createCertificate } from "@/api"
import type { Vessel, VesselType, Certificate } from "@/types"

interface CertForm {
  id?: number
  cert_type: string
  cert_number: string
  issue_date: string
  expiry_date: string
}

export default function VesselForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [vesselTypes, setVesselTypes] = useState<VesselType[]>([])
  const [form, setForm] = useState({
    name: "",
    code: "",
    owner_name: "",
    owner_phone: "",
    vessel_type: "",
    fishing_type: "",
    gps_device: "",
    gps_status: "在线",
    safety_device: "",
    safety_status: "在线",
    work_permit: "",
    work_permit_status: "有效",
    work_permit_expiry: "",
  })
  const [certificates, setCertificates] = useState<CertForm[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [checkPassed, setCheckPassed] = useState(false)

  useEffect(() => {
    getVesselTypes().then(res => { if (res.success && res.data) setVesselTypes(res.data) })
    if (isEdit) {
      getVessel(Number(id)).then(res => {
        if (res.success && res.data) {
          const v = res.data as Vessel & { work_permit?: string; work_permit_status?: string; work_permit_expiry?: string }
          setForm({
            name: v.name || "",
            code: v.code || "",
            owner_name: v.owner_name || "",
            owner_phone: v.owner_phone || "",
            vessel_type: v.vessel_type || "",
            fishing_type: v.fishing_type || "",
            gps_device: v.gps_device || "",
            gps_status: v.gps_status || "在线",
            safety_device: v.safety_device || "",
            safety_status: v.safety_status || "在线",
            work_permit: v.work_permit || "",
            work_permit_status: v.work_permit_status || "有效",
            work_permit_expiry: "",
          })
          if (v.certificates) {
            setCertificates(v.certificates.map(c => ({
              id: c.id,
              cert_type: c.cert_type,
              cert_number: c.cert_number,
              issue_date: c.issue_date,
              expiry_date: c.expiry_date,
            })))
          }
        }
      })
    }
  }, [id])

  useEffect(() => {
    const certValid = certificates.length > 0 && certificates.every(c => 
      c.cert_type && c.cert_number && c.issue_date && c.expiry_date
    )
    const permitValid = form.work_permit && form.work_permit_status === "有效"
    const deviceValid = form.gps_status === "在线" && form.safety_status === "在线"
    setCheckPassed(certValid && permitValid && deviceValid)
  }, [certificates, form.work_permit, form.work_permit_status, form.gps_status, form.safety_status])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "请输入船名"
    if (!form.code.trim()) errs.code = "请输入船号"
    if (!form.owner_name.trim()) errs.owner_name = "请输入船东姓名"
    if (!checkPassed) errs.check = "档案核验未通过，请完善证书、许可和设备信息"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const vesselData = { ...form }
      let vesselId: number
      if (isEdit) {
        await updateVessel(Number(id), vesselData)
        vesselId = Number(id)
      } else {
        const res = await createVessel(vesselData)
        if (!res.success || !res.data) throw new Error("创建失败")
        vesselId = (res.data as { id: number }).id
      }
      for (const cert of certificates) {
        if (!cert.id) {
          await createCertificate(vesselId, cert)
        }
      }
      navigate("/vessels")
    } catch (err) {
      alert(err instanceof Error ? err.message : "操作失败")
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const addCert = () => {
    setCertificates([...certificates, { cert_type: "", cert_number: "", issue_date: "", expiry_date: "" }])
  }

  const updateCert = (idx: number, field: string, value: string) => {
    setCertificates(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const removeCert = (idx: number) => {
    setCertificates(prev => prev.filter((_, i) => i !== idx))
  }

  const inputCls = (field: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${errors[field] ? "border-red-300" : "border-slate-200"}`

  const certTypes = ["渔业捕捞许可证", "船舶检验证书", "船员适任证书", "安全证书", "环保证书"]

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/vessels")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </button>

      <Card title={isEdit ? "编辑渔船档案" : "新增渔船档案"}>
        <form onSubmit={onSubmit} className="space-y-6 max-w-4xl">
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              档案核验状态
              {checkPassed ? (
                <Badge variant="success"><CheckCircle className="w-3 h-3 inline mr-1" />核验通过</Badge>
              ) : (
                <Badge variant="warning"><XCircle className="w-3 h-3 inline mr-1" />待核验</Badge>
              )}
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${certificates.length > 0 ? "text-green-500" : "text-slate-300"}`} />
                <span className={certificates.length > 0 ? "text-slate-700" : "text-slate-400"}>船舶证书 ({certificates.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${form.work_permit ? "text-green-500" : "text-slate-300"}`} />
                <span className={form.work_permit ? "text-slate-700" : "text-slate-400"}>作业许可</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${form.gps_status === "在线" && form.safety_status === "在线" ? "text-green-500" : "text-slate-300"}`} />
                <span className={form.gps_status === "在线" && form.safety_status === "在线" ? "text-slate-700" : "text-slate-400"}>设备在线</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">船名 *</label>
                <input value={form.name} onChange={e => update("name", e.target.value)} className={inputCls("name")} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">船号 *</label>
                <input value={form.code} onChange={e => update("code", e.target.value)} className={inputCls("code")} />
                {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">船东姓名 *</label>
                <input value={form.owner_name} onChange={e => update("owner_name", e.target.value)} className={inputCls("owner_name")} />
                {errors.owner_name && <p className="text-xs text-red-500 mt-1">{errors.owner_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">船东电话</label>
                <input value={form.owner_phone} onChange={e => update("owner_phone", e.target.value)} className={inputCls("owner_phone")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">船舶类型</label>
                <select value={form.vessel_type} onChange={e => update("vessel_type", e.target.value)} className={inputCls("vessel_type")}>
                  <option value="">请选择</option>
                  {vesselTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">作业类型</label>
                <input value={form.fishing_type} onChange={e => update("fishing_type", e.target.value)} className={inputCls("fishing_type")} placeholder="如：拖网、围网" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-700">船舶证书</h4>
              <button type="button" onClick={addCert} className="flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700">
                <Plus className="w-4 h-4" /> 添加证书
              </button>
            </div>
            {certificates.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">暂无证书，请点击上方添加</p>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl grid grid-cols-5 gap-3 items-end">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">证书类型</label>
                      <select value={cert.cert_type} onChange={e => updateCert(idx, "cert_type", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm">
                        <option value="">选择</option>
                        {certTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">证书编号</label>
                      <input value={cert.cert_number} onChange={e => updateCert(idx, "cert_number", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">签发日期</label>
                      <input type="date" value={cert.issue_date} onChange={e => updateCert(idx, "issue_date", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">到期日期</label>
                      <input type="date" value={cert.expiry_date} onChange={e => updateCert(idx, "expiry_date", e.target.value)} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm" />
                    </div>
                    <button type="button" onClick={() => removeCert(idx)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">作业许可</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">许可编号</label>
                <input value={form.work_permit} onChange={e => update("work_permit", e.target.value)} className={inputCls("work_permit")} placeholder="作业许可编号" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">许可状态</label>
                <select value={form.work_permit_status} onChange={e => update("work_permit_status", e.target.value)} className={inputCls("work_permit_status")}>
                  <option value="有效">有效</option>
                  <option value="过期">过期</option>
                  <option value="无效">无效</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">到期日期</label>
                <input type="date" value={form.work_permit_expiry} onChange={e => update("work_permit_expiry", e.target.value)} className={inputCls("work_permit_expiry")} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">设备安全核验</h4>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">定位设备型号</label>
                <input value={form.gps_device} onChange={e => update("gps_device", e.target.value)} className={inputCls("gps_device")} placeholder="GPS设备" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">定位状态</label>
                <select value={form.gps_status} onChange={e => update("gps_status", e.target.value)} className={inputCls("gps_status")}>
                  <option value="在线">在线</option>
                  <option value="离线">离线</option>
                  <option value="故障">故障</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">安全设备类型</label>
                <input value={form.safety_device} onChange={e => update("safety_device", e.target.value)} className={inputCls("safety_device")} placeholder="AIS/VMS等" />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">安全设备状态</label>
                <select value={form.safety_status} onChange={e => update("safety_status", e.target.value)} className={inputCls("safety_status")}>
                  <option value="在线">在线</option>
                  <option value="离线">离线</option>
                  <option value="故障">故障</option>
                </select>
              </div>
            </div>
          </div>

          {errors.check && <p className="text-sm text-red-500">{errors.check}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors">
              {submitting ? "提交中..." : isEdit ? "保存修改" : "创建渔船档案"}
            </button>
            <button type="button" onClick={() => navigate("/vessels")} className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              取消
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
