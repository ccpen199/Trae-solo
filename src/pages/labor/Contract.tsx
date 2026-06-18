import { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Contract {
  id: number;
  type: string;
  partyA: string;
  partyB: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'signed' | 'archived';
}

const typeOptions = ['固定期限', '无固定期限', '以完成一定工作任务为期限'];

const mockContracts: Contract[] = [
  { id: 1, type: '固定期限', partyA: '北京科技有限公司', partyB: '张三', startDate: '2026-01-01', endDate: '2028-12-31', status: 'signed' },
  { id: 2, type: '固定期限', partyA: '北京科技有限公司', partyB: '李四', startDate: '2026-03-01', endDate: '2027-02-28', status: 'draft' },
  { id: 3, type: '无固定期限', partyA: '北京科技有限公司', partyB: '王五', startDate: '2024-06-01', endDate: '-', status: 'archived' },
];

const statusLabels: Record<string, string> = {
  draft: '待签署',
  signed: '已签署',
  archived: '已归档',
};

const statusColors: Record<string, string> = {
  draft: 'bg-accent-100 text-accent-600',
  signed: 'bg-success-100 text-success-600',
  archived: 'bg-neutral-100 text-neutral-500',
};

export default function Contract() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [showCreate, setShowCreate] = useState(false);
  const [showSignModal, setShowSignModal] = useState<number | null>(null);
  const [form, setForm] = useState({
    type: '',
    partyA: '',
    partyB: '',
    startDate: '',
    endDate: '',
    terms: '',
  });

  const handleCreate = async () => {
    try {
      await apiFetch('/api/labor/contract', {
        method: 'POST',
        body: JSON.stringify(form),
      });
    } catch {}
    const newContract: Contract = {
      id: contracts.length + 1,
      type: form.type,
      partyA: form.partyA,
      partyB: form.partyB,
      startDate: form.startDate,
      endDate: form.endDate || '-',
      status: 'draft',
    };
    setContracts([newContract, ...contracts]);
    setShowCreate(false);
    setForm({ type: '', partyA: '', partyB: '', startDate: '', endDate: '', terms: '' });
  };

  const handleSign = (id: number) => {
    setContracts(contracts.map((c) => (c.id === id ? { ...c, status: 'signed' as const } : c)));
    setShowSignModal(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">劳动合同签署</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800"
        >
          新建合同
        </button>
      </div>

      {showCreate && (
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-700">新建合同</h2>
            <button onClick={() => setShowCreate(false)} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">合同类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">请选择</option>
                {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">甲方</label>
              <input
                value={form.partyA}
                onChange={(e) => setForm({ ...form, partyA: e.target.value })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">乙方</label>
              <input
                value={form.partyB}
                onChange={(e) => setForm({ ...form, partyB: e.target.value })}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">起始日期</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1">终止日期</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1">合同条款</label>
              <textarea
                value={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="请输入合同主要条款"
              />
            </div>
            <button
              onClick={handleCreate}
              disabled={!form.type || !form.partyA || !form.partyB}
              className="px-6 py-2 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800 disabled:opacity-50"
            >
              创建合同
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">类型</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">甲方</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">乙方</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">期限</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">状态</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-5 py-3 text-sm text-neutral-700">{c.type}</td>
                <td className="px-5 py-3 text-sm text-neutral-700">{c.partyA}</td>
                <td className="px-5 py-3 text-sm text-neutral-700">{c.partyB}</td>
                <td className="px-5 py-3 text-sm text-neutral-500">{c.startDate} ~ {c.endDate}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status]}`}>
                    {statusLabels[c.status]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {c.status === 'draft' && (
                    <button
                      onClick={() => setShowSignModal(c.id)}
                      className="text-sm text-primary-700 hover:text-primary-800 font-medium"
                    >
                      签署
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSignModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl">
            <h3 className="text-base font-semibold text-neutral-800 mb-2">确认签署</h3>
            <p className="text-sm text-neutral-600 mb-4">确认签署此劳动合同？签署后合同即生效。</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSignModal(null)}
                className="px-4 py-2 border border-neutral-300 text-neutral-600 rounded-lg text-sm hover:bg-neutral-50"
              >
                取消
              </button>
              <button
                onClick={() => handleSign(showSignModal)}
                className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm hover:bg-primary-800"
              >
                确认签署
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
