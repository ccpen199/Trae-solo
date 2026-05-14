import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shareAPI, statisticsAPI } from '../utils/api';
import { useAuthStore, useToastStore } from '../store/auth';

function ShareReceive() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [shareInfo, setShareInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [receiving, setReceiving] = useState(false);
  const [received, setReceived] = useState(false);
  const [receivedCoupon, setReceivedCoupon] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (shareId) {
      loadShareInfo();
    }
  }, [shareId]);

  const loadShareInfo = async () => {
    setLoading(true);
    try {
      const res = await shareAPI.getInfo(shareId);
      if (!isMountedRef.current) return;
      
      if (res.success && res.data) {
        setShareInfo(res.data);
        statisticsAPI.record({ action: 'open', details: { share_id: shareId } }).catch(() => {});
      } else {
        setError(res.message || '分享不存在或已过期');
      }
    } catch (err) {
      if (!isMountedRef.current) return;
      setError(err.message || '加载失败');
    } finally {
      if (!isMountedRef.current) return;
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    if (!isAuthenticated) {
      addToast('请先登录后领取优惠券', 'info');
      navigate('/login', { state: { redirect: `/share/${shareId}` } });
      return;
    }

    if (receiving) return;
    setReceiving(true);
    
    try {
      const res = await shareAPI.receive({
        share_id: shareId,
        user_id: user.id
      });

      if (res.success) {
        setReceived(true);
        setReceivedCoupon(res.data);
        statisticsAPI.record({ action: 'receive', details: { share_id: shareId, amount: res.data.amount } }).catch(() => {});
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

  const handleWechatShare = () => {
    const shareUrl = window.location.href;
    copyToClipboard(shareUrl);
    addToast('已复制分享链接到剪贴板', 'info');
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

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button className="btn" onClick={() => navigate('/')}>返回首页</button>
      </div>
    );
  }

  if (received && receivedCoupon) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', textAlign: 'center' }}>
        <div className="wechat-share">
          <div style={{ fontSize: '48px' }}>🎉</div>
          <h2 style={{ marginTop: '16px' }}>领取成功！</h2>
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>¥{receivedCoupon.amount}</div>
            <div style={{ marginTop: '8px', opacity: 0.9 }}>{receivedCoupon.couponName}</div>
          </div>
          <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
            券码：{receivedCoupon.code}
          </div>
          <button
            className="share-btn"
            onClick={handleWechatShare}
            style={{ marginTop: '24px' }}
          >
            继续分享给好友
          </button>
        </div>
        <button
          className="btn"
          onClick={() => navigate('/coupons')}
          style={{ marginTop: '20px', width: '100%' }}
        >
          查看我的优惠券
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto' }}>
      <div className="wechat-share">
        <div style={{ fontSize: '48px' }}>🎁</div>
        <h2 style={{ marginTop: '16px' }}>分享红包</h2>
        <p style={{ marginTop: '8px', opacity: 0.9 }}>{shareInfo?.coupon_name}</p>

        <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>¥{shareInfo?.amount}</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.8 }}>
            {shareInfo?.coupon_type === 'random' ? '随机金额红包' : `满${shareInfo?.min_amount}元可用`}
          </div>
        </div>

        <div style={{ marginTop: '20px', fontSize: '14px', opacity: 0.8 }}>
          <p>👤 分享者：{shareInfo?.sharer_name}</p>
          <p style={{ marginTop: '8px' }}>
            📊 已领取：{shareInfo?.receive_count || 0}/{shareInfo?.total_count || 0}
          </p>
        </div>

        {shareInfo?.isExpired ? (
          <div style={{ marginTop: '20px', color: '#ffcc00' }}>
            该分享已过期或优惠券已领完
          </div>
        ) : (
          <button
            className="share-btn"
            onClick={handleReceive}
            disabled={receiving}
            style={{ marginTop: '24px' }}
          >
            {receiving ? '领取中...' : '立即领取'}
          </button>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          className="btn btn-secondary"
          onClick={handleWechatShare}
          style={{ width: '100%' }}
        >
          分享到微信
        </button>
      </div>

      <div className="card" style={{ marginTop: '20px', fontSize: '14px' }}>
        <h4 style={{ marginBottom: '12px' }}>📢 分享说明</h4>
        <ul style={{ paddingLeft: '20px', color: '#666' }}>
          <li>点击"立即领取"获取优惠券</li>
          <li>每用户限领一次</li>
          <li>优惠券有效期为{shareInfo?.valid_days || 30}天</li>
          <li>可分享给微信好友或朋友圈</li>
        </ul>
      </div>
    </div>
  );
}

export default ShareReceive;
