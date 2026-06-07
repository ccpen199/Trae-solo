import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Shield, CreditCard, Activity, Loader2 } from 'lucide-react';

const mockPayments = [
  { month: '2026-01', base: 4580, personal: 458, total: 5038 },
  { month: '2026-02', base: 4580, personal: 458, total: 5038 },
  { month: '2026-03', base: 4580, personal: 458, total: 5038 },
  { month: '2026-04', base: 4580, personal: 458, total: 5038 },
  { month: '2026-05', base: 4580, personal: 458, total: 5038 },
  { month: '2026-06', base: 4580, personal: 458, total: 5038 },
];

interface SocialSecurityData {
  card_number: string;
  insurance_type: string;
  months: number;
  medical_balance: number;
}

export default function SocialSecurity() {
  const [data, setData] = useState<SocialSecurityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<SocialSecurityData>('/social-security/info');
        setData(res);
      } catch {
        setData({
          card_number: '3201**********5678',
          insurance_type: '城镇职工基本养老保险',
          months: 86,
          medical_balance: 12680.50,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="font-serif-cn text-2xl font-bold text-warm-800 mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        社保查询
      </h1>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm text-warm-500 mb-3">社保账户信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-warm-100">
              <span className="text-sm text-warm-600">社保卡号</span>
              <span className="text-sm font-mono font-medium text-warm-800">
                {data?.card_number}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-warm-100">
              <span className="text-sm text-warm-600">参保类型</span>
              <span className="text-sm text-warm-800">{data?.insurance_type}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-warm-600">累计缴费月数</span>
              <span className="text-lg font-bold text-primary">{data?.months}个月</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary-light rounded-lg shadow-sm p-6 text-white">
          <h2 className="text-sm opacity-80 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            医保个人账户
          </h2>
          <p className="text-3xl font-bold mb-1">
            ¥{data?.medical_balance.toFixed(2)}
          </p>
          <p className="text-sm opacity-70">账户余额</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-md p-3">
              <p className="text-xs opacity-70">本年入账</p>
              <p className="text-lg font-semibold">¥2,748.00</p>
            </div>
            <div className="bg-white/10 rounded-md p-3">
              <p className="text-xs opacity-70">本年支出</p>
              <p className="text-lg font-semibold">¥1,320.00</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          缴费记录
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-warm-200">
                <th className="text-left py-3 px-4 text-warm-500 font-medium">月份</th>
                <th className="text-right py-3 px-4 text-warm-500 font-medium">基数</th>
                <th className="text-right py-3 px-4 text-warm-500 font-medium">个人</th>
                <th className="text-right py-3 px-4 text-warm-500 font-medium">合计</th>
              </tr>
            </thead>
            <tbody>
              {mockPayments.map((p) => (
                <tr key={p.month} className="border-b border-warm-50 hover:bg-warm-50">
                  <td className="py-3 px-4 text-warm-800">{p.month}</td>
                  <td className="py-3 px-4 text-right text-warm-700">¥{p.base.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right text-warm-700">¥{p.personal.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-medium text-primary">
                    ¥{p.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
