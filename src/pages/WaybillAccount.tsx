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
  Smartphone,
  Pencil
} from 'lucide-react';
import dayjs from 'dayjs';
import { get, put } from '@/utils/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { Modal, ModalFooter } from '@/components/Modal';
import type { WaybillAccount as WaybillAccountType, RechargeRecord } from 'shared/types';

const paymentMethodLabels: Record<string, { label: string; icon: any; color: string }> = {
  wechat: { label: '微信支付', icon: Smartphone, color: 'text-green-500' },
  alipay: { label: '支付宝', icon: CreditCard, color: 'text-blue-500' },
  bank: { label: '银行卡', icon: CreditCard, color: 'text-purple-500' },
  account: { label: '账户余额', icon: Wallet, color: 'text-amber-500' },
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
  const hasRole = useAuthStore(state => state.hasRole);
  const addNotification = useAppStore(state => state.addNotification);
  const isAdmin = hasRole(['admin']);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<WaybillAccountType | null>(null);
  const [recentRecords, setRecentRecords] = useState<RechargeRecord[]>([]);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [thresholdInput, setThresholdInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await get<WaybillAccountType>('/waybill/account');
      setAccount(result);
      const recordsResult = await get<{ list: RechargeRecord[]; total: number }>('/waybill/recharge-records', {
        params: { pageSize: 10 },
      });
      setRecentRecords(recordsResult.list || []);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '加载失败',
        message: error.message || '获取账户信息失败',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateThreshold = async () => {
    if (!thresholdInput || Number(thresholdInput) < 0) {
      addNotification({
        type: 'error',
        title: '参数错误',
        message: '请输入有效的告警阈值',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await put('/waybill/threshold', { threshold: Number(thresholdInput) });
      addNotification({
        type: 'success',
        title: '更新成功',
        message: '低余额告警阈值已更新',
      });
      setIsThresholdModalOpen(false);
      fetchData();
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: '更新失败',
        message: error.message || '更新告警阈值失败',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openThresholdModal = () => {
    setThresholdInput(String(account?.lowBalanceThreshold || 0));
    setIsThresholdModalOpen(true);
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
            {isAdmin && (
              <button
                onClick={() => navigate('/waybill-recharge')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
              >
                <FileText className="w-5 h-5" />
                充值记录
              </button>
            )}
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
                {isAdmin && (
                  <button
                    onClick={() => navigate('/waybill-recharge')}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-gray-100 transition-all hover:shadow-lg text-lg"
                  >
                    <Plus className="w-6 h-6" />
                    立即充值
                  </button>
                )}
                <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
                  <span>低余额预警：¥{account?.lowBalanceThreshold.toFixed(2)}</span>
                  {isAdmin && (
                    <button
                      onClick={openThresholdModal}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
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

              {isAdmin && (
                <button
                  onClick={() => navigate('/waybill-template')}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  编辑模板配置
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        title="修改低余额告警阈值"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              告警阈值（元）
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">¥</span>
              <input
                type="number"
                placeholder="0.00"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              当账户余额低于此阈值时，系统将发送告警通知。
            </p>
          </div>
        </div>

        <ModalFooter>
          <button
            onClick={() => setIsThresholdModalOpen(false)}
            className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleUpdateThreshold}
            disabled={isSubmitting || !thresholdInput || Number(thresholdInput) < 0}
            className="px-8 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              '确认修改'
            )}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
