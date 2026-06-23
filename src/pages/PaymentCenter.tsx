import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Smartphone, Flame, Calendar, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Receipt, TrendingUp, Zap, Building2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';

interface BillTier {
  tier: number;
  rangeStart: number;
  rangeEnd: number | null;
  unitPrice: number;
  consumption: number;
  amount: number;
}

interface Bill {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  consumption: number;
  tiers: BillTier[];
  total_amount: number;
  status: 'unpaid' | 'paid' | 'overdue';
  paid_date: string | null;
  payment_method: string | null;
}

type PaymentMethod = 'wechat' | 'alipay' | 'bank';

const paymentMethodLabels: Record<PaymentMethod, { name: string; icon: typeof Wallet; color: string }> = {
  wechat: { name: '微信支付', icon: Wallet, color: 'text-green-500' },
  alipay: { name: '支付宝', icon: Smartphone, color: 'text-blue-500' },
  bank: { name: '银行卡', icon: CreditCard, color: 'text-purple-500' },
};

export default function PaymentCenter() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('wechat');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const pageSize = 5;

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/bills?userId=user-1&pageSize=20');
      const result = await response.json();
      if (result.success) {
        setBills(result.data.list);
      }
    } catch (error) {
      console.error('获取账单失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBill = bills.find(b => b.status === 'unpaid' || b.status === 'overdue') || bills[0];

  const handlePay = (billId: string) => {
    setPayingBillId(billId);
    setShowPaymentModal(true);
  };

  const confirmPayment = async () => {
    if (!payingBillId) return;
    setIsPaying(true);
    try {
      const response = await fetch(`/api/bills/${payingBillId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method: selectedPaymentMethod,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setShowPaymentModal(false);
        setPayingBillId(null);
        fetchBills();
      }
    } catch (error) {
      console.error('支付失败:', error);
    } finally {
      setIsPaying(false);
    }
  };

  const paginatedBills = bills.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(bills.length / pageSize);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { variant: 'success' as const, label: '已缴费' };
      case 'unpaid':
        return { variant: 'warning' as const, label: '待缴费' };
      case 'overdue':
        return { variant: 'danger' as const, label: '已逾期' };
      default:
        return { variant: 'default' as const, label: status };
    }
  };

  const formatPeriod = (start: string, _end: string) => {
    const startDate = new Date(start);
    return `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`;
  };

  const chartData = bills.slice(0, 12).reverse().map(bill => ({
    name: `${new Date(bill.period_start).getMonth() + 1}月`,
    用气量: bill.consumption,
    费用: bill.total_amount,
  }));

  const totalUnpaid = bills
    .filter(b => b.status === 'unpaid' || b.status === 'overdue')
    .reduce((sum, b) => sum + b.total_amount, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">缴费中心</h1>
          <p className="mt-1 text-sm text-gray-500">
            在线缴纳燃气费用，支持多种支付方式，安全便捷
          </p>
        </div>

        {currentBill && (
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-3xl p-8 text-white shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-6 h-6 text-accent-400" />
                    <span className="text-lg font-semibold">当前账单</span>
                  </div>
                  <p className="text-primary-100 text-sm">
                    {formatPeriod(currentBill.period_start, currentBill.period_end)}
                  </p>
                </div>
                <StatusBadge
                  variant={currentBill.status === 'paid' ? 'success' : currentBill.status === 'overdue' ? 'danger' : 'warning'}
                  icon
                >
                  {getStatusConfig(currentBill.status).label}
                </StatusBadge>
              </div>

              <div className="flex items-end gap-3 mb-8">
                <span className="text-lg text-primary-100">¥</span>
                <span className="text-5xl font-bold tracking-tight">
                  {currentBill.total_amount.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-primary-200 text-xs mb-1">用气量</p>
                  <p className="text-xl font-semibold">{currentBill.consumption} m³</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-primary-200 text-xs mb-1">账单周期</p>
                  <p className="text-sm font-medium">
                    {currentBill.period_start}
                    <br />
                    至 {currentBill.period_end}
                  </p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <p className="text-primary-200 text-xs mb-1">户号</p>
                  <p className="text-sm font-medium">BJ202400001</p>
                </div>
              </div>

              {currentBill.status !== 'paid' && (
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                    <p className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent-400" />
                      阶梯计价明细
                    </p>
                    <div className="space-y-3">
                      {currentBill.tiers.map((tier, index) => {
                        const tierMax = tier.rangeEnd !== null ? tier.rangeEnd - tier.rangeStart : currentBill.consumption;
                        const percentage = Math.min(100, (tier.consumption / tierMax) * 100);
                        return (
                          <div key={index}>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="text-primary-100">
                                第{tier.tier}档 
                                {tier.rangeEnd !== null 
                                  ? `（${tier.rangeStart}-${tier.rangeEnd}m³）` 
                                  : `（${tier.rangeStart}m³以上）`}
                              </span>
                              <span className="font-medium">¥{tier.amount.toFixed(2)}</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  index === 0 ? 'bg-green-400' : index === 1 ? 'bg-yellow-400' : 'bg-accent-400'
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-primary-200 mt-1">
                              <span>{tier.consumption.toFixed(1)} m³</span>
                              <span>¥{tier.unitPrice}/m³</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full bg-accent-500 hover:bg-accent-600 text-white rounded-2xl h-14 text-lg font-semibold shadow-lg shadow-accent-500/30 hover:shadow-accent-500/40 transition-all"
                    onClick={() => handlePay(currentBill.id)}
                    icon={Flame}
                  >
                    立即缴费
                  </Button>
                </div>
              )}

              {currentBill.status === 'paid' && currentBill.paid_date && (
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="font-medium">已缴费</p>
                    <p className="text-sm text-primary-200">
                      缴费日期：{currentBill.paid_date}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary-600" />
                缴费历史
              </h2>
              <span className="text-sm text-gray-500">共 {bills.length} 条</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
                <p className="mt-3 text-sm text-gray-500">加载中...</p>
              </div>
            ) : bills.length === 0 ? (
              <div className="py-12 text-center">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">暂无账单记录</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">月份</th>
                        <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">账单金额</th>
                        <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">缴费金额</th>
                        <th className="text-center py-3 px-3 text-xs font-medium text-gray-500">状态</th>
                        <th className="text-center py-3 px-3 text-xs font-medium text-gray-500">缴费日期</th>
                        <th className="text-center py-3 px-3 text-xs font-medium text-gray-500">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBills.map((bill) => {
                        const statusConfig = getStatusConfig(bill.status);
                        return (
                          <tr
                            key={bill.id}
                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                          >
                            <td className="py-4 px-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  {formatPeriod(bill.period_start, bill.period_end)}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <span className="text-sm text-gray-900 font-medium">
                                ¥{bill.total_amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <span className={cn(
                                'text-sm font-medium',
                                bill.status === 'paid' ? 'text-green-600' : 'text-gray-400'
                              )}>
                                {bill.status === 'paid' ? `¥${bill.total_amount.toFixed(2)}` : '-'}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-center">
                              <StatusBadge variant={statusConfig.variant} icon>
                                {statusConfig.label}
                              </StatusBadge>
                            </td>
                            <td className="py-4 px-3 text-center">
                              <span className="text-sm text-gray-500">
                                {bill.paid_date || '-'}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-center">
                              {bill.status !== 'paid' ? (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => handlePay(bill.id)}
                                >
                                  去缴费
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-3 text-xs text-gray-500"
                                >
                                  查看详情
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      第 {currentPage}/{totalPages} 页
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                            currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                费用概览
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">已缴费</p>
                      <p className="text-xs text-gray-400">本期账单</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {bills.filter(b => b.status === 'paid').length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">待缴费</p>
                      <p className="text-xs text-gray-400">需尽快处理</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-amber-600">
                    {bills.filter(b => b.status === 'unpaid' || b.status === 'overdue').length}
                  </span>
                </div>
                {totalUnpaid > 0 && (
                  <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                    <p className="text-sm text-gray-600 mb-1">待缴总金额</p>
                    <p className="text-2xl font-bold text-primary-600">
                      ¥{totalUnpaid.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                服务网点
              </h3>
              <div className="space-y-3">
                {[
                  { name: '朝阳燃气服务中心', address: '朝阳区建国路88号', time: '08:30-18:00' },
                  { name: '海淀燃气服务站', address: '海淀区中关村大街27号', time: '09:00-17:30' },
                ].map((station, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer"
                  >
                    <p className="text-sm font-medium text-gray-900">{station.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{station.address}</p>
                    <p className="text-xs text-primary-600 mt-1">{station.time}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            年度用量统计
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: '用气量(m³)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af', fontSize: 12 } }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  label={{ value: '费用(元)', angle: 90, position: 'insideRight', style: { fill: '#9ca3af', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend 
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar 
                  yAxisId="left"
                  dataKey="用气量" 
                  fill="#0052CC" 
                  radius={[6, 6, 0, 0]}
                  name="用气量 (m³)"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="费用" 
                  fill="#FF6B35" 
                  radius={[6, 6, 0, 0]}
                  name="费用 (元)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            温馨提示
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-xl">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">多种支付方式</h4>
              <p className="text-xs text-gray-500">支持微信、支付宝、银行卡等多种支付方式，安全便捷</p>
            </div>
            <div className="p-4 bg-green-50/50 rounded-xl">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">即时到账</h4>
              <p className="text-xs text-gray-500">缴费成功后实时更新状态，无需等待，安心用气</p>
            </div>
            <div className="p-4 bg-amber-50/50 rounded-xl">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">及时缴费</h4>
              <p className="text-xs text-gray-500">请在缴费期限内完成缴费，逾期可能产生滞纳金</p>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl transform transition-all">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              选择支付方式
            </h3>

            <div className="space-y-3 mb-6">
              {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => {
                const config = paymentMethodLabels[method];
                const Icon = config.icon;
                return (
                  <button
                    key={method}
                    onClick={() => setSelectedPaymentMethod(method)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
                      selectedPaymentMethod === method
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      method === 'wechat' ? 'bg-green-100' :
                      method === 'alipay' ? 'bg-blue-100' :
                      'bg-purple-100'
                    )}>
                      <Icon className={cn('w-6 h-6', config.color)} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{config.name}</p>
                      <p className="text-xs text-gray-500">推荐使用，安全便捷</p>
                    </div>
                    {selectedPaymentMethod === method && (
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">支付金额</span>
                <span className="text-2xl font-bold text-primary-600">
                  ¥{currentBill?.total_amount.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => setShowPaymentModal(false)}
                disabled={isPaying}
              >
                取消
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-accent-500 hover:bg-accent-600 text-white"
                onClick={confirmPayment}
                loading={isPaying}
              >
                确认支付
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
