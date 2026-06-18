import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface TimeoutItem {
  id: number;
  type: string;
  applicant: string;
  submittedDate: string;
  deadline: string;
  overdue: number;
  severity: 'high' | 'medium' | 'low';
}

const defaultData: TimeoutItem[] = [
  { id: 1, type: '失业金申领', applicant: '王某某', submittedDate: '2026-05-20', deadline: '2026-06-10', overdue: 8, severity: 'high' },
  { id: 2, type: '职称申报', applicant: '李某', submittedDate: '2026-05-25', deadline: '2026-06-15', overdue: 3, severity: 'medium' },
  { id: 3, type: '社保转移', applicant: '赵某某', submittedDate: '2026-06-01', deadline: '2026-06-16', overdue: 2, severity: 'low' },
  { id: 4, type: '劳动合同备案', applicant: '北京科技有限公司', submittedDate: '2026-05-28', deadline: '2026-06-12', overdue: 6, severity: 'high' },
  { id: 5, type: '失业金申领', applicant: '周某', submittedDate: '2026-06-05', deadline: '2026-06-18', overdue: 0, severity: 'medium' },
];

const typeOptions = ['全部', '社保服务', '就业服务', '人才服务', '劳动关系'];

const severityConfig: Record<string, { label: string; color: string; pulse: boolean }> = {
  high: { label: '严重', color: 'bg-danger-500 text-danger-500', pulse: true },
  medium: { label: '一般', color: 'bg-accent-500 text-accent-500', pulse: false },
  low: { label: '轻微', color: 'bg-yellow-400 text-yellow-500', pulse: false },
};

export default function Timeout() {
  const [data, setData] = useState<TimeoutItem[]>(defaultData);
  const [filter, setFilter] = useState('全部');

  useEffect(() => {
    apiFetch<TimeoutItem[]>('/api/monitor/timeout').catch(() => defaultData).then((d) => {
      if (d) setData(d);
    });
  }, []);

  const filtered = filter === '全部' ? data : data.filter((item) => {
    const map: Record<string, string[]> = {
      '社保服务': ['社保转移', '社保缴费'],
      '就业服务': ['失业金申领'],
      '人才服务': ['职称申报'],
      '劳动关系': ['劳动合同备案'],
    };
    return map[filter]?.some((t) => item.type.includes(t));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">超时预警</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {typeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">业务类型</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">申请人</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">提交日期</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">截止日期</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">超时天数</th>
              <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">严重程度</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const cfg = severityConfig[item.severity];
              return (
                <tr key={item.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-5 py-3 text-sm text-neutral-700">{item.type}</td>
                  <td className="px-5 py-3 text-sm text-neutral-700">{item.applicant}</td>
                  <td className="px-5 py-3 text-sm text-neutral-500">{item.submittedDate}</td>
                  <td className="px-5 py-3 text-sm text-neutral-500">{item.deadline}</td>
                  <td className="px-5 py-3 text-sm text-danger-500 font-medium">{item.overdue > 0 ? `${item.overdue}天` : '-'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${cfg.color.split(' ')[0]} ${cfg.pulse ? 'animate-pulse-dot' : ''}`} />
                      <span className={`text-sm ${cfg.color.split(' ')[1]}`}>{cfg.label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-neutral-400">暂无超时记录</div>
        )}
      </div>
    </div>
  );
}
