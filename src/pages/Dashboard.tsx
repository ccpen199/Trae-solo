import { motion } from 'framer-motion';
import { Home, Clock, Calculator, CheckCircle, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/ui/StatCard';
import Progress from '@/components/ui/Progress';
import LineChart from '@/components/charts/LineChart';
import { useAppStore } from '@/store/useAppStore';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '@/utils/formatters';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { dashboardStats, projects } = useAppStore();

  const creditTrendData = dashboardStats.creditTrend.map((item) => ({
    name: item.date,
    value: item.score,
  }));

  const monthlyQuoteData = dashboardStats.monthlyQuotes.map((item) => ({
    name: item.month,
    value: item.count,
  }));

  const recentProjects = projects.slice(0, 5);

  const getProjectStatus = (progress: number): string => {
    if (progress >= 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'pending';
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 font-display">数据总览</h1>
        <p className="text-gray-500 mt-1">平台运营概览</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="项目总数"
          value={dashboardStats.totalProjects}
          icon={Home}
          color="primary"
          trend={{ value: 12.5, isPositive: true }}
          delay={0.1}
        />
        <StatCard
          title="进行中项目"
          value={dashboardStats.activeProjects}
          icon={Clock}
          color="info"
          trend={{ value: 8.3, isPositive: true }}
          delay={0.2}
        />
        <StatCard
          title="AI报价总数"
          value={dashboardStats.totalQuotes}
          icon={Calculator}
          color="gold"
          trend={{ value: 15.2, isPositive: true }}
          delay={0.3}
        />
        <StatCard
          title="纠纷解决率"
          value={`${dashboardStats.resolutionRate}%`}
          icon={CheckCircle}
          color="success"
          trend={{ value: 3.1, isPositive: true }}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2 card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">信用分趋势</h3>
          <LineChart
            data={creditTrendData}
            color="#1a365d"
            height={300}
            showArea
            yAxisFormatter={(value) => value.toString()}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">月度报价统计</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyQuoteData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(value: number) => [value, '报价数量']}
                />
                <Bar
                  dataKey="value"
                  fill="#d97706"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">最近项目</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {recentProjects.map((project, index) => {
            const status = getProjectStatus(project.progress);
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                className="card p-4 hover:-translate-y-1 transition-transform"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{project.name}</h4>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      getStatusColor(status)
                    )}
                  >
                    {getStatusText(status)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{project.address}</span>
                </div>
                <Progress value={project.progress} size="sm" showLabel label="进度" />
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>{formatCurrency(project.totalBudget)}</span>
                  <span>{formatDate(project.startDate)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
