import React, { useState, useEffect } from 'react';
import { traceApi } from '../api';
import { usePlayer } from '../App';

function Trace() {
  const { currentPlayer } = usePlayer();
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (currentPlayer) {
      loadRequests();
    }
  }, [currentPlayer?.id]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await traceApi.getPlayerRequests(currentPlayer.id);
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (err) {
      console.error('加载请求列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetails = async (requestId) => {
    try {
      setLoadingLogs(true);
      const response = await traceApi.getRequest(requestId);
      if (response.data.success) {
        setSelectedRequest(response.data.data);
        setLogs(response.data.data.logs || []);
      }
    } catch (err) {
      console.error('加载请求详情失败:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'join_queue': return '加入匹配队列';
      case 'leave_queue': return '离开匹配队列';
      default: return action;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'success': return 'status-success';
      case 'failed': return 'status-failed';
      case 'pending': return 'status-pending';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'pending': return '处理中';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-2">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="card-title" style={{ marginBottom: 0 }}>单据列表</h2>
            <button className="btn btn-secondary" onClick={loadRequests}>
              刷新
            </button>
          </div>

          {requests.length === 0 ? (
            <div className="text-center text-muted p-4">
              <p>暂无单据记录</p>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                进行匹配操作后会生成单据记录
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: '500px', overflowY: 'auto' }}>
              {requests.map((request) => (
                <div 
                  key={request.id} 
                  className={`player-card ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    border: selectedRequest?.id === request.id ? '2px solid #3b82f6' : undefined
                  }}
                  onClick={() => loadRequestDetails(request.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`status-badge ${getStatusClass(request.status)}`} style={{ marginRight: '0.5rem' }}>
                        {getStatusText(request.status)}
                      </span>
                      <span className="stat-value">{getActionText(request.action)}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {request.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    {new Date(request.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="card-title">单据详情</h2>

          {!selectedRequest ? (
            <div className="text-center text-muted p-4">
              <p>请点击左侧单据查看详情</p>
            </div>
          ) : (
            <div>
              {loadingLogs && (
                <div className="flex justify-center mb-4">
                  <div className="loading-spinner" style={{ width: '24px', height: '24px' }}></div>
                </div>
              )}

              <div className="player-card mb-4">
                <div className="stats-grid">
                  <div>
                    <div className="stat-label">请求ID</div>
                    <div className="stat-value" style={{ fontSize: '0.875rem' }}>{selectedRequest.id}</div>
                  </div>
                  <div>
                    <div className="stat-label">操作类型</div>
                    <div className="stat-value">{getActionText(selectedRequest.action)}</div>
                  </div>
                  <div>
                    <div className="stat-label">状态</div>
                    <div>
                      <span className={`status-badge ${getStatusClass(selectedRequest.status)}`}>
                        {getStatusText(selectedRequest.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="stat-label">创建时间</div>
                    <div className="stat-value" style={{ fontSize: '0.875rem' }}>
                      {new Date(selectedRequest.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedRequest.battle_id && (
                <div className="alert alert-info mb-4">
                  <div className="stat-label">关联对战ID</div>
                  <div className="stat-value">{selectedRequest.battle_id}</div>
                </div>
              )}

              {selectedRequest.error_message && (
                <div className="alert alert-error mb-4">
                  <div className="stat-label">错误信息</div>
                  <div className="stat-value">{selectedRequest.error_message}</div>
                </div>
              )}

              {selectedRequest.request_data && Object.keys(selectedRequest.request_data).length > 0 && (
                <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <div className="stat-label" style={{ marginBottom: '0.5rem' }}>请求数据</div>
                  <pre style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: '0.75rem', 
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(selectedRequest.request_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedRequest.response_data && Object.keys(selectedRequest.response_data).length > 0 && (
                <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                  <div className="stat-label" style={{ marginBottom: '0.5rem' }}>响应数据</div>
                  <pre style={{ 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: '0.75rem', 
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(selectedRequest.response_data, null, 2)}
                  </pre>
                </div>
              )}

              {logs.length > 0 && (
                <div>
                  <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: '1rem' }}>处理日志</h3>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {logs.map((log, index) => (
                      <div 
                        key={log.id || index}
                        className={`log-entry log-${log.status}`}
                      >
                        <div className="flex justify-between items-center">
                          <span style={{ fontWeight: 600 }}>
                            [{log.step_order}] {log.step}
                          </span>
                          <span className={`status-badge status-${log.status}`}>
                            {log.status}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <pre style={{ 
                            background: 'rgba(0,0,0,0.1)', 
                            padding: '0.5rem', 
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            marginTop: '0.5rem'
                          }}>
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">单据系统说明</h2>
        <div className="grid grid-2">
          <div className="player-card">
            <div className="stat-label" style={{ marginBottom: '0.5rem' }}>单据追踪</div>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              每次匹配操作（加入/离开队列）都会生成唯一的单据记录，包含：
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <li>请求ID（全局唯一）</li>
                <li>操作类型</li>
                <li>玩家信息快照</li>
                <li>请求/响应数据</li>
              </ul>
            </div>
          </div>
          <div className="player-card">
            <div className="stat-label" style={{ marginBottom: '0.5rem' }}>处理日志</div>
            <div className="text-muted" style={{ fontSize: '0.875rem' }}>
              每个单据都包含详细的处理步骤日志：
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                <li>步骤编号和名称</li>
                <li>执行状态（start/running/success/error）</li>
                <li>详细数据记录</li>
                <li>时间戳</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trace;