import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingApi } from '../api';

const JoinPage = () => {
  const navigate = useNavigate();
  const [meetingNumber, setMeetingNumber] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needPassword, setNeedPassword] = useState(false);

  const handleCheckMeeting = async () => {
    if (!meetingNumber.trim()) {
      setError('请输入会议号');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await meetingApi.getMeeting(meetingNumber);
      if (data.meeting.password) {
        setNeedPassword(true);
      } else {
        await joinMeeting();
      }
    } catch (err) {
      setError(err.message || '会议不存在');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    try {
      await meetingApi.joinMeeting(meetingNumber, password || null, guestName || null);
      navigate(`/meeting/${meetingNumber}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needPassword) {
      setLoading(true);
      try {
        await joinMeeting();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      await handleCheckMeeting();
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        加入会议
      </h1>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">会议号 *</label>
            <input
              type="text"
              className="input"
              placeholder="请输入9位会议号"
              value={meetingNumber}
              onChange={(e) => setMeetingNumber(e.target.value)}
              maxLength={9}
              disabled={needPassword}
            />
          </div>

          {needPassword && (
            <>
              <div className="form-group">
                <label className="form-label">会议密码 *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入会议密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={6}
                />
              </div>
              <div className="form-group">
                <label className="form-label">您的名称 (可选)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="请输入您的名称"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
            </>
          )}

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setNeedPassword(false);
                setError('');
              }}
            >
              返回
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '处理中...' : (needPassword ? '加入会议' : '下一步')}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        <p>请输入主持人分享的9位会议号加入会议</p>
        <p style={{ marginTop: '8px' }}>如果会议需要密码，系统会提示您输入</p>
      </div>
    </div>
  );
};

export default JoinPage;
