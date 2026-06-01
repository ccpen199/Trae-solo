import { useEffect, useState } from 'react';
import { Plus, Search, CheckCircle, XCircle, FileText } from 'lucide-react';
import { api, StockIn as StockInType, ApiResponse, Supplier, Location, Part } from '@/lib/api';

export default function StockIn() {
  const [list, setList] = useState<StockInType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [form, setForm] = useState({
    supplier_id: 1,
    batch_no: '',
    part_id: 1,
    location_id: 1,
    quantity: 1,
    unit_price: 0,
    expire_date: '',
    remark: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [listRes, suppliersRes, locationsRes, partsRes] = await Promise.all([
        api.get<ApiResponse<StockInType[]>>('/stock-in'),
        api.get<ApiResponse<Supplier[]>>('/common/suppliers'),
        api.get<ApiResponse<Location[]>>('/common/locations'),
        api.get<ApiResponse<Part[]>>('/common/parts-simple'),
      ]);
      setList(listRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setLocations(locationsRes.data || []);
      setParts(partsRes.data || []);
      if (partsRes.data && partsRes.data.length > 0) {
        setForm(f => ({ ...f, part_id: partsRes.data[0].id, unit_price: partsRes.data[0].purchase_price }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/stock-in', form);
      setShowModal(false);
      loadData();
      setForm({
        supplier_id: 1,
        batch_no: '',
        part_id: parts[0]?.id || 1,
        location_id: 1,
        quantity: 1,
        unit_price: parts[0]?.purchase_price || 0,
        expire_date: '',
        remark: '',
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInspect = async (id: number, result: 'pass' | 'fail', remark: string = '') => {
    try {
      await api.post(`/stock-in/${id}/inspect`, { inspection_result: result, inspection_remark: remark });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleInvoiceUpdate = async (id: number, status: string, invoiceNo: string = '') => {
    try {
      await api.put(`/stock-in/${id}/invoice`, { invoice_status: status, invoice_no: invoiceNo });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusText = (status: string) => {
    const map: Record<string, { text: string; className: string }> = {
      pending: { text: '待质检', className: 'bg-yellow-100 text-yellow-700' },
      completed: { text: '已入库', className: 'bg-green-100 text-green-700' },
      rejected: { text: '已拒收', className: 'bg-red-100 text-red-700' },
    };
    return map[status] || { text: status, className: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="搜索入库单/备件..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          新增入库
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">入库单号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">备件</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">批次号</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">供应商</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">库位</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">数量</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">质检状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">发票状态</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => {
              const statusInfo = getStatusText(item.status);
              return (
                <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{item.in_no}</td>
                  <td className="px-4 py-3">
                    <div>{item.part_name}</div>
                    <div className="text-xs text-gray-400">{item.sku}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{item.batch_no}</td>
                  <td className="px-4 py-3">{item.supplier_name || '-'}</td>
                  <td className="px-4 py-3">{item.location_name}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${statusInfo.className}`}>
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      item.invoice_status === 'received' ? 'bg-green-100 text-green-700' :
                      item.invoice_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.invoice_status === 'received' ? '已收票' :
                       item.invoice_status === 'pending' ? '待收票' : item.invoice_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleInspect(item.id, 'pass')}
                            className="text-green-600 hover:text-green-800"
                            title="质检通过"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleInspect(item.id, 'fail', '质量不合格')}
                            className="text-red-600 hover:text-red-800"
                            title="质检拒收"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {item.status === 'completed' && item.invoice_status === 'pending' && (
                        <button
                          onClick={() => handleInvoiceUpdate(item.id, 'received', `INV${item.id}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="登记发票"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            暂无入库记录
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <h3 className="text-lg font-semibold mb-4">新增入库单</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">供应商</label>
                  <select
                    value={form.supplier_id}
                    onChange={e => setForm({ ...form, supplier_id: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">批次号 *</label>
                  <input
                    type="text"
                    value={form.batch_no}
                    onChange={e => setForm({ ...form, batch_no: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="如: B20260527001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">备件 *</label>
                  <select
                    value={form.part_id}
                    onChange={e => {
                      const part = parts.find(p => p.id === parseInt(e.target.value));
                      setForm({
                        ...form,
                        part_id: parseInt(e.target.value),
                        unit_price: part?.purchase_price || 0,
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    {parts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
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
                  <label className="block text-sm font-medium mb-1">单价</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.unit_price}
                    onChange={e => setForm({ ...form, unit_price: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">保质期</label>
                  <input
                    type="date"
                    value={form.expire_date}
                    onChange={e => setForm({ ...form, expire_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
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
                  创建入库单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
