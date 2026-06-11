import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { agents } from '@/mock/data';
import { Phone, MapPin, Award, Building2, CheckCircle2, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const tabList = ['基本信息', '带看记录', '信用历史'] as const;

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: 'bg-gold-100 text-gold-700' },
  confirmed: { label: '进行中', color: 'bg-primary-50 text-primary-500' },
  completed: { label: '已完成', color: 'bg-green-50 text-status-success' },
  cancelled: { label: '已取消', color: 'bg-red-50 text-status-danger' },
};

function CreditRing({ score, size = 48 }: { score: number; size?: number }) {
  const radius = size - 8;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const stroke = score > 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';
  const color = score > 80 ? 'text-status-success' : score >= 60 ? 'text-status-warning' : 'text-status-danger';
  const viewBox = size * 2;
  const center = size;
  return (
    <div className="relative flex items-center justify-center" style={{ width: viewBox, height: viewBox }}>
      <svg className="-rotate-90" width={viewBox} height={viewBox} viewBox={`0 0 ${viewBox} ${viewBox}`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#E8EAED" strokeWidth="8" />
        <circle cx={center} cy={center} r={radius} fill="none" stroke={stroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-surface-500">信用分</span>
      </div>
    </div>
  );
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const agent = agents.find((a) => a.id === id);
  const [activeTab, setActiveTab] = useState<(typeof tabList)[number]>('基本信息');

  if (!agent) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="text-surface-400 text-lg">未找到该经纪人信息</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-header rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="flex items-center gap-6">
            <img src={agent.avatar} alt={agent.name} className="w-24 h-24 rounded-full object-cover border-3 border-gold-300 ring-2 ring-gold-400" />
            <div className="flex-1 space-y-2">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Building2 className="w-4 h-4" />
                <span>{agent.storeName}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <Phone className="w-4 h-4" />
                <span>{agent.phone}</span>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1 text-sm text-white/90">
                  <Award className="w-4 h-4 text-gold-300" />
                  <span>成交 {agent.totalTransactions} 套</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-white/90">
                  <Eye className="w-4 h-4 text-gold-300" />
                  <span>带看 {agent.viewingsCompleted} 次</span>
                </div>
              </div>
            </div>
            <CreditRing score={agent.creditScore} size={36} />
          </div>
        </div>

        <div className="flex gap-2">
          {tabList.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-sm rounded-lg font-medium transition-colors ${activeTab === tab ? 'bg-primary-500 text-white shadow-card' : 'bg-surface-50 text-surface-600 hover:bg-surface-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === '基本信息' && (
          <div className="bg-surface-50 rounded-xl shadow-card p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-surface-500 mb-2">擅长领域</h3>
              <div className="flex flex-wrap gap-2">
                {agent.specializations.map((s) => (
                  <span key={s} className="px-3 py-1 text-sm rounded-full bg-primary-50 text-primary-600 border border-primary-200">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-500 mb-2">服务区域</h3>
              <div className="flex flex-wrap gap-2">
                {agent.serviceAreas.map((a) => (
                  <span key={a} className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-surface-100 text-surface-700 border border-surface-200">
                    <MapPin className="w-3 h-3" />{a}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-200">
              <div className="text-center p-4 rounded-lg bg-surface-50 border border-surface-200">
                <div className="text-2xl font-bold text-primary-700">{agent.totalTransactions}</div>
                <div className="text-sm text-surface-500 mt-1">累计成交</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-surface-50 border border-surface-200">
                <div className="text-2xl font-bold text-gold-500">{agent.viewingsCompleted}</div>
                <div className="text-sm text-surface-500 mt-1">带看完成</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === '带看记录' && (
          <div className="bg-surface-50 rounded-xl shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-100 text-surface-500">
                  <th className="text-left px-4 py-3 font-medium">房源</th>
                  <th className="text-left px-4 py-3 font-medium">客户</th>
                  <th className="text-left px-4 py-3 font-medium">预约时间</th>
                  <th className="text-center px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {agent.recentViewings.map((v) => {
                  const st = statusMap[v.status];
                  return (
                    <tr key={v.id} className="border-t border-surface-100 hover:bg-surface-50">
                      <td className="px-4 py-3 font-medium text-primary-800">{v.propertyTitle}</td>
                      <td className="px-4 py-3 text-surface-600">{v.clientName}</td>
                      <td className="px-4 py-3 text-surface-500">{v.scheduledAt}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {agent.recentViewings.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 text-surface-400">暂无带看记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === '信用历史' && (
          <div className="bg-surface-50 rounded-xl shadow-card p-6">
            <h3 className="text-sm font-semibold text-surface-500 mb-4">信用分趋势</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={[...agent.creditHistory].reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E8EAED', fontSize: '12px' }} />
                <Line type="monotone" dataKey="score" stroke="#0D4F4F" strokeWidth={2} dot={{ fill: '#0D4F4F', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {agent.creditHistory.map((c) => (
                <div key={c.date} className="flex items-center justify-between text-sm py-2 border-b border-surface-100 last:border-0">
                  <span className="text-surface-500">{c.date}</span>
                  <span className="font-medium text-primary-700">{c.score}分</span>
                  <span className={`text-xs font-medium ${c.change > 0 ? 'text-status-success' : c.change < 0 ? 'text-status-danger' : 'text-surface-400'}`}>
                    {c.change > 0 ? `+${c.change}` : c.change}
                  </span>
                  <span className="text-surface-400 text-xs">{c.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
