import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const STATUS_CONFIG = {
  online: { label: '在线', color: 'bg-green-100 text-green-700' },
  offline: { label: '离线', color: 'bg-red-100 text-red-700' },
  maintenance: { label: '维护中', color: 'bg-yellow-100 text-yellow-700' },
};

const ORDER_STATUS_CONFIG = {
  pending: { label: '待处理', color: 'bg-gray-100 text-gray-700' },
  swapping: { label: '换电中', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  failed: { label: '失败', color: 'bg-red-100 text-red-700' },
  suspended: { label: '已暂停', color: 'bg-orange-100 text-orange-700' },
};

const ALERT_TYPE_LABELS = {
  high_temperature: '高温',
  leakage: '漏电',
  door_anomaly: '柜门异常',
  swap_failure: '换电失败',
  user_complaint: '用户申诉',
};

const WORK_ORDER_STATUS_LABELS = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '处理中',
  completed: '已完成',
  closed: '已关闭',
};

const RESERVATION_STATUS_LABELS = {
  cancelled: '已取消',
  requeued: '已重排',
};

function parseSqliteDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string') {
    const fixed = dateStr.replace(' ', 'T').slice(0, 19);
    const d = new Date(fixed);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateTime(dateStr) {
  const d = parseSqliteDate(dateStr);
  if (!d) return typeof dateStr === 'string' ? dateStr : '-';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hour}:${min}`;
}

function formatTime(dateStr) {
  const d = parseSqliteDate(dateStr);
  if (!d) return typeof dateStr === 'string' && dateStr.length >= 16 ? dateStr.slice(11, 16) : '-';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [requeuingId, setRequeuingId] = useState(null);
  const [suspendingId, setSuspendingId] = useState(null);
  const [actionResult, setActionResult] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (actionResult) {
      const timer = setTimeout(() => setActionResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionResult]);

  async function fetchDashboard() {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getDashboard();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelReservation(id, plateNumber) {
    try {
      setCancellingId(id);
      await api.updateReservation(id, {
        status: 'cancelled',
        action_by: '值班员',
        action_note: `取消 ${plateNumber} 的预约排队`,
      });
      setData((prev) => {
        const updated = prev.reservations.filter((r) => r.id !== id);
        const cancelled = prev.reservations.find((r) => r.id === id);
        return {
          ...prev,
          reservations: updated,
          historyReservations: cancelled
            ? [{ ...cancelled, status: 'cancelled', action_by: '值班员', action_at: new Date().toISOString().replace('T', ' ').slice(0, 19), action_note: `取消 ${plateNumber} 的预约排队` }, ...(prev.historyReservations || [])]
            : prev.historyReservations,
        };
      });
      setActionResult({ success: true, message: `已取消 ${plateNumber} 的预约排队` });
    } catch (err) {
      setActionResult({ success: false, message: `取消失败: ${err.message}` });
    } finally {
      setCancellingId(null);
    }
  }

  async function handleRequeueReservation(id, plateNumber) {
    try {
      setRequeuingId(id);
      await api.updateReservation(id, {
        status: 'requeued',
        action_by: '值班员',
        action_note: `严重超时重新排队 ${plateNumber}`,
      });
      setData((prev) => {
        const requeued = prev.reservations.find((r) => r.id === id);
        const updated = prev.reservations.filter((r) => r.id !== id);
        return {
          ...prev,
          reservations: updated,
          historyReservations: requeued
            ? [{ ...requeued, status: 'requeued', action_by: '值班员', action_at: new Date().toISOString().replace('T', ' ').slice(0, 19), action_note: `严重超时重新排队 ${plateNumber}` }, ...(prev.historyReservations || [])]
            : prev.historyReservations,
        };
      });
      setActionResult({ success: true, message: `${plateNumber} 已重新排队` });
    } catch (err) {
      setActionResult({ success: false, message: `重新排队失败: ${err.message}` });
    } finally {
      setRequeuingId(null);
    }
  }

  async function handleSuspendOrder(orderId, orderNo) {
    try {
      setSuspendingId(orderId);
      await api.updateOrderStatus(orderId, {
        status: 'suspended',
        suspend_reason: '目标电池异常已锁止，暂停派柜等待安全处置',
      });
      setData((prev) => ({
        ...prev,
        recentOrders: prev.recentOrders.map((o) =>
          o.id === orderId
            ? { ...o, status: 'suspended', suspend_reason: '目标电池异常已锁止，暂停派柜等待安全处置', battery_locked: true, cabinet_blocked: true }
            : o
        ),
      }));
      setActionResult({ success: true, message: `${orderNo} 已暂停，禁止继续派柜` });
    } catch (err) {
      setActionResult({ success: false, message: `暂停失败: ${err.message}` });
    } finally {
      setSuspendingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
        <span className="ml-3 text-gray-500">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 mb-3">加载失败: {error}</p>
        <button onClick={fetchDashboard} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">重试</button>
      </div>
    );
  }

  const { station, batteryStats, reservations, historyReservations = [], dynamicWait, recentOrders } = data;
  const baseWait = dynamicWait.base_minutes;
  const dynWait = dynamicWait.dynamic_minutes;

  const statCards = [
    { key: 'available', label: '可用电池', count: batteryStats.available, iconColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: '🔋' },
    { key: 'charging', label: '充电中', count: batteryStats.charging, iconColor: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: '⚡' },
    { key: 'abnormal', label: '异常电池', count: batteryStats.abnormal, iconColor: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: '⚠️' },
    { key: 'maintenance', label: '维护中', count: batteryStats.maintenance, iconColor: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: '🔧' },
  ];

  const statusInfo = STATUS_CONFIG[station.status] || STATUS_CONFIG.offline;

  return (
    <div className="space-y-6">
      {actionResult && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          actionResult.success ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {actionResult.success ? '✅' : '❌'} {actionResult.message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-800">{station.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
            </div>
            <p className="text-gray-500 mt-1">📍 {station.address}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">预计等待时间</p>
            <div className="flex items-baseline gap-2 justify-end">
              <p className={`text-3xl font-bold ${dynWait > baseWait ? 'text-orange-600' : 'text-blue-600'}`}>
                {dynWait}
              </p>
              <span className="text-base font-normal text-gray-400">分钟</span>
            </div>
            {dynWait > baseWait && (
              <p className="text-xs text-orange-500 mt-1">
                基准 {baseWait} 分钟 · 队列超时上浮 +{dynWait - baseWait} 分钟
                ({dynamicWait.severe_overtime_count} 严重超时, {dynamicWait.overtime_count} 超时)
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.key} className={`${card.bgColor} ${card.borderColor} border rounded-xl p-5`}>
            <div className="flex items-center justify-between">
              <span className="text-2xl">{card.icon}</span>
              <span className={`text-3xl font-bold ${card.iconColor}`}>{card.count}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">预约排队</h3>
            <span className="text-sm text-gray-400">共 {reservations.length} 辆等待</span>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1"
          >
            {showHistory ? '收起记录 ▲' : `处置记录 (${historyReservations.length}) ▼`}
          </button>
        </div>

        {reservations.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">暂无排队预约</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 bg-gray-50">
                  <th className="px-4 py-3 font-medium">优先级</th>
                  <th className="px-4 py-3 font-medium">车牌号</th>
                  <th className="px-4 py-3 font-medium">车主</th>
                  <th className="px-4 py-3 font-medium">到站时间</th>
                  <th className="px-4 py-3 font-medium">已等待</th>
                  <th className="px-4 py-3 font-medium">超时状态</th>
                  <th className="px-4 py-3 font-medium text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reservations.map((r, idx) => {
                  const arrived = parseSqliteDate(r.created_at);
                  const now = new Date();
                  const waitMin = arrived ? Math.max(0, Math.round((now - arrived) / 60000)) : null;
                  const overtime = waitMin != null && waitMin > baseWait;
                  const severeOvertime = waitMin != null && waitMin > baseWait * 2;

                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${severeOvertime ? 'bg-red-50/50' : overtime ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                          severeOvertime ? 'bg-red-100 text-red-700' : overtime ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-medium">{r.plate_number}</td>
                      <td className="px-4 py-3 text-sm">{r.owner_name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-gray-700">{formatDateTime(r.created_at)}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {waitMin != null ? (
                          <span className={`font-medium ${severeOvertime ? 'text-red-600' : overtime ? 'text-orange-600' : 'text-gray-600'}`}>
                            {waitMin} 分钟
                          </span>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {severeOvertime ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">严重超时 (>{baseWait * 2}分)</span>
                        ) : overtime ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">超时 (>{baseWait}分)</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">正常</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        {(overtime || severeOvertime) && (
                          <button
                            onClick={() => handleRequeueReservation(r.id, r.plate_number)}
                            disabled={requeuingId === r.id}
                            className="px-3 py-1.5 text-sm text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {requeuingId === r.id ? '处理中...' : '重新排队'}
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelReservation(r.id, r.plate_number)}
                          disabled={cancellingId === r.id}
                          className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {cancellingId === r.id ? '取消中...' : '取消预约'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showHistory && historyReservations.length > 0 && (
          <div className="border-t">
            <div className="px-6 py-3 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-600">处置记录（可复查）</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-400 bg-gray-50/50">
                    <th className="px-4 py-2 font-medium">车牌号</th>
                    <th className="px-4 py-2 font-medium">处置类型</th>
                    <th className="px-4 py-2 font-medium">处理人</th>
                    <th className="px-4 py-2 font-medium">处理时间</th>
                    <th className="px-4 py-2 font-medium">原到站时间</th>
                    <th className="px-4 py-2 font-medium">处置说明</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {historyReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2 font-mono text-xs">{r.plate_number}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          r.status === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {RESERVATION_STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-700">{r.action_by || '-'}</td>
                      <td className="px-4 py-2 text-xs text-gray-500">{formatDateTime(r.action_at)}</td>
                      <td className="px-4 py-2 text-xs text-gray-400">{formatDateTime(r.created_at)}</td>
                      <td className="px-4 py-2 text-xs text-gray-600">{r.action_note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">最近订单</h3>
          <button onClick={() => navigate('/orders')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">查看全部 →</button>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400">暂无订单记录</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 bg-gray-50">
                  <th className="px-3 py-3 font-medium">订单号</th>
                  <th className="px-3 py-3 font-medium">车牌号</th>
                  <th className="px-3 py-3 font-medium">状态</th>
                  <th className="px-3 py-3 font-medium">出库电池</th>
                  <th className="px-3 py-3 font-medium">入库电池</th>
                  <th className="px-3 py-3 font-medium">柜位</th>
                  <th className="px-3 py-3 font-medium">操作时间</th>
                  <th className="px-3 py-3 font-medium">费用/权益</th>
                  <th className="px-3 py-3 font-medium">异常/处置</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentOrders.map((o) => {
                  const orderStatus = ORDER_STATUS_CONFIG[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-700' };
                  const isPending = o.status === 'pending' && !o.battery_in_id;
                  const isPendingAbnormal = (o.status === 'pending' || o.status === 'swapping') && o.battery_in_status === 'abnormal';
                  const isSuspended = o.status === 'suspended';
                  const hasAlerts = o.linked_alerts && o.linked_alerts.length > 0;
                  const hasWorkOrders = o.linked_work_orders && o.linked_work_orders.length > 0;

                  return (
                    <tr key={o.id} className={`hover:bg-gray-50 transition-colors ${
                      o.status === 'failed' ? 'bg-red-50/40' :
                      isSuspended ? 'bg-orange-50/30' :
                      isPendingAbnormal ? 'bg-yellow-50/30' :
                      isPending && !o.execution_readiness?.can_execute ? 'bg-gray-50/50' : ''
                    }`}>
                      <td className="px-3 py-3 font-mono text-xs">{o.order_no}</td>
                      <td className="px-3 py-3 text-sm">{o.plate_number}</td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${orderStatus.color}`}>
                          {orderStatus.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {o.battery_out_code ? (
                          <span className="text-orange-700 font-mono">{o.battery_out_code}</span>
                        ) : isPending || isPendingAbnormal || isSuspended ? (
                          <span className="text-gray-400">待出库</span>
                        ) : <span className="text-gray-300">-</span>}
                        {o.battery_out_soc != null && o.battery_out_code && (
                          <span className="ml-1 text-gray-400">({o.battery_out_soc}%)</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {o.battery_in_code ? (
                          <div>
                            <span className={isSuspended || isPendingAbnormal ? 'text-red-600 font-mono font-bold' : 'text-green-700 font-mono'}>
                              {o.battery_in_code}
                            </span>
                            {(isSuspended || o.battery_locked) && (
                              <div className="text-red-600 mt-0.5 font-medium">🔒 已锁止 · 禁止出库</div>
                            )}
                            {o.battery_in_fault_code && (isSuspended || isPendingAbnormal) && (
                              <div className="text-red-500 mt-0.5">故障码: {o.battery_in_fault_code}</div>
                            )}
                          </div>
                        ) : isPending ? (
                          <span className="text-gray-400">待分配</span>
                        ) : <span className="text-gray-300">-</span>}
                        {o.battery_in_soc != null && o.battery_in_code && (
                          <span className="ml-1 text-gray-400">({o.battery_in_soc}%)</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {o.slot_number != null ? (
                          <div>
                            <span className={isSuspended ? 'text-red-600 line-through' : isPendingAbnormal ? 'text-orange-600' : 'text-blue-600'}>
                              {isSuspended ? '禁止派柜' : isPendingAbnormal ? '暂停派柜' : (isPending ? '预约 ' : '')}#{o.slot_number}
                            </span>
                          </div>
                        ) : isPending || isSuspended ? (
                          <span className="text-gray-400">待分配</span>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {o.swap_start_time ? (
                          <span>{formatTime(o.swap_start_time)}{o.swap_end_time ? <span className="text-gray-400">→{formatTime(o.swap_end_time)}</span> : null}</span>
                        ) : isSuspended ? (
                          <span className="text-orange-600">已暂停</span>
                        ) : isPending || isPendingAbnormal ? (
                          <span className="text-gray-400">等待开始</span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        <div className="font-medium">¥{o.actual_fee?.toFixed(2) ?? '0.00'}</div>
                        {o.member_benefit && (
                          <div className="text-xs text-blue-600 mt-0.5">{o.member_benefit} (-¥{o.discount_amount?.toFixed(2)})</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {o.status === 'failed' ? (
                          <div>
                            <div className="text-red-600 font-medium">{o.failure_reason || '未知原因'}</div>
                            <button onClick={(e) => { e.stopPropagation(); navigate('/safety'); }} className="text-blue-600 underline hover:text-blue-800 mt-1">安全处置 →</button>
                          </div>
                        ) : isSuspended ? (
                          <div className="space-y-1">
                            <div className="text-orange-600 font-medium">� 订单已暂停</div>
                            <div className="text-gray-600">{o.suspend_reason}</div>
                            {hasAlerts && o.linked_alerts.map((a, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  a.severity === 'critical' ? 'bg-red-100 text-red-700' : a.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {ALERT_TYPE_LABELS[a.alert_type] || a.alert_type}
                                </span>
                                <span className="text-gray-400">#{a.id}</span>
                              </div>
                            ))}
                            {hasWorkOrders && (
                              <div className="mt-1">
                                {o.linked_work_orders.map((wo, i) => (
                                  <div key={i} className="text-gray-600">
                                    工单#{wo.id} · {WORK_ORDER_STATUS_LABELS[wo.status] || wo.status}
                                    {wo.assigned_to && <span className="text-blue-600 ml-1">({wo.assigned_to})</span>}
                                  </div>
                                ))}
                              </div>
                            )}
                            {o.can_resume ? (
                              <div className="text-green-600 font-medium mt-1">✅ 工单已完成，可复查放行</div>
                            ) : (
                              <div className="text-orange-500 mt-1">⏳ 等待工单完成</div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); navigate('/safety'); }} className="text-blue-600 underline hover:text-blue-800 mt-1">查看告警 →</button>
                          </div>
                        ) : isPendingAbnormal ? (
                          <div className="space-y-1">
                            <div className="text-red-600 font-medium">🔒 电池异常锁止</div>
                            {hasAlerts && o.linked_alerts.map((a, i) => (
                              <div key={i}>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  a.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                }`}>
                                  {ALERT_TYPE_LABELS[a.alert_type] || a.alert_type}
                                </span>
                              </div>
                            ))}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSuspendOrder(o.id, o.order_no); }}
                              disabled={suspendingId === o.id}
                              className="px-2 py-1 text-xs text-orange-600 border border-orange-300 rounded hover:bg-orange-50 disabled:opacity-50 mt-1"
                            >
                              {suspendingId === o.id ? '暂停中...' : '暂停订单 · 禁止派柜'}
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); navigate('/safety'); }} className="text-blue-600 underline hover:text-blue-800 ml-2 text-xs">转安全处置 →</button>
                          </div>
                        ) : isPending && o.execution_readiness ? (
                          <div className="space-y-1">
                            {o.execution_readiness.can_execute ? (
                              <div className="text-green-600 font-medium">✅ 可执行换电</div>
                            ) : (
                              <div className="text-red-600 font-medium">❌ 暂不可执行</div>
                            )}
                            <div className="text-gray-500 text-xs">
                              可用电池: <span className={o.execution_readiness.available_batteries > 0 ? 'text-green-600' : 'text-red-600'}>{o.execution_readiness.available_batteries}</span>
                              {' · '}
                              可用柜位: <span className={o.execution_readiness.available_slots > 0 ? 'text-green-600' : 'text-red-600'}>{o.execution_readiness.available_slots}</span>
                            </div>
                            {o.execution_readiness.blockers.length > 0 && (
                              <div className="text-red-500 text-xs">
                                {o.execution_readiness.blockers.map((b, i) => <div key={i}>阻断: {b}</div>)}
                              </div>
                            )}
                            {!o.execution_readiness.can_execute && (
                              <button onClick={(e) => { e.stopPropagation(); navigate('/safety'); }} className="text-blue-600 underline hover:text-blue-800 text-xs mt-1">转异常处置 →</button>
                            )}
                          </div>
                        ) : <span className="text-gray-300">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
