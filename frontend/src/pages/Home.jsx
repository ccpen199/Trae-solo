import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shopAPI, couponAPI, activityAPI, statisticsAPI } from '../utils/api';

function Home() {
  const [shops, setShops] = useState([]);
  const [couponTypes, setCouponTypes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      shopAPI.getList().catch(() => ({ data: [] })),
      couponAPI.getTypes({ status: 'active' }).catch(() => ({ data: [] })),
      activityAPI.getList({ status: 'active' }).catch(() => ({ data: [] }))
    ])
      .then(([shopsRes, couponsRes, activitiesRes]) => {
        setShops(shopsRes.data || []);
        setCouponTypes(couponsRes.data || []);
        setActivities(activitiesRes.data || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <p>加载失败: {error}</p>
        <button className="btn" onClick={() => window.location.reload()}>重试</button>
      </div>
    );
  }

  return (
    <div>
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>🍜 热门店铺</h2>
        {shops.length === 0 ? (
          <div className="empty-state">暂无店铺</div>
        ) : (
          <div className="coupon-grid">
            {shops.slice(0, 4).map((shop) => (
              <Link to={`/shops/${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  <h3>{shop.name}</h3>
                  <p style={{ color: '#666', marginTop: '8px' }}>{shop.description}</p>
                  <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>{shop.address}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>🎁 优惠券中心</h2>
        {couponTypes.length === 0 ? (
          <div className="empty-state">暂无可用优惠券</div>
        ) : (
          <div className="coupon-grid">
            {couponTypes.slice(0, 6).map((type) => (
              <Link to={`/coupons/${type.id}`} key={type.id} style={{ textDecoration: 'none' }}>
                <div className="coupon-item">
                  <div className="coupon-amount">¥{type.amount}</div>
                  <div className="coupon-name">{type.name}</div>
                  <div className="coupon-condition">
                    {type.type === 'random' ? '随机金额' : '满' + type.min_amount + '元可用'}
                  </div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    剩余: {type.remain_count}/{type.total_count}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ marginBottom: '20px' }}>🎯 活动中</h2>
        {activities.length === 0 ? (
          <div className="empty-state">暂无可用活动</div>
        ) : (
          <div className="card">
            {activities.map((activity) => (
              <div key={activity.id} style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
                <h3>{activity.name}</h3>
                <p style={{ color: '#666', marginTop: '8px' }}>{activity.description}</p>
                <p style={{ color: '#999', fontSize: '12px', marginTop: '8px' }}>
                  {activity.start_time && activity.end_time
                    ? `${activity.start_time} 至 ${activity.end_time}`
                    : '长期有效'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
