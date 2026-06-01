import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/utils/api';

interface Anomaly {
  id: number;
  anomaly_type: string;
  household_id: number;
  parcel_id: number;
  application_id: number;
  description: string;
  rectify_status: string;
  created_at: string;
}

interface PageData {
  list: Anomaly[];
  total: number;
}

const typeLabels: Record<string, string> = {
  over_area: '超面积', multi_homestead: '一户多宅', missing_material: '材料缺失',
  disputed_parcel: '争议地块', illegal_construction: '违规建设',
};
const rectifyLabels: Record<string, string> = {
  pending: '待整改', in_progress: '整改中', completed: '已整改', overdue: '已逾期',
};
const rectifyColors: Record<string, string> = {
  pending: 'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-800 border-red-300',
};
const urgencyColors: Record<string, string> = {
  over_area: 'bg-orange-500',
  multi_homestead: 'bg-red-500',
  missing_material: 'bg-yellow-400',
  disputed_parcel: 'bg-orange-400',
  illegal_construction: 'bg-red-600',
};

export default function AnomalyList() {
  const [data, setData] = useState<PageData>({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');
  const [rectifyFilter, setRectifyFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (typeFilter) params.set('type', typeFilter);
      if (rectifyFilter) params.set('rectifyStatus', rectifyFilter);
      const res = await api.get<PageData>(`/api/anomalies?${params}`);
      setData(res);
    } catch {
      setData({ list: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, typeFilter, rectifyFilter]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">异常队列</h1>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option value="">全部异常类型</option>
            <option value="over_area">超面积</option>
            <option value="multi_homestead">一户多宅</option>
            <option value="missing_material">材料缺失</option>
            <option value="disputed_parcel">争议地块</option>
            <option value="illegal_construction">违规建设</option>
          </select>
          <select value={rectifyFilter} onChange={(e) => { setRectifyFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
            <option value="">全部整改状态</option>
            <option value="pending">待整改</option>
            <option value="in_progress">整改中</option>
            <option value="completed">已整改</option>
            <option value="overdue">已逾期</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500 w-2"></th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">异常类型</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">描述</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">整改状态</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">创建时间</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">加载中...</td></tr>
              ) : data.list.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">暂无数据</td></tr>
              ) : (
                data.list.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-teal-50/40 transition-colors`}>
                    <td className="py-3 px-2">
                      <div className={`w-1.5 h-8 rounded-full ${urgencyColors[item.anomaly_type] || 'bg-slate-400'}`} />
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{typeLabels[item.anomaly_type] || item.anomaly_type}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{item.description}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${rectifyColors[item.rectify_status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {rectifyLabels[item.rectify_status] || item.rectify_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.created_at}</td>
                    <td className="py-3 px-4">
                      <Link to={`/anomalies/${item.id}`} className="text-teal-700 hover:text-teal-800"><Eye size={16} /></Link>
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
