import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const History: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await apiClient.get('/meetings/history/list');
      setMeetings(response.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const deleteMeeting = async (id: number) => {
    if (!confirm('确定要删除这条会议记录吗？')) return;

    try {
      await apiClient.delete(`/meetings/${id}`);
      setMeetings(meetings.filter(m => m.id !== id));
    } catch (err) {}
  };

  const rejoinMeeting = async (meetingNumber: string) => {
    try {
      await apiClient.post(`/meetings/${meetingNumber}/join`, {});
      navigate(`/meeting/${meetingNumber}`);
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <p className="text-center">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="flex flex-between mb-20">
          <h2>历史会议</h2>
          {meetings.length > 0 && (
            <button 
              type="button"
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={(e) => e.preventDefault()}
            >
              清空历史
            </button>
          )}
        </div>

        {meetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📹</div>
            <p>暂无会议记录</p>
            <button 
              type="button"
              className="btn btn-primary mt-20" 
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
            >
              开始第一个会议
            </button>
          </div>
        ) : (
          <div className="meeting-grid">
            {meetings.map((meeting) => (
              <div key={meeting.id} className="meeting-card">
                <div className="meeting-card-header">
                  <h4 style={{ marginBottom: '8px' }}>{meeting.title}</h4>
                  <p style={{ fontSize: '12px', opacity: 0.9 }}>会议号：{meeting.meeting_number}</p>
                </div>
                <div className="meeting-card-body">
                  <p style={{ marginBottom: '8px', fontSize: '14px' }}>
                    <span className="text-muted">发起人：</span>
                    <span>{meeting.host_name}</span>
                  </p>
                  <p style={{ marginBottom: '16px', fontSize: '14px' }}>
                    <span className="text-muted">开始时间：</span>
                    <span>{new Date(meeting.created_at).toLocaleString()}</span>
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px' }}
                      onClick={(e) => { e.preventDefault(); rejoinMeeting(meeting.meeting_number); }}
                    >
                      重新入会
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px' }}
                      onClick={(e) => { e.preventDefault(); deleteMeeting(meeting.id); }}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
