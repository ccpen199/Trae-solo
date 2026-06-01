import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { communityAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

function CommunityList() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [stats, setStats] = useState({ industry: 0, company: 0, alumni: 0, total: 0 });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get('type');
    const keywordParam = params.get('keyword');
    if (typeParam && typeParam !== activeType) {
      setActiveType(typeParam);
    }
    if (keywordParam) {
      setSearchKeyword(keywordParam);
    }
  }, [location.search]);

  useEffect(() => {
    loadCommunities();
    loadStats();
  }, [activeType, searchKeyword]);

  const loadStats = async () => {
    try {
      const [allRes, industryRes, companyRes, alumniRes] = await Promise.all([
        communityAPI.getCommunities({ limit: 100 }),
        communityAPI.getCommunities({ type: 'industry', limit: 100 }),
        communityAPI.getCommunities({ type: 'company', limit: 100 }),
        communityAPI.getCommunities({ type: 'alumni', limit: 100 }),
      ]);
      setStats({
        total: allRes.data.communities?.length || 0,
        industry: industryRes.data.communities?.length || 0,
        company: companyRes.data.communities?.length || 0,
        alumni: alumniRes.data.communities?.length || 0,
      });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeType) params.type = activeType;
      if (searchKeyword) params.keyword = searchKeyword;
      const res = await communityAPI.getCommunities(params);
      setCommunities(res.data.communities || []);
    } catch (err) {
      console.error('Failed to load communities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (community) => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    if (community.is_member) {
      navigate(`/communities/${community.id}`);
      return;
    }

    try {
      const res = await communityAPI.joinCommunity(community.id);
      if (res.data && res.data.member_id) {
        navigate(`/communities/${community.id}`);
      } else {
        loadCommunities();
      }
    } catch (err) {
      alert(err.response?.data?.error || '加入失败，请稍后重试');
    }
  };

  const handleCardClick = (type) => {
    setActiveType(activeType === type ? '' : type);
    navigate(`/communities${type ? `?type=${type}` : ''}`, { replace: true });
  };

  const typeLabels = {
    industry: '🏢 行业圈',
    company: '🏠 公司圈',
    alumni: '🎓 校友圈',
  };

  const categoryCards = [
    {
      type: 'industry',
      title: '🏢 行业圈',
      desc: '按行业划分的专业交流社群',
      count: stats.industry,
      color: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    },
    {
      type: 'company',
      title: '🏠 公司圈',
      desc: '公司内部员工交流社区',
      count: stats.company,
      color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    },
    {
      type: 'alumni',
      title: '🎓 校友圈',
      desc: '校友职业发展交流平台',
      count: stats.alumni,
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏘️ 职业社群</h1>
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
          共 {stats.total} 个社群，等你加入
        </div>
      </div>

      <div className="grid-3" style={{ gap: 16, marginBottom: 32 }}>
        {categoryCards.map(card => (
          <div
            key={card.type}
            className="card card-hover"
            style={{
              padding: 24,
              cursor: 'pointer',
              background: activeType === card.type ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              border: activeType === card.type ? '2px solid var(--primary-color)' : '2px solid transparent',
            }}
            onClick={() => handleCardClick(card.type)}
          >
            <div style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: 'white',
              marginBottom: 16,
            }}>
              {card.title.split(' ')[0]}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{card.title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
              {card.desc}
            </p>
            <div style={{ fontSize: 14, color: 'var(--primary-color)', fontWeight: 500 }}>
              {card.count} 个社群 →
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => setActiveType('')}
          className={`btn btn-sm ${activeType === '' ? 'btn-primary' : 'btn-secondary'}`}
        >
          全部
        </button>
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveType(key)}
            className={`btn btn-sm ${activeType === key ? 'btn-primary' : 'btn-secondary'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 60, textAlign: 'center' }}>加载中...</div>
      ) : communities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏘️</div>
          <p>暂无社群</p>
        </div>
      ) : (
        <div className="grid-3">
          {communities.map(community => (
            <div key={community.id} className="card card-hover" style={{ padding: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 12,
                background: community.type === 'industry'
                  ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                  : community.type === 'company'
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                color: 'white',
                marginBottom: 12,
              }}>
                {community.type === 'industry' ? '🏢' : community.type === 'company' ? '🏠' : '🎓'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600 }}>{community.name}</h3>
                <span className="tag tag-sm">
                  {typeLabels[community.type]?.split(' ')[1]}
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, minHeight: 40 }}>
                {community.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  👥 {community.member_count.toLocaleString()} 成员
                </span>
                {community.is_member ? (
                  <Link to={`/communities/${community.id}`} className="btn btn-sm btn-primary">
                    进入
                  </Link>
                ) : (
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleJoin(community)}
                  >
                    加入
                  </button>
                )}
              </div>

              {community.city && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                  📍 {community.city}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommunityList;
