import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, ShieldCheck, DollarSign, MapPin, ClipboardList, CheckCircle, XCircle } from 'lucide-react'
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
  verify_status: string
  service_score: number
  credit_score: number
  status: string
  zone_name: string
}

interface CreditRecord {
  id: number
  type: string
  score_change: number
  reason: string
  appeal_status: string
  created_at: string
}

interface IncomeRecord {
  id: number
  order_id: number
  delivery_fee: number
  tier_surcharge: number
  time_subsidy: number
  referral_bonus: number
  total_amount: number
  settle_status: string
  created_at: string
}

interface TrajectoryPoint {
  id: number
  longitude: number
  latitude: number
  timestamp: string
  is_abnormal: number
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

const verifyMap: Record<string, { label: string; cls: string }> = {
  approved: { label: '已认证', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

const appealDisplayMap: Record<string, { label: string; cls: string }> = {
  none: { label: '', cls: '' },
  appealed: { label: '已申诉', cls: 'text-yellow-600' },
  approved: { label: '申诉成功', cls: 'text-emerald-600' },
  rejected: { label: '已驳回', cls: 'text-red-600' },
}

const actionLabelMap: Record<string, string> = {
  verify_approved: '审核通过',
  verify_rejected: '审核拒绝',
  appeal_approved: '申诉通过',
  appeal_rejected: '申诉驳回',
}

type TabKey = 'credit' | 'income' | 'trajectory'

export default function RiderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const [rider, setRider] = useState<Rider | null>(null)
  const [tab, setTab] = useState<TabKey>('credit')
  const [creditRecords, setCreditRecords] = useState<CreditRecord[]>([])
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([])
  const [trajectoryPoints, setTrajectoryPoints] = useState<TrajectoryPoint[]>([])
  const [verifyLogs, setVerifyLogs] = useState<VerifyLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api<Rider>(`/api/riders/${id}`).then((r) => {
      if (r.success) setRider(r.data!)
      setLoading(false)
    })
  }, [id])

  useEffect(() => {
    if (!id) return
    if (tab === 'credit') {
      api<CreditRecord[]>(`/api/riders/${id}/credit`).then((r) => {
        if (r.success) setCreditRecords(r.data!)
      })
    } else if (tab === 'income') {
      api<IncomeRecord[]>(`/api/riders/${id}/income`).then((r) => {
        if (r.success) setIncomeRecords(r.data!)
      })
    } else if (tab === 'trajectory') {
      api<TrajectoryPoint[]>(`/api/riders/${id}/trajectory`).then((r) => {
        if (r.success) setTrajectoryPoints(r.data!)
      })
    }
  }, [id, tab])

  useEffect(() => {
    if (!id) return
    api<{ list: VerifyLog[] }>(`/api/verify-logs?target_type=rider&target_id=${id}&page_size=20`).then((r) => {
      if (r.success) setVerifyLogs(r.data!.list)
    })
  }, [id])

  async function handleAppeal(recordId: number) {
    const res = await api(`/api/riders/${id}/credit/appeal`, {
      method: 'POST',
      body: JSON.stringify({ credit_record_id: recordId }),
    })
    if (res.success) {
      addToast('申诉已提交', 'success')
      setCreditRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, appeal_status: 'appealed' } : r))
      )
    } else {
      addToast(res.error || '申诉失败', 'error')
    }
  }

  async function handleAppealReview(recordId: number, appealStatus: string) {
    const res = await api(`/api/riders/${id}/credit/appeal/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify({ appeal_status: appealStatus }),
    })
    if (res.success) {
      addToast(appealStatus === 'approved' ? '申诉已通过' : '申诉已驳回', 'success')
      const refreshed = await api<CreditRecord[]>(`/api/riders/${id}/credit`)
      if (refreshed.success) setCreditRecords(refreshed.data!)
      const riderRes = await api<Rider>(`/api/riders/${id}`)
      if (riderRes.success) setRider(riderRes.data!)
    } else {
      addToast(res.error || '操作失败', 'error')
    }
  }

  async function handleVerify(status: string) {
    const res = await api(`/api/riders/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verify_status: status }),
    })
    if (res.success) {
      addToast('审核成功', 'success')
      setRider((prev) => (prev ? { ...prev, verify_status: status } : prev))
    } else {
      addToast(res.error || '审核失败', 'error')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  if (!rider) return <div className="text-center py-10 text-gray-400">骑手不存在</div>

  const v = verifyMap[rider.verify_status] || { label: rider.verify_status, cls: 'bg-gray-100 text-gray-600' }
  const totalIncome = incomeRecords.reduce((s, r) => s + r.total_amount, 0)
  const appealedRecords = creditRecords.filter((r) => r.appeal_status === 'appealed')

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'credit', label: '信用档案', icon: ShieldCheck },
    { key: 'income', label: '收入明细', icon: DollarSign },
    { key: 'trajectory', label: '轨迹记录', icon: MapPin },
  ]

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/riders')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 返回骑手列表
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{rider.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{rider.phone}</span>
                <span>·</span>
                <span>{rider.zone_name || '未分配区域'}</span>
                <span>·</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>{v.label}</span>
              </div>
            </div>
          </div>
          {rider.verify_status === 'pending' && (
            <button onClick={() => navigate(`/riders/${id}/verify`)} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
              <ShieldCheck size={14} /> 去审核
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">服务分</div>
            <div className="text-xl font-bold text-primary mt-1">{rider.service_score}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">信用分</div>
            <div className="text-xl font-bold text-gray-900 mt-1">{rider.credit_score}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">健康码</div>
            <div className="text-sm font-medium mt-1">{rider.health_code_status === 'green' ? '🟢 绿码' : rider.health_code_status === 'yellow' ? '🟡 黄码' : '🔴 红码'}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">车辆</div>
            <div className="text-sm font-medium mt-1">{rider.plate_number || '-'}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-gray-100">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </div>

        <div className="p-5">
          {tab === 'credit' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#1E3A5F" strokeWidth="8"
                        strokeDasharray={`${(rider.credit_score / 100) * 264} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-primary">
                      {rider.credit_score}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">信用评分</div>
                    <div className="text-sm text-gray-400 mt-1">满分100分</div>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 py-2">类型</th>
                      <th className="text-left text-xs font-medium text-gray-500 py-2">分值变动</th>
                      <th className="text-left text-xs font-medium text-gray-500 py-2">原因</th>
                      <th className="text-left text-xs font-medium text-gray-500 py-2">申诉</th>
                      <th className="text-left text-xs font-medium text-gray-500 py-2">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditRecords.map((rec) => {
                      const appeal = appealDisplayMap[rec.appeal_status] || { label: rec.appeal_status, cls: 'text-gray-600' }
                      return (
                        <tr key={rec.id} className="border-b border-gray-50">
                          <td className="py-2.5 text-sm">{rec.type === 'deduct' ? '扣分' : '加分'}</td>
                          <td className={`py-2.5 text-sm font-medium ${rec.score_change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {rec.score_change > 0 ? '+' : ''}{rec.score_change}
                          </td>
                          <td className="py-2.5 text-sm text-gray-600">{rec.reason}</td>
                          <td className="py-2.5">
                            {rec.type === 'deduct' && rec.appeal_status === 'none' && (
                              <button onClick={() => handleAppeal(rec.id)} className="text-xs text-primary hover:underline">申诉</button>
                            )}
                            {rec.appeal_status !== 'none' && (
                              <span className={`text-xs ${appeal.cls}`}>{appeal.label}</span>
                            )}
                          </td>
                          <td className="py-2.5 text-xs text-gray-400">{rec.created_at?.slice(0, 16)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {appealedRecords.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                    <ClipboardList size={16} className="text-orange-500" /> 待审核申诉
                  </h3>
                  <div className="space-y-3">
                    {appealedRecords.map((rec) => (
                      <div key={rec.id} className="p-4 bg-orange-50 border border-orange-100 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-gray-800">
                              <span className="font-medium">扣分原因：</span>{rec.reason}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              扣分：{rec.score_change} · {rec.created_at?.slice(0, 16)}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAppealReview(rec.id, 'approved')}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                            >
                              <CheckCircle size={12} /> 通过申诉
                            </button>
                            <button
                              onClick={() => handleAppealReview(rec.id, 'rejected')}
                              className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                              <XCircle size={12} /> 驳回申诉
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'income' && (
            <div>
              <div className="flex gap-4 mb-4">
                <div className="px-4 py-2 bg-primary/5 rounded-lg">
                  <div className="text-xs text-gray-500">总收入</div>
                  <div className="text-lg font-bold text-primary">¥{totalIncome.toFixed(2)}</div>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 py-2">订单ID</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2">配送费</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2">阶梯加价</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2">时段补贴</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2">推荐奖金</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2">合计</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2">结算</th>
                    <th className="text-left text-xs font-medium text-gray-500 py-2">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeRecords.map((rec) => (
                    <tr key={rec.id} className="border-b border-gray-50">
                      <td className="py-2.5 text-sm">#{rec.order_id}</td>
                      <td className="py-2.5 text-sm">¥{rec.delivery_fee}</td>
                      <td className="py-2.5 text-sm">¥{rec.tier_surcharge}</td>
                      <td className="py-2.5 text-sm">¥{rec.time_subsidy}</td>
                      <td className="py-2.5 text-sm">¥{rec.referral_bonus}</td>
                      <td className="py-2.5 text-sm font-medium text-primary">¥{rec.total_amount}</td>
                      <td className="py-2.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${rec.settle_status === 'settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {rec.settle_status === 'settled' ? '已结算' : '待结算'}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-gray-400">{rec.created_at?.slice(0, 16)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'trajectory' && (
            <div>
              {trajectoryPoints.length === 0 ? (
                <div className="text-center text-gray-400 py-8">暂无轨迹数据</div>
              ) : (
                <div className="space-y-2">
                  {trajectoryPoints.map((pt) => (
                    <div key={pt.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full ${pt.is_abnormal ? 'bg-red-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1 text-sm">
                        <span className="text-gray-600">经度: {pt.longitude.toFixed(4)}</span>
                        <span className="mx-2 text-gray-300">|</span>
                        <span className="text-gray-600">纬度: {pt.latitude.toFixed(4)}</span>
                        {pt.is_abnormal === 1 && <span className="ml-2 text-xs text-red-500">异常</span>}
                      </div>
                      <span className="text-xs text-gray-400">{pt.timestamp?.slice(0, 19)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {verifyLogs.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" /> 审核日志
            </h3>
          </div>
          <div className="p-5">
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
