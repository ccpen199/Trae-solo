import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Shield } from 'lucide-react';

interface InsuranceStatus {
  type: string;
  status: 'active' | 'ceased';
  baseAmount: number;
  unitName: string;
}

const defaultData: InsuranceStatus[] = [
  { type: '养老保险', status: 'active', baseAmount: 5360, unitName: '北京市社保中心' },
  { type: '医疗保险', status: 'active', baseAmount: 5360, unitName: '北京市医保局' },
  { type: '失业保险', status: 'active', baseAmount: 5360, unitName: '北京市社保中心' },
  { type: '工伤保险', status: 'ceased', baseAmount: 0, unitName: '北京市社保中心' },
  { type: '生育保险', status: 'active', baseAmount: 5360, unitName: '北京市医保局' },
];

export default function Query() {
  const [data, setData] = useState<InsuranceStatus[]>(defaultData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<InsuranceStatus[]>('/api/social-security/status')
      .then(setData)
      .catch(() => setData(defaultData))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">参保状态查询</h1>
      {loading ? (
        <div className="text-center py-12 text-neutral-400">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((item) => (
            <div
              key={item.type}
              className="bg-white border border-neutral-200 rounded-lg p-5 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800">
                    {item.type}
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    经办机构：{item.unitName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-neutral-400">缴费基数</p>
                  <p className="text-sm font-medium text-neutral-700">
                    {item.baseAmount > 0 ? `¥${item.baseAmount.toLocaleString()}` : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      item.status === 'active'
                        ? 'bg-success-500 animate-pulse-dot'
                        : 'bg-neutral-300'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      item.status === 'active' ? 'text-success-600' : 'text-neutral-400'
                    }`}
                  >
                    {item.status === 'active' ? '参保中' : '已停保'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
