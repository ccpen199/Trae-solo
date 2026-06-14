import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Badge, Button, Tag, message } from 'antd';
import type { TabsProps } from 'antd';
import { CheckSquare, ShieldCheck, Eye, Clock, AlertCircle } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import { AUDIT_STAGE_MAP } from '@/utils/constants';
import { formatDateTime, cn } from '@/lib/utils';
import type { AuditTask, AuditStage, AuditResult } from '@/types';
import dayjs from 'dayjs';

const PRIO = {
  normal: { l: '普通', d: 'bg-slate-400', t: 'text-slate-600' },
  high: { l: '高', d: 'bg-amber-500', t: 'text-amber-600' },
  urgent: { l: '紧急', d: 'bg-red-500', t: 'text-red-600' },
};

const RES: Record<AuditResult, { l: string; bg: string; d: string }> = {
  pending: { l: '待审核', bg: 'bg-slate-100 text-slate-600', d: 'bg-slate-400' },
  approved: { l: '通过', bg: 'bg-emerald-50 text-emerald-700', d: 'bg-emerald-500' },
  rejected: { l: '驳回', bg: 'bg-red-50 text-red-700', d: 'bg-red-500' },
};

const STAGE_BG: Record<AuditStage, string> = {
  'self-check': 'bg-blue-50 text-blue-700 border-blue-200',
  'quality-control': 'bg-amber-50 text-amber-700 border-amber-200',
  'platform-check': 'bg-violet-50 text-violet-700 border-violet-200',
};

export default function AuditTodo() {
  const navigate = useNavigate();
  const { getAuditTasksByStage, getAuditTasks, orders } = useGlobalStore();
  const [activeStage, setActiveStage] = useState<AuditStage | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});

  const allTasks = getAuditTasks();
  const tasksByStage = (s?: AuditStage) => (s ? getAuditTasksByStage(s) : allTasks);

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const pending = allTasks.filter(t => t.result === 'pending');
    const done = allTasks.filter(t => t.result !== 'pending');
    const todayP = pending.filter(t => dayjs(t.startedAt).format('YYYY-MM-DD') === today);
    const completed = allTasks.filter(t => t.completedAt);
    const avg = completed.length > 0 ? Math.round(completed.reduce((s, t) => s + dayjs(t.completedAt!).diff(dayjs(t.startedAt), 'minute'), 0) / completed.length / 60 * 10) / 10 : 0;
    return { pending: pending.length, done: done.length, today: todayP.length, avg };
  }, [allTasks]);

  const tabs: TabsProps['items'] = [
    { key: 'all', label: <span className="flex items-center gap-2">全部<Badge count={allTasks.length} size="small" color="#64748B" /></span> },
    { key: 'self-check', label: <span className="flex items-center gap-2"><span className="text-blue-600">①</span>护士自检<Badge count={tasksByStage('self-check').length} size="small" color="#3B82F6" /></span> },
    { key: 'quality-control', label: <span className="flex items-center gap-2"><span className="text-amber-600">②</span>机构质控<Badge count={tasksByStage('quality-control').length} size="small" color="#F59E0B" /></span> },
    { key: 'platform-check', label: <span className="flex items-center gap-2"><span className="text-violet-600">③</span>平台巡检<Badge count={tasksByStage('platform-check').length} size="small" color="#8B5CF6" /></span> },
  ];

  const getPt = (name: string) => {
    const o = orders.find(o => o.patientInfo.name === name);
    return o ? { age: o.patientInfo.age, g: o.patientInfo.gender === 'male' ? '男' : '女' } : { age: 72, g: '男' };
  };

  const filtered = useMemo(() => {
    let r = [...allTasks];
    if (activeStage !== 'all') r = r.filter(t => t.stage === activeStage);
    if (searchKeyword) { const k = searchKeyword.toLowerCase(); r = r.filter(t => t.orderNo.includes(searchKeyword) || t.patientName.toLowerCase().includes(k) || t.nurseName.toLowerCase().includes(k)); }
    if (filters.stage) r = r.filter(t => t.stage === filters.stage);
    if (filters.priority) r = r.filter(t => t.priority === filters.priority);
    if (filters.result) r = r.filter(t => t.result === filters.result);
    return r;
  }, [allTasks, activeStage, searchKeyword, filters]);

  const cols = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 170, fixed: 'left' as const, render: (t: string, r: AuditTask) => <a className="font-mono text-sm font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => navigate(`/audit/${r.id}`)}>{t}</a> },
    { title: '患者', key: 'pt', width: 150, render: (_: unknown, r: AuditTask) => { const p = getPt(r.patientName); return <div><div className="text-sm font-medium text-slate-900">{r.patientName}</div><div className="text-xs text-slate-500">{p.g} · {p.age}岁</div></div>; } },
    { title: '护士', dataIndex: 'nurseName', key: 'nn', width: 110, render: (t: string) => <span className="text-sm text-slate-700">{t}</span> },
    { title: '审核阶段', dataIndex: 'stage', key: 'sg', width: 120, render: (s: AuditStage) => <Tag className={cn('border m-0 rounded-md px-2 py-0.5 text-xs font-medium', STAGE_BG[s])}>{AUDIT_STAGE_MAP[s].label}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'pr', width: 90, render: (p: 'normal' | 'high' | 'urgent') => <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', PRIO[p].t)}><span className={cn('h-2 w-2 rounded-full', PRIO[p].d)} />{PRIO[p].l}</span> },
    { title: '状态', dataIndex: 'result', key: 'rs', width: 100, render: (x: AuditResult) => <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', RES[x].bg)}><span className={cn('h-1.5 w-1.5 rounded-full', RES[x].d)} />{RES[x].l}</span> },
    { title: '分配时间', dataIndex: 'startedAt', key: 'st', width: 160, render: (t: string) => formatDateTime(t) },
    { title: '完成时间', dataIndex: 'completedAt', key: 'ct', width: 160, render: (t?: string) => t ? formatDateTime(t) : <span className="text-slate-400">-</span> },
    { title: '操作', key: 'op', width: 110, fixed: 'right' as const, render: (_: unknown, r: AuditTask) => <Button type="primary" size="small" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => navigate(`/audit/${r.id}`)} disabled={r.result !== 'pending'}>立即审核</Button> },
  ];

  const ff = [
    { key: 'stage', label: '阶段', type: 'select' as const, placeholder: '全部阶段', options: [{ label: '护士自检', value: 'self-check' }, { label: '机构质控', value: 'quality-control' }, { label: '平台巡检', value: 'platform-check' }] },
    { key: 'priority', label: '优先级', type: 'select' as const, placeholder: '全部优先级', options: [{ label: '普通', value: 'normal' }, { label: '高', value: 'high' }, { label: '紧急', value: 'urgent' }] },
    { key: 'result', label: '状态', type: 'select' as const, placeholder: '全部状态', options: [{ label: '待审核', value: 'pending' }, { label: '通过', value: 'approved' }, { label: '驳回', value: 'rejected' }] },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="三级审核中心" description="护士自检 → 机构质控 → 平台巡检，三级流程全程可追溯" icon={<ShieldCheck className="h-6 w-6" />}
        actions={[{ key: 'export', label: '导出审核记录', onClick: () => message.success('正在导出审核记录...') }]} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="待我审核" value={stats.pending} icon={<CheckSquare className="h-6 w-6" />} gradient="blue" />
        <StatCard title="我已审核" value={stats.done} icon={<ShieldCheck className="h-6 w-6" />} gradient="green" />
        <StatCard title="今日待审" value={stats.today} icon={<Clock className="h-6 w-6" />} gradient="orange" />
        <StatCard title="平均处理时长" value={stats.avg} suffix="小时" icon={<AlertCircle className="h-6 w-6" />} gradient="purple" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 pt-2"><Tabs activeKey={activeStage} onChange={k => setActiveStage(k as AuditStage | 'all')} items={tabs} size="large" /></div>
        <DataTable columns={cols} dataSource={filtered} rowKey="id" showSearch searchPlaceholder="搜索订单号/患者/护士" onSearch={setSearchKeyword}
          showFilter filterFields={ff} onFilter={setFilters} showRefresh onRefresh={() => message.success('数据已刷新')} pagination={{ pageSize: 10 }} />
      </div>
    </div>
  );
}
