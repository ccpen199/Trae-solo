import { useEffect } from 'react';
import { FileText, Users, UserCheck, TrendingUp, Eye } from 'lucide-react';
import { useStore } from '@/store';
import { mockJobs, mockResumes, mockApplications, mockInterviews, mockAnalyticsData, mockCompanies, mockVerificationRecords } from '@/mock/data';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatDate, formatSalary } from '@/utils/helpers';
import type { Application } from '@/../shared/types';
import {
  FunnelChart,
  Funnel,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

const COLORS = ['#1E3A5F', '#2D4F7A', '#3D6495', '#4D79B0', '#5D8ECB'];

const channelConversionData = mockAnalyticsData.channelData.map(channel => ({
  channel: channel.channel,
  conversionRate: Math.round((channel.hires / channel.views) * 10000) / 100,
}));

export default function Dashboard() {
  const {
    setJobs,
    setTalentPool,
    setApplications,
    setEmployerInterviews,
    setAnalyticsData,
    setCompany,
    setVerificationRecord,
    applications,
    analyticsData,
  } = useStore();

  useEffect(() => {
    setJobs(mockJobs);
    setTalentPool(mockResumes);
    setApplications(mockApplications);
    setEmployerInterviews(mockInterviews);
    setAnalyticsData(mockAnalyticsData);
    setCompany(mockCompanies[0]);
    setVerificationRecord(mockVerificationRecords[0]);
  }, [setJobs, setTalentPool, setApplications, setEmployerInterviews, setAnalyticsData, setCompany, setVerificationRecord]);

  const todayApplications = applications.filter(
    (app) => new Date(app.appliedAt).toDateString() === new Date('2026-06-20').toDateString()
  ).length;

  const pendingInterviews = mockInterviews.filter((i) => i.status === 'pending').length;

  const currentMonthHires = applications.filter(
    (app) => app.status === 'accepted' && new Date(app.viewedAt || '').getMonth() === new Date('2026-06-20').getMonth()
  ).length;

  const conversionRate = analyticsData
    ? Math.round(analyticsData.hireRate * 1000) / 10
    : 0;

  const recentApplications = [...applications]
    .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
    .slice(0, 5);

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">雇主仪表盘</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="今日投递"
          value={todayApplications}
          icon={<FileText className="h-6 w-6" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="待面试"
          value={pendingInterviews}
          icon={<Users className="h-6 w-6" />}
          trend="+3"
          trendUp={true}
        />
        <StatCard
          title="本月入职"
          value={currentMonthHires}
          icon={<UserCheck className="h-6 w-6" />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title="岗位转化率"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          trend="+2.3%"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">招聘漏斗</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), '人数']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Funnel
                  data={analyticsData?.funnelData || []}
                  dataKey="count"
                  nameKey="step"
                >
                  {analyticsData?.funnelData?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList
                    position="right"
                    fill="#374151"
                    stroke="none"
                    dataKey="step"
                    fontSize={12}
                  />
                  <LabelList
                    position="center"
                    fill="white"
                    stroke="none"
                    dataKey="count"
                    fontSize={14}
                    fontWeight="bold"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">渠道转化率</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelConversionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="channel"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '转化率']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="conversionRate" radius={[0, 4, 4, 0]}>
                  {channelConversionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#FF6B35' : COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">最新投递</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">候选人</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">应聘岗位</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">薪资</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">投递时间</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {recentApplications.map((app: Application) => (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {app.userName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{app.userName}</p>
                        <p className="text-xs text-gray-500">{app.userPhone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900">{app.job?.title}</td>
                  <td className="py-4 px-4 text-sm text-gray-900">
                    {app.job && formatSalary(app.job.salaryMin, app.job.salaryMax, app.job.salaryType)}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={app.status} type="application" />
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-500">{formatDate(app.appliedAt)}</td>
                  <td className="py-4 px-4">
                    <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                      <Eye className="h-4 w-4" />
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
