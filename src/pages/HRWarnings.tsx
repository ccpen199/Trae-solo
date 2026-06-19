import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Flame,
  Info,
  TrendingDown,
  Users,
  Clock,
  Target,
  TrendingUp,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  XCircle,
  Zap,
  BarChart3,
  Briefcase,
  Gauge,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { hrApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { JobWarning, WarningSeverity, WarningType } from '@shared/types';

const SEVERITY_CONFIG: Record<WarningSeverity, {
  icon: any;
  label: string;
  border: string;
  bar: string;
  badge: string;
  bg: string;
  iconBg: string;
  text: string;
}> = {
  critical: {
    icon: Flame,
    label: 'Critical',
    border: 'border-red-400/80 hover:border-red-500',
    bar: 'bg-gradient-to-b from-red-500 to-red-400',
    badge: 'bg-red-50 text-red-700 border-red-200',
    bg: 'from-red-50/60 via-white to-white',
    iconBg: 'bg-gradient-to-br from-red-500 to-red-600 text-white',
    text: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Warning',
    border: 'border-amber-gold-400/70 hover:border-amber-gold-500',
    bar: 'bg-gradient-to-b from-amber-gold-500 to-amber-gold-400',
    badge: 'bg-amber-gold-50 text-amber-gold-700 border-amber-gold-200',
    bg: 'from-amber-gold-50/50 via-white to-white',
    iconBg: 'bg-gradient-to-br from-amber-gold-500 to-orange-500 text-white',
    text: 'text-amber-gold-600',
  },
  info: {
    icon: Info,
    label: 'Info',
    border: 'border-space-indigo-400/60 hover:border-space-indigo-500',
    bar: 'bg-gradient-to-b from-space-indigo-500 to-space-indigo-400',
    badge: 'bg-space-indigo-50 text-space-indigo-700 border-space-indigo-200',
    bg: 'from-space-indigo-50/40 via-white to-white',
    iconBg: 'bg-gradient-to-br from-space-indigo-500 to-blue-500 text-white',
    text: 'text-space-indigo-600',
  },
};

const TYPE_CONFIG: Record<WarningType, {
  icon: any;
  label: string;
  description: string;
}> = {
  'competition-intensified': {
    icon: Zap,
    label: '竞争加剧',
    description: '市场竞争程度变化预警',
  },
  'prolonged-hiring': {
    icon: Clock,
    label: '招聘周期过长',
    description: '岗位招聘周期超出正常范围',
  },
  'skill-shortage': {
    icon: Target,
    label: '技能短缺',
    description: '人才市场特定技能供给不足',
  },
  'market-shift': {
    icon: TrendingUp,
    label: '市场变化',
    description: '市场趋势和行业变动提醒',
  },
};

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: any;
  icon: any;
}> = {
  processing: { label: '处理中', variant: 'indigo', icon: Clock },
  ignored: { label: '已忽略', variant: 'default', icon: XCircle },
  resolved: { label: '已解决', variant: 'success', icon: CheckCircle2 },
};

const mockWarnings: (JobWarning & { status: 'processing' | 'ignored' | 'resolved' })[] = [
  {
    id: 'w1',
    jobPostId: 'j1',
    jobTitle: '高级前端工程师',
    type: 'competition-intensified',
    severity: 'critical',
    message: '近7天该岗位投递量下降 45%，同期竞品公司同岗位平均薪资上调 12%，人才竞争加剧',
    suggestion: '建议将薪资上限提升 8-10%，或增加灵活福利包吸引候选人',
    dataPoint: { applications7d: 28, applicationsPrev7d: 51, competitorAvgSalaryUp: 12 },
    detectedAt: '2026-06-17T09:30:00Z',
    status: 'processing',
  },
  {
    id: 'w2',
    jobPostId: 'j3',
    jobTitle: '后端开发工程师（Java）',
    type: 'skill-shortage',
    severity: 'critical',
    message: '具备 5年+ Java + 微服务 + Kubernetes 经验的候选人本月供给量环比下降 38%，市场严重短缺',
    suggestion: '考虑放宽年限要求，或启动内部培养计划，同时扩大院校合作渠道',
    dataPoint: { supplyCount: 42, supplyPrevMonth: 68, dropRate: 38 },
    detectedAt: '2026-06-16T14:15:00Z',
    status: 'processing',
  },
  {
    id: 'w3',
    jobPostId: 'j2',
    jobTitle: '资深产品经理（B端）',
    type: 'prolonged-hiring',
    severity: 'warning',
    message: '该岗位已招聘 52 天，远超同类型岗位平均周期 28 天，当前匹配候选人仅 2 人通过初筛',
    suggestion: '复盘JD要求是否过高，可适当拆分岗位或寻求猎头合作',
    dataPoint: { hiringDays: 52, industryAvg: 28, passedScreening: 2 },
    detectedAt: '2026-06-15T11:00:00Z',
    status: 'processing',
  },
  {
    id: 'w4',
    jobPostId: 'j5',
    jobTitle: '数据分析师',
    type: 'market-shift',
    severity: 'warning',
    message: '数据分析岗位近30天活跃候选人减少 22%，但企业招聘需求增长 18%，人才供需失衡加剧',
    suggestion: '提前储备校招人才池，考虑相关专业转岗培训计划',
    dataPoint: { activeCandidates: 320, demandGrowth: 18, candidateDrop: 22 },
    detectedAt: '2026-06-14T16:45:00Z',
    status: 'processing',
  },
  {
    id: 'w5',
    jobPostId: 'j7',
    jobTitle: 'UI/UX设计师',
    type: 'prolonged-hiring',
    severity: 'warning',
    message: '该岗位面试通过率仅 15%（平均 32%），可能筛选标准与市场人才水平存在偏差',
    suggestion: '与用人部门重新对齐能力要求，调整面试评价标准',
    dataPoint: { interviewPassRate: 15, avgPassRate: 32, interviewed: 20 },
    detectedAt: '2026-06-13T10:20:00Z',
    status: 'ignored',
  },
  {
    id: 'w6',
    jobPostId: 'j4',
    jobTitle: '高级算法工程师',
    type: 'competition-intensified',
    severity: 'warning',
    message: '同行业某头部公司本月新增同岗位 HC 25 个，可能对我方招聘进度产生直接影响',
    suggestion: '加快当前在流程中的候选人推进速度，优先锁定高匹配度人才',
    dataPoint: { competitorNewHc: 25, competitor: '某头部互联网公司' },
    detectedAt: '2026-06-12T13:10:00Z',
    status: 'processing',
  },
  {
    id: 'w7',
    jobPostId: 'j6',
    jobTitle: 'DevOps工程师',
    type: 'skill-shortage',
    severity: 'info',
    message: 'DevOps 相关技能搜索热度近30天上升 45%，建议及时更新关键词优化JD曝光',
    suggestion: '更新JD中的技能关键词，补充 K8s、Terraform、GitOps 等热词',
    dataPoint: { keywordHeat: 45, keywordGrowth: 45 },
    detectedAt: '2026-06-11T15:30:00Z',
    status: 'resolved',
  },
  {
    id: 'w8',
    jobPostId: 'j8',
    jobTitle: '产品运营经理',
    type: 'market-shift',
    severity: 'info',
    message: '运营类岗位候选人期望薪资近月平均上涨 8%，建议复核薪酬带宽的市场竞争力',
    suggestion: '进行薪酬市场调研，必要时调整薪资结构，增加非现金激励',
    dataPoint: { salaryGrowth: 8, avgExpSalary: '18-25K' },
    detectedAt: '2026-06-10T09:45:00Z',
    status: 'processing',
  },
  {
    id: 'w9',
    jobPostId: 'j9',
    jobTitle: '测试开发工程师',
    type: 'prolonged-hiring',
    severity: 'info',
    message: '该岗位招聘周期 35 天，略高于行业平均 28 天，建议关注简历筛选环节效率',
    suggestion: '优化 ATS 系统关键词匹配规则，增加自动化筛选维度',
    dataPoint: { hiringDays: 35, industryAvg: 28 },
    detectedAt: '2026-06-09T11:25:00Z',
    status: 'resolved',
  },
  {
    id: 'w10',
    jobPostId: 'j10',
    jobTitle: '技术文档工程师',
    type: 'market-shift',
    severity: 'info',
    message: '近期开源社区相关人才活跃度上升，可关注 GitHub、掘金等平台主动挖猎',
    suggestion: '拓展技术社区招聘渠道，建立开发者关系获取人才',
    dataPoint: { communityActive: 150, platforms: ['GitHub', '掘金'] },
    detectedAt: '2026-06-08T14:50:00Z',
    status: 'ignored',
  },
];

const WarningOverviewCard: React.FC<{
  severity: WarningSeverity;
  count: number;
  total: number;
}> = ({ severity, count, total }) => {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;
  const pct = Math.round((count / total) * 100);
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative p-6 rounded-2xl border-2 overflow-hidden"
      style={{ borderColor: severity === 'critical' ? 'rgba(239,68,68,0.3)' : severity === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(58,95,168,0.25)' }}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', cfg.bg)} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shadow-lg', cfg.iconBg)}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge className={cfg.badge} size="sm">
            {cfg.label}
          </Badge>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-heading font-bold text-slate-800">{count}</span>
          <span className="text-sm text-slate-500">条预警</span>
        </div>
        <div className="h-2 bg-white/80 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn('h-full rounded-full', cfg.bar)}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">占总量 {pct}%</p>
      </div>
    </motion.div>
  );
};

const WarningRow: React.FC<{
  warning: typeof mockWarnings[0];
  index: number;
  onViewDetail: (id: string) => void;
  onChangeStatus: (id: string, status: 'processing' | 'ignored' | 'resolved') => void;
}> = ({ warning, index, onViewDetail, onChangeStatus }) => {
  const sevCfg = SEVERITY_CONFIG[warning.severity];
  const typeCfg = TYPE_CONFIG[warning.type];
  const statusCfg = STATUS_CONFIG[warning.status];
  const SevIcon = sevCfg.icon;
  const TypeIcon = typeCfg.icon;
  const StatusIcon = statusCfg.icon;

  const dataPoints = useMemo(() => {
    const entries = Object.entries(warning.dataPoint || {});
    return entries.slice(0, 3).map(([k, v]) => {
      let label = k;
      if (k.includes('applications')) label = '投递量';
      else if (k.includes('salary')) label = '薪资变动';
      else if (k.includes('supply')) label = '供给量';
      else if (k.includes('drop')) label = '降幅';
      else if (k.includes('hiringDays')) label = '招聘天数';
      else if (k.includes('avg')) label = '行业平均';
      else if (k.includes('passed')) label = '通过人数';
      else if (k.includes('candidates')) label = '活跃人数';
      else if (k.includes('demand')) label = '需求增长';
      else if (k.includes('candidate')) label = '候选人变动';
      else if (k.includes('Rate')) label = '通过率';
      else if (k.includes('interviewed')) label = '面试人数';
      else if (k.includes('hc') || k.includes('Hc')) label = '新增HC';
      else if (k.includes('competitor') && typeof v === 'string') return { label: '来源', value: v, isText: true };
      else if (k.includes('Heat') || k.includes('Growth')) label = '热度增长';
      else if (k.includes('Exp')) label = '期望薪资';
      else if (k.includes('platforms')) return { label: '平台', value: Array.isArray(v) ? v.join('、') : v, isText: true };
      else if (k.includes('community')) label = '活跃人数';
      return { label, value: typeof v === 'number' ? v : v, isText: typeof v !== 'number' };
    });
  }, [warning.dataPoint]);

  const detectedDate = new Date(warning.detectedAt);
  const dateStr = detectedDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'group relative rounded-2xl border-l-8 border bg-gradient-to-r shadow-sm hover:shadow-lg transition-all overflow-hidden',
        sevCfg.border,
        sevCfg.bg
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1" />
      <div className="p-5 pl-6">
        <div className="flex items-start gap-5">
          <div className="flex flex-col items-center gap-2 shrink-0 pt-1">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shadow-md shrink-0', sevCfg.iconBg)}>
              <SevIcon className={cn('w-5 h-5', warning.severity === 'critical' && 'animate-pulse')} />
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
              <TypeIcon className="w-4.5 h-4.5 text-slate-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-heading font-bold text-lg text-slate-800 truncate">
                    {warning.jobTitle}
                  </h3>
                  <Badge className={sevCfg.badge} size="sm" withDot>
                    {sevCfg.label}
                  </Badge>
                  <Badge variant={typeCfg.label === '竞争加剧' ? 'warning' : typeCfg.label === '招聘周期过长' ? 'gold' : typeCfg.label === '技能短缺' ? 'indigo' : 'info'} size="sm">
                    {typeCfg.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateStr} 检测
                  </span>
                  <Badge variant={statusCfg.variant as any} size="sm" withDot>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusCfg.label}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={() => onViewDetail(warning.id)}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              {warning.message}
            </p>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="col-span-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <LightbulbIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-700">建议措施</span>
                </div>
                <p className="text-sm text-emerald-800 leading-relaxed">{warning.suggestion}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-4 h-4 text-space-indigo-600 shrink-0" />
                  <span className="text-xs font-semibold text-space-indigo-700">关键数据</span>
                </div>
                <div className="space-y-1.5">
                  {dataPoints.map((dp, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{dp.label}</span>
                      <span className={cn(
                        'font-bold',
                        dp.isText ? 'text-slate-700' : typeof dp.value === 'number' && dp.value >= 30 ? 'text-red-600' : 'text-space-indigo-700'
                      )}>
                        {!dp.isText && typeof dp.value === 'number' && (dp.label.includes('增长') || dp.label.includes('变动') || dp.label.includes('降幅')) && (dp.value > 0 ? '+' : '')}
                        {typeof dp.value === 'number' && !dp.isText ? `${dp.value}${dp.label.includes('%') || dp.label.includes('率') ? '%' : ''}` : String(dp.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/50">
              <Button
                variant="ghost"
                size="sm"
                className={cn(warning.status === 'resolved' && 'text-emerald-600 hover:bg-emerald-50')}
                onClick={() => onChangeStatus(warning.id, 'resolved')}
              >
                <CheckCircle2 className="w-4 h-4" />
                标记已解决
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(warning.status === 'ignored' && 'text-slate-600 hover:bg-slate-100')}
                onClick={() => onChangeStatus(warning.id, 'ignored')}
              >
                <XCircle className="w-4 h-4" />
                忽略
              </Button>
              <Button variant="primary" size="sm" onClick={() => onViewDetail(warning.id)}>
                <ChevronRight className="w-4 h-4" />
                查看详情
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function LightbulbIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}

const HRWarnings: React.FC = () => {
  const [warnings, setWarnings] = useState(mockWarnings);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<WarningSeverity | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<WarningType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'processing' | 'ignored' | 'resolved'>('ALL');
  const [timeRange, setTimeRange] = useState('7d');
  const [searchKw, setSearchKw] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res: any = await hrApi.getHrWarnings({
          page: 1,
          pageSize: 50,
          severity: filterSeverity === 'ALL' ? undefined : filterSeverity,
          type: filterType === 'ALL' ? undefined : filterType,
        });
        if (res?.data) {
          setWarnings(res.data.map((w: JobWarning) => ({
            ...w,
            status: (['processing', 'ignored', 'resolved'] as const)[Math.floor(Math.random() * 3)] as any,
          })));
        }
      } catch (e) {
        setWarnings(mockWarnings);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredWarnings = useMemo(() => {
    return warnings.filter((w) => {
      if (filterSeverity !== 'ALL' && w.severity !== filterSeverity) return false;
      if (filterType !== 'ALL' && w.type !== filterType) return false;
      if (filterStatus !== 'ALL' && w.status !== filterStatus) return false;
      if (searchKw && !w.jobTitle.includes(searchKw) && !w.message.includes(searchKw)) return false;
      return true;
    });
  }, [warnings, filterSeverity, filterType, filterStatus, searchKw]);

  const stats = useMemo(() => ({
    critical: warnings.filter((w) => w.severity === 'critical').length,
    warning: warnings.filter((w) => w.severity === 'warning').length,
    info: warnings.filter((w) => w.severity === 'info').length,
  }), [warnings]);

  const handleChangeStatus = (id: string, status: 'processing' | 'ignored' | 'resolved') => {
    setWarnings((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status } : w))
    );
  };

  return (
    <div className="p-8 min-h-screen space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-heading font-bold gradient-text">岗位需求预警</h1>
            <Badge variant="warning" withDot size="md">
              <Briefcase className="w-3 h-3 mr-1" />
              {warnings.length} 条预警
            </Badge>
          </div>
          <p className="text-slate-500 mt-1">
            实时监控招聘风险，智能预警市场变化与岗位异常
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Gauge className="w-4 h-4" />
            预警设置
          </Button>
          <Button variant="primary">
            <CheckCircle2 className="w-4 h-4" />
            一键处理
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-5"
      >
        <Card variant="gradient" className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-800 flex items-center justify-center shadow-lg shrink-0">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">预警总数</p>
              <p className="text-3xl font-heading font-bold gradient-text mt-0.5">{warnings.length}</p>
            </div>
          </div>
        </Card>
        <WarningOverviewCard severity="critical" count={stats.critical} total={warnings.length} />
        <WarningOverviewCard severity="warning" count={stats.warning} total={warnings.length} />
        <WarningOverviewCard severity="info" count={stats.info} total={warnings.length} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card variant="glass">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索岗位名、预警内容..."
                  value={searchKw}
                  onChange={(e) => setSearchKw(e.target.value)}
                  className="w-full h-11 pl-12 pr-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 focus:ring-2 focus:ring-space-indigo-200/50 outline-none transition-all text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">筛选器:</span>
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 outline-none text-sm font-medium text-slate-700"
              >
                <option value="ALL">全部严重程度</option>
                <option value="critical">🔥 Critical 严重</option>
                <option value="warning">⚠️ Warning 警告</option>
                <option value="info">ℹ️ Info 提示</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 outline-none text-sm font-medium text-slate-700"
              >
                <option value="ALL">全部预警类型</option>
                {(Object.keys(TYPE_CONFIG) as WarningType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 outline-none text-sm font-medium text-slate-700"
              >
                <option value="ALL">全部处理状态</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
                <option value="ignored">已忽略</option>
              </select>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="h-11 px-4 rounded-xl bg-white/80 border border-slate-200/80 focus:border-space-indigo-300 outline-none text-sm font-medium text-slate-700"
              >
                <option value="today">今日</option>
                <option value="3d">近3天</option>
                <option value="7d">近7天</option>
                <option value="30d">近30天</option>
                <option value="all">全部时间</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
              <span className="text-xs text-slate-500">快捷筛选:</span>
              {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG.processing][]).map(([k, v]) => {
                const Icon = v.icon;
                const count = warnings.filter((w) => w.status === k).length;
                return (
                  <button
                    key={k}
                    onClick={() => setFilterStatus(filterStatus === k ? 'ALL' : (k as any))}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all',
                      filterStatus === k
                        ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {v.label}
                    <span className={cn(
                      'px-1.5 py-0.5 rounded',
                      filterStatus === k ? 'bg-white/20' : 'bg-white'
                    )}>{count}</span>
                  </button>
                );
              })}
              <div className="ml-auto text-xs text-slate-500">
                筛选结果: <span className="font-bold text-space-indigo-600">{filteredWarnings.length}</span> 条
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-4">
        {filteredWarnings.length === 0 ? (
          <Card variant="glass">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-heading font-bold text-slate-700 mb-2">暂无符合条件的预警</h3>
              <p className="text-slate-500">所有预警均已处理，继续保持关注！</p>
            </CardContent>
          </Card>
        ) : (
          filteredWarnings.map((warning, idx) => (
            <WarningRow
              key={warning.id}
              warning={warning}
              index={idx}
              onViewDetail={() => {}}
              onChangeStatus={handleChangeStatus}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default HRWarnings;
