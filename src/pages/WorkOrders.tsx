import { useEffect, useState } from 'react';
import { Plus, Search, Eye, Wrench } from 'lucide-react';
import { api, WorkOrder as WorkOrderType, ApiResponse, Part, Location, StockItem } from '@/lib/api';

export default function WorkOrders() {
  const [list, setList] = useState<WorkOrderType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [selectedWo, setSelectedWo] = useState<WorkOrderType | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [stockBatches, setStockBatches] = useState<StockItem[]>([]);
  const [form, setForm] = useState({
    device_model: '',
    device_sn: '',
    customer_name: '',
    fault_description: '',
    engineer_id: 3,
    priority: 'normal',
    remark: '',
  });
  const [partForm, setPartForm] = useState({
    part_id: 0,
    location_id: 0,
    batch_no: '',
    quantity: 1,
    purpose: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [listRes, partsRes, locationsRes] = await Promise.all([
        api.get<ApiResponse<WorkOrderType[]>>('/work-orders'),
        api.get<ApiResponse<Part[]>>('/common/parts-simple'),
        api.get<ApiResponse<Location[]>>('/common/locations'),
      ]);
      setList(listRes.data || []);
      setParts(partsRes.data || []);
      setLocations(locationsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/work-orders', form);
      setShowModal(false);
      loadData();
      setForm({
        device_model: '',
        device_sn: '',
        customer_name: '',
        fault_description: '',
        engineer_id: 3,
        priority: 'normal',
        remark: '',
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/work-orders/${id}/status`, { status });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRequestPart = async () => {
    if (!selectedWo || !partForm.part_id || !partForm.location_id) return;
    try {
      await api.post(`/work-orders/${selectedWo.id}/request-part`, partForm);
      setShowPartModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const loadStockBatches = async (partId: number, locationId: number) => {
    try {
      const res = await api.get<ApiResponse<StockItem[]>>(`/common/stock-batches?part_id=${partId}&location_id=${locationId}`);
      setStockBatches(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      pending: { text: '待处理', className: 'bg-yellow-100 text-yellow-700' },
      processing: { text: '维修中', className: 'bg-blue-100 text-blue-700' },
      completed: { text: '已完成', className: 'bg-green-100 text-green-700' },
      cancelled: { text: '已取消', className: 'bg-gray-100 text-gray-700' },
    };
    return map[status] || { text: status, className: 'bg-gray-100 text-gray-700' };
  };

  const getPriorityText = (priority: string) => {
    const map: Record<string, { text: string; className: string }> = {
      high: { text: '高', className: 'bg-red-100 text-red-700' },
      normal: { text: '中', className: 'bg-yellow-100 text-yellow-700' },
      low: { text: '低', className: 'bg-gray-100 text-gray-700' },
    };
    return map[priority] || { text: priority, className: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索工单/设备..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          新建工单
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">工单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">设备型号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">客户</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">故障描述</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">工程师</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">优先级</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const statusInfo = getStatusText(item.status);
              const priorityInfo = getPriorityText(item.priority);
              return (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{item.wo_no}</td>
                  <td className="px-4 py-3">
                    <div>{item.device_model}</div>
                    <div className="text-xs text-gray-400">SN: {item.device_sn}</div>
                  </td>
                  <td className="px-4 py-3">{item.customer_name || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={item.fault_description}>
                    {item.fault_description}
                  </td>
                  <td className="px-4 py-3">{item.engineer_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${priorityInfo.className}`}>
                      {priorityInfo.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'processing')}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          开始维修
                        </button>
                      )}
                      {item.status === 'processing' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedWo(item);
                              setPartForm({ part_id: 0, location_id: 0, batch_no: '', quantity: 1, purpose: '' });
                              setShowPartModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                          >
                            <Wrench size={14} />
                            领用备件
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.id, 'completed')}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            完成
                          </button>
                        </>
                      )}
                      <button className="text-gray-600 hover:text-gray-800">
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无工单，点击右上角"新建工单"创建
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">新建工单</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">设备型号 *</label>
                  <input
                    type="text"
                    value={form.device_model}
                    onChange={e => setForm({ ...form, device_model: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">设备序列号</label>
                  <input
                    type="text"
                    value={form.device_sn}
                    onChange={e => setForm({ ...form, device_sn: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">客户名称</label>
                  <input
                    type="text"
                    value={form.customer_name}
                    onChange={e => setForm({ ...form, customer_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">优先级</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="low">低</option>
                    <option value="normal">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">故障描述 *</label>
                <textarea
                  value={form.fault_description}
                  onChange={e => setForm({ ...form, fault_description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">备注</label>
                <textarea
                  value={form.remark}
                  onChange={e => setForm({ ...form, remark: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  创建工单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPartModal && selectedWo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">申请领用备件 - {selectedWo.wo_no}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">备件 *</label>
                <select
                  value={partForm.part_id}
                  onChange={e => {
                    const partId = parseInt(e.target.value);
                    setPartForm({ ...partForm, part_id: partId });
                    if (partForm.location_id) {
                      loadStockBatches(partId, partForm.location_id);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value={0}>请选择备件</option>
                  {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">库位 *</label>
                <select
                  value={partForm.location_id}
                  onChange={e => {
                    const locId = parseInt(e.target.value);
                    setPartForm({ ...partForm, location_id: locId });
                    if (partForm.part_id) {
                      loadStockBatches(partForm.part_id, locId);
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value={0}>请选择库位</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              {stockBatches.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">批次 (可用库存)</label>
                  <select
                    value={partForm.batch_no}
                    onChange={e => setPartForm({ ...partForm, batch_no: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">自动选择批次</option>
                    {stockBatches.map(b => (
                      <option key={b.id} value={b.batch_no}>
                        {b.batch_no} - 可用 {b.available_qty} 件
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">数量 *</label>
                <input
                  type="number"
                  min="1"
                  value={partForm.quantity}
                  onChange={e => setPartForm({ ...partForm, quantity: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">用途</label>
                <textarea
                  value={partForm.purpose}
                  onChange={e => setPartForm({ ...partForm, purpose: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="请说明备件用途"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPartModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleRequestPart}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  提交申请
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
