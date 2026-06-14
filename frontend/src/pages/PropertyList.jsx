import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';

const verificationLabels = {
  0: { label: '未验证', color: '#999', icon: '⚠️' },
  1: { label: '产权核验中', color: '#faad14', icon: '📋' },
  2: { label: '实地打卡', color: '#1890ff', icon: '📍' },
  3: { label: '人脸识别', color: '#52c41a', icon: '👤' },
  4: { label: '已全验证', color: '#52c41a', icon: '✅' }
};

const verificationSteps = [
  { key: 'property_right', label: '产权核验', icon: '📋' },
  { key: 'onsite_checkin', label: '实地打卡', icon: '📍' },
  { key: 'face_recognition', label: '人脸识别', icon: '👤' },
  { key: 'neighbor_verify', label: '邻居验证', icon: '👥' }
];

const matchGradeConfig = {
  S: { color: '#ff4d4f', bgColor: '#fff1f0', borderColor: '#ffa39e', label: 'S级推荐' },
  A: { color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591', label: 'A级优选' },
  B: { color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f', label: 'B级匹配' },
  C: { color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff', label: 'C级一般' },
  D: { color: '#8c8c8c', bgColor: '#fafafa', borderColor: '#d9d9d9', label: 'D级待优化' }
};

const getMatchGrade = (score) => {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
};

const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchParams, setSearchParams] = useSearchParams();
  const [aiMatching, setAiMatching] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [error, setError] = useState(null);
  const [aiMatchSummary, setAiMatchSummary] = useState(null);
  const [isAiMatchMode, setIsAiMatchMode] = useState(false);
  const [aiPreferences, setAiPreferences] = useState({
    commute_radius: parseInt(searchParams.get('commute_radius')) || 5,
    budget_min: parseInt(searchParams.get('budget_min')) || 2000,
    budget_max: parseInt(searchParams.get('budget_max')) || 6000,
    commute_weight: parseInt(searchParams.get('commute_weight')) || 30,
    budget_weight: parseInt(searchParams.get('budget_weight')) || 40,
    facility_weight: parseInt(searchParams.get('facility_weight')) || 30,
    workplace: searchParams.get('workplace') || '',
    required_facilities: searchParams.get('required_facilities')?.split(',') || []
  });
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const facilities = ['空调', '洗衣机', '冰箱', '热水器', 'WiFi', '车位', '储物间', '阳台', '天然气'];

  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    city: searchParams.get('city') || '',
    district: searchParams.get('district') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rentMode: searchParams.get('rentMode') || '',
    rooms: searchParams.get('rooms') || '',
    verified_only: searchParams.get('verified_only') === 'false' ? false : true
  });

  useEffect(() => {
    fetchProperties();
  }, [searchParams]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    setIsAiMatchMode(false);
    setAiMatchSummary(null);
    try {
      const params = new URLSearchParams(searchParams);
      if (filters.verified_only) {
        params.set('verified_only', 'true');
      }
      const response = await api.get(`/properties?${params.toString()}`);
      setProperties(response.data.properties || response.data.data || []);
      setPagination(response.data.pagination || response.data.meta || {});
    } catch (error) {
      console.error('获取房源列表失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后查看房源列表');
      } else {
        setError(error.response?.data?.message || '获取房源列表失败，请稍后重试');
      }
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params[key] = filters[key];
      }
    });
    params.commute_radius = aiPreferences.commute_radius;
    params.budget_min = aiPreferences.budget_min;
    params.budget_max = aiPreferences.budget_max;
    params.commute_weight = aiPreferences.commute_weight;
    params.budget_weight = aiPreferences.budget_weight;
    params.facility_weight = aiPreferences.facility_weight;
    if (aiPreferences.workplace) {
      params.workplace = aiPreferences.workplace;
    }
    if (aiPreferences.required_facilities.length > 0) {
      params.required_facilities = aiPreferences.required_facilities.join(',');
    }
    params.verified_only = filters.verified_only;
    setSearchParams(params);
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      city: '',
      district: '',
      minPrice: '',
      maxPrice: '',
      rentMode: '',
      rooms: '',
      verified_only: true
    });
    setAiPreferences({
      commute_radius: 5,
      budget_min: 2000,
      budget_max: 6000,
      commute_weight: 30,
      budget_weight: 40,
      facility_weight: 30,
      workplace: '',
      required_facilities: []
    });
    setIsAiMatchMode(false);
    setAiMatchSummary(null);
    setSearchParams({ verified_only: 'true' });
  };

  const handleAiMatch = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setAiMatching(true);
    setError(null);
    setIsAiMatchMode(true);
    try {
      const response = await api.post('/properties/ai/match', aiPreferences);
      const matches = response.data.matches || response.data.data || [];
      const summary = response.data.summary || {
        total: matches.length,
        avg_score: matches.length > 0 ? matches.reduce((a, b) => a + (b.match_score || 0), 0) / matches.length : 0,
        s_count: matches.filter(m => (m.match_score || 0) >= 90).length,
        a_count: matches.filter(m => (m.match_score || 0) >= 80 && (m.match_score || 0) < 90).length,
        b_count: matches.filter(m => (m.match_score || 0) >= 70 && (m.match_score || 0) < 80).length,
        estimated_savings: matches.length > 0 ? matches.reduce((a, b) => a + (b.estimated_savings || 0), 0) : 0
      };
      setAiMatchSummary(summary);
      setProperties(matches.sort((a, b) => (b.match_score || 0) - (a.match_score || 0)));
      setPagination({ page: 1, limit: 20, total: matches.length, pages: 1 });
    } catch (error) {
      console.error('AI匹配失败:', error);
      if (error.response?.status === 401) {
        setError('请先登录后使用AI智能匹配');
      } else {
        setError(error.response?.data?.message || 'AI匹配失败，请稍后重试');
      }
      setProperties([]);
    } finally {
      setAiMatching(false);
    }
  };

  const toggleFacility = (facility) => {
    setAiPreferences(prev => ({
      ...prev,
      required_facilities: prev.required_facilities.includes(facility)
        ? prev.required_facilities.filter(f => f !== facility)
        : [...prev.required_facilities, facility]
    }));
  };

  const renderVerificationBadges = (property) => {
    const stage = property.verification_stage || 0;
    return (
      <div className="verification-badges" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
        {verificationSteps.slice(0, stage).map((step, i) => (
          <span
            key={step.key}
            className="tag tag-success"
            style={{ fontSize: '11px', padding: '2px 6px', background: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a' }}
            title={step.label}
          >
            {step.icon} {step.label}
          </span>
        ))}
        {stage === 0 && (
          <span className="tag" style={{ fontSize: '11px', padding: '2px 6px', background: '#fff2f0', borderColor: '#ffccc7', color: '#ff4d4f' }}>
            ⚠️ 待验证
          </span>
        )}
      </div>
    );
  };

  const renderMatchGrade = (score) => {
    const grade = getMatchGrade(score);
    const config = matchGradeConfig[grade];
    return (
      <span 
        className="badge" 
        style={{ 
          background: config.bgColor, 
          color: config.color, 
          border: `1px solid ${config.borderColor}`,
          fontWeight: 'bold'
        }}
      >
        {config.label}
      </span>
    );
  };

  const renderMatchReasons = (property) => {
    const reasons = property.match_reasons || [
      { type: 'budget', title: '预算匹配', desc: '租金在您的预算范围内' },
      { type: 'facility', title: '配套齐全', desc: '满足您的配套需求' },
      { type: 'commute', title: '通勤便利', desc: '距离工作地点较近' }
    ];
    return (
      <div style={{ marginTop: '8px' }}>
        {reasons.slice(0, 3).map((reason, i) => (
          <div key={i} style={{ fontSize: '12px', color: '#666', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: '#52c41a' }}>✓</span>
            <span style={{ fontWeight: 500 }}>{reason.title}：</span>
            <span>{reason.desc}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderTwoWayIntent = (property) => {
    const intent = property.two_way_intent || {
      tenant_match: 85,
      landlord_preference: '高',
      landlord_activity: '活跃'
    };
    return (
      <div style={{ 
        marginTop: '10px', 
        padding: '8px', 
        background: '#f0f7ff', 
        borderRadius: '6px',
        fontSize: '12px'
      }}>
        <div style={{ fontWeight: 500, marginBottom: '6px', color: '#1890ff' }}>🤝 双向意向</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>租客匹配度: <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{intent.tenant_match}%</span></span>
          <span>房东偏好: <span style={{ color: '#fa8c16' }}>{intent.landlord_preference}</span></span>
          <span>房东动态: <span style={{ color: '#1890ff' }}>{intent.landlord_activity}</span></span>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-2">搜索结果与筛选房源</h1>
      <p className="text-gray mb-8">请输入搜索条件后提交查询，搜索结果支持按城市、区域、租金、户型和验证状态筛选；发现分类入口覆盖整租、合租、转租和已验证房源频道。</p>

      <div className="filter-section">
        <form onSubmit={handleSearch}>
          <div className="filter-row">
            <div className="filter-item">
              <input
                type="text"
                name="keyword"
                className="form-input"
                placeholder="搜索关键词"
                value={filters.keyword}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <select
                name="city"
                className="form-input"
                value={filters.city}
                onChange={handleFilterChange}
              >
                <option value="">选择城市</option>
                <option value="北京">北京</option>
                <option value="上海">上海</option>
                <option value="广州">广州</option>
                <option value="深圳">深圳</option>
              </select>
            </div>
            <div className="filter-item">
              <select
                name="district"
                className="form-input"
                value={filters.district}
                onChange={handleFilterChange}
              >
                <option value="">选择区域</option>
                <option value="朝阳区">朝阳区</option>
                <option value="海淀区">海淀区</option>
                <option value="西城区">西城区</option>
                <option value="东城区">东城区</option>
                <option value="丰台区">丰台区</option>
              </select>
            </div>
            <div className="filter-item">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="verified_only"
                  checked={!filters.verified_only}
                  onChange={(e) => setFilters({ ...filters, verified_only: !e.target.checked })}
                />
                <span style={{ fontSize: '14px' }}>显示全部房源（包括未验证）</span>
              </label>
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-item">
              <input
                type="number"
                name="minPrice"
                className="form-input"
                placeholder="最低租金"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <input
                type="number"
                name="maxPrice"
                className="form-input"
                placeholder="最高租金"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>
            <div className="filter-item">
              <select
                name="rentMode"
                className="form-input"
                value={filters.rentMode}
                onChange={handleFilterChange}
              >
                <option value="">租赁方式</option>
                <option value="whole">整租</option>
                <option value="share">合租</option>
                <option value="sublet">转租</option>
              </select>
            </div>
            <div className="filter-item">
              <select
                name="rooms"
                className="form-input"
                value={filters.rooms}
                onChange={handleFilterChange}
              >
                <option value="">户型</option>
                <option value="1">1室</option>
                <option value="2">2室</option>
                <option value="3">3室</option>
                <option value="4">4室+</option>
              </select>
            </div>
            <div className="filter-item" style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                🔍 搜索结果
              </button>
              <button type="button" className="btn" onClick={handleReset} style={{ flex: 1 }}>
                🔄 重置
              </button>
            </div>
          </div>
        </form>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setShowAiPanel(!showAiPanel)}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none' }}
          >
            🤖 AI 智能匹配 {showAiPanel ? '▲' : '▼'}
          </button>

          {showAiPanel && (
            <div className="card" style={{ marginTop: '1rem', background: '#f9f5ff' }}>
              <div className="card-body">
                <h3 className="font-bold mb-4">🎯 个性化房源推荐</h3>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div>
                    <label className="form-label">通勤半径（公里）</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={aiPreferences.commute_radius}
                      onChange={(e) => setAiPreferences({ ...aiPreferences, commute_radius: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>{aiPreferences.commute_radius} 公里</span>
                  </div>
                  <div>
                    <label className="form-label">预算区间（元/月）</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="最低"
                        value={aiPreferences.budget_min}
                        onChange={(e) => setAiPreferences({ ...aiPreferences, budget_min: parseInt(e.target.value) || 0 })}
                      />
                      <input
                        type="number"
                        className="form-input"
                        placeholder="最高"
                        value={aiPreferences.budget_max}
                        onChange={(e) => setAiPreferences({ ...aiPreferences, budget_max: parseInt(e.target.value) || 10000 })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">通勤权重: {aiPreferences.commute_weight}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={aiPreferences.commute_weight}
                      onChange={(e) => setAiPreferences({ ...aiPreferences, commute_weight: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="form-label">预算权重: {aiPreferences.budget_weight}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={aiPreferences.budget_weight}
                      onChange={(e) => setAiPreferences({ ...aiPreferences, budget_weight: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="form-label">配套权重: {aiPreferences.facility_weight}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={aiPreferences.facility_weight}
                      onChange={(e) => setAiPreferences({ ...aiPreferences, facility_weight: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label className="form-label">工作地点</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="如：中关村、国贸..."
                      value={aiPreferences.workplace}
                      onChange={(e) => setAiPreferences({ ...aiPreferences, workplace: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label className="form-label">必需配套</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {facilities.map(f => (
                      <button
                        key={f}
                        type="button"
                        className={`tag ${aiPreferences.required_facilities.includes(f) ? 'tag-success' : ''}`}
                        onClick={() => toggleFacility(f)}
                        style={{ cursor: 'pointer' }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAiMatch}
                  disabled={aiMatching}
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  {aiMatching ? '🤖 AI 匹配中...' : '🚀 开始智能匹配'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isAiMatchMode && aiMatchSummary && (
        <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #667eea10 0%, #764ba210 100%)', border: '2px solid #667eea' }}>
          <div className="card-body">
            <h3 className="font-bold mb-4" style={{ color: '#667eea' }}>🤖 AI 智能匹配结果摘要</h3>
            <div className="grid grid-5" style={{ gap: '1rem' }}>
              <div className="text-center">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>{aiMatchSummary.total}</div>
                <div className="text-gray text-sm">匹配房源</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#52c41a' }}>{aiMatchSummary.avg_score?.toFixed(1) || 0}分</div>
                <div className="text-gray text-sm">平均分数</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff4d4f' }}>{aiMatchSummary.s_count || 0}</div>
                <div className="text-gray text-sm">S级推荐</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fa8c16' }}>{aiMatchSummary.a_count || 0}</div>
                <div className="text-gray text-sm">A级优选</div>
              </div>
              <div className="text-center">
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1890ff' }}>{formatMoney(aiMatchSummary.estimated_savings || 0)}</div>
                <div className="text-gray text-sm">预计年省</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p className="text-danger">{error}</p>
          {error.includes('登录') && (
            <button className="btn btn-primary mt-4" onClick={() => navigate('/login')}>
              去登录
            </button>
          )}
        </div>
      ) : properties.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p className="text-gray">暂无符合条件的房源</p>
        </div>
      ) : (
        <>
          <div className="flex-between mb-4">
            <h2 className="text-lg font-bold">查询结果 {isAiMatchMode && '(按匹配度排序)'}</h2>
            <span className="text-gray text-sm">共 {pagination.total || properties.length} 套房源</span>
          </div>
          <div className="grid grid-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="card property-card"
                onClick={() => navigate(`/property/${property.id}`)}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              >
                <div className="property-image" style={{ position: 'relative', height: '200px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px 8px 0 0' }}>
                  {property.is_verified && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>
                      ✅ 已全验证
                    </div>
                  )}
                  {!property.is_verified && property.verification_stage > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'linear-gradient(135deg, #faad14 0%, #d48806 100%)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>
                      ⏳ 验证中
                    </div>
                  )}
                  {property.verification_stage === 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>
                      ⚠️ 未验证
                    </div>
                  )}
                  {property.match_score !== undefined && property.match_score !== null && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      zIndex: 10
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        匹配度 {property.match_score}分
                      </div>
                      {renderMatchGrade(property.match_score)}
                    </div>
                  )}
                  {property.estimated_savings && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      color: 'white',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      zIndex: 10
                    }}>
                      💰 年省 {formatMoney(property.estimated_savings)}
                    </div>
                  )}
                </div>
                <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                  <p className="text-gray text-sm mb-2" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    📍 {property.address}
                  </p>
                  {property.commute_info && (
                    <p className="text-sm mb-2" style={{ color: '#1890ff' }}>
                      🚇 通勤：{property.commute_info.distance} · 约{property.commute_info.time}
                    </p>
                  )}
                  {renderVerificationBadges(property)}
                  {isAiMatchMode && renderMatchReasons(property)}
                  {isAiMatchMode && renderTwoWayIntent(property)}
                  <div className="mb-2" style={{ marginTop: '8px' }}>
                    {property.tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="flex-between" style={{ marginTop: 'auto' }}>
                    <span className="property-price">{formatMoney(property.price)}/月</span>
                    <span className="text-gray text-sm">
                      {property.rooms}室 {property.area}㎡ · {property.rent_mode === 'whole' ? '整租' : property.rent_mode === 'share' ? '合租' : '转租'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex-center gap-4 mt-8">
              <button
                className="btn"
                disabled={pagination.page <= 1}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', pagination.page - 1);
                  setSearchParams(params);
                }}
              >
                上一页
              </button>
              <span>
                {pagination.page} / {pagination.pages}
              </span>
              <button
                className="btn"
                disabled={pagination.page >= pagination.pages}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.set('page', pagination.page + 1);
                  setSearchParams(params);
                }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyList;
