import { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  Gift,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { WITHDRAW_DAILY_LIMIT, WITHDRAW_SINGLE_LIMIT } from '@neighborhood/shared';

type WalletTab = 'balance' | 'redpackets' | 'transactions';

export default function WalletPage() {
  const [tab, setTab] = useState<WalletTab>('balance');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'wechat' | 'alipay'>('wechat');

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <WalletIcon className="w-6 h-6" />
          <span className="font-medium">我的钱包</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold">¥128.50</div>
            <div className="text-sm text-primary-200">总余额</div>
          </div>
          <div>
            <div className="text-2xl font-bold">¥20.00</div>
            <div className="text-sm text-primary-200">冻结金额</div>
          </div>
          <div>
            <div className="text-2xl font-bold">¥108.50</div>
            <div className="text-sm text-primary-200">可提现</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {([
          { key: 'balance', label: '余额' },
          { key: 'redpackets', label: '红包' },
          { key: 'transactions', label: '明细' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'balance' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">提现</h3>
            <div className="space-y-3">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="请输入提现金额"
                className="input-field"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setWithdrawMethod('wechat')}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    withdrawMethod === 'wechat'
                      ? 'border-green-400 bg-green-50 text-green-600'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  提现到微信
                </button>
                <button
                  onClick={() => setWithdrawMethod('alipay')}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    withdrawMethod === 'alipay'
                      ? 'border-blue-400 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  提现到支付宝
                </button>
              </div>
              <p className="text-xs text-gray-400">
                单次限额 ¥{WITHDRAW_SINGLE_LIMIT}，每日限额 ¥{WITHDRAW_DAILY_LIMIT}
              </p>
              <button className="btn-primary w-full" disabled={!withdrawAmount}>
                确认提现
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'redpackets' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary-600 text-white">
              可使用 (3)
            </button>
            <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              已使用
            </button>
            <button className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
              已过期
            </button>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <Gift className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">签到红包</p>
                <p className="text-xs text-gray-400 mt-0.5">满10元可用 · 30天后过期</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-500">¥{i}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  i % 2 === 0 ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <ArrowUpRight
                  className={`w-5 h-5 ${
                    i % 2 === 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {i % 2 === 0 ? '红包收入' : '商品支付'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">2024-01-{10 + i} 14:30</p>
              </div>
              <div
                className={`text-sm font-bold ${
                  i % 2 === 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {i % 2 === 0 ? '+' : '-'}¥{(i * 2.5).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
