import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Bed,
  Clock,
  Wallet,
  CreditCard,
  Smartphone,
  CheckCircle2,
  FileText,
  Download,
  Receipt,
  AlertCircle,
  Loader2,
  PartyPopper,
  Shield,
  Calculator,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentApi } from '@/services/api';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import type { SettlementOrder, PaymentRequest } from '@shared/types';

type PaymentMethod = 'account' | 'wechat' | 'alipay' | 'mixed';
type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

interface PaymentStep {
  title: string;
  status: 'pending' | 'active' | 'completed';
}

function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SettlementOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mixed');
  const [useAccount, setUseAccount] = useState(true);
  const [additionalMethod, setAdditionalMethod] = useState<'wechat' | 'alipay' | 'none'>('wechat');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedItems, setExpandedItems] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const res = await paymentApi.getOrderDetail(id);
        setOrder(res.data);
      } catch (error) {
        console.error('Failed to fetch order detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const paymentSteps: PaymentStep[] = [
    { title: '确认订单', status: paymentProgress >= 0 ? 'completed' : 'pending' },
    { title: '医保核算', status: paymentProgress >= 25 ? 'completed' : paymentProgress > 0 ? 'active' : 'pending' },
    { title: '支付处理', status: paymentProgress >= 60 ? 'completed' : paymentProgress > 25 ? 'active' : 'pending' },
    { title: '电子票据', status: paymentProgress >= 100 ? 'completed' : paymentProgress > 60 ? 'active' : 'pending' },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'outpatient':
        return <Building2 className="w-6 h-6 text-insurance-500" />;
      case 'inpatient':
        return <Bed className="w-6 h-6 text-medical-500" />;
      default:
        return <Receipt className="w-6 h-6 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'outpatient':
        return '诊间费用';
      case 'inpatient':
        return '住院费用';
      default:
        return '其他费用';
    }
  };

  const costBreakdownOption = order
    ? {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: ¥{c} ({d}%)',
        },
        legend: {
          orient: 'horizontal',
          bottom: '0',
          itemGap: 16,
          textStyle: { color: '#64748b', fontSize: 11 },
        },
        series: [
          {
            type: 'pie',
            radius: ['50%', '75%'],
            center: ['50%', '40%'],
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
              {
                value: order.amount.overallPay,
                name: '统筹支付',
                itemStyle: { color: '#1677FF' },
              },
              {
                value: order.amount.accountPay,
                name: '个账支付',
                itemStyle: { color: '#00B42A' },
              },
              {
                value: order.amount.selfPay,
                name: '自费',
                itemStyle: { color: '#FF7D00' },
              },
            ],
          },
        ],
      }
    : {};

  const calculatePaymentAmount = () => {
    if (!order) return { account: 0, additional: 0, total: 0 };
    const totalSelfPay = order.amount.accountPay + order.amount.selfPay;
    const accountPay = useAccount ? Math.min(order.amount.accountPay, totalSelfPay) : 0;
    const additionalPay = totalSelfPay - accountPay;
    return { account: accountPay, additional: additionalPay, total: totalSelfPay };
  };

  const handlePayment = async () => {
    if (!order) return;

    setPaymentStatus('processing');
    setPaymentProgress(0);

    const progressInterval = setInterval(() => {
      setPaymentProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 300);

    try {
      const paymentAmount = calculatePaymentAmount();
      const request: PaymentRequest = {
        orderId: order.id,
        useAccount,
        additionalMethod: paymentAmount.additional > 0 ? additionalMethod : 'none',
        amount: paymentAmount.total,
      };

      await new Promise((resolve) => setTimeout(resolve, 2500));
      await paymentApi.pay(request);

      clearInterval(progressInterval);
      setPaymentProgress(100);
      setPaymentStatus('success');

      setTimeout(() => {
        setShowSuccess(true);
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setPaymentStatus('failed');
      console.error('Payment failed:', error);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!id) return;
    try {
      const res = await paymentApi.getReceipt(id);
      window.open(res.data.url, '_blank');
    } catch (error) {
      console.error('Failed to download receipt:', error);
    }
  };

  const paymentAmount = calculatePaymentAmount();

  if (loading) {
    return (
      <div className="page-content">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="skeleton h-10 w-32 rounded-lg" />
            <div className="skeleton h-40 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-80 rounded-2xl" />
            <div className="skeleton h-96 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-content">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">订单不存在或已失效</p>
          <button onClick={() => navigate('/payment')} className="btn-primary mt-4">
            返回列表
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="page-content">
        <div className="max-w-2xl mx-auto">
          <div className="card p-12 text-center animate-fade-in-up">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-medical-100 animate-ring-expand" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-medical-400 to-medical-600 flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="w-6 h-6 text-warning-500" />
              <h2 className="text-3xl font-bold text-slate-900">支付成功</h2>
              <PartyPopper className="w-6 h-6 text-warning-500 transform -scale-x-100" />
            </div>
            <p className="text-slate-500 mb-6">您的医疗费用已成功结算</p>

            <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 mb-1">交易流水号</p>
                  <p className="font-mono text-slate-900 font-medium">{order.transactionId || 'MED202606210001'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">支付时间</p>
                  <p className="font-medium text-slate-900">{formatDateTime(new Date())}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">支付金额</p>
                  <p className="text-2xl font-bold text-insurance-600 font-mono">
                    {formatCurrency(paymentAmount.total)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">医保报销</p>
                  <p className="text-xl font-bold text-medical-600 font-mono">
                    {formatCurrency(order.amount.overallPay)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDownloadReceipt}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                下载电子票据
              </button>
              <button
                onClick={() => navigate('/payment')}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                查看订单
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <button
        onClick={() => navigate('/payment')}
        className="flex items-center gap-2 text-slate-600 hover:text-insurance-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        返回支付列表
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${
                    order.type === 'outpatient' ? 'bg-insurance-50' : 'bg-medical-50'
                  } flex items-center justify-center`}
                >
                  {getTypeIcon(order.type)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{order.hospital}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="badge-info">{getTypeLabel(order.type)}</span>
                    <span className="text-sm text-slate-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 mb-1">待支付金额</p>
                <p className="text-3xl font-bold text-warning-600 font-mono">
                  {formatCurrency(paymentAmount.total)}
                </p>
              </div>
            </div>

            {paymentStatus === 'processing' && (
              <div className="mt-6 p-6 bg-insurance-50 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-insurance-700">支付处理中...</span>
                  <span className="text-sm font-medium text-insurance-700">{Math.round(paymentProgress)}%</span>
                </div>
                <div className="h-2 bg-insurance-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-insurance-500 to-insurance-400 transition-all duration-300 rounded-full"
                    style={{ width: `${paymentProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  {paymentSteps.map((step, index) => (
                    <div key={step.title} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          step.status === 'completed'
                            ? 'bg-medical-500 text-white'
                            : step.status === 'active'
                            ? 'bg-insurance-500 text-white animate-pulse-slow'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`text-xs mt-1 ${
                          step.status === 'completed'
                            ? 'text-medical-600'
                            : step.status === 'active'
                            ? 'text-insurance-600'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <button
              onClick={() => setExpandedItems(!expandedItems)}
              className="w-full flex items-center justify-between mb-4"
            >
              <h3 className="section-title mb-0 flex items-center gap-2">
                <FileText className="w-5 h-5 text-insurance-500" />
                费用明细
                <span className="text-sm font-normal text-slate-500">
                  共 {order.items.length} 项
                </span>
              </h3>
            </button>

            {expandedItems && (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                        项目名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                        规格
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        数量
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                        单价
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                        金额
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                        医保支付
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                        医保类型
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.spec}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 text-center">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 text-right font-mono">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-900 text-right font-medium font-mono">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-insurance-600 text-right font-medium font-mono">
                          {formatCurrency(item.insurancePay)}
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
            )}

            <div className="mt-6 p-5 bg-gradient-to-br from-insurance-50 to-white rounded-xl border border-insurance-100">
              <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-insurance-500" />
                医保政策自动核算
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">总费用</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {formatCurrency(order.amount.total)}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">统筹支付</p>
                  <p className="text-lg font-bold text-insurance-600 font-mono">
                    {formatCurrency(order.amount.overallPay)}
                  </p>
                  <p className="text-xs text-insurance-500 mt-1">
                    报销比例 {((order.amount.overallPay / order.amount.total) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">个账支付</p>
                  <p className="text-lg font-bold text-medical-600 font-mono">
                    {formatCurrency(order.amount.accountPay)}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">现金自费</p>
                  <p className="text-lg font-bold text-warning-600 font-mono">
                    {formatCurrency(order.amount.selfPay)}
                  </p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-white/60 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-insurance-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-slate-600">
                    <p className="font-medium text-slate-700">医保核算说明</p>
                    <p>甲类项目全额纳入报销（85%），乙类项目先自付10%后按85%报销，丙类项目全额自费。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="section-title mb-4">费用构成</h3>
            <ReactECharts option={costBreakdownOption} style={{ height: '220px' }} />
          </div>

          <div className="card p-6">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-insurance-500" />
              支付方式
            </h3>

            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-insurance-200 bg-white">
                <input
                  type="checkbox"
                  checked={useAccount}
                  onChange={(e) => setUseAccount(e.target.checked)}
                  className="w-5 h-5 text-insurance-500 rounded focus:ring-insurance-500"
                  disabled={paymentStatus === 'processing'}
                />
                <div className="w-10 h-10 rounded-xl bg-medical-50 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-medical-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">医保个人账户</p>
                  <p className="text-sm text-slate-500">可用余额充足</p>
                </div>
                <p className="font-bold text-medical-600 font-mono">
                  - {formatCurrency(paymentAmount.account)}
                </p>
              </label>

              {paymentAmount.additional > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">补充支付方式</p>
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-insurance-200 bg-white">
                    <input
                      type="radio"
                      name="additionalMethod"
                      value="wechat"
                      checked={additionalMethod === 'wechat'}
                      onChange={() => setAdditionalMethod('wechat')}
                      className="w-5 h-5 text-insurance-500 focus:ring-insurance-500"
                      disabled={paymentStatus === 'processing'}
                    />
                    <div className="w-10 h-10 rounded-xl bg-[#07C160]/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-[#07C160]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">微信支付</p>
                    </div>
                    <p className="font-bold text-slate-900 font-mono">
                      {formatCurrency(paymentAmount.additional)}
                    </p>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-insurance-200 bg-white">
                    <input
                      type="radio"
                      name="additionalMethod"
                      value="alipay"
                      checked={additionalMethod === 'alipay'}
                      onChange={() => setAdditionalMethod('alipay')}
                      className="w-5 h-5 text-insurance-500 focus:ring-insurance-500"
                      disabled={paymentStatus === 'processing'}
                    />
                    <div className="w-10 h-10 rounded-xl bg-[#1677FF]/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#1677FF]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">支付宝</p>
                    </div>
                    <p className="font-bold text-slate-900 font-mono">
                      {formatCurrency(paymentAmount.additional)}
                    </p>
                  </label>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">应付金额</span>
                <span className="font-bold text-2xl text-warning-600 font-mono">
                  {formatCurrency(paymentAmount.total)}
                </span>
              </div>
            </div>

            {paymentStatus === 'failed' && (
              <div className="mb-4 p-3 bg-danger-500/10 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0" />
                <p className="text-sm text-danger-600">支付失败，请重新尝试或选择其他支付方式</p>
              </div>
            )}

            <button
              onClick={handlePayment}
              disabled={paymentStatus === 'processing' || order.status !== 'pending'}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4"
            >
              {paymentStatus === 'processing' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  支付处理中...
                </>
              ) : order.status === 'paid' ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  已支付
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  确认支付 {formatCurrency(paymentAmount.total)}
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 mt-3">
              支付安全由江苏省医保局保障，您的信息将被严格保密
            </p>
          </div>

          <div className="card p-6 bg-gradient-to-br from-insurance-50 to-white">
            <h3 className="section-title mb-4 text-insurance-700">
              <Receipt className="w-5 h-5 inline-block mr-2" />
              电子票据
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              支付成功后将自动生成电子票据，可在订单详情中下载。
            </p>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-insurance-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-insurance-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">医疗收费票据</p>
                <p className="text-xs text-slate-500">PDF格式，含财政电子章</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentDetailPage;
