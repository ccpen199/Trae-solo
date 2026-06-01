import React, { useState, useEffect } from 'react';
import { apiService } from '../api.js';
import { Plus, Download, Play, X, CheckCircle, XCircle, Loader } from 'lucide-react';

function ExecutionTasks() {
  const [tasks, setTasks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formData, setFormData] = useState({
    change_order_id: '',
    task_type: 'deploy',
    target: '',
    parameters: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const runningTasks = tasks.filter(t => t.status === 'running');
    if (runningTasks.length > 0) {
      const interval = setInterval(() => {
        runningTasks.forEach(task => {
          updateTaskStatus(task.id);
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [tasks]);

  const updateTaskStatus = async (taskId) => {
    try {
      const res = await apiService.getTaskStatus(taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...res.data } : t));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const loadData = async () => {
    try {
      const [tasksRes, ordersRes] = await Promise.all([
        apiService.getExecutionTasks(),
        apiService.getChangeOrders()
      ]);
      setTasks(tasksRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const params = formData.parameters ? JSON.parse(formData.parameters) : null;
      await apiService.createExecutionTask({ ...formData, parameters: params });
      setShowModal(false);
      setFormData({ change_order_id: '', task_type: 'deploy', target: '', parameters: '' });
      loadData();
    } catch (err) {
      alert('创建失败');
    }
  };

  const handleStart = async (id) => {
    try {
      await apiService.startTask(id);
      loadData();
    } catch (err) {
      alert('启动失败: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleCancel = async (id) => {
    try {
      await apiService.cancelTask(id);
      loadData();
    } catch (err) {
      alert('取消失败');
    }
  };

  const getTaskResult = (task) => {
    if (!task.result) return {};
    try {
      return typeof task.result === 'string' ? JSON.parse(task.result) : task.result;
    } catch (e) {
      return { raw: task.result };
    }
  };

  const getStatusLabel = (status) => {
    const labels = { pending: '待执行', running: '执行中', completed: '已完成', failed: '失败', cancelled: '已取消' };
    return labels[status] || status;
  };

  const getStepStatusIcon = (stepStatus) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'running':
        return <Loader size={16} className="text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getProgress = (task) => {
    const result = getTaskResult(task);
    if (result.currentStep && result.totalSteps) {
      return Math.round((result.currentStep / result.totalSteps) * 100);
    }
    return task.status === 'completed' ? 100 : 0;
  };

  if (loading) return <div className="loading">加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">执行任务</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => apiService.exportData('execution-tasks')}>
            <Download size={16} /> 导出
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> 新建任务
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>任务编号</th>
                <th>关联变更单</th>
                <th>任务类型</th>
                <th>目标</th>
                <th>状态</th>
                <th>执行进度</th>
                <th>执行人</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <code className="cursor-pointer hover:text-blue-600" onClick={() => setSelectedTask(task)}>
                      {task.task_no}
                    </code>
                  </td>
                  <td>{task.order_no || '-'}</td>
                  <td>{task.task_type}</td>
                  <td>{task.target}</td>
                  <td><span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span></td>
                  <td style={{ minWidth: '150px' }}>
                    {task.status === 'running' && (
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${getProgress(task)}%` }}></div>
                        <span className="progress-text">{getProgress(task)}%</span>
                      </div>
                    )}
                    {task.status === 'completed' && (
                      <span className="text-green-600 text-sm">100% 完成</span>
                    )}
                    {task.status === 'pending' && (
                      <span className="text-gray-500 text-sm">等待中</span>
                    )}
                    {task.status === 'failed' && (
                      <span className="text-red-600 text-sm">执行失败</span>
                    )}
                  </td>
                  <td>{task.executor_name || '-'}</td>
                  <td>{new Date(task.created_at).toLocaleString()}</td>
                  <td>
                    <div className="action-buttons">
                      {task.status === 'pending' && (
                        <button className="btn btn-success btn-sm" onClick={() => handleStart(task.id)}>
                          <Play size={14} /> 启动
                        </button>
                      )}
                      {task.status === 'running' && (
                        <>
                          <button className="btn btn-warning btn-sm" onClick={() => updateTaskStatus(task.id)}>
                            <Loader size={14} className="animate-spin" /> 刷新
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(task.id)}>
                            <X size={14} /> 取消
                          </button>
                        </>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTask(task)}>
                        详情
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length === 0 && (
                <tr><td colSpan="9" className="empty-state">暂无任务数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>任务详情 - {selectedTask.task_no}</h2>
              <button className="modal-close" onClick={() => setSelectedTask(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>任务类型</label>
                  <div className="form-value">{selectedTask.task_type}</div>
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <div className="form-value"><span className={`badge badge-${selectedTask.status}`}>{getStatusLabel(selectedTask.status)}</span></div>
                </div>
              </div>

              {selectedTask.sourceCode && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-3">📦 源代码</h4>
                  <div className="info-card info-card-blue">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">代码仓库</span>
                        <span className="info-value code">{selectedTask.sourceCode.repository || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">分支</span>
                        <span className="info-value">{selectedTask.sourceCode.branch || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">版本号</span>
                        <span className="info-value">{selectedTask.sourceCode.version || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">关联变更单</span>
                        <span className="info-value code">{selectedTask.sourceCode.change_order || '-'}</span>
                      </div>
                    </div>
                    {selectedTask.sourceCode.change_order_title && (
                      <div className="info-desc">{selectedTask.sourceCode.change_order_title}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedTask.targetEnvironment && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-3">🎯 目标环境</h4>
                  <div className="info-card info-card-green">
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">应用名称</span>
                        <span className="info-value">{selectedTask.targetEnvironment.app_name || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">应用标识</span>
                        <span className="info-value code">{selectedTask.targetEnvironment.app_code || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">环境名称</span>
                        <span className="info-value">{selectedTask.targetEnvironment.env_name || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">环境类型</span>
                        <span className="info-value">{selectedTask.targetEnvironment.env_type || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">服务器地址</span>
                        <span className="info-value code">{selectedTask.targetEnvironment.server_address || '-'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">技术栈</span>
                        <span className="info-value">{selectedTask.targetEnvironment.tech_stack || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {getTaskResult(selectedTask).steps && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-3">执行步骤</h4>
                  <div className="steps-container">
                    {getTaskResult(selectedTask).steps.map((step, idx) => (
                      <div key={idx} className={`step-item step-${step.status}`}>
                        <div className="step-icon">
                          {getStepStatusIcon(step.status)}
                        </div>
                        <div className="step-content">
                          <div className="step-name">{step.name}</div>
                          <div className="step-desc">{step.description}</div>
                          {step.status === 'running' && (
                            <div className="step-progress">执行中...</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getTaskResult(selectedTask).stepResults && (
                <div className="mt-4">
                  <h4 className="text-lg font-medium mb-3">执行结果</h4>
                  <div className="result-container">
                    {getTaskResult(selectedTask).stepResults.map((res, idx) => (
                      <div key={idx} className={`result-item result-${res.status}`}>
                        <div className="result-step">{res.step}</div>
                        <div className="result-status">
                          {res.status === 'success' ? '成功' : '失败'}
                        </div>
                        {res.error && <div className="result-error">{res.error}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getTaskResult(selectedTask).summary && (
                <div className="mt-4">
                  <div className="alert alert-info">
                    {getTaskResult(selectedTask).summary}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedTask(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新建执行任务</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>关联变更单</label>
                    <select value={formData.change_order_id} onChange={e => setFormData({...formData, change_order_id: e.target.value})}>
                      <option value="">无</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>{o.order_no} - {o.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>任务类型</label>
                    <select value={formData.task_type} onChange={e => setFormData({...formData, task_type: e.target.value})}>
                      <option value="deploy">发布部署</option>
                      <option value="rollback">回滚</option>
                      <option value="config">配置更新</option>
                      <option value="restart">重启服务</option>
                      <option value="hotfix">紧急修复</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>目标 *</label>
                  <input required value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} placeholder="如：服务器IP或服务名" />
                </div>
                <div className="form-group">
                  <label>参数 (JSON)</label>
                  <textarea rows="3" value={formData.parameters} onChange={e => setFormData({...formData, parameters: e.target.value})} placeholder='{"key": "value"}' />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutionTasks;
