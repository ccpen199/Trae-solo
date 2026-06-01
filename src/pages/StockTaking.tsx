import { useEffect, useState } from 'react';
import { Plus, Search, CheckCircle, FileText } from 'lucide-react';
import { api, Part, Location, ApiResponse } from '@/lib/api';

export default function StockTaking() {
  const [list, setList] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [form, setForm] = useState({
    location_id: 0,
    remark: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [listRes, partsRes, locationsRes] = await Promise.all([
        api.get<ApiResponse<any[]>>('/inventory/takes'),
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
      const res = await api.post<ApiResponse<any>>('/inventory/take', form);
      setShowModal(false);
      loadData();
      setForm({ location_id: 0, remark: '' });
      if (res.data) {
        setItems(res.data.items || []);
        setShowItemsModal(true);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewItems = async (id: number) => {
    try {
      const res = await api.get<ApiResponse<any[]>>(`/inventory/take/${id}/items`);
      setItems(res.data || []);
      setShowItemsModal(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/inventory/take/${id}/approve`, {});
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
            placeholder="搜索盘点单..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          新建盘点
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">盘点单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">库位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">差异数</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作人</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">时间</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm">{item.take_no}</td>
                <td className="px-4 py-3">{item.location_name}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 rounded text-sm bg-gray-100">
                    {item.status === 'draft' ? '草稿' : item.status === 'pending' ? '待审批' : '已完成'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${item.diff_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {item.diff_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{item.operator_name || '-'}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{item.created_at}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewItems(item.id)}
                      className="text-blue-600 hover:text-blue-800"
                      title="查看明细"
                    >
                      <FileText size={18} />
                    </button>
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
            暂无盘点记录
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">新建盘点</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">盘点库位 *</label>
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
                  开始盘点
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">盘点明细</h3>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">账面数量</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">实盘数量</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">差异</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-t border-gray-100">
                    <td className="px-4 py-3">{item.part_name}</td>
                    <td className="px-4 py-3">{item.system_qty}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        defaultValue={item.actual_qty ?? item.system_qty}
                        className="w-24 border border-gray-300 rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={((item.actual_qty ?? item.system_qty) - item.system_qty) !== 0 ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                        {(item.actual_qty ?? item.system_qty) - item.system_qty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowItemsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  alert('盘点保存功能待完善');
                  setShowItemsModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                提交盘点
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
