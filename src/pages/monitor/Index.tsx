import { useNavigate } from 'react-router-dom';
import { BarChart3, AlertTriangle, FileText, Users } from 'lucide-react';
import { useAppStore } from '@/store';
import { useEffect } from 'react';

const entries = [
  {
    path: '/monitor/dashboard',
    label: '效能总览',
    desc: '关键指标与趋势概览',
    icon: BarChart3,
    accent: 'bg-blue-500/20 text-blue-400',
  },
  {
    path: '/monitor/timeout',
    label: '超时预警',
    desc: '即将超时与已超时业务',
    icon: AlertTriangle,
    accent: 'bg-red-500/20 text-red-400',
  },
  {
    path: '/monitor/rejection',
    label: '退回分析',
    desc: '退回原因统计与趋势',
    icon: FileText,
    accent: 'bg-amber-500/20 text-amber-400',
  },
  {
    path: '/monitor/hotspot',
    label: '热点聚类',
    desc: '高频问题分类与追踪',
    icon: Users,
    accent: 'bg-emerald-500/20 text-emerald-400',
  },
];

export default function MonitorIndex() {
  const navigate = useNavigate();
  const { user } = useAppStore();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  if (user?.role !== 'admin') return null;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">效能监测</h1>
      <div className="grid grid-cols-2 gap-4">
        {entries.map((entry) => (
          <div
            key={entry.path}
            onClick={() => navigate(entry.path)}
            className="bg-white border border-neutral-200 rounded-lg p-6 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-12 h-12 rounded-lg ${entry.accent} flex items-center justify-center mb-4`}>
              <entry.icon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-neutral-800 mb-1">{entry.label}</h3>
            <p className="text-sm text-neutral-500">{entry.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
