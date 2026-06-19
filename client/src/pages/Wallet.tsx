import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';
import { getCoinRecords, getExchangeRate, exchangeCoins } from '../services/api';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useUserStore();
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [rateInfo, setRateInfo] = useState<any>({ rate: 10000, tiers: [] });
  const [showExchange, setShowExchange] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, rate] = await Promise.all([getCoinRecords(page, 20), getExchangeRate()]);
      setRecords(r.list || []);
      setTotal(r.total || 0);
      setRateInfo(rate);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleExchange = async () => {
    if (selectedTier === null) return;
    const tier = rateInfo.tiers[selectedTier];
    try {
      await exchangeCoins(tier.coins);
      (window as any).toast(`兑换成功！+¥${tier.cash}`);
      refreshUser();
      setShowExchange(false);
      setSelectedTier(null);
    } catch (e: any) {
      (window as any).toast(e.message);
    }
  };

  const typeMap: Record<string, { label: string; icon: string }> = {
    task: { label: '任务奖励', icon: '🎯' },
    checkin: { label: '签到奖励', icon: '📅' },
    steps: { label: '步数奖励', icon: '👟' },
    video: { label: '视频奖励', icon: '🎬' },
    invite: { label: '邀请奖励', icon: '🤝' },
    invite_level2: { label: '二级邀请', icon: '👥' },
    invite_level3: { label: '三级邀请', icon: '👥' },
    exchange: { label: '金币兑换', icon: '💱' },
  };

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-primary text-white px-5 pt-12 pb-20 rounded-b-[40px] relative overflow-hidden">
        <div className="absolute -right-8 top-0 text-[160px] opacity-10">🪙</div>
        <h1 className="text-xl font-bold mb-1">💰 金币钱包</h1>
        <p className="text-white/80 text-xs mb-8">金币可兑换现金提现</p>

        <div className="text-center">
          <div className="text-xs text-white/80 mb-2">当前金币</div>
          <div className="text-5xl font-bold mb-3">{(user?.coins || 0).toLocaleString()}</div>
          <div className="inline-block bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm">
            ≈ ¥{((user?.coins || 0) / rateInfo.rate).toFixed(4)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">
          <button onClick={() => setShowExchange(true)} className="bg-white text-primary rounded-2xl py-3.5 font-semibold active:scale-95 transition-transform">
            💱 兑换现金
          </button>
          <button onClick={() => navigate('/withdrawal')} className="bg-black/30 backdrop-blur text-white rounded-2xl py-3.5 font-semibold active:scale-95 transition-transform">
            💵 去提现
          </button>
        </div>
      </div>

      <div className="px-4 -mt-10">
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">阶梯汇率 · 越兑越划算</div>
            <span className="text-xs text-gray-400">当前基准: 1元={rateInfo.rate}金币</span>
          </div>
          <div className="space-y-2">
            {rateInfo.tiers?.map((tier: any, i: number) => {
              const canExchange = (user?.coins || 0) >= tier.coins;
              const discount = ((1 - tier.rate / rateInfo.rate) * 100).toFixed(0);
              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border-2 transition ${selectedTier === i ? 'border-primary bg-orange-50' : 'border-gray-100'} ${canExchange ? 'cursor-pointer active:scale-[0.98]' : 'opacity-50'}`}
                  onClick={() => canExchange && setShowExchange(true) || setSelectedTier(i)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{i === rateInfo.tiers.length - 1 ? '💰' : i >= 2 ? '🪙' : '⭐'}</div>
                    <div>
                      <div className="font-semibold">{tier.coins.toLocaleString()} 金币</div>
                      <div className="text-xs text-gray-500">1元≈{tier.rate}金币</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">¥{tier.cash}</div>
                    {discount !== '0' && <div className="text-xs text-accent font-semibold">省{discount}%</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <h3 className="font-semibold mb-3 px-1">📜 金币明细</h3>
        <div className="card divide-y">
          {records.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <div className="text-5xl mb-3">📭</div>
              暂无金币记录
            </div>
          )}
          {records.map((r: any) => {
            const info = typeMap[r.type] || { label: r.type, icon: '💫' };
            return (
              <div key={r.id} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                  {info.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{info.label}</div>
                  <div className="text-xs text-gray-400">{r.description || info.label} · {r.created_at}</div>
                </div>
                <div className={`text-base font-bold flex-shrink-0 ${r.change > 0 ? 'text-primary' : 'text-gray-400'}`}>
                  {r.change > 0 ? '+' : ''}{r.change}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showExchange && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={() => setShowExchange(false)}>
          <div className="bg-white w-full rounded-t-3xl p-6 bounce-in safe-bottom" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-xl font-bold mb-6 text-center">确认兑换</h3>
            <div className="space-y-3 mb-6">
              {rateInfo.tiers?.map((tier: any, i: number) => {
                const disabled = (user?.coins || 0) < tier.coins;
                return (
                  <div key={i}
                    onClick={() => !disabled && setSelectedTier(i)}
                    className={`p-4 rounded-2xl border-2 flex items-center justify-between transition ${selectedTier === i ? 'border-primary bg-orange-50' : 'border-gray-100'} ${disabled ? 'opacity-50' : 'cursor-pointer active:scale-[0.98]'}`}
                  >
                    <div>
                      <div className="font-semibold">{tier.coins.toLocaleString()} 金币</div>
                      <div className="text-xs text-gray-400 mt-0.5">当前余额: {(user?.coins || 0).toLocaleString()}</div>
                    </div>
                    <div className="text-2xl font-bold text-primary">¥{tier.cash}</div>
                  </div>
                );
              })}
            </div>
            <button onClick={handleExchange} disabled={selectedTier === null} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              确认兑换
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
