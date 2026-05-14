import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shareAPI } from '../utils/api';
import { useAuthStore, useToastStore } from '../store/auth';

function ShareDetail() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();
  const [share, setShare] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (shareId) {
      loadShareDetail();
    }
  }, [shareId]);

  const loadShareDetail = async () => {
    let cancelled = false;
    setLoading(true);
    try {
      const res = await shareAPI.getInfo(shareId);
      if (cancelled) return;
      
      if (res.success && res.data) {
        setShare(res.data);
        setRecords(res.data.receiveRecords || []);
      } else {
        setError('分享不存在');
      }
    } catch (err) {
      if (cancelled) return;
      setError(err.message || '加载失败');
    } finally {
      if (cancelled) return;
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  };

  const handleWechatShare = () => {
    const shareUrl = window.location.origin + '/share/' + shareId;
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

  if (error || !share) {
    return (
      <div className="error-state">
        <p>{error || '分享不存在'}</p>
        <button className="btn" onClick={() => navigate('/')}>返回首页</button>
      </div>
    );
  }

  const isOwner = user && share.user_id === user.id;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button className="btn" onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        ← 返回
      </button>

      <div className="card">
        <h2 style={{ color: '#07c160' }}>📤 分享详情</h2>

        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>分享者:</span>
            <span>{share.sharer_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>优惠券:</span>
            <span>{share.coupon_name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>分享模式:</span>
            <span>{share.share_mode === 'chat' ? '微信聊天' : '朋友圈'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>已领取:</span>
            <span>{share.receive_count} / {share.total_count}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>过期时间:</span>
            <span>{new Date(share.expires_at).toLocaleString()}</span>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          <button
            className="btn"
            onClick={handleWechatShare}
            style={{ flex: 1, backgroundColor: '#07c160' }}
          >
            分享到微信
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/coupons/${share.type_id}`)}
            style={{ flex: 1 }}
          >
            查看优惠券
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>领取记录</h3>

        {records.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>暂无领取记录</div>
        ) : (
          <table className="table" style={{ marginTop: '12px' }}>
            <thead>
              <tr>
                <th>用户</th>
                <th>金额</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.username || (record.receiver_openid ? record.receiver_openid.substring(0, 8) : '匿名')}</td>
                  <td>¥{record.amount}</td>
                  <td>{new Date(record.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isOwner && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>📊 分享数据</h3>
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span>分享链接:</span>
              <span style={{ color: '#1890ff', wordBreak: 'break-all' }}>
                {window.location.origin}/share/{shareId}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShareDetail;
