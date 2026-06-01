import { useEffect, useState } from 'react';
import { Plus, Search, CheckCircle } from 'lucide-react';
import { api, Part, Location, ApiResponse } from '@/lib/api';

export default function Transfers() {
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({
    part_id: 0,
    from_location_id: 0,
    to_location_id: 0,
    batch_no: '',
    quantity: 1,
    remark: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [listRes, partsRes, locationsRes] = await Promise.all([
        api.get<ApiResponse<any[]>>('/inventory/transfers'),
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
      await api.post('/inventory/transfer', form);
      setShowModal(false);
      loadData();
      setForm({
        part_id: 0,
        from_location_id: 0,
        to_location_id: 0,
        batch_no: '',
        quantity: 1,
        remark: '',
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/inventory/transfer/${id}/approve`, {});
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
            placeholder="搜索调拨单..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          新增调拨
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">调拨单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">调出库位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">调入库位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm">{item.transfer_no}</td>
                <td className="px-4 py-3">
                  <div>{item.part_name}</div>
                  <div className="text-xs text-gray-400">{item.sku || ''}</div>
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{item.from_location_name}</td>
                <td className="px-4 py-3">{item.to_location_name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-sm bg-gray-100">
                    {item.status === 'pending' ? '待审批' : '已完成'}
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
            暂无调拨记录
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">新增调拨</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
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
                  <label className="block text-sm font-medium mb-1">调出库位 *</label>
                  <select
                    value={form.from_location_id}
                    onChange={e => setForm({ ...form, from_location_id: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    <option value={0}>请选择库位</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">调入库位 *</label>
                  <select
                    value={form.to_location_id}
                    onChange={e => setForm({ ...form, to_location_id: parseInt(e.target.value) })}
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
                  提交调拨
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
