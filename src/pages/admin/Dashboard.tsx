import { Users, CheckCircle, Activity, Clock } from 'lucide-react'
import { useAdminStore } from '@/stores/adminStore'
import StatCard from '@/components/StatCard'
import { useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const PIE_COLORS = ['#1B3A5C', '#E8763A', '#2EAD6B', '#F5A623', '#D94452']

export default function Dashboard() {
  const { dashboardStats, fetchDashboardStats, loading } = useAdminStore()

  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  if (loading && !dashboardStats) {
    return <div className="text-center text-gray-400 py-20">加载中...</div>
  }

  if (!dashboardStats) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="总认证量" value={dashboardStats.totalCerts.toLocaleString()} color="primary" trend={{ value: 5.2, label: '较上月' }} />
        <StatCard icon={Activity} label="今日认证" value={dashboardStats.todayCerts.toLocaleString()} color="accent" trend={{ value: 12.3, label: '较昨日' }} />
        <StatCard icon={CheckCircle} label="认证通过率" value={`${dashboardStats.passRate}%`} color="success" trend={{ value: 0.5, label: '较上月' }} />
        <StatCard icon={Clock} label="待复核工单" value={dashboardStats.pendingReviews} color="warning" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-bold text-primary mb-4">月度认证趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dashboardStats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 13 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#1B3A5C" strokeWidth={2} dot={{ fill: '#1B3A5C', r: 4 }} name="认证量" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-bold text-primary mb-4">时段分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboardStats.hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
              <XAxis dataKey="hour" tick={{ fontSize: 13 }} />
              <YAxis tick={{ fontSize: 13 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#E8763A" radius={[4, 4, 0, 0]} name="认证量" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-bold text-primary mb-4">失败原因分析</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={dashboardStats.failureReasons}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dashboardStats.failureReasons.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-card shadow-card p-6">
          <h3 className="text-lg font-bold text-primary mb-4">地区分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dashboardStats.regionDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
              <XAxis type="number" tick={{ fontSize: 13 }} />
              <YAxis dataKey="region" type="category" tick={{ fontSize: 13 }} width={60} />
              <Tooltip />
              <Bar dataKey="count" fill="#1B3A5C" radius={[0, 4, 4, 0]} name="认证量" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
