import { useEffect, useState } from 'react';
import { FileText, Users, UserCheck, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useStore } from '@/store';
import { mockJobs, mockResumes, mockApplications, mockInterviews, mockAnalyticsData, mockCompanies, mockVerificationRecords } from '@/mock/data';
import StatCard from '@/components/ui/StatCard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

const dateRanges = [
  { id: '7', name: '7天', days: 7 },
  { id: '30', name: '30天', days: 30 },
  { id: '90', name: '90天', days: 90 },
  { id: 'custom', name: '自定义', days: 0 },
];

const COLORS = ['#1E3A5F', '#FF6B35', '#22C55E', '#3B82F6', '#A855F7', '#F59E0B'];

export default function Analytics() {
  const { setAnalyticsData, analyticsData, setCompany, setVerificationRecord } = useStore();
  const [activeRange, setActiveRange] = useState('30');

  useEffect(() => {
    setAnalyticsData(mockAnalyticsData);
    setCompany(mockCompanies[0]);
    setVerificationRecord(mockVerificationRecords[0]);
  }, [setAnalyticsData, setCompany, setVerificationRecord]);

  const calculateCostPerHire = () => {
    if (!analyticsData) return 0;
    const totalCost = analyticsData.channelData.reduce(
      (sum, ch) => sum + ch.hires * ch.costPerHire,
      0
    );
    return Math.round(totalCost / analyticsData.totalHires);
  };

  const pieData = analyticsData?.channelData.map(ch => ({
    name: ch.channel,
    value: ch.applications,
  })) || [];

  const channelTableData = analyticsData?.channelData.map(ch => ({
    ...ch,
    interviewRate: Math.round((ch.interviews / ch.applications) * 100) / 100,
    hireRate: Math.round((ch.hires / ch.applications) * 100) / 100,
  })) || [];

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">招聘数据分析</h1>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div className="flex bg-gray-100 rounded-lg p-1">
            {dateRanges.map(range => (
              <button
                key={range.id}
                onClick={() => setActiveRange(range.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeRange === range.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="总投递数"
          value={analyticsData?.totalApplications.toLocaleString() || 0}
          icon={<FileText className="h-6 w-6" />}
          trend="+15.2%"
          trendUp={true}
        />
        <StatCard
          title="到面率"
          value={`${Math.round((analyticsData?.interviewRate || 0) * 1000) / 10}%`}
          icon={<Users className="h-6 w-6" />}
          trend="+3.1%"
          trendUp={true}
        />
        <StatCard
          title="入职率"
          value={`${Math.round((analyticsData?.hireRate || 0) * 1000) / 10}%`}
          icon={<UserCheck className="h-6 w-6" />}
          trend="+2.4%"
          trendUp={true}
        />
        <StatCard
          title="人均招聘成本"
          value={`¥${calculateCostPerHire()}`}
          icon={<DollarSign className="h-6 w-6" />}
          trend="-8.3%"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">招聘趋势</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.slice(5)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name="投递数"
                  stroke="#1E3A5F"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="interviews"
                  name="面试数"
                  stroke="#FF6B35"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="hires"
                  name="入职数"
                  stroke="#22C55E"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">渠道分布</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), '投递数']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">渠道效果明细</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">渠道</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">浏览量</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">投递数</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">面试数</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">入职数</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">到面率</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">入职率</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">人均成本</th>
              </tr>
            </thead>
            <tbody>
              {channelTableData.map((channel, index) => (
                <tr key={channel.channel} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-900">{channel.channel}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900">
                    {channel.views.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900">
                    {channel.applications.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900">
                    {channel.interviews.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm font-medium text-success">
                    {channel.hires.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900">
                    {(channel.interviewRate * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900">
                    {(channel.hireRate * 100).toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 text-right text-sm font-medium text-accent">
                    ¥{channel.costPerHire}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4">渠道转化率对比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelTableData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="channel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
                <Tooltip
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Bar dataKey="interviewRate" name="到面率" fill="#1E3A5F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hireRate" name="入职率" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
