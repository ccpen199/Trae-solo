import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Tag,
  Button,
  Tabs,
  List,
  Avatar,
  Badge,
  Table,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Shield,
  ClipboardCheck,
  Stethoscope,
  ArrowRight,
  ChevronRight,
  Video,
  UserCheck,
  Activity,
  XCircle,
  Info,
  RefreshCw,
  Download,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import PatientTypeTag from '@/components/PatientTypeTag';
import { useGlobalStore } from '@/store/useGlobalStore';
import { cn } from '@/lib/utils';
import type {
  ServiceOrder,
  PolicyStatus,
  Severity,
  PatientType,
} from '@/types';
import {
  RISK_TYPE_MAP,
  POLICY_STATUS_MAP,
} from '@/utils/constants';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    nurses,
    orders,
    auditTasks,
    riskTickets,
    policies,
    riskTrendData,
  } = useGlobalStore();

  const [nurseTabKey, setNurseTabKey] = useState<string>('pending');

  const today = dayjs().format('YYYY-MM-DD');

  const stats = useMemo(() => {
    const totalNurses = nurses.length;
    const verifiedNurses = nurses.filter((n) => n.verifyStatus === 'verified').length;
    const nurseVerifyPassRate = totalNurses > 0 ? Math.round((verifiedNurses / totalNurses) * 100) : 0;

    const completedOrders = orders.filter((o) => o.status === 'completed');
    const fullyBoundOrders = completedOrders.filter(
      (o) => o.dataBindingStatus === 'fully-bound'
    );
    const complianceRate =
      completedOrders.length > 0
        ? Math.round((fullyBoundOrders.length / completedOrders.length) * 100)
        : 0;

    const openRiskTickets = riskTickets.filter(
      (t) => t.status === 'open' || t.status === 'investigating'
    );

    const ordersWithInsurance = orders.filter((o) => o.hasInsurance);
    const insuranceCoverageRate =
      orders.length > 0 ? Math.round((ordersWithInsurance.length / orders.length) * 100) : 0;

    const pendingAudits = auditTasks.filter((t) => t.result === 'pending');

    const todayInService = orders.filter(
      (o) =>
        o.status === 'in-service' &&
        dayjs(o.actualStartTime || o.scheduledTime).format('YYYY-MM-DD') === today
    );

    return {
      totalNurses,
      verifiedNurses,
      nurseVerifyPassRate,
      complianceRate,
      openRiskCount: openRiskTickets.length,
      insuranceCoverageRate,
      pendingAuditCount: pendingAudits.length,
      todayInServiceCount: todayInService.length,
    };
  }, [nurses, orders, riskTickets, auditTasks, today]);

  const pendingNurses = useMemo(
    () =>
      nurses
        .filter((n) => n.verifyStatus === 'pending' || n.verifyStatus === 'verifying')
        .slice(0, 5),
    [nurses]
  );

  const rejectedNurses = useMemo(
    () => nurses.filter((n) => n.verifyStatus === 'rejected').slice(0, 5),
    [nurses]
  );

  const openRiskTicketsList = useMemo(
    () =>
      riskTickets
        .filter((t) => t.status === 'open' || t.status === 'investigating')
        .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf())
        .slice(0, 6),
    [riskTickets]
  );

  const riskTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    riskTickets
      .filter((t) => t.status === 'open' || t.status === 'investigating')
      .forEach((t) => {
        counts[t.riskType] = (counts[t.riskType] || 0) + 1;
      });
    return counts;
  }, [riskTickets]);

  const todayPolicies = useMemo(() => {
    return policies
      .filter((p) => dayjs(p.createdAt).format('YYYY-MM-DD') === today)
      .slice(0, 5);
  }, [policies, today]);

  const policyStats = useMemo(() => {
    const todayPoliciesAll = policies.filter(
      (p) => dayjs(p.createdAt).format('YYYY-MM-DD') === today
    );
    const activeToday = todayPoliciesAll.filter((p) => p.status === 'active');
    const successRate =
      todayPoliciesAll.length > 0
        ? Math.round((activeToday.length / todayPoliciesAll.length) * 100)
        : 0;
    const claimedCount = policies.filter((p) => p.claimStatus === 'processing').length;
    return {
      todayCount: todayPoliciesAll.length,
      successRate,
      claimedCount,
    };
  }, [policies, today]);

  const inServiceToday = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status === 'in-service' &&
        dayjs(o.actualStartTime || o.scheduledTime).format('YYYY-MM-DD') === today
    );
  }, [orders, today]);

  const riskTrendOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#fff' },
        padding: [10, 14],
      },
      grid: { left: 40, right: 20, top: 50, bottom: 30 },
      legend: {
        data: ['低风险', '中风险', '高风险', '极高危'],
        right: 0,
        top: 0,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      xAxis: {
        type: 'category',
        data: riskTrendData.map((d) => d.date.slice(5)),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          name: '低风险',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: riskTrendData.map((d) => d.low),
          lineStyle: { color: '#10b981', width: 2.5 },
          itemStyle: { color: '#10b981' },
        },
        {
          name: '中风险',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: riskTrendData.map((d) => d.medium),
          lineStyle: { color: '#3b82f6', width: 2.5 },
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '高风险',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: riskTrendData.map((d) => d.high),
          lineStyle: { color: '#f97316', width: 2.5 },
          itemStyle: { color: '#f97316' },
        },
        {
          name: '极高危',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: riskTrendData.map((d) => d.critical),
          lineStyle: { color: '#ef4444', width: 2.5 },
          itemStyle: { color: '#ef4444' },
        },
      ],
    }),
    [riskTrendData]
  );

  const rejectReasonOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        textStyle: { color: '#64748b', fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
      },
      color: ['#ef4444', '#f97316', '#f59e0b', '#94a3b8'],
      series: [
        {
          type: 'pie',
          radius: ['55%', '80%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 600, color: '#1e293b' },
          },
          data: [
            { name: '证书信息无法核验', value: 42 },
            { name: '材料不清晰', value: 28 },
            { name: '超范围执业', value: 18 },
            { name: '其他', value: 12 },
          ],
        },
      ],
    }),
    []
  );

  const handleRefresh = () => {
    message.success('数据已刷新');
  };

  const handleExport = () => {
    message.success('报表导出中...');
  };

  const serviceColumns: ColumnsType<ServiceOrder> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      render: (val: string, record) => (
        <a
          className="font-mono text-sm text-sky-600 hover:text-sky-700"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/orders/${record.id}`);
          }}
        >
          {val}
        </a>
      ),
    },
    {
      title: '患者',
      key: 'patient',
      width: 140,
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm text-slate-900">
            {record.patientInfo.name}
          </div>
          <div className="text-xs text-slate-400">
            {record.patientInfo.age}岁
            {record.patientInfo.gender === 'male' ? '男' : '女'}
          </div>
        </div>
      ),
    },
    {
      title: '患者类型',
      key: 'patientType',
      width: 110,
      render: (_, record) => (
        <PatientTypeTag type={record.patientType as PatientType} showIcon size="sm" />
      ),
    },
    {
      title: '护士',
      key: 'nurse',
      width: 120,
      render: (_, record) => (
        <div>
          <div className="text-sm text-slate-900">
            {record.nurseInfo?.name || '待分配'}
          </div>
          {record.nurseInfo?.rating !== undefined && (
            <div className="text-xs text-amber-500">
              ★ {record.nurseInfo.rating}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '签到时间',
      key: 'checkIn',
      width: 130,
      render: (_, record) => (
        <div className="text-sm text-slate-600">
          {record.actualStartTime
            ? dayjs(record.actualStartTime).format('MM-DD HH:mm')
            : '未签到'}
        </div>
      ),
    },
    {
      title: '服务时长',
      key: 'duration',
      width: 100,
      render: (_, record) => {
        if (!record.actualStartTime) return <span className="text-slate-400">-</span>;
        const start = dayjs(record.actualStartTime);
        const now = dayjs();
        const diff = now.diff(start, 'minute');
        const hours = Math.floor(diff / 60);
        const mins = diff % 60;
        return (
          <span className="text-sm font-medium text-slate-700">
            {hours > 0 ? `${hours}小时` : ''}
            {mins}分钟
          </span>
        );
      },
    },
    {
      title: '录制状态',
      key: 'recording',
      width: 100,
      render: (_, record) => {
        const status = record.recordingStatus;
        const statusConfig: Record<
          string,
          { label: string; color: string; pulse?: boolean }
        > = {
          recording: { label: '录制中', color: 'bg-red-500', pulse: true },
          completed: { label: '已完成', color: 'bg-emerald-500' },
          interrupted: { label: '已中断', color: 'bg-red-500' },
          'not-started': { label: '未开始', color: 'bg-slate-400' },
          paused: { label: '已暂停', color: 'bg-amber-500' },
        };
        const cfg = statusConfig[status] || statusConfig['not-started'];
        return (
          <span className="inline-flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                'relative h-2 w-2 rounded-full',
                cfg.color,
                cfg.pulse && 'animate-pulse'
              )}
            />
            <span className="text-slate-600">{cfg.label}</span>
          </span>
        );
      },
    },
    {
      title: '数据绑定',
      key: 'dataBinding',
      width: 100,
      render: (_, record) => {
        const status = record.dataBindingStatus;
        const statusConfig: Record<string, { label: string; className: string }> = {
          'fully-bound': {
            label: '完整',
            className: 'bg-emerald-50 text-emerald-700',
          },
          partial: {
            label: '部分',
            className: 'bg-amber-50 text-amber-700',
          },
          'not-bound': {
            label: '未绑定',
            className: 'bg-slate-100 text-slate-500',
          },
        };
        const cfg = statusConfig[status] || statusConfig['not-bound'];
        return (
          <Tag className={cn('border-none', cfg.className)}>{cfg.label}</Tag>
        );
      },
    },
    {
      title: '投保状态',
      key: 'insurance',
      width: 100,
      render: (_, record) => (
        <StatusBadge type="policy" status={record.insuranceStatus as PolicyStatus} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            type="link"
            size="small"
            icon={<Video className="h-3.5 w-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/service/${record.id}/record`);
            }}
          >
            查看录像
          </Button>
          <Button
            type="link"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/orders/${record.id}`);
            }}
          >
            查看详情
          </Button>
        </div>
      ),
    },
  ];

  const getSeverityDotColor = (severity: Severity) => {
    const map: Record<Severity, string> = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-amber-500',
      low: 'bg-emerald-500',
    };
    return map[severity] || 'bg-slate-400';
  };

  const getRiskTypeLabel = (type: string) => {
    return RISK_TYPE_MAP[type as keyof typeof RISK_TYPE_MAP]?.label || type;
  };

  const isNewTicket = (createdAt: string) => {
    return dayjs().diff(dayjs(createdAt), 'hour') < 2;
  };

  const workflowSteps = [
    {
      icon: ClipboardCheck,
      title: '资质准入',
      subtitle: '护士资质核验',
      primaryValue: stats.totalNurses,
      primaryLabel: '核验人数',
      secondaryValue: `${stats.nurseVerifyPassRate}%`,
      secondaryLabel: '通过率',
      color: 'sky',
      path: '/nurses',
    },
    {
      icon: Stethoscope,
      title: '服务管控',
      subtitle: '过程质量监控',
      primaryValue: stats.todayInServiceCount,
      primaryLabel: '进行中服务',
      secondaryValue: '录制中',
      secondaryLabel: '实时',
      color: 'emerald',
      path: '/service/ongoing',
    },
    {
      icon: ShieldCheck,
      title: '三级审核',
      subtitle: '合规复查机制',
      primaryValue: stats.pendingAuditCount,
      primaryLabel: '待审核',
      secondaryValue: '已通过',
      secondaryLabel: '累计',
      color: 'violet',
      path: '/audit/todo',
    },
  ];

  const nurseTabItems = [
    {
      key: 'pending',
      label: `待核验 (${pendingNurses.length})`,
      children: (
        <List
          dataSource={pendingNurses}
          split={false}
          locale={{ emptyText: '暂无待核验申请' }}
          renderItem={(nurse) => (
            <List.Item className="!px-0 !py-2.5">
              <div className="flex w-full items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Avatar size={28} className="bg-sky-100 text-sky-600 text-xs">
                      {nurse.name.charAt(0)}
                    </Avatar>
                    <span className="truncate text-sm font-medium text-slate-900">
                      {nurse.name}
                    </span>
                  </div>
                  <div className="mt-1 ml-10 font-mono text-xs text-slate-400">
                    {nurse.certificateNumber}
                  </div>
                  <div className="ml-10 text-xs text-slate-400">
                    {nurse.organizationName}
                  </div>
                </div>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => navigate(`/nurses/verify/${nurse.id}`)}
                >
                  核验
                </Button>
              </div>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: 'rejected',
      label: `已驳回 (${rejectedNurses.length})`,
      children: (
        <div>
          <List
            dataSource={rejectedNurses}
            split={false}
            locale={{ emptyText: '暂无驳回记录' }}
            renderItem={(nurse) => (
              <List.Item className="!px-0 !py-2.5">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Avatar size={28} className="bg-red-100 text-red-600 text-xs">
                        {nurse.name.charAt(0)}
                      </Avatar>
                      <span className="truncate text-sm font-medium text-slate-900">
                        {nurse.name}
                      </span>
                    </div>
                    <div className="mt-1 ml-10 truncate text-xs text-slate-400">
                      {nurse.verifyResult?.manualRemark?.slice(0, 30) || '暂无原因'}
                      {nurse.verifyResult?.manualRemark &&
                        nurse.verifyResult.manualRemark.length > 30 && '...'}
                    </div>
                  </div>
                  <Button size="small" onClick={() => navigate(`/nurses/verify/${nurse.id}`)}>
                    重新审核
                  </Button>
                </div>
              </List.Item>
            )}
          />
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-100 pt-2">
            不通过原因 TOP：证书信息无法核验(42%)、材料不清晰(28%)、超范围执业(18%)、其他(12%)
          </div>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="运营监管看板"
        description="实时监控居家护理服务资质准入、过程管控与合规审核"
        icon={<ShieldAlert className="h-6 w-6" />}
        actions={[
          {
            key: 'refresh',
            label: '刷新',
            icon: <RefreshCw className="h-4 w-4" />,
            onClick: handleRefresh,
          },
          {
            key: 'export',
            label: '导出报表',
            icon: <Download className="h-4 w-4" />,
            type: 'primary',
            onClick: handleExport,
          },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="护士核验通过率"
          value={`${stats.nurseVerifyPassRate}%`}
          icon={<ShieldCheck className="h-5 w-5" />}
          gradient="green"
          trend={2.5}
          trendLabel="较昨日"
        />
        <StatCard
          title="订单合规率"
          value={`${stats.complianceRate}%`}
          icon={<FileCheck className="h-5 w-5" />}
          gradient="blue"
          trend={1.2}
          trendLabel="较上周"
        />
        <StatCard
          title="风险告警数"
          value={stats.openRiskCount}
          icon={<AlertTriangle className="h-5 w-5" />}
          gradient="orange"
          trend={-3.1}
          trendLabel="较昨日"
        />
        <StatCard
          title="投保覆盖率"
          value={`${stats.insuranceCoverageRate}%`}
          icon={<Shield className="h-5 w-5" />}
          gradient="cyan"
          trend={0.8}
          trendLabel="较昨日"
        />
        <StatCard
          title="待审核任务"
          value={stats.pendingAuditCount}
          icon={<ClipboardCheck className="h-5 w-5" />}
          gradient="purple"
          trend={5.2}
          trendLabel="较昨日"
        />
        <StatCard
          title="今日服务"
          value={stats.todayInServiceCount}
          icon={<Stethoscope className="h-5 w-5" />}
          gradient="pink"
          trend={4.6}
          trendLabel="较昨日"
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">监管闭环流程</span>
        </div>
        <div className="flex items-stretch gap-4">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            const colorBgMap: Record<string, string> = {
              sky: 'bg-sky-100 text-sky-600',
              emerald: 'bg-emerald-100 text-emerald-600',
              violet: 'bg-violet-100 text-violet-600',
            };
            return (
              <div key={step.title} className="flex flex-1 items-center">
                <Card
                  className="flex-1 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                  bodyStyle={{ padding: 20 }}
                  onClick={() => navigate(step.path)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        colorBgMap[step.color]
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {step.title}
                        </span>
                        <Badge
                          count={`${idx + 1}`}
                          className="!bg-slate-100 !text-slate-500"
                        />
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {step.subtitle}
                      </div>
                      <div className="mt-3 flex gap-6">
                        <div>
                          <div className="text-xl font-bold text-slate-900">
                            {step.primaryValue}
                          </div>
                          <div className="text-xs text-slate-400">
                            {step.primaryLabel}
                          </div>
                        </div>
                        <div>
                          <div className="text-xl font-bold text-slate-600">
                            {step.secondaryValue}
                          </div>
                          <div className="text-xs text-slate-400">
                            {step.secondaryLabel}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-sky-500">
                        查看详情 <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </Card>
                {idx < workflowSteps.length - 1 && (
                  <div className="flex items-center px-2">
                    <ArrowRight className="h-5 w-5 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-sky-500" />
                <span className="font-semibold text-slate-900">护士资质核验监管</span>
              </div>
              <a
                className="text-xs text-sky-500 hover:text-sky-600 cursor-pointer"
                onClick={() => navigate('/nurses')}
              >
                查看全部 <ChevronRight className="h-3 w-3 inline" />
              </a>
            </div>
          }
          bodyStyle={{ paddingTop: 0 }}
        >
          <Tabs
            defaultActiveKey="pending"
            activeKey={nurseTabKey}
            onChange={setNurseTabKey}
            size="small"
            items={nurseTabItems}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="font-semibold text-slate-900">异常工单实时监控</span>
              </div>
              <a
                className="text-xs text-sky-500 hover:text-sky-600 cursor-pointer"
                onClick={() => navigate('/risk/tickets')}
              >
                查看全部 <ChevronRight className="h-3 w-3 inline" />
              </a>
            </div>
          }
        >
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Object.entries(riskTypeCounts).map(([type, count]) => (
              <Tag
                key={type}
                color={RISK_TYPE_MAP[type as keyof typeof RISK_TYPE_MAP]?.color || 'default'}
                className="!text-xs !m-0"
              >
                {getRiskTypeLabel(type)} {count}
              </Tag>
            ))}
            {Object.keys(riskTypeCounts).length === 0 && (
              <span className="text-xs text-slate-400">暂无异常工单</span>
            )}
          </div>
          <List
            dataSource={openRiskTicketsList}
            split={false}
            size="small"
            locale={{ emptyText: '暂无异常工单' }}
            renderItem={(ticket) => (
              <List.Item className="!px-0 !py-2">
                <div className="flex w-full items-center gap-3">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 shrink-0 rounded-full',
                      getSeverityDotColor(ticket.severity as Severity)
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {getRiskTypeLabel(ticket.riskType)}
                      </span>
                      {isNewTicket(ticket.createdAt) && (
                        <Tag color="red" className="!text-xs !py-0 !px-1.5 !m-0">
                          new
                        </Tag>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono truncate">{ticket.orderNo}</span>
                      <span>·</span>
                      <span className="truncate">{ticket.nurseName || '未知'}</span>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    ghost
                    onClick={() => navigate(`/risk/tickets/${ticket.id}`)}
                  >
                    处理
                  </Button>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-slate-900">自动投保结果追踪</span>
              </div>
              <a
                className="text-xs text-sky-500 hover:text-sky-600 cursor-pointer"
                onClick={() => navigate('/insurance/policies')}
              >
                查看全部 <ChevronRight className="h-3 w-3 inline" />
              </a>
            </div>
          }
        >
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-slate-50 rounded-lg">
              <div className="text-lg font-bold text-slate-900">
                {policyStats.todayCount}
              </div>
              <div className="text-xs text-slate-500">今日投保</div>
            </div>
            <div className="text-center p-2 bg-emerald-50 rounded-lg">
              <div className="text-lg font-bold text-emerald-600">
                {policyStats.successRate}%
              </div>
              <div className="text-xs text-slate-500">投保成功率</div>
            </div>
            <div className="text-center p-2 bg-amber-50 rounded-lg">
              <div className="text-lg font-bold text-amber-600">
                {policyStats.claimedCount}
              </div>
              <div className="text-xs text-slate-500">理赔中</div>
            </div>
          </div>
          <List
            dataSource={todayPolicies}
            split={false}
            size="small"
            locale={{ emptyText: '暂无今日保单' }}
            renderItem={(policy) => {
              const statusCfg = POLICY_STATUS_MAP[policy.status];
              return (
                <List.Item className="!px-0 !py-2">
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-sm text-sky-600 truncate">
                        {policy.policyNo}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400 truncate">
                        {policy.insuredName} · {policy.orderNo}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Tag
                        className={cn('!m-0 border-none', statusCfg.bgColor)}
                        icon={<Shield className="h-3 w-3" />}
                      >
                        {statusCfg.label}
                      </Tag>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => navigate(`/insurance/${policy.id}`)}
                      >
                        详情
                      </Button>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
          <div className="mt-2 text-xs text-slate-400 border-t border-slate-100 pt-2 flex items-center gap-1">
            <Info className="h-3 w-3" />
            服务开始自动投保，保险公司API实时回调
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card
          className="col-span-2"
          title={
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-slate-900">近 7 天风险趋势</span>
            </div>
          }
        >
          <ReactECharts option={riskTrendOption} style={{ height: 280 }} />
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="font-semibold text-slate-900">核验驳回原因分布</span>
            </div>
          }
        >
          <ReactECharts option={rejectReasonOption} style={{ height: 260 }} />
        </Card>
      </div>

      <div className="mt-6">
        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-slate-900">今日进行中服务</span>
                <Tag color="green" className="!ml-2">
                  {inServiceToday.length} 单
                </Tag>
              </div>
              <a
                className="text-xs text-sky-500 hover:text-sky-600 cursor-pointer"
                onClick={() => navigate('/service/ongoing')}
              >
                查看全部 <ChevronRight className="h-3 w-3 inline" />
              </a>
            </div>
          }
        >
          <Table
            dataSource={inServiceToday}
            columns={serviceColumns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1100 }}
            size="small"
            locale={{ emptyText: '今日暂无进行中服务' }}
          />
        </Card>
      </div>
    </div>
  );
}
