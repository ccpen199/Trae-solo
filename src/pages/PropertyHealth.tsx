import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../utils/api';
import {
  PROPERTY_TYPE_MAP, PROPERTY_STATUS_MAP,
} from '../utils/constants';
import {
  Activity, TrendingUp, TrendingDown, AlertTriangle, Home, BarChart3, DollarSign
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#1e3a5f', '#2d6696', '#4a82b0', '#7aa5c9'];

const PropertyHealth: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.propertyHealth();
      setData(res.healthData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading || !data) return <div className="flex items-center justify-center h-64 text-gray-500">加载中...</div>;

  const { overview, typeStats, priceDeviation, monthlyTrend } = data;

  const typeChartData = typeStats.map((t: any) => ({
    name: PROPERTY_TYPE_MAP[t.type] || t.type,
    数量: t.count,
    均价: Math.round(t.avg_price)
  }));

  const monthlyChart = (() => {
    const map: Record<string, any> = {};
    monthlyTrend.forEach((m: any) => {
      if (!map[m.month]) map[m.month] = { month: m.month };
      const status = PROPERTY_STATUS_MAP[m.status] || m.status;
      map[m.month][status] = m.count;
    });
    return Object.values(map).sort((a: any, b: any) => a.month.localeCompare(b.month));
  })();

  const healthScore = Math.round(
    (overview.vacantRate < 20 ? 35 : Math.max(0, 35 - (overview.vacantRate - 20))) +
    (overview.conversionRate > 5 ? 35 : overview.conversionRate * 7) +
    (overview.avgDaysOnMarket < 15 ? 30 : Math.max(0, 30 - (overview.avgDaysOnMarket - 15) * 2))
  );

  const radarData = [
    { subject: '空置率控制', A: Math.max(0, 100 - overview.vacantRate * 2), fullMark: 100 },
    { subject: '带看转化率', A: Math.min(100, overview.conversionRate * 10), fullMark: 100 },
    { subject: '去化速度', A: Math.max(0, 100 - overview.avgDaysOnMarket * 3), fullMark: 100 },
    { subject: '价格合理性', A: Math.max(0, 100 - (priceDeviation[0]?.deviation || 0)), fullMark: 100 },
    { subject: '房源健康度', A: healthScore, fullMark: 100 },
  ];

  const gaugePercent = healthScore;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">房源健康度诊断</h2>
        <p className="text-sm text-gray-500">多维度分析房源运营健康状况，提供数据支撑决策</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">总在管房源</div>
              <div className="text-3xl font-bold text-gray-800">{overview.totalProperties}</div>
            </div>
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> 上架中 {overview.activeProperties} 套
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">空置率</div>
              <div className={`text-3xl font-bold ${overview.vacantRate > 30 ? 'text-red-600' : overview.vacantRate > 15 ? 'text-accent-600' : 'text-green-600'}`}>
                {overview.vacantRate}%
              </div>
            </div>
            <div className={`w-12 h-12 ${overview.vacantRate > 30 ? 'bg-red-50 text-red-600' : overview.vacantRate > 15 ? 'bg-accent-50 text-accent-600' : 'bg-green-50 text-green-600'} rounded-xl flex items-center justify-center`}>
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${overview.vacantRate > 30 ? 'bg-red-500' : overview.vacantRate > 15 ? 'bg-accent-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(100, overview.vacantRate * 2)}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">带看转化率</div>
              <div className="text-3xl font-bold text-blue-600">{overview.conversionRate}%</div>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            近30天 {overview.viewedCount} 次曝光，成交 {overview.convertedTotal} 套
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">平均去化周期</div>
              <div className="text-3xl font-bold text-gray-800">{overview.avgDaysOnMarket} 天</div>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            行业平均 22.5 天
            {overview.avgDaysOnMarket <= 22.5 && <span className="text-green-600 ml-2">✓ 优于平均</span>}
          </div>
        </div>
      </div>

      {/* Health score */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">综合健康度评分</h3>
            <p className="text-primary-200">基于空置率、转化率、去化周期等多维度综合评估</p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold">{healthScore}</div>
            <div className="text-primary-200 text-sm mt-1">
              {healthScore >= 80 ? '优秀' : healthScore >= 60 ? '良好' : healthScore >= 40 ? '一般' : '需改善'}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="w-full bg-primary-900/50 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                healthScore >= 80 ? 'bg-green-400' :
                healthScore >= 60 ? 'bg-blue-400' :
                healthScore >= 40 ? 'bg-accent-400' :
                'bg-red-400'
              }`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-primary-300 mt-1">
            <span>0</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4">房源类型分布</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="数量"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {typeChartData.map((_: any, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4">五维能力雷达图</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="得分" dataKey="A" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4">均价对比</h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="均价" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h4 className="font-semibold text-gray-800 mb-4">近6个月房源状态变化</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="上架中" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="已出租" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="已售出" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="已签约" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Price deviation */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent-500" /> 价格偏离度预警（TOP 10）
          </h4>
          <p className="text-sm text-gray-500 mt-1">挂牌价与智能估价偏差较大的房源，建议及时调价</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">房源</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">小区</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">挂牌价</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">估价</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">偏离度</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">建议</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {priceDeviation.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{p.community}</td>
                  <td className="px-5 py-4 text-right text-sm text-gray-800">¥ {(p.price / 10000).toFixed(2)} 万</td>
                  <td className="px-5 py-4 text-right text-sm text-gray-600">¥ {(p.estimated_price / 10000).toFixed(2)} 万</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      p.deviation > 15 ? 'bg-red-100 text-red-700' :
                      p.deviation > 8 ? 'bg-accent-100 text-accent-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {p.price > p.estimated_price ? '↑' : '↓'} {p.deviation}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm">
                    {p.deviation > 15 ? (
                      <span className="text-red-600">建议下调价格</span>
                    ) : p.deviation > 8 ? (
                      <span className="text-accent-600">适度关注</span>
                    ) : (
                      <span className="text-green-600">定价合理</span>
                    )}
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

export default PropertyHealth;
