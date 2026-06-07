import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AlertTriangle, Plus, X } from 'lucide-react';

interface AdverseEvent {
  id: number;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  order_id: number;
  status: 'reported' | 'investigating' | 'resolved';
  created_at: string;
}

const severityLabels: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
const severityColors: Record<string, string> = { low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700', high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
const statusLabels: Record<string, string> = { reported: '已报告', investigating: '调查中', resolved: '已解决' };
const statusColors: Record<string, string> = { reported: 'bg-yellow-100 text-yellow-700', investigating: 'bg-blue-100 text-blue-700', resolved: 'bg-green-100 text-green-700' };

export default function AdverseEvents() {
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ event_type: '', severity: 'medium', description: '', order_id: '' });

  const fetchEvents = async () => {
    try {
      const data = await api<AdverseEvent[]>('/admin/adverse-events');
      setEvents(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/admin/adverse-events', {
        method: 'POST',
        body: JSON.stringify({ ...form, order_id: Number(form.order_id) }),
      });
      setShowForm(false);
      setForm({ event_type: '', severity: 'medium', description: '', order_id: '' });
      fetchEvents();
    } catch {}
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api(`/admin/adverse-events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      fetchEvents();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1E293B]">不良事件</h1>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#0F6CBD] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#0D5DA8]">
          <Plus className="w-4 h-4" /> 报告事件
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
                <th className="text-left py-3 px-4 font-medium text-gray-600">事件类型</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">严重程度</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">订单ID</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">状态</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">时间</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-orange-500" />{event.event_type}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${severityColors[event.severity]}`}>{severityLabels[event.severity]}</span></td>
                  <td className="py-3 px-4 text-gray-500">#{event.order_id}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[event.status]}`}>{statusLabels[event.status]}</span></td>
                  <td className="py-3 px-4 text-gray-500">{new Date(event.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    {event.status === 'reported' && (
                      <button onClick={() => updateStatus(event.id, 'investigating')} className="text-xs text-[#0F6CBD] hover:underline">开始调查</button>
                    )}
                    {event.status === 'investigating' && (
                      <button onClick={() => updateStatus(event.id, 'resolved')} className="text-xs text-[#108043] hover:underline">标记解决</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[480px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#1E293B]">报告不良事件</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">事件类型</label>
                <input value={form.event_type} onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">严重程度</label>
                <select value={form.severity} onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]">
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">严重</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">相关订单ID</label>
                <input type="number" value={form.order_id} onChange={(e) => setForm((p) => ({ ...p, order_id: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">事件描述</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6CBD] resize-none" required />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700">提交报告</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
