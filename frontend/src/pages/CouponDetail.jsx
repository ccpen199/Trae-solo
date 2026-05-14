import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { couponAPI, shareAPI } from '../utils/api';
import { useAuthStore, useToastStore } from '../store/auth';

function CouponDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [couponType, setCouponType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiving, setReceiving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    couponAPI.getTypeById(id)
      .then((res) => {
        if (!isMountedRef.current) return;
        if (res.data) {
          setCouponType(res.data);
        } else {
          setError(res.message || '优惠券不存在');
        }
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        setError(err.message || '加载失败');
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        setLoading(false);
      });
  }, [id]);

  const handleReceive = async () => {
    if (!isAuthenticated) {
      addToast('请先登录后领取优惠券', 'info');
      navigate('/login', { state: { redirect: window.location.pathname } });
      return;
    }

    if (receiving) return;
    setReceiving(true);
    
    try {
      const res = await couponAPI.receive({ type_id: id, user_id: user?.id });
      if (res.success) {
        addToast(`领取成功！优惠券金额：¥${res.data.amount}`, 'success');
        if (couponType) {
          setCouponType({ ...couponType, remain_count: couponType.remain_count - 1 });
        }
      } else {
        addToast(res.message || '领取失败', 'error');
      }
    } catch (err) {
      addToast(err.message || '领取失败', 'error');
    } finally {
      if (isMountedRef.current) {
        setReceiving(false);
      }
    }
  };

  const handleShare = async () => {
    if (!isAuthenticated) {
      addToast('请先登录后分享优惠券', 'info');
      navigate('/login', { state: { redirect: window.location.pathname } });
      return;
    }

    if (sharing) return;
    setSharing(true);
    
    try {
      const res = await shareAPI.create({
        type_id: id,
        share_mode: 'chat',
        total_count: 10
      });

      if (res.success) {
        const shareUrl = res.data.shareUrl;
        const shareId = res.data.shareId;

        copyToClipboard(shareUrl);
        addToast('已复制分享链接到剪贴板', 'info');
        
        navigate(`/share-detail/${shareId}`);
      } else {
        addToast(res.message || '创建分享失败', 'error');
        if (isMountedRef.current) {
          setSharing(false);
        }
      }
    } catch (err) {
      addToast(err.message || '创建分享失败', 'error');
      if (isMountedRef.current) {
        setSharing(false);
      }
    }
  };

  const copyToClipboard = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch (e) {
      console.warn('Copy to clipboard failed:', e);
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error || !couponType) {
    return (
      <div className="error-state">
        <p>{error || '优惠券不存在'}</p>
        <button className="btn" onClick={() => navigate('/coupons')}>返回优惠券列表</button>
      </div>
    );
  }

  return (
    <div>
      <button className="btn" onClick={() => navigate('/coupons')} style={{ marginBottom: '20px' }}>
        ← 返回优惠券列表
      </button>

      <div className="coupon-item" style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="coupon-amount" style={{ fontSize: '48px' }}>¥{couponType.amount}</div>
          <div className="coupon-name" style={{ fontSize: '18px', marginTop: '12px' }}>{couponType.name}</div>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '14px' }}>
            <p>📌 使用条件：{couponType.type === 'random' ? '随机金额优惠券' : `满${couponType.min_amount}元可用`}</p>
            <p style={{ marginTop: '8px' }}>⏰ 有效期：领取后{couponType.valid_days}天内</p>
            <p style={{ marginTop: '8px' }}>📊 剩余数量：{couponType.remain_count}/{couponType.total_count}</p>
            <p style={{ marginTop: '8px' }}>👥 每人限领：{couponType.per_user_limit}张</p>
            <p style={{ marginTop: '8px' }}>🏪 来源：{
              couponType.source === 'new_user' ? '新人专享' :
              couponType.source === 'shop' ? '进店领取' :
              couponType.source === 'share' ? '分享红包' :
              couponType.source === 'payment' ? '支付后发放' :
              couponType.source === 'activity' ? '活动发放' :
              couponType.source === 'game' ? '游戏领券' :
              couponType.source === 'member' ? '会员权益' : couponType.source
            }</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '400px', margin: '24px auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          className="btn"
          onClick={handleReceive}
          disabled={receiving || couponType.remain_count <= 0}
          style={{ width: '100%' }}
        >
          {receiving ? '领取中...' : couponType.remain_count <= 0 ? '已领完' : '立即领取'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleShare}
          disabled={sharing}
          style={{ width: '100%' }}
        >
          {sharing ? '生成分享链接中...' : '分享给好友'}
        </button>
      </div>

      <div className="card" style={{ maxWidth: '400px', margin: '0 auto', marginTop: '20px' }}>
        <h4 style={{ marginBottom: '12px' }}>💡 使用说明</h4>
        <ul style={{ paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
          <li>优惠券领取后可在"我的优惠券"中查看</li>
          <li>下单时系统会自动选择可用优惠券</li>
          <li>每笔订单只能使用一张优惠券</li>
          <li>优惠券不可叠加使用，不找零</li>
        </ul>
      </div>
    </div>
  );
}

export default CouponDetail;
