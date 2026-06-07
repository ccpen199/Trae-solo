import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, ShieldCheck, FileText, ClipboardList } from 'lucide-react'
import { api } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Rider {
  id: number
  name: string
  phone: string
  id_card: string
  health_code_status: string
  vehicle_type: string
  plate_number: string
  license_photos: string
  verify_status: string
}

interface VerifyLog {
  id: number
  target_type: string
  target_id: number
  action: string
  operator: string
  reason: string
  created_at: string
}

const healthCodeMap: Record<string, { label: string; cls: string }> = {
  green: { label: '绿码', cls: 'bg-emerald-100 text-emerald-700' },
  yellow: { label: '黄码', cls: 'bg-yellow-100 text-yellow-700' },
  red: { label: '红码', cls: 'bg-red-100 text-red-700' },
}

const vehicleTypeMap: Record<string, string> = {
  electric_bike: '电动车',
  motorcycle: '摩托车',
  bicycle: '自行车',
  car: '汽车',
}

const actionLabelMap: Record<string, string> = {
  verify_approved: '审核通过',
  verify_rejected: '审核拒绝',
  appeal_approved: '申诉通过',
  appeal_rejected: '申诉驳回',
}

export default function RiderVerify() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const currentUser = useAppStore((s) => s.currentUser)
  const [rider, setRider] = useState<Rider | null>(null)
  const [verifyLogs, setVerifyLogs] = useState<VerifyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    verify_status: 'approved',
    reason: '',
  })

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api<Rider>(`/api/riders/${id}`).then((r) => {
      if (r.success) setRider(r.data!)
      setLoading(false)
    })
    api<{ list: VerifyLog[] }>(`/api/verify-logs?target_type=rider&target_id=${id}&page_size=20`).then((r) => {
      if (r.success) setVerifyLogs(r.data!.list)
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    const res = await api(`/api/riders/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({
        verify_status: form.verify_status,
        reason: form.reason,
        operator: currentUser.name,
      }),
    })
    setSubmitting(false)
    if (res.success) {
      addToast('审核提交成功', 'success')
      navigate(`/riders/${id}`)
    } else {
      addToast(res.error || '审核失败', 'error')
    }
  }

  function maskIdCard(idCard: string) {
    if (!idCard || idCard.length < 8) return idCard
    return idCard.slice(0, 3) + '*'.repeat(idCard.length - 7) + idCard.slice(-4)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  if (!rider) return <div className="text-center py-10 text-gray-400">骑手不存在</div>

  const hc = healthCodeMap[rider.health_code_status] || { label: rider.health_code_status, cls: 'bg-gray-100 text-gray-600' }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => navigate('/riders')} className="hover:text-gray-700">骑手管理</button>
        <span>/</span>
        <button onClick={() => navigate(`/riders/${id}`)} className="hover:text-gray-700">骑手详情</button>
        <span>/</span>
        <span className="text-gray-900">审核决策</span>
      </div>

      <button onClick={() => navigate(`/riders/${id}`)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 返回详情
      </button>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={24} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{rider.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{rider.phone}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" /> 实名认证信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">姓名</div>
                <div className="text-sm font-medium text-gray-900">{rider.name}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">身份证号</div>
                <div className="text-sm font-medium text-gray-900">{maskIdCard(rider.id_card)}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" /> 健康码状态
            </h3>
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${hc.cls}`}>
              {hc.label}
            </span>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary" /> 车辆信息
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">车辆类型</div>
                <div className="text-sm font-medium text-gray-900">{vehicleTypeMap[rider.vehicle_type] || rider.vehicle_type}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">车牌号</div>
                <div className="text-sm font-medium text-gray-900">{rider.plate_number || '-'}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary" /> 证照照片
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <FileText size={24} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-400">身份证正面</span>
              </div>
              <div className="aspect-[4/3] bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <FileText size={24} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-400">身份证反面</span>
              </div>
              <div className="aspect-[4/3] bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                <FileText size={24} className="text-gray-400 mb-2" />
                <span className="text-xs text-gray-400">驾驶证</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">审核操作</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">审核结果</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verify_status"
                  value="approved"
                  checked={form.verify_status === 'approved'}
                  onChange={(e) => setForm((f) => ({ ...f, verify_status: e.target.value }))}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-gray-700">通过</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="verify_status"
                  value="rejected"
                  checked={form.verify_status === 'rejected'}
                  onChange={(e) => setForm((f) => ({ ...f, verify_status: e.target.value }))}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm text-gray-700">拒绝</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">审核意见</label>
            <textarea
              className="input-base w-full h-24 resize-none"
              placeholder="请输入审核意见（必填）"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">审核人</label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">{currentUser.name}</div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-accent" disabled={submitting}>
              {submitting ? '提交中...' : '提交审核'}
            </button>
            <button type="button" onClick={() => navigate(`/riders/${id}`)} className="btn-outline">取消</button>
          </div>
        </form>
      </div>

      {verifyLogs.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" /> 审核历史
            </h3>
          </div>
          <div className="p-6">
            <div className="relative ml-4">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
              {verifyLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 mb-4 relative">
                  <div className="w-4 h-4 rounded-full border-2 border-primary bg-primary/20 flex-shrink-0 z-10" />
                  <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-800">{actionLabelMap[log.action] || log.action}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500">{log.operator}</span>
                    </div>
                    {log.reason && (
                      <div className="text-xs text-gray-500 mt-1">原因：{log.reason}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">{log.created_at?.slice(0, 19)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
