import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Avatar, Table, Tag, Tooltip } from 'antd';
import {
  ClipboardList,
  Users,
  Stethoscope,
  AlertTriangle,
  ShieldCheck,
  CircleDollarSign,
  FileCheck,
  Ticket,
  CalendarClock,
  ChevronRight,
  Star,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import type { ColumnsType } from 'antd/es/table';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import PatientTypeTag from '@/components/PatientTypeTag';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockOrders, mockNurses } from '@/mock';
import { cn } from '@/lib/utils';
import type { ServiceOrder, PatientType } from '@/types';

const inServiceItems: ServiceOrder[] = mockOrders
  .filter((o) => o.status === 'in-service')
  .slice(0, 5);

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardStats, patientTypeDistribution, nurseRankingData, riskTrendData } = useGlobalStore();

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
        data: ['风险工单数量', '已处理数量'],
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
          name: '风险工单数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: riskTrendData.map((d) => d.low + d.medium + d.high + d.critical),
          lineStyle: { color: '#f97316', width: 2.5 },
          itemStyle: { color: '#f97316' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(249, 115, 22, 0.25)' },
                { offset: 1, color: 'rgba(249, 115, 22, 0.02)' },
              ],
            },
          },
        },
        {
          name: '已处理数量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: riskTrendData.map((d) => Math.floor((d.low + d.medium) * 0.75)),
          lineStyle: { color: '#10b981', width: 2.5 },
          itemStyle: { color: '#10b981' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
                { offset: 1, color: 'rgba(16, 185, 129, 0.02)' },
              ],
            },
          },
        },
      ],
    }),
    [riskTrendData]
  );

  const patientPieOption = useMemo(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'center',
        textStyle: { color: '#64748b', fontSize: 12 },
        itemWidth: 10,
        itemHeight: 10,
      },
      color: ['#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
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
          data: patientTypeDistribution.map((p) => ({
            name: p.name,
            value: p.value,
          })),
        },
      ],
    }),
    [patientTypeDistribution]
  );

  const rankingColumns: ColumnsType<{ id: string; name: string; completedOrders: number; rating: number; organization: string }> = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_: unknown, __: unknown, index: number) => {
        const colors = ['text-amber-500', 'text-slate-400', 'text-orange-400', 'text-slate-500', 'text-slate-500'];
        return <span className={cn('font-bold text-base', colors[index])}>{index + 1}</span>;
      },
    },
    {
      title: '护士',
      key: 'nurse',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Avatar size={32} className="bg-sky-100 text-sky-600">
            {record.name.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium text-sm text-slate-900">{record.name}</div>
            <div className="text-xs text-slate-400">{record.organization}</div>
          </div>
        </div>
      ),
    },
    {
      title: '完成订单',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
      align: 'center',
      render: (val: number) => <span className="font-semibold text-slate-800">{val}</span>,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      align: 'center',
      render: (val: number) => (
        <div className="flex items-center justify-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="font-medium text-sm">{val}</span>
        </div>
      ),
    },
  ];

  const quickEntries = [
    { icon: Users, title: '护士资质核验', desc: '待核验 12 人', color: 'sky', path: '/nurses', gradient: 'from-sky-50 to-blue-50' },
    { icon: FileCheck, title: '待派单订单', desc: '待派单 18 单', color: 'indigo', path: '/orders', gradient: 'from-indigo-50 to-violet-50' },
    { icon: Ticket, title: '待处理工单', desc: '待处理 8 单', color: 'rose', path: '/risk-tickets', gradient: 'from-rose-50 to-pink-50' },
    { icon: CalendarClock, title: '审核任务', desc: '待审核 42 单', color: 'violet', path: '/audit-todo', gradient: 'from-violet-50 to-purple-50' },
  ];

  const colorBgMap: Record<string, string> = {
    sky: 'bg-sky-100 text-sky-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    rose: 'bg-rose-100 text-rose-600',
    violet: 'bg-violet-100 text-violet-600',
  };

  return (
    <div>
      <PageHeader title="运营数据总览" description="实时监控居家护理服务运营与合规指标" />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="今日订单" value={dashboardStats.todayOrders} icon={<ClipboardList className="h-5 w-5" />} gradient="blue" trend={dashboardStats.todayOrdersTrend} />
        <StatCard title="服务中" value={37} icon={<Stethoscope className="h-5 w-5" />} gradient="cyan" />
        <StatCard title="在线护士" value={dashboardStats.activeNurses} icon={<Users className="h-5 w-5" />} gradient="green" trend={dashboardStats.activeNursesTrend} />
        <StatCard title="风险预警" value={dashboardStats.riskAlerts} icon={<AlertTriangle className="h-5 w-5" />} gradient="orange" />
        <StatCard title="待审核" value={dashboardStats.pendingAudits} icon={<ShieldCheck className="h-5 w-5" />} gradient="purple" />
        <StatCard title="今日营收" value={`¥${dashboardStats.revenueToday.toLocaleString()}`} icon={<CircleDollarSign className="h-5 w-5" />} gradient="pink" trend={dashboardStats.revenueTrend} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">风险趋势监控</h3>
              <p className="mt-0.5 text-xs text-slate-500">近 7 天风险工单与处理情况</p>
            </div>
            <Tag color="orange">实时更新</Tag>
          </div>
          <ReactECharts option={riskTrendOption} style={{ height: 280 }} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">实时服务列表</h3>
              <p className="mt-0.5 text-xs text-slate-500">当前进行中的服务</p>
            </div>
            <StatusBadge type="order" status="in-service" showDot />
          </div>
          <List
            dataSource={inServiceItems}
            split={false}
            renderItem={(order) => (
              <List.Item
                className="!px-0 !py-2.5 cursor-pointer group"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-slate-900">
                        {order.patientInfo.name}
                      </span>
                      <PatientTypeTag type={order.patientType as PatientType} showIcon size="sm" />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="truncate">{order.nurseInfo?.name || '待分配'}</span>
                      <span>·</span>
                      <Tooltip title={order.scheduledTime}>
                        <span className="truncate">{order.scheduledTime.slice(5, 16)}</span>
                      </Tooltip>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-sky-500 opacity-0 transition group-hover:opacity-100" />
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-4">
        {quickEntries.map((entry) => {
          const Icon = entry.icon;
          return (
            <div
              key={entry.title}
              onClick={() => navigate(entry.path)}
              className={cn(
                'group cursor-pointer rounded-xl border border-slate-200 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg bg-gradient-to-br',
                entry.gradient
              )}
            >
              <div className={cn('mb-3 flex h-11 w-11 items-center justify-center rounded-xl', colorBgMap[entry.color])}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-slate-900">{entry.title}</div>
              <div className="mt-1 text-xs text-slate-500">{entry.desc}</div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 transition group-hover:text-sky-600">
                立即查看 <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900">患者类型分布</h3>
            <p className="mt-0.5 text-xs text-slate-500">本月服务患者类型占比</p>
          </div>
          <ReactECharts option={patientPieOption} style={{ height: 260 }} />
        </div>

        <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">护士排行榜</h3>
              <p className="mt-0.5 text-xs text-slate-500">本月完成订单数 Top 5</p>
            </div>
            <Tag color="green">月度榜</Tag>
          </div>
          <Table
            dataSource={nurseRankingData.slice(0, 5)}
            columns={rankingColumns}
            rowKey="id"
            pagination={false}
            showHeader={true}
            size="small"
            className="nurse-ranking-table"
          />
        </div>
      </div>
    </div>
  );
}
