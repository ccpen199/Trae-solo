import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TEAM_THEMES } from '@/constants/config';

export default function CreateTeam() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Record<string, string>>({
    name: '',
    theme: TEAM_THEMES[0],
    practiceBase: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/sanxiaxiang/teams');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <button onClick={() => navigate('/sanxiaxiang/teams')} className="inline-flex items-center gap-1 text-primary-600 hover:underline text-sm">
        <ArrowLeft className="w-4 h-4" />
        返回团队列表
      </button>
      <h1 className="text-2xl font-bold text-surface-900">创建实践团队</h1>
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">团队名称</label>
          <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">实践主题</label>
            <select value={form.theme} onChange={(e) => setForm((p) => ({ ...p, theme: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {TEAM_THEMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">实践基地</label>
            <input type="text" value={form.practiceBase} onChange={(e) => setForm((p) => ({ ...p, practiceBase: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">开始日期</label>
            <input type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">结束日期</label>
            <input type="date" value={form.endDate} onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">团队简介</label>
          <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/sanxiaxiang/teams')} className="btn-outline">取消</button>
          <button type="submit" className="btn-primary">创建团队</button>
        </div>
      </form>
    </div>
  );
}
