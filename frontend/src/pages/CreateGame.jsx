import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

function CreateGame({ user }) {
  const navigate = useNavigate();
  const allowedRoles = ['user', 'organizer', 'venue_manager'];
  const canCreate = allowedRoles.includes(user.role);
  
  const [venues, setVenues] = useState([]);
  const [courts, setCourts] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    sport_type: 'badminton',
    court_id: '',
    time_slot_id: '',
    level_required: 3,
    max_players: 4,
    min_players: 2,
    aa_rule: 'average',
    deposit_amount: 20,
    allow_waitlist: true
  });
  
  if (!canCreate) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <h2 style={{ color: '#e53e3e', marginBottom: '20px' }}>权限不足</h2>
        <p style={{ color: '#718096', marginBottom: '20px' }}>
          您的角色是 <strong>
            {{
              admin: '系统管理员',
              operator: '运营人员',
              customer_service: '客服',
              venue_manager: '场馆经理',
              organizer: '组织者',
              user: '普通用户'
            }[user.role] || user.role}
          </strong>，没有权限使用此功能。
        </p>
        <p style={{ color: '#718096' }}>
          创建球局是普通用户、组织者、场馆经理的专属功能。
        </p>
      </div>
    );
  }

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      const res = await api.get('/venues');
      setVenues(res.data);
    } catch (err) {
      console.error('加载场馆失败', err);
    }
  };

  const handleVenueChange = async (venueId) => {
    if (!venueId) {
      setCourts([]);
      setTimeSlots([]);
      return;
    }
    try {
      const res = await api.get(`/venues/${venueId}/courts`);
      setCourts(res.data);
    } catch (err) {
      console.error('加载场地失败', err);
    }
  };

  const handleCourtChange = async (courtId) => {
    setForm({ ...form, court_id: courtId, time_slot_id: '' });
    if (!courtId) {
      setTimeSlots([]);
      return;
    }
    const venueId = courts.find(c => c.id === courtId)?.venue_id;
    if (!venueId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/venues/${venueId}/time-slots`, {
        params: { date: today, courtId }
      });
      setTimeSlots(res.data);
    } catch (err) {
      console.error('加载时段失败', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.court_id || !form.time_slot_id) {
      alert('请选择场地和时段');
      return;
    }
    try {
      const res = await api.post('/games', form);
      alert('球局创建成功！');
      navigate(`/games/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.error || '创建失败');
    }
  };

  return (
    <div className="card">
      <h3>发起约球</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>球局标题 *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="例如：周六下午羽毛球双打"
            required
          />
        </div>
        <div className="form-group">
          <label>球局说明</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="介绍一下球局水平、要求等"
            rows="3"
          />
        </div>
        <div className="row">
          <div className="form-group">
            <label>运动类型 *</label>
            <select value={form.sport_type} onChange={(e) => setForm({ ...form, sport_type: e.target.value })}>
              <option value="badminton">羽毛球</option>
              <option value="tennis">网球</option>
              <option value="basketball">篮球</option>
            </select>
          </div>
          <div className="form-group">
            <label>等级要求 *</label>
            <select value={form.level_required} onChange={(e) => setForm({ ...form, level_required: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map(l => (
                <option key={l} value={l}>Lv.{l} ({['新手', '入门', '中级', '高级', '专业'][l-1]})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="form-group">
            <label>场馆 *</label>
            <select value={courts.find(c => c.id === form.court_id)?.venue_id || ''}
              onChange={(e) => handleVenueChange(e.target.value)}>
              <option value="">请选择场馆</option>
              {venues.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>场地 *</label>
            <select value={form.court_id} onChange={(e) => handleCourtChange(Number(e.target.value))}>
              <option value="">请选择场地</option>
              {courts.map(c => (
                <option key={c.id} value={c.id}>{c.name} (¥{c.price_per_hour}/小时)</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>时段 *</label>
          <div className="time-slot-grid">
            {timeSlots.map(ts => (
              <div
                key={ts.id}
                className={`time-slot ${ts.status} ${form.time_slot_id === ts.id ? 'selected' : ''}`}
                onClick={() => ts.status === 'available' && setForm({ ...form, time_slot_id: ts.id })}
              >
                {ts.start_time}-{ts.end_time}
                <br />
                <small>
                  {ts.status === 'available' ? '可预订' : ts.status === 'booked' ? '已预订' : '已使用'}
                </small>
              </div>
            ))}
          </div>
        </div>
        <div className="row">
          <div className="form-group">
            <label>最大人数 *</label>
            <input type="number" min="2" max="20" value={form.max_players}
              onChange={(e) => setForm({ ...form, max_players: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>最低成局人数 *</label>
            <input type="number" min="2" max={form.max_players} value={form.min_players}
              onChange={(e) => setForm({ ...form, min_players: Number(e.target.value) })} />
          </div>
        </div>
        <div className="row">
          <div className="form-group">
            <label>订金金额（元）</label>
            <input type="number" min="0" step="0.01" value={form.deposit_amount}
              onChange={(e) => setForm({ ...form, deposit_amount: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>AA规则</label>
            <select value={form.aa_rule} onChange={(e) => setForm({ ...form, aa_rule: e.target.value })}>
              <option value="average">人均平摊</option>
              <option value="organizer_free">组织者免单</option>
              <option value="custom">自定义</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>
            <input type="checkbox" checked={form.allow_waitlist}
              onChange={(e) => setForm({ ...form, allow_waitlist: e.target.checked })} />
            开启候补队列
          </label>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary">创建球局</button>
          <button type="button" className="btn" onClick={() => navigate('/games')}>取消</button>
        </div>
      </form>
    </div>
  );
}

export default CreateGame;
