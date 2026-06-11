import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, AreaChart, Area, Line, Tooltip, XAxis, YAxis } from 'recharts';
import { buyers, properties, pricePredictions } from '@/mock/data';

const buyer = buyers[0];
const radarData = [
  { dimension: '预算匹配', score: Math.min(100, Math.round((buyer.demandProfile.budgetRange[1] / 1500) * 100)) },
  { dimension: '通勤便利', score: Math.min(100, Math.round(((60 - buyer.demandProfile.commuteRadius) / 60) * 100)) },
  { dimension: '学区匹配', score: Math.min(100, buyer.demandProfile.schoolPreference.length * 40) },
  { dimension: '户型偏好', score: Math.min(100, buyer.demandProfile.roomPreference.length * 45) },
];
const zoneColors: Record<string, string> = {
  '客厅': 'bg-primary-400', '主卧': 'bg-gold-400', '次卧': 'bg-status-warning',
  '厨房': 'bg-status-info', '卫生间': 'bg-surface-400', '阳台': 'bg-status-success',
};

export default function BuyerCenter() {
  const favs = buyer.favorites.map((id) => properties.find((p) => p.id === id)).filter(Boolean) as typeof properties;
  const firstPrice = favs[0]?.price ?? 1000;
  const firstArea = favs[0]?.area ?? 90;

  const [downRatio, setDownRatio] = useState(30);
  const [loanYears, setLoanYears] = useState(30);
  const [loanRate, setLoanRate] = useState(3.5);
  const [isFirstHome, setIsFirstHome] = useState(true);
  const [isOverTwoYears, setIsOverTwoYears] = useState(true);
  const [isOverFiveUnique, setIsOverFiveUnique] = useState(false);

  const loanAmount = firstPrice * (1 - downRatio / 100);
  const mRate = loanRate / 100 / 12;
  const months = loanYears * 12;
  let monthlyPay = 0, totalInt = 0;
  if (mRate > 0 && months > 0) {
    const f = Math.pow(1 + mRate, months);
    monthlyPay = loanAmount * mRate * f / (f - 1);
    totalInt = monthlyPay * months - loanAmount;
  }

  const base = firstPrice * 10000;
  const deedRate = isFirstHome ? (firstArea <= 90 ? 0.01 : 0.015) : 0.02;
  const deedTax = base * deedRate;
  const incomeTax = base * (isOverFiveUnique ? 0 : 0.01);
  const vat = base * (isOverTwoYears ? 0 : 0.053);
  const stampTax = base * 0.0005;
  const totalTax = deedTax + incomeTax + vat + stampTax;

  const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <img src={buyer.avatar} alt={buyer.name} className="w-16 h-16 rounded-full border-2 border-gold-400" />
        <div>
          <h1 className="font-serif text-2xl font-bold text-surface-900">{buyer.name}</h1>
          <p className="text-surface-500">{buyer.phone}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="section-title mb-4">需求画像</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#D1D5DB" />
              <PolarAngleAxis dataKey="dimension" tick={{ fill: '#4B5563', fontSize: 13 }} />
              <Radar dataKey="score" stroke="#0D4F4F" fill="#0D4F4F" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-surface-500 mb-2">意向区域</p>
              <div className="flex flex-wrap gap-2">
                {buyer.demandProfile.preferredDistricts.map((d) => (
                  <span key={d} className="bg-primary-50 text-primary-500 text-sm px-3 py-1 rounded-full border border-primary-200">{d}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-surface-500 mb-2">户型偏好</p>
              <div className="flex gap-2">
                {buyer.demandProfile.roomPreference.map((r) => (
                  <span key={r} className="bg-gold-50 text-gold-700 text-sm px-3 py-1 rounded-full border border-gold-200">{r}室</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-surface-500 mb-2">学区偏好</p>
              <div className="flex flex-wrap gap-2">
                {buyer.demandProfile.schoolPreference.map((s) => (
                  <span key={s} className="bg-status-info/10 text-status-info text-sm px-3 py-1 rounded-full border border-status-info/20">{s}</span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-surface-50 rounded-lg p-3">
                <p className="text-xs text-surface-500">预算范围</p>
                <p className="text-sm font-semibold text-surface-800">{buyer.demandProfile.budgetRange[0]}-{buyer.demandProfile.budgetRange[1]}万</p>
              </div>
              <div className="bg-surface-50 rounded-lg p-3">
                <p className="text-xs text-surface-500">通勤中心</p>
                <p className="text-sm font-semibold text-surface-800">{buyer.demandProfile.commuteCenter} {buyer.demandProfile.commuteRadius}分钟</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="section-title mb-4">VR看房记录</h2>
        <div className="space-y-4">
          {buyer.vrHistory.map((vr) => (
            <div key={vr.propertyId} className="border border-surface-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-surface-800">{vr.propertyTitle}</p>
                  <p className="text-xs text-surface-400">{vr.viewedAt} · 观看{vr.totalDuration}秒</p>
                </div>
                <span className="badge-verified">VR</span>
              </div>
              <div className="space-y-2">
                {vr.heatZones.map((hz) => (
                  <div key={hz.zone} className="flex items-center gap-3">
                    <span className="text-xs text-surface-500 w-14 shrink-0">{hz.zone}</span>
                    <div className="flex-1 bg-surface-100 rounded-full h-4 overflow-hidden">
                      <div className={`h-full rounded-full ${zoneColors[hz.zone] || 'bg-surface-400'}`} style={{ width: `${hz.percentage}%` }} />
                    </div>
                    <span className="text-xs text-surface-600 w-12 text-right">{hz.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="section-title mb-4">同小区房价走势</h2>
        <div className="space-y-6">
          {favs.map((p) => {
            const pred = pricePredictions.find((pp) => pp.propertyId === p.id);
            const last = p.priceHistory[p.priceHistory.length - 1];
            const chartData = [
              ...p.priceHistory.slice(0, -1).map((h) => ({ date: h.date, price: h.price })),
              { date: last.date, price: last.price, predictedPrice: last.price, lowerBound: last.price, upperBound: last.price },
              ...(pred ? pred.predictions.map((pr) => ({ date: pr.month, predictedPrice: pr.predictedPrice, lowerBound: pr.lowerBound, upperBound: pr.upperBound })) : []),
            ];
            const lastPred = pred?.predictions[pred.predictions.length - 1];
            return (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-surface-800 text-sm">{p.title}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-surface-500">当前 {p.price}万</span>
                    {lastPred && <span className="text-primary-500">6月后 {lastPred.predictedPrice}万</span>}
                    {pred && <span className="text-gold-500">置信度 {(pred.confidence * 100).toFixed(0)}%</span>}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 10 }} width={45} />
                    <Tooltip />
                    <Area type="monotone" dataKey="price" stroke="#0D4F4F" fill="#0D4F4F" fillOpacity={0.15} strokeWidth={2} connectNulls dot={false} />
                    {pred && <Line type="monotone" dataKey="upperBound" stroke="#D4A017" strokeOpacity={0.35} strokeDasharray="3 3" strokeWidth={1} dot={false} connectNulls />}
                    {pred && <Line type="monotone" dataKey="lowerBound" stroke="#D4A017" strokeOpacity={0.35} strokeDasharray="3 3" strokeWidth={1} dot={false} connectNulls />}
                    {pred && <Line type="monotone" dataKey="predictedPrice" stroke="#D4A017" strokeDasharray="6 3" strokeWidth={2} dot={false} connectNulls />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="section-title mb-4">房贷快速模拟</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-surface-600">首付比例</span><span className="text-gold-500 font-bold">{downRatio}%</span></div>
              <input type="range" min={20} max={80} step={1} value={downRatio} onChange={(e) => setDownRatio(+e.target.value)} className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-surface-600">贷款年限</span><span className="text-gold-500 font-bold">{loanYears}年</span></div>
              <input type="range" min={5} max={30} step={1} value={loanYears} onChange={(e) => setLoanYears(+e.target.value)} className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-surface-600">利率</span><span className="text-gold-500 font-bold">{loanRate.toFixed(1)}%</span></div>
              <input type="range" min={3} max={6} step={0.1} value={loanRate} onChange={(e) => setLoanRate(+e.target.value)} className="w-full h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-primary-500" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-primary-50 rounded-lg p-2 text-center"><p className="text-xs text-primary-600">贷款金额</p><p className="text-sm font-bold text-primary-500">{fmt(loanAmount)}万</p></div>
              <div className="bg-gold-50 rounded-lg p-2 text-center"><p className="text-xs text-gold-600">月供</p><p className="text-sm font-bold text-gold-500">{fmt(monthlyPay * 10000)}元</p></div>
              <div className="bg-surface-50 rounded-lg p-2 text-center"><p className="text-xs text-surface-500">总利息</p><p className="text-sm font-bold text-status-warning">{fmt(totalInt)}万</p></div>
            </div>
          </div>
          <Link to="/buyers/mortgage" className="block mt-3 text-center text-sm text-primary-500 hover:text-primary-600">更多计算 →</Link>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-4">税费快速精算</h2>
          <div className="space-y-3">
            <p className="text-sm text-surface-500">参考房价：<span className="text-gold-500 font-bold">{firstPrice}万</span></p>
            <div className="flex gap-2">
              <button onClick={() => setIsFirstHome(true)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${isFirstHome ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'}`}>首套</button>
              <button onClick={() => setIsFirstHome(false)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${!isFirstHome ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'}`}>二套</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOverTwoYears(true)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${isOverTwoYears ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'}`}>满两年</button>
              <button onClick={() => { setIsOverTwoYears(false); setIsOverFiveUnique(false); }} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${!isOverTwoYears ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'}`}>未满两年</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsOverFiveUnique(true)} disabled={!isOverTwoYears} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${isOverFiveUnique ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'} ${!isOverTwoYears ? 'opacity-50 cursor-not-allowed' : ''}`}>满五唯一</button>
              <button onClick={() => setIsOverFiveUnique(false)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${!isOverFiveUnique ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600'}`}>非满五唯一</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-50 rounded-lg p-2"><p className="text-xs text-surface-500">契税</p><p className="text-sm font-bold text-surface-800">{fmt(deedTax / 10000)}万</p></div>
              <div className="bg-surface-50 rounded-lg p-2"><p className="text-xs text-surface-500">个税</p><p className="text-sm font-bold text-surface-800">{fmt(incomeTax / 10000)}万</p></div>
              <div className="bg-surface-50 rounded-lg p-2"><p className="text-xs text-surface-500">增值税</p><p className="text-sm font-bold text-surface-800">{fmt(vat / 10000)}万</p></div>
              <div className="bg-surface-50 rounded-lg p-2"><p className="text-xs text-surface-500">印花税</p><p className="text-sm font-bold text-surface-800">{fmt(stampTax / 10000)}万</p></div>
            </div>
            <div className="bg-gradient-to-br from-gold-50 to-gold-100 border border-gold-200 rounded-lg p-2 text-center">
              <p className="text-xs text-gold-600">合计</p>
              <p className="text-lg font-bold text-gold-500">{fmt(totalTax / 10000)}万</p>
            </div>
          </div>
          <Link to="/buyers/tax" className="block mt-3 text-center text-sm text-primary-500 hover:text-primary-600">更多计算 →</Link>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="section-title mb-4">收藏房源</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favs.map((p) => (
            <div key={p.id} className="border border-surface-200 rounded-lg p-4 hover:shadow-card-hover transition-shadow">
              <img src={p.images[0]} alt={p.title} className="w-full h-32 object-cover rounded-lg mb-3" />
              <p className="font-medium text-surface-800">{p.title}</p>
              <p className="text-gold-500 font-bold mt-1">{p.price}万</p>
              <p className="text-xs text-surface-400 mt-1">{p.district} · {p.area}㎡ · {p.rooms}室{p.halls}厅</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
