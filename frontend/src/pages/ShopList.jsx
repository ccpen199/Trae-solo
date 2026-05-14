import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { shopAPI } from '../utils/api';

function ShopList() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    shopAPI.getList()
      .then((res) => {
        setShops(res.data || []);
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
      <h2 style={{ marginBottom: '20px' }}>🏪 全部店铺</h2>

      {shops.length === 0 ? (
        <div className="empty-state">暂无店铺</div>
      ) : (
        <div className="coupon-grid">
          {shops.map((shop) => (
            <Link to={`/shops/${shop.id}`} key={shop.id} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', height: '100%' }}>
                <h3 style={{ color: '#1890ff' }}>{shop.name}</h3>
                <p style={{ color: '#666', marginTop: '12px' }}>{shop.description}</p>
                <p style={{ color: '#999', fontSize: '13px', marginTop: '12px' }}>📍 {shop.address}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ShopList;
