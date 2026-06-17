import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, TrendingDown, Tag, Gift, CreditCard, ArrowUpRight } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Transaction {
  id: string; type: 'payment' | 'topup' | 'refund' | 'coupon'; title: string; amount: number; time: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'payment', title: '帮我买·咖啡配送', amount: -28.5, time: '2026-06-17 14:30' },
  { id: '2', type: 'refund', title: '订单退款', amount: 15, time: '2026-06-16 20:15' },
  { id: '3', type: 'payment', title: '帮我送·文件配送', amount: -22, time: '2026-06-16 16:30' },
  { id: '4', type: 'topup', title: '微信充值', amount: 100, time: '2026-06-15 10:00' },
  { id: '5', type: 'coupon', title: '新用户优惠券', amount: 10, time: '2026-06-14 09:00' },
  { id: '6', type: 'payment', title: '帮我取·快递代取', amount: -12, time: '2026-06-13 14:20' },
];

const mockCoupons = [
  { id: '1', name: '满30减5', value: '¥5', condition: '满30元可用', expireDate: '2026-07-31', color: 'from-blue-500 to-blue-600' },
  { id: '2', name: '跑腿8折券', value: '8折', condition: '最高减8元', expireDate: '2026-06-30', color: 'from-orange-500 to-red-500' },
  { id: '3', name: '新用户立减', value: '¥10', condition: '无门槛', expireDate: '2026-08-31', color: 'from-green-500 to-teal-600' },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'payment' | 'topup' | 'refund'>('all');
  const balance = 128.5;

  const filtered = activeTab === 'all' ? mockTransactions : mockTransactions.filter((t) => t.type === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between h-14 px-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-700" /></button>
          <h1 className="text-base font-semibold text-gray-900">我的钱包</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <Card className="bg-gradient-to-br from-brand-500 to-brand-700 !border-none text-white overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-blue-100 text-sm">账户余额</p><p className="text-3xl font-bold mt-1">¥{balance.toFixed(2)}</p></div>
            <WalletIcon className="w-12 h-12 text-white/20" />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div><p className="text-blue-100 text-xs">累计充值</p><p className="text-lg font-semibold mt-0.5">¥100.00</p></div>
            <div><p className="text-blue-100 text-xs">累计消费</p><p className="text-lg font-semibold mt-0.5">¥62.50</p></div>
          </div>
          <button className="w-full mt-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl font-medium text-white hover:bg-white/30 flex items-center justify-center gap-1">
            <ArrowUpRight className="w-4 h-4" />提现
          </button>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800 flex items-center gap-1.5"><Gift className="w-4 h-4 text-amber-500" />我的优惠券</h3>
            <span className="text-xs text-gray-400">{mockCoupons.length}张可用</span>
          </div>
          <div className="space-y-2.5">
            {mockCoupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${coupon.color} flex flex-col items-center justify-center text-white flex-shrink-0`}>
                  <span className="text-lg font-bold">{coupon.value}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{coupon.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{coupon.condition}</p>
                  <p className="text-xs text-gray-400 mt-0.5">有效期至 {coupon.expireDate}</p>
                </div>
                <button className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">去使用</button>
              </div>
            ))}
          </div>
        </Card>

        <Card padded={false}>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between"><h3 className="font-medium text-gray-800">账单明细</h3></div>
          <div className="flex px-4 gap-1 pb-2">
            {[{ key: 'all' as const, label: '全部' }, { key: 'payment' as const, label: '支出' }, { key: 'topup' as const, label: '充值' }, { key: 'refund' as const, label: '退款' }].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === tab.key ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
            ))}
          </div>
          {filtered.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'payment' ? 'bg-red-50' : tx.type === 'topup' ? 'bg-green-50' : tx.type === 'refund' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                {tx.type === 'payment' ? <TrendingDown className="w-5 h-5 text-red-500" /> : tx.type === 'topup' ? <TrendingUp className="w-5 h-5 text-green-500" /> : tx.type === 'refund' ? <CreditCard className="w-5 h-5 text-blue-500" /> : <Tag className="w-5 h-5 text-amber-500" />}
              </div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">{tx.title}</p><p className="text-xs text-gray-400 mt-0.5">{tx.time}</p></div>
              <span className={`text-base font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>{tx.amount > 0 ? '+' : ''}¥{Math.abs(tx.amount).toFixed(2)}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
