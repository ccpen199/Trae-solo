import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { meetingAPI } from '../services/api';

export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 7200000).toISOString().slice(0, 16),
    isRecurring: false,
    recurringRule: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await meetingAPI.schedule({
        ...formData,
        startTime: new Date(formData.startTime).getTime(),
        endTime: new Date(formData.endTime).getTime()
      });
      navigate('/');
    } catch (e) {
      console.error('预定会议失败', e);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="logo">云会议</div>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>返回</button>
      </header>

      <div className="container">
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 className="title text-center">预定会议</h1>
          <p className="subtitle text-center">安排您的会议时间</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">会议主题</label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入会议主题"
                required
              />
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="label">开始时间</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">结束时间</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                周期会议
              </label>
            </div>

            {formData.isRecurring && (
              <div className="form-group">
                <label className="label">重复规则</label>
                <select
                  className="select w-full"
                  value={formData.recurringRule}
                  onChange={(e) => setFormData({ ...formData, recurringRule: e.target.value })}
                >
                  <option value="">请选择</option>
                  <option value="daily">每天</option>
                  <option value="weekly">每周</option>
                  <option value="biweekly">每两周</option>
                  <option value="monthly">每月</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="label">会议密码（可选）</label>
              <input
                type="text"
                className="input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="设置会议密码"
              />
            </div>

            <div className="flex gap-4 mt-4">
              <button type="button" className="btn btn-secondary w-full" onClick={() => navigate('/')}>取消</button>
              <button type="submit" className="btn btn-primary w-full">预定会议</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
