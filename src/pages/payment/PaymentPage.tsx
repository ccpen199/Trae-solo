import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  Building2,
  Bed,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Wallet,
  Pill,
  Syringe,
  Activity,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import { paymentApi } from '@/services/api';
import { formatCurrency, formatDate, formatDateTime, getStatusText, getStatusColor } from '@/utils/format';
import type { SettlementOrder } from '@shared/types';

type TabType = 'all' | 'outpatient' | 'inpatient';

const tabItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <CreditCard className="w-4 h-4" /> },
  { key: 'outpatient', label: '诊间费用', icon: <Building2 className="w-4 h-4" /> },
  { key: 'inpatient', label: '住院费用', icon: <Bed className="w-4 h-4" /> },
];

function PaymentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [orders, setOrders] = useState<SettlementOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await paymentApi.getOrders();
        setOrders(res.data);
      } catch (error) {
        console.error('Failed to fetch payment orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredOrders = orders.filter((order) => {
    if (activeTab !== 'all' && order.type !== activeTab) return false;
    if (searchKeyword && !order.hospital.includes(searchKeyword)) return false;
    if (dateRange.start && order.createdAt < dateRange.start) return false;
    if (dateRange.end && order.createdAt > dateRange.end + 'T23:59:59') return false;
    return true;
  });

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const paidOrders = orders.filter((o) => o.status === 'paid');

  const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + o.amount.total, 0);
  const totalPaidAmount = paidOrders.reduce((sum, o) => sum + o.amount.total, 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'outpatient':
        return <Building2 className="w-5 h-5 text-insurance-500" />;
      case 'inpatient':
        return <Bed className="w-5 h-5 text-medical-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'outpatient':
        return 'bg-insurance-50';
      case 'inpatient':
        return 'bg-medical-50';
      default:
        return 'bg-slate-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'outpatient':
        return '诊间费用';
      case 'inpatient':
        return '住院费用';
      default:
        return '其他';
    }
  };

  const getInsuranceTags = (order: SettlementOrder) => {
    const tags: string[] = [];
    if (order.amount.overallPay > 0) tags.push('统筹支付');
    if (order.amount.accountPay > 0) tags.push('个账支付');
    const hasInsuranceItems = order.items.some((i) => i.insuranceType !== '丙类');
    if (hasInsuranceItems) tags.push('医保范围内');
    return tags;
  };

  const categoryOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemGap: 12,
      textStyle: { color: '#64748b' },
    },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: [
          { value: totalPaidAmount, name: '已支付', itemStyle: { color: '#00B42A' } },
          { value: totalPendingAmount, name: '待支付', itemStyle: { color: '#FF7D00' } },
        ],
      },
    ],
  };

  const barOption = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}: ¥{c}',
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
      data: ['06/15', '06/16', '06/17', '06/18', '06/19', '06/20', '06/21'],
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
        name: '统筹支付',
        data: [320, 450, 280, 520, 390, 480, 610],
        type: 'bar',
        stack: 'total',
        barWidth: '50%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: '#1677FF',
        },
      },
      {
        name: '个人支付',
        data: [120, 180, 90, 210, 150, 190, 240],
        type: 'bar',
        stack: 'total',
        barWidth: '50%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: '#FF7D00',
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-12 rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="skeleton h-72 rounded-2xl" />
            <div className="skeleton h-72 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">医保支付</h1>
        <p className="text-slate-500 mt-1">查看和结算您的医疗费用账单</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">待结算金额</p>
                <p className="text-2xl font-bold text-warning-600 font-mono">
                  {formatCurrency(totalPendingAmount)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-sm text-warning-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>{pendingOrders.length} 笔待支付</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">已支付金额</p>
                <p className="text-2xl font-bold text-medical-600 font-mono">
                  {formatCurrency(totalPaidAmount)}
                </p>
                <div className="flex items-center gap-1 mt-1 text-sm text-medical-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{paidOrders.length} 笔已完成</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">统筹基金支付</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {formatCurrency(
                    orders.reduce((sum, o) => sum + o.amount.overallPay, 0)
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">医保报销累计</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">个人账户支付</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {formatCurrency(
                    orders.reduce((sum, o) => sum + o.amount.accountPay, 0)
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  更新于 {formatDateTime(new Date())}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                {tabItems.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-item flex items-center gap-2 ${
                      activeTab === tab.key ? 'tab-item-active' : ''
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, start: e.target.value }))
                    }
                    className="input-field py-2 text-sm w-36"
                    placeholder="开始日期"
                  />
                  <span className="text-slate-400">至</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, end: e.target.value }))
                    }
                    className="input-field py-2 text-sm w-36"
                    placeholder="结束日期"
                  />
                </div>
                <button className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="搜索医院名称..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="input-field pl-12 pr-4"
              />
            </div>

            <div className="space-y-3">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-100 overflow-hidden hover:border-insurance-200 transition-colors"
                  >
                    <div
                      onClick={() => navigate(`/payment/${order.id}`)}
                      className="w-full p-4 flex items-center gap-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl ${getTypeBg(
                          order.type
                        )} flex items-center justify-center flex-shrink-0`}
                      >
                        {getTypeIcon(order.type)}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{order.hospital}</p>
                            <span className="badge-info">{getTypeLabel(order.type)}</span>
                          </div>
                          <p className="text-lg font-bold text-slate-900 font-mono">
                            {formatCurrency(order.amount.total)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Pill className="w-4 h-4" />
                              {order.items.length} 项明细
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right text-sm">
                              <div className="flex items-center gap-1 text-slate-500">
                                <Activity className="w-4 h-4 text-insurance-500" />
                                <span>统筹 {formatCurrency(order.amount.overallPay)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500">
                                <Wallet className="w-4 h-4 text-warning-500" />
                                <span>个账 {formatCurrency(order.amount.accountPay)}</span>
                              </div>
                            </div>
                            <span className={getStatusColor(order.status)}>
                              {getStatusText(order.status)}
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {getInsuranceTags(order).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-insurance-50 text-insurance-600"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无符合条件的结算单</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">支付构成</h3>
            <ReactECharts option={categoryOption} style={{ height: '200px' }} />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-medical-500" />
                  <span className="text-sm text-slate-600">已支付</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(totalPaidAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  <span className="text-sm text-slate-600">待支付</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {formatCurrency(totalPendingAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">近7天支付趋势</h3>
            <ReactECharts option={barOption} style={{ height: '200px' }} />
          </div>

          <div className="card p-6 bg-gradient-to-br from-insurance-50 to-white">
            <h3 className="section-title mb-4 text-insurance-700">
              <Syringe className="w-5 h-5 inline-block mr-2" />
              医保政策说明
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                甲类药品全额纳入医保支付范围，报销比例85%
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                乙类药品需先自付10%后再按85%比例报销
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                住院起付线：三级医院1000元，二级医院600元
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                门诊统筹年度最高支付限额为2000元
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
