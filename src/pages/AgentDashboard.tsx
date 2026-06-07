import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../utils/api';
import { USER_ROLE_MAP } from '../utils/constants';
import {
  TrendingUp, Users, Award, BarChart3, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, PieChart, Pie
} from 'recharts';

const COLORS = ['#1e3a5f', '#2d6696', '#4a82b0', '#7aa5c9', '#f59e0b', '#d97706'];

const AgentDashboard: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.agentPerformance(period);
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading || !data) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;

  const { agents, trends } = data;

  const chartData = agents.map((a: any) => ({
    name: a.name?.replace(/（.*?）/g, '') || '经纪人',
    成交量: a.transaction_count,
    租约量: a.lease_count,
    佣金: a.total_commission / 10000
  }));

  const mergedTrends = (() => {
    const map: Record<string, any> = {};
    trends.transactions.forEach((t: any) => {
      map[t.date] = { date: t.date, 交易: t.count, 佣金: t.commission / 10000 };
    });
    trends.leases.forEach((l: any) => {
      if (!map[l.date]) map[l.date] = { date: l.date, 交易: 0, 佣金: 0 };
      map[l.date].租约 = l.count;
    });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  })();

  const totalCommission = agents.reduce((sum: number, a: any) => sum + a.total_commission, 0);
  const totalTransactions = agents.reduce((sum: number, a: any) => sum + a.transaction_count, 0);
  const totalLeases = agents.reduce((sum: number, a: any) => sum + a.lease_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">经纪人业绩看板</h2>
          <p className="text-sm text-gray-500">实时追踪经纪人业绩表现与排行榜</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg ${period === p ? 'bg-primary-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
            >
              {{ week: '本周', month: '本月', year: '本年' } as any}[p]
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">经纪人总数</div>
              <div className="text-2xl font-bold text-gray-800">{agents.length}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">总成交量</div>
              <div className="text-2xl font-bold text-gray-800">{totalTransactions}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">总租约量</div>
              <div className="text-2xl font-bold text-gray-800">{totalLeases}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-accent-50 text-accent-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">总佣金</div>
              <div className="text-2xl font-bold text-gray-800">¥ {(totalCommission / 10000).toFixed(2)} 万</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4">经纪人业绩对比</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Legend />
                <Bar dataKey="成交量" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
                <Bar dataKey="租约量" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4">趋势变化</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mergedTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="交易" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="left" type="monotone" dataKey="租约" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="佣金" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent-500" /> 业绩排行榜
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">排名</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">经纪人</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">角色</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">房源量</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">成交量</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-gray-500 uppercase">租约量</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">佣金收入</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {agents.map((a: any, idx: number) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                      idx === 0 ? 'bg-accent-500 text-white' :
                      idx === 1 ? 'bg-gray-400 text-white' :
                      idx === 2 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-800">{a.name}</div>
                    <div className="text-xs text-gray-400">{a.phone}</div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{USER_ROLE_MAP[a.role] || a.role}</td>
                  <td className="px-5 py-4 text-center text-sm text-gray-800">{a.property_count}</td>
                  <td className="px-5 py-4 text-center text-sm font-medium text-green-600">{a.transaction_count}</td>
                  <td className="px-5 py-4 text-center text-sm font-medium text-blue-600">{a.lease_count}</td>
                  <td className="px-5 py-4 text-right text-sm font-bold text-primary-600">
                    ¥ {(a.total_commission / 10000).toFixed(4)} 万
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
