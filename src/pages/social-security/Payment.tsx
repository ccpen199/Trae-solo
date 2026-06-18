import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ChevronDown } from 'lucide-react';

interface Payment {
  period: string;
  type: string;
  amount: number;
  paidDate: string;
}

const defaultData: Payment[] = [
  { period: '2026-05', type: '养老保险', amount: 1072.00, paidDate: '2026-05-15' },
  { period: '2026-05', type: '医疗保险', amount: 536.00, paidDate: '2026-05-15' },
  { period: '2026-05', type: '失业保险', amount: 53.60, paidDate: '2026-05-15' },
  { period: '2026-04', type: '养老保险', amount: 1072.00, paidDate: '2026-04-15' },
  { period: '2026-04', type: '医疗保险', amount: 536.00, paidDate: '2026-04-15' },
  { period: '2026-04', type: '失业保险', amount: 53.60, paidDate: '2026-04-15' },
  { period: '2026-03', type: '养老保险', amount: 1072.00, paidDate: '2026-03-15' },
  { period: '2026-03', type: '医疗保险', amount: 536.00, paidDate: '2026-03-15' },
  { period: '2026-03', type: '失业保险', amount: 53.60, paidDate: '2026-03-15' },
];

export default function Payment() {
  const [data, setData] = useState<Payment[]>(defaultData);
  const [year, setYear] = useState('2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<Payment[]>(`/api/social-security/payments?year=${year}`)
      .then(setData)
      .catch(() => setData(defaultData))
      .finally(() => setLoading(false));
  }, [year]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-800">缴费记录查询</h1>
        <div className="relative">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="appearance-none bg-white border border-neutral-300 rounded-lg px-4 py-2 pr-8 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="2026">2026年</option>
            <option value="2025">2025年</option>
            <option value="2024">2024年</option>
          </select>
          <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-400">加载中...</div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">缴费期</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">险种</th>
                <th className="text-right px-5 py-3 text-sm font-medium text-neutral-600">金额（元）</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-neutral-600">缴费日期</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  <td className="px-5 py-3 text-sm text-neutral-700">{row.period}</td>
                  <td className="px-5 py-3 text-sm text-neutral-700">{row.type}</td>
                  <td className="px-5 py-3 text-sm text-neutral-700 text-right">
                    ¥{row.amount.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-sm text-neutral-500">{row.paidDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && (
            <div className="text-center py-12 text-neutral-400">暂无记录</div>
          )}
        </div>
      )}
    </div>
  );
}
