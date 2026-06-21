import React from 'react';
import { LineChart } from 'lucide-react';
import { PriceTrendChart } from '@/components/market/PriceTrendChart';

const TrendPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <LineChart className="w-7 h-7 text-green-600" />
          历史走势对比
        </h1>
        <p className="text-slate-500 mt-1">多品类价格趋势叠加分析，辅助决策判断</p>
      </div>
      <PriceTrendChart />
    </div>
  );
};

export default TrendPage;
