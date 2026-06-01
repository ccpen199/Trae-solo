import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { getSettlements, confirmSettlement, releaseSettlement, createSettlement } from '@/api/settlements';
import type { Settlement } from '@/types';

const statusLabel: Record<string, string> = { frozen: '待确认', confirmed: '已确认', released: '已放款', failed: '失败' };
const statusColor: Record<string, string> = { frozen: 'badge-yellow', confirmed: 'badge-blue', released: 'badge-green', failed: 'badge-red' };

export default function Settlements() {
  const { user } = useAuthStore();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ job_id: '', worker_id: '', amount: '' });

  const fetchSettlements = () => {
    setLoading(true);
    getSettlements({ pageSize: 50 })
      .then((res) => setSettlements(res.list))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettlements(); }, []);

  const handleConfirm = async (id: number) => {
    try {
      await confirmSettlement(id);
      fetchSettlements();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleRelease = async (id: number) => {
    try {
      await releaseSettlement(id);
      fetchSettlements();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSettlement({
        job_id: Number(createForm.job_id),
        worker_id: Number(createForm.worker_id),
        amount: Number(createForm.amount),
      });
      setShowCreate(false);
      setCreateForm({ job_id: '', worker_id: '', amount: '' });
      fetchSettlements();
    } catch (err: any) {
      alert(err.response?.data?.message || '创建失败');
    }
  };

  const totalAmount = settlements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">
          {user?.role === 'employer' ? '结算管理' : '结算中心'}
        </h1>
        {user?.role === 'employer' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            + 创建结算
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-slate-500 text-sm">结算总额</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">¥{totalAmount.toFixed(2)}</p>
        </div>
        <div className="card p-5">
          <p className="text-slate-500 text-sm">待处理</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">
            {settlements.filter((s) => s.status === 'frozen' || s.status === 'confirmed').length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-slate-500 text-sm">已完成</p>
          <p className="text-2xl font-bold text-accent-500 mt-1">
            {settlements.filter((s) => s.status === 'released').length}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">加载中...</div>
      ) : settlements.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-4xl mb-3">💰</p>
          <p className="text-slate-400">暂无结算记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{s.job_title || `岗位 #${s.job_id}`}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                    <span>工人: {s.worker_nickname || `#${s.worker_id}`}</span>
                    <span>雇主: {s.employer_nickname || `#${s.employer_id}`}</span>
                    <span>{s.created_at?.slice(0, 10)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800">¥{s.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-400">平台费: ¥{s.platform_fee.toFixed(2)} | 实付: ¥{s.actual_amount.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <span className={statusColor[s.status]}>{statusLabel[s.status]}</span>
                <div className="flex gap-2">
                  {s.status === 'frozen' && user?.role === 'worker' && (
                    <button onClick={() => handleConfirm(s.id)} className="btn-accent text-sm">确认完成</button>
                  )}
                  {s.status === 'confirmed' && user?.role === 'employer' && (
                    <button onClick={() => handleRelease(s.id)} className="btn-primary text-sm">放款</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="font-bold text-slate-800 mb-4">创建结算</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label-text">岗位ID *</label>
                <input type="number" value={createForm.job_id} onChange={(e) => setCreateForm((f) => ({ ...f, job_id: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="label-text">工人ID *</label>
                <input type="number" value={createForm.worker_id} onChange={(e) => setCreateForm((f) => ({ ...f, worker_id: e.target.value }))} className="input-field" required />
              </div>
              <div>
                <label className="label-text">金额 *</label>
                <input type="number" step="0.01" value={createForm.amount} onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" required />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary">确认创建</button>
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
