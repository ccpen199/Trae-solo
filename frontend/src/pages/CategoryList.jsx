import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CategoryList() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [district, setDistrict] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [useVerticalFilter, setUseVerticalFilter] = useState(false);
  const [skillCert, setSkillCert] = useState(false);
  const [experienceMin, setExperienceMin] = useState('');
  const [hasVin, setHasVin] = useState(false);
  const [vin, setVin] = useState('');
  const [minYear, setMinYear] = useState('');
  const [hasPropertyCert, setHasPropertyCert] = useState(false);
  const [noAgent, setNoAgent] = useState(false);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [onSiteService, setOnSiteService] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const kw = searchParams.get('keyword');
    const ct = searchParams.get('city');
    if (kw) setKeyword(kw);
    if (ct) setCity(ct);
  }, [searchParams]);

  useEffect(() => {
    loadListings();
  }, [categoryId, page, categories]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/listings/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('加载分类失败', err);
    }
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      const currentCategory = categories.find(c => String(c.id) === categoryId);
      const categoryCode = currentCategory?.code;

      if (useVerticalFilter) {
        const params = {
          skill_cert: skillCert || undefined,
          experience_min: experienceMin || undefined,
          has_vin: hasVin || undefined,
          vin: vin || undefined,
          min_year: minYear || undefined,
          has_property_cert: hasPropertyCert || undefined,
          no_agent: noAgent || undefined,
          has_certificate: hasCertificate || undefined,
          on_site_service: onSiteService || undefined
        };
        if (categoryId !== 'all' && categoryCode) {
          params.category_code = categoryCode;
        }
        const res = await api.get('/listings/filter/vertical', { params });
        setListings(res.data.listings);
        setTotal(res.data.count);
      } else {
        const params = {
          keyword: keyword || undefined,
          city: city || undefined,
          district: district || undefined,
          min_price: minPrice || undefined,
          max_price: maxPrice || undefined,
          verified: verifiedOnly ? 'true' : undefined,
          page,
          pageSize
        };
        if (categoryId !== 'all') {
          params.category_id = categoryId;
        }
        const res = await api.get('/listings', { params });
        setListings(res.data.listings);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('加载信息失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadListings();
  };

  const currentCategory = categories.find(c => String(c.id) === categoryId);

  const getRoleName = (role) => {
    switch (role) {
      case 'provider': return '服务提供者';
      case 'agent': return '城市运营';
      default: return '普通用户';
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      {user && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {user.nickname?.charAt(0) || '用'}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {user.nickname}
                  {user.is_verified && <span style={{ marginLeft: '0.5rem', padding: '2px 8px', background: '#27ae60', color: 'white', borderRadius: '12px', fontSize: '0.75rem' }}>✓ 已实名认证</span>}
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem' }}>
                  身份：{getRoleName(user.role)} · 信用分：{user.credit_score || 100}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!user.is_verified && (
                <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  📋 完成实名认证
                </Link>
              )}
              {user.role === 'provider' && (
                <Link to="/profile" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  💼 上传资质证书
                </Link>
              )}
              {user.role === 'agent' && (
                <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: '#9b59b6', borderColor: '#9b59b6' }}>
                  🏢 运营后台
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {!user && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', background: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>🔒 游客模式</strong>
              <span style={{ marginLeft: '0.5rem', color: '#666', fontSize: '0.9rem' }}>登录后可发布信息、发起担保交易、查看专属推荐</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>立即登录</Link>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>免费注册</Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>
          {categoryId === 'all' ? '📋 全部信息' : `${currentCategory?.icon || ''} ${currentCategory?.name || '分类'}`}
        </h2>
        <Link to="/create" className="btn btn-primary">+ 发布信息</Link>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0' }}>🔍 搜索筛选</h4>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="关键词：电工、租房、二手车..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ flex: 2, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="text"
              placeholder="城市"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ flex: 1, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <input
              type="text"
              placeholder="区域"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              style={{ flex: 1, padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="最低价"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              style={{ width: '100px', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="最高价"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{ width: '100px', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              仅已认证
            </label>
            <button type="submit" className="btn btn-primary">搜索</button>
          </div>
        </form>
      </div>

      {(categoryId === 'all' || (currentCategory && ['job', 'car', 'house', 'repair', 'housekeeping'].includes(currentCategory.code))) && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>🎯 精准筛选（按行业特性）</h4>
            <label>
              <input
                type="checkbox"
                checked={useVerticalFilter}
                onChange={(e) => setUseVerticalFilter(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              启用精准筛选
            </label>
          </div>

          {categoryId === 'all' && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input type="checkbox" checked={skillCert} onChange={(e) => setSkillCert(e.target.checked)} disabled={!useVerticalFilter} />
                  有技能证书
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input type="checkbox" checked={hasVin} onChange={(e) => setHasVin(e.target.checked)} disabled={!useVerticalFilter} />
                  有VIN维保记录
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input type="checkbox" checked={hasPropertyCert} onChange={(e) => setHasPropertyCert(e.target.checked)} disabled={!useVerticalFilter} />
                  已核验房产证
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input type="checkbox" checked={noAgent} onChange={(e) => setNoAgent(e.target.checked)} disabled={!useVerticalFilter} />
                  无中介
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input type="checkbox" checked={hasCertificate} onChange={(e) => setHasCertificate(e.target.checked)} disabled={!useVerticalFilter} />
                  有资质证书
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input type="checkbox" checked={onSiteService} onChange={(e) => setOnSiteService(e.target.checked)} disabled={!useVerticalFilter} />
                  可上门服务
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>最低工作经验：</span>
                  <select
                    value={experienceMin}
                    onChange={(e) => setExperienceMin(e.target.value)}
                    disabled={!useVerticalFilter}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    <option value="">不限</option>
                    <option value="1">1年以上</option>
                    <option value="2">2年以上</option>
                    <option value="3">3年以上</option>
                    <option value="5">5年以上</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentCategory?.code === 'job' && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={skillCert} onChange={(e) => setSkillCert(e.target.checked)} disabled={!useVerticalFilter} />
                有技能证书
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>最低工作经验：</span>
                <select value={experienceMin} onChange={(e) => setExperienceMin(e.target.value)} disabled={!useVerticalFilter}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <option value="">不限</option>
                  <option value="1">1年以上</option>
                  <option value="2">2年以上</option>
                  <option value="3">3年以上</option>
                  <option value="5">5年以上</option>
                </select>
              </div>
            </div>
          )}

          {currentCategory?.code === 'car' && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={hasVin} onChange={(e) => setHasVin(e.target.checked)} disabled={!useVerticalFilter} />
                有VIN码记录
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>VIN码查询：</span>
                <input type="text" value={vin} onChange={(e) => setVin(e.target.value)} placeholder="输入完整VIN码" disabled={!useVerticalFilter}
                  style={{ width: '200px', padding: '0.4rem', border: '1px solid #ddd', borderRadius: '4px' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>最早上牌年份：</span>
                <select value={minYear} onChange={(e) => setMinYear(e.target.value)} disabled={!useVerticalFilter}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <option value="">不限</option>
                  <option value="2024">2024年及以后</option>
                  <option value="2022">2022年及以后</option>
                  <option value="2020">2020年及以后</option>
                  <option value="2018">2018年及以后</option>
                </select>
              </div>
            </div>
          )}

          {currentCategory?.code === 'house' && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={hasPropertyCert} onChange={(e) => setHasPropertyCert(e.target.checked)} disabled={!useVerticalFilter} />
                已核验房产证
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={noAgent} onChange={(e) => setNoAgent(e.target.checked)} disabled={!useVerticalFilter} />
                业主直租（无中介）
              </label>
            </div>
          )}

          {(currentCategory?.code === 'repair' || currentCategory?.code === 'housekeeping') && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={hasCertificate} onChange={(e) => setHasCertificate(e.target.checked)} disabled={!useVerticalFilter} />
                有资质证书
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={onSiteService} onChange={(e) => setOnSiteService(e.target.checked)} disabled={!useVerticalFilter} />
                可上门服务
              </label>
            </div>
          )}

          {useVerticalFilter && (
            <div style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary" onClick={loadListings}>应用筛选</button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>加载中...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>暂无相关信息</h3>
          <p style={{ color: '#666', margin: 0 }}>试试调整筛选条件，或切换到其他分类浏览</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem', color: '#666' }}>
            共 <strong>{total}</strong> 条信息
          </div>
          <div className="grid grid-3">
            {listings.map((item) => (
              <div
                key={item.id}
                className="listing-card-home"
                onClick={() => navigate(`/listing/${item.id}`)}
              >
                <div className="listing-card-top">
                  <span className="listing-card-cat">{item.category_icon || '📋'} {item.category_name}</span>
                  {item.author_verified && <span className="listing-card-auth">✔ 实名</span>}
                </div>
                <div className="listing-card-title">{item.title}</div>
                <div className="listing-card-price">
                  {item.price > 0 ? `¥${item.price}` : '面议'}
                  {item.price_unit && <span className="listing-card-unit">/{item.price_unit}</span>}
                </div>
                <div className="listing-card-location">📍 {item.city || '全国'} {item.district || ''}</div>
                <div className="listing-card-badges">
                  {item.has_skill_cert && <span className="badge-sm badge-cert">🎓 持证</span>}
                  {item.on_site_service && <span className="badge-sm badge-door">🏠 可上门</span>}
                  {item.has_vin && <span className="badge-sm badge-vin">🚗 VIN</span>}
                  {item.no_agent && <span className="badge-sm badge-noagent">🤝 无中介</span>}
                  {item.has_certificate && <span className="badge-sm badge-cert">📜 有资质</span>}
                  {item.has_property_cert && <span className="badge-sm badge-cert">🏠 房产证</span>}
                </div>
                {item.tags && item.tags.length > 0 && (
                  <div className="listing-card-tags">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag-sm">{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>
                    👤 {item.author_name || '匿名用户'}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#3498db',
                    background: '#e8f4fd',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '10px'
                  }}>
                    担保交易 🔒
                  </span>
                </div>
              </div>
            ))}
          </div>

          {total > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </button>
              <span style={{ padding: '0.5rem 1rem' }}>
                第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CategoryList;
