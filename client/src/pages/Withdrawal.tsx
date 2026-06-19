import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { createWithdrawal, getWithdrawalList } from '../services/api';

const presetAmounts = [1, 5, 10, 30, 50, 100];

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '审核中', color: 'text-orange-500' },
  processing: { text: '打款中', color: 'text-blue-500' },
  success: { text: '已到账', color: 'text-accent' },
  failed: { text: '已驳回', color: 'text-red-500' },
};

const Withdrawal: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useUserStore();
  const [amount, setAmount] = useState<number | null>(1);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState<number | null>(null);

  const loadData = async () => {
    try {
      const r: any = await getWithdrawalList(1, 10);
      setRecords(r.list || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async () => {
    if (amount === null) {
      (window as any).toast('请选择提现金额');
      return;
    }
    setLoading(true);
    try {
      const r: any = await createWithdrawal(amount, 'wechat');
      (window as any).toast(r.status === 'success' || r.status === 'processing' ? '提现成功，秒到账！' : '提交成功，等待审核');
      setShowSuccess(amount);
      refreshUser();
      loadData();
    } catch (e: any) {
      (window as any).toast(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-8">
      <div className="sticky top-0 bg-white/80 backdrop-blur z-30 px-4 py-3 flex items-center border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 -ml-2 flex items-center justify-center text-xl">←</button>
        <h1 className="font-bold text-lg flex-1 text-center pr-8">💵 提现中心</h1>
      </div>

      <div className="p-4">
        <div className="card p-6 mb-4 bg-gradient-to-br from-accent to-teal-500 text-white">
          <div className="text-xs text-white/80 mb-2">可提现余额(元)</div>
          <div className="text-4xl font-bold mb-4">¥{(user?.cash_balance || 0).toFixed(2)}</div>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <span>✓ T+0秒到账</span>
            <span>✓ 免手续费</span>
            <span>✓ 微信零钱</span>
          </div>
        </div>

        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">选择提现金额</div>
            <div className="text-xs text-gray-400">每日上限100元</div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {presetAmounts.map((a) => {
              const disabled = (user?.cash_balance || 0) < a;
              const selected = amount === a;
              return (
                <button
                  key={a}
                  onClick={() => !disabled && setAmount(a)}
                  disabled={disabled}
                  className={`p-4 rounded-2xl border-2 transition ${selected ? 'border-accent bg-green-50' : 'border-gray-100'} ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
                >
                  <div className={`text-2xl font-bold ${selected ? 'text-accent' : 'text-gray-700'}`}>¥{a}</div>
                  <div className="text-xs text-gray-400 mt-1">微信零钱</div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl mb-5 text-sm">
            <span className="text-xl">💬</span>
            <div className="flex-1 text-gray-600">
              提现将自动转入微信零钱，首提优先审核
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={loading || amount === null || (user?.cash_balance || 0) < (amount || 0)}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-accent to-teal-600 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/30"
          >
            {loading ? '处理中...' : `立即提现 ¥${amount?.toFixed(2) || '0.00'}`}
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">📋 提现记录</h3>
          <span className="text-xs text-gray-400">{records.length} 笔</span>
        </div>

        <div className="card divide-y">
          {records.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <div className="text-5xl mb-3">🏦</div>
              <div className="mb-1">暂无提现记录</div>
              <div className="text-xs">完成任务赚金币，兑换现金后即可提现</div>
            </div>
          )}
          {records.map((r: any) => {
            const status = statusMap[r.status] || { text: r.status, color: 'text-gray-500' };
            return (
              <div key={r.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-xl">💵</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm">提现到微信零钱</div>
                    <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r.created_at}
                    {r.transaction_id && ` · ${r.transaction_id.slice(-8)}`}
                    {r.failed_reason && <span className="text-red-400 ml-1">· {r.failed_reason}</span>}
                  </div>
                </div>
                <div className="text-base font-bold">-¥{r.amount?.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {showSuccess !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8" onClick={() => setShowSuccess(null)}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center bounce-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-teal-400 mx-auto mb-5 flex items-center justify-center text-4xl shadow-lg shadow-accent/30">
              ✓
            </div>
            <h3 className="text-xl font-bold mb-2">提现成功！</h3>
            <p className="text-gray-500 mb-4">¥{showSuccess.toFixed(2)} 已打入您的微信零钱</p>
            <div className="bg-green-50 rounded-xl p-4 text-sm text-gray-600 mb-6">
              📌 首次提现秒到账，后续提现一般10分钟内到账，最长不超过24小时
            </div>
            <button onClick={() => setShowSuccess(null)} className="btn-primary w-full">
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawal;
