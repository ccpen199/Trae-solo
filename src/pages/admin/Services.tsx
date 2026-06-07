import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration: number;
  qualification: string;
  sop: string;
  contraindications: string;
  status: 'active' | 'inactive';
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', category: '', price: '', duration: '', qualification: '', sop: '', contraindications: '',
  });

  const fetchServices = async () => {
    try {
      const data = await api<Service[]>('/admin/services');
      setServices(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', category: '', price: '', duration: '', qualification: '', sop: '', contraindications: '' });
    setShowModal(true);
  };

  const openEdit = (svc: Service) => {
    setEditId(svc.id);
    setForm({
      name: svc.name, category: svc.category, price: String(svc.price), duration: String(svc.duration),
      qualification: svc.qualification, sop: svc.sop, contraindications: svc.contraindications,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), duration: Number(form.duration) };
    try {
      if (editId) {
        await api(`/admin/services/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await api('/admin/services', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowModal(false);
      fetchServices();
    } catch {}
  };

  const toggleStatus = async (id: number, status: string) => {
    try {
      await api(`/admin/services/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: status === 'active' ? 'inactive' : 'active' }) });
      fetchServices();
    } catch {}
  };

  const deleteService = async (id: number) => {
    try {
      await api(`/admin/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch {}
  };

  const update = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E293B]">服务管理</h1>
        <button onClick={openAdd} className="flex items-center gap-2 bg-[#0F6CBD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D5DA8]">
          <Plus className="w-4 h-4" /> 新增服务
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (<div key={i} className="h-10 bg-gray-200 rounded" />))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">名称</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">分类</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">价格</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">时长(分)</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{svc.name}</td>
                  <td className="py-3 px-4">{svc.category}</td>
                  <td className="py-3 px-4">¥{svc.price}</td>
                  <td className="py-3 px-4">{svc.duration}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => toggleStatus(svc.id, svc.status)} className={`text-xs px-2 py-1 rounded-full ${svc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {svc.status === 'active' ? '启用' : '停用'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(svc)} className="text-[#0F6CBD] hover:underline"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteService(svc.id)} className="text-red-500 hover:underline"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[560px] max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1E293B]">{editId ? '编辑服务' : '新增服务'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">服务名称</label>
                  <input value={form.name} onChange={(e) => update('name', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input value={form.category} onChange={(e) => update('category', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格(元)</label>
                  <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">时长(分钟)</label>
                  <input type="number" value={form.duration} onChange={(e) => update('duration', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资质要求</label>
                <input value={form.qualification} onChange={(e) => update('qualification', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SOP流程</label>
                <textarea value={form.sop} onChange={(e) => update('sop', e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">禁忌症</label>
                <textarea value={form.contraindications} onChange={(e) => update('contraindications', e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] resize-none" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-[#0F6CBD] text-white hover:bg-[#0D5DA8]">{editId ? '保存' : '创建'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
