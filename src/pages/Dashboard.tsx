import { useEffect, useState } from 'react';
import { reportApi, riskApi } from '../lib/api';
import { Users, Gift, TrendingUp, Shield, Calendar, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [prizeData, setPrizeData] = useState<any[]>([]);
  const [pendingRiskCount, setPendingRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dashboardRes, trendRes, prizeRes, riskRes] = await Promise.all([
        reportApi.getDashboard(),
        reportApi.getTrend(7),
        reportApi.getPrizeDistribution(),
        riskApi.getPendingCount(),
      ]);

      if (dashboardRes.data.code === 200) {
        setDashboardData(dashboardRes.data.data);
      }
      if (trendRes.data.code === 200) {
        setTrendData(trendRes.data.data || []);
      }
      if (prizeRes.data.code === 200) {
        setPrizeData(prizeRes.data.data || []);
      }
      if (riskRes.data.code === 200) {
        setPendingRiskCount(riskRes.data.data?.count || 0);
      }
    } catch (error) {
      console.error('Load dashboard failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: '进行中活动', value: dashboardData?.activeActivities || 0, icon: Calendar, color: 'from-blue-500 to-blue-600' },
    { label: '累计参与用户', value: dashboardData?.totalUsers || 0, icon: Users, color: 'from-green-500 to-green-600' },
    { label: '累计抽奖次数', value: dashboardData?.totalDraws || 0, icon: TrendingUp, color: 'from-purple-500 to-purple-600' },
    { label: '累计发放奖品', value: dashboardData?.totalWinners || 0, icon: Gift, color: 'from-orange-500 to-orange-600' },
    { label: '奖品总成本', value: `¥${dashboardData?.totalCost?.toFixed(2) || 0}`, icon: DollarSign, color: 'from-pink-500 to-pink-600' },
    { label: '待处理风控', value: pendingRiskCount, icon: Shield, color: 'from-red-500 to-red-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">仪表盘</h1>
        <p className="text-gray-500 mt-1">平台运营数据概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">参与趋势</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="participants" stroke="#3B82F6" strokeWidth={2} name="参与人数" />
                <Line type="monotone" dataKey="draws" stroke="#8B5CF6" strokeWidth={2} name="抽奖次数" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">奖品分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={prizeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prizeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
