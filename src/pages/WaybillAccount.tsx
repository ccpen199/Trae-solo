import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  CreditCard,
  Smartphone
} from 'lucide-react';
import dayjs from 'dayjs';
import { get } from '@/utils/api';
import { cn } from '@/lib/utils';
import type { WaybillAccount as WaybillAccountType, RechargeRecord } from 'shared/types';

const mockAccount: WaybillAccountType = {
  id: '1',
  outletId: '1',
  outletName: '东门网点',
  balance: 856.50,
  frozenBalance: 200.00,
  totalRecharged: 15000.00,
  totalUsed: 14143.50,
  templateConfig: {
    templateId: 'tpl001',
    templateName: '标准面单模板',
    paperSize: '100x150',
    fontSize: 'medium',
    showLogo: true,
    logoUrl: 'https://example.com/logo.png',
  },
  lowBalanceThreshold: 1000,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-06-18T10:30:00Z',
};

const mockRechargeRecords: RechargeRecord[] = [
  {
    id: '1',
    accountId: '1',
    amount: 5000,
    paymentMethod: 'wechat',
    transactionId: 'WX202606180001',
    status: 'success',
    operatorId: '1',
    operatorName: '张三',
    createdAt: '2026-06-18T10:30:00Z',
    completedAt: '2026-06-18T10:30:05Z',
  },
  {
    id: '2',
    accountId: '1',
    amount: 3000,
    paymentMethod: 'alipay',
    transactionId: 'ALI202606150001',
    status: 'success',
    operatorId: '1',
    operatorName: '张三',
    createdAt: '2026-06-15T14:20:00Z',
    completedAt: '2026-06-15T14:20:10Z',
  },
  {
    id: '3',
    accountId: '1',
    amount: 2000,
    paymentMethod: 'wechat',
    transactionId: 'WX202606100001',
    status: 'success',
    operatorId: '1',
    operatorName: '张三',
    createdAt: '2026-06-10T09:15:00Z',
    completedAt: '2026-06-10T09:15:30Z',
  },
  {
    id: '4',
    accountId: '1',
    amount: 5000,
    paymentMethod: 'bank',
    transactionId: 'BANK202606050001',
    status: 'pending',
    operatorId: '1',
    operatorName: '张三',
    createdAt: '2026-06-05T16:45:00Z',
  },
  {
    id: '5',
    accountId: '1',
    amount: 1000,
    paymentMethod: 'wechat',
    status: 'failed',
    operatorId: '1',
    operatorName: '张三',
    remark: '支付超时',
    createdAt: '2026-06-01T11:30:00Z',
  },
];

const paymentMethodLabels: Record<string, { label: string; icon: any; color: string }> = {
  wechat: { label: '微信支付', icon: Smartphone, color: 'text-green-500' },
  alipay: { label: '支付宝', icon: CreditCard, color: 'text-blue-500' },
  bank: { label: '银行卡', icon: CreditCard, color: 'text-purple-500' },
};

const rechargeStatusConfig: Record<string, { label: string; className: string; icon: any }> = {
  pending: { label: '待支付', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
  success: { label: '成功', className: 'bg-green-100 text-green-700', icon: CheckCircle },
  failed: { label: '失败', className: 'bg-red-100 text-red-700', icon: XCircle },
};

const paperSizeLabels: Record<string, string> = {
  '100x150': '100mm × 150mm',
  '100x180': '100mm × 180mm',
  '80x150': '80mm × 150mm',
};

const fontSizeLabels: Record<string, string> = {
  small: '小',
  medium: '中',
  large: '大',
};

export default function WaybillAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<WaybillAccountType | null>(null);
  const [recentRecords, setRecentRecords] = useState<RechargeRecord[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await get<WaybillAccountType>('/waybill/account');
      setAccount(result);
      const recordsResult = await get<RechargeRecord[]>('/waybill/recharge-records', {
        params: { pageSize: 10 },
      });
      setRecentRecords(Array.isArray(recordsResult) ? recordsResult : (recordsResult as any).data?.list || []);
    } catch {
      setAccount(mockAccount);
      setRecentRecords(mockRechargeRecords);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  const isLowBalance = account && account.balance < account.lowBalanceThreshold;
  const availableBalance = account ? account.balance - account.frozenBalance : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">电子面单账户</h1>
            <p className="text-gray-500 mt-1">管理您的面单账户余额和模板配置</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/waybill-template')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              模板配置
            </button>
            <button
              onClick={() => navigate('/waybill-recharge')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              <FileText className="w-5 h-5" />
              充值记录
            </button>
          </div>
        </div>

        {isLowBalance && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-red-700 font-semibold">余额告警</p>
              <p className="text-red-600 text-sm">
                当前账户余额 ¥{account?.balance.toFixed(2)} 已低于预警阈值 ¥{account?.lowBalanceThreshold.toFixed(2)}，请及时充值以免影响使用。
              </p>
            </div>
          </div>
        )}

        <div className={cn(
          'rounded-2xl p-6 text-white shadow-xl relative overflow-hidden',
          isLowBalance
            ? 'bg-gradient-to-br from-orange-500 via-red-500 to-red-600'
            : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600'
        )}>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="absolute left-0 bottom-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">面单账户余额</p>
                    <p className="text-5xl font-bold mt-1">¥{account?.balance.toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                      <TrendingDown className="w-4 h-4" />
                      <span>冻结金额</span>
                    </div>
                    <p className="text-xl font-semibold">¥{account?.frozenBalance.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                      <Wallet className="w-4 h-4" />
                      <span>可用余额</span>
                    </div>
                    <p className="text-xl font-semibold text-green-300">¥{availableBalance.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>累计充值</span>
                    </div>
                    <p className="text-xl font-semibold">¥{account?.totalRecharged.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                      <TrendingDown className="w-4 h-4" />
                      <span>累计使用</span>
                    </div>
                    <p className="text-xl font-semibold">¥{account?.totalUsed.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/waybill-recharge')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:shadow-lg text-lg"
                >
                  <Plus className="w-6 h-6" />
                  立即充值
                </button>
                <div className="text-center text-white/70 text-sm">
                  低余额预警：¥{account?.lowBalanceThreshold.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">最近充值记录</h3>
                <p className="text-sm text-gray-500">最近10条充值记录</p>
              </div>
              <button
                onClick={() => navigate('/waybill-recharge')}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                查看全部
              </button>
            </div>

            {recentRecords.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无充值记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">充值单号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">支付方式</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentRecords.slice(0, 10).map((record, idx) => {
                      const status = rechargeStatusConfig[record.status];
                      const StatusIcon = status.icon;
                      const paymentMethod = paymentMethodLabels[record.paymentMethod] || paymentMethodLabels.wechat;
                      const PaymentIcon = paymentMethod.icon;
                      return (
                        <tr
                          key={record.id}
                          className={cn(
                            'hover:bg-gray-50 transition-colors',
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          )}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">CZ{record.id.padStart(8, '0')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{dayjs(record.createdAt).format('YYYY-MM-DD HH:mm')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-lg font-semibold text-gray-900">+¥{record.amount.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <PaymentIcon className={cn('w-4 h-4', paymentMethod.color)} />
                              <span className="text-sm text-gray-600">{paymentMethod.label}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', status.className)}>
                              <StatusIcon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">当前模板配置</h3>
              <p className="text-sm text-gray-500">面单打印模板设置</p>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">模板名称</span>
                <span className="font-medium text-gray-900">{account?.templateConfig.templateName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">纸张尺寸</span>
                <span className="font-medium text-gray-900">{paperSizeLabels[account?.templateConfig.paperSize || '']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">字体大小</span>
                <span className="font-medium text-gray-900">{fontSizeLabels[account?.templateConfig.fontSize || '']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">显示Logo</span>
                <span className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  account?.templateConfig.showLogo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                )}>
                  {account?.templateConfig.showLogo ? '已开启' : '已关闭'}
                </span>
              </div>

              {account?.templateConfig.logoUrl && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-gray-500 text-sm mb-3">Logo预览</p>
                  <div className="w-full h-20 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                    <img
                      src={account.templateConfig.logoUrl}
                      alt="Logo"
                      className="max-h-full max-w-full object-contain p-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/waybill-template')}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
                编辑模板配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
