import { useState, useEffect } from 'react';
import {
  Wallet,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Pill,
  Building2,
  Store,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { accountApi } from '@/services/api';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import type {
  AccountBalance,
  ConsumptionRecord,
  AccountStatistics,
} from '@shared/types';

type TabType = 'all' | 'hospital' | 'pharmacy' | 'drug';

const tabItems: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Wallet className="w-4 h-4" /> },
  { key: 'hospital', label: '医院', icon: <Building2 className="w-4 h-4" /> },
  { key: 'pharmacy', label: '药店', icon: <Store className="w-4 h-4" /> },
  { key: 'drug', label: '药品', icon: <Pill className="w-4 h-4" /> },
];

function AccountPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [records, setRecords] = useState<ConsumptionRecord[]>([]);
  const [statistics, setStatistics] = useState<AccountStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceRes, recordsRes, statsRes] = await Promise.all([
          accountApi.getBalance(),
          accountApi.getRecords({
            page: 1,
            pageSize: 20,
            type: activeTab === 'all' ? undefined : activeTab,
            startDate: dateRange.start || undefined,
            endDate: dateRange.end || undefined,
          }),
          accountApi.getStatistics(),
        ]);
        setBalance(balanceRes.data);
        setRecords(recordsRes.data.list);
        setStatistics(statsRes.data);
      } catch (error) {
        console.error('Failed to fetch account data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, dateRange]);

  const pieOption = statistics
    ? {
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
            data: statistics.categoryData.map((item, index) => ({
              value: item.amount,
              name: item.category,
              itemStyle: {
                color: ['#1677FF', '#00B42A', '#FF7D00', '#722ED1', '#F53F3F'][index % 5],
              },
            })),
          },
        ],
      }
    : {};

  const barOption = statistics
    ? {
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
          data: statistics.monthlyData.map((d) => d.month),
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
            data: statistics.monthlyData.map((d) => d.amount),
            type: 'bar',
            barWidth: '50%',
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#1677FF' },
                  { offset: 1, color: '#4096FF' },
                ],
              },
            },
          },
        ],
      }
    : {};

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="w-5 h-5 text-insurance-500" />;
      case 'pharmacy':
        return <Store className="w-5 h-5 text-medical-500" />;
      case 'drug':
        return <Pill className="w-5 h-5 text-warning-500" />;
      default:
        return <Wallet className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeBg = (type: string) => {
    switch (type) {
      case 'hospital':
        return 'bg-insurance-50';
      case 'pharmacy':
        return 'bg-medical-50';
      case 'drug':
        return 'bg-warning-500/10';
      default:
        return 'bg-slate-50';
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-12 rounded-xl" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
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
        <h1 className="text-2xl font-bold text-slate-900">账户查询</h1>
        <p className="text-slate-500 mt-1">查询您的医保账户余额和消费明细</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">个人账户</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {balance ? formatCurrency(balance.personalAccount) : '¥0.00'}
                </p>
                <div className="flex items-center gap-1 mt-1 text-sm text-medical-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+12.5% 较上月</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">统筹基金</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {balance ? formatCurrency(balance.overallAccount) : '¥0.00'}
                </p>
                <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
                  <ArrowDownRight className="w-4 h-4" />
                  <span>-3.2% 较上月</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">本月消费</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {balance ? formatCurrency(balance.monthlyConsumption) : '¥0.00'}
                </p>
                <div className="flex items-center gap-1 mt-1 text-sm text-warning-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+8.7% 较上月</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">年度累计</p>
                <p className="text-2xl font-bold text-slate-900 font-mono">
                  {balance ? formatCurrency(balance.annualConsumption) : '¥0.00'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  更新于 {balance ? formatDateTime(balance.lastUpdated) : '-'}
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
                placeholder="搜索医院、药店或药品名称..."
                className="input-field pl-12 pr-4"
              />
            </div>

            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-100 overflow-hidden hover:border-insurance-200 transition-colors"
                >
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === record.id ? null : record.id)
                    }
                    className="w-full p-4 flex items-center gap-4 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl ${getTypeBg(
                        record.type
                      )} flex items-center justify-center flex-shrink-0`}
                    >
                      {getTypeIcon(record.type)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">
                          {record.merchantName}
                        </p>
                        <p className="text-lg font-bold text-slate-900 font-mono">
                          -{formatCurrency(record.amount)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span>{formatDate(record.date)}</span>
                          <span className="badge-info">{record.category}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-slate-500">
                            统筹支付 {formatCurrency(record.overallPay)}
                          </span>
                          <span className="text-slate-500">
                            个账支付 {formatCurrency(record.personalPay)}
                          </span>
                          <ChevronDown
                            className={`w-5 h-5 text-slate-400 transition-transform ${
                              expandedId === record.id ? 'rotate-180' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </button>

                  {expandedId === record.id && (
                    <div className="border-t border-slate-100 bg-slate-50 p-4">
                      <h4 className="font-medium text-slate-700 mb-3">消费明细</h4>
                      <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                项目名称
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-slate-600">
                                规格
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">
                                数量
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">
                                单价
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-slate-600">
                                金额
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-slate-600">
                                医保类型
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {record.details.map((item, index) => (
                              <tr key={index} className="hover:bg-white transition-colors">
                                <td className="px-4 py-3 text-sm text-slate-800">
                                  {item.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {item.spec}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 text-center">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 text-right font-mono">
                                  {formatCurrency(item.unitPrice)}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium font-mono">
                                  {formatCurrency(item.amount)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span
                                    className={`badge ${
                                      item.insuranceType === '甲类'
                                        ? 'badge-success'
                                        : item.insuranceType === '乙类'
                                        ? 'badge-warning'
                                        : 'badge'
                                    }`}
                                  >
                                    {item.insuranceType}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">消费分类</h3>
            <ReactECharts option={pieOption} style={{ height: '220px' }} />
            {statistics && (
              <div className="mt-4 space-y-2">
                {statistics.categoryData.map((item, index) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: ['#1677FF', '#00B42A', '#FF7D00', '#722ED1', '#F53F3F'][
                            index % 5
                          ],
                        }}
                      />
                      <span className="text-sm text-slate-600">{item.category}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4">月度趋势</h3>
            <ReactECharts option={barOption} style={{ height: '220px' }} />
          </div>

          <div className="card p-6 bg-gradient-to-br from-insurance-50 to-white">
            <h3 className="section-title mb-4 text-insurance-700">
              <Wallet className="w-5 h-5 inline-block mr-2" />
              账户说明
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                个人账户可用于支付门诊、药店购药费用
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                统筹基金用于支付住院、门诊慢特病等费用
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                甲类药品全额纳入医保支付范围
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-insurance-500 mt-1.5 flex-shrink-0" />
                乙类药品需先自付一定比例后再纳入报销
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
