import React, { useState, useEffect } from 'react';
import { Users, Star, Home, Award, Phone, MessageCircle, ShieldAlert, TrendingUp, X } from 'lucide-react';
import { api } from '@/lib/api';

const getCreditGrade = (score: number) => {
  if (score >= 95) return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-100', ring: 'stroke-green-500' };
  if (score >= 85) return { grade: 'A', color: 'text-blue-600', bg: 'bg-blue-100', ring: 'stroke-blue-500' };
  if (score >= 70) return { grade: 'B', color: 'text-yellow-600', bg: 'bg-yellow-100', ring: 'stroke-yellow-500' };
  if (score >= 50) return { grade: 'C', color: 'text-orange-600', bg: 'bg-orange-100', ring: 'stroke-orange-500' };
  return { grade: 'D', color: 'text-red-600', bg: 'bg-red-100', ring: 'stroke-red-500' };
};

const CircularProgress: React.FC<{ value: number; size?: number; strokeWidth?: number; grade: ReturnType<typeof getCreditGrade> }> = ({
  value, size = 80, strokeWidth = 6, grade
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" className={grade.ring} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-lg font-bold ${grade.color}`}>{value}</span>
        <span className={`text-xs font-medium ${grade.color}`}>{grade.grade}</span>
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ value: number; max?: number; color?: string }> = ({ value, max = 100, color = 'bg-blue-500' }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={12} className={i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
    ))}
  </div>
);

const AgentDetailModal: React.FC<{
  agent: any;
  onClose: () => void;
}> = ({ agent, onClose }) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [agent.id]);

  const loadDetail = async () => {
    const [detailRes, creditRes] = await Promise.all([
      api.agents.detail(agent.id),
      api.agents.credit(agent.id),
    ]);
    const data: any = {};
    if (detailRes.success && detailRes.data) {
      const dd = detailRes.data as any;
      data.agent = dd.agent;
      data.reviews = dd.reviews || [];
      data.properties = dd.properties || [];
      data.risk_controls = dd.risk_controls || [];
    }
    if (creditRes.success && creditRes.data) {
      const cd = creditRes.data as any;
      data.credit_weight = cd.credit_weight;
      data.credit_weight_formula = cd.credit_weight_formula;
    }
    setDetail(data);
    setLoading(false);
  };

  const grade = getCreditGrade(agent.credit_score ?? 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">经纪人详情</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">加载中...</div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="text-blue-600" size={32} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{detail.agent?.real_name || agent.real_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${grade.color} ${grade.bg}`}>
                    信用{grade.grade}
                  </span>
                  {detail.risk_controls?.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                      <ShieldAlert size={12} />风控预警
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{detail.agent?.agency_name || agent.agency_name}</p>
                <p className="text-sm text-gray-500 mt-1">{detail.agent?.introduction || agent.introduction || '暂无简介'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-600">{detail.agent?.total_deals ?? agent.total_deals}</div>
                <div className="text-xs text-gray-500">成交套数</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600">{detail.agent?.conversion_rate ?? agent.conversion_rate}%</div>
                <div className="text-xs text-gray-500">转化率</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-yellow-600">{detail.agent?.average_rating ?? agent.average_rating}</div>
                <div className="text-xs text-gray-500">平均评分</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-purple-600">{detail.agent?.review_count ?? agent.review_count}</div>
                <div className="text-xs text-gray-500">评价数</div>
              </div>
            </div>

            {detail.credit_weight_formula && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />信用权重分析
                </h4>
                <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">转化率权重（40%）</span>
                    <span className="font-medium">{detail.credit_weight_formula.conversion_rate_weight}</span>
                  </div>
                  <ProgressBar value={detail.credit_weight_formula.conversion_rate_weight} max={40} color="bg-blue-500" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">评分权重（30%）</span>
                    <span className="font-medium">{detail.credit_weight_formula.rating_weight}</span>
                  </div>
                  <ProgressBar value={detail.credit_weight_formula.rating_weight} max={30} color="bg-yellow-500" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">评价数量权重（20%）</span>
                    <span className="font-medium">{detail.credit_weight_formula.review_weight}</span>
                  </div>
                  <ProgressBar value={detail.credit_weight_formula.review_weight} max={20} color="bg-green-500" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">信用分权重（10%）</span>
                    <span className="font-medium">{detail.credit_weight_formula.credit_score_weight}</span>
                  </div>
                  <ProgressBar value={detail.credit_weight_formula.credit_score_weight} max={10} color="bg-purple-500" />
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="font-medium text-gray-900">综合信用权重</span>
                    <span className="font-bold text-blue-600">{detail.credit_weight}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" />客户评价
              </h4>
              {detail.reviews?.length === 0 ? (
                <p className="text-sm text-gray-500">暂无评价</p>
              ) : (
                <div className="space-y-3">
                  {detail.reviews.map((r: any) => (
                    <div key={r.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{r.real_name}</span>
                        <StarRating rating={r.rating} />
                      </div>
                      <p className="text-sm text-gray-600">{r.content || '暂无评价内容'}</p>
                      {r.service_type && (
                        <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{r.service_type}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Home size={16} className="text-green-500" />在售房源
              </h4>
              {detail.properties?.length === 0 ? (
                <p className="text-sm text-gray-500">暂无在售房源</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {detail.properties.map((p: any) => (
                    <div key={p.id} className="border rounded-lg p-3 hover:border-blue-300 transition-colors">
                      <h5 className="font-medium text-sm">{p.title}</h5>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>¥{p.price}万</span>
                        <span>{p.area}㎡</span>
                        <span>{p.address}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detail.risk_controls?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-500" />风控记录
                </h4>
                <div className="space-y-2">
                  {detail.risk_controls.map((rc: any) => (
                    <div key={rc.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          rc.risk_level === 'high' ? 'bg-red-200 text-red-800' :
                          rc.risk_level === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          'bg-blue-200 text-blue-800'
                        }`}>
                          {rc.risk_level === 'high' ? '高风险' : rc.risk_level === 'medium' ? '中风险' : '低风险'}
                        </span>
                        <span className="text-xs text-gray-500">{rc.risk_type}</span>
                      </div>
                      <p className="text-sm text-gray-700">{rc.description}</p>
                      <span className={`text-xs mt-1 inline-block px-1.5 py-0.5 rounded ${
                        rc.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        rc.status === 'confirmed' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rc.status === 'pending' ? '待处理' : rc.status === 'confirmed' ? '已确认' : '已处理'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

const AgentCard: React.FC<{
  agent: any;
  onDetail: (agent: any) => void;
}> = ({ agent, onDetail }) => {
  const [creditData, setCreditData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [riskCount, setRiskCount] = useState(0);

  useEffect(() => {
    api.agents.credit(agent.id).then((res) => {
      if (res.success && res.data) {
        const d = res.data as any;
        setCreditData(d);
        setReviews((d.reviews || []).slice(0, 3));
        setRiskCount((d.risk_controls || []).length);
      }
    });
  }, [agent.id]);

  const grade = getCreditGrade(agent.credit_score ?? 0);
  const creditScore = agent.credit_score ?? 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <CircularProgress value={creditScore} grade={grade} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{agent.real_name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${grade.color} ${grade.bg}`}>
              {grade.grade}
            </span>
            {riskCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                <ShieldAlert size={12} />风控预警
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{agent.agency_name}</p>
          <div className="flex items-center mt-1">
            <div className="flex items-center text-yellow-500">
              <Star size={14} fill="currentColor" />
              <span className="ml-1 text-sm font-medium">{agent.average_rating}</span>
            </div>
            <span className="mx-2 text-gray-300">|</span>
            <span className="text-sm text-gray-500">{agent.review_count}条评价</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">成交转化率</span>
          <span className="font-medium text-green-600">{agent.conversion_rate}%</span>
        </div>
        <ProgressBar value={agent.conversion_rate} max={100} color="bg-green-500" />
      </div>

      {creditData && (
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">信用权重</span>
            <span className="font-bold text-blue-600">{creditData.credit_weight}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
            <span>转化率权重40%：{creditData.credit_weight_formula?.conversion_rate_weight}</span>
            <span>评分权重30%：{creditData.credit_weight_formula?.rating_weight}</span>
            <span>评价数量权重20%：{creditData.credit_weight_formula?.review_weight}</span>
            <span>信用分权重10%：{creditData.credit_weight_formula?.credit_score_weight}</span>
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="mb-4 border-t pt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">最近评价</p>
          <div className="space-y-2">
            {reviews.map((r: any) => (
              <div key={r.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{r.real_name}</span>
                  <StarRating rating={r.rating} />
                  {r.service_type && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{r.service_type}</span>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{r.content || '暂无评价内容'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <a
          href={`tel:${agent.phone}`}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
        >
          <Phone size={16} className="mr-2" />
          电话联系
        </a>
        <button
          onClick={() => onDetail(agent)}
          className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
        >
          <MessageCircle size={16} className="mr-2" />
          查看详情
        </button>
      </div>
    </div>
  );
};

const Agents: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    const response = await api.agents.list({ pageSize: 20 });
    if (response.success && response.data) {
      setAgents((response.data as any).list);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">加载中...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Users className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">专业经纪人</h1>
          <p className="text-gray-500">选择专业经纪人，为您提供优质服务</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onDetail={setSelectedAgent} />
        ))}
      </div>

      {selectedAgent && (
        <AgentDetailModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
};

export default Agents;
