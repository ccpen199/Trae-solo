import React, { useState, useEffect } from 'react';
import api from '../api/client.js';

function RelationsPage({ currentUser }) {
  const [activeTab, setActiveTab] = useState('following');
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('updated_at');
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [friendMessage, setFriendMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, page, sortBy]);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint;
      switch (activeTab) {
        case 'following':
          endpoint = `/relations/following?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`;
          break;
        case 'followers':
          endpoint = `/relations/followers?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`;
          break;
        case 'friends':
          endpoint = `/relations/friends?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}`;
          break;
        case 'blacklist':
          endpoint = `/relations/blacklist?page=${page}&pageSize=${pageSize}`;
          break;
        case 'requests':
          endpoint = `/relations/friend-requests?page=${page}&pageSize=${pageSize}`;
          break;
        default:
          endpoint = `/relations/following?page=${page}&pageSize=${pageSize}`;
      }
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    setLoading(false);
  };

  const handleFollow = async (userId) => {
    try {
      await api.post(`/relations/follow/${userId}`);
      alert('关注成功');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await api.post(`/relations/unfollow/${userId}`);
      alert('取关成功');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.post(`/relations/unblock/${userId}`);
      alert('解除拉黑成功');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleBlock = async () => {
    try {
      await api.post(`/relations/block/${selectedUserId}`, { reason: blockReason });
      alert('拉黑成功');
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedUserId(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await api.post(`/relations/friend-request/${selectedUserId}`, { message: friendMessage });
      alert('好友申请已发送');
      setShowFriendRequestModal(false);
      setFriendMessage('');
      setSelectedUserId(null);
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.post(`/relations/friend-request/${requestId}/accept`);
      alert('已通过好友申请');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await api.post(`/relations/friend-request/${requestId}/reject`);
      alert('已拒绝好友申请');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReport = async () => {
    try {
      await api.post(`/reports/${selectedUserId}`, { 
        type: reportType, 
        description: reportDescription 
      });
      alert('举报已提交');
      setShowReportModal(false);
      setReportType('');
      setReportDescription('');
      setSelectedUserId(null);
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const openFriendRequestModal = (userId) => {
    setSelectedUserId(userId);
    setShowFriendRequestModal(true);
  };

  const openReportModal = (userId) => {
    setSelectedUserId(userId);
    setShowReportModal(true);
  };

  const openBlockModal = (userId) => {
    setSelectedUserId(userId);
    setShowBlockModal(true);
  };

  const tabs = [
    { key: 'following', label: '关注' },
    { key: 'followers', label: '粉丝' },
    { key: 'friends', label: '好友' },
    { key: 'requests', label: '好友申请' },
    { key: 'blacklist', label: '黑名单' },
  ];

  const reportTypes = [
    { value: 'spam', label: '垃圾广告' },
    { value: 'harassment', label: '骚扰' },
    { value: 'fake', label: '虚假账号' },
    { value: 'inappropriate', label: ' inappropriate内容' },
    { value: 'other', label: '其他' },
  ];

  return (
    <div>
      <div className="card">
        <h3>我的关系概览</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{currentUser?.following_count || 0}</div>
            <div className="label">关注</div>
          </div>
          <div className="stat-card">
            <div className="value">{currentUser?.follower_count || 0}</div>
            <div className="label">粉丝</div>
          </div>
          <div className="stat-card">
            <div className="value">{currentUser?.friend_count || 0}</div>
            <div className="label">好友</div>
          </div>
          <div className="stat-card">
            <div className="value">{currentUser?.blacklist_count || 0}</div>
            <div className="label">黑名单</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab !== 'blacklist' && activeTab !== 'requests' && (
          <div className="filter-bar">
            <span>排序：</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="updated_at">按更新时间</option>
              <option value="intimacy_score">按亲密度</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="empty">加载中...</div>
        ) : data.list.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <div className="user-list">
            {activeTab === 'requests' ? (
              data.list.map(item => (
                <div key={item.id} className="user-item">
                  <div className="user-info">
                    <div className="avatar">{item.nickname?.charAt(0) || 'U'}</div>
                    <div className="user-details">
                      <h4>{item.nickname} <span className="badge mutual">@{item.username}</span></h4>
                      <p>{item.message || '申请添加好友'}</p>
                      <small>{new Date(item.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                  <div className="actions">
                    {item.status === 0 && (
                      <>
                        <button className="btn success" onClick={() => handleAcceptRequest(item.id)}>通过</button>
                        <button className="btn danger" onClick={() => handleRejectRequest(item.id)}>拒绝</button>
                      </>
                    )}
                    {item.status === 1 && <span className="tag resolved">已通过</span>}
                    {item.status === 2 && <span className="tag high">已拒绝</span>}
                  </div>
                </div>
              ))
            ) : activeTab === 'blacklist' ? (
              data.list.map(item => (
                <div key={item.id} className="user-item">
                  <div className="user-info">
                    <div className="avatar">{item.nickname?.charAt(0) || 'U'}</div>
                    <div className="user-details">
                      <h4>{item.nickname}</h4>
                      <p>拉黑原因：{item.reason || '无'}</p>
                      <small>{new Date(item.created_at).toLocaleString()}</small>
                    </div>
                  </div>
                  <div className="actions">
                    <button className="btn" onClick={() => handleUnblock(item.id)}>解除拉黑</button>
                  </div>
                </div>
              ))
            ) : (
              data.list.map(item => (
                <div key={item.id} className="user-item">
                  <div className="user-info">
                    <div className="avatar">{item.nickname?.charAt(0) || 'U'}</div>
                    <div className="user-details">
                      <h4>
                        {item.nickname}
                        {item.is_mutual && <span className="badge mutual">互相关注</span>}
                        {activeTab === 'friends' && <span className="badge friend">好友</span>}
                      </h4>
                      <p>{item.bio}</p>
                      {item.intimacy_score > 0 && (
                        <small>亲密度: {item.intimacy_score}</small>
                      )}
                    </div>
                  </div>
                  <div className="actions">
                    {activeTab === 'following' && (
                      <>
                        <button className="btn" onClick={() => handleUnfollow(item.id)}>取关</button>
                        <button className="btn" onClick={() => openFriendRequestModal(item.id)}>申请好友</button>
                        <button className="btn danger" onClick={() => openBlockModal(item.id)}>拉黑</button>
                      </>
                    )}
                    {activeTab === 'followers' && (
                      <>
                        {!item.is_following && (
                          <button className="btn primary" onClick={() => handleFollow(item.id)}>回关</button>
                        )}
                        {item.is_following && (
                          <button className="btn" onClick={() => handleUnfollow(item.id)}>取关</button>
                        )}
                        <button className="btn" onClick={() => openFriendRequestModal(item.id)}>申请好友</button>
                        <button className="btn danger" onClick={() => openBlockModal(item.id)}>拉黑</button>
                      </>
                    )}
                    {activeTab === 'friends' && (
                      <>
                        <button className="btn" onClick={() => openReportModal(item.id)}>举报</button>
                        <button className="btn danger" onClick={() => openBlockModal(item.id)}>拉黑</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {data.total > pageSize && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            <button className="active">{page}</button>
            <button disabled={page * pageSize >= data.total} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        )}
      </div>

      {showFriendRequestModal && (
        <div className="modal-overlay" onClick={() => setShowFriendRequestModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>发送好友申请</h3>
            <textarea
              placeholder="请输入验证消息（选填）"
              value={friendMessage}
              onChange={(e) => setFriendMessage(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowFriendRequestModal(false)}>取消</button>
              <button className="btn primary" onClick={handleSendFriendRequest}>发送</button>
            </div>
          </div>
        </div>
      )}

      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>拉黑用户</h3>
            <textarea
              placeholder="请输入拉黑原因（选填）"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowBlockModal(false)}>取消</button>
              <button className="btn danger" onClick={handleBlock}>确认拉黑</button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>举报用户</h3>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="">请选择举报类型</option>
              {reportTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <textarea
              placeholder="请描述具体问题（选填）"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowReportModal(false)}>取消</button>
              <button className="btn primary" onClick={handleReport}>提交举报</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RelationsPage;
