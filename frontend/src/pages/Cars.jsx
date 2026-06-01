import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { carAPI } from '../api/client';
import useAuthStore from '../store/authStore';

function Cars() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState([]);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    page: parseInt(searchParams.get('page')) || 1,
    pageSize: 20,
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadCars();
    loadAgencies();
  }, [filters]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const res = await carAPI.getCars(filters);
      setCars(res.data.cars || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('加载失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const res = await carAPI.getAgencies({ region_code: user?.region_code });
      setAgencies(res.data.agencies || []);
    } catch (err) {
      console.error('加载机构失败', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    syncParams({ ...filters, page: 1 });
  };

  const syncParams = (f) => {
    const params = {};
    Object.keys(f).forEach(k => {
      if (f[k]) params[k] = f[k];
    });
    setSearchParams(params);
  };

  const handlePageChange = (p) => {
    setFilters({ ...filters, page: p });
    syncParams({ ...filters, page: p });
  };

  const totalPages = Math.ceil(total / filters.pageSize);
  const currentYear = new Date().getFullYear();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">二手车市场</h1>
        {user && <span className="region-info">常驻区划：{user.region_code}</span>}
      </div>
      
      <div className="card filter-card">
        <form onSubmit={handleSearch} className="filter-form">
          <div className="form-row">
            <div className="form-group">
              <label>关键词</label>
              <input
                type="text"
                placeholder="品牌、车型..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>品牌</label>
              <input
                type="text"
                placeholder="如：大众、丰田"
                value={filters.brand}
                onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>价格区间(万)</label>
              <div className="input-group">
                <input
                  type="number"
                  placeholder="最低"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="最高"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">搜索</button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilters({ keyword: '', brand: '', minPrice: '', maxPrice: '', page: 1, pageSize: 20 });
                setSearchParams({});
              }}
            >重置</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="loading">加载中...</div>
      ) : cars.length === 0 ? (
        <div className="empty">暂无车辆信息</div>
      ) : (
        <>
          <div className="list-grid">
            {cars.map((car) => {
              const carAge = currentYear - car.year;
              return (
                <div key={car.id} className="card list-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/cars/${car.id}`)}>
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{car.title}</h3>
                    {car.vin_verified === 1 && (
                      <span className="badge badge-success">VIN已核验</span>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="car-info">
                      <p><strong>{car.brand} {car.model}</strong></p>
                      <p>{car.year}年款 · {car.mileage}万公里 · {car.fuel_type || '汽油'}</p>
                      <p>{car.transmission || '自动'}</p>
                      <p>📍 {car.region_name}</p>
                    </div>
                  </div>

                  <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>VIN码：</strong>
                      {car.vin ? `${car.vin.substring(0, 8)}********` : '未录入'}
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>车龄核算：</strong>
                      {car.year}年生产，已使用 <span style={{ color: carAge > 8 ? '#dc3545' : carAge > 5 ? '#ffc107' : '#28a745' }}>{carAge}年</span>
                    </div>
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>事故记录：</strong>
                      {car.accident_history
                        ? <span style={{ color: car.accident_history === '无事故' ? '#28a745' : '#dc3545' }}>{car.accident_history}</span>
                        : <span style={{ color: '#888' }}>待VIN解析查询</span>}
                    </div>
                    <div>
                      <strong>检测预约：</strong>
                      {car.inspection_booked === 1
                        ? <span style={{ color: '#28a745' }}>✅ 已预约</span>
                        : <span style={{ color: '#007bff', cursor: 'pointer' }}>📋 点击详情页预约检测 →</span>}
                    </div>
                  </div>

                  <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className="price" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e74c3c' }}>¥{car.price}万</span>
                    <span className="card-date">{new Date(car.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {agencies.length > 0 && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <h3>🔧 本地检测机构预约通道</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                {agencies.map((agency) => (
                  <div key={agency.id} style={{ padding: '0.75rem', border: '1px solid #e0e0e0', borderRadius: '6px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{agency.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>📍 {agency.address}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>📞 {agency.phone}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>⏰ {agency.business_hours || '周一至周六 9:00-18:00'}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>💰 ¥{agency.price || 300}起</div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.25rem' }}>请点击上方车辆卡片进入详情页预约检测</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={filters.page <= 1}
                onClick={() => handlePageChange(filters.page - 1)}
              >上一页</button>
              <span className="page-info">第 {filters.page} / {totalPages} 页，共 {total} 条</span>
              <button
                className="btn btn-secondary"
                disabled={filters.page >= totalPages}
                onClick={() => handlePageChange(filters.page + 1)}
              >下一页</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Cars;
