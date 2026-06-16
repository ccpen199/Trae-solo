import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { adminApi, merchantApi } from '../../api';
import { Card, Badge, Button } from '../../components/ui';
import { formatTime } from '../../utils/format';
import { useNavigate } from 'react-router-dom';

interface Topic {
  id: string;
  name: string;
  postCount: number;
  heatScore: number;
  isHot: boolean;
}

interface Hotspot {
  topic: string;
  heatScore: number;
  postCount: number;
  topPosts: any[];
}

const GovernanceDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<any>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [merchants, setMerchants] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, hs, mr] = await Promise.all([
        adminApi.dashboardOverview(),
        adminApi.dashboardHotspots(),
        merchantApi.nearby({ latitude: 39.9939, longitude: 116.4778, radius: 100000, limit: 100 }),
      ]);
      setOverview(ov);
      setHotspots(hs.topicClusters || []);
      setRisks(hs.risks || []);
      setMerchants(mr.merchants || mr || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="text-slate-500">加载治理驾驶舱数据...</div>
      </Card>
    );
  }

  const COLORS = ['#f97316', '#ef4444', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  const trendData = overview?.trendData || [];
  const stats = overview?.stats || {};
  const hotTopics = overview?.hotTopics || [];

  const pieData = [
    { name: '已通过', value: stats.approvedCount || 0, color: '#22c55e' },
    { name: '待审核', value: stats.pendingCount || 0, color: '#eab308' },
    { name: '已拒绝', value: stats.rejectedCount || 0, color: '#ef4444' },
  ];

  const radarData = hotTopics.slice(0, 6).map((t: Topic) => ({
    subject: t.name.length > 6 ? t.name.slice(0, 6) + '...' : t.name,
    A: t.postCount,
    B: Math.round(t.heatScore / 10),
    fullMark: 100,
  }));

  const statCards = [
    { label: '用户总数', value: stats.userCount || 0, icon: '👥', color: 'from-blue-400 to-blue-600', bg: 'bg-blue-50' },
    { label: '商户总数', value: stats.merchantCount || 0, icon: '🏪', color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50' },
    { label: '内容总数', value: stats.postCount || 0, icon: '📝', color: 'from-green-400 to-green-600', bg: 'bg-green-50' },
    { label: '今日发帖', value: stats.todayPosts || 0, icon: '📅', color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50' },
    { label: '紧急求助', value: stats.emergencyRequests || 0, icon: '🚨', color: 'from-red-400 to-red-600', bg: 'bg-red-50' },
    { label: '审核通过率', value: (stats.approvalRate || 0).toFixed(1) + '%', icon: '✅', color: 'from-teal-400 to-teal-600', bg: 'bg-teal-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">社区治理驾驶舱</h1>
          <p className="text-sm text-slate-500 mt-1">实时掌握社区动态 · 智能预警风险事件</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">商户分析跳转：</span>
            <select
              value={selectedMerchantId}
              onChange={e => setSelectedMerchantId(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg"
            >
              <option value="">选择商户</option>
              {merchants.filter(m => m.status === 'APPROVED').map((m: any) => (
                <option key={m.id} value={m.id}>{m.businessName}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              disabled={!selectedMerchantId}
              onClick={() => selectedMerchantId && navigate(`/admin/merchant/${selectedMerchantId}`)}
            >
              查看分析
            </Button>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            🔄 刷新数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <Card key={i} className="overflow-hidden">
            <div className={`${card.bg} p-4`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-slate-600">{card.label}</div>
                  <div className="text-2xl font-bold text-slate-800 mt-1.5">{card.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-lg`}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">近7天发帖趋势</h3>
            <Badge className="bg-primary-50 text-primary-700">实时更新</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="发帖数"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-bold text-slate-800 mb-4">内容状态分布</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }}></div>
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="font-bold text-slate-800 mb-4">🔥 热门话题热度雷达</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" fontSize={11} stroke="#64748b" />
                <PolarRadiusAxis fontSize={10} stroke="#94a3b8" />
                <Radar name="帖子数" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="热度分" dataKey="B" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-slate-400 py-16 text-sm">暂无话题数据</div>
          )}
        </Card>

        <Card className="p-5 col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">📊 热门话题排行</h3>
            <span className="text-xs text-slate-500">TOP 10</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hotTopics.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={11}
                width={90}
              />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="postCount" name="帖子数" fill="#f97316" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">🎯 热点话题聚类</h3>
            <Badge className="bg-orange-50 text-orange-700">{hotspots.length} 个聚类</Badge>
          </div>
          <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
            {hotspots.map((hs, i) => (
              <div key={i} className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {hs.heatScore >= 500 ? '🔥' : hs.heatScore >= 200 ? '⭐' : '📌'}
                    </span>
                    <span className="font-medium text-slate-800">#{hs.topic}</span>
                    <Badge className="bg-primary-50 text-primary-700">
                      {hs.postCount} 帖
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <span className="text-orange-600 font-bold">{hs.heatScore}</span>
                    <span className="text-xs text-slate-400 ml-1">热度</span>
                  </div>
                </div>
                {hs.topPosts?.length > 0 && (
                  <div className="space-y-1.5 ml-7">
                    {hs.topPosts.slice(0, 3).map((p: any, j: number) => (
                      <div key={j} className="text-xs text-slate-600 truncate">
                        <span className="text-slate-400 mr-1.5">{p.user?.nickname}:</span>
                        {p.title || p.content?.slice(0, 40)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {hotspots.length === 0 && (
              <div className="text-center text-slate-400 py-12 text-sm">暂无热点聚类</div>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">⚠️ 风险事件预警</h3>
            <Badge className="bg-red-50 text-red-700">近7天 {risks.length} 条</Badge>
          </div>
          <div className="space-y-3 max-h-[460px] overflow-auto pr-1">
            {risks.map((risk, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border ${
                  risk.riskLevel === 'CRITICAL'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge className={risk.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>
                      {risk.riskLevel === 'CRITICAL' ? '🔴 极高风险' : '🟠 高风险'}
                    </Badge>
                    <Badge className="bg-white/60 text-slate-600">
                      {risk.action === 'RUMOR_FLAG' ? '谣言标记' : risk.action === 'MANUAL_REJECT' ? '人工拒绝' : 'AI拦截'}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatTime(risk.createdAt)}
                  </span>
                </div>
                <div className="text-sm text-slate-700 font-medium line-clamp-1 mb-1">
                  {risk.post?.title || risk.post?.content?.slice(0, 50)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    发布者: <span className="text-slate-700">{risk.post?.user?.nickname}</span>
                  </span>
                  {risk.auditor && (
                    <span className="text-slate-500">
                      处理人: <span className="text-slate-700">{risk.auditor.nickname}</span>
                    </span>
                  )}
                </div>
                {risk.reason && (
                  <div className="mt-2 text-xs text-slate-600 p-2 bg-white/50 rounded-lg">
                    <span className="text-slate-400">原因: </span>{risk.reason}
                  </div>
                )}
              </div>
            ))}
            {risks.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">✅</div>
                <div className="text-sm text-green-600 font-medium">近7天无风险事件</div>
                <div className="text-xs text-slate-400 mt-1">社区内容环境健康</div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GovernanceDashboard;
