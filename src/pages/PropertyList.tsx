import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, ShieldCheck, Eye, Gavel, ScanEye } from 'lucide-react';
import { properties, agents } from '@/mock/data';

const districts = ['全部区域', '黄浦区', '浦东新区', '徐汇区', '长宁区', '静安区', '杨浦区'];
const roomOptions = [
  { label: '不限', value: 0 },
  { label: '1室', value: 1 },
  { label: '2室', value: 2 },
  { label: '3室', value: 3 },
  { label: '4室+', value: 4 },
];
const verifyOptions = [
  { label: '全部', value: 'all' },
  { label: '已验证', value: 'verified' },
  { label: '待核验', value: 'pending' },
  { label: '异常', value: 'flagged' },
];
const statusMap: Record<string, { label: string; cls: string }> = {
  verified: { label: '已验真', cls: 'badge-verified' },
  pending: { label: '待核验', cls: 'badge-pending' },
  flagged: { label: '异常', cls: 'badge-flagged' },
};
const mortgageMap: Record<string, { label: string; color: string }> = {
  none: { label: '无抵押', color: 'text-green-600 bg-green-50' },
  active: { label: '有抵押', color: 'text-orange-600 bg-orange-50' },
  cleared: { label: '已结清', color: 'text-green-600 bg-green-50' },
};
const seizureMap: Record<string, { label: string; color: string }> = {
  none: { label: '无查封', color: 'text-green-600 bg-green-50' },
  active: { label: '已查封', color: 'text-red-600 bg-red-50' },
};

function scoreColor(score: number) {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}

function MiniBar({ score, label, detail }: { score: number; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 shrink-0 text-surface-500">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-100">
        <div className={`h-full rounded-full ${scoreColor(score)}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-medium text-surface-700">{score}</span>
      <span className="w-24 shrink-0 text-right text-surface-400">{detail}</span>
    </div>
  );
}

function ExpandedDetail({ p }: { p: typeof properties[0] }) {
  const pr = p.propertyRights;
  const v = p.verification;
  const ph = p.priceHistory;
  const minP = Math.min(...ph.map((h) => h.price));
  const maxP = Math.max(...ph.map((h) => h.price));
  const chartData = ph.map((h) => ({ p: h.price }));

  return (
    <div className="space-y-3 border-t border-surface-100 px-4 pt-3 pb-4">
      <div>
        <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-surface-600">
          <ShieldCheck size={13} /> 产权核验
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${mortgageMap[pr.mortgageStatus].color}`}>
            {mortgageMap[pr.mortgageStatus].label}
          </span>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${seizureMap[pr.seizureStatus].color}`}>
            {seizureMap[pr.seizureStatus].label}
          </span>
          <span className="text-xs text-surface-400">核验于 {pr.lastChecked}</span>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center gap-1 text-xs font-medium text-surface-600">
          <ScanEye size={13} /> AI验真明细
        </div>
        <div className="space-y-1.5">
          <MiniBar score={v.priceCrossCheck.score} label="价格比对" detail={`偏差 ${v.priceCrossCheck.deviation}%`} />
          <MiniBar score={v.imageTampering.score} label="图片检测" detail={`${v.imageTampering.flaggedImages.length}张标记`} />
          <MiniBar score={v.agentConsistency.score} label="一致性" detail={`${v.agentConsistency.inconsistentCount}处不符`} />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center gap-1 text-xs font-medium text-surface-600">
          <Gavel size={13} /> 历史成交价格带
        </div>
        <div className="h-[50px] w-full">
          <ResponsiveContainer width="100%" height={50}>
            <AreaChart data={chartData}>
              <Area type="monotone" dataKey="p" stroke="#c9a84c" fill="#c9a84c" fillOpacity={0.18} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between text-xs text-surface-400">
          <span>最低 {minP}万</span>
          <span>最高 {maxP}万</span>
        </div>
      </div>

      {p.vrEnabled && (
        <div className="flex items-center gap-1.5 text-xs">
          <Eye size={13} className="text-primary-500" />
          <span className="rounded bg-primary-50 px-1.5 py-0.5 font-medium text-primary-600">支持VR全景</span>
        </div>
      )}
    </div>
  );
}

export default function PropertyList() {
  const [district, setDistrict] = useState('全部区域');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [rooms, setRooms] = useState(0);
  const [verifyStatus, setVerifyStatus] = useState('all');
  const [vrOnly, setVrOnly] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const filtered = properties.filter((p) => {
    if (district !== '全部区域' && p.district !== district) return false;
    if (priceMin && p.price < Number(priceMin)) return false;
    if (priceMax && p.price > Number(priceMax)) return false;
    if (rooms > 0 && (rooms === 4 ? p.rooms < 4 : p.rooms !== rooms)) return false;
    if (verifyStatus !== 'all' && p.verification.status !== verifyStatus) return false;
    if (vrOnly && !p.vrEnabled) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-surface-500">区域</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="h-9 rounded-lg border border-surface-300 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none"
            >
              {districts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-surface-500">价格（万元）</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="最低"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="h-9 w-20 rounded-lg border border-surface-300 px-2 text-sm focus:border-primary-400 focus:outline-none"
              />
              <span className="text-surface-400">—</span>
              <input
                type="number"
                placeholder="最高"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="h-9 w-20 rounded-lg border border-surface-300 px-2 text-sm focus:border-primary-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-surface-500">户型</span>
            <div className="flex gap-1">
              {roomOptions.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRooms(r.value)}
                  className={`h-9 rounded-lg px-3 text-sm transition-colors ${
                    rooms === r.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-surface-500">验真状态</span>
            <div className="flex gap-1">
              {verifyOptions.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setVerifyStatus(v.value)}
                  className={`h-9 rounded-lg px-3 text-sm transition-colors ${
                    verifyStatus === v.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-surface-500">VR</span>
            <button
              onClick={() => setVrOnly(!vrOnly)}
              className={`h-9 rounded-lg px-4 text-sm transition-colors ${
                vrOnly ? 'bg-primary-500 text-white' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              有VR
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const st = statusMap[p.verification.status];
          const agent = agents.find((a) => a.id === p.agentId);
          const expanded = expandedCardId === p.id;
          return (
            <div key={p.id} className="card overflow-hidden">
              <Link to={`/properties/${p.id}`} className="block">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-card opacity-0" />
                  <span className={`absolute left-3 top-3 ${st.cls}`}>{st.label}</span>
                  {p.vrEnabled && (
                    <span className="absolute right-3 top-3 rounded-full bg-primary-500/90 px-2 py-0.5 text-xs font-medium text-white">
                      VR
                    </span>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/properties/${p.id}`} className="font-serif text-base font-semibold text-surface-800 hover:text-primary-600">
                    {p.title}
                  </Link>
                  <button
                    onClick={() => setExpandedCardId(expanded ? null : p.id)}
                    className="mt-0.5 shrink-0 rounded p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                <p className="mt-1 text-sm text-surface-500">{p.address}</p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-gold-500">{p.price}</span>
                  <span className="text-sm text-gold-600">万元</span>
                </div>
                <p className="mt-1 text-xs text-surface-400">{p.unitPrice} 万/㎡</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-surface-500">
                  <span className="rounded bg-surface-100 px-2 py-0.5">{p.rooms}室{p.halls}厅</span>
                  <span className="rounded bg-surface-100 px-2 py-0.5">{p.area}㎡</span>
                  <span className="rounded bg-surface-100 px-2 py-0.5">{p.orientation}</span>
                </div>
                <p className="mt-3 text-xs text-surface-400">经纪人：{agent?.name ?? p.agentId}</p>
              </div>
              {expanded && <ExpandedDetail p={p} />}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center text-surface-400">暂无符合条件的房源</div>
      )}
    </div>
  );
}
