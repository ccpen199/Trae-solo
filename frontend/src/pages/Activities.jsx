import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { activityAPI, orgAPI } from '../api';

function Activities({ user }) {
  const [activities, setActivities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({
    status: 'published',
    org_id: ''
  });
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    org_id: '',
    location_name: '',
    latitude: 39.9042,
    longitude: 116.4074,
    geofence_radius: 500,
    risk_level: 'low',
    insurance_covered: false,
    start_time: '',
    end_time: '',
    required_hours: 2,
    required_skills: [],
    max_volunteers: 50
  });

  useEffect(() => {
    loadActivities();
  }, [filters]);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await activityAPI.getAll(filters);
      setActivities(res.data.data);
    } catch (err) {
      console.error('加载活动失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const res = await orgAPI.getAll({ limit: 100 });
      setOrganizations(res.data.data);
    } catch (err) {
      console.error('加载组织失败', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      return;
    }
    try {
      const activityData = {
        ...newActivity,
        org_id: newActivity.org_id ? parseInt(newActivity.org_id) : null,
        geofence_radius: parseInt(newActivity.geofence_radius) || 0,
        required_hours: parseFloat(newActivity.required_hours) || 0,
        max_volunteers: parseInt(newActivity.max_volunteers) || 0,
        latitude: parseFloat(newActivity.latitude) || 0,
        longitude: parseFloat(newActivity.longitude) || 0
      };
      await activityAPI.create(activityData);
      setShowCreate(false);
      loadActivities();
      setNewActivity({
        title: '',
        description: '',
        org_id: '',
        location_name: '',
        latitude: 39.9042,
        longitude: 116.4074,
        geofence_radius: 500,
        risk_level: 'low',
        insurance_covered: false,
        start_time: '',
        end_time: '',
        required_hours: 2,
        required_skills: [],
        max_volunteers: 50
      });
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.message || err.message));
    }
  };

  const skills = ['急救', '护理', '教育', '翻译', '驾驶', '心理咨询', '环保', '社区服务', '文体活动', '法律援助'];

  const getRiskLevelText = (level) => {
    const map = { low: '低', medium: '中', high: '高' };
    return map[level] || level;
  };

  const getInsuranceText = (covered) => {
    return covered ? '✅ 已投保' : '❌ 未投保';
  };

  const getInsuranceTagClass = (covered) => {
    return covered ? 'tag-success' : 'tag-error';
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-title">
          <span>志愿服务活动</span>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + 发布活动
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <select 
            className="form-select" 
            style={{ width: '150px' }}
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="published">已发布</option>
            <option value="completed">已完成</option>
          </select>
          <select 
            className="form-select" 
            style={{ width: '200px' }}
            value={filters.org_id}
            onChange={e => setFilters({ ...filters, org_id: e.target.value })}
          >
            <option value="">全部组织</option>
            {organizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>暂无活动</p>
          </div>
        ) : (
          activities.map(activity => (
            <Link 
              to={`/activities/${activity.id}`} 
              key={activity.id}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="activity-card">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-meta">
                  <span>📍 {activity.location_name}</span>
                  <span>📅 {new Date(activity.start_time).toLocaleString()}</span>
                  <span>⏱️ 约{activity.required_hours}小时</span>
                  <span>🏢 {activity.org_name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`tag ${getInsuranceTagClass(activity.insurance_covered)}`}>
                    {getInsuranceText(activity.insurance_covered)}
                  </span>
                  <span className={`tag tag-${activity.risk_level === 'high' ? 'error' : activity.risk_level === 'medium' ? 'warning' : 'primary'}`}>
                    风险等级: {getRiskLevelText(activity.risk_level)}
                  </span>
                  {activity.geofence_radius && (
                    <span className="tag tag-info">
                      围栏: {activity.geofence_radius}米
                    </span>
                  )}
                  {activity.required_skills?.map(skill => (
                    <span key={skill} className="tag tag-primary">{skill}</span>
                  ))}
                </div>
                {activity.matchScore && (
                  <div className="match-score">
                    <div className="match-score-item">
                      <div className="match-score-value">{activity.matchScore.total}</div>
                      <div className="match-score-label">综合匹配</div>
                    </div>
                    <div className="match-score-item">
                      <div className="match-score-value">{activity.matchScore.distance}m</div>
                      <div className="match-score-label">距离</div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>发布志愿服务活动</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">活动标题 *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newActivity.title}
                  onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">活动描述</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={newActivity.description}
                  onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">主办组织 *</label>
                  <select
                    className="form-select"
                    value={newActivity.org_id}
                    onChange={e => setNewActivity({ ...newActivity, org_id: e.target.value })}
                    required
                  >
                    <option value="">请选择</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">地点名称 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newActivity.location_name}
                    onChange={e => setNewActivity({ ...newActivity, location_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">开始时间 *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={newActivity.start_time}
                    onChange={e => setNewActivity({ ...newActivity, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">结束时间 *</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={newActivity.end_time}
                    onChange={e => setNewActivity({ ...newActivity, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">地理围栏半径(米)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newActivity.geofence_radius}
                    onChange={e => setNewActivity({ ...newActivity, geofence_radius: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">风险等级</label>
                  <select
                    className="form-select"
                    value={newActivity.risk_level}
                    onChange={e => setNewActivity({ ...newActivity, risk_level: e.target.value })}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">最大人数</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newActivity.max_volunteers}
                    onChange={e => setNewActivity({ ...newActivity, max_volunteers: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">所需时长(小时)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newActivity.required_hours}
                    onChange={e => setNewActivity({ ...newActivity, required_hours: parseFloat(e.target.value) })}
                    step="0.5"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">所需技能</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.map(skill => (
                    <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newActivity.required_skills.includes(skill)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewActivity({ ...newActivity, required_skills: [...newActivity.required_skills, skill] });
                          } else {
                            setNewActivity({ ...newActivity, required_skills: newActivity.required_skills.filter(s => s !== skill) });
                          }
                        }}
                      />
                      <span style={{ fontSize: '14px' }}>{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newActivity.insurance_covered}
                    onChange={e => setNewActivity({ ...newActivity, insurance_covered: e.target.checked })}
                  />
                  <span>已为志愿者投保</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn btn-primary">发布</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Activities;
