import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const Home: React.FC = () => {
  const [meetingNumber, setMeetingNumber] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const createMeeting = async () => {
    if (!meetingTitle.trim()) {
      setError('请输入会议主题');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/meetings', {
        title: meetingTitle,
        password: meetingPassword || undefined,
        duration: 60
      });

      navigate(`/meeting/${response.data.meeting_number}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '创建会议失败');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    if (!meetingNumber.trim()) {
      setError('请输入会议号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiClient.post(`/meetings/${meetingNumber}/join`, {
        password: meetingPassword || undefined
      });

      navigate(`/meeting/${meetingNumber}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '加入会议失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="mb-20">欢迎回来，{user?.username}！</h2>
        <p className="text-muted mb-20">您的个人会议号：<span className="meeting-number text-primary">{user?.meetingNumber}</span></p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 className="mb-20">快速开始</h3>
          <button
            type="button"
            className="btn btn-primary btn-block mb-20"
            onClick={(e) => {
              e.preventDefault();
              setShowCreateModal(true);
              setMeetingTitle(`${user?.username}的会议`);
              setMeetingPassword('');
              setError('');
            }}
          >
            📹 发起会议
          </button>
          <button
            type="button"
            className="btn btn-success btn-block"
            onClick={(e) => {
              e.preventDefault();
              setShowJoinModal(true);
              setMeetingNumber('');
              setMeetingPassword('');
              setError('');
            }}
          >
            🔗 加入会议
          </button>
        </div>

        <div className="card">
          <h3 className="mb-20">版本权益</h3>
          <div className="mb-20">
            <div className="flex flex-between mb-10">
              <span>当前版本</span>
              <span className={`badge ${user?.plan === 'pro' ? 'badge-warning' : 'badge-primary'}`}>
                {user?.plan === 'pro' ? '专业版' : '免费版'}
              </span>
            </div>
            <div className="flex flex-between mb-10">
              <span>最大参会人数</span>
              <span className="text-primary">{user?.plan === 'pro' ? '500人' : '100人'}</span>
            </div>
            <div className="flex flex-between mb-10">
              <span>会议时长</span>
              <span className="text-primary">不限</span>
            </div>
            <div className="flex flex-between">
              <span>云录制</span>
              <span className={user?.plan === 'pro' ? 'text-success' : 'text-muted'}>
                {user?.plan === 'pro' ? '支持' : '升级专业版开启'}
              </span>
            </div>
          </div>
          {user?.plan !== 'pro' && (
            <button 
              type="button"
              className="btn btn-warning btn-block" 
              style={{ background: '#faad14', color: 'white' }}
              onClick={(e) => e.preventDefault()}
            >
              升级专业版
            </button>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={(e) => { e.preventDefault(); setShowCreateModal(false); }}>
          <div className="modal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <div className="modal-header">
              <span className="modal-title">发起会议</span>
              <button 
                type="button" 
                className="modal-close" 
                onClick={(e) => { e.preventDefault(); setShowCreateModal(false); }}
              >
                &times;
              </button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">会议主题</label>
              <input
                type="text"
                className="form-input"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), createMeeting())}
                placeholder="请输入会议主题"
              />
            </div>
            <div className="form-group">
              <label className="form-label">会议密码（可选）</label>
              <input
                type="text"
                className="form-input"
                value={meetingPassword}
                onChange={(e) => setMeetingPassword(e.target.value)}
                placeholder="不填则无密码"
              />
            </div>
            <button 
              type="button" 
              className="btn btn-primary btn-block" 
              onClick={(e) => { e.preventDefault(); createMeeting(); }} 
              disabled={loading}
            >
              {loading ? '创建中...' : '立即创建'}
            </button>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="modal-overlay" onClick={(e) => { e.preventDefault(); setShowJoinModal(false); }}>
          <div className="modal" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <div className="modal-header">
              <span className="modal-title">加入会议</span>
              <button 
                type="button" 
                className="modal-close" 
                onClick={(e) => { e.preventDefault(); setShowJoinModal(false); }}
              >
                &times;
              </button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">会议号</label>
              <input
                type="text"
                className="form-input"
                value={meetingNumber}
                onChange={(e) => setMeetingNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), joinMeeting())}
                placeholder="请输入9位会议号"
                maxLength={9}
              />
            </div>
            <div className="form-group">
              <label className="form-label">会议密码（可选）</label>
              <input
                type="text"
                className="form-input"
                value={meetingPassword}
                onChange={(e) => setMeetingPassword(e.target.value)}
                placeholder="请输入会议密码"
              />
            </div>
            <button 
              type="button" 
              className="btn btn-primary btn-block" 
              onClick={(e) => { e.preventDefault(); joinMeeting(); }} 
              disabled={loading}
            >
              {loading ? '加入中...' : '加入会议'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
