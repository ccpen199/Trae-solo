import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';

function ChangeOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [reasonModal, setReasonModal] = useState(null);
  const [reason, setReason] = useState('');

  const processSteps = [
    { key: 'created', label: '创建' },
    { key: 'submitted', label: '提交' },
    { key: 'executing', label: '执行' },
    { key: 'reviewed', label: '复核' },
    { key: 'closed', label: '关闭' }
  ];

  const getStepStatus = (step) => {
    const statusOrder = ['created', 'submitted', 'executing', 'reviewed', 'rejected', 'closed'];
    const currentIdx = statusOrder.indexOf(order?.status);
    const stepIdx = statusOrder.indexOf(step);
    
    if (order?.status === 'rejected' && stepIdx <= currentIdx) return 'completed';
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return '';
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await apiService.getChangeOrder(id);
      setOrder(res.data);
    } catch (err) {
      console.error('Failed to load:', err);
    }
  };

  const handleAction = async (action) => {
    try {
      const actions = {
        submit: apiService.submitChangeOrder,
        execute: apiService.executeChangeOrder,
        review: apiService.reviewChangeOrder,
        reject: apiService.rejectChangeOrder,
        close: apiService.closeChangeOrder
      };
      await actions[action](id, { [`${action}_reason`]: reason });
      setReasonModal(null);
      setReason('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const getAvailableActions = () => {
    const actions = [];
    switch (order?.status) {
      case 'created':
        actions.push({ key: 'submit', label: '提交', type: 'primary' });
        break;
      case 'submitted':
        actions.push({ key: 'execute', label: '执行', type: 'success' });
        actions.push({ key: 'reject', label: '退回', type: 'danger' });
        break;
      case 'executing':
        actions.push({ key: 'review', label: '复核', type: 'success' });
        actions.push({ key: 'reject', label: '退回', type: 'danger' });
        break;
      case 'reviewed':
      case 'rejected':
        actions.push({ key: 'close', label: '关闭', type: 'secondary' });
        break;
    }
    return actions;
  };

  const getStatusLabel = (status) => {
    const labels = {
      created: '已创建',
      submitted: '已提交',
      executing: '执行中',
      reviewed: '已复核',
      rejected: '已退回',
      closed: '已关闭'
    };
    return labels[status] || status;
  };

  if (!order) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/change-orders" className="link-text">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">{order.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <code>{order.order_no}</code>
              <span className={`badge badge-${order.status}`}>{getStatusLabel(order.status)}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {getAvailableActions().map(action => (
            <button 
              key={action.key}
              className={`btn btn-${action.type}`}
              onClick={() => setReasonModal(action.key)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="process-timeline">
          {processSteps.map((step, idx) => (
            <div key={step.key} className={`process-step ${getStepStatus(step.key)}`}>
              <div className="step-icon">
                {getStepStatus(step.key) === 'completed' ? <Check size={16} /> : idx + 1}
              </div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
          {order.status === 'rejected' && (
            <div className="process-step completed">
              <div className="step-icon" style={{ background: '#ef4444' }}><X size={16} /></div>
              <div className="step-label">已退回</div>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</button>
        <button className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>关联任务</button>
        <button className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>操作日志</button>
      </div>

      {activeTab === 'basic' && (
        <div className="card">
          <div className="detail-section">
            <h3>基本信息</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">变更单号</span>
                <span className="value">{order.order_no}</span>
              </div>
              <div className="detail-item">
                <span className="label">标题</span>
                <span className="value">{order.title}</span>
              </div>
              <div className="detail-item">
                <span className="label">类型</span>
                <span className="value">{order.type}</span>
              </div>
              <div className="detail-item">
                <span className="label">优先级</span>
                <span className="value">
                  <span className={`badge badge-${order.priority}`}>
                    {order.priority === 'high' ? '高' : order.priority === 'medium' ? '中' : '低'}
                  </span>
                </span>
              </div>
              <div className="detail-item">
                <span className="label">关联应用</span>
                <span className="value">{order.app_name || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">关联环境</span>
                <span className="value">{order.env_name || '-'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>变更内容</h3>
            <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px' }}>
              {order.content || '-'}
            </div>
          </div>

          <div className="detail-section">
            <h3>流程记录</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">创建人 / 时间</span>
                <span className="value">{order.creator_name || '-'} / {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">创建原因</span>
                <span className="value">{order.create_reason || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">提交人 / 时间</span>
                <span className="value">{order.submitter_name || '-'} / {order.submitted_at ? new Date(order.submitted_at).toLocaleString() : '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">提交说明</span>
                <span className="value">{order.submit_reason || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">执行人 / 时间</span>
                <span className="value">{order.executor_name || '-'} / {order.executed_at ? new Date(order.executed_at).toLocaleString() : '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">执行说明</span>
                <span className="value">{order.execute_reason || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">复核人 / 时间</span>
                <span className="value">{order.reviewer_name || '-'} / {order.reviewed_at ? new Date(order.reviewed_at).toLocaleString() : '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">复核说明</span>
                <span className="value">{order.review_reason || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">退回原因</span>
                <span className="value">{order.reject_reason || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">关闭原因</span>
                <span className="value">{order.close_reason || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>任务编号</th>
                  <th>任务类型</th>
                  <th>目标</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {order.tasks?.map(task => (
                  <tr key={task.id}>
                    <td><code>{task.task_no}</code></td>
                    <td>{task.task_type}</td>
                    <td>{task.target}</td>
                    <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                    <td>{new Date(task.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(!order.tasks || order.tasks.length === 0) && (
                  <tr><td colSpan="5" className="empty-state">暂无关联任务</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>操作</th>
                  <th>旧值</th>
                  <th>新值</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {order.operationLogs?.map(log => (
                  <tr key={log.id}>
                    <td>{log.operation}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.old_value || '-'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.new_value || '-'}</td>
                    <td>{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {(!order.operationLogs || order.operationLogs.length === 0) && (
                  <tr><td colSpan="4" className="empty-state">暂无操作日志</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reasonModal && (
        <div className="modal-overlay" onClick={() => setReasonModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {reasonModal === 'submit' && '提交变更单'}
                {reasonModal === 'execute' && '执行变更单'}
                {reasonModal === 'review' && '复核变更单'}
                {reasonModal === 'reject' && '退回变更单'}
                {reasonModal === 'close' && '关闭变更单'}
              </h2>
              <button className="modal-close" onClick={() => setReasonModal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>
                  {reasonModal === 'submit' && '提交说明'}
                  {reasonModal === 'execute' && '执行说明'}
                  {reasonModal === 'review' && '复核说明'}
                  {reasonModal === 'reject' && '退回原因'}
                  {reasonModal === 'close' && '关闭原因'}
                </label>
                <textarea 
                  rows="3"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="请输入说明..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReasonModal(null)}>取消</button>
              <button className="btn btn-primary" onClick={() => handleAction(reasonModal)}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChangeOrderDetail;
