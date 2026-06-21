import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { studentApi, paymentApi } from '@/lib/api.ts';
import { formatMoney, formatDateTime } from '@/utils/format.ts';
import { Wallet, CreditCard, CheckCircle, Loader2, Plus, History, Smartphone } from 'lucide-react';
import type { StudentAccount, RechargeRecord, PaymentChannel } from '../../../shared/types.js';

const AMOUNT_OPTIONS = [10, 20, 50, 100, 200, 500];

export default function StudentRecharge() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<StudentAccount | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [channel, setChannel] = useState<PaymentChannel>('alipay');
  const [records, setRecords] = useState<RechargeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<RechargeRecord | null>(null);

  useEffect(() => {
    (async () => {
      const [p, r] = await Promise.all([studentApi.profile(), paymentApi.records()]);
      setProfile(p);
      setRecords(r);
    })();
  }, []);

  const finalAmount = customAmount ? Number(customAmount) : selectedAmount;

  const handleRecharge = async () => {
    if (!finalAmount || finalAmount <= 0) {
      alert('请选择或输入充值金额');
      return;
    }
    setPaying(true);
    try {
      const created = await paymentApi.recharge(finalAmount, channel);
      await new Promise((r) => setTimeout(r, 1500));
      const result = await paymentApi.pay(created.id);
      setSuccess(result);
      const [p, r] = await Promise.all([studentApi.profile(), paymentApi.records()]);
      setProfile(p);
      setRecords(r);
    } catch (err: any) {
      alert(err.message || '充值失败');
    } finally {
      setPaying(false);
    }
  };

  const closeSuccess = () => {
    setSuccess(null);
    navigate('/student');
  };

  return (
    <AppLayout role="student">
      {success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-sm w-full text-center animate-[fadeIn_0.3s_ease]">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h3 className="text-2xl font-display font-bold text-graphite-800 mb-2">充值成功</h3>
            <p className="text-graphite-500 mb-1">已充值到您的校园账户</p>
            <p className="text-3xl font-bold text-gradient-aqua bg-gradient-to-r from-deep-blue-700 to-aqua-500 bg-clip-text text-transparent my-4">
              +{formatMoney(success.amount)}
            </p>
            <div className="text-xs text-graphite-500 space-y-1 mb-6">
              <p>交易单号：{success.externalTransactionId}</p>
              <p>到账时间：{success.paidAt ? formatDateTime(success.paidAt) : ''}</p>
              <p className="text-aqua-600">已同步至校园一卡通系统</p>
            </div>
            <button onClick={closeSuccess} className="btn-primary w-full">完成</button>
          </div>
        </div>
      )}

      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <h2 className="text-2xl font-display font-bold text-graphite-800">账户充值</h2>
          <p className="text-sm text-graphite-500 mt-1">支持支付宝、微信支付，余额实时同步校园一卡通</p>
        </div>

        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-vibrant-orange-300/20 to-transparent rounded-full -translate-y-1/4 translate-x-1/4" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-graphite-500 text-sm mb-1 flex items-center gap-1"><Wallet size={16} />当前账户余额</p>
              <h2 className="text-4xl font-display font-bold text-gradient-orange bg-gradient-to-r from-vibrant-orange-500 to-vibrant-orange-600 bg-clip-text text-transparent">
                {formatMoney(profile?.balance || 0)}
              </h2>
              <p className="text-graphite-400 text-xs mt-2">学号：{profile?.studentNo} · 一卡通已绑定</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-vibrant-orange-500 to-vibrant-orange-600 flex items-center justify-center shadow-glow-orange">
              <CreditCard size={28} className="text-white" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2"><Plus size={18} />选择充值金额</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {AMOUNT_OPTIONS.map((amount) => (
              <button
                key={amount}
                onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                className={`py-4 rounded-xl font-display text-xl font-bold transition-all ${
                  (!customAmount && selectedAmount === amount)
                    ? 'bg-gradient-to-br from-deep-blue-700 to-aqua-500 text-white shadow-lg scale-105'
                    : 'bg-graphite-50 text-graphite-700 hover:bg-graphite-100 border-2 border-transparent hover:border-aqua-200'
                }`}
              >
                ¥{amount}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-graphite-500">¥</span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="自定义金额"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-graphite-50 border-2 border-transparent focus:border-aqua-400 focus:bg-white text-lg font-medium focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2"><Smartphone size={18} />选择支付方式</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setChannel('alipay')}
              className={`p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                channel === 'alipay'
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-md'
                  : 'bg-graphite-50 border-2 border-transparent hover:bg-graphite-100'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold">支</div>
              <div>
                <div className="font-semibold text-graphite-800">支付宝</div>
                <div className="text-xs text-graphite-500">推荐使用</div>
              </div>
            </button>
            <button
              onClick={() => setChannel('wechat')}
              className={`p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                channel === 'wechat'
                  ? 'bg-green-50 border-2 border-green-500 shadow-md'
                  : 'bg-graphite-50 border-2 border-transparent hover:bg-graphite-100'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center text-white font-bold">微</div>
              <div>
                <div className="font-semibold text-graphite-800">微信支付</div>
                <div className="text-xs text-graphite-500">扫码支付</div>
              </div>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-graphite-600">
            <span>充值金额</span>
            <span className="font-semibold">{formatMoney(finalAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-graphite-500 text-sm">
            <span>到账账户</span>
            <span>校园一卡通（{profile?.campusCardId}）</span>
          </div>
        </div>

        <button
          onClick={handleRecharge}
          disabled={paying || !finalAmount}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-vibrant-orange-500 to-vibrant-orange-600 text-white text-lg font-bold shadow-lg hover:shadow-glow-orange hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {paying ? (
            <><Loader2 size={22} className="animate-spin" />支付处理中...</>
          ) : (
            <>立即充值 {formatMoney(finalAmount)}</>
          )}
        </button>

        <div>
          <h3 className="font-semibold text-graphite-800 mb-4 flex items-center gap-2"><History size={18} />充值记录</h3>
          {records.length === 0 ? (
            <div className="glass-card p-8 text-center text-graphite-500">暂无充值记录</div>
          ) : (
            <div className="space-y-2">
              {records.map((r) => (
                <div key={r.id} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                      r.channel === 'alipay' ? 'bg-blue-500' : 'bg-green-500'
                    }`}>
                      {r.channel === 'alipay' ? '支' : '微'}
                    </div>
                    <div>
                      <div className="font-medium text-graphite-800">
                        {r.channel === 'alipay' ? '支付宝充值' : '微信充值'}
                      </div>
                      <div className="text-xs text-graphite-500">{formatDateTime(r.createdAt)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      r.status === 'success' ? 'text-green-600'
                        : r.status === 'pending' ? 'text-graphite-500'
                        : 'text-vibrant-orange-600'
                    }`}>
                      {r.status === 'success' ? '+' : r.status === 'failed' ? '-' : ''}
                      {formatMoney(r.amount)}
                    </div>
                    <div className={`text-xs ${
                      r.status === 'success' ? 'text-green-600'
                        : r.status === 'pending' ? 'text-graphite-500'
                        : 'text-vibrant-orange-600'
                    }`}>
                      {r.status === 'success' ? '已到账' : r.status === 'pending' ? '处理中' : '失败'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
