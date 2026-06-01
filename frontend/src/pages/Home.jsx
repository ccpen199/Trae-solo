import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingAPI } from '../services/api';

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [meetingNumber, setMeetingNumber] = useState('');
  const [usePersonalId, setUsePersonalId] = useState(false);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      const [scheduledRes, historyRes] = await Promise.all([
        meetingAPI.getScheduled(),
        meetingAPI.getHistory()
      ]);
      setScheduledMeetings(scheduledRes.data.meetings || []);
      setMeetingHistory(historyRes.data.history || []);
    } catch (e) {
      console.error('加载会议列表失败', e);
    }
  };

  const handleQuickMeeting = async () => {
    try {
      const res = await meetingAPI.createQuick({ usePersonalId, title: '快速会议' });
      navigate(`/meeting/${res.data.meeting.id}`);
    } catch (e) {
      console.error('创建会议失败', e);
    }
  };

  const handleJoinMeeting = async (e) => {
    e.preventDefault();
    try {
      const res = await meetingAPI.join({ meetingNumber });
      navigate(`/meeting/${res.data.meeting.id}`);
    } catch (e) {
      console.error('加入会议失败', e);
    }
  };

  const handleStartScheduled = async (meeting) => {
    try {
      const res = await meetingAPI.join({ meetingNumber: meeting.meetingNumber });
      navigate(`/meeting/${res.data.meeting.id}`);
    } catch (e) {
      console.error('开始会议失败', e);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="logo">云会议</div>
        <div className="user-info">
          <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
          <span>{user?.name}</span>
          <button className="btn btn-secondary" onClick={logout}>退出</button>
        </div>
      </header>

      <div className="container">
        <div className="grid grid-3">
          <div className="meeting-card blue" onClick={handleQuickMeeting}>
            <h3>快速会议</h3>
            <p>立即开始一个会议</p>
            <div className="mt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={usePersonalId} onChange={(e) => setUsePersonalId(e.target.checked)} />
                使用个人会议号
              </label>
            </div>
          </div>

          <div className="meeting-card" onClick={() => setShowJoinModal(true)}>
            <h3>加入会议</h3>
            <p>输入会议号加入</p>
          </div>

          <div className="meeting-card green" onClick={() => navigate('/schedule')}>
            <h3>预定会议</h3>
            <p>安排未来的会议</p>
          </div>
        </div>

        <div className="grid grid-2 mt-4">
          <div className="card">
            <h2 className="title" style={{ fontSize: '20px' }}>预定的会议</h2>
            <div className="mt-4">
              {scheduledMeetings.length === 0 ? (
                <p className="text-gray text-center py-4">暂无预定会议</p>
              ) : (
                scheduledMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2" style={{ background: '#f9fafb' }}>
                    <div>
                      <h4 className="font-semibold">{meeting.title}</h4>
                      <p className="text-sm text-gray">{meeting.meetingNumber}</p>
                      <p className="text-sm text-gray">{new Date(meeting.startTime).toLocaleString()}</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleStartScheduled(meeting)}>开始</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="title" style={{ fontSize: '20px' }}>历史会议</h2>
            <div className="mt-4 participant-list">
              {meetingHistory.length === 0 ? (
                <p className="text-gray text-center py-4">暂无历史会议</p>
              ) : (
                meetingHistory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2" style={{ background: '#f9fafb' }}>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-gray">{item.meetingNumber}</p>
                      <p className="text-sm text-gray">{new Date(item.joinedAt).toLocaleString()}</p>
                    </div>
                    <span className="badge badge-host">{item.role === 'host' ? '主持人' : '参会者'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showJoinModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card max-w-md" style={{ width: '100%' }}>
            <h2 className="title text-center">加入会议</h2>
            <form onSubmit={handleJoinMeeting}>
              <div className="form-group">
                <label className="label">会议号</label>
                <input type="text" className="input" value={meetingNumber} onChange={(e) => setMeetingNumber(e.target.value)} placeholder="请输入会议号" />
              </div>
              <div className="flex gap-4">
                <button type="button" className="btn btn-secondary w-full" onClick={() => setShowJoinModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary w-full">加入</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
