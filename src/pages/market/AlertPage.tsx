import React from 'react';
import { BellRing } from 'lucide-react';
import { PriceAlertManager } from '@/components/market/PriceAlertManager';

const AlertPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <BellRing className="w-7 h-7 text-green-600" />
          价格预警订阅
        </h1>
        <p className="text-slate-500 mt-1">设置价格阈值，第一时间获取行情变动提醒</p>
      </div>
      <PriceAlertManager />
    </div>
  );
};

export default AlertPage;
