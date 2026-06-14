import { useState, useEffect } from 'react';
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
  Legend,
} from 'recharts';
import {
  Users,
  Building2,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import type { AdminOverview } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const mockOverview: AdminOverview = {
  totalStudents: 12580,
  totalCompanies: 856,
  totalJobs: 3420,
  totalApplications: 28650,
  totalComplaints: 142,
  complaintRate: 0.5,
  salaryComplianceRate: 94.2,
  avgSalary: 3250,
  dailyTrend: [
    { date: '06-08', students: 12000, jobs: 3200, applications: 25000 },
    { date: '06-09', students: 12150, jobs: 3250, applications: 25800 },
    { date: '06-10', students: 12280, jobs: 3280, applications: 26500 },
    { date: '06-11', students: 12350, jobs: 3320, applications: 27200 },
    { date: '06-12', students: 12420, jobs: 3360, applications: 27800 },
    { date: '06-13', students: 12500, jobs: 3390, applications: 28200 },
    { date: '06-14', students: 12580, jobs: 3420, applications: 28650 },
  ],
  schoolDistribution: [
    { name: '清华大学', value: 856 },
    { name: '北京大学', value: 782 },
    { name: '复旦大学', value: 654 },
    { name: '上海交大', value: 621 },
    { name: '浙江大学', value: 598 },
    { name: '南京大学', value: 487 },
  ],
  jobTypeDistribution: [
    { name: '技术开发', value: 1250 },
    { name: '产品设计', value: 680 },
    { name: '运营市场', value: 520 },
    { name: '人力资源', value: 340 },
    { name: '财务金融', value: 290 },
    { name: '其他', value: 340 },
  ],
};

const statCards = [
  { key: 'students', label: '学生总数', icon: Users, value: 'totalStudents', suffix: '人', color: 'from-blue-500 to-blue-600' },
  { key: 'companies', label: '企业总数', icon: Building2, value: 'totalCompanies', suffix: '家', color: 'from-emerald-500 to-emerald-600' },
  { key: 'jobs', label: '岗位总数', icon: Briefcase, value: 'totalJobs', suffix: '个', color: 'from-amber-500 to-amber-600' },
  { key: 'complaintRate', label: '投诉率', icon: AlertTriangle, value: 'complaintRate', suffix: '%', color: 'from-rose-500 to-rose-600' },
  { key: 'compliance', label: '薪资达标率', icon: TrendingUp, value: 'salaryComplianceRate', suffix: '%', color: 'from-teal-500 to-teal-600' },
  { key: 'salary', label: '平均薪资', icon: DollarSign, value: 'avgSalary', suffix: '元/月', color: 'from-purple-500 to-purple-600' },
];

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'];

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview>(mockOverview);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.get<AdminOverview>('/admin/overview');
        setOverview(data);
      } catch {
        setOverview(mockOverview);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatValue = (key: string) => {
    const value = overview[key as keyof AdminOverview] as number;
    if (key === 'complaintRate' || key === 'salaryComplianceRate') {
      return value.toFixed(1);
    }
    if (value >= 10000) {
      return (value / 10000).toFixed(1) + '万';
    }
    return value.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据总览</h1>
          <p className="text-slate-400 mt-1">实时监控实习平台运营数据</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-full">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">实时更新</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="bg-slate-800/60 backdrop-blur rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
            >
              <div className={cn(
                'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 shadow-lg',
                card.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-slate-400 mb-1">{card.label}</p>
              <p className="text-2xl font-bold text-white">
                {formatValue(card.value)}
                <span className="text-sm font-normal text-slate-400 ml-1">
                  {card.suffix}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">7日数据趋势</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="students"
                  name="学生数"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="jobs"
                  name="岗位数"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name="投递数"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">院校学生分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.schoolDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#94A3B8"
                  fontSize={12}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Bar dataKey="value" name="学生数" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">岗位类型分布</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overview.jobTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {overview.jobTypeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    color: '#F1F5F9',
                  }}
                />
                <Legend
                  verticalAlign="middle"
                  align="right"
                  layout="vertical"
                  formatter={(value: string) => (
                    <span className="text-sm text-slate-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">关键指标</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-300">今日新增学生</span>
              <span className="text-xl font-bold text-emerald-400">+128</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-300">今日新增岗位</span>
              <span className="text-xl font-bold text-blue-400">+42</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-300">待处理投诉</span>
              <span className="text-xl font-bold text-amber-400">23</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
              <span className="text-slate-300">实习完成率</span>
              <span className="text-xl font-bold text-purple-400">87.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
