import { useEffect, useState } from 'react';
import { Megaphone, Clock, Plus } from 'lucide-react';
import api from '@/utils/api';
import useAuthStore from '@/stores/authStore';

interface Notice {
  id: number;
  title: string;
  content: string;
  status: string;
  deadline: string;
  created_at: string;
}

interface PageData {
  list: Notice[];
  total: number;
}

const statusLabels: Record<string, string> = { active: '公示中', expired: '已过期', cancelled: '已取消' };
const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  expired: 'bg-slate-50 text-slate-500 border-slate-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export default function NoticeList() {
  const { user } = useAuthStore();
  const [data, setData] = useState<PageData>({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', deadline: '' });

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12' });
      const res = await api.get<PageData>(`/api/notices?${params}`);
      setData(res);
    } catch {
      setData({ list: [], total: 0 });
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/notices', form);
      setShowForm(false);
      setForm({ title: '', content: '', deadline: '' });
      fetchData();
    } catch {} finally {
      setSaving(false);
    }
  };

  const getCountdown = (deadline: string) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return '已到期';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}天${hours}小时`;
  };

  const canPublish = user && ['village', 'township'].includes(user.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">公示公告</h1>
        {canPublish && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors"
          >
            <Plus size={16} />
            发布公示
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handlePublish} className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">公示标题 <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">公示内容 <span className="text-red-500">*</span></label>
            <textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">公示截止日期 <span className="text-red-500">*</span></label>
            <input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 disabled:opacity-50">
              {saving ? '发布中...' : '发布'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
              取消
            </button>
          </div>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.list.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">暂无公示公告</div>
        ) : (
          data.list.map((notice) => {
            const countdown = getCountdown(notice.deadline);
            const sc = statusColors[notice.status] || statusColors.active;
            return (
              <div key={notice.id} className="bg-white rounded-lg shadow-sm border border-slate-100 p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Megaphone size={16} className="text-teal-700 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-slate-800 line-clamp-2">{notice.title}</h3>
                  </div>
                  <span className={`ml-2 flex-shrink-0 px-2 py-0.5 text-xs rounded-full border ${sc}`}>
                    {statusLabels[notice.status] || notice.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 flex-1 line-clamp-3 mb-3">{notice.content}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                  <span>{notice.created_at}</span>
                  {notice.status === 'active' && countdown && (
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <Clock size={12} />
                      剩余 {countdown}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {data.total > 12 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40">上一页</button>
          <span className="text-sm text-slate-600">第 {page} 页</span>
          <button onClick={() => setPage(page + 1)} disabled={page * 12 >= data.total} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40">下一页</button>
        </div>
      )}
    </div>
  );
}
