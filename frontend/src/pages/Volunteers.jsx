import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { volunteerAPI } from '../api';

function Volunteers() {
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [filteredVolunteers, setFilteredVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState('');

  useEffect(() => {
    loadVolunteers();
  }, []);

  useEffect(() => {
    if (skillFilter) {
      const filtered = allVolunteers.filter(v =>
        v.skills && v.skills.includes(skillFilter)
      );
      setFilteredVolunteers(filtered);
    } else {
      setFilteredVolunteers(allVolunteers);
    }
  }, [skillFilter, allVolunteers]);

  const loadVolunteers = async () => {
    try {
      setLoading(true);
      const res = await volunteerAPI.getAll({ limit: 1000 });
      const data = res.data.data || [];
      setAllVolunteers(data);
      setFilteredVolunteers(data);
    } catch (err) {
      console.error('加载志愿者失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getSkillCount = (skill) => {
    return allVolunteers.filter(v =>
      v.skills && v.skills.includes(skill)
    ).length;
  };

  const skills = ['急救', '护理', '教育', '翻译', '驾驶', '心理咨询', '环保', '社区服务'];

  return (
    <div className="container">
      <div className="card">
        <div className="card-title">
          <span>志愿者名录</span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>共 {filteredVolunteers.length} 人</span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>按技能筛选:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              className={`btn ${!skillFilter ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSkillFilter('')}
            >
              全部 ({allVolunteers.length})
            </button>
            {skills.map(skill => (
              <button
                key={skill}
                className={`btn ${skillFilter === skill ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSkillFilter(skill)}
              >
                {skill} ({getSkillCount(skill)})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p>暂无志愿者</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {filteredVolunteers.map(volunteer => (
              <Link
                to={`/volunteers/${volunteer.id}`}
                key={volunteer.id}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      fontWeight: 600,
                      marginRight: '12px'
                    }}>
                      {volunteer.name?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>{volunteer.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {volunteer.phone || '未绑定手机'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {volunteer.total_hours?.toFixed(1) || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>服务时长(小时)</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success-color)' }}>
                        {volunteer.skills?.length || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>技能标签</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                    {volunteer.skills?.slice(0, 3).map(skill => (
                      <span key={skill} className="tag tag-primary">{skill}</span>
                    ))}
                    {volunteer.skills?.length > 3 && (
                      <span className="tag tag-primary">+{volunteer.skills.length - 3}</span>
                    )}
                  </div>
                  {volunteer.organization_history?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>历史组织归属:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {volunteer.organization_history.slice(0, 2).map((org, i) => (
                          <span key={i} className="tag tag-outline">
                            {typeof org === 'string' ? org : org.org_name || org.name || '未知组织'}
                          </span>
                        ))}
                        {volunteer.organization_history.length > 2 && (
                          <span className="tag tag-outline">+{volunteer.organization_history.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {volunteer.blockchain_hash && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      padding: '8px',
                      background: '#fafafa',
                      borderRadius: '4px',
                      borderLeft: '3px solid var(--primary-color)',
                      marginTop: '12px'
                    }}>
                      🔗 区块链哈希: {volunteer.blockchain_hash.slice(0, 16)}...
                      <span style={{ marginLeft: '8px', color: volunteer.synced_to_provincial ? '#52c41a' : '#faad14' }}>
                        {volunteer.synced_to_provincial ? '☁️ 已同步省级平台' : '⏳ 待同步'}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Volunteers;
