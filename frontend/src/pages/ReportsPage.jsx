import React, { useState, useEffect } from 'react';
import api from '../api/client.js';

function ReportsPage() {
  const [activeTab, setActiveTab] = useState('my');
  const [data, setData] = useState({ list: [], total: 0 });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [status, setStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [handleAction, setHandleAction] = useState('');
  const [handleReason, setHandleReason] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab, page, status]);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint;
      if (activeTab === 'my') {
        endpoint = `/reports/history?page=${page}&pageSize=${pageSize}`;
      } else {
        endpoint = `/reports/queue?status=${status}&page=${page}&pageSize=${pageSize}`;
      }
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err) {
      console.error('加载数据失败:', err);
    }
    setLoading(false);
  };

  const openHandleModal = (report) => {
    setSelectedReport(report);
    setShowHandleModal(true);
  };

  const handleSubmit = async () => {
    if (!handleAction) {
      alert('请选择处理方式');
      return;
    }
    try {
      await api.post(`/reports/${selectedReport.id}/handle`, {
        action: handleAction,
        reason: handleReason
      });
      alert('处理成功');
      setShowHandleModal(false);
      setHandleAction('');
      setHandleReason('');
      setSelectedReport(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
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
      spam: '垃圾广告',
      harassment: '骚扰',
      fake: '虚假账号',
      inappropriate: '不当内容',
      other: '其他'
    };
    return map[type] || type;
  };

  return (
    <div>
      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => { setActiveTab('my'); setPage(1); }}
          >
            我的举报
          </button>
          <button
            className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => { setActiveTab('queue'); setPage(1); }}
          >
            举报队列
          </button>
        </div>

        {activeTab === 'queue' && (
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
        ) : data.list.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>被举报用户</th>
                <th>举报类型</th>
                <th>描述</th>
                <th>状态</th>
                <th>时间</th>
                {activeTab === 'queue' && <th>操作</th>}
              </tr>
            </thead>
            <tbody>
              {data.list.map(item => (
                <tr key={item.id}>
                  <td>
                    <div className="user-info">
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
                        {(item.reported_nickname || item.nickname)?.charAt(0)}
                      </div>
                      <div>
                        <div>{item.reported_nickname || item.nickname}</div>
                        <small style={{ color: '#999' }}>@{item.reported_username || ''}</small>
                      </div>
                    </div>
                  </td>
                  <td>{getTypeLabel(item.type)}</td>
                  <td style={{ maxWidth: 200 }}>{item.description || '-'}</td>
                  <td>{getStatusTag(item.status)}</td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                  {activeTab === 'queue' && (
                    <td>
                      {item.status === 0 && (
                        <button className="btn primary" onClick={() => openHandleModal(item)}>
                          处理
                        </button>
                      )}
                    </td>
                  )}
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
            <h3>处理举报</h3>
            <p>被举报用户：{selectedReport?.reported_nickname}</p>
            <p>举报类型：{getTypeLabel(selectedReport?.type)}</p>
            <p style={{ margin: '12px 0' }}>
              <strong>处理方式：</strong>
            </p>
            <select value={handleAction} onChange={(e) => setHandleAction(e.target.value)}>
              <option value="">请选择</option>
              <option value="warn">警告</option>
              <option value="ban">封禁账号</option>
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
    </div>
  );
}

export default ReportsPage;
