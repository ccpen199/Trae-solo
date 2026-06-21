import { useState, useEffect } from 'react';
import { Card, Row, Col, Timeline, Tag, Progress, Empty, Spin } from 'antd';
import {
  MapPin,
  Wallet,
  Clock,
  AlertTriangle,
  FileText,
  Calculator,
  RefreshCw,
  SlidersHorizontal,
  Building,
  Headphones,
  TrendingUp,
  Calendar,
  ChevronRight,
  ShieldCheck,
  User,
  Briefcase,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { get } from '@/utils/api';
import { useUserStore } from '@/store/userStore';
import {
  cityRatePlans,
  mockTransactions,
  policyDocuments,
} from 'shared/mockData';
import {
  CITIES,
  CITY_NAMES,
  TRANSACTION_NAMES,
  TRANSACTION_STATUS_NAMES,
  TRANSACTION_STATUS_COLORS,
} from 'shared/types';
import type {
  DashboardStats,
  Transaction,
  PolicyDocument,
  CityCode,
  InsuranceType,
} from 'shared/types';

interface QuickAction {
  key: string;
  title: string;
  icon: any;
  path: string;
  color: string;
  desc: string;
}

const quickActions: QuickAction[] = [
  { key: 'insurance', title: '参保方案', icon: ShieldCheck, path: '/insurance', color: 'bg-blue-50 text-blue-700', desc: '五险一金方案配置' },
  { key: 'calculator', title: '立即测算', icon: Calculator, path: '/calculator', color: 'bg-emerald-50 text-emerald-700', desc: '社保缴费金额测算' },
  { key: 'supplement', title: '社保补缴', icon: RefreshCw, path: '/transaction', color: 'bg-amber-50 text-amber-700', desc: '断缴历史月份补缴' },
  { key: 'base', title: '基数调整', icon: SlidersHorizontal, path: '/transaction', color: 'bg-purple-50 text-purple-700', desc: '缴费基数上下调整' },
  { key: 'hospital', title: '医院变更', icon: Building, path: '/transaction', color: 'bg-rose-50 text-rose-700', desc: '定点医院新增/变更' },
  { key: 'support', title: '客服工单', icon: Headphones, path: '/support', color: 'bg-cyan-50 text-cyan-700', desc: '政策咨询/问题反馈' },
];

function Dashboard() {
  const navigate = useNavigate();
  const currentCity = useUserStore((s) => s.currentCity);
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [policies, setPolicies] = useState<PolicyDocument[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await get<DashboardStats>('/dashboard/stats');
        if (res.code === 200) {
          setStats(res.data);
          setTransactions(res.data.recentTransactions.slice(0, 3));
          setPolicies(
            policyDocuments
              .filter((p) => p.cityCode !== 'NATIONAL')
              .sort(
                (a, b) =>
                  new Date(b.effectiveDate).getTime() -
                  new Date(a.effectiveDate).getTime()
              )
              .slice(0, 6)
          );
        } else {
          throw new Error('');
        }
      } catch {
        const pendingTx = mockTransactions.filter((t) =>
          ['SUBMITTED', 'AI_REVIEWING', 'MANUAL_REVIEWING', 'PROCESSING'].includes(
            t.status
          )
        );
        setStats({
          activePlans: 1,
          monthlyAmount: 7920,
          pendingTransactions: pendingTx.length,
          pendingTickets: 2,
          currentCity,
          recentTransactions: mockTransactions,
          policyUpdates: [],
        });
        setTransactions(mockTransactions.slice(0, 3));
        setPolicies(
          policyDocuments
            .filter((p) => p.cityCode !== 'NATIONAL')
            .sort(
              (a, b) =>
                new Date(b.effectiveDate).getTime() -
                new Date(a.effectiveDate).getTime()
            )
            .slice(0, 6)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentCity]);

  const buildTrendChartOption = () => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const items: InsuranceType[] = [
      'PENSION',
      'MEDICAL',
      'UNEMPLOYMENT',
      'INJURY',
      'MATERNITY',
      'HOUSING_FUND',
    ];
    const series = CITIES.map((code) => {
      const plan = cityRatePlans[code];
      const base = plan ? (cityRatePlans[code] as any).items[0]?.base || 12000 : 12000;
      let total = 0;
      plan.items.forEach((it) => {
        if (items.includes(it.type)) {
          total += it.personalAmount || ((base * it.personalRate) / 100);
          total += it.companyAmount || ((base * it.companyRate) / 100);
        }
      });
      const baseTotal = Number(total.toFixed(2));
      const data = months.map((_, i) =>
        Number((baseTotal * (0.95 + i * 0.015 + Math.random() * 0.02)).toFixed(0))
      );
      return {
        name: CITY_NAMES[code],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        data,
      };
    });
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15,23,42,0.9)',
        borderWidth: 0,
        textStyle: { color: '#fff', fontSize: 12 },
        valueFormatter: (v: number) => `¥${v.toLocaleString()}`,
      },
      legend: {
        data: CITIES.map((c) => CITY_NAMES[c]),
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 11, color: '#64748B' },
      },
      grid: { left: 40, right: 16, top: 16, bottom: 40 },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#E2E8F0' } },
        axisLabel: { fontSize: 11, color: '#64748B' },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: {
          fontSize: 11,
          color: '#64748B',
          formatter: (v: number) => `¥${v / 1000}k`,
        },
      },
      color: ['#1E40AF', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'],
      series,
    };
  };

  const cityName = CITY_NAMES[currentCity] || '北京';
  const monthlyAmount = stats?.monthlyAmount || 0;
  const personalAmount = Number((monthlyAmount * 0.3).toFixed(2));
  const companyAmount = Number((monthlyAmount - personalAmount).toFixed(2));

  const statCards = [
    {
      title: '参保城市',
      value: cityName,
      suffix: '',
      icon: MapPin,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      sub: '点击切换城市',
      onClick: () => {},
    },
    {
      title: '当前月缴金额',
      value: `¥${monthlyAmount.toLocaleString()}`,
      suffix: '/月',
      icon: Wallet,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      sub: `个人 ¥${personalAmount.toLocaleString()} · 企业 ¥${companyAmount.toLocaleString()}`,
      onClick: () => navigate('/calculator'),
    },
    {
      title: '待办事务数',
      value: stats?.pendingTransactions || 0,
      suffix: '笔',
      icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      sub: '点击查看详情',
      onClick: () => navigate('/transaction'),
    },
    {
      title: '政策预警数',
      value: stats?.pendingTickets || 0,
      suffix: '条',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      sub: '近期政策变更',
      onClick: () => navigate('/policy'),
    },
  ];

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <User size={22} className="text-brand-700" />
            {user?.realName || user?.nickname || '用户'}的工作台
          </h2>
          <p className="text-sm text-slate-500">
            {dayjs().format('YYYY年MM月DD日')} · 欢迎回到社保公积金服务平台
          </p>
        </div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statCards.map((c) => {
            const IconCmp = c.icon;
            return (
              <Col xs={24} sm={12} lg={6} key={c.title}>
                <Card
                  className="!rounded-xl h-full cursor-pointer hover:!shadow-card-hover"
                  styles={{ body: { padding: '20px 22px' } }}
                  onClick={c.onClick}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-slate-500 mb-1.5">{c.title}</p>
                      <p className="text-2xl font-bold text-slate-800 flex items-baseline gap-1">
                        {c.value}
                        <span className="text-sm font-normal text-slate-400">{c.suffix}</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        {c.sub}
                        <ChevronRight size={12} />
                      </p>
                    </div>
                    <div
                      className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}
                    >
                      <IconCmp size={22} className={c.iconColor} />
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>

        <Row gutter={[16, 16]} className="mt-2">
          <Col xs={24} lg={14}>
            <Card
              title={
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Briefcase size={18} className="text-brand-700" />
                  快捷操作
                </span>
              }
              className="!rounded-xl"
              styles={{ body: { padding: '12px 22px 22px' } }}
            >
              <Row gutter={[12, 12]}>
                {quickActions.map((action) => {
                  const Ic = action.icon;
                  return (
                    <Col xs={12} sm={8} key={action.key}>
                      <div
                        onClick={() => navigate(action.path)}
                        className="p-4 rounded-xl border border-slate-100 hover:border-brand-200 hover:bg-brand-50/40 transition-all cursor-pointer group"
                      >
                        <div
                          className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                        >
                          <Ic size={20} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700 mb-0.5">
                          {action.title}
                        </p>
                        <p className="text-xs text-slate-400">{action.desc}</p>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <Clock size={18} className="text-brand-700" />
                  最近办理事务
                </span>
              }
              extra={
                <a
                  className="text-xs text-brand-700 flex items-center gap-0.5 hover:text-brand-800 cursor-pointer"
                  onClick={() => navigate('/transaction')}
                >
                  查看全部 <ChevronRight size={12} />
                </a>
              }
              className="!rounded-xl"
              styles={{ body: { padding: '4px 22px 22px' } }}
            >
              {transactions.length > 0 ? (
                <Timeline
                  mode="left"
                  items={transactions.map((tx) => ({
                    color:
                      tx.status === 'SUCCESS'
                        ? '#059669'
                        : tx.status === 'PROCESSING' ||
                          tx.status === 'AI_REVIEWING' ||
                          tx.status === 'MANUAL_REVIEWING'
                        ? '#1E40AF'
                        : tx.status === 'FAILED' ||
                          tx.status === 'AI_REJECTED' ||
                          tx.status === 'MANUAL_REJECTED'
                        ? '#DC2626'
                        : '#D97706',
                    children: (
                      <div className="py-1">
                        <p className="text-sm font-medium text-slate-700 mb-0.5">
                          {tx.title || TRANSACTION_NAMES[tx.type]}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag
                            color={
                              TRANSACTION_STATUS_COLORS[tx.status] as any
                            }
                            className="!text-xs !px-2 !py-0 !m-0"
                          >
                            {TRANSACTION_STATUS_NAMES[tx.status]}
                          </Tag>
                          <span className="text-xs text-slate-400">
                            {dayjs(tx.submittedAt).format('MM-DD HH:mm')}
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty
                  description="暂无办理事务"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  className="py-6"
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="mt-2">
          <Col xs={24} lg={14}>
            <Card
              title={
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <FileText size={18} className="text-brand-700" />
                  六地最新政策动态
                </span>
              }
              extra={
                <a
                  className="text-xs text-brand-700 flex items-center gap-0.5 hover:text-brand-800 cursor-pointer"
                  onClick={() => navigate('/policy')}
                >
                  政策图谱 <ChevronRight size={12} />
                </a>
              }
              className="!rounded-xl"
              styles={{ body: { padding: '4px 22px 22px' } }}
            >
              <div className="space-y-3 pt-2">
                {policies.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-lg border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-pointer"
                    onClick={() => navigate('/policy')}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-slate-700 leading-snug flex-1 line-clamp-2">
                        {p.title}
                      </p>
                      <Tag
                        color="blue"
                        className="!text-xs !px-2 !py-0 !m-0 shrink-0"
                      >
                        {p.cityName}
                      </Tag>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.tags?.slice(0, 2).map((t) => (
                        <Tag
                          key={t}
                          className="!text-xs !m-0 !bg-slate-100 !text-slate-600 !border-slate-200"
                        >
                          {t}
                        </Tag>
                      ))}
                      <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                        <Calendar size={11} />
                        生效：{dayjs(p.effectiveDate).format('YYYY-MM-DD')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card
              title={
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <TrendingUp size={18} className="text-brand-700" />
                  六地社保月缴趋势
                </span>
              }
              extra={
                <a
                  className="text-xs text-brand-700 flex items-center gap-0.5 hover:text-brand-800 cursor-pointer"
                  onClick={() => navigate('/calculator')}
                >
                  详细测算 <ChevronRight size={12} />
                </a>
              }
              className="!rounded-xl"
              styles={{ body: { padding: '4px 12px 12px' } }}
            >
              <ReactECharts
                option={buildTrendChartOption()}
                style={{ height: 280 }}
                opts={{ renderer: 'svg' }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}

export default Dashboard;
