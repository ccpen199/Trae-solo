import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { apiFetch } from '@/lib/api';

interface HotspotCategory {
  category: string;
  items: string[];
  count: number;
  trend: number;
}

const defaultData: HotspotCategory[] = [
  { category: '社保缴费', items: ['缴费基数调整', '跨省转移接续', '补缴流程'], count: 423, trend: 12.5 },
  { category: '就业创业', items: ['失业金申领条件', '创业补贴申请', '就业困难认定'], count: 356, trend: -2.3 },
  { category: '人才服务', items: ['职称评审流程', '高层次人才认定', '技能补贴'], count: 289, trend: 8.7 },
  { category: '劳动关系', items: ['合同签订规范', '工资支付保障', '工伤认定流程'], count: 198, trend: 5.1 },
  { category: '政策咨询', items: ['灵活就业参保', '退休年龄规定', '社保卡办理'], count: 167, trend: -1.8 },
];

const chartData = defaultData.map((d) => ({ category: d.category, count: d.count }));

export default function Hotspot() {
  const [data, setData] = useState<HotspotCategory[]>(defaultData);

  useEffect(() => {
    apiFetch<HotspotCategory[]>('/api/monitor/hotspot').catch(() => defaultData).then((d) => { if (d) setData(d); });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-neutral-800">热点聚类</h1>

      <div className="bg-white border border-neutral-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-neutral-700 mb-4">各类别问题量</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="category" stroke="#a0aec0" fontSize={12} />
            <YAxis stroke="#a0aec0" fontSize={12} />
            <Tooltip />
            <Bar dataKey="count" fill="#1a365d" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {data.map((cat) => (
          <div key={cat.category} className="bg-white border border-neutral-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-800">{cat.category}</h3>
              <div className="flex items-center gap-1">
                {cat.trend >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-danger-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-success-500" />
                )}
                <span className={`text-sm font-medium ${cat.trend >= 0 ? 'text-danger-500' : 'text-success-500'}`}>
                  {cat.trend >= 0 ? '+' : ''}{cat.trend}%
                </span>
                <span className="text-xs text-neutral-400 ml-1">共{cat.count}条</span>
              </div>
            </div>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between py-1.5 px-3 bg-neutral-50 rounded-lg"
                >
                  <span className="text-sm text-neutral-600">{item}</span>
                  <span className="text-xs text-neutral-400">详情 →</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
