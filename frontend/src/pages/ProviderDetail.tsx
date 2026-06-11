import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, CheckCircle, Award, MapPin, Clock, DollarSign, Briefcase, Shield,
} from 'lucide-react';
import api from '../services/api';
import {
  ProviderProfile, PortfolioItem, Certification, LEVEL_MAP, CATEGORY_MAP,
} from '../types';

export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'certifications' | 'info'>('portfolio');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, portfolioRes, certRes] = await Promise.all([
        api.get<any, { data: ProviderProfile }>(`/providers/${id}`),
        api.get<any, { data: PortfolioItem[] }>(`/providers/${id}/portfolio`),
        api.get<any, { data: Certification[] }>(`/providers/${id}/certifications`),
      ]);
      setProvider(profileRes.data);
      setPortfolio(portfolioRes.data || []);
      setCertifications(certRes.data || []);
    } catch {
      setProvider(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400">加载中...</div>;
  if (!provider) return <div className="text-center py-12 text-gray-400">服务商不存在</div>;

  const displayName = provider.name || provider.real_name;

  const stats = [
    { label: '总订单', value: provider.total_orders, icon: Briefcase, color: 'text-primary' },
    { label: '完成率', value: `${provider.completion_rate}%`, icon: CheckCircle, color: 'text-success' },
    { label: '评分', value: provider.rating.toFixed(1), icon: Star, color: 'text-warning' },
    { label: '平均交付', value: `${provider.avg_delivery_days}天`, icon: Clock, color: 'text-accent' },
  ];

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft size={16} /> 返回
      </button>

      <div className="card overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary to-indigo-500 px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-white font-bold text-2xl shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
                {provider.verified && <CheckCircle size={18} className="text-green-300 shrink-0" />}
                <span className="text-xs px-2 py-0.5 rounded-lg bg-white/20 text-white font-medium">
                  {LEVEL_MAP[provider.level] || provider.level}
                </span>
              </div>
              {provider.bio && (
                <p className="text-sm text-white/80 line-clamp-2">{provider.bio}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <div className="text-xs text-gray-400">{stat.label}</div>
                <div className="text-sm font-semibold text-gray-800">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-6">
          {([
            { key: 'portfolio' as const, label: '作品集' },
            { key: 'certifications' as const, label: '资质认证' },
            { key: 'info' as const, label: '基本信息' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'portfolio' && (
        <div>
          {portfolio.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无作品</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolio.map((item) => (
                <div key={item.id} className="card">
                  <div className="flex items-center gap-2 mb-3">
                    {item.category && (
                      <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-lg font-medium">
                        {CATEGORY_MAP[item.category] || item.category}
                      </span>
                    )}
                    {item.rating != null && (
                      <span className="flex items-center gap-1 text-xs text-warning">
                        <Star size={12} className="fill-warning" />
                        {item.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                    {item.client_name && <span>客户: {item.client_name}</span>}
                    {item.completed_at && <span>{item.completed_at.slice(0, 10)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'certifications' && (
        <div>
          {certifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">暂无资质认证</div>
          ) : (
            <div className="space-y-3">
              {certifications.map((cert) => (
                <div key={cert.id} className="card flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    cert.verified ? 'bg-success/10' : 'bg-gray-100'
                  }`}>
                    {cert.verified ? (
                      <Shield size={20} className="text-success" />
                    ) : (
                      <Award size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm">{cert.name}</h3>
                      {cert.verified ? (
                        <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-lg">已验证</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg">未验证</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      {cert.issuer && <span>颁发机构: {cert.issuer}</span>}
                      {cert.issue_date && <span>{cert.issue_date.slice(0, 10)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">技能与服务</h3>
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-2">技能标签</div>
              <div className="flex flex-wrap gap-2">
                {provider.skills.map((skill) => (
                  <span key={skill} className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-2">服务类别</div>
              <div className="flex flex-wrap gap-2">
                {provider.service_categories.map((cat) => (
                  <span key={cat} className="text-xs px-3 py-1 bg-accent/10 text-accent rounded-lg font-medium">
                    {CATEGORY_MAP[cat] || cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">服务价格</h3>
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-accent" />
              <span className="text-lg font-semibold text-accent">¥{provider.price_min} - ¥{provider.price_max}</span>
            </div>
          </div>

          {provider.bio && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">个人简介</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{provider.bio}</p>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">其他信息</h3>
            <div className="space-y-3 text-sm">
              {provider.location && (
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-500">所在地</span>
                  <span className="font-medium text-gray-800 ml-auto">{provider.location}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Briefcase size={16} className="text-gray-400" />
                <span className="text-gray-500">完成订单</span>
                <span className="font-medium text-gray-800 ml-auto">{provider.total_orders}单</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle size={16} className="text-gray-400" />
                <span className="text-gray-500">完成率</span>
                <span className="font-medium text-gray-800 ml-auto">{provider.completion_rate}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400" />
                <span className="text-gray-500">平均交付</span>
                <span className="font-medium text-gray-800 ml-auto">{provider.avg_delivery_days}天</span>
              </div>
              <div className="flex items-center gap-3">
                <Star size={16} className="text-gray-400" />
                <span className="text-gray-500">综合评分</span>
                <span className="font-medium text-gray-800 ml-auto flex items-center gap-1">
                  {provider.rating.toFixed(1)}
                  <Star size={14} className="text-warning fill-warning" />
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
