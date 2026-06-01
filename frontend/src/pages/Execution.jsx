import React, { useEffect, useState } from 'react';
import api from '../utils/api';

function Execution() {
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [filters, setFilters] = useState({ status: '' });
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetail, setTaskDetail] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'tasks') {
      loadTasks();
    }
  }, [activeTab, filters]);

  const loadTasks = async () => {
    try {
      const res = await api.get('/execution/tasks', { params: filters });
      setTasks(res.data.list);
    } catch (err) {
      console.error('加载任务失败', err);
    }
  };

  const handleExecute = async (id) => {
    try {
      await api.post(`/execution/tasks/${id}/execute`);
      loadTasks();
      alert('任务已开始执行');
    } catch (err) {
      alert(err.response?.data?.error || '执行失败');
    }
  };

  const handleRetry = async (id) => {
    try {
      const res = await api.post(`/execution/tasks/${id}/retry`);
      loadTasks();
      alert(`重试任务已创建: ${res.data.task_no}`);
    } catch (err) {
      alert(err.response?.data?.error || '重试失败');
    }
  };

  const handleView = async (task) => {
    setSelectedTask(task);
    try {
      const res = await api.get(`/execution/tasks/${task.id}`);
      setTaskDetail(res.data);
    } catch (err) {
      console.error('加载详情失败', err);
    }
    setShowModal(true);
  };

  const handleResolveException = async (exceptionId) => {
    const action = prompt('请输入补偿动作：');
    const notes = prompt('请输入人工备注：');
    if (!action) return;
    try {
      await api.post(`/execution/exceptions/${exceptionId}/resolve`, {
        compensation_action: action,
        manual_notes: notes
      });
      if (taskDetail) {
        const res = await api.get(`/execution/tasks/${taskDetail.id}`);
        setTaskDetail(res.data);
      }
      alert('已标记为已解决');
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">⚡ 执行任务</h2>
        </div>

        <div className="tabs">
          <div className={`tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>执行任务</div>
          <div className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>调用日志</div>
          <div className={`tab ${activeTab === 'exceptions' ? 'active' : ''}`} onClick={() => setActiveTab('exceptions')}>异常处理</div>
          <div className={`tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>告警记录</div>
        </div>

        {activeTab === 'tasks' && (
          <>
            <div className="filter-bar">
              <div className="filter-item">
                <label>状态：</label>
                <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">全部</option>
                  <option value="pending">待执行</option>
                  <option value="running">执行中</option>
                  <option value="success">成功</option>
                  <option value="failed">失败</option>
                </select>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>任务编号</th>
                  <th>关联变更单</th>
                  <th>应用</th>
                  <th>任务类型</th>
                  <th>状态</th>
                  <th>执行人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>{task.task_no}</td>
                    <td>{task.order_title || '-'}</td>
                    <td>{task.app_name}</td>
                    <td>{task.task_type}</td>
                    <td><span className={`status-badge status-${task.status}`}>{task.status}</span></td>
                    <td>{task.executor_name || '-'}</td>
                    <td>{task.created_at}</td>
                    <td>
                      <button className="btn btn-default" style={{ marginRight: 8 }} onClick={() => handleView(task)}>详情</button>
                      {task.status === 'pending' && (
                        <button className="btn btn-primary" style={{ marginRight: 8 }} onClick={() => handleExecute(task.id)}>执行</button>
                      )}
                      {task.status === 'failed' && (
                        <button className="btn btn-success" onClick={() => handleRetry(task.id)}>重试</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activeTab === 'logs' && <LogsView />}
        {activeTab === 'exceptions' && <ExceptionsView onResolve={handleResolveException} />}
        {activeTab === 'alerts' && <AlertsView />}
      </div>

      {showModal && taskDetail && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>任务详情 - {taskDetail.task_no}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <p><strong>状态：</strong><span className={`status-badge status-${taskDetail.status}`}>{taskDetail.status}</span></p>
                <p><strong>应用：</strong>{taskDetail.app_name}</p>
                <p><strong>执行结果：</strong>{taskDetail.result ? JSON.stringify(JSON.parse(taskDetail.result), null, 2) : '-'}</p>
              </div>

              <h4 style={{ marginBottom: 12 }}>调用日志</h4>
              <table style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>接口</th>
                    <th>状态码</th>
                    <th>耗时</th>
                  </tr>
                </thead>
                <tbody>
                  {taskDetail.logs?.map(log => (
                    <tr key={log.id}>
                      <td>{log.created_at}</td>
                      <td>{log.endpoint}</td>
                      <td>{log.status_code}</td>
                      <td>{log.duration}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {taskDetail.exceptions?.length > 0 && (
                <>
                  <h4 style={{ margin: '20px 0 12px' }}>异常记录</h4>
                  {taskDetail.exceptions.map(ex => (
                    <div key={ex.id} className="card" style={{ marginBottom: 10, padding: 12 }}>
                      <p><strong>错误类型：</strong>{ex.error_type}</p>
                      <p><strong>错误信息：</strong>{ex.error_message}</p>
                      <p><strong>状态：</strong><span className={`status-badge status-${ex.status === 'resolved' ? 'success' : 'pending'}`}>{ex.status}</span></p>
                      {ex.status !== 'resolved' && (
                        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => handleResolveException(ex.id)}>标记解决</button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogsView() {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    api.get('/execution/logs').then(res => setLogs(res.data.list));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>时间</th>
          <th>应用ID</th>
          <th>接口</th>
          <th>方法</th>
          <th>状态码</th>
          <th>耗时</th>
        </tr>
      </thead>
      <tbody>
        {logs.map(log => (
          <tr key={log.id}>
            <td>{log.created_at}</td>
            <td>{log.app_id}</td>
            <td>{log.endpoint}</td>
            <td>{log.method}</td>
            <td>{log.status_code}</td>
            <td>{log.duration}ms</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExceptionsView({ onResolve }) {
  const [exceptions, setExceptions] = useState([]);
  
  useEffect(() => {
    api.get('/execution/exceptions').then(res => setExceptions(res.data.list));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>时间</th>
          <th>错误类型</th>
          <th>错误信息</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {exceptions.map(ex => (
          <tr key={ex.id}>
            <td>{ex.created_at}</td>
            <td>{ex.error_type}</td>
            <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{ex.error_message}</td>
            <td><span className={`status-badge status-${ex.status === 'resolved' ? 'success' : 'pending'}`}>{ex.status}</span></td>
            <td>
              {ex.status !== 'resolved' && (
                <button className="btn btn-primary" onClick={() => onResolve(ex.id)}>解决</button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    api.get('/execution/alerts').then(res => setAlerts(res.data.list));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>时间</th>
          <th>应用</th>
          <th>告警类型</th>
          <th>级别</th>
          <th>消息</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        {alerts.map(alert => (
          <tr key={alert.id}>
            <td>{alert.created_at}</td>
            <td>{alert.app_name}</td>
            <td>{alert.alert_type}</td>
            <td><span className={`status-badge ${alert.severity === 'high' ? 'status-failed' : 'status-pending'}`}>{alert.severity}</span></td>
            <td>{alert.message}</td>
            <td><span className={`status-badge status-${alert.status === 'resolved' ? 'success' : 'pending'}`}>{alert.status}</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default Execution;
