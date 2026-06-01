import React, { useState, useEffect } from 'react';
import api from '../api/client.js';

function RiskPage() {
  const [activeTab, setActiveTab] = useState('records');
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [handleAction, setHandleAction] = useState('');
  const [handleReason, setHandleReason] = useState('');
  const [logs, setLogs] = useState({ list: [], total: 0 });
  const [showLogs, setShowLogs] = useState(false);
  const [logUserId, setLogUserId] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab, page, status]);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (activeTab === 'records') {
        endpoint = `/risk/records?status=${status}&page=${page}&pageSize=${pageSize}`;
      } else {
        endpoint = `/risk/stats/abnormal-growth?days=7`;
      }
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    setLoading(false);
  };

  const loadLogs = async (userId) => {
    try {
      const res = await api.get(`/risk/logs/${userId}?page=1&pageSize=50`);
      setLogs(res.data);
      setLogUserId(userId);
      setShowLogs(true);
    } catch (err) {
      console.error('加载日志失败:', err);
    }
  };

  const openHandleModal = (record) => {
    setSelectedRecord(record);
    setShowHandleModal(true);
  };

  const handleSubmit = async () => {
    if (!handleAction) {
      alert('请选择处理方式');
      return;
    }
    try {
      await api.post(`/risk/${selectedRecord.id}/handle`, {
        action: handleAction,
        reason: handleReason
      });
      alert('处理成功');
      setShowHandleModal(false);
      setHandleAction('');
      setHandleReason('');
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const getSeverityTag = (s) => {
    const map = {
      1: <span className="tag low">低</span>,
      2: <span className="tag medium">中</span>,
      3: <span className="tag high">高</span>
    };
    return map[s] || s;
  };

  const getStatusTag = (s) => {
    const map = {
      0: <span className="tag pending">待处理</span>,
      1: <span className="tag processing">已处理</span>,
      2: <span className="tag resolved">已忽略</span>
    };
    return map[s] || s;
  };

  const getTypeLabel = (type) => {
    const map = {
      batch_follow: '批量关注',
      multiple_reports: '多次被举报',
      admin_ban: '管理员封禁',
      admin_warn: '管理员警告',
      abnormal_growth: '异常增长'
    };
    return map[type] || type;
  };

  const getActionLabel = (action) => {
    const map = {
      follow: '关注',
      unfollow: '取关',
      friend_request: '发送好友申请',
      friend_accept: '接受好友申请',
      friend_reject: '拒绝好友申请',
      block: '拉黑',
      unblock: '解除拉黑',
      report: '举报'
    };
    return map[action] || action;
  };

  return (
    <div>
      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => { setActiveTab('records'); setPage(1); }}
          >
            风控记录
          </button>
          <button
            className={`tab ${activeTab === 'abnormal' ? 'active' : ''}`}
            onClick={() => { setActiveTab('abnormal'); setPage(1); }}
          >
            异常增长检测
          </button>
        </div>

        {activeTab === 'records' && (
          <div className="filter-bar">
            <span>状态：</span>
            <select value={status} onChange={(e) => setStatus(parseInt(e.target.value))}>
              <option value={0}>待处理</option>
              <option value={1}>已处理</option>
              <option value={2}>已忽略</option>
            </select>
          </div>
        )}

        {loading ? (
          <div className="empty">加载中...</div>
        ) : data.list?.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : activeTab === 'records' ? (
          <table className="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>类型</th>
                <th>描述</th>
                <th>严重程度</th>
                <th>状态</th>
                <th>时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.list?.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="user-info">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                        {item.nickname?.charAt(0)}
                      </div>
                      <div>
                        <div>{item.nickname}</div>
                        <small style={{ color: '#999' }}>@{item.username}</small>
                      </div>
                    </div>
                  </td>
                  <td>{getTypeLabel(item.type)}</td>
                  <td style={{ maxWidth: 250 }}>{item.description}</td>
                  <td>{getSeverityTag(item.severity)}</td>
                  <td>{getStatusTag(item.status)}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => loadLogs(item.user_id)}>
                        查看轨迹
                      </button>
                      {item.status === 0 && (
                        <button className="btn primary" onClick={() => openHandleModal(item)}>
                          处理
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>新增粉丝数（7天）</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.list?.map(item => (
                <tr key={item.user_id}>
                  <td>
                    <div className="user-info">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                        {item.nickname?.charAt(0)}
                      </div>
                      <div>
                        <div>{item.nickname}</div>
                        <small style={{ color: '#999' }}>@{item.username}</small>
                      </div>
                    </div>
                  </td>
                  <td><strong style={{ color: 'var(--error)' }}>{item.new_followers}</strong></td>
                  <td>
                    <button className="btn" onClick={() => loadLogs(item.user_id)}>
                      查看轨迹
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data.total > pageSize && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>上一页</button>
            <button className="active">{page}</button>
            <button disabled={page * pageSize >= data.total} onClick={() => setPage(p => p + 1)}>下一页</button>
          </div>
        )}
      </div>

      {showHandleModal && (
        <div className="modal-overlay" onClick={() => setShowHandleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>处理风控记录</h3>
            <p>用户：{selectedRecord?.nickname}</p>
            <p>类型：{getTypeLabel(selectedRecord?.type)}</p>
            <p style={{ margin: '12px 0' }}>
              <strong>处理方式：</strong>
            </p>
            <select value={handleAction} onChange={(e) => setHandleAction(e.target.value)}>
              <option value="">请选择</option>
              <option value="limit">限流</option>
              <option value="ban">封禁账号</option>
              <option value="restore">恢复账号</option>
              <option value="ignore">忽略</option>
            </select>
            <textarea
              placeholder="处理原因（选填）"
              value={handleReason}
              onChange={(e) => setHandleReason(e.target.value)}
              rows={3}
            />
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowHandleModal(false)}>取消</button>
              <button className="btn primary" onClick={handleSubmit}>确认处理</button>
            </div>
          </div>
        </div>
      )}

      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="modal" style={{ width: 700, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3>用户关系轨迹 - ID: {logUserId}</h3>
            {logs.list?.length === 0 ? (
              <div className="empty">暂无操作记录</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>操作</th>
                    <th>目标用户</th>
                    <th>详情</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.list?.map(log => (
                    <tr key={log.id}>
                      <td>{getActionLabel(log.action)}</td>
                      <td>{log.target_id || '-'}</td>
                      <td style={{ maxWidth: 200, fontSize: 12 }}>{log.details || '-'}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => setShowLogs(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RiskPage;
