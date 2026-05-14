import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderAPI, shopAPI, couponAPI } from '../utils/api';
import { useAuthStore, useToastStore } from '../store/auth';

function OrderCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(location.state?.shopId || '');
  const [totalAmount, setTotalAmount] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [selectedCoupons, setSelectedCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: '/order/create' } });
      return;
    }

    let cancelled = false;
    
    shopAPI.getList()
      .then((res) => {
        if (cancelled) return;
        setShops(res.data || []);
        if (location.state?.shopId) {
          setSelectedShop(location.state.shopId);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    if (selectedShop && totalAmount) {
      let cancelled = false;
      
      couponAPI.autoSelect({ order_amount: totalAmount, shop_id: selectedShop })
        .then((res) => {
          if (cancelled) return;
          if (res.data) {
            setAvailableCoupons([res.data]);
          } else {
            setAvailableCoupons([]);
          }
        })
        .catch(() => !cancelled && setAvailableCoupons([]));

      return () => {
        cancelled = true;
      };
    }
  }, [selectedShop, totalAmount]);

  const handleCouponToggle = (couponId) => {
    setSelectedCoupons((prev) =>
      prev.includes(couponId) ? prev.filter((id) => id !== couponId) : [couponId]
    );
  };

  const calculateDiscount = () => {
    return selectedCoupons.reduce((sum, couponId) => {
      const coupon = availableCoupons.find((c) => c.id === couponId);
      return sum + (coupon?.amount || 0);
    }, 0);
  };

  const finalAmount = Math.max(0, (parseFloat(totalAmount) || 0) - calculateDiscount());

  const handleSubmit = async () => {
    if (!selectedShop || !totalAmount) {
      addToast('请选择店铺并输入金额', 'warning');
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    
    try {
      const res = await orderAPI.create({
        shop_id: selectedShop,
        total_amount: parseFloat(totalAmount),
        coupon_ids: selectedCoupons,
        user_id: user?.id
      });

      if (res.success) {
        addToast('订单创建成功，正在处理支付...', 'success');

        const payRes = await orderAPI.payCallback({
          order_id: res.data.orderId,
          payment_method: 'wechat'
        });

        if (payRes.success) {
          if (isMountedRef.current) {
            navigate('/pay/success', {
              state: {
                orderId: res.data.orderId,
                totalAmount: res.data.totalAmount,
                generatedCoupons: payRes.data.generatedCoupons
              }
            });
          }
        } else {
          addToast(payRes.message || '支付处理失败', 'error');
        }
      } else {
        addToast(res.message || '创建订单失败', 'error');
      }
    } catch (err) {
      addToast(err.message || '创建订单失败', 'error');
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>创建订单</h2>

      <div className="card">
        <div className="form-group">
          <label className="form-label">选择店铺</label>
          <select
            className="input"
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
          >
            <option value="">请选择店铺</option>
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>{shop.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">订单金额 (¥)</label>
          <input
            type="number"
            className="input"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="请输入订单金额"
            min="0"
            step="0.01"
          />
        </div>

        {availableCoupons.length > 0 && (
          <div className="form-group">
            <label className="form-label">可用优惠券</label>
            {availableCoupons.map((coupon) => (
              <div
                key={coupon.id}
                onClick={() => handleCouponToggle(coupon.id)}
                style={{
                  padding: '12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  background: selectedCoupons.includes(coupon.id) ? '#e6f7ff' : 'white',
                  borderColor: selectedCoupons.includes(coupon.id) ? '#1890ff' : '#d9d9d9'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold', color: '#ff6b6b' }}>¥{coupon.amount}</span>
                  <span>{coupon.type_name}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  满{coupon.min_amount || 0}元可用
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>订单金额:</span>
            <span>¥{parseFloat(totalAmount || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#52c41a' }}>
            <span>优惠券折扣:</span>
            <span>-¥{calculateDiscount().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px solid #d9d9d9' }}>
            <span>应付金额:</span>
            <span style={{ color: '#ff6b6b' }}>¥{finalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button
          className="btn"
          onClick={handleSubmit}
          disabled={submitting || !selectedShop || !totalAmount}
          style={{ width: '100%', marginTop: '20px' }}
        >
          {submitting ? '处理中...' : '提交订单'}
        </button>
      </div>
    </div>
  );
}

export default OrderCreate;
