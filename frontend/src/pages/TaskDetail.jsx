import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI } from '../utils/api';

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executeProgress, setExecuteProgress] = useState(0);
  const [executeMessage, setExecuteMessage] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadTask();
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [id]);

  useEffect(() => {
    if (task?.status === 'running' && !refreshInterval) {
      const interval = setInterval(loadTask, 1000);
      setRefreshInterval(interval);
    } else if (task?.status !== 'running' && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [task?.status]);

  const loadTask = async () => {
    try {
      const res = await taskAPI.get(id);
      setTask(res.data);
    } catch (err) {
      console.error('加载任务详情失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await taskAPI.approve(id);
      loadTask();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const handleReject = async () => {
    const reason = prompt('请输入拒绝原因：');
    if (reason) {
      try {
        await taskAPI.reject(id, reason);
        loadTask();
      } catch (err) {
        alert(err.response?.data?.error || '操作失败');
      }
    }
  };

  const handleExecute = async () => {
    if (executing) return;
    setExecuting(true);
    setExecuteProgress(0);
    setExecuteMessage('正在连接配置中心...');
    
    const stages = ['配置推送', '灰度验证', '流量切换', '健康检查', '执行完成'];
    let currentStage = 0;
    
    const progressInterval = setInterval(() => {
      currentStage++;
      if (currentStage <= stages.length) {
        setExecuteProgress(Math.min(currentStage * 20, 100));
        setExecuteMessage(`【${currentStage}/5】正在${stages[currentStage - 1]}...`);
      }
    }, 1000);

    try {
      const res = await taskAPI.execute(id);
      
      setTimeout(() => {
        loadTask();
      }, 1000);
      
      const waitComplete = setInterval(async () => {
        const checkRes = await taskAPI.get(id);
        if (checkRes.data.status === 'completed') {
          clearInterval(waitComplete);
          clearInterval(progressInterval);
          setExecuteProgress(100);
          setExecuteMessage('✅ 执行完成！');
          setTimeout(() => {
            setExecuting(false);
            loadTask();
          }, 1000);
        } else if (checkRes.data.status === 'running') {
          setTask(checkRes.data);
        }
      }, 1000);
      
    } catch (err) {
      clearInterval(progressInterval);
      setExecuting(false);
      alert(err.response?.data?.error || '执行失败');
    }
  };

  const handleRollback = async () => {
    const reason = prompt('请输入回滚原因：');
    if (reason) {
      try {
        await taskAPI.rollback(id, reason);
        loadTask();
      } catch (err) {
        alert(err.response?.data?.error || '操作失败');
      }
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!task) return <div className="error-message">任务不存在</div>;

  return (
    <div>
      <button className="btn btn-default btn-sm" onClick={() => navigate('/tasks')} style={{ marginBottom: 16 }}>
        ← 返回任务列表
      </button>

      <div className="card">
        <div className="card-header">
          <h3>{task.title}</h3>
          <StatusBadge status={task.status} />
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">应用</span>
            <span className="detail-value">{task.app_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">环境</span>
            <span className="detail-value">{task.env_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">配置版本</span>
            <span className="detail-value"><code>{task.config_version}</code></span>
          </div>
          <div className="detail-item">
            <span className="detail-label">灰度比例</span>
            <span className="detail-value">{task.gray_percentage}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">灰度策略</span>
            <span className="detail-value">{task.gray_strategy}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">任务类型</span>
            <span className="detail-value">{task.task_type}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">创建人</span>
            <span className="detail-value">{task.creator_name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">创建时间</span>
            <span className="detail-value">{new Date(task.created_at).toLocaleString()}</span>
          </div>
          {task.approver_name && (
            <div className="detail-item">
              <span className="detail-label">审批人</span>
              <span className="detail-value">{task.approver_name}</span>
            </div>
          )}
          {task.executor_name && (
            <div className="detail-item">
              <span className="detail-label">执行人</span>
              <span className="detail-value">{task.executor_name}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <strong>变更原因：</strong>
            <p style={{ color: '#666', marginTop: 4 }}>{task.reason}</p>
          </div>
          <div style={{ marginBottom: 12 }}>
            <strong>影响范围：</strong>
            <p style={{ color: '#666', marginTop: 4 }}>{task.impact_scope || '-'}</p>
          </div>
          <div>
            <strong>恢复路径：</strong>
            <p style={{ color: '#666', marginTop: 4 }}><code>{task.rollback_path}</code></p>
          </div>
        </div>
        {executing && (
          <div style={{ marginBottom: 16, padding: 16, background: '#e6f7ff', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>🚀 任务执行中...</span>
              <span>{executeProgress}%</span>
            </div>
            <div style={{ height: 8, background: '#fff', borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: '#1890ff', 
                  width: `${executeProgress}%`,
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
              {executeMessage}
            </div>
          </div>
        )}
        <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          {task.status === 'pending' && (
            <>
              <button className="btn btn-success" onClick={handleApprove}>审批通过</button>
              <button className="btn btn-danger" onClick={handleReject}>拒绝</button>
            </>
          )}
          {task.status === 'approved' && (
            <button className="btn btn-primary" onClick={handleExecute} disabled={executing}>
              {executing ? '执行中...' : '执行发布'}
            </button>
          )}
          {task.status === 'running' && (
            <div style={{ padding: '8px 16px', background: '#e6f7ff', borderRadius: 4, color: '#1890ff' }}>
              ⏳ 任务正在执行中，请稍候...
            </div>
          )}
          {task.status === 'completed' && (
            <button className="btn btn-danger" onClick={handleRollback}>回滚配置</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>配置内容</h3>
        </div>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, overflow: 'auto' }}>
          {JSON.stringify(JSON.parse(task.config_content || '{}'), null, 2)}
        </pre>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>执行时间线</h3>
        </div>
        {task.logs?.length === 0 ? (
          <div className="empty-state">暂无执行记录</div>
        ) : (
          <div className="timeline">
            {task.logs?.map(log => (
              <div key={log.id} className="timeline-item">
                <div className="time">{new Date(log.created_at).toLocaleString()}</div>
                <div className="action">{log.action} - {log.operator_name}</div>
                <div className="details">{log.details}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  const badgeMap = {
    pending: { class: 'badge-warning', text: '待审批' },
    approved: { class: 'badge-info', text: '已通过' },
    running: { class: 'badge-info', text: '执行中' },
    completed: { class: 'badge-success', text: '已完成' },
    rejected: { class: 'badge-error', text: '已拒绝' },
    cancelled: { class: 'badge-default', text: '已取消' },
    rollback: { class: 'badge-error', text: '已回滚' }
  };
  const badge = badgeMap[status] || { class: 'badge-default', text: status };
  return <span className={`badge ${badge.class}`}>{badge.text}</span>;
};

export default TaskDetail;
