import React, { useState, useEffect, useCallback } from 'react';
import { claimsAPI, commonAPI } from '../api';

function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [completeData, setCompleteData] = useState({
    inspection_report: '', parts: [], fees: [], repair_date: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const [ordersRes, providersRes] = await Promise.all([
        commonAPI.getServiceOrders(params),
        commonAPI.getProviders()
      ]);
      const rawOrders = ordersRes;
      const orderList = rawOrders && rawOrders.data ? rawOrders.data : (Array.isArray(rawOrders) ? rawOrders : []);
      setOrders(Array.isArray(orderList) ? orderList : []);
      const rawProviders = providersRes;
      const providerList = rawProviders && rawProviders.data ? rawProviders.data : (Array.isArray(rawProviders) ? rawProviders : []);
      setProviders(Array.isArray(providerList) ? providerList : []);
    } catch (error) {
      console.error('加载数据失败', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = (order) => {
    setSelectedOrder(order);
    setCompleteData({ inspection_report: '', parts: [], fees: [], repair_date: new Date().toISOString().split('T')[0] });
    setShowCompleteModal(true);
  };

  const submitComplete = async () => {
    if (!completeData.inspection_report) {
      alert('请填写检测报告');
      return;
    }
    try {
      await claimsAPI.completeOrder(selectedOrder.id, completeData);
      setShowCompleteModal(false);
      loadData();
      setSaveMsg('维修完成提交成功！');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (error) {
      alert('保存失败');
    }
  };

  const handleConfirm = async (order) => {
    try {
      await claimsAPI.confirmOrder(order.id);
      loadData();
      setSaveMsg('用户确认成功！');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleSettle = async (order) => {
    try {
      await claimsAPI.settleOrder(order.id);
      loadData();
      setSaveMsg('结算成功！');
      setTimeout(() => setSaveMsg(''), 4000);
    } catch (e) {
      alert('操作失败');
    }
  };

  const handleViewDetail = async (order) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  const addPart = () => {
    setCompleteData({ ...completeData, parts: [...completeData.parts, { part_name: '', part_code: '', quantity: 1, unit_price: 0, total_price: 0 }] });
  };
  const updatePart = (index, field, value) => {
    const newParts = [...completeData.parts];
    newParts[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      newParts[index].total_price = (newParts[index].quantity || 0) * (newParts[index].unit_price || 0);
    }
    setCompleteData({ ...completeData, parts: newParts });
  };
  const removePart = (index) => {
    setCompleteData({ ...completeData, parts: completeData.parts.filter((_, i) => i !== index) });
  };

  const addFee = () => {
    setCompleteData({ ...completeData, fees: [...completeData.fees, { fee_type: '', amount: 0, description: '' }] });
  };
  const updateFee = (index, field, value) => {
    const newFees = [...completeData.fees];
    newFees[index][field] = value;
    setCompleteData({ ...completeData, fees: newFees });
  };
  const removeFee = (index) => {
    setCompleteData({ ...completeData, fees: completeData.fees.filter((_, i) => i !== index) });
  };

  const getStatusTag = (status) => {
    const map = {
      assigned: <span className="tag tag-info">已派单</span>,
      processing: <span className="tag tag-warning">维修中</span>,
      completed: <span className="tag tag-success">已完成</span>
    };
    return map[status] || <span className="tag tag-default">{status}</span>;
  };

  const getTotalPartsPrice = (parts) => {
    if (!Array.isArray(parts)) return 0;
    return parts.reduce((sum, p) => sum + (p.total_price || (p.quantity || 0) * (p.unit_price || 0)), 0);
  };

  const getTotalFees = (fees) => {
    if (!Array.isArray(fees)) return 0;
    return fees.reduce((sum, f) => sum + (f.amount || 0), 0);
  };

  return (
    <div>
      {saveMsg && (
        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '12px 20px', borderRadius: '6px', marginBottom: '16px', color: '#389e0d', fontWeight: 600 }}>
          ✓ {saveMsg}
        </div>
      )}

      <div className="card">
        <div className="card-header"><h2>服务工单管理</h2></div>

        <div className="search-bar">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="assigned">已派单</option>
            <option value="processing">维修中</option>
            <option value="completed">已完成</option>
          </select>
          <button className="btn btn-default" onClick={loadData}>搜索</button>
        </div>

        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>加载中...</div> : (
          <table className="table">
            <thead>
              <tr>
                <th>工单号</th><th>理赔号</th><th>故障类型</th><th>用户</th>
                <th>设备序列号</th><th>服务商</th><th>状态</th><th>维修日期</th>
                <th>用户确认</th><th>结算</th><th>操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan="11" style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无数据</td></tr>}
              {orders.map(o => (
                <tr key={o.id}>
                  <td><strong>{o.order_no}</strong></td>
                  <td>{o.claim_no}</td>
                  <td>{o.fault_type}</td>
                  <td><div>{o.user_name}</div><div style={{ fontSize: '12px', color: '#999' }}>{o.phone}</div></td>
                  <td style={{ fontSize: '12px' }}>{o.device_serial}</td>
                  <td>{o.provider_name || '-'}</td>
                  <td>{getStatusTag(o.status)}</td>
                  <td>{o.repair_date || '-'}</td>
                  <td>{o.user_confirmed ? <span className="tag tag-success">已确认</span> : <span className="tag tag-default">待确认</span>}</td>
                  <td>{o.settled ? <span className="tag tag-success">已结算</span> : <span className="tag tag-default">待结算</span>}</td>
                  <td>
                    <button className="btn btn-default btn-sm" onClick={() => handleViewDetail(o)} style={{ marginRight: '4px' }}>详情</button>
                    {o.status !== 'completed' && (
                      <button className="btn btn-success btn-sm" onClick={() => handleComplete(o)}>完成维修</button>
                    )}
                    {o.status === 'completed' && !o.user_confirmed && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(o)}>用户确认</button>
                    )}
                    {o.status === 'completed' && o.user_confirmed && !o.settled && (
                      <button className="btn btn-warning btn-sm" onClick={() => handleSettle(o)}>结算</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCompleteModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>完成维修 - {selectedOrder.order_no}</h3>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>维修日期</label>
                  <input type="date" value={completeData.repair_date} onChange={(e) => setCompleteData({ ...completeData, repair_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>检测报告 *</label>
                <textarea value={completeData.inspection_report} onChange={(e) => setCompleteData({ ...completeData, inspection_report: e.target.value })} placeholder="请详细描述检测结果和维修过程..." required />
              </div>

              <h4 style={{ margin: '20px 0 12px', color: '#666' }}>更换配件</h4>
              {completeData.parts.length > 0 && (
                <table className="table">
                  <thead><tr><th>配件名称</th><th>编码</th><th>数量</th><th>单价</th><th>小计</th><th>操作</th></tr></thead>
                  <tbody>
                    {completeData.parts.map((part, index) => (
                      <tr key={index}>
                        <td><input type="text" value={part.part_name} onChange={(e) => updatePart(index, 'part_name', e.target.value)} style={{ width: '100%', padding: '4px' }} /></td>
                        <td><input type="text" value={part.part_code} onChange={(e) => updatePart(index, 'part_code', e.target.value)} style={{ width: '100%', padding: '4px' }} /></td>
                        <td><input type="number" value={part.quantity} onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '60px', padding: '4px' }} /></td>
                        <td><input type="number" value={part.unit_price} onChange={(e) => updatePart(index, 'unit_price', parseFloat(e.target.value) || 0)} style={{ width: '80px', padding: '4px' }} /></td>
                        <td>¥{part.total_price}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => removePart(index)}>删除</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button className="btn btn-default btn-sm" onClick={addPart}>+ 添加配件</button>

              <h4 style={{ margin: '20px 0 12px', color: '#666' }}>费用明细</h4>
              {completeData.fees.length > 0 && (
                <table className="table">
                  <thead><tr><th>费用类型</th><th>金额</th><th>说明</th><th>操作</th></tr></thead>
                  <tbody>
                    {completeData.fees.map((fee, index) => (
                      <tr key={index}>
                        <td><input type="text" value={fee.fee_type} onChange={(e) => updateFee(index, 'fee_type', e.target.value)} style={{ width: '100%', padding: '4px' }} /></td>
                        <td><input type="number" value={fee.amount} onChange={(e) => updateFee(index, 'amount', parseFloat(e.target.value) || 0)} style={{ width: '100px', padding: '4px' }} /></td>
                        <td><input type="text" value={fee.description} onChange={(e) => updateFee(index, 'description', e.target.value)} style={{ width: '100%', padding: '4px' }} /></td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => removeFee(index)}>删除</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button className="btn btn-default btn-sm" onClick={addFee}>+ 添加费用</button>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowCompleteModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={submitComplete}>保存维修结果</button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && detailOrder && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>工单详情 - {detailOrder.order_no}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h4 style={{ marginBottom: '12px', color: '#666' }}>工单信息</h4>
              <div className="detail-row"><span className="detail-label">工单号</span><span className="detail-value">{detailOrder.order_no}</span></div>
              <div className="detail-row"><span className="detail-label">理赔号</span><span className="detail-value">{detailOrder.claim_no}</span></div>
              <div className="detail-row"><span className="detail-label">故障类型</span><span className="detail-value">{detailOrder.fault_type}</span></div>
              <div className="detail-row"><span className="detail-label">状态</span><span className="detail-value">{getStatusTag(detailOrder.status)}</span></div>
              <div className="detail-row"><span className="detail-label">维修日期</span><span className="detail-value">{detailOrder.repair_date || '-'}</span></div>

              <h4 style={{ margin: '20px 0 12px', color: '#666' }}>用户与设备</h4>
              <div className="detail-row"><span className="detail-label">用户姓名</span><span className="detail-value">{detailOrder.user_name}</span></div>
              <div className="detail-row"><span className="detail-label">联系电话</span><span className="detail-value">{detailOrder.phone || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">设备序列号</span><span className="detail-value">{detailOrder.device_serial}</span></div>
              <div className="detail-row"><span className="detail-label">服务商</span><span className="detail-value">{detailOrder.provider_name || '-'}</span></div>

              <h4 style={{ margin: '20px 0 12px', color: '#666' }}>检测报告</h4>
              <div style={{ background: '#f5f5f5', padding: '12px 16px', borderRadius: '6px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                {detailOrder.inspection_report || '暂无检测报告'}
              </div>

              <h4 style={{ margin: '20px 0 12px', color: '#666' }}>更换配件</h4>
              {Array.isArray(detailOrder.parts) && detailOrder.parts.length > 0 ? (
                <table className="table" style={{ fontSize: '13px' }}>
                  <thead><tr><th>配件名称</th><th>编码</th><th>数量</th><th>单价</th><th>小计</th></tr></thead>
                  <tbody>
                    {detailOrder.parts.map((part, index) => (
                      <tr key={index}>
                        <td>{part.part_name}</td>
                        <td>{part.part_code}</td>
                        <td>{part.quantity}</td>
                        <td>¥{part.unit_price}</td>
                        <td>¥{part.total_price || (part.quantity || 0) * (part.unit_price || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 600 }}>
                      <td colSpan="4" style={{ textAlign: 'right' }}>配件合计</td>
                      <td>¥{getTotalPartsPrice(detailOrder.parts)}</td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div style={{ color: '#999', padding: '8px 0' }}>暂无配件记录</div>
              )}

              <h4 style={{ margin: '20px 0 12px', color: '#666' }}>费用明细</h4>
              {Array.isArray(detailOrder.fees) && detailOrder.fees.length > 0 ? (
                <table className="table" style={{ fontSize: '13px' }}>
                  <thead><tr><th>费用类型</th><th>金额</th><th>说明</th></tr></thead>
                  <tbody>
                    {detailOrder.fees.map((fee, index) => (
                      <tr key={index}>
                        <td>{fee.fee_type}</td>
                        <td>¥{fee.amount}</td>
                        <td>{fee.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ fontWeight: 600 }}>
                      <td style={{ textAlign: 'right' }}>费用合计</td>
                      <td>¥{getTotalFees(detailOrder.fees)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div style={{ color: '#999', padding: '8px 0' }}>暂无费用记录</div>
              )}

              <h4 style={{ margin: '20px 0 12px', color: '#666' }}>确认与结算</h4>
              <div className="detail-row">
                <span className="detail-label">用户确认</span>
                <span className="detail-value">{detailOrder.user_confirmed ? <span className="tag tag-success">已确认</span> : <span className="tag tag-default">待确认</span>}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">结算状态</span>
                <span className="detail-value">{detailOrder.settled ? <span className="tag tag-success">已结算</span> : <span className="tag tag-default">待结算</span>}</span>
              </div>

              {Array.isArray(detailOrder.parts) && Array.isArray(detailOrder.fees) && (detailOrder.parts.length > 0 || detailOrder.fees.length > 0) && (
                <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', padding: '12px 16px', borderRadius: '6px', marginTop: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#1890ff' }}>
                    总计金额：¥{(getTotalPartsPrice(detailOrder.parts) + getTotalFees(detailOrder.fees)).toFixed(2)}
                    <span style={{ marginLeft: '12px', fontWeight: 400, fontSize: '13px' }}>（配件 ¥{getTotalPartsPrice(detailOrder.parts)} + 费用 ¥{getTotalFees(detailOrder.fees)}）</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowDetailModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceOrders;
