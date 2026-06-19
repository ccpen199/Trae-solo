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
import { mockStats } from '../data/mockData';

const Dashboard = () => {
  const statCards = [
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
      value: mockStats.totalTeams,
      unit: '支',
      icon: Award,
      color: 'green',
      trend: '+8.3%',
      trendUp: true,
    },
    {
      title: '总服务时长',
      value: mockStats.totalHours.toLocaleString(),
      unit: '小时',
      icon: Clock,
      color: 'orange',
      trend: '+15.2%',
      trendUp: true,
    },
    {
      title: '实践基地数',
      value: mockStats.totalBases,
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-start justify-between">
              <div>
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
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  card.color === 'blue'
                    ? 'bg-blue-100 text-blue-600'
                    : card.color === 'green'
                    ? 'bg-green-100 text-green-600'
                    : card.color === 'orange'
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-purple-100 text-purple-600'
                }`}
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
              <LineChart data={mockStats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
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

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
                data={mockStats.departmentRanking}
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
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} name="服务时长" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            基地满意度排名
          </h3>
          <div className="space-y-4">
            {mockStats.baseSatisfaction.map((base: { name: string; score: number }, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index < 3
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {base.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {base.score}分
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
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
