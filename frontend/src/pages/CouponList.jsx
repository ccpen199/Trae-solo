import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { couponAPI } from '../utils/api';
import { useAuthStore } from '../store/auth';

function CouponList() {
  const { isAuthenticated } = useAuthStore();
  const [myCoupons, setMyCoupons] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('available');

  useEffect(() => {
    Promise.all([
      couponAPI.getTypes({ status: 'active' }).catch(() => ({ data: [] })),
      isAuthenticated ? couponAPI.getMyCoupons().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ])
      .then(([typesRes, myRes]) => {
        setAllTypes(typesRes.data || []);
        setMyCoupons(myRes.data || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAuthenticated]);

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

  const unusedCoupons = myCoupons.filter(c => c.status === 'unused');
  const usedCoupons = myCoupons.filter(c => c.status === 'used');

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>🎫 我的优惠券</h2>

      {isAuthenticated ? (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button
              className={`btn ${tab === 'available' ? '' : 'btn-secondary'}`}
              onClick={() => setTab('available')}
            >
              可用 ({unusedCoupons.length})
            </button>
            <button
              className={`btn ${tab === 'used' ? '' : 'btn-secondary'}`}
              onClick={() => setTab('used')}
            >
              已使用 ({usedCoupons.length})
            </button>
            <button
              className={`btn ${tab === 'all' ? '' : 'btn-secondary'}`}
              onClick={() => setTab('all')}
            >
              全部 ({myCoupons.length})
            </button>
          </div>

          {tab === 'available' && (
            <div className="coupon-grid">
              {unusedCoupons.length === 0 ? (
                <div className="empty-state">暂无可用优惠券</div>
              ) : (
                unusedCoupons.map((coupon) => (
                  <div key={coupon.id} className="coupon-item unused">
                    <div className="coupon-amount">¥{coupon.amount}</div>
                    <div className="coupon-name">{coupon.type_name}</div>
                    <div className="coupon-condition">满{coupon.min_amount || 0}元可用</div>
                    <div className="coupon-status">未使用</div>
                    <div style={{ fontSize: '11px', marginTop: '8px' }}>
                      有效期至: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '永久'}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>券码: {coupon.code}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'used' && (
            <div className="coupon-grid">
              {usedCoupons.length === 0 ? (
                <div className="empty-state">暂无已使用优惠券</div>
              ) : (
                usedCoupons.map((coupon) => (
                  <div key={coupon.id} className="coupon-item used">
                    <div className="coupon-amount">¥{coupon.amount}</div>
                    <div className="coupon-name">{coupon.type_name}</div>
                    <div className="coupon-status">已使用</div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'all' && (
            <div className="coupon-grid">
              {myCoupons.length === 0 ? (
                <div className="empty-state">暂无优惠券</div>
              ) : (
                myCoupons.map((coupon) => (
                  <div key={coupon.id} className={`coupon-item ${coupon.status}`}>
                    <div className="coupon-amount">¥{coupon.amount}</div>
                    <div className="coupon-name">{coupon.type_name}</div>
                    <div className="coupon-status">
                      {coupon.status === 'unused' ? '未使用' : coupon.status === 'used' ? '已使用' : '已过期'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <p>登录后查看我的优惠券</p>
          <Link to="/login" className="btn" style={{ marginTop: '16px' }}>去登录</Link>
        </div>
      )}

      <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>🎁 领取优惠券</h2>
      <div className="coupon-grid">
        {allTypes.map((type) => (
          <Link to={`/coupons/${type.id}`} key={type.id} style={{ textDecoration: 'none' }}>
            <div className="coupon-item">
              <div className="coupon-amount">¥{type.amount}</div>
              <div className="coupon-name">{type.name}</div>
              <div className="coupon-condition">
                {type.type === 'random' ? '随机金额' : `满${type.min_amount}元可用`}
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                剩余: {type.remain_count}/{type.total_count}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CouponList;
