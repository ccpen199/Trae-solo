import { useState, useEffect, useCallback } from 'react';
import { FileArchive, AlertTriangle, Users, Briefcase, Download, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';

const API = '/api';

interface ComplianceSummary {
  total_users: number;
  active_jobs: number;
  unsigned_contracts: number;
  overtime_alerts: number;
}

interface RiskAlert {
  id: number;
  type: string;
  severity?: string;
  message?: string;
  student_name?: string;
  created_at?: string;
}

interface ComplianceData {
  summary: ComplianceSummary;
  recent_alerts: RiskAlert[];
}

interface ComplianceItem {
  category: string;
  requirement: string;
  status: 'pass' | 'partial' | 'warning';
  detail: string;
  level: 'normal' | 'medium' | 'high';
  count: number;
}

interface AlertPage {
  items: RiskAlert[];
  total?: number;
}

const categoryConfig: Record<string, { requirement: string; level: 'normal' | 'medium' | 'high' }> = {
  unsigned_contract: { requirement: '《网络招聘服务管理规定》第十二条', level: 'high' },
  overtime: { requirement: '周工时不超过28小时', level: 'medium' },
  abnormal_attendance: { requirement: '考勤记录连续异常不超过3天', level: 'medium' },
  low_credit: { requirement: '学生信用评分不低于60分', level: 'medium' },
};

const defaultCategories: { key: string; category: string; requirement: string }[] = [
  { key: 'unsigned_contract', category: '用工合同', requirement: '《网络招聘服务管理规定》第十二条' },
  { key: 'overtime', category: '超时加班', requirement: '周工时不超过28小时' },
  { key: 'abnormal_attendance', category: '异常考勤', requirement: '考勤记录连续异常不超过3天' },
  { key: 'low_credit', category: '信用预警', requirement: '学生信用评分不低于60分' },
  { key: 'salary', category: '薪资结算', requirement: '按时足额支付劳动报酬' },
  { key: 'data_retention', category: '信息留存', requirement: '招聘信息留存不少于3年' },
  { key: 'privacy', category: '个人信息保护', requirement: '学生隐私数据加密存储' },
];

const archiveRecords = [
  { id: '1', period: '2026年5月', type: '月度归档', records: 156, size: '2.3MB', createdAt: '2026-06-01' },
  { id: '2', period: '2026年4月', type: '月度归档', records: 203, size: '3.1MB', createdAt: '2026-05-01' },
  { id: '3', period: '2026年3月', type: '月度归档', records: 178, size: '2.7MB', createdAt: '2026-04-01' },
  { id: '4', period: '2026年Q1', type: '季度归档', records: 537, size: '8.1MB', createdAt: '2026-04-05' },
];

const statusConfig = {
  pass: { label: '合规', className: 'badge-success', Icon: ShieldCheck },
  partial: { label: '部分合规', className: 'badge-warning', Icon: AlertTriangle },
  warning: { label: '需关注', className: 'badge-danger', Icon: ShieldAlert },
};

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || '请求失败');
  return json.data;
}

function buildComplianceItems(summary: ComplianceSummary, alerts: RiskAlert[]): ComplianceItem[] {
  const alertCounts = new Map<string, number>();
  alerts.forEach((a) => {
    const t = a.type;
    alertCounts.set(t, (alertCounts.get(t) || 0) + 1);
  });

  const unsignedCount = alertCounts.get('unsigned_contract') || summary.unsigned_contracts || 0;
  const overtimeCount = alertCounts.get('overtime') || summary.overtime_alerts || 0;

  return defaultCategories.map((cat) => {
    let count = 0;
    let status: ComplianceItem['status'] = 'pass';
    let detail = '全部合规';
    let level: ComplianceItem['level'] = 'normal';

    if (cat.key === 'unsigned_contract') {
      count = unsignedCount;
    } else if (cat.key === 'overtime') {
      count = overtimeCount;
    } else {
      count = alertCounts.get(cat.key) || 0;
    }

    const cfg = categoryConfig[cat.key];
    if (cfg) level = cfg.level;

    if (count > 0) {
      if (cat.key === 'unsigned_contract') {
        status = 'partial';
        detail = `${count}份合同未签署`;
      } else {
        status = 'warning';
        detail = `${count}条预警记录`;
      }
    }

    return { category: cat.category, requirement: cat.requirement, status, detail, level, count };
  });
}

function exportCSV(items: ComplianceItem[], summary: ComplianceSummary) {
  const rows = [
    ['合规检查项,要求,状态,详情,预警数'],
    ...items.map((it) => [it.category, it.requirement, statusConfig[it.status].label, it.detail, String(it.count)]),
    [],
    ['统计概览'],
    ['注册用户总数', String(summary.total_users)],
    ['在招岗位数', String(summary.active_jobs)],
    ['未签合同预警', String(summary.unsigned_contracts)],
    ['超时加班预警', String(summary.overtime_alerts)],
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compliance_report_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminCompliance() {
  const [tab, setTab] = useState<'overview' | 'archive'>('overview');
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [complianceData, alertData] = await Promise.all([
        apiFetch<ComplianceData>('/admin/compliance'),
        apiFetch<AlertPage | RiskAlert[]>('/risk/alerts?pageSize=20').catch(() => ({ items: [] })),
      ]);
      const alerts: RiskAlert[] = Array.isArray(alertData) ? alertData : (alertData as AlertPage).items || [];
      setSummary(complianceData.summary);
      setComplianceItems(buildComplianceItems(complianceData.summary, [...complianceData.recent_alerts, ...alerts]));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = summary
    ? [
        { label: '注册用户总数', value: summary.total_users, icon: Users, color: 'bg-blue-50 text-blue-600' },
        { label: '在招岗位数', value: summary.active_jobs, icon: Briefcase, color: 'bg-emerald-50 text-emerald-600' },
        { label: '未签合同预警', value: summary.unsigned_contracts, icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
        { label: '超时加班预警', value: summary.overtime_alerts, icon: Clock, color: 'bg-amber-50 text-amber-600' },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-gray-800">合规留存</h2>
          <p className="text-sm text-gray-500 mt-0.5">用工数据归档管理，满足《网络招聘服务管理规定》留存要求</p>
        </div>
        <button onClick={() => summary && exportCSV(complianceItems, summary)} className="btn-outline flex items-center gap-2">
          <Download size={16} />导出报告
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`card-base p-4 animate-fade-in stagger-${i + 1}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${stat.color}`}><Icon size={18} /></div>
                    <div>
                      <p className="text-xl font-bold font-heading font-mono">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setTab('overview')}
              className={`px-5 py-2 rounded-md text-sm transition-all ${tab === 'overview' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-500'}`}
            >
              合规总览
            </button>
            <button
              onClick={() => setTab('archive')}
              className={`px-5 py-2 rounded-md text-sm transition-all ${tab === 'archive' ? 'bg-white text-primary shadow-sm font-medium' : 'text-gray-500'}`}
            >
              归档记录
            </button>
          </div>

          {tab === 'overview' && (
            <div className="card-base p-5">
              <h3 className="font-heading font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileArchive size={16} />合规检查项
              </h3>
              <div className="space-y-3">
                {complianceItems.map((item) => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.Icon;
                  return (
                    <div key={item.category} className={`flex items-center gap-4 p-4 rounded-lg border ${
                      item.level === 'high' ? 'border-red-200 bg-red-50/30' : item.level === 'medium' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
                    }`}>
                      <div className={`p-2 rounded-lg ${item.level === 'high' ? 'bg-red-100' : item.level === 'medium' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                        <StatusIcon size={18} className={item.level === 'high' ? 'text-red-500' : item.level === 'medium' ? 'text-amber-500' : 'text-emerald-500'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 text-sm">{item.category}</span>
                          <span className={config.className}>{config.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.requirement}</p>
                      </div>
                      <span className="text-sm text-gray-600">{item.detail}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'archive' && (
            <div className="card-base overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-500">归档周期</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-500">归档类型</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-500">记录数</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-500">大小</th>
                    <th className="text-left py-3 px-5 text-xs font-medium text-gray-500">归档时间</th>
                    <th className="text-right py-3 px-5 text-xs font-medium text-gray-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {archiveRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-5 text-sm font-medium text-gray-800">{record.period}</td>
                      <td className="py-3 px-5">
                        <span className="badge-info">{record.type}</span>
                      </td>
                      <td className="py-3 px-5 font-mono text-sm text-gray-700">{record.records}</td>
                      <td className="py-3 px-5 font-mono text-sm text-gray-700">{record.size}</td>
                      <td className="py-3 px-5 text-sm text-gray-500 flex items-center gap-1"><Clock size={12} />{record.createdAt}</td>
                      <td className="py-3 px-5 text-right">
                        <button className="text-xs text-primary hover:text-primary-light font-medium">下载</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
