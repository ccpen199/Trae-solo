import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { ArrowLeft, Send, MessageSquare, CheckCircle } from "lucide-react"
import Card from "@/components/Card"
import Badge from "@/components/Badge"
import { getEvent, notifyEvent, receiptEvent, resolveEvent } from "@/api"
import type { Event } from "@/types"

function statusBadge(status: string) {
  const map: Record<string, { variant: "warning" | "info" | "success"; label: string }> = {
    待处置: { variant: "warning", label: "待处置" },
    处置中: { variant: "info", label: "处置中" },
    已处置: { variant: "success", label: "已处置" },
  }
  const s = map[status] || { variant: "info" as const, label: status }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifyForm, setNotifyForm] = useState({ recipient: "", method: "电话", content: "" })
  const [notifyErrors, setNotifyErrors] = useState<Record<string, string>>({})
  const [notifySubmitting, setNotifySubmitting] = useState(false)
  const [notifySuccess, setNotifySuccess] = useState("")
  const [receiptForm, setReceiptForm] = useState({ respondent: "", content: "" })
  const [receiptErrors, setReceiptErrors] = useState<Record<string, string>>({})
  const [receiptSubmitting, setReceiptSubmitting] = useState(false)
  const [receiptSuccess, setReceiptSuccess] = useState("")
  const [resolution, setResolution] = useState("")
  const [resolutionError, setResolutionError] = useState("")
  const [resolutionSubmitting, setResolutionSubmitting] = useState(false)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await getEvent(Number(id))
      if (res.success && res.data) setEvent(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const validateNotify = () => {
    const errs: Record<string, string> = {}
    if (!notifyForm.recipient.trim()) errs.recipient = "请输入接收人"
    if (!notifyForm.content.trim()) errs.content = "请输入通知内容"
    setNotifyErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onNotify = async () => {
    if (!validateNotify()) return
    setNotifySubmitting(true)
    setNotifySuccess("")
    try {
      const res = await notifyEvent(Number(id), notifyForm)
      if (res.success) {
        setNotifySuccess("通知发送成功！")
        setNotifyForm({ recipient: "", method: "电话", content: "" })
        setNotifyErrors({})
        setTimeout(() => setNotifySuccess(""), 3000)
        fetchData()
      } else {
        setNotifyErrors({ submit: res.error || "发送失败" })
      }
    } catch (err) {
      setNotifyErrors({ submit: err instanceof Error ? err.message : "网络错误" })
    } finally {
      setNotifySubmitting(false)
    }
  }

  const validateReceipt = () => {
    const errs: Record<string, string> = {}
    if (!receiptForm.respondent.trim()) errs.respondent = "请输入回复人"
    if (!receiptForm.content.trim()) errs.content = "请输入回执内容"
    setReceiptErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onReceipt = async () => {
    if (!validateReceipt()) return
    setReceiptSubmitting(true)
    setReceiptSuccess("")
    try {
      const res = await receiptEvent(Number(id), receiptForm)
      if (res.success) {
        setReceiptSuccess("回执记录成功！")
        setReceiptForm({ respondent: "", content: "" })
        setReceiptErrors({})
        setTimeout(() => setReceiptSuccess(""), 3000)
        fetchData()
      } else {
        setReceiptErrors({ submit: res.error || "记录失败" })
      }
    } catch (err) {
      setReceiptErrors({ submit: err instanceof Error ? err.message : "网络错误" })
    } finally {
      setReceiptSubmitting(false)
    }
  }

  const onResolve = async () => {
    if (!resolution.trim()) {
      setResolutionError("请输入处置结论")
      return
    }
    setResolutionError("")
    setResolutionSubmitting(true)
    try {
      const res = await resolveEvent(Number(id), resolution)
      if (res.success) {
        setResolution("")
        fetchData()
      } else {
        setResolutionError(res.error || "操作失败")
      }
    } catch (err) {
      setResolutionError(err instanceof Error ? err.message : "网络错误")
    } finally {
      setResolutionSubmitting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
  if (!event) return <div className="text-center py-20 text-slate-500">未找到事件信息</div>

  const methodLabel: Record<string, string> = { 电话: "📞 电话", 短信: "💬 短信", VHF: "📻 VHF" }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate("/events")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回列表
      </button>

      <Card title="事件信息" action={statusBadge(event.status)}>
        <div className="grid grid-cols-3 gap-6">
          {[
            ["渔船", event.vessel?.name || `船${event.vessel_id}`],
            ["事件类型", event.event_type],
            ["标题", event.title],
            ["描述", event.description || "-"],
            ["上报人", event.created_by],
            ["发生时间", event.occurred_at ? format(new Date(event.occurred_at), "yyyy-MM-dd HH:mm") : "-"],
            ["创建时间", event.created_at ? format(new Date(event.created_at), "yyyy-MM-dd HH:mm") : "-"],
            ["处理结论", event.resolution || "-"],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card
        title="处理时间线"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
            <div>
              <p className="text-sm font-medium text-slate-700">事件上报</p>
              <p className="text-xs text-slate-400">{event.occurred_at ? format(new Date(event.occurred_at), "yyyy-MM-dd HH:mm:ss") : "-"}</p>
            </div>
          </div>
          {event.notifications?.map((n, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-slate-700">通知 {n.recipient} ({methodLabel[n.method] || n.method})</p>
                <p className="text-xs text-slate-500">{n.content}</p>
                <p className="text-xs text-slate-400">{n.sent_at ? format(new Date(n.sent_at), "yyyy-MM-dd HH:mm:ss") : "-"}</p>
              </div>
            </div>
          ))}
          {event.receipts?.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
              <div>
                <p className="text-sm font-medium text-slate-700">回执 {r.respondent}</p>
                <p className="text-xs text-slate-500">{r.content}</p>
                <p className="text-xs text-slate-400">{r.received_at ? format(new Date(r.received_at), "yyyy-MM-dd HH:mm:ss") : "-"}</p>
              </div>
            </div>
          ))}
          {event.resolved_at && (
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
              <div>
                <p className="text-sm font-medium text-slate-700">处置完成</p>
                <p className="text-xs text-slate-500">{event.resolution}</p>
                <p className="text-xs text-slate-400">{format(new Date(event.resolved_at), "yyyy-MM-dd HH:mm:ss")}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="发送通知">
        <div className="space-y-3 max-w-2xl">
          {notifySuccess && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ {notifySuccess}</p>}
          {notifyErrors.submit && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">✗ {notifyErrors.submit}</p>}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <input
                placeholder="接收人 *"
                value={notifyForm.recipient}
                onChange={e => setNotifyForm(p => ({ ...p, recipient: e.target.value }))}
                className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${notifyErrors.recipient ? "border-red-300" : "border-slate-200"}`}
              />
              {notifyErrors.recipient && <p className="text-xs text-red-500 mt-1">{notifyErrors.recipient}</p>}
            </div>
            <select
              value={notifyForm.method}
              onChange={e => setNotifyForm(p => ({ ...p, method: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="电话">电话</option>
              <option value="短信">短信</option>
              <option value="VHF">VHF</option>
            </select>
          </div>
          <div>
            <textarea
              placeholder="通知内容 *"
              value={notifyForm.content}
              onChange={e => setNotifyForm(p => ({ ...p, content: e.target.value }))}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${notifyErrors.content ? "border-red-300" : "border-slate-200"}`}
            />
            {notifyErrors.content && <p className="text-xs text-red-500 mt-1">{notifyErrors.content}</p>}
          </div>
          <button onClick={onNotify} disabled={notifySubmitting} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors">
            <Send className="w-4 h-4" /> {notifySubmitting ? "发送中..." : "发送通知"}
          </button>
        </div>
      </Card>

      <Card title="记录回执">
        <div className="space-y-3 max-w-2xl">
          {receiptSuccess && <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">✓ {receiptSuccess}</p>}
          {receiptErrors.submit && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">✗ {receiptErrors.submit}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                placeholder="回复人 *"
                value={receiptForm.respondent}
                onChange={e => setReceiptForm(p => ({ ...p, respondent: e.target.value }))}
                className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${receiptErrors.respondent ? "border-red-300" : "border-slate-200"}`}
              />
              {receiptErrors.respondent && <p className="text-xs text-red-500 mt-1">{receiptErrors.respondent}</p>}
            </div>
          </div>
          <div>
            <textarea
              placeholder="回执内容 *"
              value={receiptForm.content}
              onChange={e => setReceiptForm(p => ({ ...p, content: e.target.value }))}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 ${receiptErrors.content ? "border-red-300" : "border-slate-200"}`}
            />
            {receiptErrors.content && <p className="text-xs text-red-500 mt-1">{receiptErrors.content}</p>}
          </div>
          <button onClick={onReceipt} disabled={receiptSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors">
            <MessageSquare className="w-4 h-4" /> {receiptSubmitting ? "记录中..." : "记录回执"}
          </button>
        </div>
      </Card>

      {(event.status === "待处置" || event.status === "处置中") && (
        <Card title="处置结论">
          <div className="space-y-3 max-w-2xl">
            {resolutionError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">✗ {resolutionError}</p>}
            <textarea
              placeholder="请输入处置结论 *"
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button onClick={onResolve} disabled={resolutionSubmitting} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              <CheckCircle className="w-4 h-4" /> {resolutionSubmitting ? "提交中..." : "完成处置"}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
