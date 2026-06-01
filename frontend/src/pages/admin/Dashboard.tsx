import React, { useState, useEffect } from 'react';
import apiClient from '../../api/client';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const statsRes = await apiClient.get('/admin/stats');
        setStats(statsRes.data);
      } else if (activeTab === 'users') {
        const usersRes = await apiClient.get('/admin/users');
        setUsers(usersRes.data);
      } else if (activeTab === 'meetings') {
        const meetingsRes = await apiClient.get('/admin/meetings');
        setMeetings(meetingsRes.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const updateUserPlan = async (userId: number, plan: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/plan`, { plan });
      loadData();
    } catch (err) {}
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="mb-20">管理后台</h2>

        <div className="tabs">
          <div className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            数据概览
          </div>
          <div className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            用户管理
          </div>
          <div className={`tab ${activeTab === 'meetings' ? 'active' : ''}`} onClick={() => setActiveTab('meetings')}>
            会议管理
          </div>
          <div className={`tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            异常日志
          </div>
        </div>

        {loading && <p className="text-center">加载中...</p>}

        {!loading && activeTab === 'overview' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.userCount || 0}</div>
                <div className="stat-label">总用户数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.meetingCount || 0}</div>
                <div className="stat-label">总会议数</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.activeMeetingCount || 0}</div>
                <div className="stat-label">进行中会议</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{Math.round((stats.totalRecordingSize || 0) / 1024)} MB</div>
                <div className="stat-label">云录制总大小</div>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>会议号</th>
                <th>角色</th>
                <th>版本</th>
                <th>注册时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.meeting_number}</td>
                  <td>
                    <span className={`badge ${user.role === 'admin' ? 'badge-warning' : 'badge-primary'}`}>
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.plan === 'pro' ? 'badge-warning' : 'badge-primary'}`}>
                      {user.plan === 'pro' ? '专业版' : '免费版'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    {user.role !== 'admin' && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                        onClick={() => updateUserPlan(user.id, user.plan === 'pro' ? 'free' : 'pro')}
                      >
                        {user.plan === 'pro' ? '降级' : '升级'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeTab === 'meetings' && (
          <table className="table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>会议主题</th>
                <th>会议号</th>
                <th>发起人</th>
                <th>状态</th>
                <th>参会人数</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id}>
                  <td>{meeting.title}</td>
                  <td>{meeting.meeting_number}</td>
                  <td>{meeting.host_name}</td>
                  <td>
                    <span className={`badge ${meeting.status === 'active' ? 'badge-success' : 'badge-primary'}`}>
                      {meeting.status === 'active' ? '进行中' : '已结束'}
                    </span>
                  </td>
                  <td>{meeting.participant_count || 0}</td>
                  <td>{new Date(meeting.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && activeTab === 'logs' && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>暂无异常日志</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
