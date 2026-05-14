import React, { useEffect, useState, useRef } from 'react';
import { shareAPI } from '../../utils/api';
import { useToastStore } from '../../store/auth';

function AdminShares() {
  const { addToast } = useToastStore();
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewingShareId, setViewingShareId] = useState(null);
  const [shareRecords, setShareRecords] = useState([]);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    let cancelled = false;
    setLoading(true);
    try {
      const res = await shareAPI.getMyShares();
      if (cancelled) return;
      setShares(res.data || []);
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

  const handleViewRecords = async (shareId) => {
    if (viewingShareId) return;
    setViewingShareId(shareId);
    
    try {
      const res = await shareAPI.getRecords(shareId);
      setShareRecords(res.data || []);
      setShowRecordsModal(true);
    } catch (err) {
      addToast(err.message || '获取记录失败', 'error');
    } finally {
      if (isMountedRef.current) {
        setViewingShareId(null);
      }
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>分享管理</h2>

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn" onClick={loadData}>重试</button>
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>优惠券</th>
              <th>分享模式</th>
              <th>已领取/总数</th>
              <th>创建时间</th>
              <th>过期时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {shares.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>暂无数据</td>
              </tr>
            ) : (
              shares.map((share) => (
                <tr key={share.id}>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {share.id.substring(0, 8)}...
                  </td>
                  <td>{share.coupon_name}</td>
                  <td>{share.share_mode === 'chat' ? '微信聊天' : '朋友圈'}</td>
                  <td>{share.receive_count}/{share.total_count}</td>
                  <td>{new Date(share.created_at).toLocaleString()}</td>
                  <td>{new Date(share.expires_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn"
                      onClick={() => handleViewRecords(share.id)}
                      disabled={viewingShareId === share.id}
                      style={{ padding: '4px 12px' }}
                    >
                      {viewingShareId === share.id ? '加载中...' : '查看记录'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showRecordsModal && (
        <div className="modal-overlay" onClick={() => setShowRecordsModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3>领取记录</h3>
            <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              {shareRecords.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                  暂无领取记录
                </div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>用户</th>
                      <th>金额</th>
                      <th>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareRecords.map((record) => (
                      <tr key={record.id}>
                        <td>{record.username || record.receiver_openid?.substring(0, 8) || '匿名'}</td>
                        <td>¥{record.amount}</td>
                        <td>{new Date(record.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowRecordsModal(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminShares;
