import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { properties, agents, pricePredictions } from '@/mock/data';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';

const statusMap: Record<string, { label: string; cls: string; color: string }> = {
  verified: { label: '已验真', cls: 'badge-verified', color: '#10B981' },
  pending: { label: '待核验', cls: 'badge-pending', color: '#F59E0B' },
  flagged: { label: '异常', cls: 'badge-flagged', color: '#EF4444' },
};

const mortgageMap: Record<string, { label: string; color: string }> = {
  none: { label: '无抵押', color: 'text-status-success' },
  active: { label: '有抵押', color: 'text-status-warning' },
  cleared: { label: '已结清', color: 'text-status-success' },
};

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#E8EAED" strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-sm font-medium text-surface-600">{label}</span>
    </div>
  );
}

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const property = properties.find((p) => p.id === id);
  const [mainImg, setMainImg] = useState(0);

  if (!property) {
    return <div className="py-20 text-center text-surface-400">未找到该房源</div>;
  }

  const agent = agents.find((a) => a.id === property.agentId);
  const prediction = pricePredictions.find((pr) => pr.propertyId === property.id);
  const st = statusMap[property.verification.status];
  const mtg = mortgageMap[property.propertyRights.mortgageStatus];

  const chartData = property.priceHistory.map((h) => ({
    date: h.date,
    price: h.price,
    type: h.type,
  }));

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/3">
            <img src={property.images[mainImg]} alt={property.title}
              className="h-72 w-full object-cover md:h-96" />
          </div>
          {property.images.length > 1 && (
            <div className="flex flex-row gap-2 p-3 md:w-1/3 md:flex-col md:overflow-y-auto">
              {property.images.map((img, i) => (
                <img key={i} src={img} alt={`缩略图${i + 1}`}
                  onClick={() => setMainImg(i)}
                  className={`h-16 w-24 cursor-pointer rounded-lg object-cover transition-opacity ${
                    i === mainImg ? 'ring-2 ring-primary-500 opacity-100' : 'opacity-60 hover:opacity-90'
                  }`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-start justify-between p-5">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-serif text-2xl font-bold text-surface-800">{property.title}</h1>
              <span className={st.cls}>{st.label}</span>
              {property.vrEnabled && (
                <button className="rounded-full bg-primary-500 px-3 py-1 text-xs font-medium text-white hover:bg-primary-600">
                  VR看房
                </button>
              )}
            </div>
            <p className="mt-2 text-sm text-surface-500">{property.address}</p>
            <div className="mt-2 flex gap-3 text-sm text-surface-500">
              <span>{property.rooms}室{property.halls}厅</span>
              <span>{property.area}㎡</span>
              <span>{property.orientation}</span>
              <span>{property.floor}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gold-500">{property.price}</span>
              <span className="text-sm text-gold-600">万元</span>
            </div>
            <p className="text-sm text-surface-400">{property.unitPrice} 万/㎡</p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-5">AI验真报告</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <ScoreCircle score={property.verification.priceCrossCheck.score}
            label="价格交叉比对" color={st.color} />
          <ScoreCircle score={property.verification.imageTampering.score}
            label="图片篡改检测" color={st.color} />
          <ScoreCircle score={property.verification.agentConsistency.score}
            label="经纪人一致性" color={st.color} />
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
          <div className="rounded-lg bg-surface-50 p-3">
            <p className="text-surface-500">偏差率：{property.verification.priceCrossCheck.deviation}%</p>
            <p className="mt-1 text-surface-400">对比平台 {property.verification.priceCrossCheck.sources.length} 个</p>
          </div>
          <div className="rounded-lg bg-surface-50 p-3">
            <p className="text-surface-500">
              标记图片：{property.verification.imageTampering.flaggedImages.length} 张
            </p>
            {property.verification.imageTampering.issues.length > 0 && (
              <p className="mt-1 text-status-danger">
                {property.verification.imageTampering.issues[0]}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-surface-50 p-3">
            <p className="text-surface-500">
              在售房源：{property.verification.agentConsistency.totalListings} 套
            </p>
            <p className="mt-1 text-surface-400">
              不一致：{property.verification.agentConsistency.inconsistentCount} 套
            </p>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-5">产权核验</h2>
        <div className="flex gap-6 text-sm">
          <div><span className="text-surface-500">抵押状态：</span><span className={mtg.color}>{mtg.label}</span></div>
          <div><span className="text-surface-500">查封状态：</span>
            <span className={property.propertyRights.seizureStatus === 'none' ? 'text-status-success' : 'text-status-danger'}>
              {property.propertyRights.seizureStatus === 'none' ? '无查封' : '已查封'}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {property.propertyRights.ownershipChain.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="rounded-lg bg-surface-50 px-3 py-2 text-sm">
                <p className="font-medium text-surface-700">{o.owner}</p>
                <p className="text-xs text-surface-400">{o.startDate} ~ {o.endDate || '至今'}</p>
                <p className="text-xs text-surface-400">{o.type === 'purchase' ? '购买' : o.type === 'inherit' ? '继承' : '转让'}</p>
              </div>
              {i < property.propertyRights.ownershipChain.length - 1 && (
                <span className="text-surface-300">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="section-title mb-5">价格分析</h2>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4A843" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <Tooltip />
            <Area type="monotone" dataKey="price" stroke="#D4A843" fill="url(#priceGrad)"
              strokeWidth={2} dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.type === 'transaction') {
                  return <circle key={payload.date} cx={cx} cy={cy} r={5} fill="#0D4F4F" stroke="#fff" strokeWidth={2} />;
                }
                return <circle key={payload.date} cx={cx} cy={cy} r={3} fill="#D4A843" />;
              }} />
          </AreaChart>
        </ResponsiveContainer>
        {prediction && (
          <p className="mt-2 text-xs text-surface-400">
            AI预测置信度：{(prediction.confidence * 100).toFixed(0)}%
          </p>
        )}
      </div>

      {agent && (
        <div className="card p-5">
          <h2 className="section-title mb-5">经纪人信息</h2>
          <div className="flex items-start gap-5">
            <img src={agent.avatar} alt={agent.name}
              className="h-16 w-16 rounded-full object-cover" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-surface-800">{agent.name}</h3>
              <p className="text-sm text-surface-500">{agent.storeName}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="relative h-12 w-12">
                  <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#E8EAED" strokeWidth="4" />
                    <circle cx="24" cy="24" r="20" fill="none" stroke="#10B981" strokeWidth="4"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={2 * Math.PI * 20 - (agent.creditScore / 100) * 2 * Math.PI * 20}
                      strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-status-success">
                    {agent.creditScore}
                  </span>
                </div>
                <span className="text-sm text-surface-500">信用分</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {agent.specializations.map((s) => (
                  <span key={s} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-500">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
