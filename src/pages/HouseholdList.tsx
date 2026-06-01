import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/utils/api';

interface Household {
  id: number;
  head_name: string;
  id_card: string;
  address: string;
  phone: string;
  eligibility_status: string;
  created_at: string;
}

interface PageData {
  list: Household[];
  total: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  qualified: { label: '符合资格', className: 'bg-green-50 text-green-700 border-green-200' },
  disqualified: { label: '不符合资格', className: 'bg-red-50 text-red-700 border-red-200' },
  pending: { label: '待审核', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  restricted: { label: '受限', className: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export default function HouseholdList() {
  const [data, setData] = useState<PageData>({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (keyword) params.set('keyword', keyword);
      if (statusFilter) params.set('eligibilityStatus', statusFilter);
      const res = await api.get<PageData>(`/api/households?${params}`);
      setData(res);
    } catch {
      setData({ list: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">农户档案</h1>
        <Link
          to="/households/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors"
        >
          <Plus size={16} />
          新增农户
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索姓名/身份证号/地址"
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">全部资格状态</option>
            <option value="qualified">符合资格</option>
            <option value="disqualified">不符合资格</option>
            <option value="pending">待审核</option>
            <option value="restricted">受限</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-700 text-white text-sm rounded-lg hover:bg-teal-800 transition-colors"
          >
            搜索
          </button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">户主姓名</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">身份证号</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">地址</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">联系电话</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">资格状态</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">加载中...</td></tr>
              ) : data.list.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">暂无数据</td></tr>
              ) : (
                data.list.map((item, idx) => {
                  const sc = statusConfig[item.eligibility_status] || statusConfig.pending;
                  return (
                    <tr key={item.id} className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-teal-50/40 transition-colors`}>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.head_name}</td>
                      <td className="py-3 px-4 text-slate-600">{item.id_card}</td>
                      <td className="py-3 px-4 text-slate-600">{item.address}</td>
                      <td className="py-3 px-4 text-slate-600">{item.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${sc.className}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link to={`/households/${item.id}`} className="text-teal-700 hover:text-teal-800">
                            <Eye size={16} />
                          </Link>
                          <Link to={`/households/${item.id}/edit`} className="text-amber-600 hover:text-amber-700">
                            <Edit size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <span className="text-sm text-slate-500">共 {data.total} 条记录</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
