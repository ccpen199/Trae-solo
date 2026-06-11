import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, FileText, MessageSquare, DollarSign,
  Plus, Upload, Play, QrCode, AlertTriangle, Clock,
  CheckCircle2, ArrowRight, TrendingUp, Shield, Star, ListChecks, Archive, ChevronRight
} from 'lucide-react';

const API = '/api';

function AnimatedNumber({ target, duration = 1000 }: { target: number; duration?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setCurrent(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return <span className="font-mono">{current.toLocaleString()}</span>;
}

const alertTypeTitleMap: Record<string, string> = {
  overtime: '超工时预警',
  unsigned_contract: '未签合同预警',
  abnormal_behavior: '异常行为预警',
  abnormal_attendance: '考勤异常',
  low_credit: '信用预警',
  credit_risk: '信用风险',
  attendance_anomaly: '考勤异常',
  settlement_overdue: '结算逾期',
  contract_expired: '合同到期',
  compliance_violation: '合规违规',
  data_inconsistency: '数据不一致',
  salary_dispute: '薪资争议',
  overwork_alert: '超工时预警',
};

function getAlertTitle(alertType: string) {
  return alertTypeTitleMap[alertType] || alertType;
}

const levelBadgeMap: Record<string, string> = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-info',
};

const levelColorMap: Record<string, string> = {
  high: 'border-l-red-500 bg-red-50/50',
  medium: 'border-l-amber-500 bg-amber-50/50',
  low: 'border-l-blue-500 bg-blue-50/50',
};

const levelIconColor: Record<string, string> = {
  high: 'text-red-500',
  medium: 'text-amber-500',
  low: 'text-blue-500',
};

const quickActions = [
  { label: '发布岗位', subtitle: '发布后可自动匹配学生', icon: Plus, color: 'btn-primary', path: '/jobs/create' },
  { label: '导入学生', subtitle: '解析简历并标签化', icon: Upload, color: 'bg-primary/80 hover:bg-primary text-white', path: '/talents' },
  { label: '发起面试', subtitle: 'HR/导师/学生三方协作', icon: Play, color: 'btn-accent', path: '/interviews' },
  { label: '生成签到码', subtitle: '批量扫码核验考勤', icon: QrCode, color: 'bg-emerald-500 hover:bg-emerald-600 text-white', path: '/attendance/checkin' },
];

const todoItems = [
  { id: 1, text: '审核3份新投递简历', done: false, priority: 'high' as const, path: '/talents' },
  { id: 2, text: '安排明天群面场次', done: false, priority: 'medium' as const, path: '/interviews' },
  { id: 3, text: '确认6月薪资结算数据', done: false, priority: 'high' as const, path: '/settlement' },
  { id: 4, text: '处理异常考勤申诉', done: false, priority: 'medium' as const, path: '/attendance' },
];

const governanceCards = [
  { title: '集团多租户', detail: '岗位边界/账号层级', icon: Shield, apiPath: '/admin/tenants', metricKey: 'total', fallback: '--', unit: '个租户', path: '/admin/tenants' },
  { title: '双向互评信用', detail: '守时/技能/协作标签', icon: Star, apiPath: '/credit/1', metricKey: 'credit_score', fallback: '--', unit: '分', path: '/credit' },
  { title: '喵任务追踪', detail: '完成率/奖励/转化', icon: ListChecks, apiPath: '/micro-tasks?pageSize=1', metricKey: 'total', fallback: '--', unit: '个任务', path: '/micro-tasks' },
  { title: '合规留存审计', detail: '归档批次/报告导出', icon: Archive, apiPath: '/admin/compliance', metricKey: 'summary', fallback: '--', unit: '项待审', path: '/admin/compliance' },
];

const activityRouteMap: Record<string, string> = {
  apply: '/talents',
  interview: '/interviews',
  settlement: '/settlement',
  import: '/talents',
  attendance: '/attendance',
};

const staticActivities = [
  { id: 1, text: '赵雪投递了"图书馆管理员"岗位', time: '5分钟前', type: 'apply' },
  { id: 2, text: '面试"食堂服务员"已结束', time: '30分钟前', type: 'interview' },
  { id: 3, text: '5月工资批次已生成', time: '1小时前', type: 'settlement' },
  { id: 4, text: '新学生陈浩导入成功', time: '2小时前', type: 'import' },
  { id: 5, text: '刘洋完成今日签到', time: '3小时前', type: 'attendance' },
];

interface RiskAlert {
  id: number;
  type?: string;
  alert_type: string;
  level: string;
  message: string;
  status: string;
  created_at: string;
  org_name?: string;
  related_user_name?: string;
}

interface PipelineData {
  jobs: { items: any[]; total: number };
  talents: { items: any[]; total: number };
  interviews: { items: any[]; total: number };
  bills: { items: any[]; total: number };
}

interface GovernanceMetrics {
  tenants: number | string;
  creditScore: number | string;
  microTasks: number | string;
  compliance: number | string;
}

interface DashboardData {
  jobCount: number | null;
  talentCount: number | null;
  interviewCount: number | null;
  fundPool: number | null;
  alertCount: number | null;
  resolvedAlertCount: number | null;
  riskAlerts: RiskAlert[];
  pipeline: PipelineData;
  governance: GovernanceMetrics;
}

function StatCard({ stat, index, onClick }: { stat: { label: string; value: number | null; icon: React.ElementType; color: string; trend: string; isMoney?: boolean; path: string }; index: number; onClick: () => void }) {
  const Icon = stat.icon;
  return (
    <button
      onClick={onClick}
      className={`card-base p-5 animate-fade-in stagger-${index + 1} text-left w-full transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
          <p className="text-2xl font-bold font-heading">
            {stat.isMoney ? '¥' : ''}
            {stat.value !== null ? <AnimatedNumber target={stat.value} /> : <span className="font-mono">--</span>}
          </p>
        </div>
        <div className={`p-2.5 rounded-xl ${stat.color}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-center mt-3 text-xs">
        <TrendingUp size={14} className="text-emerald-500 mr-1" />
        <span className="text-emerald-500 font-medium">{stat.trend}</span>
        <span className="text-gray-400 ml-1">较上月</span>
        <ChevronRight size={14} className="text-gray-300 ml-auto" />
      </div>
    </button>
  );
}

function TodoItem({ todo }: { todo: typeof todoItems[0] }) {
  const navigate = useNavigate();
  const [done, setDone] = useState(todo.done);
  return (
    <div
      className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors"
      onClick={() => navigate(todo.path)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); setDone(!done); }}
        className="shrink-0"
      >
        {done ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : (
          <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
        )}
      </button>
      <span className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
        {todo.text}
      </span>
      {todo.priority === 'high' && !done && (
        <span className="ml-auto badge-danger text-xs px-2 py-0.5 rounded-full">紧急</span>
      )}
    </div>
  );
}

function RiskAlertItem({ alert, onAction }: { alert: RiskAlert; onAction: (id: number, status: string) => void }) {
  const level = alert.level || 'medium';
  const type = alert.type || alert.alert_type || 'abnormal_behavior';
  const source = alert.org_name || '总部风控组';
  const owner = alert.related_user_name || '值班 HR';
  const reviewMap: Record<string, string> = {
    overtime: '复查排班表、签到签退、周工时阈值和调休安排',
    unsigned_contract: '核对合同签章、上岗日期、岗位责任人和补签回执',
    abnormal_behavior: '复查考勤轨迹、导师反馈、学生申诉和关闭意见',
    abnormal_attendance: '复查签到位置、迟到次数、申诉材料和核验结果',
    low_credit: '复查评价来源、标签变化和信用分调整依据',
  };
  const statusMap: Record<string, { label: string; className: string; result: string }> = {
    pending: { label: '待处理', className: 'badge-warning', result: '待责任人提交处理结果，关闭后写入合规留存' },
    resolved: { label: '已关闭', className: 'badge-success', result: '已完成复查并关闭，处理记录已归档' },
    ignored: { label: '已忽略', className: 'badge-info', result: '低风险忽略，保留复查依据和操作人' },
  };
  const statusInfo = statusMap[alert.status] || statusMap.pending;
  return (
    <div className={`border-l-4 ${levelColorMap[level] || levelColorMap.medium} p-3 rounded-r-lg`}>
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={14} className={levelIconColor[level] || levelIconColor.medium} />
        <span className={`text-xs px-1.5 py-0.5 rounded ${levelBadgeMap[level] || levelBadgeMap.medium}`}>
          {level === 'high' ? '高' : level === 'medium' ? '中' : '低'}
        </span>
        <span className={`${statusInfo.className} text-[10px]`}>{statusInfo.label}</span>
        <p className="text-sm font-medium text-gray-800">{getAlertTitle(type)}</p>
      </div>
      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mt-2 text-xs text-gray-500">
        <span>责任分公司：{source}</span>
        <span>责任人：{owner}</span>
        <span className="md:col-span-2">复查记录：{reviewMap[type] || reviewMap.abnormal_behavior}</span>
        <span className="md:col-span-2">关闭结果：{statusInfo.result}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock size={12} />
          <span>{alert.created_at ? new Date(alert.created_at).toLocaleString('zh-CN') : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction(alert.id, 'resolved')}
            className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          >
            处理
          </button>
          <button
            onClick={() => onAction(alert.id, 'ignored')}
            className="text-xs px-2 py-1 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            忽略
          </button>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }: { activity: typeof staticActivities[0] }) {
  const navigate = useNavigate();
  const iconMap: Record<string, React.ElementType> = { apply: FileText, interview: MessageSquare, settlement: DollarSign, import: Upload, attendance: Clock };
  const Icon = iconMap[activity.type] || Clock;
  return (
    <button
      onClick={() => navigate(activityRouteMap[activity.type] || '/')}
      className="flex items-start gap-3 py-2.5 w-full text-left hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors"
    >
      <div className="p-1.5 rounded-lg bg-gray-100 mt-0.5">
        <Icon size={14} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{activity.text}</p>
        <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
      </div>
    </button>
  );
}

function PipelineMiniList({ title, icon: Icon, items, renderItem, footerText, footerPath }: {
  title: string;
  icon: React.ElementType;
  items: any[];
  renderItem: (item: any, i: number) => React.ReactNode;
  footerText: string;
  footerPath: string;
}) {
  const navigate = useNavigate();
  return (
    <div className={`card-base p-4 animate-fade-in stagger-${1}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Icon size={18} />
        </div>
        <h3 className="font-heading font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.length > 0 ? items.map((item, i) => renderItem(item, i)) : (
          <p className="text-xs text-gray-400 py-2 text-center">暂无数据</p>
        )}
      </div>
      <button
        onClick={() => navigate(footerPath)}
        className="text-xs text-primary hover:text-primary-light flex items-center gap-1 mt-3 w-full justify-center"
      >
        {footerText} <ArrowRight size={12} />
      </button>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    jobCount: null,
    talentCount: null,
    interviewCount: null,
    fundPool: null,
    alertCount: null,
    resolvedAlertCount: null,
    riskAlerts: [],
    pipeline: { jobs: { items: [], total: 0 }, talents: { items: [], total: 0 }, interviews: { items: [], total: 0 }, bills: { items: [], total: 0 } },
    governance: { tenants: '--', creditScore: '--', microTasks: '--', compliance: '--' },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        fetch(`${API}/jobs?status=published&pageSize=1`),
        fetch(`${API}/talents?pageSize=1`),
        fetch(`${API}/interviews?status=in_progress&pageSize=1`),
        fetch(`${API}/settlement/pool?org_id=1`),
        fetch(`${API}/risk/alerts?status=pending&pageSize=1`),
        fetch(`${API}/risk/alerts?status=pending&pageSize=5`),
        fetch(`${API}/risk/alerts?status=resolved&pageSize=1`),
        fetch(`${API}/jobs?status=published&pageSize=3`),
        fetch(`${API}/talents?pageSize=3`),
        fetch(`${API}/interviews?status=in_progress&pageSize=3`),
        fetch(`${API}/settlement/bills?org_id=1&pageSize=3`),
        fetch(`${API}/admin/tenants`),
        fetch(`${API}/credit/1`),
        fetch(`${API}/micro-tasks?pageSize=1`),
        fetch(`${API}/admin/compliance`),
      ]);

      const extract = (r: PromiseSettledResult<Response>) => {
        if (r.status !== 'fulfilled' || !r.value.ok) return null;
        return r.value.json();
      };

      const [jobsCountR, talentsCountR, interviewsCountR, poolR, alertCountR, alertsR, resolvedCountR, jobsPipeR, talentsPipeR, interviewsPipeR, billsPipeR, tenantsR, creditR, microTasksR, complianceR] = results;

      const [jobsCountD, talentsCountD, interviewsCountD, poolD, alertCountD, alertsD, resolvedCountD, jobsPipeD, talentsPipeD, interviewsPipeD, billsPipeD, tenantsD, creditD, microTasksD, complianceD] = await Promise.all([
        extract(jobsCountR), extract(talentsCountR), extract(interviewsCountR), extract(poolR),
        extract(alertCountR), extract(alertsR), extract(resolvedCountR),
        extract(jobsPipeR), extract(talentsPipeR), extract(interviewsPipeR), extract(billsPipeR),
        extract(tenantsR), extract(creditR), extract(microTasksR), extract(complianceR),
      ]);

      setData({
        jobCount: jobsCountD?.data?.total ?? null,
        talentCount: talentsCountD?.data?.total ?? null,
        interviewCount: interviewsCountD?.data?.total ?? null,
        fundPool: poolD?.data?.balance ?? null,
        alertCount: alertCountD?.data?.total ?? null,
        resolvedAlertCount: resolvedCountD?.data?.total ?? null,
        riskAlerts: alertsD?.data?.items ?? [],
        pipeline: {
          jobs: { items: jobsPipeD?.data?.items ?? [], total: jobsPipeD?.data?.total ?? 0 },
          talents: { items: talentsPipeD?.data?.items ?? [], total: talentsPipeD?.data?.total ?? 0 },
          interviews: { items: interviewsPipeD?.data?.items ?? [], total: interviewsPipeD?.data?.total ?? 0 },
          bills: { items: billsPipeD?.data?.items ?? [], total: billsPipeD?.data?.total ?? 0 },
        },
        governance: {
          tenants: tenantsD?.data?.total ?? tenantsD?.data?.items?.length ?? '--',
          creditScore: creditD?.data?.credit_score ?? '--',
          microTasks: microTasksD?.data?.total ?? '--',
          compliance: complianceD?.data?.summary
            ? (Number(complianceD.data.summary.unsigned_contracts || 0) + Number(complianceD.data.summary.overtime_alerts || 0))
            : (complianceD?.data?.total ?? '--'),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAlertAction = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API}/risk/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const stats = [
    { label: '在招岗位', value: data.jobCount, icon: Briefcase, color: 'bg-blue-50 text-blue-600', trend: '+3', path: '/jobs?status=published' },
    { label: '待处理简历', value: data.talentCount, icon: FileText, color: 'bg-amber-50 text-amber-600', trend: '+12', path: '/talents' },
    { label: '进行中面试', value: data.interviewCount, icon: MessageSquare, color: 'bg-emerald-50 text-emerald-600', trend: '+2', path: '/interviews?status=in_progress' },
    { label: '本月结算金额', value: data.fundPool, icon: DollarSign, color: 'bg-accent/10 text-accent', trend: '+15%', isMoney: true, path: '/settlement' },
  ];

  const pendingTodos = todoItems.filter((t) => !t.done);

  const govMetrics = [data.governance.tenants, data.governance.creditScore, data.governance.microTasks, data.governance.compliance];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-gray-800">工作台</h2>
          <p className="text-sm text-gray-500 mt-0.5">欢迎回来，张明远</p>
        </div>
        <span className="text-sm text-gray-400">{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          加载失败：{error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} onClick={() => navigate(stat.path)} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.color} rounded-xl px-4 py-3 flex flex-col items-start gap-0.5 transition-all duration-200 active:scale-95 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <Icon size={18} />
                <span className="text-sm font-medium">{action.label}</span>
              </div>
              <span className="text-xs opacity-80 ml-6">{action.subtitle}</span>
            </button>
          );
        })}
      </div>

      <div>
        <h3 className="font-heading font-semibold text-gray-800 mb-3">招聘流水线</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <PipelineMiniList
            title="岗位与匹配"
            icon={Briefcase}
            items={data.pipeline.jobs.items}
            footerText={`查看全部${data.pipeline.jobs.total}个岗位`}
            footerPath="/jobs"
            renderItem={(job, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 truncate flex-1">{job.title || job.name}</span>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {job.type && <span className="badge-info text-xs px-1.5 py-0.5 rounded">{job.type}</span>}
                  <span className="text-xs text-gray-400 font-mono">{job.application_count ?? 0}人投递</span>
                </div>
              </div>
            )}
          />
          <PipelineMiniList
            title="简历与复核"
            icon={FileText}
            items={data.pipeline.talents.items}
            footerText={`查看全部${data.pipeline.talents.total}份简历`}
            footerPath="/talents"
            renderItem={(talent, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 truncate">{talent.name || talent.student_name}</span>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {talent.major && <span className="text-xs text-gray-500 truncate max-w-[80px]">{talent.major}</span>}
                  {talent.credit_score != null && <span className="badge-success text-xs px-1.5 py-0.5 rounded">{talent.credit_score}分</span>}
                </div>
              </div>
            )}
          />
          <PipelineMiniList
            title="面试与协作"
            icon={MessageSquare}
            items={data.pipeline.interviews.items}
            footerText="查看全部面试"
            footerPath="/interviews"
            renderItem={(iv, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 truncate flex-1">{iv.job_title || iv.title}</span>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {iv.type && <span className="badge-info text-xs px-1.5 py-0.5 rounded">{iv.type}</span>}
                  {iv.status && <span className="badge-success text-xs px-1.5 py-0.5 rounded">{iv.status}</span>}
                </div>
              </div>
            )}
          />
          <PipelineMiniList
            title="考勤与分账"
            icon={DollarSign}
            items={data.pipeline.bills.items}
            footerText="查看结算中心"
            footerPath="/settlement"
            renderItem={(bill, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm font-mono text-gray-700">¥{bill.amount ?? 0}</span>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {bill.fee != null && <span className="text-xs text-gray-400">手续费¥{bill.fee}</span>}
                  {bill.status && <span className={`text-xs px-1.5 py-0.5 rounded ${bill.status === 'paid' ? 'badge-success' : bill.status === 'pending' ? 'badge-warning' : 'badge-info'}`}>{bill.status}</span>}
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <div className="card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-gray-800">风控预警</h3>
          <div className="flex items-center gap-3">
            {data.resolvedAlertCount !== null && (
              <span className="text-xs text-gray-400">已处理 {data.resolvedAlertCount} 条</span>
            )}
            <button onClick={() => navigate('/risk')} className="text-xs text-primary hover:text-primary-light flex items-center gap-1">
              查看全部预警 <ArrowRight size={12} />
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {loading ? (
            <div className="text-sm text-gray-400 py-4 text-center">加载中...</div>
          ) : data.riskAlerts.length > 0 ? (
            data.riskAlerts.map((alert) => (
              <RiskAlertItem key={alert.id} alert={alert} onAction={handleAlertAction} />
            ))
          ) : (
            <div className="text-sm text-gray-400 py-4 text-center">暂无预警</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-gray-800">待办事项</h3>
            <span className="badge-warning text-xs px-2 py-0.5 rounded-full">
              {pendingTodos.length} 待处理
            </span>
          </div>
          {todoItems.map((todo) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>

        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-gray-800">最近动态</h3>
          </div>
          {staticActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>

        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-gray-800">平台治理</h3>
            <button onClick={() => navigate('/admin')} className="text-xs text-primary hover:text-primary-light flex items-center gap-1">
              进入系统管理 <ArrowRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {governanceCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  onClick={() => navigate(card.path)}
                  className="bg-gray-50 rounded-lg p-3 text-left hover:bg-gray-100 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-medium text-gray-600">{card.title}</span>
                  </div>
                  <p className="text-lg font-bold font-heading text-gray-800">
                    {govMetrics[i]}
                    <span className="text-xs font-normal text-gray-400 ml-1">{card.unit}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{card.detail}</p>
                  <div className="mt-2 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    进入 <ChevronRight size={12} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
