import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { planetAPI } from '../utils/api';
import { Task, ForceTask } from '../types';

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [forceHistory, setForceHistory] = useState<ForceTask[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, forceRes] = await Promise.all([
        planetAPI.getTasks(),
        isAuthenticated ? planetAPI.getForce() : Promise.resolve({ data: { tasks: [] } })
      ]);
      setTasks(tasksRes.data.tasks);
      setForceHistory(forceRes.data?.tasks || []);
    } catch (error) {
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (task.type === 'daily') {
        await planetAPI.checkin();
      } else {
        await planetAPI.completeTask({
          taskType: task.type,
          taskName: task.name,
          forceValue: task.force
        });
      }
      loadData();
    } catch (error) {
      console.error('Complete error:', error);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="header">
        <h1>💪 原力任务</h1>
        <p>完成任务获取原力</p>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          任务中心
        </div>
        <div 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          原力记录
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="card">
          {loading ? (
            <div className="loading">加载中...</div>
          ) : tasks.length === 0 ? (
            <div className="empty">暂无任务</div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="task-item">
                <div className="task-info">
                  <span className="task-icon">{task.icon}</span>
                  <div>
                    <div className="task-name">{task.name}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{task.description}</div>
                    <div className="task-force">+{task.force} 原力</div>
                  </div>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: 'auto', padding: '8px 16px', fontSize: 14 }}
                  onClick={() => handleCompleteTask(task)}
                >
                  完成
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card">
          {!isAuthenticated ? (
            <div className="empty">
              <p>请先登录查看原力记录</p>
              <button 
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => navigate('/login')}
              >
                去登录
              </button>
            </div>
          ) : loading ? (
            <div className="loading">加载中...</div>
          ) : forceHistory.length === 0 ? (
            <div className="empty">暂无原力记录</div>
          ) : (
            forceHistory.map((item, index) => (
              <div key={index} className="task-item" style={{ padding: '12px 0' }}>
                <div className="task-info">
                  <span className="task-icon">✨</span>
                  <div>
                    <div className="task-name">{item.task_name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {new Date(item.completed_at || '').toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="task-force">+{item.force_value}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;
