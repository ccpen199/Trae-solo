import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Clock,
  Building2,
  Award,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { mockStats } from '../data/mockData';

interface StatCard {
  title: string;
  value: string;
  unit: string;
  icon: typeof Users;
  color: 'blue' | 'green' | 'orange' | 'purple';
  trend: string;
  trendUp: boolean;
  clickable?: boolean;
  navigatePath?: string;
}

interface DepartmentRankItem {
  name: string;
  hours: number;
  rate: number;
  teamCount: number;
  avgHours: number;
}

interface BaseSatisfactionItem {
  name: string;
  score: number;
  checkins: number;
  teams: number;
}

interface MonthlyDataItem {
  month: string;
  hours: number;
  teams: number;
  logs: number;
  checkins: number;
}

const Dashboard = () => {
  useApp();
  const navigate = useNavigate();

  const statCards: StatCard[] = [
    {
      title: '参与学生数',
      value: mockStats.totalStudents.toLocaleString(),
      unit: '人',
      icon: Users,
      color: 'blue',
      trend: '+12.5%',
      trendUp: true,
    },
    {
      title: '实践团队数',
      value: String(mockStats.totalTeams),
      unit: '支',
      icon: Award,
      color: 'green',
      trend: '+8.3%',
      trendUp: true,
      clickable: true,
      navigatePath: '/sanxiaxiang/teams',
    },
    {
      title: '总服务时长',
      value: mockStats.totalHours.toLocaleString(),
      unit: '小时',
      icon: Clock,
      color: 'orange',
      trend: '+15.2%',
      trendUp: true,
      clickable: true,
      navigatePath: '/sanxiaxiang/checkin',
    },
    {
      title: '实践基地数',
      value: String(mockStats.totalBases),
      unit: '个',
      icon: Building2,
      color: 'purple',
      trend: '-2.4%',
      trendUp: false,
    },
  ];

  const participationData = [
    { name: '参与率', value: mockStats.participationRate },
    { name: '未参与', value: 100 - mockStats.participationRate },
  ];

  const departmentRanking = mockStats.departmentRanking as DepartmentRankItem[];
  const baseSatisfaction = mockStats.baseSatisfaction as BaseSatisfactionItem[];
  const monthlyData = mockStats.monthlyData as MonthlyDataItem[];

  const renderLineTooltip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: Array<{ payload: unknown; name?: string; value?: unknown; color?: unknown; dataKey?: unknown }> };
    if (p.active && p.payload && p.payload.length) {
      const data = p.payload[0].payload as MonthlyDataItem;
      return (
        <div
          style={{
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: '#fff',
            padding: '12px',
          }}
        >
          <p className="text-sm font-medium text-gray-800 mb-2">{data.month}</p>
          {p.payload.map((entry, index: number) => (
            <p key={index} className="text-sm text-gray-600 mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: entry.color as string }}
              />
              {entry.name}: {entry.value as number}
              {entry.dataKey === 'hours' ? ' 小时' : ' 支'}
            </p>
          ))}
          <p className="text-xs text-gray-500 mt-2">
            日志数: {data.logs}篇 / 打卡数: {data.checkins}次
          </p>
        </div>
      );
    }
    return null;
  };

  const renderBarTooltip = (props: unknown) => {
    const p = props as { active?: boolean; payload?: Array<{ payload: unknown }> };
    if (p.active && p.payload && p.payload.length) {
      const data = p.payload[0].payload as DepartmentRankItem;
      return (
        <div
          style={{
            borderRadius: '8px',
            border: '1px solid #eee',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            backgroundColor: '#fff',
            padding: '12px',
          }}
        >
          <p className="text-sm font-medium text-gray-800 mb-1">{data.name}</p>
          <p className="text-sm text-gray-600 mb-2">
            服务时长: {data.hours.toLocaleString()} 小时
          </p>
          <p className="text-xs text-blue-500">点击查看该系全部团队</p>
        </div>
      );
    }
    return null;
  };

  const deptColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'orange':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-purple-100 text-purple-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-200 ${
              card.clickable
                ? 'cursor-pointer hover:border-blue-300 hover:shadow-md'
                : ''
            }`}
            onClick={() => {
              if (card.clickable && card.navigatePath) {
                navigate(card.navigatePath);
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-800">
                    {card.value}
                  </span>
                  <span className="text-sm text-gray-500">{card.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {card.trendUp ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      card.trendUp ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {card.trend}
                  </span>
                  <span className="text-xs text-gray-400">同比</span>
                </div>
                {card.clickable && (
                  <p className="text-xs text-gray-400 mt-3">点击查看明细 →</p>
                )}
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${deptColorClasses(
                  card.color
                )}`}
              >
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">服务时长趋势</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-500">服务时长</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-500">团队数</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <Tooltip content={renderLineTooltip} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="服务时长"
                />
                <Line
                  type="monotone"
                  dataKey="teams"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                  name="团队数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-md"
          onClick={() => navigate('/admin/departments')}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-6">学生参与率</h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={participationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#e5e7eb" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-3xl font-bold text-blue-600">
              {mockStats.participationRate}%
            </span>
            <p className="text-sm text-gray-500 mt-1">整体参与率</p>
            <p className="text-sm text-blue-600 mt-2 font-medium">
              查看院系排行 →
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            服务时长TOP院系
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentRanking}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  stroke="#999"
                  width={80}
                />
                <Tooltip content={renderBarTooltip} />
                <Bar
                  dataKey="hours"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  name="服务时长"
                  cursor="pointer"
                  onClick={(data) =>
                    navigate(
                      `/sanxiaxiang/teams?dept=${encodeURIComponent(
                        (data as unknown as { payload: DepartmentRankItem }).payload.name
                      )}`
                    )
                  }
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
              <div className="col-span-1">排名</div>
              <div className="col-span-3">院系名</div>
              <div className="col-span-2 text-right">总时长</div>
              <div className="col-span-2 text-right">团队数</div>
              <div className="col-span-2 text-right">参与率</div>
              <div className="col-span-2 text-right">人均时长</div>
            </div>
            {departmentRanking.map((dept, index) => (
              <div
                key={dept.name}
                className="grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 hover:bg-blue-50 items-center"
                onClick={() =>
                  navigate(
                    `/sanxiaxiang/teams?dept=${encodeURIComponent(dept.name)}`
                  )
                }
              >
                <div className="col-span-1">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      index < 3
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="col-span-3 text-sm font-medium text-gray-700 truncate">
                  {dept.name}
                </div>
                <div className="col-span-2 text-sm text-gray-600 text-right">
                  {dept.hours.toLocaleString()}h
                </div>
                <div className="col-span-2 text-sm text-gray-600 text-right">
                  {dept.teamCount}支
                </div>
                <div className="col-span-2 text-sm text-gray-600 text-right">
                  {dept.rate}%
                </div>
                <div className="col-span-2 text-sm text-gray-600 text-right">
                  {dept.avgHours}h
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            基地满意度排名
          </h3>
          <div className="space-y-2">
            {baseSatisfaction.map((base, index) => (
              <div
                key={base.name}
                className="flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50"
                onClick={() =>
                  navigate(
                    `/admin/bases?base=${encodeURIComponent(base.name)}`
                  )
                }
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    index < 3
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {base.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 ml-2 flex-shrink-0">
                      {base.score}分
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${base.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
