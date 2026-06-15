import { useEffect, useState } from 'react';
import { Activity, Database, Shield, Server } from 'lucide-react';

type AdminSummary = {
  health?: Record<string, any>;
  summary?: Record<string, any>;
  stats?: Record<string, any>;
  error?: string;
};

async function fetchJson(path: string) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

export default function Admin() {
  const [data, setData] = useState<AdminSummary>({});

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchJson('/api/health'),
      fetchJson('/api/resumes/summary'),
      fetchJson('/api/admin/stats'),
    ])
      .then(([health, summary, stats]) => {
        if (mounted) setData({ health, summary, stats });
      })
      .catch((error) => {
        if (mounted) setData({ error: error.message });
      });
    return () => { mounted = false; };
  }, []);

  const cards = [
    { icon: Server, label: '后端服务', value: data.health?.status || '检查中', detail: data.health?.service || 'resume-workbench-backend' },
    { icon: Database, label: 'SQLite 数据库', value: data.health?.database || 'data/app.sqlite', detail: data.summary?.storage || 'SQLite + IndexedDB local mode' },
    { icon: Shield, label: '隐私策略', value: data.stats?.privacyMode || 'local-only', detail: '简历数据只保存在本机' },
    { icon: Activity, label: '事件审计', value: data.summary?.totalEvents ?? data.stats?.totalResumeEvents ?? 0, detail: 'resume_events' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-navy-700 mb-2">管理后台</h1>
        <p className="text-navy-400">本地服务健康、SQLite 状态、隐私模式与简历事件审计。</p>
      </div>

      {data.error && (
        <div className="card p-4 mb-6 border-red-100 bg-red-50 text-red-600">
          后台接口异常：{data.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.map(({ icon: Icon, label, value, detail }) => (
          <div key={label} className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-lg bg-navy-50 flex items-center justify-center">
                <Icon className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <p className="text-sm text-navy-400">{label}</p>
                <p className="text-xl font-semibold text-navy-700 mt-1">{String(value)}</p>
                <p className="text-sm text-navy-400 mt-1">{String(detail)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
