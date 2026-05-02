import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppStore } from '../stores/app.store';
import { metricsApi } from '../services/api';
import type { RealTimeMetrics } from '../types';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

export function Dashboard() {
  const { metrics, setMetrics, services } = useAppStore();
  const [metricsHistory, setMetricsHistory] = useState<
    Array<{ time: string; requests: number; successRate: number; avgDuration: number; errors: number }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await metricsApi.getRealTime();
      setMetrics(data);
      setMetricsHistory((prev) => {
        const newEntry = {
          time: new Date().toLocaleTimeString(),
          requests: data.totalRequests,
          successRate: data.successRate,
          avgDuration: data.avgDuration,
          errors: data.errorCount,
        };
        return [...prev.slice(-19), newEntry];
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RUNNING':
        return '#10b981';
      case 'OFFLINE':
        return '#6b7280';
      case 'MAINTENANCE':
        return '#f59e0b';
      case 'DEGRADED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const pieData = metrics
    ? [
        { name: 'Success', value: metrics.successRate },
        { name: 'Errors', value: 100 - metrics.successRate },
      ]
    : [];

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>正在加载仪表盘...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>仪表盘</h1>
        <p style={styles.subtitle}>实时指标与系统概览</p>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="请求总数"
          value={metrics?.totalRequests || 0}
          icon="📊"
          color="#3b82f6"
        />
        <StatCard
          title="成功率"
          value={`${metrics?.successRate.toFixed(2) || 0}%`}
          icon="✅"
          color="#10b981"
        />
        <StatCard
          title="平均耗时"
          value={`${metrics?.avgDuration.toFixed(0) || 0}ms`}
          icon="⏱️"
          color="#f59e0b"
        />
        <StatCard
          title="错误数量"
          value={metrics?.errorCount || 0}
          icon="⚠️"
          color="#ef4444"
        />
        <StatCard
          title="运行服务"
          value={metrics?.activeServices || 0}
          icon="🔧"
          color="#8b5cf6"
        />
        <StatCard
          title="熔断状态"
          value={metrics?.openCircuits || 0}
          icon="🔌"
          color="#ec4899"
        />
      </div>

      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>请求流量</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="#3b82f6"
                fill="#dbeafe"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>成功率与响应时间</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metricsHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="left" stroke="#10b981" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="successRate"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="成功率 (%)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="avgDuration"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="平均耗时 (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>成功与错误分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.pieLegend}>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: COLORS[0] }} />
              <span>成功</span>
            </div>
            <div style={styles.legendItem}>
              <span style={{ ...styles.legendDot, backgroundColor: COLORS[1] }} />
              <span>错误</span>
            </div>
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>引擎状态</h3>
          <div style={styles.engineGrid}>
            <EngineStatus name="反向代理" status="运行中" icon="🔄" />
            <EngineStatus name="流量防护" status="运行中" icon="🛡️" />
            <EngineStatus name="鉴权守卫" status="运行中" icon="🔐" />
            <EngineStatus name="遥测引擎" status="运行中" icon="📡" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      <div>
        <p style={styles.statTitle}>{title}</p>
        <p style={{ ...styles.statValue, color }}>{value}</p>
      </div>
    </div>
  );
}

function EngineStatus({ name, status, icon }: { name: string; status: string; icon: string }) {
  return (
    <div style={styles.engineCard}>
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div>
        <p style={styles.engineName}>{name}</p>
        <p style={styles.engineStatus}>{status}</p>
      </div>
      <div style={styles.engineIndicator}>
        <div style={styles.indicatorPulse} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    fontSize: '18px',
    color: '#6b7280',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 700,
    color: '#1f2937',
  },
  subtitle: {
    margin: '8px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTitle: {
    margin: 0,
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: 500,
  },
  statValue: {
    margin: '4px 0 0 0',
    fontSize: '24px',
    fontWeight: 700,
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  chartTitle: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
  },
  pieLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    marginTop: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#6b7280',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  engineGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  engineCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  engineName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#1f2937',
  },
  engineStatus: {
    margin: '2px 0 0 0',
    fontSize: '12px',
    color: '#10b981',
  },
  engineIndicator: {
    marginLeft: 'auto',
  },
  indicatorPulse: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    animation: 'pulse 2s infinite',
  },
};
