import React, { useState, useEffect, useCallback } from 'react';
import { policiesAPI, productsAPI, commonAPI } from '../api';

function Policies() {
  const [policies, setPolicies] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailPolicy, setDetailPolicy] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterSerial, setFilterSerial] = useState('');
  const [filterPolicyNo, setFilterPolicyNo] = useState('');
  const [formData, setFormData] = useState({
    product_id: '', store_id: '', device_serial: '', device_model: '',
    device_brand: '', purchase_date: '', purchase_proof: '', channel: '门店',
    user_name: '', user_phone: '', user_email: '', user_address: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPhone) params.user_phone = filterPhone;
      if (filterSerial) params.device_serial = filterSerial;
      if (filterPolicyNo) params.policy_no = filterPolicyNo;
      const policiesRes = await policiesAPI.getAll(params);
      const productsRes = await productsAPI.getAll({ status: 'active' });
      const storesRes = await commonAPI.getStores();
      const plist = policiesRes && policiesRes.data ? policiesRes.data : (Array.isArray(policiesRes) ? policiesRes : []);
      setPolicies(Array.isArray(plist) ? plist : []);
      const prlist = productsRes && productsRes.data ? productsRes.data : (Array.isArray(productsRes) ? productsRes : []);
      setProducts(Array.isArray(prlist) ? prlist : []);
      const slist = storesRes && storesRes.data ? storesRes.data : (Array.isArray(storesRes) ? storesRes : []);
      setStores(Array.isArray(slist) ? slist : []);
    } catch (e) {
      console.error('加载保单失败', e);
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPhone, filterSerial, filterPolicyNo]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await policiesAPI.create(formData);
      const newPolicy = res && res.data ? res.data : {};
      setShowModal(false);
      resetForm();
      loadData();
      setSaveMsg('保单创建成功！保单号：' + (newPolicy.policy_no || '已生成'));
      setTimeout(() => setSaveMsg(''), 5000);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '创建失败';
      alert('创建保单失败：' + msg);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await policiesAPI.get(id);
      const data = res && res.data ? res.data : res;
      setDetailPolicy(data);
    } catch (error) {
      alert('获取详情失败');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '', store_id: '', device_serial: '', device_model: '',
      device_brand: '', purchase_date: '', purchase_proof: '', channel: '门店',
      user_name: '', user_phone: '', user_email: '', user_address: ''
    });
  };

  const getStatusTag = (status) => {
    const map = {
      active: <span className="tag tag-success">有效</span>,
      expired: <span className="tag tag-default">已过期</span>,
      cancelled: <span className="tag tag-danger">已注销</span>
    };
    return map[status] || <span className="tag tag-default">{status}</span>;
  };

  const getClaimStatusTag = (status) => {
    const map = {
      pending: <span className="tag tag-warning">待审核</span>,
      approved: <span className="tag tag-success">已通过</span>,
      rejected: <span className="tag tag-danger">已拒赔</span>
    };
    return map[status] || <span className="tag tag-default">{status}</span>;
  };

  const selectedProduct = products.find(p => p.id == formData.product_id);
  const endDateCalc = selectedProduct && formData.purchase_date
    ? (() => { const d = new Date(formData.purchase_date); d.setMonth(d.getMonth() + selectedProduct.duration_months); return d.toISOString().split('T')[0]; })()
    : '';

  return (
    <div>
      {saveMsg && (
        <div style={{background:'#f6ffed',border:'1px solid #b7eb8f',padding:'12px 20px',borderRadius:'6px',marginBottom:'16px',color:'#389e0d',fontWeight:600}}>
          ✓ {saveMsg}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>保单管理</h2>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            + 新建保单
          </button>
        </div>

        <div className="search-bar">
          <input type="text" placeholder="保单号" value={filterPolicyNo} onChange={(e) => setFilterPolicyNo(e.target.value)} />
          <input type="text" placeholder="设备序列号" value={filterSerial} onChange={(e) => setFilterSerial(e.target.value)} />
          <input type="text" placeholder="用户手机号" value={filterPhone} onChange={(e) => setFilterPhone(e.target.value)} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="active">有效</option>
            <option value="expired">已过期</option>
          </select>
          <button className="btn btn-default" onClick={loadData}>搜索</button>
        </div>

        {loading ? <div style={{padding:'40px',textAlign:'center',color:'#999'}}>加载中...</div> : (
        <table className="table">
          <thead>
            <tr>
              <th>保单号</th><th>产品</th><th>用户</th><th>设备序列号</th>
              <th>品牌型号</th><th>生效日期</th><th>到期日期</th>
              <th>服务次数</th><th>状态</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            {policies.length === 0 && (
              <tr><td colSpan="10" style={{textAlign:'center',color:'#999',padding:'40px'}}>暂无保单数据</td></tr>
            )}
            {policies.map(p => (
              <tr key={p.id}>
                <td><strong>{p.policy_no}</strong></td>
                <td>{p.product_name}</td>
                <td><div>{p.user_name}</div><div style={{fontSize:'12px',color:'#999'}}>{p.phone}</div></td>
                <td style={{fontSize:'12px'}}>{p.device_serial}</td>
                <td>{p.device_brand} {p.device_model}</td>
                <td>{p.start_date}</td>
                <td>{p.end_date}</td>
                <td>{p.service_count_used}/{p.service_count_used + (p.max_service_count ? p.max_service_count - p.service_count_used : 0)}</td>
                <td>{getStatusTag(p.status)}</td>
                <td><button className="btn btn-default btn-sm" onClick={() => handleViewDetail(p.id)}>详情</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建保单</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h4 style={{marginBottom:'16px',color:'#666'}}>延保产品与渠道</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>延保产品 *</label>
                    <select value={formData.product_id} onChange={(e) => setFormData({...formData, product_id: e.target.value})} required>
                      <option value="">请选择</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} - ¥{p.price} ({p.duration_months}个月)</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>销售渠道 *</label>
                    <select value={formData.channel} onChange={(e) => setFormData({...formData, channel: e.target.value})}>
                      <option value="门店">门店</option>
                      <option value="线上商城">线上商城</option>
                      <option value="第三方平台">第三方平台</option>
                      <option value="电话销售">电话销售</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>销售门店</label>
                    <select value={formData.store_id} onChange={(e) => setFormData({...formData, store_id: e.target.value})}>
                      <option value="">请选择</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>购买凭证</label>
                    <input type="text" value={formData.purchase_proof} onChange={(e) => setFormData({...formData, purchase_proof: e.target.value})} placeholder="发票号/订单号" />
                  </div>
                </div>

                {selectedProduct && formData.purchase_date && (
                  <div style={{background:'#e6f7ff',border:'1px solid #91d5ff',padding:'12px 16px',borderRadius:'6px',marginBottom:'16px'}}>
                    <div style={{fontWeight:600,color:'#1890ff',marginBottom:'8px'}}>保障期限预览</div>
                    <div style={{display:'flex',gap:'24px'}}>
                      <span>生效日期：<strong>{formData.purchase_date}</strong></span>
                      <span>到期日期：<strong>{endDateCalc}</strong></span>
                      <span>保障范围：<strong>{selectedProduct.coverage_scope}</strong></span>
                    </div>
                  </div>
                )}

                <h4 style={{margin:'20px 0 16px',color:'#666'}}>设备信息</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>设备序列号 *（重复投保校验）</label>
                    <input type="text" value={formData.device_serial} onChange={(e) => setFormData({...formData, device_serial: e.target.value})} placeholder="SN码，系统自动校验重复投保" required />
                  </div>
                  <div className="form-group">
                    <label>品牌</label>
                    <input type="text" value={formData.device_brand} onChange={(e) => setFormData({...formData, device_brand: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>型号</label>
                    <input type="text" value={formData.device_model} onChange={(e) => setFormData({...formData, device_model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>购买日期 *</label>
                    <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} required />
                  </div>
                </div>

                <h4 style={{margin:'20px 0 16px',color:'#666'}}>用户信息</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名 *</label>
                    <input type="text" value={formData.user_name} onChange={(e) => setFormData({...formData, user_name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>手机号 *</label>
                    <input type="text" value={formData.user_phone} onChange={(e) => setFormData({...formData, user_phone: e.target.value})} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>邮箱</label>
                    <input type="email" value={formData.user_email} onChange={(e) => setFormData({...formData, user_email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>地址</label>
                    <input type="text" value={formData.user_address} onChange={(e) => setFormData({...formData, user_address: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建保单</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailPolicy && (
        <div className="modal-overlay" onClick={() => setDetailPolicy(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>保单详情 - {detailPolicy.policy_no}</h3>
              <button className="modal-close" onClick={() => setDetailPolicy(null)}>×</button>
            </div>
            <div className="modal-body">
              <h4 style={{marginBottom:'12px',color:'#666'}}>保单信息</h4>
              <div className="detail-row"><span className="detail-label">保单号</span><span className="detail-value">{detailPolicy.policy_no}</span></div>
              <div className="detail-row"><span className="detail-label">产品名称</span><span className="detail-value">{detailPolicy.product_name}</span></div>
              <div className="detail-row"><span className="detail-label">保障范围</span><span className="detail-value">{detailPolicy.coverage_scope}</span></div>
              <div className="detail-row"><span className="detail-label">有效期</span><span className="detail-value">{detailPolicy.start_date} 至 {detailPolicy.end_date}</span></div>
              <div className="detail-row"><span className="detail-label">服务次数</span><span className="detail-value">{detailPolicy.service_count_used} / {detailPolicy.max_service_count}</span></div>
              <div className="detail-row"><span className="detail-label">状态</span><span className="detail-value">{getStatusTag(detailPolicy.status)}</span></div>
              <h4 style={{margin:'20px 0 12px',color:'#666'}}>设备信息</h4>
              <div className="detail-row"><span className="detail-label">序列号</span><span className="detail-value">{detailPolicy.device_serial}</span></div>
              <div className="detail-row"><span className="detail-label">品牌型号</span><span className="detail-value">{detailPolicy.device_brand} {detailPolicy.device_model}</span></div>
              <div className="detail-row"><span className="detail-label">购买凭证</span><span className="detail-value">{detailPolicy.purchase_proof || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">渠道</span><span className="detail-value">{detailPolicy.channel || '-'}</span></div>
              <h4 style={{margin:'20px 0 12px',color:'#666'}}>用户信息</h4>
              <div className="detail-row"><span className="detail-label">姓名</span><span className="detail-value">{detailPolicy.user_name}</span></div>
              <div className="detail-row"><span className="detail-label">手机</span><span className="detail-value">{detailPolicy.phone}</span></div>
              <div className="detail-row"><span className="detail-label">邮箱</span><span className="detail-value">{detailPolicy.email || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">地址</span><span className="detail-value">{detailPolicy.address || '-'}</span></div>
              {detailPolicy.claims && detailPolicy.claims.length > 0 && (
                <>
                  <h4 style={{margin:'20px 0 12px',color:'#666'}}>理赔记录</h4>
                  <table className="table" style={{fontSize:'13px'}}>
                    <thead><tr><th>理赔号</th><th>故障类型</th><th>状态</th><th>申请时间</th></tr></thead>
                    <tbody>
                      {detailPolicy.claims.map(c => (
                        <tr key={c.id}>
                          <td>{c.claim_no}</td><td>{c.fault_type}</td>
                          <td>{getClaimStatusTag(c.status)}</td>
                          <td>{c.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" onClick={() => setDetailPolicy(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Policies;
