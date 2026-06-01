import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingApi, userApi } from '../api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const data = await userApi.getMeetings();
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMeeting = async () => {
    try {
      const data = await meetingApi.quickMeeting('快速会议');
      navigate(`/meeting/${data.meeting.meeting_number}`);
    } catch (error) {
      alert('创建会议失败: ' + error.message);
    }
  };

  const handleJoinMeeting = (meetingNumber) => {
    navigate(`/meeting/${meetingNumber}`);
  };

  const formatTime = (timeStr) => {
    const date = new Date(timeStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      ongoing: { text: '进行中', className: 'ongoing' },
      scheduled: { text: '已预定', className: 'scheduled' },
      ended: { text: '已结束', className: 'ended' },
      cancelled: { text: '已取消', className: 'ended' },
    };
    return statusMap[status] || { text: status, className: 'scheduled' };
  };

  const quickActions = [
    { icon: '⚡', title: '快速会议', desc: '立即开始会议', color: 'blue', action: handleQuickMeeting },
    { icon: '📅', title: '预定会议', desc: '安排会议时间', color: 'green', action: () => navigate('/schedule') },
    { icon: '🔗', title: '加入会议', desc: '输入会议号加入', color: 'purple', action: () => navigate('/join') },
    { icon: '📁', title: '我的会议', desc: '查看会议记录', color: 'orange', action: () => {} },
  ];

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
          欢迎回来！
        </h1>
        <p style={{ color: '#6b7280' }}>开始或管理您的视频会议</p>
      </div>

      <div className="dashboard-grid">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className="dash-card"
            onClick={action.action}
          >
            <div className={`dash-card-icon ${action.color}`}>
              {action.icon}
            </div>
            <div className="dash-card-title">{action.title}</div>
            <div className="dash-card-desc">{action.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 className="section-title">我的会议</h2>
        
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            加载中...
          </div>
        ) : meetings.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-icon">📭</div>
            <div className="empty-text">暂无会议记录</div>
            <button className="btn btn-primary" onClick={() => navigate('/schedule')}>
              预定第一个会议
            </button>
          </div>
        ) : (
          <div className="meeting-list">
            {meetings.map(meeting => {
              const status = getStatusBadge(meeting.status);
              return (
                <div key={meeting.id} className="meeting-item">
                  <div className="meeting-info">
                    <span className={`meeting-status ${status.className}`}>
                      {status.text}
                    </span>
                    <div>
                      <div className="meeting-title">{meeting.title}</div>
                      <div className="meeting-meta">
                        <span>会议号: {meeting.meeting_number}</span>
                        <span>开始: {formatTime(meeting.start_time)}</span>
                        {meeting.participant_count && (
                          <span>参会: {meeting.participant_count}人</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {meeting.status === 'ongoing' && (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleJoinMeeting(meeting.meeting_number)}
                      >
                        加入
                      </button>
                    )}
                    {meeting.status === 'scheduled' && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => navigate(`/schedule?edit=${meeting.id}`)}
                      >
                        编辑
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
