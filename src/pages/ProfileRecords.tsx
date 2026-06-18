import { useState } from 'react';
import { apiFetch } from '@/lib/api';

interface BizRecord {
  id: number;
  type: string;
  action: string;
  detail: string;
  date: string;
  status: 'success' | 'processing' | 'rejected';
}

const mockRecords: BizRecord[] = [
  { id: 1, type: '社保服务', action: '参保状态查询', detail: '养老保险参保状态查询', date: '2026-06-18', status: 'success' },
  { id: 2, type: '就业服务', action: '失业金申领', detail: '提交失业金申领申请', date: '2026-06-15', status: 'processing' },
  { id: 3, type: '人才服务', action: '职称申报', detail: '工程系列中级职称申报', date: '2026-06-10', status: 'rejected' },
  { id: 4, type: '劳动关系', action: '劳动合同签署', detail: '签署固定期限劳动合同', date: '2026-06-05', status: 'success' },
  { id: 5, type: '社保服务', action: '缴费记录查询', detail: '2026年5月缴费记录', date: '2026-06-01', status: 'success' },
  { id: 6, type: '就业服务', action: '失业金申领', detail: '补交材料', date: '2026-05-28', status: 'success' },
  { id: 7, type: '人才服务', action: '职称申报', detail: '经济系列初级申报', date: '2026-05-20', status: 'processing' },
];

const statusLabels: Record<string, string> = {
  success: '已完成',
  processing: '处理中',
  rejected: '已退回',
};

const statusColors: Record<string, string> = {
  success: 'bg-success-100 text-success-600',
  processing: 'bg-primary-100 text-primary-600',
  rejected: 'bg-danger-100 text-danger-500',
};

const typeOptions = ['全部', '社保服务', '就业服务', '人才服务', '劳动关系'];
const statusOptions = ['全部', '已完成', '处理中', '已退回'];

export default function ProfileRecords() {
  const [typeFilter, setTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = mockRecords.filter((r) => {
    if (typeFilter !== '全部' && r.type !== typeFilter) return false;
    if (statusFilter !== '全部' && statusLabels[r.status] !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">业务记录</h1>

      <div className="flex items-center gap-4">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">业务类型</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">操作</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">详情</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">日期</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">状态</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-5 py-3 text-sm text-neutral-700">{r.type}</td>
                <td className="px-5 py-3 text-sm text-neutral-700">{r.action}</td>
                <td className="px-5 py-3 text-sm text-neutral-500">{r.detail}</td>
                <td className="px-5 py-3 text-sm text-neutral-500">{r.date}</td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status]}`}>
                    {statusLabels[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-400">暂无记录</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-neutral-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
