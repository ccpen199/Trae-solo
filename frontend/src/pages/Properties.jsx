import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { propertyAPI } from '../api/client';

function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || 'rent',
    keyword: '',
    min_price: '',
    max_price: '',
    rooms: '',
    page: 1,
    page_size: 20
  });

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam && typeParam !== filters.type) {
      setFilters(f => ({ ...f, type: typeParam }));
    }
  }, [searchParams]);

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (user) params.region_code = user.region_code;
      const res = await propertyAPI.getProperties(params);
      setProperties(res.data.properties || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('加载房源失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    const params = {};
    if (newFilters.type) params.type = newFilters.type;
    if (newFilters.keyword) params.keyword = newFilters.keyword;
    setSearchParams(params);
  };

  const totalPages = Math.ceil(total / filters.page_size);

  return (
    <div>
      <div className="page-header">
        <h1>房产信息</h1>
        <div className="region-info">
          {user && <span>常驻区划：{user.region_code}</span>}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${filters.type === 'rent' ? 'active' : ''}`}
          onClick={() => handleFilterChange('type', 'rent')}
        >
          租房
        </button>
        <button
          className={`tab ${filters.type === 'secondhand' ? 'active' : ''}`}
          onClick={() => handleFilterChange('type', 'secondhand')}
        >
          二手房
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="搜索小区/地址"
          value={filters.keyword}
          onChange={(e) => handleFilterChange('keyword', e.target.value)}
        />
        <input
          type="number"
          placeholder="最低价格"
          value={filters.min_price}
          onChange={(e) => handleFilterChange('min_price', e.target.value)}
        />
        <input
          type="number"
          placeholder="最高价格"
          value={filters.max_price}
          onChange={(e) => handleFilterChange('max_price', e.target.value)}
        />
        <select value={filters.rooms} onChange={(e) => handleFilterChange('rooms', e.target.value)}>
          <option value="">居室不限</option>
          <option value="1">1室</option>
          <option value="2">2室</option>
          <option value="3">3室</option>
          <option value="4">4室及以上</option>
        </select>
      </div>

      {loading && <div className="loading">加载中...</div>}

      {!loading && properties.length === 0 && <div className="empty">暂无房源信息</div>}

      <div className="card-grid">
        {properties.map((p) => (
          <div key={p.id} className="card" onClick={() => navigate(`/properties/${p.id}`)} style={{ cursor: 'pointer' }}>
            <div className="card-title">{p.title}</div>
            <div className="card-meta">
              {p.area}㎡ | {p.rooms}室 | {p.address}
            </div>
            <div className="card-price">
              {p.type === 'rent' ? `${p.price}元/月` : `${p.price}万`}
            </div>

            {p.type === 'secondhand' && (
              <div className="card-verify-info" style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>不动产登记编号：</strong>
                  {p.property_reg_no || '未关联'}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>产权校验：</strong>
                  {p.property_verified === 1
                    ? <span style={{ color: '#28a745' }}>✅ 已通过（来源：不动产登记中心）</span>
                    : <span style={{ color: '#dc3545' }}>❌ 未校验</span>}
                </div>
                <div>
                  <strong>房东身份核验：</strong>
                  {p.landlord_id_verified === 1
                    ? <span style={{ color: '#28a745' }}>✅ 已通过</span>
                    : <span style={{ color: '#dc3545' }}>❌ 未核验</span>}
                </div>
              </div>
            )}

            {p.type === 'rent' && (
              <div className="card-verify-info" style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>房东姓名：</strong>{p.landlord_name || '暂无'}
                </div>
                <div style={{ marginBottom: '0.25rem' }}>
                  <strong>房东身份核验：</strong>
                  {p.landlord_id_verified === 1
                    ? <span style={{ color: '#28a745' }}>✅ 身份凭证已上传，审核通过</span>
                    : <span style={{ color: '#dc3545' }}>❌ 身份凭证未上传/未审核</span>}
                </div>
                <div>
                  <strong>核验状态：</strong>
                  {p.landlord_id_verified === 1
                    ? <span style={{ color: '#28a745' }}>正常</span>
                    : <span style={{ color: '#ffc107' }}>⚠ 待核验，请谨慎交易</span>}
                </div>
              </div>
            )}

            <div className="card-badges" style={{ marginTop: '0.5rem' }}>
              {p.type === 'secondhand' && <span className="badge badge-pgc">二手房</span>}
              {p.type === 'rent' && <span className="badge badge-ugc">租房</span>}
              {p.property_verified === 1 && <span className="badge badge-verified">产权已核验</span>}
              {p.landlord_id_verified === 1 && <span className="badge badge-verified">房东已核验</span>}
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={filters.page === i + 1 ? 'active' : ''}
              onClick={() => handleFilterChange('page', i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Properties;
