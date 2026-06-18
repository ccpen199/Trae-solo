import { useEffect, useState, useRef } from 'react';
import {
  BarChart3,
  Clock,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from '@/components/StatCard';
import { apiFetch } from '@/lib/api';

interface StatData {
  total: number;
  completionRate: number;
  avgDuration: string;
  pending: number;
}

interface TimeoutItem {
  id: number;
  type: string;
  applicant: string;
  overdue: number;
  severity: 'high' | 'medium' | 'low';
}

interface RejectionItem {
  reason: string;
  count: number;
  percentage: number;
}

interface HotspotItem {
  category: string;
  count: number;
  trend: number;
}

const defaultStats: StatData = {
  total: 12847,
  completionRate: 94.6,
  avgDuration: '2.3天',
  pending: 156,
};

const volumeData = [
  { date: '6/12', value: 420 },
  { date: '6/13', value: 380 },
  { date: '6/14', value: 510 },
  { date: '6/15', value: 460 },
  { date: '6/16', value: 490 },
  { date: '6/17', value: 530 },
  { date: '6/18', value: 480 },
];

const typeData = [
  { name: '社保', value: 4200 },
  { name: '就业', value: 3100 },
  { name: '人才', value: 2800 },
  { name: '劳动关系', value: 1600 },
  { name: '其他', value: 1147 },
];

const defaultTimeouts: TimeoutItem[] = [
  { id: 1, type: '失业金申领', applicant: '王某某', overdue: 5, severity: 'high' },
  { id: 2, type: '职称申报', applicant: '李某', overdue: 3, severity: 'medium' },
  { id: 3, type: '社保转移', applicant: '赵某某', overdue: 2, severity: 'low' },
];

const defaultRejections: RejectionItem[] = [
  { reason: '材料不完整', count: 45, percentage: 35 },
  { reason: '信息填写错误', count: 32, percentage: 25 },
  { reason: '不符合办理条件', count: 28, percentage: 22 },
  { reason: '重复提交', count: 15, percentage: 12 },
  { reason: '其他原因', count: 8, percentage: 6 },
];

const defaultHotspots: HotspotItem[] = [
  { category: '社保缴费基数调整', count: 234, trend: 15.2 },
  { category: '失业金申领条件', count: 189, trend: -3.1 },
  { category: '劳动合同签订', count: 156, trend: 8.7 },
];

function AnimatedNumber({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      setCurrent(Math.floor(progress * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return <>{current.toLocaleString()}</>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatData>(defaultStats);
  const [timeouts, setTimeouts] = useState<TimeoutItem[]>(defaultTimeouts);
  const [rejections, setRejections] = useState<RejectionItem[]>(defaultRejections);
  const [hotspots, setHotspots] = useState<HotspotItem[]>(defaultHotspots);

  useEffect(() => {
    apiFetch<StatData>('/api/monitor/statistics').catch(() => defaultStats).then(setStats);
    apiFetch<TimeoutItem[]>('/api/monitor/timeout').catch(() => defaultTimeouts).then(setTimeouts);
    apiFetch<RejectionItem[]>('/api/monitor/rejection').catch(() => defaultRejections).then(setRejections);
    apiFetch<HotspotItem[]>('/api/monitor/hotspot').catch(() => defaultHotspots).then(setHotspots);
  }, []);

  const severityColors: Record<string, string> = {
    high: 'bg-danger-500',
    medium: 'bg-accent-500',
    low: 'bg-yellow-400',
  };

  return (
    <div className="bg-[#0f172a] min-h-[calc(100vh-7rem)] -m-6 p-6 space-y-6 rounded-lg">
      <h1 className="text-xl font-semibold text-white">效能总览</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label="总办理量"
          value={<AnimatedNumber target={stats.total} />}
          color="text-blue-400"
          dark
          trend={{ value: 5.2, label: '较上周' }}
        />
        <StatCard
          icon={FileText}
          label="办结率"
          value={`${stats.completionRate}%`}
          color="text-emerald-400"
          dark
          trend={{ value: 1.8, label: '较上周' }}
        />
        <StatCard
          icon={Clock}
          label="平均办理时长"
          value={stats.avgDuration}
          color="text-amber-400"
          dark
          trend={{ value: -2.1, label: '较上周' }}
        />
        <StatCard
          icon={AlertTriangle}
          label="待处理"
          value={<AnimatedNumber target={stats.pending} />}
          color="text-red-400"
          dark
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">每日办理量趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
              />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">业务类型分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">超时预警</h3>
          <div className="space-y-3">
            {timeouts.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${severityColors[t.severity]} ${t.severity === 'high' ? 'animate-pulse' : ''}`} />
                  <span className="text-sm text-slate-300">{t.type}</span>
                </div>
                <span className="text-xs text-red-400">超{t.overdue}天</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">退回原因</h3>
          <div className="space-y-3">
            {rejections.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <span className="text-sm text-slate-300">{r.reason}</span>
                <span className="text-xs text-amber-400">{r.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">热点问题</h3>
          <div className="space-y-3">
            {hotspots.map((h, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <span className="text-sm text-slate-300">{h.category}</span>
                <span className={`text-xs ${h.trend >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {h.trend >= 0 ? '↑' : '↓'} {Math.abs(h.trend)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
