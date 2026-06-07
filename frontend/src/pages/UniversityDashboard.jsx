import { useState, useEffect } from 'react';
import axios from 'axios';

function UniversityDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [campusEvents, setCampusEvents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    university: '',
    eventType: 'career_fair',
    eventDate: '',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes, statsRes] = await Promise.all([
        axios.get('/api/campus/events'),
        axios.get('/api/stats')
      ]);
      setCampusEvents(eventsRes.data.events || []);
      setStats(statsRes.data);
      setPartners([
        { id: 1, name: '腾讯科技', industry: '互联网', jobs: 120, status: 'active' },
        { id: 2, name: '阿里巴巴', industry: '电商', jobs: 85, status: 'active' },
        { id: 3, name: '字节跳动', industry: '互联网', jobs: 95, status: 'active' },
        { id: 4, name: '华为技术', industry: '通信', jobs: 200, status: 'pending' },
        { id: 5, name: '美团点评', industry: '生活服务', jobs: 60, status: 'active' }
      ]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/campus/events', eventForm);
      setShowEventForm(false);
      setEventForm({
        title: '',
        university: '',
        eventType: 'career_fair',
        eventDate: '',
        description: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || '创建失败');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: { bg: '#dcfce7', color: '#166534', label: '✓ 已通过' },
      pending: { bg: '#fef3c7', color: '#92400e', label: '⏳ 审核中' },
      rejected: { bg: '#fee2e2', color: '#991b1b', label: '✗ 已拒绝' },
      active: { bg: '#dbeafe', color: '#1e40af', label: '合作中' }
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        background: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 24px', textAlign: 'center' }}>
        加载中...
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>🎓 高校就业办</h1>
          <p className="page-subtitle">校招协同管理与就业数据分析</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowEventForm(true)}
        >
          创建校招活动
        </button>
      </div>

      <div className="grid grid-4" style={{ gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>合作企业</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#4f46e5' }}>
            {partners.filter(p => p.status === 'active').length}
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>校招岗位</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#06b6d4' }}>
            {stats?.jobs || 0}
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>学生投递</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>
            {stats?.applications || 0}
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>就业率</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
            {stats?.jobseekers > 0 ? Math.round((stats?.hired || 0) / stats?.jobseekers * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px'
        }}>
          {['overview', 'events', 'partners', 'students'].map(tab => (
            <button 
              key={tab}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ 
                borderRadius: 0, 
                border: 'none', 
                background: 'transparent', 
                color: activeTab === tab ? '#4f46e5' : '#6b7280', 
                borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
                padding: '16px 24px'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '📊 数据概览'}
              {tab === 'events' && '📅 校招活动'}
              {tab === 'partners' && '🏢 合作企业'}
              {tab === 'students' && '👨‍🎓 学生管理'}
            </button>
          ))}
        </div>

        <div className="card-body">
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>就业趋势分析</h3>
              <div className="grid grid-2" style={{ gap: '24px' }}>
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>行业分布</div>
                  {[
                    { name: '互联网', count: 156, percent: 45 },
                    { name: '金融', count: 78, percent: 22 },
                    { name: '教育', count: 52, percent: 15 },
                    { name: '制造', count: 62, percent: 18 }
                  ].map(item => (
                    <div key={item.name} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span>{item.name}</span>
                        <span style={{ fontWeight: '500' }}>{item.count}人</span>
                      </div>
                      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${item.percent}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #4f46e5, #06b6d4)'
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>薪资区间分布</div>
                  {[
                    { range: '10K以下', count: 45, percent: 13 },
                    { range: '10K-20K', count: 180, percent: 52 },
                    { range: '20K-30K', count: 90, percent: 26 },
                    { range: '30K以上', count: 33, percent: 9 }
                  ].map(item => (
                    <div key={item.range} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span>{item.range}</span>
                        <span style={{ fontWeight: '500' }}>{item.count}人</span>
                      </div>
                      <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${item.percent}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #10b981, #06b6d4)'
                        }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            campusEvents.length === 0 ? (
              <div className="text-center text-muted" style={{ padding: '40px' }}>
                暂无校招活动，点击右上角创建第一个活动
              </div>
            ) : (
              <div className="grid grid-2">
                {campusEvents.map(event => (
                  <div key={event.id} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{event.title}</h3>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                          {event.university} · {event.event_type === 'career_fair' ? '招聘会' : '宣讲会'}
                        </div>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                      📅 {event.event_date || '待定'}
                    </div>
                    {event.description && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {event.description.slice(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === 'partners' && (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: '#6b7280' }}>
                共 {partners.length} 家合作企业
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {partners.map(partner => (
                  <div key={partner.id} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '16px', 
                    background: '#f9fafb', 
                    borderRadius: '10px'
                  }}>
                    <div style={{ 
                      width: '48px', 
                      height: '48px', 
                      background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', 
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: 'white',
                      marginRight: '16px'
                    }}>
                      🏢
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>{partner.name}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {partner.industry} · 提供 {partner.jobs} 个岗位
                      </div>
                    </div>
                    {getStatusBadge(partner.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍🎓</div>
              <h3 style={{ marginBottom: '8px' }}>学生就业管理</h3>
              <p>查看学生简历、就业状态、推荐岗位等功能</p>
            </div>
          )}
        </div>
      </div>

      {showEventForm && (
        <div style={{ 
          position: 'fixed', 
          top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600' }}>创建校招活动</h2>
              <button onClick={() => setShowEventForm(false)} style={{ background: 'none', fontSize: '24px' }}>×</button>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreateEvent}>
                <div className="form-group">
                  <label className="form-label">活动标题 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={eventForm.title}
                    onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">高校名称 *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={eventForm.university}
                    onChange={(e) => setEventForm(prev => ({ ...prev, university: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">活动类型</label>
                  <select 
                    className="form-input form-select"
                    value={eventForm.eventType}
                    onChange={(e) => setEventForm(prev => ({ ...prev, eventType: e.target.value }))}
                  >
                    <option value="career_fair">校园招聘会</option>
                    <option value="info_session">企业宣讲会</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">活动日期</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={eventForm.eventDate}
                    onChange={(e) => setEventForm(prev => ({ ...prev, eventDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">活动描述</label>
                  <textarea 
                    className="form-input form-textarea"
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <button type="submit" className="btn btn-primary w-full">
                  创建活动
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UniversityDashboard;
