import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const AUDITORS = [
  '李运营',
  '王审核',
  '张运营',
  '陈主管',
  '刘经理'
];

const FactoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factory, setFactory] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showCooperationModal, setShowCooperationModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [certForm, setCertForm] = useState({ name: '', issue_date: '', expiry_date: '', file_url: '' });
  const [capacityForm, setCapacityForm] = useState({ monthly_capacity: '', moq: '', delivery_time: '', peak_season_restriction: '', outsourcing_capability: '' });
  const [sampleForm, setSampleForm] = useState({ product_name: '', process: '', material: '', price: '', sample_cycle: '', customer_feedback: '' });
  const [quoteForm, setQuoteForm] = useState({ product_name: '', process: '', material: '', price: '', quantity: '', delivery_time: '', customer_feedback: '' });
  const [cooperationForm, setCooperationForm] = useState({ customer_name: '', project_name: '', start_date: '', end_date: '', status: '', amount: '', notes: '' });
  const [auditForm, setAuditForm] = useState({ action: 'verify', notes: '', auditor: '' });

  useEffect(() => {
    loadFactory();
  }, [id]);

  const loadFactory = () => {
    fetch(`/api/factories/${id}`)
      .then(res => res.json())
      .then(data => {
        setFactory(data);
        setEditForm({
          name: data.name,
          region: data.region,
          category: data.category,
          scale: data.scale,
          equipment: data.equipment,
          contact_name: data.contact_name,
          contact_phone: data.contact_phone,
          main_customers: data.main_customers,
          cooperation_status: data.cooperation_status
        });
        if (data.capacity) {
          setCapacityForm(data.capacity);
        }
        setLoading(false);
      });
  };

  const handleSaveFactory = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowEditModal(false);
        loadFactory();
      });
  };

  const handleAddCert = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${id}/certifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(certForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowCertModal(false);
        setCertForm({ name: '', issue_date: '', expiry_date: '', file_url: '' });
        loadFactory();
      });
  };

  const handleSaveCapacity = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${id}/capacity`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capacityForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowCapacityModal(false);
        loadFactory();
      });
  };

  const handleAddSample = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${id}/samples`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowSampleModal(false);
        setSampleForm({ product_name: '', process: '', material: '', price: '', sample_cycle: '', customer_feedback: '' });
        loadFactory();
      });
  };

  const handleAddQuote = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${id}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quoteForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowQuoteModal(false);
        setQuoteForm({ product_name: '', process: '', material: '', price: '', quantity: '', delivery_time: '', customer_feedback: '' });
        loadFactory();
      });
  };

  const handleAddCooperation = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${id}/cooperation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cooperationForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowCooperationModal(false);
        setCooperationForm({ customer_name: '', project_name: '', start_date: '', end_date: '', status: '', amount: '', notes: '' });
        loadFactory();
      });
  };

  const handleAudit = (e) => {
    e.preventDefault();
    fetch(`/api/factories/${id}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(auditForm)
    })
      .then(res => res.json())
      .then(() => {
        setShowAuditModal(false);
        setAuditForm({ action: 'verify', notes: '', auditor: '' });
        loadFactory();
      });
  };

  if (loading) return <div>加载中...</div>;
  if (!factory) return <div>工厂不存在</div>;

  const isExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = (expiry - now) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Link to="/factories" className="link">← 返回列表</Link>
          <h2 style={{ marginTop: '0.5rem' }}>{factory.name}</h2>
          <span className={`badge ${factory.is_verified ? 'badge-success' : 'badge-warning'}`}>
            {factory.is_verified ? '已认证' : '待审核'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>编辑信息</button>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</button>
          <button className={`tab ${activeTab === 'cert' ? 'active' : ''}`} onClick={() => setActiveTab('cert')}>资质认证</button>
          <button className={`tab ${activeTab === 'capacity' ? 'active' : ''}`} onClick={() => setActiveTab('capacity')}>产能信息</button>
          <button className={`tab ${activeTab === 'sample' ? 'active' : ''}`} onClick={() => setActiveTab('sample')}>样品报价</button>
          <button className={`tab ${activeTab === 'cooperation' ? 'active' : ''}`} onClick={() => setActiveTab('cooperation')}>合作记录</button>
          <button className={`tab ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>审核日志</button>
        </div>

        {activeTab === 'basic' && (
          <div className="detail-section">
            <div className="grid-2">
              <div className="detail-item">
                <span className="label">地区：</span>
                <span className="value">{factory.region || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">品类：</span>
                <span className="value">{factory.category || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">规模：</span>
                <span className="value">{factory.scale || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">合作状态：</span>
                <span className="value">{factory.cooperation_status || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">联系人：</span>
                <span className="value">{factory.contact_name || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="label">联系电话：</span>
                <span className="value">{factory.contact_phone || '-'}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">主要设备：</span>
                <span className="value">{factory.equipment || '-'}</span>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <span className="label">主营客户：</span>
                <span className="value">{factory.main_customers || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cert' && (
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: 0 }}>资质认证</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setShowCertModal(true)}>+ 添加资质</button>
            </div>
            {factory.certifications?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>资质名称</th>
                    <th>发证日期</th>
                    <th>有效期至</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {factory.certifications.map(cert => (
                    <tr key={cert.id}>
                      <td>{cert.name}</td>
                      <td>{cert.issue_date || '-'}</td>
                      <td>{cert.expiry_date || '-'}</td>
                      <td>
                        {isExpiring(cert.expiry_date) ? (
                          <span className="badge badge-warning">即将过期</span>
                        ) : (
                          <span className="badge badge-success">有效</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">暂无资质记录</div>
            )}
          </div>
        )}

        {activeTab === 'capacity' && (
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: 0 }}>产能信息</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setShowCapacityModal(true)}>编辑产能</button>
            </div>
            {factory.capacity ? (
              <div className="grid-2">
                <div className="detail-item">
                  <span className="label">月产能：</span>
                  <span className="value">{factory.capacity.monthly_capacity || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">最小起订量：</span>
                  <span className="value">{factory.capacity.moq || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">交期：</span>
                  <span className="value">{factory.capacity.delivery_time || '-'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">外协能力：</span>
                  <span className="value">{factory.capacity.outsourcing_capability || '-'}</span>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="label">旺季限制：</span>
                  <span className="value">{factory.capacity.peak_season_restriction || '-'}</span>
                </div>
              </div>
            ) : (
              <div className="empty">暂无产能信息</div>
            )}
          </div>
        )}

        {activeTab === 'sample' && (
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: 0 }}>样品管理</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setShowSampleModal(true)}>+ 添加样品</button>
            </div>
            {factory.samples?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>产品名称</th>
                    <th>工艺</th>
                    <th>材料</th>
                    <th>价格</th>
                    <th>打样周期</th>
                    <th>客户反馈</th>
                  </tr>
                </thead>
                <tbody>
                  {factory.samples.map(sample => (
                    <tr key={sample.id}>
                      <td>{sample.product_name}</td>
                      <td>{sample.process || '-'}</td>
                      <td>{sample.material || '-'}</td>
                      <td>¥{sample.price || '-'}</td>
                      <td>{sample.sample_cycle || '-'}</td>
                      <td>{sample.customer_feedback || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">暂无样品记录</div>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ marginBottom: 0 }}>报价记录</h3>
                <button className="btn btn-sm btn-primary" onClick={() => setShowQuoteModal(true)}>+ 添加报价</button>
              </div>
              {factory.quotations?.length > 0 ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>产品名称</th>
                      <th>版本</th>
                      <th>工艺</th>
                      <th>材料</th>
                      <th>价格</th>
                      <th>数量</th>
                      <th>交期</th>
                      <th>报价时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factory.quotations.map(quote => (
                      <tr key={quote.id}>
                        <td>{quote.product_name}</td>
                        <td><span className="badge badge-info">v{quote.version}</span></td>
                        <td>{quote.process || '-'}</td>
                        <td>{quote.material || '-'}</td>
                        <td>¥{quote.price || '-'}</td>
                        <td>{quote.quantity || '-'}</td>
                        <td>{quote.delivery_time || '-'}</td>
                        <td>{quote.created_at?.slice(0, 10)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">暂无报价记录</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cooperation' && (
          <div className="detail-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: 0 }}>合作记录</h3>
              <button className="btn btn-sm btn-primary" onClick={() => setShowCooperationModal(true)}>+ 添加记录</button>
            </div>
            {factory.cooperation?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>客户名称</th>
                    <th>项目名称</th>
                    <th>开始日期</th>
                    <th>结束日期</th>
                    <th>状态</th>
                    <th>金额</th>
                  </tr>
                </thead>
                <tbody>
                  {factory.cooperation.map(record => (
                    <tr key={record.id}>
                      <td>{record.customer_name}</td>
                      <td>{record.project_name || '-'}</td>
                      <td>{record.start_date || '-'}</td>
                      <td>{record.end_date || '-'}</td>
                      <td>
                        <span className={`badge ${record.status === '进行中' ? 'badge-success' : 'badge-gray'}`}>
                          {record.status || '-'}
                        </span>
                      </td>
                      <td>¥{record.amount?.toLocaleString() || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty">暂无合作记录</div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="detail-section">
            <h3>审核日志</h3>
            {factory.auditLogs?.length > 0 ? (
              <div className="timeline">
                {factory.auditLogs.map(log => (
                  <div key={log.id} className="timeline-item">
                    <div className="date">{log.created_at?.slice(0, 19)}</div>
                    <div className="action">
                      {log.action === 'verify' ? '✅ 通过认证' : 
                       log.action === 'reject' ? '❌ 审核退回' : 
                       log.action === 'supplement' ? '📋 补充材料' : 
                       log.action === 'reinspect' ? '🔍 重新验厂' : 
                       log.action === 'suspend' ? '⏸️ 暂停审核' : 
                       log.action}
                    </div>
                    <div className="notes">
                      {log.auditor && `操作人：${log.auditor}`}
                      {log.notes && ` | 备注：${log.notes}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty">暂无审核记录</div>
            )}
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑工厂信息</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveFactory}>
              <div className="form-grid">
                <div className="form-group">
                  <label>工厂名称</label>
                  <input type="text" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>地区</label>
                  <input type="text" value={editForm.region || ''} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>品类</label>
                  <input type="text" value={editForm.category || ''} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>规模</label>
                  <select value={editForm.scale || ''} onChange={(e) => setEditForm({ ...editForm, scale: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="小型">小型</option>
                    <option value="中型">中型</option>
                    <option value="大型">大型</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>联系人</label>
                  <input type="text" value={editForm.contact_name || ''} onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>联系电话</label>
                  <input type="text" value={editForm.contact_phone || ''} onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>合作状态</label>
                  <select value={editForm.cooperation_status || ''} onChange={(e) => setEditForm({ ...editForm, cooperation_status: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="意向">意向</option>
                    <option value="洽谈中">洽谈中</option>
                    <option value="已合作">已合作</option>
                    <option value="暂停">暂停</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>主要设备</label>
                  <textarea value={editForm.equipment || ''} onChange={(e) => setEditForm({ ...editForm, equipment: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>主营客户</label>
                  <textarea value={editForm.main_customers || ''} onChange={(e) => setEditForm({ ...editForm, main_customers: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCertModal && (
        <div className="modal-overlay" onClick={() => setShowCertModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加资质认证</h3>
              <button className="modal-close" onClick={() => setShowCertModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddCert}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>资质名称</label>
                  <input type="text" required value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>发证日期</label>
                  <input type="date" value={certForm.issue_date} onChange={(e) => setCertForm({ ...certForm, issue_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>有效期至</label>
                  <input type="date" value={certForm.expiry_date} onChange={(e) => setCertForm({ ...certForm, expiry_date: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>文件链接</label>
                  <input type="text" value={certForm.file_url} onChange={(e) => setCertForm({ ...certForm, file_url: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCertModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCapacityModal && (
        <div className="modal-overlay" onClick={() => setShowCapacityModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑产能信息</h3>
              <button className="modal-close" onClick={() => setShowCapacityModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveCapacity}>
              <div className="form-grid">
                <div className="form-group">
                  <label>月产能</label>
                  <input type="text" value={capacityForm.monthly_capacity || ''} onChange={(e) => setCapacityForm({ ...capacityForm, monthly_capacity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>最小起订量</label>
                  <input type="text" value={capacityForm.moq || ''} onChange={(e) => setCapacityForm({ ...capacityForm, moq: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>交期</label>
                  <input type="text" value={capacityForm.delivery_time || ''} onChange={(e) => setCapacityForm({ ...capacityForm, delivery_time: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>外协能力</label>
                  <input type="text" value={capacityForm.outsourcing_capability || ''} onChange={(e) => setCapacityForm({ ...capacityForm, outsourcing_capability: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>旺季限制</label>
                  <textarea value={capacityForm.peak_season_restriction || ''} onChange={(e) => setCapacityForm({ ...capacityForm, peak_season_restriction: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCapacityModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSampleModal && (
        <div className="modal-overlay" onClick={() => setShowSampleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加样品</h3>
              <button className="modal-close" onClick={() => setShowSampleModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddSample}>
              <div className="form-grid">
                <div className="form-group">
                  <label>产品名称</label>
                  <input type="text" required value={sampleForm.product_name} onChange={(e) => setSampleForm({ ...sampleForm, product_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>工艺</label>
                  <input type="text" value={sampleForm.process} onChange={(e) => setSampleForm({ ...sampleForm, process: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>材料</label>
                  <input type="text" value={sampleForm.material} onChange={(e) => setSampleForm({ ...sampleForm, material: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>价格</label>
                  <input type="number" step="0.01" value={sampleForm.price} onChange={(e) => setSampleForm({ ...sampleForm, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>打样周期</label>
                  <input type="text" value={sampleForm.sample_cycle} onChange={(e) => setSampleForm({ ...sampleForm, sample_cycle: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>客户反馈</label>
                  <textarea value={sampleForm.customer_feedback} onChange={(e) => setSampleForm({ ...sampleForm, customer_feedback: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowSampleModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuoteModal && (
        <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加报价</h3>
              <button className="modal-close" onClick={() => setShowQuoteModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddQuote}>
              <div className="form-grid">
                <div className="form-group">
                  <label>产品名称</label>
                  <input type="text" required value={quoteForm.product_name} onChange={(e) => setQuoteForm({ ...quoteForm, product_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>工艺</label>
                  <input type="text" value={quoteForm.process} onChange={(e) => setQuoteForm({ ...quoteForm, process: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>材料</label>
                  <input type="text" value={quoteForm.material} onChange={(e) => setQuoteForm({ ...quoteForm, material: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>价格</label>
                  <input type="number" step="0.01" value={quoteForm.price} onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>数量</label>
                  <input type="number" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>交期</label>
                  <input type="text" value={quoteForm.delivery_time} onChange={(e) => setQuoteForm({ ...quoteForm, delivery_time: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>客户反馈</label>
                  <textarea value={quoteForm.customer_feedback} onChange={(e) => setQuoteForm({ ...quoteForm, customer_feedback: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowQuoteModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCooperationModal && (
        <div className="modal-overlay" onClick={() => setShowCooperationModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加合作记录</h3>
              <button className="modal-close" onClick={() => setShowCooperationModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddCooperation}>
              <div className="form-grid">
                <div className="form-group">
                  <label>客户名称</label>
                  <input type="text" required value={cooperationForm.customer_name} onChange={(e) => setCooperationForm({ ...cooperationForm, customer_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>项目名称</label>
                  <input type="text" value={cooperationForm.project_name} onChange={(e) => setCooperationForm({ ...cooperationForm, project_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>开始日期</label>
                  <input type="date" value={cooperationForm.start_date} onChange={(e) => setCooperationForm({ ...cooperationForm, start_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>结束日期</label>
                  <input type="date" value={cooperationForm.end_date} onChange={(e) => setCooperationForm({ ...cooperationForm, end_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select value={cooperationForm.status} onChange={(e) => setCooperationForm({ ...cooperationForm, status: e.target.value })}>
                    <option value="">请选择</option>
                    <option value="进行中">进行中</option>
                    <option value="已完成">已完成</option>
                    <option value="暂停">暂停</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>金额</label>
                  <input type="number" step="0.01" value={cooperationForm.amount} onChange={(e) => setCooperationForm({ ...cooperationForm, amount: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>备注</label>
                  <textarea value={cooperationForm.notes} onChange={(e) => setCooperationForm({ ...cooperationForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCooperationModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAuditModal && (
        <div className="modal-overlay" onClick={() => setShowAuditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>审核操作</h3>
              <button className="modal-close" onClick={() => setShowAuditModal(false)}>×</button>
            </div>
            <form onSubmit={handleAudit}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>操作类型</label>
                  <select value={auditForm.action} onChange={(e) => setAuditForm({ ...auditForm, action: e.target.value })}>
                    <option value="verify">✅ 通过认证</option>
                    <option value="reject">❌ 审核退回</option>
                    <option value="supplement">📋 补充材料</option>
                    <option value="reinspect">🔍 重新验厂</option>
                    <option value="suspend">⏸️ 暂停审核</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>审核人</label>
                  <select value={auditForm.auditor} onChange={(e) => setAuditForm({ ...auditForm, auditor: e.target.value })}>
                    <option value="">请选择审核人</option>
                    {AUDITORS.map(auditor => (
                      <option key={auditor} value={auditor}>{auditor}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>备注</label>
                  <textarea value={auditForm.notes} onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAuditModal(false)}>取消</button>
                <button type="submit" className={`btn ${auditForm.action === 'verify' ? 'btn-success' : 'btn-danger'}`}>确认</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryDetail;
