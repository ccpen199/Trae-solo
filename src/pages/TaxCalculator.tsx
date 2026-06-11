import { useState } from 'react';

interface TaxItem {
  name: string;
  rate: string;
  base: number;
  amount: number;
}

export default function TaxCalculator() {
  const [totalPrice, setTotalPrice] = useState(1000);
  const [isFirstHome, setIsFirstHome] = useState(true);
  const [area, setArea] = useState(90);
  const [isOverTwoYears, setIsOverTwoYears] = useState(true);
  const [isOverFiveUnique, setIsOverFiveUnique] = useState(false);

  const base = totalPrice * 10000;

  let deedTaxRate = 0;
  if (isFirstHome) {
    deedTaxRate = area <= 90 ? 0.01 : 0.015;
  } else {
    deedTaxRate = 0.02;
  }

  const incomeTaxRate = isOverFiveUnique ? 0 : 0.01;
  const vatRate = isOverTwoYears ? 0 : 0.053;
  const stampTaxRate = 0.0005;
  const registrationFee = 80;

  const deedTax = base * deedTaxRate;
  const incomeTax = base * incomeTaxRate;
  const vat = base * vatRate;
  const stampTax = base * stampTaxRate;
  const totalTax = deedTax + incomeTax + vat + stampTax + registrationFee;

  const taxItems: TaxItem[] = [
    { name: '契税', rate: `${(deedTaxRate * 100).toFixed(1)}%`, base, amount: deedTax },
    { name: '个人所得税', rate: `${(incomeTaxRate * 100).toFixed(1)}%`, base, amount: incomeTax },
    { name: '增值税', rate: `${(vatRate * 100).toFixed(1)}%`, base, amount: vat },
    { name: '印花税', rate: `${(stampTaxRate * 100).toFixed(2)}%`, base, amount: stampTax },
    { name: '登记费', rate: '固定', base: 0, amount: registrationFee },
  ];

  const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-surface-900">税费精算器</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">房屋总价</label>
              <span className="text-gold-500 font-bold">{totalPrice}万</span>
            </div>
            <input type="range" min={100} max={3000} step={10} value={totalPrice}
              onChange={(e) => setTotalPrice(Number(e.target.value))}
              className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>100万</span><span>3000万</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-surface-700 block mb-2">是否首套</label>
            <div className="flex gap-3">
              <button onClick={() => setIsFirstHome(true)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isFirstHome ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                首套
              </button>
              <button onClick={() => setIsFirstHome(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isFirstHome ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                二套/三套
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-surface-700">房屋面积</label>
              <span className="text-gold-500 font-bold">{area}㎡</span>
            </div>
            <input type="range" min={20} max={300} step={1} value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            <div className="flex justify-between text-xs text-surface-400 mt-1">
              <span>20㎡</span><span>300㎡</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-surface-700 block mb-2">是否满两年</label>
            <div className="flex gap-3">
              <button onClick={() => { setIsOverTwoYears(true); if (!true) setIsOverFiveUnique(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isOverTwoYears ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                满两年
              </button>
              <button onClick={() => { setIsOverTwoYears(false); setIsOverFiveUnique(false); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isOverTwoYears ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                未满两年
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-surface-700 block mb-2">是否满五年唯一</label>
            <div className="flex gap-3">
              <button onClick={() => setIsOverFiveUnique(true)}
                disabled={!isOverTwoYears}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isOverFiveUnique ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'} ${!isOverTwoYears ? 'opacity-50 cursor-not-allowed' : ''}`}>
                满五唯一
              </button>
              <button onClick={() => setIsOverFiveUnique(false)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${!isOverFiveUnique ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}>
                非满五唯一
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title mb-4">税费明细</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-2 text-surface-500 font-medium">税种</th>
                  <th className="text-right py-2 text-surface-500 font-medium">税率</th>
                  <th className="text-right py-2 text-surface-500 font-medium">计税基数</th>
                  <th className="text-right py-2 text-surface-500 font-medium">金额</th>
                </tr>
              </thead>
              <tbody>
                {taxItems.map((item) => (
                  <tr key={item.name} className="border-b border-surface-100">
                    <td className="py-3 text-surface-800 font-medium">{item.name}</td>
                    <td className="py-3 text-right text-surface-600">{item.rate}</td>
                    <td className="py-3 text-right text-surface-600">{item.base > 0 ? `${(item.base / 10000).toFixed(0)}万` : '-'}</td>
                    <td className="py-3 text-right text-gold-500 font-semibold">{item.amount >= 10000 ? `${fmt(item.amount / 10000)}万` : `${item.amount}元`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card p-6 bg-gradient-to-br from-gold-50 to-gold-100 border-gold-200">
            <p className="text-sm text-gold-700 mb-2">应缴税费总计</p>
            <p className="text-4xl font-bold text-gold-500">
              {totalTax >= 10000 ? `${fmt(totalTax / 10000)}` : fmt(totalTax)}
              <span className="text-lg ml-1">{totalTax >= 10000 ? '万' : '元'}</span>
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-gold-600">
              <span>契税: {fmt(deedTax / 10000)}万</span>
              <span>个税: {fmt(incomeTax / 10000)}万</span>
              <span>增值税: {fmt(vat / 10000)}万</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
