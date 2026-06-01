import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const AUDITORS = [
  '李运营',
  '王审核',
  '张运营',
  '陈主管',
  '刘经理'
];

const Audit = () => {
  const [pendingFactories, setPendingFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState({ action: 'verify', notes: '', auditor: '' });
  const [stats, setStats] = useState({
    totalFactories: 0,
    verifiedFactories: 0,
    pendingAudit: 0,
    expiringCerts: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetch('/api/factories?verified=false')
      .then(res => res.json())
      .then(data => setPendingFactories(data));
    
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  };

  const loadFactoryDetail = (factoryId) => {
    fetch(`/api/factories/${factoryId}`)
      .then(res => res.json())
      .then(data => {
        setSelectedFactory(data);
        setShowAuditModal(true);
      });
  };

  const handleAudit = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${selectedFactory.id}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowAuditModal(false);
        setSelectedFactory(null);
        setAuditForm({ action: 'verify', notes: '', auditor: '' });
        loadData();
      });
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>运营审核工作台</h2>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>仅可执行审核操作，工厂信息编辑请前往「工厂名录」页面</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>工厂总数</h3>
          <div className="number">{stats.totalFactories}</div>
        </div>
        <div className="stat-card">
          <h3>已认证</h3>
          <div className="number" style={{ color: '#10b981' }}>{stats.verifiedFactories}</div>
        </div>
        <div className="stat-card">
          <h3>待审核</h3>
          <div className="number" style={{ color: '#f59e0b' }}>{stats.pendingAudit}</div>
        </div>
        <div className="stat-card">
          <h3>即将过期资质</h3>
          <div className="number" style={{ color: '#ef4444' }}>{stats.expiringCerts}</div>
        </div>
      </div>

      <div className="card">
        <h2>待审核工厂列表</h2>
        <table className="table">
          <thead>
            <tr>
              <th>工厂名称</th>
              <th>地区</th>
              <th>品类</th>
              <th>规模</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {pendingFactories.map(factory => (
              <tr key={factory.id}>
                <td>{factory.name}</td>
                <td>{factory.region || '-'}</td>
                <td>{factory.category || '-'}</td>
                <td>{factory.scale || '-'}</td>
                <td>{factory.created_at?.slice(0, 10)}</td>
                <td>
                  <button 
                    className="link" 
                    onClick={() => loadFactoryDetail(factory.id)}
                    style={{ marginRight: '1rem' }}
                  >
                    审核
                  </button>
                  <Link to={`/factories/${factory.id}`} className="link">查看详情</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pendingFactories.length === 0 && (
          <div className="empty">暂无待审核工厂</div>
        )}
      </div>

      <div className="alert alert-warning">
        <strong>审核须知：</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li>确认工厂资质文件真实有效，且在有效期内</li>
          <li>核实工厂实拍照片，确保与实际情况一致</li>
          <li>查阅验厂结果和投诉记录，评估合作风险</li>
          <li>未通过审核的工厂将限制曝光和推荐</li>
        </ul>
      </div>

      {showAuditModal && selectedFactory && (
        <div className="modal-overlay" onClick={() => setShowAuditModal(false)}>
          <div className="modal" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>审核工厂：{selectedFactory.name}</h3>
              <button className="modal-close" onClick={() => setShowAuditModal(false)}>×</button>
            </div>

            <div className="detail-section">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>基本信息</h3>
              <div className="grid-2" style={{ marginBottom: '1rem' }}>
                <div className="detail-item">
                  <span className="label">地区：</span>
                  <span className="value">{selectedFactory.region || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">品类：</span>
                  <span className="value">{selectedFactory.category || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">规模：</span>
                  <span className="value">{selectedFactory.scale || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">联系人：</span>
                  <span className="value">{selectedFactory.contact_name || '-'}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
                资质认证 
                <span className="badge badge-info" style={{ marginLeft: '0.5rem' }}>
                  {selectedFactory.certifications?.length || 0} 项
                </span>
              </h3>
              {selectedFactory.certifications?.length > 0 ? (
                <table className="table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr>
                      <th>资质名称</th>
                      <th>发证日期</th>
                      <th>有效期至</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFactory.certifications.map(cert => (
                      <tr key={cert.id}>
                        <td>{cert.name}</td>
                        <td>{cert.issue_date || '-'}</td>
                        <td>{cert.expiry_date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#999', fontSize: '0.875rem' }}>暂无资质认证</p>
              )}
            </div>

            <div className="detail-section">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>产能信息</h3>
              {selectedFactory.capacity ? (
                <div className="grid-2">
                  <div className="detail-item">
                    <span className="label">月产能：</span>
                    <span className="value">{selectedFactory.capacity.monthly_capacity || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">MOQ：</span>
                    <span className="value">{selectedFactory.capacity.moq || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">交期：</span>
                    <span className="value">{selectedFactory.capacity.delivery_time || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">外协：</span>
                    <span className="value">{selectedFactory.capacity.outsourcing_capability || '-'}</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: '#999', fontSize: '0.875rem' }}>暂无产能信息</p>
              )}
            </div>

            <form onSubmit={handleAudit} style={{ marginTop: '1.5rem' }}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>审核结论 *</label>
                  <select 
                    value={auditForm.action} 
                    onChange={(e) => setAuditForm({ ...auditForm, action: e.target.value })}
                    required
                  >
                    <option value="">请选择审核结论</option>
                    <option value="verify">✅ 通过认证</option>
                    <option value="reject">❌ 审核退回</option>
                    <option value="supplement">📋 补充材料</option>
                    <option value="reinspect">🔍 重新验厂</option>
                    <option value="suspend">⏸️ 暂停审核</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>审核人 *</label>
                  <select 
                    value={auditForm.auditor} 
                    onChange={(e) => setAuditForm({ ...auditForm, auditor: e.target.value })}
                    required
                  >
                    <option value="">请选择审核人</option>
                    {AUDITORS.map(auditor => (
                      <option key={auditor} value={auditor}>{auditor}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>审核备注</label>
                  <textarea 
                    value={auditForm.notes} 
                    onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
                    placeholder="请说明审核依据或退回原因"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAuditModal(false)}>取消</button>
                <button 
                  type="submit" 
                  className={`btn ${
                    auditForm.action === 'verify' ? 'btn-success' : 
                    auditForm.action === 'reject' ? 'btn-danger' : 
                    'btn-primary'
                  }`}
                >
                  {auditForm.action === 'verify' ? '确认通过' : 
                   auditForm.action === 'reject' ? '确认退回' : 
                   auditForm.action === 'supplement' ? '发送补充通知' : 
                   auditForm.action === 'reinspect' ? '安排重新验厂' : 
                   auditForm.action === 'suspend' ? '确认暂停' : 
                   '提交审核'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Audit;
