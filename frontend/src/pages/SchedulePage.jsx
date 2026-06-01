import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { meetingApi } from '../api';

const SchedulePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    duration: 60,
    password: '',
    description: '',
    waitingRoomEnabled: false,
    muteOnEntry: false,
  });

  useEffect(() => {
    if (editId) {
      console.log('Edit meeting:', editId);
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await meetingApi.scheduleMeeting({
        title: formData.title,
        startTime: formData.startTime,
        duration: parseInt(formData.duration),
        password: formData.password || null,
        description: formData.description,
        waitingRoomEnabled: formData.waitingRoomEnabled,
        muteOnEntry: formData.muteOnEntry,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    now.setSeconds(0);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        {editId ? '编辑会议' : '预定会议'}
      </h1>

      <div className="card" style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">会议主题 *</label>
            <input
              type="text"
              name="title"
              className="input"
              placeholder="请输入会议主题"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">开始时间 *</label>
            <input
              type="datetime-local"
              name="startTime"
              className="input"
              value={formData.startTime || getDefaultTime()}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">会议时长 (分钟)</label>
            <select
              name="duration"
              className="input"
              value={formData.duration}
              onChange={handleChange}
            >
              <option value={30}>30 分钟</option>
              <option value={45}>45 分钟</option>
              <option value={60}>60 分钟</option>
              <option value={90}>90 分钟</option>
              <option value={120}>120 分钟</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">会议密码 (可选)</label>
            <input
              type="text"
              name="password"
              className="input"
              placeholder="留空则不需要密码"
              value={formData.password}
              onChange={handleChange}
              maxLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">会议描述 (可选)</label>
            <textarea
              name="description"
              className="input"
              placeholder="请输入会议描述"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ padding: '16px 0', borderTop: '1px solid #e5e7eb' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>
              高级选项
            </h3>

            <div className="switch">
              <span className="switch-label">启用等候室</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  name="waitingRoomEnabled"
                  checked={formData.waitingRoomEnabled}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: formData.waitingRoomEnabled ? '#10b981' : '#d1d5db',
                  position: 'relative',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: formData.waitingRoomEnabled ? '22px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </label>
            </div>

            <div className="switch">
              <span className="switch-label">参会者入会时静音</span>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  name="muteOnEntry"
                  checked={formData.muteOnEntry}
                  onChange={handleChange}
                  style={{ display: 'none' }}
                />
                <div style={{
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  background: formData.muteOnEntry ? '#10b981' : '#d1d5db',
                  position: 'relative',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: formData.muteOnEntry ? '22px' : '2px',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </label>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/')}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? '预定中...' : (editId ? '保存修改' : '预定会议')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchedulePage;
