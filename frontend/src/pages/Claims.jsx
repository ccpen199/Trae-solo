import React, { useState, useEffect, useCallback } from 'react';
import { claimsAPI, policiesAPI, commonAPI } from '../api';

function Claims() {
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimDetail, setClaimDetail] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPolicyNo, setFilterPolicyNo] = useState('');
  const [approveProviderId, setApproveProviderId] = useState('');
  const [formData, setFormData] = useState({ policy_id: '', fault_type: '', fault_description: '' });
  const [rejectData, setRejectData] = useState({ reject_reason: '', reject_clause: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPolicyNo) params.policy_no = filterPolicyNo;
      const [claimsRes, policiesRes, providersRes] = await Promise.all([
        claimsAPI.getAll(params),
        policiesAPI.getAll({ status: 'active' }),
        commonAPI.getProviders()
      ]);
      const raw = claimsRes;
      const list = raw && raw.data ? raw.data : (Array.isArray(raw) ? raw : []);
      setClaims(Array.isArray(list) ? list : []);
      const pols = policiesRes && policiesRes.data ? policiesRes.data : (Array.isArray(policiesRes) ? policiesRes : []);
      setPolicies(Array.isArray(pols) ? pols : []);
      const provs = providersRes && providersRes.data ? providersRes.data : (Array.isArray(providersRes) ? providersRes : []);
      setProviders(Array.isArray(provs) ? provs : []);
    } catch (e) {
      console.error('加载数据失败', e);
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPolicyNo]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await claimsAPI.create(formData);
      setShowCreateModal(false);
      setFormData({ policy_id: '', fault_type: '', fault_description: '' });
      setSaveMsg('理赔申请提交成功！');
      loadData();
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (error) {
      alert('保存失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const openApprove = (claim) => {
    setSelectedClaim(claim);
    setApproveProviderId('');
    setShowApproveModal(true);
  };

  const submitApprove = async () => {
    try {
      await claimsAPI.approve(selectedClaim.id, approveProviderId || null);
      setShowApproveModal(false);
      setSaveMsg('理赔已通过，已生成工单！');
      loadData();
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const openReject = (claim) => {
    setSelectedClaim(claim);
    setRejectData({ reject_reason: '', reject_clause: '' });
    setShowRejectModal(true);
  };

  const submitReject = async () => {
    if (!rejectData.reject_reason || !rejectData.reject_clause) {
      alert('请填写拒赔原因和条款依据');
      return;
    }
    try {
      await claimsAPI.reject(selectedClaim.id, rejectData);
      setShowRejectModal(false);
      setSaveMsg('拒赔处理完成！');
      loadData();
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (error) {
      alert('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await claimsAPI.get(id);
      const detail = res && res.data ? res.data : res;
      setClaimDetail(detail);
      setShowDetailModal(true);
    } catch (error) {
      alert('获取详情失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const getStatusTag = (status) => {
    const map = {
      pending: <span className="tag tag-warning">待审核</span>,
      approved: <span className="tag tag-success">已通过</span>,
      rejected: <span className="tag tag-danger">已拒赔</span>
    };
    return map[status] || <span className="tag tag-default">{status}</span>;
  };

  const resetCreateForm = () => {
    setFormData({ policy_id: '', fault_type: '', fault_description: '' });
  };

  return (
    <div>
      {saveMsg && (
        <div style={{background:'#f6ffed',border:'1px solid #b7eb8f',padding:'12px 20px',borderRadius:'6px',marginBottom:'16px',color:'#389e0d',fontWeight:600}}>
          ✓ {saveMsg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>理赔申请管理</h2>
          <button className="btn btn-primary" onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>+ 申请理赔</button>
        </div>

        <div className="search-bar">
          <input type="text" placeholder="保单号" value={filterPolicyNo} onChange={(e) => setFilterPolicyNo(e.target.value)} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒赔</option>
          </select>
          <button className="btn btn-default" onClick={loadData}>搜索</button>
        </div>

        {loading ? <div style={{padding:'40px',textAlign:'center',color:'#999'}}>加载中...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>理赔号</th><th>保单号</th><th>用户</th><th>故障类型</th>
              <th>故障描述</th><th>产品</th><th>服务商</th><th>状态</th><th>申请时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {claims.length === 0 && (
              <tr><td colSpan="10" style={{textAlign:'center',color:'#999',padding:'40px'}}>暂无数据</td></tr>
            )}
            {claims.map(c => (
              <tr key={c.id}>
                <td><strong>{c.claim_no}</strong></td>
                <td>{c.policy_no}</td>
                <td><div>{c.user_name}</div><div style={{fontSize:'12px',color:'#999'}}>{c.phone}</div></td>
                <td>{c.fault_type}</td>
                <td style={{maxWidth:'150px',fontSize:'12px'}}>{c.fault_description || '-'}</td>
                <td>{c.product_name}</td>
                <td>{c.provider_name || '-'}</td>
                <td>{getStatusTag(c.status)}</td>
                <td>{c.created_at?.split('T')[0] || c.created_at?.split(' ')[0]}</td>
                <td>
                  <button className="btn btn-default btn-sm" onClick={() => handleViewDetail(c.id)}>详情</button>
                  {c.status === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => openApprove(c)} style={{marginLeft:'4px'}}>通过</button>
                      <button className="btn btn-danger btn-sm" onClick={() => openReject(c)} style={{marginLeft:'4px'}}>拒赔</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>申请理赔</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>选择保单 *</label>
                  <select value={formData.policy_id} onChange={(e) => setFormData({...formData, policy_id: e.target.value})} required>
                    <option value="">请选择有效保单</option>
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>{p.policy_no} - {p.device_serial} - {p.user_name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>故障类型 *</label>
                  <select value={formData.fault_type} onChange={(e) => setFormData({...formData, fault_type: e.target.value})} required>
                    <option value="">请选择</option>
                    <option value="无法开机">无法开机</option>
                    <option value="运行异常">运行异常</option>
                    <option value="异响/异味">异响/异味</option>
                    <option value="显示故障">显示故障</option>
                    <option value="按键失灵">按键失灵</option>
                    <option value="漏液/漏气">漏液/漏气</option>
                    <option value="其他故障">其他故障</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>故障描述</label>
                  <textarea value={formData.fault_description} onChange={(e) => setFormData({...formData, fault_description: e.target.value})} placeholder="请详细描述故障现象..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowCreateModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">提交申请</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showApproveModal && selectedClaim && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>审核通过 - {selectedClaim.claim_no}</h3>
              <button className="modal-close" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>指派服务商</label>
                <select value={approveProviderId} onChange={(e) => setApproveProviderId(e.target.value)}>
                  <option value="">暂不指派</option>
                  {providers.map(p => <option key={p.id} value={p.id}>{p.name} - {p.contact_person}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowApproveModal(false)}>取消</button>
              <button className="btn btn-success" onClick={submitApprove}>确认通过并生成工单</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedClaim && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>拒赔处理 - {selectedClaim.claim_no}</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>拒赔原因 *</label>
                <select value={rejectData.reject_reason} onChange={(e) => setRejectData({...rejectData, reject_reason: e.target.value})}>
                  <option value="">请选择</option>
                  <option value="不在保障范围内">不在保障范围内</option>
                  <option value="保单已过期">保单已过期</option>
                  <option value="人为损坏">人为损坏</option>
                  <option value="超出服务次数">超出服务次数</option>
                  <option value="信息不真实">信息不真实</option>
                </select>
              </div>
              <div className="form-group">
                <label>条款依据 *</label>
                <textarea value={rejectData.reject_clause} onChange={(e) => setRejectData({...rejectData, reject_clause: e.target.value})} placeholder="请引用具体条款说明..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowRejectModal(false)}>取消</button>
              <button className="btn btn-danger" onClick={submitReject}>确认拒赔</button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && claimDetail && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>理赔详情 - {claimDetail.claim_no}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h4 style={{marginBottom:'12px',color:'#666'}}>基本信息</h4>
              <div className="detail-row"><span className="detail-label">理赔号</span><span className="detail-value">{claimDetail.claim_no}</span></div>
              <div className="detail-row"><span className="detail-label">保单号</span><span className="detail-value">{claimDetail.policy_no}</span></div>
              <div className="detail-row"><span className="detail-label">用户</span><span className="detail-value">{claimDetail.user_name} ({claimDetail.phone})</span></div>
              <div className="detail-row"><span className="detail-label">状态</span><span className="detail-value">{getStatusTag(claimDetail.status)}</span></div>

              <h4 style={{margin:'20px 0 12px',color:'#666'}}>故障信息</h4>
              <div className="detail-row"><span className="detail-label">故障类型</span><span className="detail-value">{claimDetail.fault_type}</span></div>
              <div className="detail-row"><span className="detail-label">故障描述</span><span className="detail-value">{claimDetail.fault_description || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">保障范围</span><span className="detail-value">{claimDetail.coverage_scope}</span></div>

              {claimDetail.status === 'rejected' && (
                <>
                  <h4 style={{margin:'20px 0 12px',color:'#666'}}>拒赔信息</h4>
                  <div className="detail-row"><span className="detail-label">拒赔原因</span><span className="detail-value">{claimDetail.reject_reason}</span></div>
                  <div className="detail-row"><span className="detail-label">条款依据</span><span className="detail-value">{claimDetail.reject_clause}</span></div>
                </>
              )}

              {claimDetail.order && (
                <>
                  <h4 style={{margin:'20px 0 12px',color:'#666'}}>服务工单</h4>
                  <div className="detail-row"><span className="detail-label">工单号</span><span className="detail-value">{claimDetail.order.order_no}</span></div>
                  <div className="detail-row"><span className="detail-label">服务商</span><span className="detail-value">{claimDetail.order.provider_name || '-'}</span></div>
                  <div className="detail-row"><span className="detail-label">状态</span><span className="detail-value">{claimDetail.order.status}</span></div>
                  {claimDetail.order.inspection_report && (
                    <div className="detail-row"><span className="detail-label">检测报告</span><span className="detail-value">{claimDetail.order.inspection_report}</span></div>
                  )}
                  {claimDetail.order.parts?.length > 0 && (
                    <>
                      <h5 style={{margin:'16px 0 8px',color:'#888'}}>更换配件</h5>
                      <table className="table" style={{fontSize:'12px'}}>
                        <thead><tr><th>配件名称</th><th>编码</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
                        <tbody>
                          {claimDetail.order.parts.map((part,i) => (
                            <tr key={i}><td>{part.part_name}</td><td>{part.part_code}</td><td>{part.quantity}</td><td>¥{part.unit_price}</td><td>¥{part.total_price}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  {claimDetail.order.fees?.length > 0 && (
                    <>
                      <h5 style={{margin:'16px 0 8px',color:'#888'}}>费用明细</h5>
                      <table className="table" style={{fontSize:'12px'}}>
                        <thead><tr><th>费用类型</th><th>金额</th><th>说明</th></tr></thead>
                        <tbody>
                          {claimDetail.order.fees.map((fee,i) => (
                            <tr key={i}><td>{fee.fee_type}</td><td>¥{fee.amount}</td><td>{fee.description}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={() => setShowDetailModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Claims;
