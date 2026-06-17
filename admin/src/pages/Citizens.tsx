import { useEffect, useState } from 'react';
import { Search, Filter, Eye, Shield, ShieldOff, Phone, MapPin } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Citizen, PaginatedResponse } from '@/types';

export default function Citizens() {
  const [data, setData] = useState<PaginatedResponse<Citizen> | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const loadCitizens = useAppStore((state) => state.loadCitizens);

  useEffect(() => {
    const fetchData = async () => {
      const result = await loadCitizens(page, 10, filters);
      setData(result);
    };
    fetchData();
  }, [page, filters]);

  const getStatusBadge = (verified: boolean, faceVerified: boolean) => {
    if (verified && faceVerified) {
      return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">已实名+人脸</span>;
    }
    if (verified) {
      return <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">已实名</span>;
    }
    return <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">未实名</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">市民管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理实名认证市民信息</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索姓名、手机号、身份证号..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-300"
            onChange={(e) => setFilters({ ...filters, district: e.target.value || undefined })}
          >
            <option value="">全部区县</option>
            {['姑苏区', '工业园区', '虎丘区', '吴中区', '相城区', '吴江区', '昆山市', '常熟市', '张家港市', '太仓市'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-300"
            onChange={(e) =>
              setFilters({ ...filters, verified: e.target.value === '' ? undefined : e.target.value === 'true' })
            }
          >
            <option value="">全部状态</option>
            <option value="true">已实名</option>
            <option value="false">未实名</option>
          </select>
          <button className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
            <Filter size={16} className="mr-2" />
            更多筛选
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">市民信息</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">手机号</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">身份证号</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">所在区县</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">认证状态</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">注册时间</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data?.list.map((citizen) => (
              <tr key={citizen.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">{citizen.name[0]}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-800">{citizen.name}</p>
                      <p className="text-xs text-gray-500">{citizen.gender === 'male' ? '男' : '女'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <Phone size={14} className="mr-2 text-gray-400" />
                    {citizen.phone}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700 font-mono">{citizen.idCardNumber}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin size={14} className="mr-2 text-gray-400" />
                    {citizen.district}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(citizen.realNameVerified, citizen.faceVerified)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(citizen.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Eye size={16} />
                    </button>
                    {citizen.realNameVerified ? (
                      <button className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <ShieldOff size={16} />
                      </button>
                    ) : (
                      <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Shield size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.total > 10 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              共 {data.total} 条记录，第 {data.page} / {Math.ceil(data.total / data.pageSize)} 页
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(data.total / data.pageSize)) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(Math.ceil(data.total / data.pageSize), page + 1))}
                disabled={page >= Math.ceil(data.total / data.pageSize)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
