import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { homeAPI, regionAPI } from '../api/client';

function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('110105');
  const [regionList, setRegionList] = useState([]);
  const user = useAuthStore((state) => state.user);
  const setRegion = useAuthStore((state) => state.setRegion);
  const navigate = useNavigate();

  useEffect(() => {
    loadRegionList();
  }, []);

  useEffect(() => {
    loadHome();
  }, [selectedRegion, user]);

  const loadRegionList = async () => {
    try {
      const res = await regionAPI.getRegions({ level: 3 });
      setRegionList(res.data.regions || []);
    } catch (err) {
      console.error('加载区域失败', err);
    }
  };

  const loadHome = async () => {
    setLoading(true);
    try {
      let res;
      if (user) {
        res = await homeAPI.getHome();
      } else {
        res = await homeAPI.getGuestHome(selectedRegion);
      }
      setData(res.data);
      if (res.data.region) setRegion(res.data.region);
    } catch (err) {
      console.error('加载首页失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (item) => {
    const routes = {
      job: `/jobs/${item.id}`,
      rent: `/properties/${item.id}`,
      secondhand: `/properties/${item.id}`,
      used_car: `/cars/${item.id}`,
      news: `/news/${item.id}`,
    };
    if (routes[item.category]) {
      navigate(routes[item.category]);
    }
  };

  const formatPrice = (item) => {
    if (item.price === undefined || item.price === null) return '';
    switch (item.category) {
      case 'rent': return `${item.price}元/月`;
      case 'secondhand': return `${item.price}万`;
      case 'used_car': return `${item.price}万`;
      case 'job':
        if (item.salary_type === 'hourly') return `${item.hourly_rate || '面议'}元/小时`;
        return `${item.salary_min || 0}-${item.salary_max || 0}元/月`;
      default: return '';
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!data) return <div className="loading">加载失败，请刷新重试</div>;

  const currentRegionName = user
    ? (data.userRegion?.name || data.region?.name || user.region_code)
    : data.region?.name;

  return (
    <div>
      <div className="page-header">
        <h1>本地生活信息聚合平台</h1>
        <div className="region-info">
          {user ? (
            <span>
              🏠 常驻区划：<strong>{currentRegionName}</strong>
              {data.densityFactor && <span style={{ marginLeft: '1rem', color: '#888' }}>POI密度系数：{data.densityFactor.toFixed(2)}</span>}
            </span>
          ) : (
            <span>
              当前区域：
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
              >
                {regionList.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
              {data.densityFactor && <span style={{ marginLeft: '1rem', color: '#888' }}>POI密度系数：{data.densityFactor.toFixed(2)}</span>}
            </span>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/jobs')} style={{ cursor: 'pointer' }}>
          <div className="label">招聘信息</div>
          <div className="value">{data.stats?.job_count || 0}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/properties?type=rent')} style={{ cursor: 'pointer' }}>
          <div className="label">租房信息</div>
          <div className="value">{data.stats?.rent_count || 0}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/properties?type=secondhand')} style={{ cursor: 'pointer' }}>
          <div className="label">二手房源</div>
          <div className="value">{data.stats?.secondhand_count || 0}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/cars')} style={{ cursor: 'pointer' }}>
          <div className="label">二手车源</div>
          <div className="value">{data.stats?.used_car_count || 0}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/news')} style={{ cursor: 'pointer' }}>
          <div className="label">本地资讯</div>
          <div className="value">{data.stats?.news_count || 0}</div>
        </div>
      </div>

      <h2 className="section-title">智能推荐（按POI密度排序）</h2>
      <div className="card-grid">
        {data.recommended?.slice(0, 8).map((item) => (
          <div key={`${item.category}-${item.id}`} className="card" onClick={() => handleCardClick(item)}>
            <div className="card-title">{item.title}</div>
            <div className="card-meta">
              {item.region_name} | {new Date(item.created_at || item.publish_time).toLocaleDateString()}
            </div>
            {item.price !== undefined && item.price !== null && (
              <div className="card-price">{formatPrice(item)}</div>
            )}
            <div className="card-badges">
              {item.verified === 1 && <span className="badge badge-verified">已核验</span>}
              {item.vin_verified === 1 && <span className="badge badge-verified">VIN已核验</span>}
              {item.property_verified === 1 && <span className="badge badge-verified">产权已核验</span>}
              {item.landlord_id_verified === 1 && <span className="badge badge-verified">房东已核验</span>}
              {item.is_hot === 1 && <span className="badge badge-hot">热门</span>}
              {item.source === 'ugc' && <span className="badge badge-ugc">居民爆料</span>}
              {item.source === 'pgc' && <span className="badge badge-pgc">政务发布</span>}
            </div>
          </div>
        ))}
      </div>

      {data.categorized?.jobs?.length > 0 && (
        <>
          <h2 className="section-title">热门招聘</h2>
          <div className="card-grid">
            {data.categorized.jobs.slice(0, 4).map((item) => (
              <div key={`job-${item.id}`} className="card" onClick={() => navigate(`/jobs/${item.id}`)}>
                <div className="card-title">{item.title}</div>
                <div className="card-meta">{item.employer_name} | {item.region_name}</div>
                <div className="card-price">
                  {item.salary_type === 'hourly' ? `${item.hourly_rate || '面议'}元/小时` : `${item.salary_min || 0}-${item.salary_max || 0}元/月`}
                </div>
                <div className="card-badges">
                  {item.verified === 1 && <span className="badge badge-verified">已核验</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.categorized?.properties?.length > 0 && (
        <>
          <h2 className="section-title">优质房源</h2>
          <div className="card-grid">
            {data.categorized.properties.slice(0, 4).map((item) => (
              <div key={`prop-${item.id}`} className="card" onClick={() => navigate(`/properties/${item.id}`)}>
                <div className="card-title">{item.title}</div>
                <div className="card-meta">{item.area}㎡ | {item.rooms}室 | {item.address}</div>
                <div className="card-price">
                  {item.type === 'rent' ? `${item.price}元/月` : `${item.price}万`}
                </div>
                <div className="card-badges">
                  {item.property_verified === 1 && <span className="badge badge-verified">产权已核验</span>}
                  {item.landlord_id_verified === 1 && <span className="badge badge-verified">房东已核验</span>}
                  {item.type === 'secondhand' && item.property_reg_no && (
                    <span className="badge badge-info">登记号:{item.property_reg_no}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.categorized?.used_cars?.length > 0 && (
        <>
          <h2 className="section-title">二手车源</h2>
          <div className="card-grid">
            {data.categorized.used_cars.slice(0, 4).map((item) => (
              <div key={`car-${item.id}`} className="card" onClick={() => navigate(`/cars/${item.id}`)}>
                <div className="card-title">{item.title}</div>
                <div className="card-meta">
                  {item.brand} {item.model} | {item.year}年 | {item.mileage}万公里
                </div>
                <div className="card-price">{item.price}万</div>
                <div className="card-badges">
                  {item.vin_verified === 1 && <span className="badge badge-verified">VIN已核验</span>}
                  {item.accident_history && <span className="badge badge-info">{item.accident_history}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data.categorized?.news?.length > 0 && (
        <>
          <h2 className="section-title">本地资讯</h2>
          <div className="card-grid">
            {data.categorized.news.slice(0, 4).map((item) => (
              <div key={`news-${item.id}`} className="card" onClick={() => navigate(`/news/${item.id}`)}>
                <div className="card-title">{item.title}</div>
                <div className="card-meta">
                  {item.source === 'pgc' ? '政务通知' : '居民爆料'} | {item.views}次浏览
                </div>
                <div className="card-badges">
                  {item.is_hot === 1 && <span className="badge badge-hot">热门</span>}
                  {item.source === 'ugc' && <span className="badge badge-ugc">UGC</span>}
                  {item.source === 'pgc' && <span className="badge badge-pgc">PGC</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
