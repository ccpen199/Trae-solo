import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  Filter,
  ArrowRightLeft,
  Wallet,
  FileText,
  Clock,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Building2,
  User,
  ShieldAlert,
  Eye,
  XCircle,
  ChevronRight,
  Scale,
  Gauge,
  History,
  UserCheck,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import Card from '@/components/ui/Card';
import {
  mockInsuranceRecords,
  mockInsuranceSummaries,
  mockTransferProgress,
} from '@/mock/data';
import {
  formatCurrency,
  getInsuranceTypeName,
  getStatusText,
  getStatusColor,
} from '@/utils/format';
import type { InsuranceType, TransferProgress } from '@/types';

const insuranceColors: Record<InsuranceType, string> = {
  pension: '#165DFF',
  medical: '#0FC6C2',
  unemployment: '#FF7D00',
  injury: '#722ED1',
  maternity: '#F53F3F',
};

const insuranceGradients: Record<InsuranceType, string> = {
  pension: 'from-blue-500 to-blue-600',
  medical: 'from-cyan-500 to-cyan-600',
  unemployment: 'from-orange-500 to-orange-600',
  injury: 'from-violet-500 to-violet-600',
  maternity: 'from-rose-500 to-rose-600',
};

const insuranceIcons: Record<InsuranceType, React.ReactNode> = {
  pension: <CreditCard className="w-5 h-5" />,
  medical: <TrendingUp className="w-5 h-5" />,
  unemployment: <Wallet className="w-5 h-5" />,
  injury: <AlertCircle className="w-5 h-5" />,
  maternity: <FileText className="w-5 h-5" />,
};

const SummaryCards: React.FC = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {mockInsuranceSummaries.map((item, index) => (
        <Card
          key={item.type}
          className="animate-fade-in-up overflow-hidden"
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          <div className={`h-1 bg-gradient-to-r ${insuranceGradients[item.type]}`} />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${insuranceGradients[item.type]} text-white flex items-center justify-center shadow-sm`}
              >
                {insuranceIcons[item.type]}
              </div>
              <span className="text-sm font-medium text-neutral-600">
                {item.typeName}
              </span>
            </div>
            <p className="text-xl font-bold text-neutral-700 mb-1">
              ¥{formatCurrency(item.totalBalance, 0)}
            </p>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>累计 {item.totalMonths} 个月</span>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  item.status === 'normal'
                    ? 'bg-success-500/10 text-success-500'
                    : 'bg-warning-500/10 text-warning-500'
                }`}
              >
                {item.status === 'normal' ? '正常' : '暂停'}
              </span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const PaymentRecordsTab: React.FC = () => {
  const [selectedType, setSelectedType] = useState<InsuranceType | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<string>('2025');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const filteredRecords = useMemo(() => {
    return mockInsuranceRecords.filter((record) => {
      const matchType =
        selectedType === 'all' || record.insuranceType === selectedType;
      const matchYear = record.paymentMonth.startsWith(selectedYear);
      return matchType && matchYear;
    });
  }, [selectedType, selectedYear]);

  const years = ['2025', '2024', '2023', '2022'];
  const typeOptions = [
    { value: 'all', label: '全部险种' },
    { value: 'pension', label: '养老保险' },
    { value: 'medical', label: '医疗保险' },
    { value: 'unemployment', label: '失业保险' },
    { value: 'injury', label: '工伤保险' },
    { value: 'maternity', label: '生育保险' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <button
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown);
              setShowYearDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
          >
            <Filter className="w-4 h-4 text-neutral-400" />
            {selectedType === 'all'
              ? '全部险种'
              : getInsuranceTypeName(selectedType)}
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {showTypeDropdown && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedType(option.value as InsuranceType | 'all');
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                    selectedType === option.value
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-neutral-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowTypeDropdown(false);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:border-primary-300 transition-colors"
          >
            <Calendar className="w-4 h-4 text-neutral-400" />
            {selectedYear}年
            <ChevronDown className="w-4 h-4 text-neutral-400" />
          </button>
          {showYearDropdown && (
            <div className="absolute top-full left-0 mt-1 w-24 bg-white border border-neutral-200 rounded-lg shadow-dropdown z-10 py-1">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => {
                    setSelectedYear(year);
                    setShowYearDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-primary-50 transition-colors ${
                    selectedYear === year
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-neutral-600'
                  }`}
                >
                  {year}年
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-sm text-neutral-400 ml-auto">
          共 {filteredRecords.length} 条记录
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider rounded-l-lg">
                缴费月份
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                险种
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                缴费基数
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                个人缴费
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                单位缴费
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                缴费单位
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider rounded-r-lg">
                状态
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-neutral-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {record.paymentMonth}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: `${insuranceColors[record.insuranceType]}15`,
                      color: insuranceColors[record.insuranceType],
                    }}
                  >
                    {insuranceIcons[record.insuranceType]}
                    {getInsuranceTypeName(record.insuranceType)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  ¥{formatCurrency(record.paymentBase, 0)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  ¥{formatCurrency(record.personalPayment, 2)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-600">
                  ¥{formatCurrency(record.companyPayment, 2)}
                </td>
                <td className="px-4 py-3 text-sm text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-neutral-300" />
                    {record.companyName}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`badge badge-${getStatusColor(record.paymentStatus)}`}
                  >
                    {getStatusText(record.paymentStatus)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BalanceTab: React.FC = () => {
  const balanceData = mockInsuranceSummaries.map((item) => ({
    name: item.typeName,
    个人缴纳: item.personalBalance,
    单位缴纳: item.companyBalance,
    账户总额: item.totalBalance,
  }));

  const monthlyTrendData = Array.from({ length: 12 }, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    const monthRecords = mockInsuranceRecords.filter((r) =>
      r.paymentMonth.endsWith(`-${month}`)
    );
    const totalPersonal = monthRecords.reduce(
      (sum, r) => sum + r.personalPayment,
      0
    );
    const totalCompany = monthRecords.reduce(
      (sum, r) => sum + r.companyPayment,
      0
    );
    return {
      month: `${month}月`,
      个人缴费: Number(totalPersonal.toFixed(2)),
      单位缴费: Number(totalCompany.toFixed(2)),
      合计: Number((totalPersonal + totalCompany).toFixed(2)),
    };
  });

  return (
    <div className="animate-fade-in space-y-6">
      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-700">
              各险种账户余额对比
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              个人缴纳与单位缴纳分布情况
            </p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={balanceData} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" />
              <XAxis dataKey="name" tick={{ fill: '#86909C', fontSize: 12 }} />
              <YAxis tick={{ fill: '#86909C', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E6EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
                formatter={(value: number) => [`¥${formatCurrency(value, 2)}`, '']}
              />
              <Legend />
              <Bar
                dataKey="个人缴纳"
                fill="#165DFF"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="单位缴纳"
                fill="#0FC6C2"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-700">
              近12个月缴费趋势
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              月度缴费金额变化情况
            </p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E6EB" />
              <XAxis dataKey="month" tick={{ fill: '#86909C', fontSize: 12 }} />
              <YAxis tick={{ fill: '#86909C', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E6EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
                formatter={(value: number) => [`¥${formatCurrency(value, 2)}`, '']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="个人缴费"
                stroke="#165DFF"
                strokeWidth={2}
                dot={{ fill: '#165DFF', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="单位缴费"
                stroke="#0FC6C2"
                strokeWidth={2}
                dot={{ fill: '#0FC6C2', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
};

const TransferTab: React.FC = () => {
  const [expandedTransferId, setExpandedTransferId] = useState<string | null>(null);
  const [expandedNodeIdx, setExpandedNodeIdx] = useState<number | null>(null);

  const getStatusIcon = (status: TransferProgress['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success-500" />;
      case 'transferring':
        return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
      case 'reviewing':
        return <Clock className="w-5 h-5 text-warning-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-danger-500" />;
      default:
        return null;
    }
  };

  const getProgressColor = (status: TransferProgress['status']) => {
    switch (status) {
      case 'completed':
        return 'from-success-500 to-success-400';
      case 'transferring':
        return 'from-primary-500 to-primary-400';
      case 'reviewing':
        return 'from-warning-500 to-warning-400';
      case 'failed':
        return 'from-danger-500 to-danger-400';
      default:
        return 'from-primary-500 to-primary-400';
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      {mockTransferProgress.map((transfer, index) => {
        const progressPercent = transfer.nodes
          ? Math.round((transfer.nodes.filter((n) => n.completed).length / transfer.nodes.length) * 100)
          : Math.min(Math.round((transfer.completedDays / transfer.estimatedDays) * 100), 100);
        const isExpanded = expandedTransferId === transfer.id;

        return (
          <Card
            key={transfer.id}
            className="animate-fade-in-up overflow-hidden"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${insuranceGradients[transfer.insuranceType]} text-white flex items-center justify-center`}
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-neutral-700">
                        {getInsuranceTypeName(transfer.insuranceType)}关系转移
                      </h3>
                      <span className={`badge badge-${getStatusColor(transfer.status)}`}>
                        {getStatusText(transfer.status)}
                      </span>
                      {transfer.isOverdue && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-danger-500/10 text-danger-500 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          已超时 {transfer.overdueDays} 天
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">转移单号：{transfer.transferNo}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(transfer.status)}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-neutral-600">{transfer.fromCity}</p>
                  <p className="text-xs text-neutral-400">转出地</p>
                </div>
                <div className="flex items-center gap-1 px-3 py-1 bg-primary-50 rounded-full">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-xs text-primary-500">
                    {transfer.status === 'completed' ? '转移完成' : '转移中'}
                  </span>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-neutral-600">{transfer.toCity}</p>
                  <p className="text-xs text-neutral-400">转入地</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                  <span>办理进度</span>
                  <span>
                    {progressPercent}% · 已用时 {transfer.completedDays}/{transfer.estimatedDays} 个工作日
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${
                      transfer.isOverdue
                        ? 'from-danger-500 to-warning-500'
                        : getProgressColor(transfer.status)
                    } rounded-full transition-all duration-500`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {transfer.nodes && transfer.nodes.length > 0 && (
                <div className="mb-4">
                  <div className="relative pl-6">
                    {transfer.nodes.map((node, nodeIdx) => {
                      const isLast = nodeIdx === transfer.nodes!.length - 1;
                      const isNodeExpanded = expandedNodeIdx === nodeIdx && isExpanded;
                      return (
                        <div key={node.name} className="relative pb-5 last:pb-0">
                          {!isLast && (
                            <div
                              className={`absolute left-[13px] top-6 w-0.5 h-[calc(100%+8px)] ${
                                node.completed ? 'bg-primary-300' : 'bg-neutral-200'
                              }`}
                            />
                          )}
                          <div className="flex items-start gap-3">
                            <div
                              className={`absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                                node.completed
                                  ? 'bg-gradient-to-br from-primary-500 to-primary-400 text-white'
                                  : 'bg-neutral-200 text-neutral-400'
                              }`}
                            >
                              {node.completed ? <CheckCircle2 className="w-4 h-4" /> : nodeIdx + 1}
                            </div>
                            <button
                              onClick={() => {
                                if (transfer.nodes && transfer.nodes.length > 1) {
                                  setExpandedTransferId(
                                    expandedTransferId === transfer.id ? null : transfer.id
                                  );
                                  setExpandedNodeIdx(isNodeExpanded ? null : nodeIdx);
                                }
                              }}
                              className="flex-1 text-left ml-1 group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p
                                    className={`text-sm ${
                                      node.completed
                                        ? 'text-neutral-700 font-medium'
                                        : 'text-neutral-500'
                                    }`}
                                  >
                                    {node.name}
                                  </p>
                                  {node.completedAt && (
                                    <p className="text-xs text-neutral-400 mt-0.5">
                                      完成时间：{node.completedAt}
                                    </p>
                                  )}
                                  {!node.completed && node.promiseTime && (
                                    <p className="text-xs text-warning-500 mt-0.5 inline-flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      承诺完成：{node.promiseTime}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight
                                  className={`w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-transform ${
                                    isNodeExpanded && expandedTransferId === transfer.id
                                      ? 'rotate-90 text-primary-500'
                                      : ''
                                  }`}
                                />
                              </div>

                              {isNodeExpanded && expandedTransferId === transfer.id && (node.handler || node.remark) && (
                                <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100 text-xs space-y-2">
                                  {node.handler && (
                                    <div className="flex items-center gap-2 text-neutral-600">
                                      <User className="w-3.5 h-3.5 text-neutral-400" />
                                      <span className="text-neutral-400 w-16">经办人：</span>
                                      <span className="font-medium">{node.handler}</span>
                                    </div>
                                  )}
                                  {node.handlerDept && (
                                    <div className="flex items-start gap-2 text-neutral-600">
                                      <Building2 className="w-3.5 h-3.5 text-neutral-400 mt-0.5" />
                                      <span className="text-neutral-400 w-16 flex-shrink-0">责任科室：</span>
                                      <span className="font-medium">{node.handlerDept}</span>
                                    </div>
                                  )}
                                  {node.remark && (
                                    <div className="flex items-start gap-2 text-neutral-600">
                                      <FileText className="w-3.5 h-3.5 text-neutral-400 mt-0.5" />
                                      <span className="text-neutral-400 w-16 flex-shrink-0">节点说明：</span>
                                      <span>{node.remark}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {transfer.supervisionRecords && transfer.supervisionRecords.length > 0 && (
                <div className="mb-4 p-4 bg-danger-50/50 rounded-xl border border-danger-100">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-danger-500" />
                    <h4 className="text-sm font-semibold text-danger-600">超时督办记录</h4>
                    <span className="ml-auto text-xs px-2 py-0.5 bg-danger-500/10 text-danger-500 rounded-full">
                      {transfer.supervisionRecords.length} 条
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {transfer.supervisionRecords.map((sup, idx) => (
                      <div
                        key={sup.id}
                        className="bg-white rounded-lg p-3 border border-danger-50 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-danger-600">
                            <Gauge className="w-3.5 h-3.5" />
                            第 {idx + 1} 次督办
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              sup.status === 'resolved'
                                ? 'bg-success-500/10 text-success-600'
                                : sup.status === 'processing'
                                ? 'bg-warning-500/10 text-warning-600'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {sup.status === 'resolved' ? '已处理' : sup.status === 'processing' ? '处理中' : '待处理'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400 mb-1.5">
                          <Clock className="w-3 h-3" />
                          触发时间：{sup.triggeredAt}
                        </div>
                        <div className="flex items-start gap-2 text-neutral-600 mb-1.5">
                          <AlertTriangle className="w-3 h-3 text-warning-500 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-400 w-14 flex-shrink-0">触发原因：</span>
                          <span>{sup.reason}</span>
                        </div>
                        <div className="flex items-start gap-2 text-neutral-600 mb-1.5">
                          <User className="w-3 h-3 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-400 w-14 flex-shrink-0">督办人：</span>
                          <span>
                            {sup.handledBy}（{sup.handleDept}）
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-neutral-600">
                          <FileText className="w-3 h-3 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-400 w-14 flex-shrink-0">处理结果：</span>
                          <span>{sup.result}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {transfer.reviewRecords && transfer.reviewRecords.length > 0 && (
                <div className="mb-4 p-4 bg-primary-50/30 rounded-xl border border-primary-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-primary-500" />
                    <h4 className="text-sm font-semibold text-primary-600">复查记录</h4>
                    <span className="ml-auto text-xs px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded-full">
                      {transfer.reviewRecords.length} 条
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {transfer.reviewRecords.map((rev) => (
                      <div
                        key={rev.id}
                        className="bg-white rounded-lg p-3 border border-primary-50 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-neutral-600">
                            <UserCheck className="w-3.5 h-3.5 text-primary-500" />
                            <span className="font-medium">{rev.reviewedBy}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full ${
                              rev.reviewResult === 'pass'
                                ? 'bg-success-500/10 text-success-600'
                                : 'bg-warning-500/10 text-warning-600'
                            }`}
                          >
                            {rev.reviewResult === 'pass' ? '通过' : '需重核'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-400 mb-1.5">
                          <Clock className="w-3 h-3" />
                          复查时间：{rev.reviewedAt}
                        </div>
                        <div className="flex items-start gap-2 text-neutral-600">
                          <FileText className="w-3 h-3 text-neutral-400 mt-0.5 flex-shrink-0" />
                          <span className="text-neutral-400 w-14 flex-shrink-0">复查意见：</span>
                          <span>{rev.remark}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-neutral-100">
                <div className="flex items-center justify-between text-xs">
                  <div className="text-neutral-400">申请日期：{transfer.applyDate}</div>
                  <div className="text-neutral-400">
                    承诺 <span className="font-medium text-neutral-600">{transfer.estimatedDays}</span> 个工作日办结
                  </div>
                </div>
                {transfer.remark && (
                  <p className="text-xs text-neutral-500 mt-2 bg-neutral-50 rounded-lg p-2.5">
                    <span className="text-primary-500 font-medium">备注：</span>
                    {transfer.remark}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const SocialInsurance: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'balance' | 'transfer'>(
    'records'
  );

  const tabs = [
    { key: 'records' as const, label: '缴费明细', icon: FileText },
    { key: 'balance' as const, label: '账户余额', icon: Wallet },
    { key: 'transfer' as const, label: '关系转移', icon: ArrowRightLeft },
  ];

  const totalBalance = mockInsuranceSummaries.reduce(
    (sum, item) => sum + item.totalBalance,
    0
  );
  const totalMonths = Math.max(
    ...mockInsuranceSummaries.map((item) => item.totalMonths)
  );

  return (
    <div className="min-h-screen bg-neutral-50 pb-8">
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">社保查询</h1>
                <p className="text-sm text-white/70">五险一金 · 权益记录 · 关系转移</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-white/70 text-sm mb-1">账户总余额</p>
                <p className="text-2xl font-bold">¥{formatCurrency(totalBalance, 0)}</p>
                <p className="text-xs text-white/60 mt-1">
                  累计缴费 {totalMonths} 个月
                </p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/20">
                <p className="text-white/70 text-sm mb-1">参保状态</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-success-400 rounded-full animate-pulse" />
                  正常参保
                </p>
                <p className="text-xs text-white/60 mt-1">
                  最后缴费：{mockInsuranceSummaries[0].lastPaymentMonth}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-4 relative z-10">
        <SummaryCards />

        <Card padding="none">
          <div className="flex border-b border-neutral-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-all relative ${
                  activeTab === tab.key
                    ? 'text-primary-500'
                    : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'records' && <PaymentRecordsTab />}
            {activeTab === 'balance' && <BalanceTab />}
            {activeTab === 'transfer' && <TransferTab />}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SocialInsurance;
