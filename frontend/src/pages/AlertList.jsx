import React, { useState, useEffect } from 'react';
import { alertAPI } from '../api.js';

function AlertList() {
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({ status: '', alert_type: '', severity: '' });
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [handleForm, setHandleForm] = useState({ status: 'manual_review', handle_result: '' });

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const loadAlerts = async () => {
    try {
      const response = await alertAPI.list(filters);
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const handleAlert = (alert) => {
    setSelectedAlert(alert);
    setHandleForm({ status: 'manual_review', handle_result: '' });
    setShowHandleModal(true);
  };

  const submitHandle = async () => {
    if (!selectedAlert) return;
    try {
      await alertAPI.handle(selectedAlert.id, handleForm);
      setShowHandleModal(false);
      setSelectedAlert(null);
      loadAlerts();
    } catch (error) {
      alert(error.response?.data?.error || '处理失败');
    }
  };

  const alertTypeLabels = {
    duplicate_execution: '重复执行',
    permission_violation: '权限越权',
    config_misdispatch: '配置误发',
    task_failure: '任务失败',
    sensitive_leak: '敏感信息泄露'
  };

  const severityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急'
  };

  const statusLabels = {
    pending: '待处理',
    auto_blocked: '自动拦截',
    manual_review: '人工复核',
    observing: '继续观察',
    closed: '已关闭'
  };

  const getSeverityClass = (severity) => {
    const classes = {
      low: 'tag-blue',
      medium: 'tag-orange',
      high: 'tag-red',
      critical: 'tag-red'
    };
    return classes[severity] || 'tag-blue';
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'status-pending',
      auto_blocked: 'status-success',
      manual_review: 'status-reviewing',
      observing: 'status-running',
      closed: 'status-closed'
    };
    return classes[status] || 'status-pending';
  };

  return (
    <div>
      <div className="card">
        <div className="flex flex-between items-center mb-md">
          <h3 className="card-title" style={{ margin: 0 }}>告警中心</h3>
        </div>

        <div className="filter-bar">
          <div className="filter-item">
            <span className="filter-label">状态:</span>
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="pending">待处理</option>
              <option value="auto_blocked">自动拦截</option>
              <option value="manual_review">人工复核</option>
              <option value="observing">继续观察</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">类型:</span>
            <select
              className="filter-select"
              value={filters.alert_type}
              onChange={(e) => setFilters(prev => ({ ...prev, alert_type: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="duplicate_execution">重复执行</option>
              <option value="permission_violation">权限越权</option>
              <option value="config_misdispatch">配置误发</option>
              <option value="task_failure">任务失败</option>
              <option value="sensitive_leak">敏感信息泄露</option>
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">级别:</span>
            <select
              className="filter-select"
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
              <option value="critical">紧急</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>告警类型</th>
              <th>级别</th>
              <th>标题</th>
              <th>关联任务</th>
              <th>关联应用</th>
              <th>状态</th>
              <th>处理人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert) => (
              <tr key={alert.id}>
                <td><span className={`tag ${alert.alert_type === 'task_failure' ? 'tag-red' : 'tag-orange'}`}>{alertTypeLabels[alert.alert_type]}</span></td>
                <td><span className={`tag ${getSeverityClass(alert.severity)}`}>{severityLabels[alert.severity]}</span></td>
                <td>{alert.title}</td>
                <td>{alert.task_no || '-'}</td>
                <td>{alert.app_name || '-'}</td>
                <td><span className={`status ${getStatusClass(alert.status)}`}>{statusLabels[alert.status]}</span></td>
                <td>{alert.handler_name || '-'}</td>
                <td>{alert.created_at}</td>
                <td>
                  {alert.status === 'pending' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleAlert(alert)}>处理</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {alerts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div>暂无告警</div>
          </div>
        )}
      </div>

      {showHandleModal && selectedAlert && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">处理告警</h3>
              <button className="modal-close" onClick={() => setShowHandleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <strong>告警：</strong>{selectedAlert.title}
              </div>
              <div style={{ marginBottom: 16 }}>
                <strong>描述：</strong>{selectedAlert.description}
              </div>
              <div className="form-group">
                <label className="form-label">处理结果</label>
                <select
                  className="form-select"
                  value={handleForm.status}
                  onChange={(e) => setHandleForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="manual_review">人工复核</option>
                  <option value="observing">继续观察</option>
                  <option value="closed">已关闭</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">处理说明</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={handleForm.handle_result}
                  onChange={(e) => setHandleForm(p => ({ ...p, handle_result: e.target.value }))}
                  placeholder="请输入处理说明"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowHandleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitHandle}>确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertList;
