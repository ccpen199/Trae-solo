import { useState, useEffect } from 'react';
import { api } from '../api';

const ALERT_TYPES = [
  { value: 'all', label: '全部类型' },
  { value: 'high_temperature', label: '高温告警' },
  { value: 'leakage', label: '泄漏告警' },
  { value: 'door_anomaly', label: '舱门异常' },
  { value: 'swap_failure', label: '换电故障' },
  { value: 'user_complaint', label: '用户投诉' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: '全部等级' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '严重' },
];

const ALERT_STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'open', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
];

const WORK_ORDER_TYPES = [
  { value: 'all', label: '全部类型' },
  { value: 'inspection', label: '巡检' },
  { value: 'repair', label: '维修' },
  { value: 'replacement', label: '更换' },
  { value: 'complaint_handling', label: '投诉处理' },
];

const WORK_ORDER_STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待分配' },
  { value: 'assigned', label: '已分配' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
];

const ALERT_TYPE_ICONS = {
  high_temperature: '🌡️',
  leakage: '💧',
  door_anomaly: '🚪',
  swap_failure: '⚡',
  user_complaint: '📢',
};

const ALERT_TYPE_LABELS = {
  high_temperature: '高温',
  leakage: '泄漏',
  door_anomaly: '舱门异常',
  swap_failure: '换电故障',
  user_complaint: '用户投诉',
};

const SEVERITY_COLORS = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const ALERT_STATUS_COLORS = {
  open: 'bg-red-100 text-red-700',
  processing: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-700',
};

const ALERT_STATUS_LABELS = {
  open: '待处理',
  processing: '处理中',
  resolved: '已解决',
};

const WORK_ORDER_TYPE_LABELS = {
  inspection: '巡检',
  repair: '维修',
  replacement: '更换',
  complaint_handling: '投诉处理',
};

const WORK_ORDER_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-500',
};

const WORK_ORDER_STATUS_LABELS = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  completed: '已完成',
  closed: '已关闭',
};

function SelectFilter({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Badge({ label, colorClass, icon }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {icon && <span className="mr-1">{icon}</span>}
      {label}
    </span>
  );
}

export default function Safety() {
  const [activeTab, setActiveTab] = useState('alerts');

  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertFilterType, setAlertFilterType] = useState('all');
  const [alertFilterSeverity, setAlertFilterSeverity] = useState('all');
  const [alertFilterStatus, setAlertFilterStatus] = useState('all');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({
    station_id: '',
    battery_id: '',
    alert_type: 'high_temperature',
    severity: 'low',
    description: '',
  });

  const [workOrders, setWorkOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilterType, setOrderFilterType] = useState('all');
  const [orderFilterStatus, setOrderFilterStatus] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    alert_id: '',
    station_id: '',
    battery_id: '',
    type: 'inspection',
    description: '',
    assigned_to: '',
  });

  const [resolutionModal, setResolutionModal] = useState({ open: false, orderId: null, resolution: '' });

  const buildAlertParams = () => {
    const params = [];
    if (alertFilterType !== 'all') params.push(`alert_type=${alertFilterType}`);
    if (alertFilterSeverity !== 'all') params.push(`severity=${alertFilterSeverity}`);
    if (alertFilterStatus !== 'all') params.push(`status=${alertFilterStatus}`);
    return params.join('&');
  };

  const buildOrderParams = () => {
    const params = [];
    if (orderFilterType !== 'all') params.push(`type=${orderFilterType}`);
    if (orderFilterStatus !== 'all') params.push(`status=${orderFilterStatus}`);
    return params.join('&');
  };

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const data = await api.getAlerts(buildAlertParams());
      setAlerts(Array.isArray(data) ? data : data.alerts || []);
    } catch {
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const fetchWorkOrders = async () => {
    setOrdersLoading(true);
    try {
      const data = await api.getWorkOrders(buildOrderParams());
      setWorkOrders(Array.isArray(data) ? data : data.work_orders || []);
    } catch {
      setWorkOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [alertFilterType, alertFilterSeverity, alertFilterStatus]);

  useEffect(() => {
    fetchWorkOrders();
  }, [orderFilterType, orderFilterStatus]);

  const handleCreateAlert = async () => {
    try {
      await api.createAlert(alertForm);
      setShowAlertModal(false);
      setAlertForm({ station_id: '', battery_id: '', alert_type: 'high_temperature', severity: 'low', description: '' });
      fetchAlerts();
    } catch (err) {
      alert('创建告警失败: ' + err.message);
    }
  };

  const handleAlertAction = async (id, status) => {
    try {
      await api.updateAlert(id, { status });
      fetchAlerts();
    } catch (err) {
      alert('操作失败: ' + err.message);
    }
  };

  const handleCreateOrder = async () => {
    try {
      await api.createWorkOrder(orderForm);
      setShowOrderModal(false);
      setOrderForm({ alert_id: '', station_id: '', battery_id: '', type: 'inspection', description: '', assigned_to: '' });
      fetchWorkOrders();
    } catch (err) {
      alert('创建工单失败: ' + err.message);
    }
  };

  const handleAssignOrder = async (id) => {
    const assignedTo = prompt('请输入分配给谁:');
    if (!assignedTo) return;
    try {
      await api.updateWorkOrder(id, { assigned_to: assignedTo, status: 'assigned' });
      fetchWorkOrders();
    } catch (err) {
      alert('分配失败: ' + err.message);
    }
  };

  const handleCompleteOrder = async () => {
    const { orderId, resolution } = resolutionModal;
    if (!resolution.trim()) return;
    try {
      await api.updateWorkOrder(orderId, { status: 'completed', resolution });
      setResolutionModal({ open: false, orderId: null, resolution: '' });
      fetchWorkOrders();
    } catch (err) {
      alert('操作失败: ' + err.message);
    }
  };

  const tabs = [
    { key: 'alerts', label: '安全告警' },
    { key: 'orders', label: '工单管理' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">安全告警 & 工单管理</h2>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'alerts' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <SelectFilter value={alertFilterType} onChange={setAlertFilterType} options={ALERT_TYPES} />
            <SelectFilter value={alertFilterSeverity} onChange={setAlertFilterSeverity} options={SEVERITY_OPTIONS} />
            <SelectFilter value={alertFilterStatus} onChange={setAlertFilterStatus} options={ALERT_STATUS_OPTIONS} />
            <div className="flex-1" />
            <button
              onClick={() => setShowAlertModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + 新建告警
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">告警类型</th>
                  <th className="px-4 py-3 text-left font-medium">严重等级</th>
                  <th className="px-4 py-3 text-left font-medium">描述</th>
                  <th className="px-4 py-3 text-left font-medium">电池ID</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">创建时间</th>
                  <th className="px-4 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alertsLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">加载中...</td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">暂无告警数据</td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{alert.id}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                          colorClass="bg-blue-50 text-blue-700"
                          icon={ALERT_TYPE_ICONS[alert.alert_type]}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={SEVERITY_OPTIONS.find((s) => s.value === alert.severity)?.label || alert.severity}
                          colorClass={SEVERITY_COLORS[alert.severity] || 'bg-gray-100 text-gray-700'}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{alert.description}</td>
                      <td className="px-4 py-3">
                        <span className="text-blue-600 hover:underline cursor-pointer">{alert.battery_id}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={ALERT_STATUS_LABELS[alert.status] || alert.status}
                          colorClass={ALERT_STATUS_COLORS[alert.status] || 'bg-gray-100 text-gray-700'}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{alert.created_at}</td>
                      <td className="px-4 py-3">
                        {alert.status === 'open' && (
                          <button
                            onClick={() => handleAlertAction(alert.id, 'processing')}
                            className="text-yellow-600 hover:text-yellow-800 text-xs font-medium"
                          >
                            处理
                          </button>
                        )}
                        {alert.status === 'processing' && (
                          <button
                            onClick={() => handleAlertAction(alert.id, 'resolved')}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            解决
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <SelectFilter value={orderFilterType} onChange={setOrderFilterType} options={WORK_ORDER_TYPES} />
            <SelectFilter value={orderFilterStatus} onChange={setOrderFilterStatus} options={WORK_ORDER_STATUS_OPTIONS} />
            <div className="flex-1" />
            <button
              onClick={() => setShowOrderModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              + 新建工单
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">类型</th>
                  <th className="px-4 py-3 text-left font-medium">站点ID</th>
                  <th className="px-4 py-3 text-left font-medium">电池ID</th>
                  <th className="px-4 py-3 text-left font-medium">负责人</th>
                  <th className="px-4 py-3 text-left font-medium">描述</th>
                  <th className="px-4 py-3 text-left font-medium">状态</th>
                  <th className="px-4 py-3 text-left font-medium">解决结果</th>
                  <th className="px-4 py-3 text-left font-medium">创建时间</th>
                  <th className="px-4 py-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ordersLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-400">加载中...</td>
                  </tr>
                ) : workOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-400">暂无工单数据</td>
                  </tr>
                ) : (
                  workOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{order.id}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={WORK_ORDER_TYPE_LABELS[order.type] || order.type}
                          colorClass="bg-purple-50 text-purple-700"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-600">{order.station_id}</td>
                      <td className="px-4 py-3">
                        <span className="text-blue-600 hover:underline cursor-pointer">{order.battery_id}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{order.assigned_to || '-'}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{order.description}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={WORK_ORDER_STATUS_LABELS[order.status] || order.status}
                          colorClass={WORK_ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{order.resolution || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{order.created_at}</td>
                      <td className="px-4 py-3">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleAssignOrder(order.id)}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            分配
                          </button>
                        )}
                        {(order.status === 'assigned' || order.status === 'in_progress') && (
                          <button
                            onClick={() => setResolutionModal({ open: true, orderId: order.id, resolution: '' })}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            完成
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAlertModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">新建告警</h3>
            <div className="space-y-3">
              <input
                placeholder="站点 ID"
                value={alertForm.station_id}
                onChange={(e) => setAlertForm({ ...alertForm, station_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="电池 ID"
                value={alertForm.battery_id}
                onChange={(e) => setAlertForm({ ...alertForm, battery_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={alertForm.alert_type}
                onChange={(e) => setAlertForm({ ...alertForm, alert_type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {ALERT_TYPES.filter((o) => o.value !== 'all').map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={alertForm.severity}
                onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {SEVERITY_OPTIONS.filter((o) => o.value !== 'all').map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <textarea
                placeholder="告警描述"
                value={alertForm.description}
                onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateAlert}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">新建工单</h3>
            <div className="space-y-3">
              <input
                placeholder="关联告警 ID"
                value={orderForm.alert_id}
                onChange={(e) => setOrderForm({ ...orderForm, alert_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="站点 ID"
                value={orderForm.station_id}
                onChange={(e) => setOrderForm({ ...orderForm, station_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="电池 ID"
                value={orderForm.battery_id}
                onChange={(e) => setOrderForm({ ...orderForm, battery_id: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={orderForm.type}
                onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {WORK_ORDER_TYPES.filter((o) => o.value !== 'all').map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <textarea
                placeholder="工单描述"
                value={orderForm.description}
                onChange={(e) => setOrderForm({ ...orderForm, description: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <input
                placeholder="分配给"
                value={orderForm.assigned_to}
                onChange={(e) => setOrderForm({ ...orderForm, assigned_to: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowOrderModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCreateOrder}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {resolutionModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">完成工单</h3>
            <textarea
              placeholder="请输入解决结果"
              value={resolutionModal.resolution}
              onChange={(e) => setResolutionModal({ ...resolutionModal, resolution: e.target.value })}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setResolutionModal({ open: false, orderId: null, resolution: '' })}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleCompleteOrder}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                确认完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
