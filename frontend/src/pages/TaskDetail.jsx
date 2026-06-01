import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI } from '../api.js';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [reviewResult, setReviewResult] = useState('approve');
  const [rejectReason, setRejectReason] = useState('');
  const [closeReason, setCloseReason] = useState('');

  useEffect(() => {
    loadTask();
    const interval = setInterval(loadTask, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const loadTask = async () => {
    try {
      const response = await taskAPI.get(id);
      setTask(response.data);
    } catch (error) {
      console.error('Failed to load task:', error);
    }
  };

  const handleExecute = async () => {
    try {
      await taskAPI.execute(id);
      loadTask();
    } catch (error) {
      alert(error.response?.data?.error || '执行失败');
    }
  };

  const handleSubmit = async () => {
    try {
      await taskAPI.submit(id);
      loadTask();
    } catch (error) {
      alert(error.response?.data?.error || '提交失败');
    }
  };

  const handleReview = async () => {
    try {
      await taskAPI.review(id, { result: reviewResult, reject_reason: rejectReason });
      setShowReviewModal(false);
      setRejectReason('');
      loadTask();
    } catch (error) {
      alert(error.response?.data?.error || '审核失败');
    }
  };

  const handleClose = async () => {
    try {
      await taskAPI.close(id, { close_reason: closeReason });
      setShowCloseModal(false);
      setCloseReason('');
      loadTask();
    } catch (error) {
      alert(error.response?.data?.error || '关闭失败');
    }
  };

  const handleRollback = async () => {
    const reason = prompt('请输入回滚原因：');
    if (!reason) return;
    try {
      await taskAPI.rollback(id, { rollback_reason: reason });
      loadTask();
    } catch (error) {
      alert(error.response?.data?.error || '回滚失败');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      created: '已创建',
      submitted: '已提交',
      executing: '执行中',
      success: '成功',
      failed: '失败',
      rollbacked: '已回滚',
      reviewing: '审核中',
      rejected: '已退回',
      closed: '已关闭'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status) => {
    const classes = {
      success: 'status-success',
      executing: 'status-running',
      failed: 'status-failed',
      submitted: 'status-pending',
      reviewing: 'status-reviewing',
      created: 'status-pending',
      rejected: 'status-rejected',
      closed: 'status-closed',
      rollbacked: 'status-warning'
    };
    return classes[status] || 'status-pending';
  };

  const getLogLevelClass = (level) => {
    const classes = { info: 'info', warn: 'warning', error: 'error', debug: 'info' };
    return classes[level] || 'info';
  };

  if (!task) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div className="card">
        <div className="flex flex-between items-center mb-lg">
          <div className="flex items-center gap-md">
            <button className="btn btn-default btn-sm" onClick={() => navigate('/tasks')}>← 返回列表</button>
            <h2 style={{ margin: 0 }}>{task.task_no}</h2>
            <span className={`status ${getStatusClass(task.status)}`}>{getStatusLabel(task.status)}</span>
          </div>
          <div className="flex gap-sm">
            {task.status === 'created' && (
              <button className="btn btn-primary" onClick={handleSubmit}>提交审核</button>
            )}
            {task.status === 'submitted' && (
              <button className="btn btn-warning" onClick={() => setShowReviewModal(true)}>审核</button>
            )}
            {['submitted', 'reviewing'].includes(task.status) && (
              <button className="btn btn-success" onClick={handleExecute}>执行</button>
            )}
            {task.status === 'success' && (
              <button className="btn btn-warning" onClick={handleRollback}>回滚</button>
            )}
            {!['closed', 'rollbacked'].includes(task.status) && (
              <button className="btn btn-danger" onClick={() => setShowCloseModal(true)}>关闭</button>
            )}
          </div>
        </div>

        <div className="tabs">
          <div className={`tab-item ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>基本信息</div>
          <div className={`tab-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>执行日志</div>
          <div className={`tab-item ${activeTab === 'script' ? 'active' : ''}`} onClick={() => setActiveTab('script')}>迁移脚本</div>
        </div>

        {activeTab === 'info' && (
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">任务编号:</span>
              <span className="detail-value">{task.task_no}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">任务类型:</span>
              <span className="detail-value"><span className="tag tag-blue">{task.task_type === 'migrate' ? '迁移' : task.task_type === 'rollback' ? '回滚' : '验证'}</span></span>
            </div>
            <div className="detail-item">
              <span className="detail-label">应用:</span>
              <span className="detail-value">{task.app_name} ({task.app_key})</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">环境:</span>
              <span className="detail-value">{task.env_name} ({task.env_type})</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">优先级:</span>
              <span className="detail-value"><span className={`tag ${task.priority === 'critical' ? 'tag-red' : task.priority === 'high' ? 'tag-orange' : 'tag-blue'}`}>{task.priority}</span></span>
            </div>
            <div className="detail-item">
              <span className="detail-label">迁移版本:</span>
              <span className="detail-value">{task.version || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">创建人:</span>
              <span className="detail-value">{task.creator_name}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">执行人:</span>
              <span className="detail-value">{task.executor_name || '-'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">创建时间:</span>
              <span className="detail-value">{task.created_at}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">执行时间:</span>
              <span className="detail-value">{task.executed_at || '-'}</span>
            </div>
            {task.reject_reason && (
              <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                <span className="detail-label">退回原因:</span>
                <span className="detail-value" style={{ color: '#f5222d' }}>{task.reject_reason}</span>
              </div>
            )}
            {task.close_reason && (
              <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                <span className="detail-label">关闭原因:</span>
                <span className="detail-value">{task.close_reason}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="timeline">
            {task.logs?.map((log, index) => (
              <div key={log.id} className={`timeline-item ${getLogLevelClass(log.log_level)}`}>
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div style={{ fontWeight: 500 }}>{log.message}</div>
                  {log.details && <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{log.details}</div>}
                  <div className="timeline-time">
                    {log.created_at} - {log.operator_name || '系统'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'script' && (
          <div>
            {task.script_content ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <strong>版本：</strong>{task.version} - {task.version_desc}
                </div>
                <pre className="code-block">{task.script_content}</pre>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📄</div>
                <div>暂无迁移脚本</div>
              </div>
            )}
          </div>
        )}
      </div>

      {showReviewModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">任务审核</h3>
              <button className="modal-close" onClick={() => setShowReviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">审核结果</label>
                <select
                  className="form-select"
                  value={reviewResult}
                  onChange={(e) => setReviewResult(e.target.value)}
                >
                  <option value="approve">通过</option>
                  <option value="reject">退回</option>
                </select>
              </div>
              {reviewResult === 'reject' && (
                <div className="form-group">
                  <label className="form-label">退回原因 *</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请输入退回原因"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowReviewModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReview}>确认</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">关闭任务</h3>
              <button className="modal-close" onClick={() => setShowCloseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">关闭原因 *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="请输入关闭原因"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowCloseModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={handleClose}>确认关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskDetail;
