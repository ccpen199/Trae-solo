import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Badge, Button, Tag, message, Alert, Space } from 'antd';
import type { TabsProps } from 'antd';
import { CheckSquare, ShieldCheck, Eye, Clock, AlertCircle, FileText, ExternalLink, Shield } from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { AUDIT_STAGE_MAP, RISK_LEVEL_OPTIONS } from '@/utils/constants';
import { formatDateTime, cn } from '@/lib/utils';
import type { AuditTask, AuditStage, AuditResult, UserRole, RiskLevel } from '@/types';
import { mockAuditTasks } from '@/mock';
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

const ROLE_LABEL: Record<UserRole, string> = {
  'platform-admin': '平台管理员',
  'org-admin': '机构管理员',
  'quality-officer': '质控专员',
  nurse: '护士',
  patient: '患者',
};

const ROLE_STAGES: Record<UserRole, AuditStage[]> = {
  'org-admin': ['quality-control', 'platform-check'],
  'platform-admin': ['platform-check'],
  'quality-officer': ['quality-control'],
  nurse: ['self-check'],
  patient: [],
};

const STAGE_LABEL: Record<AuditStage, string> = {
  'self-check': '护士自检',
  'quality-control': '机构质控',
  'platform-check': '平台巡检',
};

const STAGE_GRADIENT: Record<AuditStage, 'blue' | 'orange' | 'purple'> = {
  'self-check': 'blue',
  'quality-control': 'orange',
  'platform-check': 'purple',
};

export default function AuditTodo() {
  const navigate = useNavigate();
  const { auth, getAuditTasks, orders, setAuditTasks, auditTasks } = useGlobalStore();
  const [activeStage, setActiveStage] = useState<AuditStage | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<Record<string, string | number | undefined>>({});

  useEffect(() => {
    if (!auditTasks || auditTasks.length === 0) {
      setAuditTasks(mockAuditTasks);
    }
  }, [auditTasks, setAuditTasks]);

  const allTasks = useMemo(() => {
    const raw = getAuditTasks();
    return raw && raw.length > 0 ? raw : mockAuditTasks;
  }, [getAuditTasks]);

  const tasksByStage = (s?: AuditStage) => (s ? allTasks.filter(t => t.stage === s) : allTasks);

  const stats = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const pending = allTasks.filter(t => t.result === 'pending');
    const done = allTasks.filter(t => t.result !== 'pending');
    const todayP = pending.filter(t => dayjs(t.startedAt).format('YYYY-MM-DD') === today);
    const completed = allTasks.filter(t => t.completedAt);
    const avg = completed.length > 0 ? Math.round(completed.reduce((s, t) => s + dayjs(t.completedAt!).diff(dayjs(t.startedAt), 'minute'), 0) / completed.length / 60 * 10) / 10 : 0;
    return { pending: pending.length, done: done.length, today: todayP.length, avg };
  }, [allTasks]);

  const stageStats = useMemo(() => {
    if (activeStage === 'all') return null;
    const stageTasks = tasksByStage(activeStage);
    const pending = stageTasks.filter(t => t.result === 'pending');
    const done = stageTasks.filter(t => t.result !== 'pending');
    const completed = stageTasks.filter(t => t.completedAt);
    const avg = completed.length > 0 ? Math.round(completed.reduce((s, t) => s + dayjs(t.completedAt!).diff(dayjs(t.startedAt), 'minute'), 0) / completed.length / 60 * 10) / 10 : 0;
    return { pending: pending.length, done: done.length, avg };
  }, [activeStage, allTasks]);

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

  const getOrderByTask = (task: AuditTask) => {
    return orders.find(o => o.orderNo === task.orderNo || o.id === task.orderId);
  };

  const getRiskLevel = (task: AuditTask): RiskLevel => {
    const order = getOrderByTask(task);
    return order?.riskLevel || 'medium';
  };

  const getServiceDuration = (task: AuditTask): string => {
    const order = getOrderByTask(task);
    if (!order) return '-';
    const duration = order.serviceItems.reduce((sum, item) => sum + item.duration, 0);
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
    }
    return `${duration}min`;
  };

  const getStageStagesText = (role: UserRole) => {
    const stages = ROLE_STAGES[role];
    if (stages.length === 0) return '无审核权限';
    return stages.map(s => STAGE_LABEL[s]).join('、');
  };

  const nurseNameOptions = useMemo(() => {
    const names = Array.from(new Set(allTasks.map(t => t.nurseName)));
    return names.map(n => ({ label: n, value: n }));
  }, [allTasks]);

  const filtered = useMemo(() => {
    let r = [...allTasks];
    if (activeStage !== 'all') r = r.filter(t => t.stage === activeStage);
    if (searchKeyword) {
      const k = searchKeyword.toLowerCase();
      r = r.filter(t =>
        t.orderNo.includes(searchKeyword) ||
        t.patientName.toLowerCase().includes(k) ||
        t.nurseName.toLowerCase().includes(k)
      );
    }
    if (filters.stage) r = r.filter(t => t.stage === filters.stage);
    if (filters.priority) r = r.filter(t => t.priority === filters.priority);
    if (filters.result) r = r.filter(t => t.result === filters.result);
    if (filters.riskLevel) {
      r = r.filter(t => getRiskLevel(t) === filters.riskLevel);
    }
    if (filters.nurseName) {
      r = r.filter(t => t.nurseName === filters.nurseName);
    }
    return r;
  }, [allTasks, activeStage, searchKeyword, filters, orders]);

  const cols = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 170, fixed: 'left' as const, render: (t: string, r: AuditTask) => <a className="font-mono text-sm font-medium text-blue-600 hover:underline cursor-pointer" onClick={() => navigate(`/audit/${r.id}`)}>{t}</a> },
    { title: '关联订单', key: 'linkedOrder', width: 130, render: (_: unknown, r: AuditTask) => {
      const order = getOrderByTask(r);
      const orderId = order?.id || r.orderId;
      return (
        <Button
          type="link"
          size="small"
          icon={<ExternalLink className="h-3.5 w-3.5" />}
          onClick={() => navigate(`/orders/${orderId}`)}
          className="px-0"
        >
          查看订单
        </Button>
      );
    }},
    { title: '患者', key: 'pt', width: 150, render: (_: unknown, r: AuditTask) => { const p = getPt(r.patientName); return <div><div className="text-sm font-medium text-slate-900">{r.patientName}</div><div className="text-xs text-slate-500">{p.g} · {p.age}岁</div></div>; } },
    { title: '护士', dataIndex: 'nurseName', key: 'nn', width: 110, render: (t: string) => <span className="text-sm text-slate-700">{t}</span> },
    { title: '风险等级', key: 'riskLevel', width: 110, render: (_: unknown, r: AuditTask) => <StatusBadge type="risk" status={getRiskLevel(r)} /> },
    { title: '服务时长', key: 'duration', width: 100, render: (_: unknown, r: AuditTask) => <span className="text-sm text-slate-700">{getServiceDuration(r)}</span> },
    { title: '审核阶段', dataIndex: 'stage', key: 'sg', width: 120, render: (s: AuditStage) => <Tag className={cn('border m-0 rounded-md px-2 py-0.5 text-xs font-medium', STAGE_BG[s])}>{AUDIT_STAGE_MAP[s].label}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'pr', width: 90, render: (p: 'normal' | 'high' | 'urgent') => <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', PRIO[p].t)}><span className={cn('h-2 w-2 rounded-full', PRIO[p].d)} />{PRIO[p].l}</span> },
    { title: '状态', dataIndex: 'result', key: 'rs', width: 100, render: (x: AuditResult) => <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', RES[x].bg)}><span className={cn('h-1.5 w-1.5 rounded-full', RES[x].d)} />{RES[x].l}</span> },
    { title: '分配时间', dataIndex: 'startedAt', key: 'st', width: 160, render: (t: string) => formatDateTime(t) },
    { title: '完成时间', dataIndex: 'completedAt', key: 'ct', width: 160, render: (t?: string) => t ? formatDateTime(t) : <span className="text-slate-400">-</span> },
    { title: '操作', key: 'op', width: 200, fixed: 'right' as const, render: (_: unknown, r: AuditTask) => (
      <Space size="small">
        <Button type="primary" size="small" icon={<Eye className="h-3.5 w-3.5" />} onClick={() => navigate(`/audit/${r.id}`)} disabled={r.result !== 'pending'}>立即审核</Button>
        <Button size="small" icon={<FileText className="h-3.5 w-3.5" />} onClick={() => navigate(`/orders/${r.orderId}`)}>查看订单</Button>
      </Space>
    )},
  ];

  const ff = [
    { key: 'stage', label: '阶段', type: 'select' as const, placeholder: '全部阶段', options: [{ label: '护士自检', value: 'self-check' }, { label: '机构质控', value: 'quality-control' }, { label: '平台巡检', value: 'platform-check' }] },
    { key: 'priority', label: '优先级', type: 'select' as const, placeholder: '全部优先级', options: [{ label: '普通', value: 'normal' }, { label: '高', value: 'high' }, { label: '紧急', value: 'urgent' }] },
    { key: 'result', label: '状态', type: 'select' as const, placeholder: '全部状态', options: [{ label: '待审核', value: 'pending' }, { label: '通过', value: 'approved' }, { label: '驳回', value: 'rejected' }] },
    { key: 'riskLevel', label: '风险等级', type: 'select' as const, placeholder: '全部风险等级', options: RISK_LEVEL_OPTIONS },
    { key: 'nurseName', label: '护士姓名', type: 'select' as const, placeholder: '全部护士', options: nurseNameOptions },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="三级审核中心" description="护士自检 → 机构质控 → 平台巡检，三级流程全程可追溯" icon={<ShieldCheck className="h-6 w-6" />}
        actions={[{ key: 'export', label: '导出审核记录', onClick: () => message.success('正在导出审核记录...') }]} />

      {auth && (
        <Alert
          type="info"
          showIcon
          icon={<Shield className="h-5 w-5" />}
          message={
            <span className="flex items-center gap-2">
              当前账号为 <strong>{ROLE_LABEL[auth.role]}</strong> 角色，可处理 <strong>{getStageStagesText(auth.role)}</strong> 阶段审核
              <Button type="link" size="small" className="h-auto py-0" onClick={() => message.info('角色切换功能仅为演示，实际由登录账号决定')}>
                角色切换
              </Button>
            </span>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="待我审核" value={stats.pending} icon={<CheckSquare className="h-6 w-6" />} gradient="blue" />
        <StatCard title="我已审核" value={stats.done} icon={<ShieldCheck className="h-6 w-6" />} gradient="green" />
        <StatCard title="今日待审" value={stats.today} icon={<Clock className="h-6 w-6" />} gradient="orange" />
        <StatCard title="平均处理时长" value={stats.avg} suffix="小时" icon={<AlertCircle className="h-6 w-6" />} gradient="purple" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        {stageStats && activeStage !== 'all' && (
          <div className="border-b border-slate-100 px-4 pt-4">
            <div className="mb-3 flex items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium', STAGE_BG[activeStage])}>
                {STAGE_LABEL[activeStage]}阶段统计
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 pb-4 md:grid-cols-3">
              <StatCard
                title="待处理"
                value={stageStats.pending}
                icon={<Clock className="h-5 w-5" />}
                gradient={STAGE_GRADIENT[activeStage]}
                className="py-3"
              />
              <StatCard
                title="已完成"
                value={stageStats.done}
                icon={<CheckSquare className="h-5 w-5" />}
                gradient="green"
                className="py-3"
              />
              <StatCard
                title="平均耗时"
                value={stageStats.avg}
                suffix="小时"
                icon={<AlertCircle className="h-5 w-5" />}
                gradient="cyan"
                className="py-3"
              />
            </div>
          </div>
        )}
        <div className="border-b border-slate-100 px-4 pt-2"><Tabs activeKey={activeStage} onChange={k => setActiveStage(k as AuditStage | 'all')} items={tabs} size="large" /></div>
        <DataTable columns={cols} dataSource={filtered} rowKey="id" showSearch searchPlaceholder="搜索订单号/患者/护士" onSearch={setSearchKeyword}
          showFilter filterFields={ff} onFilter={setFilters} showRefresh onRefresh={() => {
            if (!auditTasks || auditTasks.length === 0) {
              setAuditTasks(mockAuditTasks);
            }
            message.success('数据已刷新');
          }} pagination={{ pageSize: 10 }} />
      </div>
    </div>
  );
}
