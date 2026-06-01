import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/utils/api';

interface Application {
  id: number;
  app_code: string;
  household_id: number;
  parcel_id: number;
  type: string;
  status: string;
  created_at: string;
}

interface PageData {
  list: Application[];
  total: number;
}

const typeLabels: Record<string, string> = { new_build: '新建', rebuild: '翻建', expand: '扩建', exit: '退出', transfer: '流转' };
const statusLabels: Record<string, string> = {
  draft: '草稿', submitted: '已提交', village_review: '村级审核',
  township_review: '乡镇复核', supervisor_filing: '监管备案',
  approved: '已通过', rejected: '已退回', returned: '已退回',
};
const statusColors: Record<string, string> = {
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  village_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  township_review: 'bg-orange-50 text-orange-700 border-orange-200',
  supervisor_filing: 'bg-purple-50 text-purple-700 border-purple-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  returned: 'bg-red-50 text-red-700 border-red-200',
};

const statusOrder = ['submitted', 'village_review', 'township_review', 'supervisor_filing', 'approved'];
const statusStepLabels = ['已提交', '村级审核', '乡镇复核', '监管备案', '已通过'];

function StatusProgress({ status }: { status: string }) {
  if (status === 'rejected' || status === 'returned') {
    return <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${statusColors[status]}`}>{statusLabels[status]}</span>;
  }
  const currentIdx = statusOrder.indexOf(status);
  if (currentIdx < 0) {
    return <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${statusColors[status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{statusLabels[status] || status}</span>;
  }
  return (
    <div className="flex items-center gap-1">
      {statusStepLabels.map((label, idx) => (
        <div key={label} className="flex items-center gap-1">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${idx <= currentIdx ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
            {idx + 1}
          </div>
          {idx < statusStepLabels.length - 1 && (
            <div className={`w-3 h-0.5 ${idx < currentIdx ? 'bg-teal-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ApplicationList() {
  const [data, setData] = useState<PageData>({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get<PageData>(`/api/applications?${params}`);
      setData(res);
    } catch {
      setData({ list: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, typeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">申请管理</h1>
        <Link to="/applications/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors">
          <Plus size={16} />
          提交申请
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option value="">全部类型</option>
            <option value="new_build">新建</option>
            <option value="rebuild">翻建</option>
            <option value="expand">扩建</option>
            <option value="exit">退出</option>
            <option value="transfer">流转</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option value="">全部状态</option>
            <option value="submitted">已提交</option>
            <option value="village_review">村级审核</option>
            <option value="township_review">乡镇复核</option>
            <option value="supervisor_filing">监管备案</option>
            <option value="approved">已通过</option>
            <option value="rejected">已退回</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">申请编号</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">类型</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">审批进度</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">申请时间</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">加载中...</td></tr>
              ) : data.list.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400">暂无数据</td></tr>
              ) : (
                data.list.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-teal-50/40 transition-colors`}>
                    <td className="py-3 px-4 font-medium text-slate-800">{item.app_code}</td>
                    <td className="py-3 px-4 text-slate-600">{typeLabels[item.type] || item.type}</td>
                    <td className="py-3 px-4"><StatusProgress status={item.status} /></td>
                    <td className="py-3 px-4 text-slate-600">{item.created_at}</td>
                    <td className="py-3 px-4">
                      <Link to={`/applications/${item.id}`} className="text-teal-700 hover:text-teal-800"><Eye size={16} /></Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">共 {data.total} 条记录</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
