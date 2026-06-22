import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  FileText,
  HeartPulse,
  Calendar,
  CreditCard,
  MapPin,
  Bell,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { accountApi, registrationApi } from '@/services/api';
import { formatCurrency, formatRelativeTime } from '@/utils/format';
import type { AccountBalance, Appointment } from '@shared/types';

interface QuickAction {
  path: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    path: '/account',
    label: '账户查询',
    icon: <Wallet className="w-7 h-7" />,
    color: 'text-insurance-600',
    bgColor: 'bg-insurance-50',
  },
  {
    path: '/medical',
    label: '就诊记录',
    icon: <FileText className="w-7 h-7" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    path: '/chronic',
    label: '慢特病认定',
    icon: <HeartPulse className="w-7 h-7" />,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    path: '/registration',
    label: '挂号预约',
    icon: <Calendar className="w-7 h-7" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    path: '/payment',
    label: '医保支付',
    icon: <CreditCard className="w-7 h-7" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    path: '/navigation',
    label: '医院导航',
    icon: <MapPin className="w-7 h-7" />,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
];

const policyNews = [
  {
    id: 1,
    title: '关于调整2024年度医保报销比例的通知',
    date: '2024-01-15',
    area: '南京市',
  },
  {
    id: 2,
    title: '门诊慢特病病种范围扩大至52种',
    date: '2024-01-10',
    area: '江苏省',
  },
  {
    id: 3,
    title: '异地就医直接结算覆盖范围进一步扩大',
    date: '2024-01-08',
    area: '江苏省',
  },
];

function HomePage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePolicyIndex, setActivePolicyIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, appointmentsRes] = await Promise.all([
          accountApi.getBalance(),
          registrationApi.getAppointments(),
        ]);
        setBalance(balanceRes.data);
        setAppointments(appointmentsRes.data);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePolicyIndex((prev) => (prev + 1) % policyNews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const trendChartOption = {
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月'],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
      axisLabel: { color: '#94a3b8', fontSize: 11 },
    },
    series: [
      {
        data: [320, 450, 380, 520, 460, 580],
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#1677FF', width: 3 },
        itemStyle: { color: '#1677FF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.02)' },
            ],
          },
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="skeleton h-64 rounded-2xl" />
            <div className="skeleton h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-gradient-to-r from-insurance-500 to-insurance-600 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-insurance-100">个人账户余额</h2>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-bold font-mono">
                      {balance ? formatCurrency(balance.personalAccount) : '¥0.00'}
                    </span>
                    <button className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                  <QrCode className="w-10 h-10" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-insurance-100 text-sm">统筹基金</p>
                  <p className="text-2xl font-bold font-mono mt-1">
                    {balance ? formatCurrency(balance.overallAccount) : '¥0.00'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-insurance-100 text-sm">本月消费</p>
                  <p className="text-2xl font-bold font-mono mt-1 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-medical-300" />
                    {balance ? formatCurrency(balance.monthlyConsumption) : '¥0.00'}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                  <p className="text-insurance-100 text-sm">年度累计</p>
                  <p className="text-2xl font-bold font-mono mt-1 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-rose-300" />
                    {balance ? formatCurrency(balance.annualConsumption) : '¥0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="section-title mb-0">快捷功能</h3>
              <button
                onClick={() => navigate('/notification')}
                className="text-sm text-insurance-600 hover:text-insurance-700 flex items-center gap-1"
              >
                全部服务 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="group p-6 rounded-xl transition-all duration-200 hover:-translate-y-1"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl ${action.bgColor} ${action.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                  >
                    {action.icon}
                  </div>
                  <p className="font-medium text-slate-700 text-center">{action.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="section-title mb-0">消费趋势</h3>
              <div className="flex gap-2">
                {['近6个月', '近12个月', '近3年'].map((item, index) => (
                  <button
                    key={item}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      index === 0
                        ? 'bg-insurance-100 text-insurance-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <ReactECharts option={trendChartOption} style={{ height: '240px' }} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">
                <Bell className="w-5 h-5 inline-block mr-2 text-warning-500" />
                政策推送
              </h3>
            </div>
            <div className="overflow-hidden rounded-xl bg-gradient-to-r from-insurance-50 to-transparent border border-insurance-100">
              <div className="p-4 transition-all duration-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-info">
                    {policyNews[activePolicyIndex].area}
                  </span>
                  <span className="text-xs text-slate-400">
                    {policyNews[activePolicyIndex].date}
                  </span>
                </div>
                <p className="font-medium text-slate-800 leading-relaxed">
                  {policyNews[activePolicyIndex].title}
                </p>
              </div>
              <div className="flex justify-center gap-1.5 pb-3">
                {policyNews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActivePolicyIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activePolicyIndex
                        ? 'bg-insurance-500 w-6'
                        : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">
                <Calendar className="w-5 h-5 inline-block mr-2 text-insurance-500" />
                近期预约
              </h3>
              <button
                onClick={() => navigate('/registration')}
                className="text-sm text-insurance-600 hover:text-insurance-700"
              >
                查看全部
              </button>
            </div>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/registration')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900">{apt.hospital}</p>
                        <p className="text-sm text-slate-500">
                          {apt.department} · {apt.doctor}
                        </p>
                      </div>
                      <span className={getStatusColor(apt.status)}>
                        {getStatusText(apt.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {apt.date} {apt.timeSlot}
                      </span>
                      <span className="text-slate-400">
                        {formatRelativeTime(apt.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无预约记录</p>
                <button
                  onClick={() => navigate('/registration')}
                  className="mt-3 btn-primary py-2 px-4 text-sm"
                >
                  立即预约
                </button>
              </div>
            )}
          </div>

          <div className="card p-6 bg-gradient-to-br from-medical-50 to-transparent border-medical-100">
            <h3 className="section-title mb-4 text-medical-700">
              <HeartPulse className="w-5 h-5 inline-block mr-2" />
              医保待遇状态
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-medical-100 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-medical-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <p className="font-semibold text-lg text-slate-900">正常参保</p>
                <p className="text-sm text-slate-500">职工基本医疗保险</p>
                <p className="text-sm text-medical-600 mt-1">待遇享受正常</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    confirmed: '已确认',
    pending: '待确认',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || status;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    confirmed: 'badge-info',
    pending: 'badge-warning',
    completed: 'badge-success',
    cancelled: 'badge',
  };
  return map[status] || 'badge-info';
}

export default HomePage;
