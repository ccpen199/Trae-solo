import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import { planetAPI } from '../utils/api';
import { Announcement, Activity, Task } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [diamondData, setDiamondData] = useState<any>(null);
  const [forceData, setForceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [homeRes, diamondRes, forceRes] = await Promise.all([
        planetAPI.getHome(),
        isAuthenticated ? planetAPI.getDiamond() : Promise.resolve({ data: null }),
        isAuthenticated ? planetAPI.getForce() : Promise.resolve({ data: null })
      ]);
      setAnnouncements(homeRes.data.announcements);
      setActivities(homeRes.data.activities);
      setTasks(homeRes.data.forceTasks);
      setDiamondData(diamondRes.data);
      setForceData(forceRes.data);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDiamond = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await planetAPI.claimDiamond();
      loadData();
    } catch (error) {
      console.error('Claim error:', error);
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
      console.error('Complete task error:', error);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>🌍 网易星球</h1>
          <p>数据价值，你我共享</p>
        </div>
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="header">
        <h1>🌍 网易星球</h1>
        <p>数据价值，你我共享</p>
      </div>

      <div className="card balance-card">
        <div className="balance-label">黑钻总数</div>
        <div className="balance-value">
          {isAuthenticated && diamondData ? diamondData.currentDiamond?.toFixed(2) : '--'}
        </div>
        {isAuthenticated && diamondData && (
          <>
            {diamondData.growthStopped && (
              <div className="warning" style={{ margin: '16px 0', background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}>
                ⚠️ 黑钻已停止生长，请尽快领取！
              </div>
            )}
            {diamondData.canClaim && (
              <button 
                className="btn" 
                style={{ background: 'white', color: '#667eea' }}
                onClick={handleClaimDiamond}
              >
                领取 {diamondData.availableDiamond?.toFixed(2)} 黑钻
              </button>
            )}
          </>
        )}
        <div className="stats-row">
          <div className="stat">
            <div className="stat-value">
              {isAuthenticated && forceData ? forceData.currentForce : '--'}
            </div>
            <div className="stat-label">原力值</div>
          </div>
          <div className="stat">
            <div className="stat-value">
              {user ? user.nickname?.charAt(0) : '--'}
            </div>
            <div className="stat-label">用户</div>
          </div>
        </div>
      </div>

      {announcements.map(ann => (
        <div key={ann.id} className="announcement">
          <div className="announcement-title">{ann.title}</div>
          <div className="announcement-content">{ann.content}</div>
        </div>
      ))}

      {activities.map(act => (
        <div key={act.id} className="activity-banner">
          <div className="activity-title">{act.title}</div>
          <div className="activity-desc">{act.description}</div>
        </div>
      ))}

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>原力任务</h3>
        {tasks.map((task: any) => (
          <div key={task.id} className="task-item">
            <div className="task-info">
              <span className="task-icon">{task.icon || '📋'}</span>
              <div>
                <div className="task-name">{task.name}</div>
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
        ))}
      </div>
    </div>
  );
};

export default Home;
