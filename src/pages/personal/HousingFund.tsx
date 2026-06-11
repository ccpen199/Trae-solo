import React, { useState, useMemo } from 'react';
import {
  Landmark,
  TrendingUp,
  Calendar,
  PiggyBank,
  DollarSign,
  Percent,
  FileText,
  Calculator,
  Printer,
  ArrowRight,
  ChevronDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Home,
  Building2,
  Wrench,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  mockHousingFund,
  mockHousingFundDepositRecords,
  mockHousingFundLoan,
  mockRepaymentPlans,
  mockHousingFundWithdraws,
} from '@/mock/data';
import { formatCurrency, formatDate, formatPercent, getStatusText, getStatusColor } from '@/utils/format';

type TabType = 'deposit' | 'loan' | 'withdraw';

const HousingFund: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('deposit');
  const [yearFilter, setYearFilter] = useState('2025');

  const tabs = [
    { key: 'deposit', label: '缴存明细' },
    { key: 'loan', label: '贷款信息' },
    { key: 'withdraw', label: '提取记录' },
  ];

  const chartData = useMemo(() => {
    return [...mockHousingFundDepositRecords].reverse().map((record) => ({
      month: record.month.slice(5) + '月',
      个人缴存: record.personalDeposit,
      单位缴存: record.companyDeposit,
      合计: record.totalDeposit,
    }));
  }, []);

  const pieData = useMemo(() => {
    const paid = mockHousingFundLoan.paidPrincipal;
    const remaining = mockHousingFundLoan.remainingPrincipal;
    return [
      { name: '已还本金', value: paid },
      { name: '剩余本金', value: remaining },
    ];
  }, []);

  const COLORS = ['#10B981', '#E5E7EB'];

  const quickActions = [
    { icon: PiggyBank, label: '提取申请', color: 'from-emerald-500 to-emerald-600' },
    { icon: Calculator, label: '贷款计算器', color: 'from-blue-500 to-blue-600' },
    { icon: Printer, label: '缴存证明打印', color: 'from-cyan-500 to-cyan-600' },
  ];

  const getWithdrawIcon = (type: string) => {
    if (type.includes('购房')) return Home;
    if (type.includes('租房')) return Building2;
    if (type.includes('装修')) return Wrench;
    return FileText;
  };

  const getStatusBadgeClass = (status: string) => {
    const colorMap: Record<string, string> = {
      paid: 'bg-success-500/10 text-success-500',
      unpaid: 'bg-warning-500/10 text-warning-500',
      pending: 'bg-warning-500/10 text-warning-500',
      approved: 'bg-primary-500/10 text-primary-500',
      rejected: 'bg-danger-500/10 text-danger-500',
      completed: 'bg-success-500/10 text-success-500',
      normal: 'bg-success-500/10 text-success-500',
      paid_off: 'bg-success-500/10 text-success-500',
      overdue: 'bg-danger-500/10 text-danger-500',
    };
    return colorMap[status] || 'bg-neutral-100 text-neutral-500';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed' || status === 'paid' || status === 'approved' || status === 'paid_off') {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (status === 'rejected') {
      return <XCircle className="w-4 h-4" />;
    }
    if (status === 'pending' || status === 'normal') {
      return <Clock className="w-4 h-4" />;
    }
    if (status === 'overdue') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <Clock className="w-4 h-4" />;
  };

  return (
    <div className="animate-fade-in min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 text-white pb-20">
        <div className="container mx-auto px-4 pt-6">
          <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">住房公积金</h1>
              <p className="text-sm text-white/70">账户管理 · 缴存 · 贷款 · 提取</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">账户余额</span>
              </div>
              <p className="text-2xl font-bold">¥{formatCurrency(mockHousingFund.balance, 0)}</p>
              <p className="text-xs text-white/60 mt-1">截至 {mockHousingFund.lastDepositMonth}</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">月缴存额</span>
              </div>
              <p className="text-2xl font-bold">¥{formatCurrency(mockHousingFund.monthlyDeposit, 0)}</p>
              <p className="text-xs text-white/60 mt-1">个人+单位</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">累计缴存</span>
              </div>
              <p className="text-2xl font-bold">{mockHousingFund.totalMonths}<span className="text-sm font-normal">个月</span></p>
              <p className="text-xs text-white/60 mt-1">连续缴存</p>
            </div>

            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-white/70" />
                <span className="text-xs text-white/70">缴存比例</span>
              </div>
              <p className="text-2xl font-bold">{formatPercent(mockHousingFund.depositRatio, 0)}</p>
              <p className="text-xs text-white/60 mt-1">个人{mockHousingFund.depositRatio}%+单位{mockHousingFund.depositRatio}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-14 relative z-10">
        <Card className="mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-600">快捷操作</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={action.label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-emerald-50 transition-all duration-200 group"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-neutral-600 group-hover:text-emerald-600 transition-colors">
                  {action.label}
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-500 transition-colors" />
              </button>
            ))}
          </div>
        </Card>

        <Card padding="none" className="animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="border-b border-neutral-100">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as TabType)}
                  className={`flex-1 py-4 px-6 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-emerald-600'
                      : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'deposit' && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-neutral-600">缴存明细</h3>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-neutral-50 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors">
                    <Calendar className="w-4 h-4" />
                    {yearFilter}年
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-medium text-neutral-500 mb-3">近12个月缴存趋势</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#86909C' }} axisLine={{ stroke: '#E5E6EB' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #E5E6EB',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        }}
                        formatter={(value: number) => [`¥${formatCurrency(value)}`, '']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="个人缴存"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="单位缴存"
                        stroke="#0EA5E9"
                        strokeWidth={2}
                        dot={{ fill: '#0EA5E9', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="合计"
                        stroke="#165DFF"
                        strokeWidth={2}
                        dot={{ fill: '#165DFF', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">月份</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">缴存基数</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">个人缴存</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">单位缴存</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">合计</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockHousingFundDepositRecords.map((record, index) => (
                      <tr
                        key={record.id}
                        className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <td className="py-3 px-4 text-sm text-neutral-600">{record.month}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">¥{formatCurrency(record.depositBase, 0)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">¥{formatCurrency(record.personalDeposit, 0)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">¥{formatCurrency(record.companyDeposit, 0)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-emerald-600">¥{formatCurrency(record.totalDeposit, 0)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {getStatusText(record.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'loan' && (
            <div className="p-5">
              <h3 className="font-semibold text-neutral-600 mb-5">贷款信息</h3>

              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100">
                  <p className="text-xs text-neutral-400 mb-1">贷款总额</p>
                  <p className="text-xl font-bold text-neutral-600">¥{formatCurrency(mockHousingFundLoan.loanAmount, 0)}</p>
                  <p className="text-xs text-neutral-400 mt-1">贷款期限 {mockHousingFundLoan.loanTerm} 期</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-neutral-400 mb-1">已还本金</p>
                  <p className="text-xl font-bold text-emerald-600">¥{formatCurrency(mockHousingFundLoan.paidPrincipal, 0)}</p>
                  <p className="text-xs text-neutral-400 mt-1">已还 {mockHousingFundLoan.loanTerm - mockHousingFundLoan.remainingMonths} 期</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl p-4 border border-amber-100">
                  <p className="text-xs text-neutral-400 mb-1">剩余本金</p>
                  <p className="text-xl font-bold text-amber-600">¥{formatCurrency(mockHousingFundLoan.remainingPrincipal, 0)}</p>
                  <p className="text-xs text-neutral-400 mt-1">剩余 {mockHousingFundLoan.remainingMonths} 期</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
                  <p className="text-xs text-neutral-400 mb-1">贷款利率</p>
                  <p className="text-xl font-bold text-purple-600">{formatPercent(mockHousingFundLoan.interestRate, 1)}</p>
                  <p className="text-xs text-neutral-400 mt-1">年利率</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-neutral-50 rounded-xl p-5">
                  <h4 className="text-sm font-medium text-neutral-600 mb-4">还款进度</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`¥${formatCurrency(value)}`, '']}
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #E5E6EB',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-5">
                  <h4 className="text-sm font-medium text-neutral-600 mb-4">贷款详情</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-sm text-neutral-400">贷款合同号</span>
                      <span className="text-sm text-neutral-600 font-medium">{mockHousingFundLoan.loanNo}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-sm text-neutral-400">放款日期</span>
                      <span className="text-sm text-neutral-600">{formatDate(mockHousingFundLoan.startDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-sm text-neutral-400">到期日期</span>
                      <span className="text-sm text-neutral-600">{formatDate(mockHousingFundLoan.endDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-neutral-100">
                      <span className="text-sm text-neutral-400">月还款额</span>
                      <span className="text-sm text-emerald-600 font-medium">¥{formatCurrency(mockHousingFundLoan.monthlyPayment, 2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-neutral-400">贷款状态</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(mockHousingFundLoan.status)}`}>
                        {getStatusIcon(mockHousingFundLoan.status)}
                        {getStatusText(mockHousingFundLoan.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="text-sm font-medium text-neutral-600 mb-3">还款计划（近12期）</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">期数</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">应还日期</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">本金</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">利息</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">月还款额</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">剩余本金</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRepaymentPlans.map((plan) => (
                      <tr key={plan.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-neutral-600">第{plan.period}期</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">{formatDate(plan.dueDate)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">¥{formatCurrency(plan.principal, 2)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-600">¥{formatCurrency(plan.interest, 2)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-neutral-600">¥{formatCurrency(plan.monthlyPayment, 2)}</td>
                        <td className="py-3 px-4 text-sm text-neutral-500">¥{formatCurrency(plan.remainingPrincipal, 0)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(plan.status)}`}>
                            {getStatusIcon(plan.status)}
                            {getStatusText(plan.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-neutral-600">提取记录</h3>
                <Button variant="secondary" size="sm" icon={<PiggyBank className="w-4 h-4" />}>
                  申请提取
                </Button>
              </div>

              <div className="space-y-4">
                {mockHousingFundWithdraws.map((record, index) => {
                  const IconComponent = getWithdrawIcon(record.withdrawType);
                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-4 bg-neutral-50 rounded-xl hover:bg-emerald-50/50 transition-colors cursor-pointer animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        record.withdrawType.includes('购房') ? 'bg-blue-100 text-blue-500' :
                        record.withdrawType.includes('租房') ? 'bg-amber-100 text-amber-500' :
                        record.withdrawType.includes('装修') ? 'bg-purple-100 text-purple-500' :
                        'bg-neutral-100 text-neutral-500'
                      }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-neutral-600">{record.withdrawType}</h4>
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(record.status)}`}>
                            {getStatusIcon(record.status)}
                            {getStatusText(record.status)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 mb-1">
                          提取单号：{record.withdrawNo}
                        </p>
                        {record.remark && (
                          <p className="text-xs text-neutral-400 line-clamp-1">{record.remark}</p>
                        )}
                        <p className="text-xs text-neutral-300 mt-1">
                          {formatDate(record.withdrawTime, 'YYYY-MM-DD HH:mm')}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-emerald-600">¥{formatCurrency(record.withdrawAmount, 0)}</p>
                        <p className="text-xs text-neutral-400">提取金额</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HousingFund;
