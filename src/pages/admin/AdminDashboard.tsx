import { Users, Calendar, TrendingUp, Clock } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { mockDashboardStats } from '@/mock/dashboard';

const stats = mockDashboardStats;

const topStats = [
  { label: '参与学生', value: stats.totalStudents, icon: Users, color: 'text-primary-400' },
  { label: '实践活动', value: stats.totalActivities, icon: Calendar, color: 'text-accent-400' },
  { label: '参与率', value: `${stats.participationRate}%`, icon: TrendingUp, color: 'text-success-400' },
  { label: '服务总时长', value: stats.totalServiceHours, icon: Clock, color: 'text-purple-400' },
];

const deptData = stats.departmentRank.map((d) => ({
  department: d.department.replace('学院', ''),
  rate: d.participationRate,
}));

const hoursData = stats.departmentRank
  .sort((a, b) => b.serviceHours - a.serviceHours)
  .slice(0, 5)
  .map((d) => ({
    department: d.department.replace('学院', ''),
    hours: d.serviceHours,
  }));

const radarData = stats.baseSatisfaction.map((b) => ({
  base: b.baseName.replace(/研究所|人民政府|博物馆|人民医院|示范区/g, ''),
  score: b.score,
}));

export default function AdminDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-surface-900">管理仪表盘</h1>

      <div className="bg-surface-800 text-white rounded-2xl p-8 space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {topStats.map((s) => (
            <div key={s.label} className="bg-surface-700/50 rounded-xl p-5">
              <s.icon className={`w-6 h-6 ${s.color} mb-2`} />
              <p className="text-3xl font-bold font-mono">{s.value}</p>
              <p className="text-sm text-surface-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface-700/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-surface-300 mb-4">院系参与率</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="department" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#F1F5F9' }}
                  itemStyle={{ color: '#60A5FA' }}
                />
                <Bar dataKey="rate" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface-700/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-surface-300 mb-4">月度趋势</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={stats.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#F1F5F9' }}
                />
                <Legend />
                <Line type="monotone" dataKey="activities" stroke="#3B82F6" strokeWidth={2} dot={false} name="活动数" />
                <Line type="monotone" dataKey="participants" stroke="#F97316" strokeWidth={2} dot={false} name="参与人数" />
                <Line type="monotone" dataKey="hours" stroke="#10B981" strokeWidth={2} dot={false} name="服务时长" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface-700/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-surface-300 mb-4">基地满意度</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="base" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Radar name="满意度" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#F1F5F9' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface-700/30 rounded-xl p-5">
            <h3 className="text-sm font-medium text-surface-300 mb-4">服务时长TOP院系</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hoursData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis type="category" dataKey="department" tick={{ fill: '#94A3B8', fontSize: 11 }} width={60} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#F1F5F9' }}
                  itemStyle={{ color: '#10B981' }}
                />
                <Bar dataKey="hours" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
