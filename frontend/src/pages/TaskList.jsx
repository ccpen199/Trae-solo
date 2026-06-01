import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, appAPI, envAPI, versionAPI } from '../api.js';

function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [apps, setApps] = useState([]);
  const [envs, setEnvs] = useState([]);
  const [versions, setVersions] = useState([]);
  const [filters, setFilters] = useState({ status: '', app_id: '', task_type: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({ app_id: '', env_id: '', version_id: '', task_type: 'migrate', priority: 'normal' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTasks();
    loadApps();
  }, [filters, pagination.page]);

  const loadTasks = async () => {
    try {
      const response = await taskAPI.list({ ...filters, page: pagination.page, pageSize: pagination.pageSize });
      setTasks(response.data.list);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const loadApps = async () => {
    try {
      const response = await appAPI.list({ pageSize: 100 });
      setApps(response.data.list);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  const loadEnvs = async (appId) => {
    if (!appId) {
      setEnvs([]);
      return;
    }
    try {
      const response = await envAPI.list({ app_id: appId });
      setEnvs(response.data);
    } catch (error) {
      console.error('Failed to load envs:', error);
    }
  };

  const loadVersions = async (appId) => {
    if (!appId) {
      setVersions([]);
      return;
    }
    try {
      const response = await versionAPI.list({ app_id: appId });
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to load versions:', error);
    }
  };

  const handleAppChange = (appId) => {
    setNewTask(prev => ({ ...prev, app_id: appId, env_id: '', version_id: '' }));
    loadEnvs(appId);
    loadVersions(appId);
  };

  useEffect(() => {
    if (showCreateModal) {
      setNewTask({ app_id: '', env_id: '', version_id: '', task_type: 'migrate', priority: 'normal' });
      setEnvs([]);
      setVersions([]);
    }
  }, [showCreateModal]);

  const handleCreateTask = async () => {
    if (!newTask.app_id || !newTask.env_id || !newTask.task_type) {
      alert('请填写必填字段');
      return;
    }
    setLoading(true);
    try {
      await taskAPI.create(newTask);
      setShowCreateModal(false);
      setNewTask({ app_id: '', env_id: '', version_id: '', task_type: 'migrate', priority: 'normal' });
      loadTasks();
    } catch (error) {
      alert(error.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (taskId) => {
    try {
      await taskAPI.submit(taskId);
      loadTasks();
    } catch (error) {
      alert(error.response?.data?.error || '提交失败');
    }
  };

  const handleExecute = async (taskId) => {
    try {
      await taskAPI.execute(taskId);
      loadTasks();
      setTimeout(loadTasks, 3000);
    } catch (error) {
      alert(error.response?.data?.error || '执行失败');
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

  const totalPages = Math.ceil(pagination.total / pagination.pageSize);

  return (
    <div>
      <div className="card">
        <div className="flex flex-between items-center mb-md">
          <h3 className="card-title" style={{ margin: 0 }}>执行任务列表</h3>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>+ 新建任务</button>
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
              <option value="created">已创建</option>
              <option value="submitted">已提交</option>
              <option value="reviewing">审核中</option>
              <option value="executing">执行中</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
              <option value="rejected">已退回</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">应用:</span>
            <select
              className="filter-select"
              value={filters.app_id}
              onChange={(e) => setFilters(prev => ({ ...prev, app_id: e.target.value }))}
            >
              <option value="">全部</option>
              {apps.map(app => (
                <option key={app.id} value={app.id}>{app.app_name}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <span className="filter-label">类型:</span>
            <select
              className="filter-select"
              value={filters.task_type}
              onChange={(e) => setFilters(prev => ({ ...prev, task_type: e.target.value }))}
            >
              <option value="">全部</option>
              <option value="migrate">迁移</option>
              <option value="rollback">回滚</option>
              <option value="validate">验证</option>
            </select>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>任务编号</th>
              <th>应用</th>
              <th>环境</th>
              <th>类型</th>
              <th>优先级</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id}>
                <td style={{ cursor: 'pointer', color: '#667eea' }} onClick={() => navigate(`/tasks/${task.id}`)}>
                  {task.task_no}
                </td>
                <td>{task.app_name}</td>
                <td>{task.env_name}</td>
                <td><span className="tag tag-blue">{task.task_type === 'migrate' ? '迁移' : task.task_type === 'rollback' ? '回滚' : '验证'}</span></td>
                <td><span className={`tag ${task.priority === 'critical' ? 'tag-red' : task.priority === 'high' ? 'tag-orange' : 'tag-blue'}`}>{task.priority}</span></td>
                <td><span className={`status ${getStatusClass(task.status)}`}>{getStatusLabel(task.status)}</span></td>
                <td>{task.creator_name}</td>
                <td>{task.created_at}</td>
                <td>
                  <div className="flex gap-sm">
                    <button className="btn btn-sm btn-default" onClick={() => navigate(`/tasks/${task.id}`)}>详情</button>
                    {task.status === 'created' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleSubmit(task.id)}>提交</button>
                    )}
                    {['submitted', 'reviewing'].includes(task.status) && (
                      <button className="btn btn-sm btn-success" onClick={() => handleExecute(task.id)}>执行</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(page => (
            <button
              key={page}
              className={`pagination-btn ${page === pagination.page ? 'active' : ''}`}
              onClick={() => setPagination(prev => ({ ...prev, page }))}
            >
              {page}
            </button>
          ))}
          <button
            className="pagination-btn"
            disabled={pagination.page >= totalPages}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            下一页
          </button>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">新建迁移任务</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">应用 *</label>
                <select
                  className="form-select"
                  value={newTask.app_id}
                  onChange={(e) => handleAppChange(e.target.value)}
                >
                  <option value="">请选择应用</option>
                  {apps.map(app => (
                    <option key={app.id} value={app.id}>{app.app_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">环境 *</label>
                <select
                  className="form-select"
                  value={newTask.env_id}
                  onChange={(e) => setNewTask(prev => ({ ...prev, env_id: e.target.value }))}
                >
                  <option value="">请选择环境</option>
                  {envs.map(env => (
                    <option key={env.id} value={env.id}>{env.env_name} ({env.env_type})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">迁移版本</label>
                <select
                  className="form-select"
                  value={newTask.version_id}
                  onChange={(e) => setNewTask(prev => ({ ...prev, version_id: e.target.value }))}
                >
                  <option value="">请选择版本</option>
                  {versions.map(v => (
                    <option key={v.id} value={v.id}>{v.version} - {v.description}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">任务类型 *</label>
                <select
                  className="form-select"
                  value={newTask.task_type}
                  onChange={(e) => setNewTask(prev => ({ ...prev, task_type: e.target.value }))}
                >
                  <option value="migrate">迁移</option>
                  <option value="rollback">回滚</option>
                  <option value="validate">验证</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">优先级</label>
                <select
                  className="form-select"
                  value={newTask.priority}
                  onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">低</option>
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowCreateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateTask} disabled={loading}>
                {loading ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskList;
