import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  MapPin,
  Map,
} from 'lucide-react';
import { useAppStore } from '@/store';
import type { DashboardData } from '@/types';

const COLORS = ['#1E4D8C', '#2D6BC4', '#2D9D72', '#34D399', '#E8A838', '#FBBF24', '#60A5FA', '#34D399', '#F472B6', '#A78BFA'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const loadDashboardData = useAppStore((state) => state.loadDashboardData);

  useEffect(() => {
    const fetchData = async () => {
      await loadDashboardData();
      setData(useAppStore.getState().dashboardData);
    };
    fetchData();
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const overview = data.overview;

  const statCards = [
    {
      title: '实名市民总数',
      value: overview.totalCitizens.toLocaleString(),
      subValue: `今日新增 ${overview.todayNewCitizens.toLocaleString()}`,
      growth: overview.citizensGrowth,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: '累计交易笔数',
      value: overview.totalTransactions.toLocaleString(),
      subValue: `今日 ${overview.todayTransactions.toLocaleString()} 笔`,
      growth: overview.transactionsGrowth,
      icon: CreditCard,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: '累计交易额',
      value: `¥${(overview.totalRevenue / 10000).toLocaleString()}万`,
      subValue: `今日 ¥${(overview.todayRevenue / 10000).toLocaleString()}万`,
      growth: overview.revenueGrowth,
      icon: DollarSign,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: '7日活跃用户',
      value: overview.activeUsers7d.toLocaleString(),
      subValue: '活跃率 36.3%',
      growth: 5.8,
      icon: TrendingUp,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">运营总览</h1>
          <p className="text-gray-500 text-sm mt-1">实时监控平台核心运营数据</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            系统运行正常
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-card p-6 hover:shadow-card-hover transition-all"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className={card.iconColor} />
                </div>
                <div
                  className={`flex items-center text-sm font-medium ${
                    card.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {card.growth >= 0 ? (
                    <TrendingUp size={14} className="mr-1" />
                  ) : (
                    <TrendingDown size={14} className="mr-1" />
                  )}
                  {Math.abs(card.growth)}%
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-sm text-gray-500">{card.title}</h3>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.subValue}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">一周趋势分析</h3>
              <p className="text-sm text-gray-500 mt-1">新增市民、交易笔数、交易额</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-primary-500 mr-2"></span>
                新增市民
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                交易笔数
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                交易额
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weeklyTrend}>
                <defs>
                  <linearGradient id="colorCitizens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E4D8C" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1E4D8C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTrans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D9D72" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2D9D72" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="newCitizens"
                  stroke="#1E4D8C"
                  strokeWidth={2.5}
                  fill="url(#colorCitizens)"
                  name="新增市民"
                />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  stroke="#2D9D72"
                  strokeWidth={2.5}
                  fill="url(#colorTrans)"
                  name="交易笔数"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#E8A838"
                  strokeWidth={2.5}
                  fill="transparent"
                  name="交易额"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center mb-6">
            <Map size={20} className="text-primary-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">各区县分布</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.districtStats.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="citizenCount"
                  nameKey="district"
                >
                  {data.districtStats.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {data.districtStats.slice(0, 6).map((item, index) => (
              <div key={item.district} className="flex items-center text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index] }}
                ></span>
                <span className="text-gray-600">{item.district}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <MapPin size={20} className="text-secondary-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">景区入园热力TOP5</h3>
            </div>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看全部 →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...data.scenicHeatmap]
                  .sort((a, b) => b.todayVisitorCount - a.todayVisitorCount)
                  .slice(0, 5)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="scenicName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#374151', fontSize: 12 }}
                  width={70}
                />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  }}
                />
                <Bar dataKey="todayVisitorCount" name="今日游客" radius={[0, 8, 8, 0]}>
                  {[...data.scenicHeatmap]
                    .sort((a, b) => b.todayVisitorCount - a.todayVisitorCount)
                    .slice(0, 5)
                    .map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.heatLevel > 80 ? '#EF4444' : entry.heatLevel > 60 ? '#F59E0B' : '#2D9D72'}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrendingUp size={20} className="text-accent-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">交通卡异地使用TOP5</h3>
            </div>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看全部 →
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.transportTopCities.filter((c) => c.cityCode !== '3205').slice(0, 5)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="cityName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#374151', fontSize: 12 }}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  }}
                />
                <Bar
                  dataKey="transactionCount"
                  name="交易笔数"
                  fill="#1E4D8C"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
