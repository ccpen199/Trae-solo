import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

function AdminTaskReview({ showToast }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tasks/review');
      setTasks(response.data.data || []);
    } catch (error) {
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (taskId) => {
    try {
      setProcessing(true);
      await api.post(`/admin/tasks/${taskId}/review`, {
        action: 'approve'
      });
      showToast('任务审核通过', 'success');
      loadTasks();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      showToast('请填写驳回理由', 'error');
      return;
    }
    
    try {
      setProcessing(true);
      await api.post(`/admin/tasks/${selectedTask.id}/review`, {
        action: 'reject',
        reason: rejectReason
      });
      showToast('任务已驳回', 'success');
      setShowDetail(false);
      loadTasks();
    } catch (error) {
      showToast(error.response?.data?.error || '操作失败', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openDetail = (task) => {
    setSelectedTask(task);
    setRejectReason('');
    setShowDetail(true);
  };

  const getTypeLabel = (type) => {
    const labels = { online: '线上任务', offline: '线下任务', hybrid: '混合任务' };
    return labels[type] || type;
  };

  const getRiskColor = (risk) => {
    return risk === 'high' ? '#dc2626' : risk === 'medium' ? '#f59e0b' : '#10b981';
  };

  if (loading) {
    return <div className="empty-state">加载中...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '28px' }}>任务审核</h1>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {tasks.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>任务名称</th>
                <th>类型</th>
                <th>分类</th>
                <th>预算</th>
                <th>雇主</th>
                <th>风险等级</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 500, cursor: 'pointer', color: '#667eea' }}
                      onClick={() => openDetail(task)}>
                    {task.title}
                  </td>
                  <td>
                    <span className={`task-type task-type-${task.task_type}`}>
                      {getTypeLabel(task.task_type)}
                    </span>
                  </td>
                  <td>{task.category}</td>
                  <td style={{ fontWeight: 600, color: '#667eea' }}>¥{task.budget}</td>
                  <td>{task.company_name || '-'}</td>
                  <td>
                    <span style={{ color: getRiskColor(task.risk_level), fontWeight: 500 }}>
                      {task.risk_level === 'high' ? '🔴 高' : task.risk_level === 'medium' ? '🟡 中' : '🟢 低'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {task.created_at?.substring(0, 16)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-success" 
                        style={{ padding: '6px 16px', fontSize: '13px' }}
                        onClick={() => handleApprove(task.id)}
                        disabled={processing}
                      >
                        通过
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 16px', fontSize: '13px' }}
                        onClick={() => openDetail(task)}
                      >
                        驳回
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <p>暂无待审核任务</p>
          </div>
        )}
      </div>
      
      {showDetail && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">任务详情</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                {selectedTask.title}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <span className={`task-type task-type-${selectedTask.task_type}`}>
                  {getTypeLabel(selectedTask.task_type)}
                </span>
                <span className="badge badge-info">{selectedTask.category}</span>
                <span style={{ color: getRiskColor(selectedTask.risk_level) }}>
                  风险等级：{selectedTask.risk_level === 'high' ? '高' : selectedTask.risk_level === 'medium' ? '中' : '低'}
                </span>
              </div>
              
              <div style={{ 
                padding: '16px', 
                background: '#f8fafc', 
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>任务描述</div>
                <div style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {selectedTask.description}
                </div>
              </div>
              
              <div className="grid-2" style={{ fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#64748b' }}>雇主：</span>
                  {selectedTask.company_name}
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>预算：</span>
                  <span style={{ fontWeight: 600, color: '#667eea' }}>¥{selectedTask.budget}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>招募人数：</span>
                  {selectedTask.total_count}人
                </div>
                {selectedTask.location && (
                  <div>
                    <span style={{ color: '#64748b' }}>地点：</span>
                    {selectedTask.location}
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">驳回理由</label>
              <textarea
                className="form-textarea"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="请填写驳回理由..."
              />
            </div>
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>
                取消
              </button>
              <button className="btn btn-success" onClick={() => handleApprove(selectedTask.id)} disabled={processing}>
                {processing ? '处理中...' : '审核通过'}
              </button>
              <button className="btn btn-danger" onClick={handleReject} disabled={processing}>
                {processing ? '处理中...' : '驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTaskReview;
