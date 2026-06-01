import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { ArrowLeft, CheckCircle, XCircle, LogIn } from "lucide-react"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import { getDeclaration, verifyDeclaration, approveDeclaration, rejectDeclaration, returnDeclaration } from "@/api"
import type { Declaration } from "@/types"

function statusBadge(status: string) {
  const map: Record<string, { variant: "default" | "success" | "warning" | "danger" | "info"; label: string }> = {
    待核验: { variant: "warning", label: "待核验" },
    已核验: { variant: "info", label: "已核验" },
    已通过: { variant: "success", label: "已通过" },
    已驳回: { variant: "danger", label: "已驳回" },
    已返港: { variant: "default", label: "已返港" },
  }
  const s = map[status] || { variant: "default" as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default function DeclarationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [decl, setDecl] = useState<Declaration | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getDeclaration(Number(id))
      if (res.success && res.data) setDecl(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const onVerify = async () => { await verifyDeclaration(Number(id)); fetchData() }
  const onApprove = async () => { await approveDeclaration(Number(id)); fetchData() }
  const onReject = async () => {
    if (!rejectReason.trim()) return
    await rejectDeclaration(Number(id), rejectReason)
    setShowReject(false)
    setRejectReason("")
    fetchData()
  }
  const onReturn = async () => { await returnDeclaration(Number(id)); fetchData() }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
  if (!decl) return <div className="text-center py-20 text-slate-500">未找到申报信息</div>

  const timeline = [
    { time: decl.created_at, label: "创建申报", active: true },
    { time: decl.verified_at, label: `核验通过 - ${decl.verified_by || ""}`, active: !!decl.verified_at },
    { time: decl.approved_at, label: `审批放行 - ${decl.approved_by || ""}`, active: !!decl.approved_at },
    { time: decl.actual_return, label: "返港确认", active: !!decl.actual_return },
  ].filter(t => t.active)

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/declarations")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </button>

      <Card title="申报信息" action={statusBadge(decl.status)}>
        <div className="grid grid-cols-3 gap-6">
          {[
            ["渔船", decl.vessel?.name || `船${decl.vessel_id}`],
            ["作业海域", decl.sea_area],
            ["出海时间", decl.departure_time ? format(new Date(decl.departure_time), "yyyy-MM-dd HH:mm") : "-"],
            ["预计返港", decl.expected_return ? format(new Date(decl.expected_return), "yyyy-MM-dd HH:mm") : "-"],
            ["实际返港", decl.actual_return ? format(new Date(decl.actual_return), "yyyy-MM-dd HH:mm") : "-"],
            ["作业许可", decl.work_permit],
            ["许可状态", decl.work_permit_status],
            ["保险状态", decl.insurance_status],
            ["核验人", decl.verified_by || "-"],
            ["审批人", decl.approved_by || "-"],
            ["未通过原因", decl.reject_reason || "-"],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="船员名单">
        {(!decl.crews || decl.crews.length === 0) ? (
          <p className="text-center text-slate-500 py-4">暂无船员信息</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">姓名</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">身份证号</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">职务</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">电话</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {decl.crews.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-sm text-slate-700">{c.name}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{c.id_number}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{c.role}</td>
                    <td className="px-4 py-2 text-sm text-slate-700">{c.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="自动核查结果">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              {decl.work_permit_status === "有效" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium text-slate-700">作业许可证</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{decl.work_permit_status === "有效" ? "许可证有效" : "许可证无效或过期"}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              {decl.insurance_status === "已投保" ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm font-medium text-slate-700">保险状态</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{decl.insurance_status === "已投保" ? "已投保" : "未投保"}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-slate-700">证书有效期</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">请在详情中核实</p>
          </div>
        </div>
      </Card>

      <Card title="操作">
        <div className="flex items-center gap-3">
          {decl.status === "待核验" && (
            <>
              <button onClick={onVerify} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors">
                <CheckCircle className="w-4 h-4" /> 核验通过
              </button>
              <button onClick={() => setShowReject(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                <XCircle className="w-4 h-4" /> 驳回
              </button>
            </>
          )}
          {decl.status === "已核验" && (
            <>
              <button onClick={onApprove} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                <CheckCircle className="w-4 h-4" /> 放行
              </button>
              <button onClick={() => setShowReject(true)} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                <XCircle className="w-4 h-4" /> 驳回
              </button>
            </>
          )}
          {decl.status === "已通过" && (
            <button onClick={onReturn} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
              <LogIn className="w-4 h-4" /> 返港确认
            </button>
          )}
        </div>
        {showReject && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
            <label className="block text-sm font-medium text-slate-700">驳回原因 *</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="请输入驳回原因"
            />
            <div className="flex gap-2">
              <button onClick={onReject} className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">确认驳回</button>
              <button onClick={() => { setShowReject(false); setRejectReason("") }} className="px-4 py-1.5 border border-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-50">取消</button>
            </div>
          </div>
        )}
      </Card>

      <Card title="处理时间线">
        <div className="space-y-4">
          {timeline.map((t, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-slate-700">{t.label}</p>
                <p className="text-xs text-slate-400">{t.time ? format(new Date(t.time), "yyyy-MM-dd HH:mm:ss") : "-"}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
