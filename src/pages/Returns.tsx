import { useEffect, useState } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { api, Part, Location, ApiResponse } from '@/lib/api';

export default function Returns() {
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({
    part_id: 0,
    location_id: 0,
    batch_no: '',
    quantity: 1,
    return_reason: '',
    condition: 'good',
    remark: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [listRes, partsRes, locationsRes] = await Promise.all([
        api.get<ApiResponse<any[]>>('/inventory/returns'),
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
      await api.post('/inventory/return', form);
      setShowModal(false);
      loadData();
      setForm({
        part_id: 0,
        location_id: 0,
        batch_no: '',
        quantity: 1,
        return_reason: '',
        condition: 'good',
        remark: '',
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/inventory/return/${id}/approve`, {});
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索退库单..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          新增退库
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">退库单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">库位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">退回原因</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状况</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm">{item.return_no}</td>
                <td className="px-4 py-3">
                  <div>{item.part_name}</div>
                  <div className="text-xs text-gray-400">{item.sku || ''}</div>
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.location_name}</td>
                <td className="px-4 py-3 text-gray-600">{item.return_reason}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-sm bg-gray-100">
                    {item.condition === 'good' ? '良好' : item.condition === 'damaged' ? '损坏' : '其他'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-sm bg-gray-100">
                    {item.status === 'pending' ? '待处理' : '已完成'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="text-green-600 hover:text-green-800"
                        title="审批"
                      >
                        <CheckCircle size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无退库记录
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">新增退库</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">备件 *</label>
                  <select
                    value={form.part_id}
                    onChange={e => setForm({ ...form, part_id: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value={0}>请选择备件</option>
                    {parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">库位 *</label>
                  <select
                    value={form.location_id}
                    onChange={e => setForm({ ...form, location_id: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value={0}>请选择库位</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">数量 *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">状况</label>
                  <select
                    value={form.condition}
                    onChange={e => setForm({ ...form, condition: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="good">良好</option>
                    <option value="damaged">损坏</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">退回原因 *</label>
                <input
                  type="text"
                  value={form.return_reason}
                  onChange={e => setForm({ ...form, return_reason: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
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
                  提交退库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
