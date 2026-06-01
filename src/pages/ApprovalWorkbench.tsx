import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/utils/api';
import useAuthStore from '@/stores/authStore';

interface AppItem {
  id: number;
  app_code: string;
  type: string;
  status: string;
  created_at: string;
}

const typeLabels: Record<string, string> = { new_build: '新建', rebuild: '翻建', expand: '扩建', exit: '退出', transfer: '流转' };
const statusLabels: Record<string, string> = {
  submitted: '已提交', village_review: '村级审核',
  township_review: '乡镇复核', supervisor_filing: '监管备案',
};

export default function ApprovalWorkbench() {
  const { user } = useAuthStore();
  const [list, setList] = useState<AppItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [opinion, setOpinion] = useState('');
  const [operating, setOperating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    let status = '';
    if (user?.role === 'village') status = 'village_review';
    else if (user?.role === 'township') status = 'township_review';
    else if (user?.role === 'supervisor') status = 'supervisor_filing';

    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (status) params.set('status', status);
    api.get<{ list: AppItem[]; total: number }>(`/api/applications?${params}`)
      .then((res) => {
        setList(res.list);
        if (res.list.length > 0) setSelectedId(res.list[0].id);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [user]);

  const selectedItem = list.find((item) => item.id === selectedId);

  const handleApprove = async () => {
    if (!selectedId) return;
    setOperating(true);
    try {
      await api.post(`/api/applications/${selectedId}/approve`, { opinion });
      setList((prev) => prev.filter((item) => item.id !== selectedId));
      setSelectedId(null);
      setOpinion('');
    } catch {} finally {
      setOperating(false);
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    setOperating(true);
    try {
      await api.post(`/api/applications/${selectedId}/reject`, { opinion });
      setList((prev) => prev.filter((item) => item.id !== selectedId));
      setSelectedId(null);
      setOpinion('');
    } catch {} finally {
      setOperating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">审批工作台</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">待审列表 ({list.length})</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-slate-400 text-sm">加载中...</div>
            ) : list.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">暂无待审批申请</div>
            ) : (
              list.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setSelectedId(item.id); setOpinion(''); }}
                  className={`w-full text-left p-4 hover:bg-teal-50/40 transition-colors ${selectedId === item.id ? 'bg-teal-50 border-l-4 border-teal-600' : 'border-l-4 border-transparent'}`}
                >
                  <div className="text-sm font-medium text-slate-800">{item.app_code}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {typeLabels[item.type] || item.type} · {statusLabels[item.status] || item.status}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.created_at}</div>
                </button>
              ))
            )}
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-100 p-6">
          {selectedItem ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-slate-800">{selectedItem.app_code}</h2>
                <div className="text-sm text-slate-500 mt-1">
                  申请类型: {typeLabels[selectedItem.type] || selectedItem.type} · 当前状态: {statusLabels[selectedItem.status] || selectedItem.status} · 申请时间: {selectedItem.created_at}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">审批意见</label>
                <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="请输入审批意见"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={operating}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={operating}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle size={16} />
                  退回
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              请从左侧选择待审批申请
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
