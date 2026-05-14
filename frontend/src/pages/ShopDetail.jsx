import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopAPI, couponAPI } from '../utils/api';
import { useAuthStore, useToastStore } from '../store/auth';

function ShopDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [shop, setShop] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiving, setReceiving] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    Promise.all([
      shopAPI.getById(id).catch(() => null),
      couponAPI.getTypes({ shop_id: id, status: 'active' }).catch(() => ({ data: [] }))
    ])
      .then(([shopRes, couponsRes]) => {
        if (cancelled) return;
        
        if (shopRes?.data) {
          setShop(shopRes.data);
          setCoupons(couponsRes?.data || []);
        } else {
          setError('店铺不存在');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || '加载失败');
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleReceiveCoupon = async (typeId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: window.location.pathname } });
      return;
    }

    if (receiving === typeId) return;
    setReceiving(typeId);
    
    try {
      const res = await couponAPI.receive({ type_id: typeId, user_id: user?.id });
      if (res.success) {
        addToast(`领取成功！优惠券金额：¥${res.data.amount}`, 'success');
        setCoupons(coupons.map(c => c.id === typeId ? { ...c, remain_count: c.remain_count - 1 } : c));
      } else {
        addToast(res.message || '领取失败', 'error');
      }
    } catch (err) {
      addToast(err.message || '领取失败', 'error');
    } finally {
      if (isMountedRef.current) {
        setReceiving(null);
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error || !shop) {
    return (
      <div className="error-state">
        <p>{error || '店铺不存在'}</p>
        <button className="btn" onClick={() => navigate('/shops')}>返回店铺列表</button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn" onClick={() => navigate('/shops')} style={{ marginBottom: '20px' }}>
        ← 返回店铺列表
      </button>

      <div className="card">
        <h1 style={{ color: '#1890ff' }}>{shop.name}</h1>
        <p style={{ marginTop: '12px', color: '#666' }}>{shop.description}</p>
        <p style={{ marginTop: '8px', color: '#999' }}>📍 {shop.address}</p>
      </div>

      <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>🎫 店铺优惠券</h2>

      {coupons.length === 0 ? (
        <div className="empty-state">该店铺暂无可领取的优惠券</div>
      ) : (
        <div className="coupon-grid">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="coupon-item">
              <div className="coupon-amount">¥{coupon.amount}</div>
              <div className="coupon-name">{coupon.name}</div>
              <div className="coupon-condition">
                {coupon.type === 'random' ? '随机金额' : `满${coupon.min_amount}元可用`}
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                剩余: {coupon.remain_count}/{coupon.total_count}
              </div>
              <button
                className="btn"
                disabled={receiving === coupon.id || coupon.remain_count <= 0}
                onClick={() => handleReceiveCoupon(coupon.id)}
                style={{ marginTop: '12px', width: '100%' }}
              >
                {receiving === coupon.id ? '领取中...' :
                  coupon.remain_count <= 0 ? '已领完' : '立即领取'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/order/create', { state: { shopId: id } })}
          style={{ width: '100%' }}
        >
          去下单使用优惠券
        </button>
      </div>
    </div>
  );
}

export default ShopDetail;
