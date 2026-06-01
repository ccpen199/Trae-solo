import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { useStore } from '../store';

const CATEGORY_LABELS = { job: '招聘', rent: '租房', house: '二手房', car: '二手车', service: '本地服务' };
const CATEGORY_ICONS = { job: '💼', rent: '🏠', house: '🏢', car: '🚗', service: '🛠️' };

const TIME_OPTIONS = [
  { label: '全部时间', value: '' },
  { label: '最近7天', value: '7' },
  { label: '最近30天', value: '30' },
  { label: '最近90天', value: '90' },
];

const EDUCATION_OPTIONS = ['不限', '高中', '大专', '本科', '硕士', '博士'];
const EXPERIENCE_OPTIONS = ['不限', '1年以下', '1-3年', '3-5年', '5-10年', '10年以上'];
const TRANSMISSION_OPTIONS = ['不限', '手动挡', '自动挡', '手自一体'];
const CAR_YEARS = ['不限', '1年以内', '1-3年', '3-5年', '5-8年', '8年以上'];
const CAR_MILEAGE_OPTIONS = ['不限', '1万公里内', '1-3万公里', '3-6万公里', '6-10万公里', '10万公里以上'];
const HOUSE_TYPES = ['不限', '整租', '合租', '公寓', '别墅'];
const ROOM_OPTIONS = ['不限', '1室', '2室', '3室', '4室', '5室及以上'];

function HomePage() {
  const { categories, user } = useStore();
  const [urlParams] = useSearchParams();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [recommendListings, setRecommendListings] = useState([]);
  const [browseHistory, setBrowseHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [filters, setFilters] = useState({
    keyword: '',
    category_code: '',
    city: '',
    district: '',
    min_price: '',
    max_price: '',
    is_verified: '',
    is_urgent: '',
    days_ago: '',
    area_min: '',
    area_max: '',
    rooms: '',
    house_type: '',
    car_brand: '',
    car_year: '',
    car_mileage: '',
    car_transmission: '',
    job_education: '',
    job_experience: '',
    job_salary_min: '',
    job_salary_max: '',
    service_type: '',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([k, v]) => v !== '' && v !== null);
  }, [filters]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('page_size', 12);
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v !== '') params.set(k, v);
    });
    try {
      const res = await api.get(`/listings?${params}`);
      setListings(res.data.listings);
      setTotal(res.data.total);
    } catch (e) {
      setListings([]);
      setTotal(0);
    }
    setLoading(false);
  }, [page, filters]);

  const fetchRecommend = useCallback(async () => {
    try {
      const res = await api.get('/listings?page_size=8&sort_by=view_count');
      setRecommendListings(res.data.listings);
    } catch (e) {}
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/listings/history?page_size=4');
      setBrowseHistory(res.data.listings || []);
    } catch (e) {}
  }, [user]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    fetchRecommend();
    fetchHistory();
  }, [fetchRecommend, fetchHistory]);

  const updateFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'category_code') {
        next.area_min = ''; next.area_max = ''; next.rooms = ''; next.house_type = '';
        next.car_brand = ''; next.car_year = ''; next.car_mileage = ''; next.car_transmission = '';
        next.job_education = ''; next.job_experience = ''; next.job_salary_min = ''; next.job_salary_max = '';
        next.service_type = '';
      }
      return next;
    });
    setPage(1);
    if (searchTimeout) clearTimeout(searchTimeout);
  };

  const handleKeywordChange = (e) => {
    const value = e.target.value;
    updateFilter('keyword', value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => fetchListings(), 400);
    setSearchTimeout(t);
  };

  const clearFilters = () => {
    setFilters({
      keyword: '', category_code: '', city: '', district: '',
      min_price: '', max_price: '', is_verified: '', is_urgent: '', days_ago: '',
      area_min: '', area_max: '', rooms: '', house_type: '',
      car_brand: '', car_year: '', car_mileage: '', car_transmission: '',
      job_education: '', job_experience: '', job_salary_min: '', job_salary_max: '',
      service_type: '',
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / 12);
  const cat = filters.category_code;
  const isHouse = cat === 'rent' || cat === 'house';
  const isCar = cat === 'car';
  const isJob = cat === 'job';
  const isService = cat === 'service';
  const activeCategoryObj = categories.find(c => c.code === cat);

  const renderEmptyState = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h3 style={{ color: '#666', marginBottom: 8 }}>
        {hasActiveFilters ? '没有找到匹配的信息' : '暂无信息发布'}
      </h3>
      <p style={{ color: '#999', marginBottom: 24 }}>
        {hasActiveFilters ? '试试调整筛选条件或看看其他推荐' : '成为第一个发布者吧'}
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 30 }}>
        {hasActiveFilters && <button className="btn btn-outline" onClick={clearFilters}>清除所有筛选</button>}
        <button className="btn btn-primary" onClick={() => navigate('/publish')}>去发布</button>
      </div>

      {hasActiveFilters && recommendListings.length > 0 && (
        <div style={{ textAlign: 'left' }}>
          <h4 style={{ marginBottom: 16, fontSize: 16, color: '#333' }}>
            🎯 猜你喜欢 · 热门推荐
          </h4>
          <div className="listing-grid">
            {recommendListings.slice(0, 4).map(l => (
              <ListingCard key={l.id} listing={l} navigate={navigate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: 30 }}>
      {user && browseHistory.length > 0 && (
        <div style={{ marginBottom: 24, padding: '16px 20px', background: '#fffbe6', borderRadius: 12, border: '1px solid #ffe58f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 500, fontSize: 14 }}>🕐 浏览足迹</span>
            <span style={{ color: '#1890ff', fontSize: 12, cursor: 'pointer' }} onClick={() => navigate('/profile')}>查看全部</span>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {browseHistory.map(l => (
              <div key={l.id} onClick={() => navigate(`/listing/${l.id}`)} style={{ minWidth: 180, padding: 12, background: '#fff', borderRadius: 8, cursor: 'pointer', flexShrink: 0, border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</div>
                <div style={{ fontSize: 14, color: '#ff4d4f', fontWeight: 'bold' }}>{l.price_min ? `¥${l.price_min.toLocaleString()}` : '面议'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="搜索招聘、租房、二手车、本地服务..."
          value={filters.keyword}
          onChange={handleKeywordChange}
          onKeyDown={e => e.key === 'Enter' && fetchListings()}
        />
        <button className="btn btn-primary" onClick={fetchListings}>搜索</button>
        <button className="btn btn-outline" onClick={() => setShowFilters(!showFilters)} style={{ marginLeft: 8 }}>
          {showFilters ? '收起筛选' : '高级筛选'} {hasActiveFilters ? `(${Object.values(filters).filter(v => v).length})` : ''}
        </button>
      </div>

      {showFilters && (
        <div className="filter-section">
          <div className="filter-row">
            <div className="filter-item"><label>城市</label><input type="text" value={filters.city} onChange={e => updateFilter('city', e.target.value)} placeholder="如：上海" /></div>
            <div className="filter-item"><label>区县</label><input type="text" value={filters.district} onChange={e => updateFilter('district', e.target.value)} placeholder="如：浦东新区" /></div>
            <div className="filter-item"><label>最低价</label><input type="number" value={filters.min_price} onChange={e => updateFilter('min_price', e.target.value)} placeholder="最低" /></div>
            <div className="filter-item"><label>最高价</label><input type="number" value={filters.max_price} onChange={e => updateFilter('max_price', e.target.value)} placeholder="最高" /></div>
          </div>
          <div className="filter-row">
            <div className="filter-item"><label>时间范围</label>
              <select value={filters.days_ago} onChange={e => updateFilter('days_ago', e.target.value)}>
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="filter-item"><label>认证状态</label>
              <select value={filters.is_verified} onChange={e => updateFilter('is_verified', e.target.value)}>
                <option value="">全部</option>
                <option value="1">已认证</option>
                <option value="0">未认证</option>
              </select>
            </div>
            <div className="filter-item"><label>紧急程度</label>
              <select value={filters.is_urgent} onChange={e => updateFilter('is_urgent', e.target.value)}>
                <option value="">全部</option>
                <option value="1">仅急售/急招</option>
              </select>
            </div>
            <div className="filter-item" style={{ marginLeft: 'auto' }}>
              <button className="btn btn-outline" onClick={clearFilters} style={{ fontSize: 12 }}>清除筛选</button>
            </div>
          </div>

          {isHouse && (
            <div className="filter-row">
              <div className="filter-item"><label>最小面积(㎡)</label><input type="number" value={filters.area_min} onChange={e => updateFilter('area_min', e.target.value)} placeholder="最小" /></div>
              <div className="filter-item"><label>最大面积(㎡)</label><input type="number" value={filters.area_max} onChange={e => updateFilter('area_max', e.target.value)} placeholder="最大" /></div>
              <div className="filter-item"><label>户型</label>
                <select value={filters.rooms} onChange={e => updateFilter('rooms', e.target.value)}>
                  {ROOM_OPTIONS.map(o => <option key={o} value={o === '不限' ? '' : o}>{o}</option>)}
                </select>
              </div>
              <div className="filter-item"><label>房源类型</label>
                <select value={filters.house_type} onChange={e => updateFilter('house_type', e.target.value)}>
                  {HOUSE_TYPES.map(o => <option key={o} value={o === '不限' ? '' : o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {isCar && (
            <div className="filter-row">
              <div className="filter-item"><label>品牌</label><input type="text" value={filters.car_brand} onChange={e => updateFilter('car_brand', e.target.value)} placeholder="如：宝马、奔驰" /></div>
              <div className="filter-item"><label>车龄</label>
                <select value={filters.car_year} onChange={e => updateFilter('car_year', e.target.value)}>
                  {CAR_YEARS.map(o => <option key={o} value={o === '不限' ? '' : o}>{o}</option>)}
                </select>
              </div>
              <div className="filter-item"><label>里程</label>
                <select value={filters.car_mileage} onChange={e => updateFilter('car_mileage', e.target.value)}>
                  {CAR_MILEAGE_OPTIONS.map(o => <option key={o} value={o === '不限' ? '' : o}>{o}</option>)}
                </select>
              </div>
              <div className="filter-item"><label>变速箱</label>
                <select value={filters.car_transmission} onChange={e => updateFilter('car_transmission', e.target.value)}>
                  {TRANSMISSION_OPTIONS.map(o => <option key={o} value={o === '不限' ? '' : o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {isJob && (
            <div className="filter-row">
              <div className="filter-item"><label>最低薪资</label><input type="number" value={filters.job_salary_min} onChange={e => updateFilter('job_salary_min', e.target.value)} placeholder="最低月薪" /></div>
              <div className="filter-item"><label>最高薪资</label><input type="number" value={filters.job_salary_max} onChange={e => updateFilter('job_salary_max', e.target.value)} placeholder="最高月薪" /></div>
              <div className="filter-item"><label>学历要求</label>
                <select value={filters.job_education} onChange={e => updateFilter('job_education', e.target.value)}>
                  {EDUCATION_OPTIONS.map(o => <option key={o} value={o === '不限' ? '' : o}>{o}</option>)}
                </select>
              </div>
              <div className="filter-item"><label>经验要求</label>
                <select value={filters.job_experience} onChange={e => updateFilter('job_experience', e.target.value)}>
                  {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o === '不限' ? '' : o}>{o}</option>)}
                </select>
              </div>
            </div>
          )}

          {isService && (
            <div className="filter-row">
              <div className="filter-item"><label>服务类型</label>
                <select value={filters.service_type} onChange={e => updateFilter('service_type', e.target.value)}>
                  <option value="">全部</option>
                  <option value="代驾">代驾</option>
                  <option value="保洁">保洁</option>
                  <option value="搬家">搬家</option>
                  <option value="维修">维修</option>
                  <option value="管道疏通">管道疏通</option>
                  <option value="开锁">开锁</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="category-tabs">
        <span className={`category-tab ${!filters.category_code ? 'active' : ''}`} onClick={() => updateFilter('category_code', '')}>全部</span>
        {categories.map(cat => (
          <span key={cat.id} className={`category-tab ${filters.category_code === cat.code ? 'active' : ''}`} onClick={() => updateFilter('category_code', cat.code)}>{cat.icon} {cat.name}</span>
        ))}
      </div>

      <div className="view-toggle">
        <button className="active">列表</button>
        <button onClick={() => navigate(`/map${location.search}`)}>地图</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>
      ) : listings.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div style={{ fontSize: 13, color: '#999', marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span>共 {total} 条结果</span>
            {filters.keyword && <span> · 🔍 "{filters.keyword}"</span>}
            {activeCategoryObj && <span> · {activeCategoryObj.icon} {activeCategoryObj.name}</span>}
            {filters.city && <span> · 📍 {filters.city}{filters.district ? ' ' + filters.district : ''}</span>}
            {filters.days_ago && <span> · 🕐 最近{filters.days_ago}天</span>}
            {filters.is_verified === '1' && <span style={{ color: '#52c41a' }}> · ✓ 已认证</span>}
            {filters.is_urgent === '1' && <span style={{ color: '#fa8c16' }}> · ⚡ 紧急</span>}
            {filters.min_price && <span> · ¥{filters.min_price}</span>}
            {filters.max_price && <span>-¥{filters.max_price}</span>}
            {isHouse && filters.area_min && <span> · {filters.area_min}㎡以上</span>}
            {isHouse && filters.rooms && <span> · {filters.rooms}</span>}
            {isCar && filters.car_brand && <span> · {filters.car_brand}</span>}
            {isCar && filters.car_mileage && <span> · {filters.car_mileage}</span>}
            {isJob && filters.job_education && <span> · {filters.job_education}</span>}
            {isJob && filters.job_salary_min && <span> · {filters.job_salary_min}-{filters.job_salary_max || '不限'}元</span>}
            {isService && filters.service_type && <span> · {filters.service_type}</span>}
          </div>
          <div className="listing-grid">
            {listings.map(l => <ListingCard key={l.id} listing={l} navigate={navigate} />)}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pn;
                if (totalPages <= 7) pn = i + 1;
                else if (page <= 4) pn = i + 1;
                else if (page >= totalPages - 3) pn = totalPages - 6 + i;
                else pn = page - 3 + i;
                return <button key={pn} className={page === pn ? 'active' : ''} onClick={() => setPage(pn)}>{pn}</button>;
              })}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ListingCard({ listing, navigate }) {
  return (
    <div className="listing-card" onClick={() => navigate(`/listing/${listing.id}`)}>
      {listing.images && listing.images[0] ? (
        <img src={listing.images[0]} alt="" className="listing-image" />
      ) : (
        <div className="listing-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', color: '#bbb', fontSize: 28 }}>
          {CATEGORY_ICONS[listing.category_code] || '📋'}
        </div>
      )}
      <div className="listing-content">
        <h3 className="listing-title">{listing.title}</h3>
        <div className="listing-price">
          {listing.price_min ? `¥${listing.price_min.toLocaleString()}` : '面议'}
          {listing.price_unit && <span>/{listing.price_unit}</span>}
        </div>
        <div className="listing-meta">
          <span>👁 {listing.view_count}</span>
          <span>📍 {listing.district || listing.city || '未知'}</span>
          {listing.created_at && <span>🕐 {new Date(listing.created_at).toLocaleDateString()}</span>}
        </div>
        <div className="listing-tags">
          {listing.is_verified && <span className="tag verified">✓ 已认证</span>}
          {listing.is_urgent && <span className="tag urgent">⚡ 急</span>}
          {listing.merchant_name && <span className="tag merchant">🏪 {listing.merchant_name.slice(0, 6)}</span>}
          <span className="tag">{CATEGORY_LABELS[listing.category_code] || listing.category_code}</span>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
