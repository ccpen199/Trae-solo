import { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Smartphone,
  QrCode,
} from 'lucide-react';
import type { Wallet as WalletType, WithdrawRecord } from '../../../shared/types';
import { api } from '@/utils/api';
import { cn } from '@/lib/utils';

const mockWallet: WalletType = {
  id: '1',
  studentId: '1',
  balance: 3280.5,
  alipayAccount: 'zhangsan@example.com',
  alipayRealName: '张三',
  wechatAccount: '138****8888',
  wechatRealName: '张三',
};

const mockWithdrawRecords: WithdrawRecord[] = [
  {
    id: '1',
    studentId: '1',
    amount: 500,
    channel: 'alipay',
    status: 'success',
    createdAt: '2025-01-05',
    completedAt: '2025-01-06',
  },
  {
    id: '2',
    studentId: '1',
    amount: 1000,
    channel: 'wechat',
    status: 'success',
    createdAt: '2024-12-20',
    completedAt: '2024-12-21',
  },
  {
    id: '3',
    studentId: '1',
    amount: 300,
    channel: 'alipay',
    status: 'pending',
    createdAt: '2025-01-12',
  },
  {
    id: '4',
    studentId: '1',
    amount: 200,
    channel: 'wechat',
    status: 'failed',
    createdAt: '2024-12-10',
  },
];

const statusConfig = {
  pending: { label: '处理中', icon: Clock, className: 'text-amber-500' },
  processing: { label: '处理中', icon: Clock, className: 'text-amber-500' },
  success: { label: '提现成功', icon: CheckCircle, className: 'text-success-500' },
  failed: { label: '提现失败', icon: XCircle, className: 'text-red-500' },
};

export default function StudentWallet() {
  const [wallet] = useState<WalletType>(mockWallet);
  const [withdrawRecords] = useState<WithdrawRecord[]>(mockWithdrawRecords);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'alipay' | 'wechat'>('alipay');

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > wallet.balance) return;

    try {
      await api.post('/wallet/withdraw', {
        amount,
        channel: selectedChannel,
      });
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('提现失败', error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dateStr;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">我的钱包</h1>
        <p className="text-gray-500 mt-1">管理你的薪资收入和提现</p>
      </div>

      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-6 text-white shadow-xl shadow-primary-600/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/70 text-sm">账户余额</p>
            </div>
          </div>
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary-600 rounded-xl font-medium hover:bg-white/90 transition-colors"
          >
            <ArrowUpRight className="w-5 h-5" />
            提现
          </button>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-sm">¥</span>
          <span className="text-5xl font-bold tracking-tight">
            {wallet.balance.toFixed(2)}
          </span>
        </div>
        <p className="text-white/50 text-sm mt-2">可提现金额</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">支付宝</p>
                <p className="text-sm text-gray-500">
                  {wallet.alipayAccount || '未绑定'}
                </p>
              </div>
            </div>
            {wallet.alipayAccount ? (
              <CheckCircle className="w-5 h-5 text-success-500" />
            ) : (
              <button className="text-sm text-primary-600 font-medium">去绑定</button>
            )}
          </div>
          {wallet.alipayRealName && (
            <p className="text-sm text-gray-400">真实姓名：{wallet.alipayRealName}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">微信支付</p>
                <p className="text-sm text-gray-500">
                  {wallet.wechatAccount || '未绑定'}
                </p>
              </div>
            </div>
            {wallet.wechatAccount ? (
              <CheckCircle className="w-5 h-5 text-success-500" />
            ) : (
              <button className="text-sm text-primary-600 font-medium">去绑定</button>
            )}
          </div>
          {wallet.wechatRealName && (
            <p className="text-sm text-gray-400">真实姓名：{wallet.wechatRealName}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">提现记录</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {withdrawRecords.length > 0 ? (
            withdrawRecords.map((record) => {
              const status = statusConfig[record.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={record.id}
                  className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        record.channel === 'alipay' ? 'bg-blue-100' : 'bg-green-100'
                      )}
                    >
                      {record.channel === 'alipay' ? (
                        <Smartphone className="w-5 h-5 text-blue-600" />
                      ) : (
                        <QrCode className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {record.channel === 'alipay' ? '支付宝提现' : '微信提现'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(record.createdAt)}
                        {record.completedAt && ` → ${formatDate(record.completedAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      -¥{record.amount.toFixed(2)}
                    </p>
                    <div className={cn('flex items-center gap-1 text-sm', status.className)}>
                      <StatusIcon className="w-4 h-4" />
                      <span>{status.label}</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无提现记录</p>
            </div>
          )}
        </div>
      </div>

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">申请提现</h3>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提现金额
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-semibold text-gray-400">
                  ¥
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 text-2xl font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between mt-2">
                <p className="text-sm text-gray-500">
                  可提现金额：<span className="text-primary-600 font-medium">¥{wallet.balance.toFixed(2)}</span>
                </p>
                <button
                  onClick={() => setWithdrawAmount(String(wallet.balance))}
                  className="text-sm text-primary-600 font-medium"
                >
                  全部提现
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                提现通道
              </label>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedChannel('alipay')}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all',
                    selectedChannel === 'alipay'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900">支付宝</p>
                    <p className="text-sm text-gray-500">
                      {wallet.alipayAccount || '未绑定'}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selectedChannel === 'alipay'
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    )}
                  >
                    {selectedChannel === 'alipay' && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setSelectedChannel('wechat')}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-all',
                    selectedChannel === 'wechat'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900">微信支付</p>
                    <p className="text-sm text-gray-500">
                      {wallet.wechatAccount || '未绑定'}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selectedChannel === 'wechat'
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300'
                    )}
                  >
                    {selectedChannel === 'wechat' && (
                      <CheckCircle className="w-3 h-3 text-white" />
                    )}
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl font-medium transition-colors',
                  withdrawAmount && parseFloat(withdrawAmount) > 0
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                确认提现
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
