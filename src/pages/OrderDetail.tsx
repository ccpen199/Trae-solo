import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, RotateCcw, QrCode, User, Clock, Zap, DollarSign, AlertTriangle, MapPin, Monitor, ClipboardList } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import * as api from '@/api/client'
import type { Site, WorkOrder } from '@/api/client'

const stopReasonLabels: Record<string, string> = {
  user_stop: '手动停止',
  full: '充满自动停',
  timeout: '超时自动停',
  fault: '故障停止',
}

const refundStatusLabels: Record<string, string> = {
  none: '无退款',
  pending: '退款处理中',
  partial: '部分退款',
  refunded: '已退款',
  rejected: '退款被拒',
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentOrder, fetchOrder } = useStore()
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [siteInfo, setSiteInfo] = useState<Site | null>(null)
  const [relatedWorkOrders, setRelatedWorkOrders] = useState<WorkOrder[]>([])

  const orderId = Number(id)

  useEffect(() => {
    if (orderId) fetchOrder(orderId)
  }, [orderId, fetchOrder])

  useEffect(() => {
    if (currentOrder?.site_id) {
      api.getSite(currentOrder.site_id).then(setSiteInfo).catch(() => {})
    }
  }, [currentOrder?.site_id])

  useEffect(() => {
    if (currentOrder?.device_id) {
      api.getWorkOrders({ device_id: String(currentOrder.device_id) })
        .then(setRelatedWorkOrders)
        .catch(() => {})
    }
  }, [currentOrder?.device_id])

  if (!currentOrder) {
    return <div className="text-center text-slate-400 py-12">加载中...</div>
  }

  const handleRefund = async () => {
    const amount = Number(refundAmount)
    if (!amount || amount <= 0) return
    await fetch(`/api/orders/${orderId}/refund`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refund_amount: amount, refund_status: 'partial' }),
    })
    setShowRefundModal(false)
    setRefundAmount('')
    fetchOrder(orderId)
  }

  const canRefund = currentOrder.refund_status === 'none' && (currentOrder.status === 'completed' || currentOrder.status === 'stopped')

  const electricityCost = siteInfo && currentOrder.energy != null
    ? currentOrder.energy * siteInfo.electricity_price
    : (currentOrder.fee_breakdown?.electricity_cost ?? 0)

  const serviceCost = siteInfo && currentOrder.energy != null
    ? currentOrder.energy * siteInfo.service_fee
    : (currentOrder.fee_breakdown?.service_cost ?? 0)

  const qrCodeId = useMemo(() => `QR-${String(currentOrder.device_id).padStart(6, '0')}-${String(currentOrder.port_id).padStart(2, '0')}`, [currentOrder.device_id, currentOrder.port_id])
  const mockUserId = useMemo(() => `U${String(currentOrder.id * 1000 + 123).padStart(8, '0')}`, [currentOrder.id])
  const mockOperator = '系统管理员'

  const scanTime = currentOrder.scan_time || currentOrder.start_time
  const chargeStartTime = currentOrder.charge_start_time || currentOrder.start_time

  const timeline = useMemo(() => {
    const nodes = []

    nodes.push({
      label: '扫码',
      icon: <QrCode className="w-3 h-3" />,
      time: scanTime,
      operator: `用户 ${mockUserId}`,
      done: true,
    })

    nodes.push({
      label: '启动充电',
      icon: <Zap className="w-3 h-3" />,
      time: chargeStartTime,
      operator: '系统自动',
      done: currentOrder.status !== 'charging' || !!currentOrder.end_time,
    })

    if (currentOrder.end_time) {
      nodes.push({
        label: '停止充电',
        icon: <Clock className="w-3 h-3" />,
        time: currentOrder.end_time,
        operator: currentOrder.stop_reason === 'user_stop' ? `用户 ${mockUserId}` : '系统自动',
        done: true,
      })

      nodes.push({
        label: '费用结算',
        icon: <DollarSign className="w-3 h-3" />,
        time: currentOrder.end_time,
        operator: '系统自动',
        done: true,
      })
    }

    if (currentOrder.refund_status !== 'none') {
      nodes.push({
        label: '退款申请',
        icon: <RotateCcw className="w-3 h-3" />,
        time: currentOrder.updated_at,
        operator: mockOperator,
        done: currentOrder.refund_status === 'refunded' || currentOrder.refund_status === 'rejected',
      })

      if (currentOrder.refund_status === 'refunded' || currentOrder.refund_status === 'rejected') {
        nodes.push({
          label: currentOrder.refund_status === 'refunded' ? '退款完成' : '退款被拒',
          icon: currentOrder.refund_status === 'refunded' ? <DollarSign className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />,
          time: currentOrder.updated_at,
          operator: mockOperator,
          done: true,
        })
      }
    }

    return nodes
  }, [currentOrder, scanTime, chargeStartTime, mockUserId, mockOperator])

  const currentStepIndex = useMemo(() => {
    let lastDoneIndex = -1
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (timeline[i].done) {
        lastDoneIndex = i
        break
      }
    }
    return lastDoneIndex >= 0 ? lastDoneIndex : 0
  }, [timeline])

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft className="w-4 h-4" /> 返回订单列表
      </button>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">订单 #{currentOrder.id}</h2>
          {canRefund && (
            <button onClick={() => setShowRefundModal(true)} className="flex items-center gap-1 text-amber-600 border border-amber-200 px-3 py-1 rounded text-sm hover:bg-amber-50">
              <RotateCcw className="w-3 h-3" /> 退款
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <div>
            <span className="text-slate-500">设备：</span>
            <Link
              to={`/devices/${currentOrder.device_id}`}
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <Monitor className="w-3 h-3" />
              {currentOrder.device_name || `#${currentOrder.device_id}`}
            </Link>
          </div>
          <div><span className="text-slate-500">端口：</span>#{currentOrder.port_id}</div>
          <div>
            <span className="text-slate-500">站点：</span>
            <Link
              to={`/sites/${currentOrder.site_id}`}
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <MapPin className="w-3 h-3" />
              {currentOrder.site_name || `#${currentOrder.site_id}`}
            </Link>
          </div>
          <div><span className="text-slate-500">开始时间：</span>{new Date(currentOrder.start_time).toLocaleString()}</div>
          <div><span className="text-slate-500">结束时间：</span>{currentOrder.end_time ? new Date(currentOrder.end_time).toLocaleString() : '-'}</div>
          <div><span className="text-slate-500">时长：</span>{currentOrder.duration?.toFixed(0) ?? '-'} 分钟</div>
          <div><span className="text-slate-500">电量：</span>{currentOrder.energy?.toFixed(2) ?? '-'} kWh</div>
          <div><span className="text-slate-500">费用：</span>¥{currentOrder.cost?.toFixed(2) ?? '0.00'}</div>
          <div><span className="text-slate-500">订单状态：</span><StatusBadge status={currentOrder.status} /></div>
          <div><span className="text-slate-500">退款状态：</span><StatusBadge status={currentOrder.refund_status} /></div>
          {currentOrder.refund_amount > 0 && <div><span className="text-slate-500">退款金额：</span>¥{currentOrder.refund_amount.toFixed(2)}</div>}
          {relatedWorkOrders.length > 0 && (
            <div>
              <span className="text-slate-500">关联工单：</span>
              {relatedWorkOrders.slice(0, 3).map(wo => (
                <Link
                  key={wo.id}
                  to={`/work-orders/${wo.id}`}
                  className="text-blue-600 hover:underline inline-flex items-center gap-1 ml-1"
                >
                  <ClipboardList className="w-3 h-3" />
                  #{wo.id}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          扫码启动记录
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <QrCode className="w-3 h-3" />
              二维码编号
            </div>
            <p className="text-sm font-medium text-slate-800 font-mono">{qrCodeId}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <User className="w-3 h-3" />
              用户ID
            </div>
            <p className="text-sm font-medium text-slate-800 font-mono">{mockUserId}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">扫码时间</p>
            <p className="text-sm font-medium text-slate-800">{new Date(scanTime).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">启动时间</p>
            <p className="text-sm font-medium text-slate-800">{new Date(chargeStartTime).toLocaleString()}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">结束时间</p>
            <p className="text-sm font-medium text-slate-800">{currentOrder.end_time ? new Date(currentOrder.end_time).toLocaleString() : '-'}</p>
          </div>
        </div>
        {currentOrder.duration != null && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-slate-600">充电时长</span>
            <span className="text-lg font-semibold text-blue-600">{currentOrder.duration.toFixed(0)} 分钟</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          停止原因
        </h3>
        <div className="p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">停止类型</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              currentOrder.stop_reason === 'fault'
                ? 'bg-red-100 text-red-700'
                : currentOrder.stop_reason === 'user_stop'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {stopReasonLabels[currentOrder.stop_reason ?? ''] || currentOrder.stop_reason || '未知'}
            </span>
          </div>
          {currentOrder.stop_reason === 'fault' && (
            <div className="mb-3">
              <span className="text-sm text-slate-500">故障描述</span>
              <p className="text-sm text-red-600 mt-1 p-2 bg-red-50 rounded">
                设备通信异常，充电过程中断
              </p>
            </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200">
            <span className="text-sm text-slate-500">停止时间</span>
            <span className="text-sm font-medium text-slate-800">
              {currentOrder.end_time ? new Date(currentOrder.end_time).toLocaleString() : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          费用明细
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">电费</p>
            <p className="text-lg font-semibold text-slate-800">
              ¥{electricityCost.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">服务费</p>
            <p className="text-lg font-semibold text-slate-800">
              ¥{serviceCost.toFixed(2)}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">总费用</p>
            <p className="text-lg font-semibold text-slate-800">¥{currentOrder.cost?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-500">退款金额</p>
            <p className="text-lg font-semibold text-amber-600">
              {currentOrder.refund_amount > 0 ? `¥${currentOrder.refund_amount.toFixed(2)}` : '¥0.00'}
            </p>
          </div>
        </div>

        {siteInfo && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-700 mb-2">单价明细</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">电价</span>
                <span className="font-medium text-slate-800">¥{siteInfo.electricity_price.toFixed(2)}/kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">服务费</span>
                <span className="font-medium text-slate-800">¥{siteInfo.service_fee.toFixed(2)}/kWh</span>
              </div>
            </div>
          </div>
        )}

        {siteInfo && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-medium text-blue-700 mb-3">费用计算公式</p>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between items-center">
                <span>电费 = 电量 × 电价</span>
                <span className="font-mono">{currentOrder.energy?.toFixed(2) ?? 0} kWh × ¥{siteInfo.electricity_price.toFixed(2)}/kWh</span>
              </div>
              <div className="flex justify-between items-center">
                <span>服务费 = 电量 × 服务费单价</span>
                <span className="font-mono">{currentOrder.energy?.toFixed(2) ?? 0} kWh × ¥{siteInfo.service_fee.toFixed(2)}/kWh</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span>电费计算</span>
                  <span className="font-medium">= ¥{electricityCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span>服务费计算</span>
                  <span className="font-medium">= ¥{serviceCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span>总费用</span>
                  <span className="font-semibold text-slate-800">= ¥{currentOrder.cost?.toFixed(2) ?? '0.00'}</span>
                </div>
              </div>
              {currentOrder.refund_amount > 0 && (
                <div className="border-t border-blue-200 pt-2 mt-2">
                  <div className="flex justify-between items-center text-amber-600">
                    <span>退款扣减</span>
                    <span className="font-medium">- ¥{currentOrder.refund_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-1 border-t border-blue-100">
                    <span className="font-semibold text-slate-800">实收金额</span>
                    <span className="font-bold text-slate-800">¥{((currentOrder.cost ?? 0) - (currentOrder.refund_amount ?? 0)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentOrder.refund_status !== 'none' && currentOrder.refund_amount > 0 && (
          <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs font-medium text-amber-700 mb-3">退款处理记录</p>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">退款金额</span>
                <span className="font-medium text-amber-600">¥{currentOrder.refund_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">退款时间</span>
                <span className="font-medium text-slate-800">{new Date(currentOrder.updated_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">退款操作人</span>
                <span className="font-medium text-slate-800">{mockOperator}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">退款状态</span>
                <StatusBadge status={currentOrder.refund_status} />
              </div>
            </div>
          </div>
        )}
      </div>

      {currentOrder.refund_status !== 'none' && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            退款处理记录
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">申请时间</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">退款金额</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">退款状态</th>
                  <th className="text-left py-2 px-3 text-slate-500 font-medium">处理人</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-3 px-3 text-slate-800">{new Date(currentOrder.updated_at).toLocaleString()}</td>
                  <td className="py-3 px-3 text-amber-600 font-medium">¥{currentOrder.refund_amount.toFixed(2)}</td>
                  <td className="py-3 px-3"><StatusBadge status={currentOrder.refund_status} /></td>
                  <td className="py-3 px-3 text-slate-800">{mockOperator}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">订单时间线</h3>
        <div className="space-y-0">
          {timeline.map((item, i) => {
            const isCurrent = i === currentStepIndex && item.done
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCurrent
                      ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                      : item.done
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {item.icon}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className={`w-0.5 h-12 ${item.done ? 'bg-blue-200' : 'bg-slate-200'}`} />
                  )}
                </div>
                <div className="pb-8 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${isCurrent ? 'text-blue-600 font-bold' : item.done ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                      {item.label}
                      {isCurrent && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">当前</span>}
                    </p>
                    {item.time && (
                      <p className="text-xs text-slate-400">{new Date(item.time).toLocaleString()}</p>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">操作人：{item.operator}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showRefundModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">退款</h3>
            <div className="mb-4">
              <label className="text-sm text-slate-500">退款金额(¥)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm mt-1"
                placeholder="请输入退款金额"
              />
              {currentOrder.cost != null && (
                <p className="text-xs text-slate-400 mt-1">订单原价：¥{currentOrder.cost.toFixed(2)}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRefundModal(false); setRefundAmount('') }}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundAmount || Number(refundAmount) <= 0}
                className="px-4 py-2 text-sm text-white bg-amber-500 rounded hover:bg-amber-600 disabled:opacity-50"
              >
                确认退款
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
