import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, statusMap, priorityMap } from '@/lib/api';

export default function TicketList() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ tickets: [], total: 0 });
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    terminal: '',
    serviceType: '',
    passengerName: '',
    flightNo: '',
    page: 1,
    pageSize: 20,
  });

  useEffect(() => {
    loadTickets();
  }, [filters]);

  async function loadTickets() {
    setLoading(true);
    try {
      const params: any = { ...filters };
      Object.keys(params).forEach(k => {
        if (!params[k] || params[k] === '') delete params[k];
      });
      const res = await api.tickets(params);
      setData(res.data);
    } catch (e) {
      console.error('Load tickets failed:', e);
    } finally {
      setLoading(false);
    }
  }

  const totalPages = Math.ceil(data.total / filters.pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">工单列表</h2>
          <p className="text-sm text-slate-500 mt-1">共 {data.total} 条工单记录</p>
        </div>
        <Link
          to="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          + 创建工单
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-600">筛选条件</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">状态</label>
            <select
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              {Object.entries(statusMap).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">优先级</label>
            <select
              value={filters.priority}
              onChange={e => setFilters({ ...filters, priority: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              {Object.entries(priorityMap).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">航站楼</label>
            <select
              value={filters.terminal}
              onChange={e => setFilters({ ...filters, terminal: e.target.value, page: 1 })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部</option>
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">服务类型</label>
            <input
              type="text"
              value={filters.serviceType}
              onChange={e => setFilters({ ...filters, serviceType: e.target.value, page: 1 })}
              placeholder="服务类型"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">旅客姓名</label>
            <input
              type="text"
              value={filters.passengerName}
              onChange={e => setFilters({ ...filters, passengerName: e.target.value, page: 1 })}
              placeholder="旅客姓名"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">航班号</label>
            <input
              type="text"
              value={filters.flightNo}
              onChange={e => setFilters({ ...filters, flightNo: e.target.value, page: 1 })}
              placeholder="航班号"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">工单编号</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">旅客信息</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">位置</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">服务类型</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">优先级</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">处理人</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">创建时间</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.tickets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400">
                        <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>暂无工单数据</p>
                      </td>
                    </tr>
                  ) : (
                    data.tickets.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-sm text-slate-600">{t.id.slice(0, 12)}...</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">{t.passengerName}</p>
                          <p className="text-xs text-slate-500">{t.passengerPhone}</p>
                          {t.flightNo && <p className="text-xs text-blue-600">{t.flightNo}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">{t.terminal}</p>
                          <p className="text-xs text-slate-500">{t.area}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">{t.serviceType}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${priorityMap[t.priority]?.color}`}>
                            {priorityMap[t.priority]?.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${statusMap[t.status]?.color}`}>
                            {statusMap[t.status]?.label}
                          </span>
                          {t.isException && (
                            <span className="ml-1 inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">异常</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-700">{t.assignedToName}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-600">
                            {new Date(t.createdAt).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            to={`/tickets/${t.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            详情
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  第 {filters.page} / {totalPages} 页，共 {data.total} 条
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page <= 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= totalPages}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
