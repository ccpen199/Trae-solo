import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Smile,
  MapPin,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Tag,
} from 'lucide-react';
import { useGet } from '../../hooks/useApi';
import Card from '../../components/Card';
import StatusBadge from '../../components/StatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import type { AppealCluster } from '../../../shared/types';

const periodOptions = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
];

export default function Appeals() {
  const [period, setPeriod] = useState('7d');

  const { data: appealsData, isLoading } = useGet<{ clusters: AppealCluster[]; summary: any }>(
    ['appeals-clusters', period],
    `/governance/appeals?period=${period}`,
    { refetchInterval: 60000 }
  );

  const barData = appealsData?.clusters?.map((cluster) => ({
    name: cluster.category,
    数量: cluster.count,
    占比: cluster.percentage,
  })) || [];

  const trendData = appealsData?.clusters?.map((cluster) => ({
    name: cluster.category,
    趋势值: cluster.trendValue,
  })) || [];

  const satisfactionData = appealsData?.clusters?.map((cluster) => ({
    name: cluster.category,
    满意度: cluster.satisfactionRate,
    平均解决时长: 100 - cluster.avgResolutionTime,
  })) || [];

  const PIE_COLORS = ['#165DFF', '#FF7D00', '#00B42A', '#F53F3F', '#722ED1', '#0FC6C2', '#F7BA1E', '#86909C'];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendText = (trend: string, value: number) => {
    const absValue = Math.abs(value);
    switch (trend) {
      case 'up':
        return `上升 ${absValue}%`;
      case 'down':
        return `下降 ${absValue}%`;
      default:
        return '持平';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">高频诉求聚类</h2>
            <p className="text-sm text-gray-500">智能分析群众诉求，洞察民生热点</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          {periodOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Card.Body className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">诉求总量</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {appealsData?.summary?.totalAppeals?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {period === '7d' ? '近7天' : period === '30d' ? '近30天' : '近90天'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">平均解决时长</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {appealsData?.summary?.avgResolutionTime || 0}
                    <span className="text-lg font-normal text-gray-500"> 小时</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    较上周缩短 12.5%
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">整体满意度</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {appealsData?.summary?.overallSatisfaction || 0}
                    <span className="text-lg font-normal text-gray-500">%</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Smile className="w-3 h-3" />
                    群众满意度较高
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Smile className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">趋势变化</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-red-500">
                      {appealsData?.summary?.upTrendCount || 0}↑
                    </span>
                    <span className="text-2xl font-bold text-green-500">
                      {appealsData?.summary?.downTrendCount || 0}↓
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">上升/下降类别数</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              诉求类型分布
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="数量" fill="#165DFF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              诉求占比分布
            </h3>
          </Card.Header>
          <Card.Body>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={barData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="数量"
                    label={({ name, 占比 }) => `${name} ${占比}%`}
                    labelLine={false}
                  >
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            诉求类型详细分析
          </h3>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">诉求类型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">数量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">占比</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">趋势</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均解决时长</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">满意度</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">热点区域</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">热词</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appealsData?.clusters?.map((cluster, idx) => (
                  <motion.tr
                    key={cluster.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{cluster.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-semibold text-gray-900">{cluster.count}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${cluster.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{cluster.percentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                        cluster.trend === 'up' ? 'text-red-600' :
                        cluster.trend === 'down' ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                        {getTrendIcon(cluster.trend)}
                        {getTrendText(cluster.trend, cluster.trendValue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        cluster.avgResolutionTime > 48 ? 'text-red-600' :
                        cluster.avgResolutionTime > 24 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {cluster.avgResolutionTime} 小时
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              cluster.satisfactionRate >= 90 ? 'bg-green-500' :
                              cluster.satisfactionRate >= 70 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${cluster.satisfactionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{cluster.satisfactionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {cluster.locations.slice(0, 2).map((loc, i) => (
                          <span key={i} className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {loc.area} ({loc.count})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {cluster.hotWords.map((word, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            <Tag className="w-3 h-3" />
                            {word}
                          </span>
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h3 className="font-semibold text-gray-900">治理建议</h3>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {appealsData?.clusters?.slice(0, 3).map((cluster, idx) => (
              <motion.div
                key={cluster.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`rounded-xl p-5 ${
                  idx === 0 ? 'bg-red-50 border border-red-100' :
                  idx === 1 ? 'bg-yellow-50 border border-yellow-100' :
                  'bg-blue-50 border border-blue-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge
                    status={cluster.trend === 'up' ? 'error' : cluster.trend === 'down' ? 'success' : 'warning'}
                    text={cluster.trend === 'up' ? '需重点关注' : cluster.trend === 'down' ? '趋势向好' : '持续跟踪'}
                  />
                  <h4 className="font-semibold text-gray-900">{cluster.category}</h4>
                </div>
                <p className={`text-sm ${
                  idx === 0 ? 'text-red-700' :
                  idx === 1 ? 'text-yellow-700' :
                  'text-blue-700'
                }`}>
                  {cluster.trend === 'up'
                    ? `该类诉求呈上升趋势（+${cluster.trendValue}%），建议加强${cluster.hotWords[0]}、${cluster.hotWords[1]}等方面的工作力度，重点关注${cluster.locations[0]?.area}区域。`
                    : cluster.trend === 'down'
                    ? `该类诉求呈下降趋势（${cluster.trendValue}%），当前治理措施有效，建议继续保持。`
                    : `该类诉求数量平稳，建议持续关注${cluster.hotWords[0]}相关问题。`
                  }
                </p>
              </motion.div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </motion.div>
  );
}
