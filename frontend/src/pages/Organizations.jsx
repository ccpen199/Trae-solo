import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orgAPI } from '../api';

function Organizations({ user }) {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [radarData, setRadarData] = useState(null);
  const [newOrg, setNewOrg] = useState({
    name: '',
    registration_number: '',
    contact_person: '',
    contact_phone: '',
    address: ''
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const res = await orgAPI.getAll({ limit: 50 });
      setOrganizations(res.data.data);
    } catch (err) {
      console.error('加载组织失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await orgAPI.create(newOrg);
      setShowCreate(false);
      setNewOrg({ name: '', registration_number: '', contact_person: '', contact_phone: '', address: '' });
      loadOrganizations();
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewRadar = async (orgId) => {
    try {
      const res = await orgAPI.getRadar(orgId);
      setRadarData(res.data.data);
      const org = organizations.find(o => o.id === orgId);
      setSelectedOrg(org);
    } catch (err) {
      console.error('加载雷达图失败', err);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#1890ff';
    if (score >= 50) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="container">
      {user?.role !== 'admin' && (
        <div className="card" style={{ marginBottom: '20px', background: '#e6f7ff', border: '1px solid #91d5ff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>💡 管理功能提示</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                登录管理员账号可查看：跨区域活动资源调度看板、志愿者活跃度衰减预警、组织服务能力多维度评估
              </div>
            </div>
            <Link to="/login" className="btn btn-primary">登录管理员</Link>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-title">
          <span>志愿组织</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {user?.role === 'admin' && (
              <Link to="/admin" className="btn btn-outline">
                📊 管理后台
              </Link>
            )}
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + 注册组织
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
        ) : organizations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <p>暂无组织</p>
          </div>
        ) : (
          organizations.map(org => (
            <div key={org.id} className="card" style={{ marginBottom: '16px' }}>
              <div className="grid grid-3">
                <div>
                  <h3 style={{ marginBottom: '8px' }}>{org.name}</h3>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    📋 民政备案号: {org.registration_number || '未备案'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    👤 联系人: {org.contact_person || '-'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    📍 {org.address || '-'}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: getScoreColor(org.credit_score),
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: 700, margin: '0 auto'
                  }}>
                    {org.credit_score}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>信用评分</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary-color)' }}>
                    {org.activity_count || 0}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>已发布活动</div>
                  <button 
                    className="btn btn-outline" 
                    style={{ marginTop: '12px' }}
                    onClick={() => handleViewRadar(org.id)}
                  >
                    查看能力雷达图
                  </button>
                </div>
              </div>
              {org.ocr_result && (
                <div style={{ marginTop: '12px', padding: '12px', background: '#e6f7ff', borderRadius: '4px', fontSize: '13px' }}>
                  <strong>OCR识别结果：</strong>
                  <span>{typeof org.ocr_result === 'string' ? org.ocr_result : JSON.stringify(org.ocr_result)}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {radarData && selectedOrg && (
        <div className="modal-overlay" onClick={() => { setRadarData(null); setSelectedOrg(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span>{selectedOrg.name} - 服务能力雷达图</span>
              <button className="modal-close" onClick={() => { setRadarData(null); setSelectedOrg(null); }}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {radarData.labels.map((label, i) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 600 }}>{radarData.datasets[0].data[i]}/100</span>
                    </div>
                    <div className="progress">
                      <div className="progress-bar" style={{ width: `${radarData.datasets[0].data[i]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', padding: '12px', background: '#fafafa', borderRadius: '4px' }}>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>综合评估</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  综合得分: <strong style={{ color: 'var(--primary-color)' }}>
                    {Math.round(radarData.datasets[0].data.reduce((a, b) => a + b, 0) / radarData.datasets[0].data.length)}
                  </strong> / 100
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span>注册志愿组织</span>
              <button className="modal-close" onClick={() => setShowCreate(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">组织名称 *</label>
                <input type="text" className="form-input" value={newOrg.name}
                  onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">民政备案号</label>
                <input type="text" className="form-input" value={newOrg.registration_number}
                  onChange={e => setNewOrg({ ...newOrg, registration_number: e.target.value })}
                  placeholder="例如: MZ-2024-001" />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">联系人</label>
                  <input type="text" className="form-input" value={newOrg.contact_person}
                    onChange={e => setNewOrg({ ...newOrg, contact_person: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">联系电话</label>
                  <input type="tel" className="form-input" value={newOrg.contact_phone}
                    onChange={e => setNewOrg({ ...newOrg, contact_phone: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">地址</label>
                <input type="text" className="form-input" value={newOrg.address}
                  onChange={e => setNewOrg({ ...newOrg, address: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn btn-primary">注册</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Organizations;
