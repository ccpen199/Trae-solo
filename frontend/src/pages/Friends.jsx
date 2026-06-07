import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store.js';
import { userAPI } from '../api.js';

export default function Friends() {
  const { user } = useStore();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState('phone');
  const [friendIdentifier, setFriendIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userAPI.getFriends();
      setFriends(res.data.friends || []);
    } catch (e) {
      setError(e.response?.data?.error || '获取好友列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!friendIdentifier.trim()) {
      alert(`请输入${addType === 'phone' ? '手机号' : '微信ID'}`);
      return;
    }
    setSubmitting(true);
    try {
      const data = addType === 'phone'
        ? { phone: friendIdentifier.trim() }
        : { wechat_id: friendIdentifier.trim() };
      await userAPI.addFriend(data);
      setSuccess('好友添加成功！');
      setShowAddModal(false);
      setFriendIdentifier('');
      fetchFriends();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.response?.data?.error || '添加好友失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container page-content">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1 className="page-title">👥 好友管理</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          ➕ 添加好友
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          <span>✅</span>
          {success}
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <span>❌</span>
          {error}
        </div>
      )}

      <div className="card">
        {friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-text">暂无好友，快去添加吧！</div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>好友</th>
                <th>联系方式</th>
                <th>所在公司</th>
                <th>职位</th>
                <th>微信验证</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {friends.map(friend => (
                <tr key={friend.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        {friend.username?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{friend.username}</span>
                    </div>
                  </td>
                  <td>
                    {friend.phone || friend.wechat_id || '-'}
                  </td>
                  <td>
                    {friend.company_name ? (
                      <Link to={`/companies/${friend.company_id}`} style={{ color: '#667eea' }}>
                        {friend.company_name}
                      </Link>
                    ) : '-'}
                  </td>
                  <td>{friend.position || '-'}</td>
                  <td>
                    {friend.wechat_verified ? (
                      <span className="tag verified">✓ 已验证</span>
                    ) : (
                      <span className="tag" style={{ background: '#f5f5f5', color: '#999' }}>未验证</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {friend.company_id && (
                        <Link
                          to={`/jobs?friend_id=${friend.id}&company_id=${friend.company_id}`}
                          className="btn btn-sm btn-primary"
                        >
                          查看职位
                        </Link>
                      )}
                      <Link
                        to={`/messages?user_id=${friend.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        发消息
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">➕ 添加好友</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">添加方式</label>
                <div className="role-selector">
                  <div
                    className={`role-option ${addType === 'phone' ? 'selected' : ''}`}
                    onClick={() => setAddType('phone')}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>📱</div>
                    <div>手机号</div>
                  </div>
                  <div
                    className={`role-option ${addType === 'wechat' ? 'selected' : ''}`}
                    onClick={() => setAddType('wechat')}
                  >
                    <div style={{ fontSize: 24, marginBottom: 4 }}>💬</div>
                    <div>微信ID</div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  {addType === 'phone' ? '好友手机号' : '好友微信ID'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={friendIdentifier}
                  onChange={(e) => setFriendIdentifier(e.target.value)}
                  placeholder={addType === 'phone' ? '请输入好友手机号' : '请输入好友微信ID'}
                />
              </div>
              <div className="alert alert-info">
                <span>ℹ️</span>
                添加好友后，您可以查看对方公司的在招职位并发起内推
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={handleAddFriend}
                disabled={submitting || !friendIdentifier.trim()}
              >
                {submitting ? '添加中...' : '添加好友'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
