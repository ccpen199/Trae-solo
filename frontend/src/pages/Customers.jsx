import React, { useState, useEffect } from 'react';
import { getCustomers, createCustomer, approveCustomer, getCustomer, rejectCustomer } from '../api.js';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [calculatedScore, setCalculatedScore] = useState(null);
  const [suggestedLimit, setSuggestedLimit] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    credit_code: '',
    legal_representative: '',
    registered_capital: '',
    established_date: '',
    industry: '',
    business_scope: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    annual_revenue: '',
    employee_count: '',
    guarantee_type: 'credit',
    guarantee_detail: '',
    historical_leases: '',
    historical_overdue: '0',
    historical_default: 'no'
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers();
      console.log('客户列表API返回:', res.data);
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('加载客户失败:', error);
      setCustomers([]);
    }
  };

  const calculateCreditScore = () => {
    let score = 600;
    const revenue = Number(formData.annual_revenue) || 0;
    const employees = Number(formData.employee_count) || 0;
    const capital = Number(formData.registered_capital) || 0;
    const overdue = Number(formData.historical_overdue) || 0;
    const hasDefault = formData.historical_default === 'yes';

    if (revenue >= 50000000) score += 80;
    else if (revenue >= 20000000) score += 60;
    else if (revenue >= 10000000) score += 40;
    else if (revenue >= 5000000) score += 20;

    if (employees >= 300) score += 40;
    else if (employees >= 100) score += 30;
    else if (employees >= 50) score += 20;

    if (capital >= 10000000) score += 30;
    else if (capital >= 5000000) score += 20;
    else if (capital >= 1000000) score += 10;

    if (formData.guarantee_type === 'mortgage') score += 30;
    else if (formData.guarantee_type === 'guarantee') score += 20;

    if (overdue === 0) score += 20;
    else if (overdue <= 2) score += 10;
    else score -= 30;

    if (hasDefault) score -= 50;

    score = Math.max(300, Math.min(850, score));
    setCalculatedScore(score);

    let limit = 0;
    if (score >= 750) limit = Math.min(revenue * 0.1, 2000000);
    else if (score >= 700) limit = Math.min(revenue * 0.08, 1000000);
    else if (score >= 650) limit = Math.min(revenue * 0.05, 500000);
    else if (score >= 600) limit = Math.min(revenue * 0.03, 200000);
    setSuggestedLimit(Math.round(limit));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        credit_score: calculatedScore,
        suggested_limit: suggestedLimit,
        credit_level: getCreditLevel(calculatedScore)
      };
      await createCustomer(data);
      setShowModal(false);
      loadCustomers();
      resetForm();
    } catch (error) {
      alert('创建客户失败: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      credit_code: '',
      legal_representative: '',
      registered_capital: '',
      established_date: '',
      industry: '',
      business_scope: '',
      address: '',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      annual_revenue: '',
      employee_count: '',
      guarantee_type: 'credit',
      guarantee_detail: '',
      historical_leases: '',
      historical_overdue: '0',
      historical_default: 'no'
    });
    setCalculatedScore(null);
    setSuggestedLimit(null);
  };

  const getCreditLevel = (score) => {
    if (!score) return null;
    if (score >= 750) return 'AA';
    if (score >= 700) return 'A';
    if (score >= 650) return 'B';
    return 'C';
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('请输入拒绝原因');
      return;
    }
    try {
      await rejectCustomer(detailData.id, { reason: rejectReason });
      setRejectModal(false);
      setRejectReason('');
      loadCustomers();
      setShowDetail(null);
    } catch (error) {
      alert('拒绝失败: ' + error.message);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await getCustomer(id);
      console.log('客户详情API返回:', res.data);
      setDetailData(res.data || {});
      setShowDetail(id);
    } catch (error) {
      console.error('加载客户详情失败:', error);
      setDetailData({});
    }
  };

  const handleApprove = async (id) => {
    const limit = prompt('请输入审批额度:');
    if (limit && !isNaN(limit)) {
      try {
        await approveCustomer(id, { approved_limit: parseFloat(limit) });
        loadCustomers();
        setShowDetail(null);
      } catch (error) {
        alert('审批失败: ' + error.message);
      }
    }
  };

  const getCreditLevelBadge = (level) => {
    const styles = {
      'AA': 'badge success',
      'A': 'badge info',
      'B': 'badge warning',
      'C': 'badge danger'
    };
    return styles[level] || 'badge secondary';
  };

  const getStatusBadge = (status) => {
    const map = {
      'pending': ['审核中', 'warning'],
      'approved': ['已通过', 'success'],
      'rejected': ['已拒绝', 'danger']
    };
    const [text, type] = map[status] || ['未知', 'secondary'];
    return <span className={`badge ${type}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>客户授信管理</h1>
          <p>企业资质审核与额度授信</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新增客户
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>企业名称</th>
              <th>行业</th>
              <th>联系人</th>
              <th>信用评分</th>
              <th>信用等级</th>
              <th>建议额度</th>
              <th>审批额度</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-4">暂无客户数据</td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.company_name || '-'}</td>
                  <td>{customer.industry || '-'}</td>
                  <td>{customer.contact_person || '-'}<br/><span className="text-muted">{customer.contact_phone || '-'}</span></td>
                  <td>{customer.credit_score || '-'}</td>
                  <td><span className={getCreditLevelBadge(customer.credit_level)}>{customer.credit_level || '-'}</span></td>
                  <td>¥{customer.suggested_limit != null ? Number(customer.suggested_limit).toLocaleString() : '-'}</td>
                  <td>¥{customer.approved_limit != null ? Number(customer.approved_limit).toLocaleString() : '-'}</td>
                  <td>{getStatusBadge(customer.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleViewDetail(customer.id)}>
                      详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新增客户授信</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>企业名称 *</label>
                  <input type="text" required value={formData.company_name}
                    onChange={e => setFormData({...formData, company_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>统一社会信用代码</label>
                  <input type="text" value={formData.credit_code}
                    onChange={e => setFormData({...formData, credit_code: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>法人代表</label>
                  <input type="text" value={formData.legal_representative}
                    onChange={e => setFormData({...formData, legal_representative: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>注册资本(元)</label>
                  <input type="number" value={formData.registered_capital}
                    onChange={e => setFormData({...formData, registered_capital: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>成立日期</label>
                  <input type="date" value={formData.established_date}
                    onChange={e => setFormData({...formData, established_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>所属行业</label>
                  <select value={formData.industry}
                    onChange={e => setFormData({...formData, industry: e.target.value})}>
                    <option value="">请选择</option>
                    <option value="信息技术">信息技术</option>
                    <option value="制造业">制造业</option>
                    <option value="批发零售">批发零售</option>
                    <option value="电子科技">电子科技</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>年营收(元)</label>
                  <input type="number" value={formData.annual_revenue}
                    onChange={e => setFormData({...formData, annual_revenue: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>员工人数</label>
                  <input type="number" value={formData.employee_count}
                    onChange={e => setFormData({...formData, employee_count: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>企业地址</label>
                <input type="text" value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>联系人 *</label>
                  <input type="text" required value={formData.contact_person}
                    onChange={e => setFormData({...formData, contact_person: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>联系电话 *</label>
                  <input type="tel" required value={formData.contact_phone}
                    onChange={e => setFormData({...formData, contact_phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>联系邮箱</label>
                <input type="email" value={formData.contact_email}
                  onChange={e => setFormData({...formData, contact_email: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>担保方式</label>
                  <select value={formData.guarantee_type}
                    onChange={e => setFormData({...formData, guarantee_type: e.target.value})}>
                    <option value="credit">信用</option>
                    <option value="mortgage">抵押</option>
                    <option value="guarantee">担保</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>担保详情</label>
                  <input type="text" value={formData.guarantee_detail}
                    onChange={e => setFormData({...formData, guarantee_detail: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交审核</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailData && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>客户详情 - {detailData.company_name}</h2>
              <button className="close-btn" onClick={() => setShowDetail(null)}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '16px' }}>
              <button className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveTab('basic')}>基本信息</button>
              <button className={`tab-btn ${activeTab === 'credit' ? 'active' : ''}`} onClick={() => setActiveTab('credit')}>授信评估</button>
              <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>历史记录</button>
              <button className={`tab-btn ${activeTab === 'approval' ? 'active' : ''}`} onClick={() => setActiveTab('approval')}>审批记录</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
              {activeTab === 'basic' && (
                <>
                  <div className="grid-2 mb-2">
                    <div>
                      <div className="text-muted">信用评分</div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{detailData.credit_score != null ? detailData.credit_score : '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted">信用等级</div>
                      <span className={getCreditLevelBadge(detailData.credit_level)} style={{ fontSize: '16px', padding: '6px 14px' }}>
                        {detailData.credit_level || '-'}
                      </span>
                    </div>
                    <div>
                      <div className="text-muted">建议额度</div>
                      <div style={{ fontSize: '18px' }}>¥{detailData.suggested_limit != null ? Number(detailData.suggested_limit).toLocaleString() : '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted">审批额度</div>
                      <div style={{ fontSize: '18px' }}>¥{detailData.approved_limit != null ? Number(detailData.approved_limit).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h4>企业信息</h4>
                    <div className="grid-2">
                      <div>法人代表: {detailData.legal_representative || '-'}</div>
                      <div>统一社会信用代码: {detailData.credit_code || '-'}</div>
                      <div>注册资本: {detailData.registered_capital != null ? Number(detailData.registered_capital).toLocaleString() : '-'} 元</div>
                      <div>成立日期: {detailData.established_date || '-'}</div>
                      <div>行业: {detailData.industry || '-'}</div>
                      <div>年营收: {detailData.annual_revenue != null ? Number(detailData.annual_revenue).toLocaleString() : '-'} 元</div>
                      <div>员工人数: {detailData.employee_count != null ? detailData.employee_count : '-'} 人</div>
                      <div>状态: {getStatusBadge(detailData.status)}</div>
                    </div>
                    <div style={{ marginTop: '8px' }}>经营范围: {detailData.business_scope || '-'}</div>
                  </div>
                  <div className="mb-2">
                    <h4>担保信息</h4>
                    <div className="grid-2">
                      <div>担保方式: {detailData.guarantee_type === 'credit' ? '信用' : detailData.guarantee_type === 'mortgage' ? '抵押' : detailData.guarantee_type === 'guarantee' ? '担保' : (detailData.guarantee_type || '-')}</div>
                    </div>
                    {detailData.guarantee_detail && <div style={{ marginTop: '8px' }}>担保详情: {detailData.guarantee_detail}</div>}
                  </div>
                  <div className="mb-2">
                    <h4>联系方式</h4>
                    <div className="grid-2">
                      <div>联系人: {detailData.contact_person || '-'}</div>
                      <div>电话: {detailData.contact_phone || '-'}</div>
                      <div>邮箱: {detailData.contact_email || '-'}</div>
                      <div>地址: {detailData.address || '-'}</div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'credit' && (
                <>
                  <div className="mb-2">
                    <h4>授信评估结果</h4>
                    <div className="grid-2">
                      <div>
                        <div className="text-muted">信用评分模型</div>
                        <div>基于企业资质、经营数据、历史租赁综合评估</div>
                      </div>
                      <div>
                        <div className="text-muted">评估日期</div>
                        <div>{detailData.created_at || '-'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h4>评分维度</h4>
                    <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>企业资质</span>
                        <span className="text-muted">占比 30%</span>
                      </div>
                      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>经营数据</span>
                        <span className="text-muted">占比 30%</span>
                      </div>
                      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>担保方式</span>
                        <span className="text-muted">占比 20%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>历史信用</span>
                        <span className="text-muted">占比 20%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h4>额度建议</h4>
                    <div className="text-muted" style={{ marginBottom: '8px' }}>基于信用评分和年营收计算的建议授信额度</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a5f' }}>
                      ¥{detailData.suggested_limit != null ? Number(detailData.suggested_limit).toLocaleString() : '-'}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'history' && (
                <>
                  <div className="mb-2">
                    <h4>历史租赁记录</h4>
                    {detailData.historical_leases ? (
                      <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '8px' }}>
                        {detailData.historical_leases}
                      </div>
                    ) : (
                      <div className="text-muted">暂无历史租赁记录</div>
                    )}
                  </div>
                  <div className="mb-2">
                    <h4>历史逾期记录</h4>
                    <div className="grid-2">
                      <div>逾期次数: {detailData.historical_overdue != null ? detailData.historical_overdue : '-'} 次</div>
                      <div>坏账记录: {detailData.historical_default === 'yes' ? '有' : '无'}</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <h4>当前合同</h4>
                    <div className="text-muted">暂无当前租赁合同</div>
                  </div>
                </>
              )}

              {activeTab === 'approval' && (
                <>
                  <div className="mb-2">
                    <h4>审批流转记录</h4>
                    <div style={{ position: 'relative', paddingLeft: '24px' }}>
                      <div style={{ position: 'absolute', left: '6px', top: '8px', bottom: '0', width: '2px', background: '#e5e7eb' }}></div>
                      
                      <div style={{ position: 'relative', marginBottom: '20px' }}>
                        <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{detailData.created_at || '-'}</div>
                        <div><strong>提交审核</strong></div>
                        <div className="text-muted">客户授信申请提交</div>
                      </div>

                      {detailData.status === 'approved' && (
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                          <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{detailData.approved_at || '-'}</div>
                          <div><strong>审批通过</strong> - {detailData.approved_by || '系统'}</div>
                          <div className="text-muted">审批额度: ¥{detailData.approved_limit != null ? Number(detailData.approved_limit).toLocaleString() : '-'}</div>
                        </div>
                      )}

                      {detailData.status === 'rejected' && (
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                          <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>{detailData.rejected_at || '-'}</div>
                          <div><strong>审批拒绝</strong> - {detailData.rejected_by || '系统'}</div>
                          <div className="text-muted">拒绝原因: {detailData.reject_reason || '-'}</div>
                        </div>
                      )}

                      {detailData.status === 'pending' && (
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }}></div>
                          <div className="text-muted" style={{ fontSize: '12px' }}>待处理</div>
                          <div><strong>等待审批</strong></div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {detailData.status === 'pending' && (
              <div className="form-actions" style={{ padding: '16px', borderTop: '1px solid #e5e7eb', marginBottom: 0 }}>
                <button className="btn btn-success" onClick={() => handleApprove(detailData.id)}>
                  通过审批
                </button>
                <button className="btn btn-danger" onClick={() => setRejectModal(true)}>
                  拒绝申请
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>拒绝授信申请</h2>
              <button className="close-btn" onClick={() => setRejectModal(false)}>&times;</button>
            </div>
            <div className="form-group">
              <label>拒绝原因 *</label>
              <textarea 
                required 
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="请输入拒绝原因"
                rows="4"
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setRejectModal(false)}>取消</button>
              <button type="button" className="btn btn-danger" onClick={handleReject} disabled={!rejectReason.trim()}>
                确认拒绝
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
