import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shipments, warehouse, security, flightStatus, charges, subscriptions } from '../api';

export default function ShipmentDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('flow');
  const [warehouseForm, setWarehouseForm] = useState({ actual_pieces: '', actual_weight: '', exception_note: '' });
  const [securityForm, setSecurityForm] = useState({ check_result: 'pass', check_note: '' });
  const [statusForm, setStatusForm] = useState({ status_code: '', status_name: '', status_time: '', location: '' });
  const [versionForm, setVersionForm] = useState({ change_type: 'flight_change', change_reason: '', master_waybill: '', house_waybill: '', flight_no: '', pieces: '', weight: '' });
  const [chargeForm, setChargeForm] = useState({ charge_type: 'freight', charge_name: '运费', amount: '', unit_price: '', charge_weight: '' });
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const [subs, setSubs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [subForm, setSubForm] = useState({ subscriber_name: '', subscriber_email: '', subscriber_phone: '', notify_departed: true, notify_arrived: true, notify_cleared: true, notify_available: true, notify_delivered: true });

  async function loadData() {
    const result = await shipments.get(id);
    setData(result);
    if (result.shipment) {
      setWarehouseForm(f => ({ ...f, actual_pieces: result.shipment.pieces, actual_weight: result.shipment.weight }));
    }
    const subResult = await subscriptions.get(id);
    setSubs(subResult);
    const notifResult = await subscriptions.getNotifications(id);
    setNotifications(notifResult);
  }

  async function handleWarehouse(e) {
    e.preventDefault();
    await warehouse.receive({ shipment_id: id, ...warehouseForm, received_by: 'operator' });
    alert('入仓登记成功！');
    loadData();
  }

  async function handleSecurity(e) {
    e.preventDefault();
    await security.check({ shipment_id: id, ...securityForm, checked_by: 'operator' });
    alert('安检记录成功！');
    loadData();
  }

  async function handleApprove() {
    await shipments.approveDangerous(id, { approved: true, approved_by: 'manager' });
    alert('危险品审核通过！');
    loadData();
  }

  async function handleStatus(e) {
    e.preventDefault();
    await flightStatus.update({ shipment_id: id, ...statusForm, notify_customer: true });
    alert('状态更新成功！');
    loadData();
    setStatusForm({ status_code: '', status_name: '', status_time: '', location: '' });
  }

  async function handleVersion(e) {
    e.preventDefault();
    await flightStatus.createVersion({ shipment_id: id, ...versionForm, changed_by: 'operator' });
    alert('变更记录成功！');
    loadData();
  }

  async function handleCharge(e) {
    e.preventDefault();
    await charges.add({ shipment_id: id, ...chargeForm });
    alert('费用添加成功！');
    loadData();
    setChargeForm({ charge_type: 'freight', charge_name: '运费', amount: '', unit_price: '', charge_weight: '' });
  }

  async function handleCalc() {
    const result = await charges.calculate({ shipment_id: id, ...chargeForm });
    setCalcResult(result);
    if (result.total_amount) {
      setChargeForm(f => ({ ...f, amount: result.total_amount, charge_weight: result.chargeable_weight }));
    }
  }

  async function verifyCharge(chargeId) {
    await charges.verify({ charge_id: chargeId, verified_by: 'finance', is_verified: true });
    alert('费用已确认！');
    loadData();
  }

  async function handleSubscribe(e) {
    e.preventDefault();
    await subscriptions.subscribe({ shipment_id: id, ...subForm });
    alert('订阅成功！状态变化时将收到通知');
    loadData();
    setSubForm({ subscriber_name: '', subscriber_email: '', subscriber_phone: '', notify_departed: true, notify_arrived: true, notify_cleared: true, notify_available: true, notify_delivered: true });
  }

  async function handleUnsubscribe(subId) {
    if (confirm('确定取消订阅？')) {
      await subscriptions.unsubscribe(subId);
      loadData();
    }
  }

  if (!data) return <div>加载中...</div>;
  const { shipment, warehouse: wh, security: sec, flightStatuses, charges: chgs, versions } = data;

  const statusLabels = {
    created: { text: '已创建', class: 'badge-info' },
    warehouse_received: { text: '已入仓', class: 'badge-info' },
    warehouse_exception: { text: '入仓异常', class: 'badge-warning' },
    security_passed: { text: '安检通过', class: 'badge-success' },
    security_failed: { text: '安检失败', class: 'badge-danger' },
    departed: { text: '已起飞', class: 'badge-info' },
    arrived: { text: '已到达', class: 'badge-info' },
    customs_cleared: { text: '已清关', class: 'badge-success' },
    delivered: { text: '已签收', class: 'badge-success' },
    dangerous_approved: { text: '危险品已审核', class: 'badge-success' }
  };
  const status = statusLabels[shipment.status] || { text: shipment.status, class: 'badge-secondary' };

  function quickStatus(code, name) {
    flightStatus.update({ 
      shipment_id: id, 
      status_code: code, 
      status_name: name, 
      status_time: new Date().toISOString(),
      location: '',
      notify_customer: true 
    }).then(() => {
      alert('状态已更新为: ' + name);
      loadData();
    });
  }

  function renderWorkflowStep(stepNum, name, label, desc, isDone, canDo, action, btnText) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: isDone ? '#f0fdf4' : '#fff', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isDone ? '#10b981' : '#94a3b8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {stepNum}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: isDone ? '#065f46' : '#1e293b' }}>{name}</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{desc}</div>
        </div>
        <div>
          {isDone ? (
            <span className="badge badge-success">{label} ✓</span>
          ) : canDo ? (
            action && <button className="btn btn-primary btn-sm" onClick={action}>{btnText}</button>
          ) : (
            <span className="badge badge-secondary">待处理</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>运单详情 - {shipment.shipment_no}</h2>
          <span className={`badge ${status.class}`} style={{ marginTop: '0.5rem' }}>{status.text}</span>
          {shipment.version > 1 && <span className="version-tag" style={{ marginLeft: '0.5rem' }}>v{shipment.version}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/shipments'}>返回列表</button>
        </div>
      </div>

      {(shipment.is_dangerous || shipment.is_battery) && !shipment.dangerous_approved && (
        <div className="alert alert-warning">
          ⚠️ 该货物为{shipment.is_dangerous ? '危险品' : ''}{shipment.is_dangerous && shipment.is_battery ? ' / ' : ''}{shipment.is_battery ? '含电池货物' : ''}，需要审核后才能继续操作
          <button className="btn btn-success" style={{ marginLeft: '1rem' }} onClick={handleApprove}>审核通过</button>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'flow' ? 'active' : ''}`} onClick={() => setTab('flow')}>流程管理</button>
        <button className={`tab ${tab === 'basic' ? 'active' : ''}`} onClick={() => setTab('basic')}>基本信息</button>
        <button className={`tab ${tab === 'warehouse' ? 'active' : ''}`} onClick={() => setTab('warehouse')}>入仓管理</button>
        <button className={`tab ${tab === 'security' ? 'active' : ''}`} onClick={() => setTab('security')}>安检管理</button>
        <button className={`tab ${tab === 'flight' ? 'active' : ''}`} onClick={() => setTab('flight')}>航班跟踪</button>
        <button className={`tab ${tab === 'billing' ? 'active' : ''}`} onClick={() => setTab('billing')}>费用结算</button>
        <button className={`tab ${tab === 'versions' ? 'active' : ''}`} onClick={() => setTab('versions')}>变更记录</button>
        <button className={`tab ${tab === 'subscribe' ? 'active' : ''}`} onClick={() => setTab('subscribe')}>订阅提醒</button>
      </div>

      {tab === 'flow' && (
        <div className="card">
          <h2>业务流程管理</h2>
          <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>
            当前状态: <span className={`badge ${status.class}`}>{status.text}</span>
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {renderWorkflowStep(1, '运单创建', '已创建', '运单信息已录入', true, null, null)}
            
            {(shipment.is_dangerous || shipment.is_battery) && 
              renderWorkflowStep(2, '危险品审核', '已审核', '危险品/带电货物审核通过', 
                shipment.dangerous_approved, !shipment.dangerous_approved, handleApprove, '审核通过')}
            
            {renderWorkflowStep(
              (shipment.is_dangerous || shipment.is_battery) ? 3 : 2, 
              '入仓登记', '已入仓', '货物已送达仓库并完成收货',
              !!wh, 
              !wh && (!(shipment.is_dangerous || shipment.is_battery) || shipment.dangerous_approved), 
              () => setTab('warehouse'), 
              '去入仓'
            )}
            
            {renderWorkflowStep(
              (shipment.is_dangerous || shipment.is_battery) ? 4 : 3, 
              '安检通过', '已安检', '货物安检通过',
              sec && sec.check_result === 'pass', 
              wh && !sec, 
              () => setTab('security'), 
              '去安检'
            )}
            
            {renderWorkflowStep(
              (shipment.is_dangerous || shipment.is_battery) ? 5 : 4, 
              '航班起飞', '已起飞', '航班已起飞',
              flightStatuses?.some(s => s.status_code === 'departed'), 
              sec && sec.check_result === 'pass' && !flightStatuses?.some(s => s.status_code === 'departed'),
              () => quickStatus('departed', '已起飞'), 
              '标记起飞'
            )}
            
            {renderWorkflowStep(
              (shipment.is_dangerous || shipment.is_battery) ? 6 : 5, 
              '航班到达', '已到达', '航班已到达目的地',
              flightStatuses?.some(s => s.status_code === 'arrived'),
              flightStatuses?.some(s => s.status_code === 'departed') && !flightStatuses?.some(s => s.status_code === 'arrived'),
              () => quickStatus('arrived', '已到达'), 
              '标记到达'
            )}
            
            {renderWorkflowStep(
              (shipment.is_dangerous || shipment.is_battery) ? 7 : 6, 
              '清关完成', '已清关', '货物已完成清关',
              flightStatuses?.some(s => s.status_code === 'customs_cleared'),
              flightStatuses?.some(s => s.status_code === 'arrived') && !flightStatuses?.some(s => s.status_code === 'customs_cleared'),
              () => quickStatus('customs_cleared', '已清关'), 
              '标记清关'
            )}
            
            {renderWorkflowStep(
              (shipment.is_dangerous || shipment.is_battery) ? 8 : 7, 
              '可提货', '可提货', '货物已放行可提货',
              flightStatuses?.some(s => s.status_code === 'available'),
              flightStatuses?.some(s => s.status_code === 'customs_cleared') && !flightStatuses?.some(s => s.status_code === 'available'),
              () => quickStatus('available', '可提货'), 
              '标记提货'
            )}
            
            {renderWorkflowStep(
              (shipment.is_dangerous || shipment.is_battery) ? 9 : 8, 
              '派送完成', '已签收', '货物已完成派送签收',
              shipment.status === 'delivered',
              flightStatuses?.some(s => s.status_code === 'available') && shipment.status !== 'delivered',
              () => quickStatus('delivered', '已签收'), 
              '标记签收'
            )}
          </div>

          {flightStatuses && flightStatuses.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>状态轨迹</h3>
              <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '1rem' }}>
                {flightStatuses.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: i < flightStatuses.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                    <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {new Date(s.status_time).toLocaleString('zh-CN')}
                    </div>
                    <div style={{ fontWeight: 500 }}>{s.status_name}</div>
                    <div style={{ color: '#64748b' }}>{s.location || ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'basic' && (
        <div className="card">
          <h2>基本信息</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569' }}>发货人</h3>
              <div className="detail-row"><span className="detail-label">姓名</span><span className="detail-value">{shipment.shipper_name}</span></div>
              <div className="detail-row"><span className="detail-label">电话</span><span className="detail-value">{shipment.shipper_phone || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">地址</span><span className="detail-value">{shipment.shipper_address || '-'}</span></div>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569' }}>收货人</h3>
              <div className="detail-row"><span className="detail-label">姓名</span><span className="detail-value">{shipment.consignee_name}</span></div>
              <div className="detail-row"><span className="detail-label">电话</span><span className="detail-value">{shipment.consignee_phone || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">地址</span><span className="detail-value">{shipment.consignee_address || '-'}</span></div>
            </div>
          </div>
          <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid #e2e8f0' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569' }}>货物信息</h3>
              <div className="detail-row"><span className="detail-label">品名</span><span className="detail-value">{shipment.product_name}</span></div>
              <div className="detail-row"><span className="detail-label">件数</span><span className="detail-value">{shipment.pieces} 件</span></div>
              <div className="detail-row"><span className="detail-label">实际重量</span><span className="detail-value">{shipment.weight} kg</span></div>
              <div className="detail-row"><span className="detail-label">体积重量</span><span className="detail-value">{shipment.volume_weight || '-'} kg</span></div>
              <div className="detail-row"><span className="detail-label">计费重量</span><span className="detail-value" style={{ color: '#2563eb', fontWeight: '600' }}>{shipment.chargeable_weight || '-'} kg</span></div>
              <div className="detail-row"><span className="detail-label">尺寸</span><span className="detail-value">{shipment.length && shipment.width && shipment.height ? `${shipment.length}×${shipment.width}×${shipment.height} cm` : '-'}</span></div>
              <div className="detail-row"><span className="detail-label">货物类型</span><span className="detail-value">{shipment.is_dangerous ? '危险品 ' : ''}{shipment.is_battery ? '含电池 ' : ''}{!shipment.is_dangerous && !shipment.is_battery ? '普通货物' : ''}</span></div>
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569' }}>航线与航班</h3>
              <div className="detail-row"><span className="detail-label">航线</span><span className="detail-value">{shipment.origin} → {shipment.destination}</span></div>
              <div className="detail-row"><span className="detail-label">航班号</span><span className="detail-value">{shipment.flight_no || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">航班日期</span><span className="detail-value">{shipment.flight_date || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">主运单</span><span className="detail-value">{shipment.master_waybill || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">分运单</span><span className="detail-value">{shipment.house_waybill || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">服务等级</span><span className="detail-value">{shipment.service_level === 'standard' ? '标准' : shipment.service_level === 'express' ? '加急' : '优先'}</span></div>
              <div className="detail-row"><span className="detail-label">创建时间</span><span className="detail-value">{new Date(shipment.created_at).toLocaleString('zh-CN')}</span></div>
            </div>
          </div>
        </div>
      )}

      {tab === 'warehouse' && (
        <div>
          {wh && (
            <div className="card">
              <h2>已入仓记录</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div className="detail-row"><span className="detail-label">实际件数</span><span className="detail-value">{wh.actual_pieces} 件</span></div>
                <div className="detail-row"><span className="detail-label">实际重量</span><span className="detail-value">{wh.actual_weight} kg</span></div>
                <div className="detail-row"><span className="detail-label">差异</span><span className="detail-value">
                  {wh.actual_pieces !== shipment.pieces || wh.actual_weight !== shipment.weight ? <span style={{ color: '#ef4444' }}>有差异</span> : '无差异'}
                </span></div>
                <div className="detail-row"><span className="detail-label">入仓时间</span><span className="detail-value">{new Date(wh.received_at).toLocaleString('zh-CN')}</span></div>
              </div>
              {wh.exception_note && <div className="alert alert-warning" style={{ marginTop: '1rem' }}>异常说明: {wh.exception_note}</div>}
            </div>
          )}
          {!wh && (
            <div className="card">
              <h2>入仓登记</h2>
              <form onSubmit={handleWarehouse}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>实际件数</label>
                    <input type="number" value={warehouseForm.actual_pieces} onChange={e => setWarehouseForm(f => ({ ...f, actual_pieces: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>实际重量(kg)</label>
                    <input type="number" step="0.01" value={warehouseForm.actual_weight} onChange={e => setWarehouseForm(f => ({ ...f, actual_weight: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>异常说明</label>
                    <textarea rows="2" value={warehouseForm.exception_note} onChange={e => setWarehouseForm(f => ({ ...f, exception_note: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">确认入仓</button>
              </form>
            </div>
          )}
        </div>
      )}

      {tab === 'security' && (
        <div>
          {sec && (
            <div className="card">
              <h2>安检记录</h2>
              <div className="detail-row"><span className="detail-label">安检结果</span><span className="detail-value">
                <span className={`badge ${sec.check_result === 'pass' ? 'badge-success' : 'badge-danger'}`}>{sec.check_result === 'pass' ? '通过' : '不通过'}</span>
              </span></div>
              <div className="detail-row"><span className="detail-label">安检说明</span><span className="detail-value">{sec.check_note || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">安检员</span><span className="detail-value">{sec.checked_by || '-'}</span></div>
              <div className="detail-row"><span className="detail-label">安检时间</span><span className="detail-value">{new Date(sec.checked_at).toLocaleString('zh-CN')}</span></div>
            </div>
          )}
          {!sec && (
            <div className="card">
              <h2>安检登记</h2>
              <form onSubmit={handleSecurity}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>安检结果</label>
                    <select value={securityForm.check_result} onChange={e => setSecurityForm(f => ({ ...f, check_result: e.target.value }))}>
                      <option value="pass">通过</option>
                      <option value="fail">不通过</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>安检说明</label>
                    <textarea rows="2" value={securityForm.check_note} onChange={e => setSecurityForm(f => ({ ...f, check_note: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">提交安检</button>
              </form>
            </div>
          )}
        </div>
      )}

      {tab === 'flight' && (
        <div>
          <div className="card">
            <h2>状态跟踪</h2>
            {flightStatuses?.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                {flightStatuses.map((s, i) => (
                  <div key={i} style={{ display: 'flex', padding: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ width: '150px', color: '#64748b' }}>{new Date(s.status_time).toLocaleString('zh-CN')}</div>
                    <div><strong style={{ color: '#1e293b' }}>{s.status_name}</strong> - {s.location || ''} {s.remark || ''}</div>
                  </div>
                ))}
              </div>
            )}
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>更新状态</h3>
            <form onSubmit={handleStatus}>
              <div className="form-grid">
                <div className="form-group">
                  <label>状态代码</label>
                  <select value={statusForm.status_code} onChange={e => setStatusForm(f => ({ ...f, status_code: e.target.value, status_name: e.target.options[e.target.selectedIndex].text }))}>
                    <option value="">选择状态</option>
                    <option value="departed">已起飞</option>
                    <option value="arrived">已到达</option>
                    <option value="customs_cleared">已清关</option>
                    <option value="available">可提货</option>
                    <option value="delivered">已签收</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>时间</label>
                  <input type="datetime-local" value={statusForm.status_time} onChange={e => setStatusForm(f => ({ ...f, status_time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>地点</label>
                  <input value={statusForm.location} onChange={e => setStatusForm(f => ({ ...f, location: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">更新状态</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'billing' && (
        <div>
          <div className="card">
            <h2>费用明细</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>费用类型</th>
                  <th>费用名称</th>
                  <th>计费重量</th>
                  <th>单价</th>
                  <th>金额</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {chgs?.map(c => (
                  <tr key={c.id}>
                    <td>{c.charge_type}</td>
                    <td>{c.charge_name}</td>
                    <td>{c.charge_weight || '-'}kg</td>
                    <td>{c.unit_price || '-'}</td>
                    <td style={{ fontWeight: '600' }}>¥{c.amount}</td>
                    <td><span className={`badge ${c.is_verified ? 'badge-success' : 'badge-secondary'}`}>{c.is_verified ? '已确认' : '待确认'}</span></td>
                    <td>{!c.is_verified && <button className="btn btn-sm btn-success" onClick={() => verifyCharge(c.id)}>确认</button>}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="4" style={{ textAlign: 'right', fontWeight: '600' }}>总计:</td>
                  <td style={{ fontWeight: '700', color: '#2563eb' }}>¥{chgs?.reduce((sum, c) => sum + parseFloat(c.amount), 0).toFixed(2) || '0.00'}</td>
                  <td colSpan="2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card">
            <h2>添加费用</h2>
            <div style={{ marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleCalc} style={{ marginRight: '0.5rem' }}>计算运费</button>
            </div>
            {calcResult && (
              <div className="alert alert-success">
                计算结果: 计费重 {calcResult.chargeable_weight}kg × 单价 = 运费 ¥{calcResult.freight_charge}
              </div>
            )}
            <form onSubmit={handleCharge}>
              <div className="form-grid">
                <div className="form-group">
                  <label>费用类型</label>
                  <select value={chargeForm.charge_type} onChange={e => setChargeForm(f => ({ ...f, charge_type: e.target.value }))}>
                    <option value="freight">运费</option>
                    <option value="fuel">燃油附加费</option>
                    <option value="security">安检费</option>
                    <option value="handling">操作费</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>费用名称</label>
                  <input value={chargeForm.charge_name} onChange={e => setChargeForm(f => ({ ...f, charge_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>计费重量(kg)</label>
                  <input type="number" step="0.01" value={chargeForm.charge_weight} onChange={e => setChargeForm(f => ({ ...f, charge_weight: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>单价</label>
                  <input type="number" step="0.01" value={chargeForm.unit_price} onChange={e => setChargeForm(f => ({ ...f, unit_price: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>金额</label>
                  <input type="number" step="0.01" value={chargeForm.amount} onChange={e => setChargeForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">添加费用</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div>
          <div className="card">
            <h2>变更记录</h2>
            {versions?.length > 0 ? (
              versions.map((v, i) => (
                <div key={i} style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span className="version-tag">v{v.version}</span>
                    <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>变更类型: {v.change_type === 'flight_change' ? '航班变更' : v.change_type === 'split' ? '分批出运' : v.change_type === 'pulled' ? '拉货' : v.change_type}</span>
                  </div>
                  {v.change_reason && <div style={{ color: '#64748b', marginBottom: '0.5rem' }}>变更原因: {v.change_reason}</div>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>航班: {v.flight_no || '-'}</div>
                    <div>主运单: {v.master_waybill || '-'}</div>
                    <div>分运单: {v.house_waybill || '-'}</div>
                    <div>件数: {v.pieces || '-'} 件</div>
                    <div>重量: {v.weight || '-'} kg</div>
                    <div>时间: {new Date(v.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
              ))
            ) : <p>暂无变更记录</p>}
          </div>
          <div className="card">
            <h2>添加变更记录</h2>
            <form onSubmit={handleVersion}>
              <div className="form-grid">
                <div className="form-group">
                  <label>变更类型</label>
                  <select value={versionForm.change_type} onChange={e => setVersionForm(f => ({ ...f, change_type: e.target.value }))}>
                    <option value="flight_change">航班变更</option>
                    <option value="split">分批出运</option>
                    <option value="pulled">拉货</option>
                    <option value="waybill_change">运单变更</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>变更原因</label>
                  <input value={versionForm.change_reason} onChange={e => setVersionForm(f => ({ ...f, change_reason: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>主运单</label>
                  <input value={versionForm.master_waybill} onChange={e => setVersionForm(f => ({ ...f, master_waybill: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>分运单</label>
                  <input value={versionForm.house_waybill} onChange={e => setVersionForm(f => ({ ...f, house_waybill: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>航班号</label>
                  <input value={versionForm.flight_no} onChange={e => setVersionForm(f => ({ ...f, flight_no: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>件数</label>
                  <input type="number" value={versionForm.pieces} onChange={e => setVersionForm(f => ({ ...f, pieces: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>重量</label>
                  <input type="number" step="0.01" value={versionForm.weight} onChange={e => setVersionForm(f => ({ ...f, weight: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">记录变更</button>
            </form>
          </div>
        </div>
      )}

      {tab === 'subscribe' && (
        <div>
          <div className="card">
            <h2>状态订阅</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>订阅后，运单状态变化时将自动发送通知</p>
            
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>新增订阅</h3>
            <form onSubmit={handleSubscribe}>
              <div className="form-grid">
                <div className="form-group">
                  <label>订阅人姓名 *</label>
                  <input value={subForm.subscriber_name} onChange={e => setSubForm(f => ({ ...f, subscriber_name: e.target.value }))} placeholder="请输入姓名" required />
                </div>
                <div className="form-group">
                  <label>邮箱</label>
                  <input type="email" value={subForm.subscriber_email} onChange={e => setSubForm(f => ({ ...f, subscriber_email: e.target.value }))} placeholder="请输入邮箱" />
                </div>
                <div className="form-group">
                  <label>手机号</label>
                  <input value={subForm.subscriber_phone} onChange={e => setSubForm(f => ({ ...f, subscriber_phone: e.target.value }))} placeholder="请输入手机号" />
                </div>
              </div>
              <div style={{ margin: '1rem 0' }}>
                <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>通知节点：</label>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={subForm.notify_departed} onChange={e => setSubForm(f => ({ ...f, notify_departed: e.target.checked }))} />
                    已起飞
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={subForm.notify_arrived} onChange={e => setSubForm(f => ({ ...f, notify_arrived: e.target.checked }))} />
                    已到达
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={subForm.notify_cleared} onChange={e => setSubForm(f => ({ ...f, notify_cleared: e.target.checked }))} />
                    已清关
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={subForm.notify_available} onChange={e => setSubForm(f => ({ ...f, notify_available: e.target.checked }))} />
                    可提货
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={subForm.notify_delivered} onChange={e => setSubForm(f => ({ ...f, notify_delivered: e.target.checked }))} />
                    已签收
                  </label>
                </div>
              </div>
              <button type="submit" className="btn btn-primary">添加订阅</button>
            </form>
          </div>

          <div className="card">
            <h3>已订阅列表</h3>
            {subs?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>订阅人</th>
                    <th>联系方式</th>
                    <th>通知节点</th>
                    <th>订阅时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map(s => (
                    <tr key={s.id}>
                      <td>{s.subscriber_name}</td>
                      <td>{s.subscriber_email || s.subscriber_phone || '-'}</td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {s.notify_departed && <span className="badge badge-info" style={{ marginRight: '0.25rem' }}>起飞</span>}
                        {s.notify_arrived && <span className="badge badge-info" style={{ marginRight: '0.25rem' }}>到达</span>}
                        {s.notify_cleared && <span className="badge badge-info" style={{ marginRight: '0.25rem' }}>清关</span>}
                        {s.notify_available && <span className="badge badge-info" style={{ marginRight: '0.25rem' }}>提货</span>}
                        {s.notify_delivered && <span className="badge badge-info" style={{ marginRight: '0.25rem' }}>签收</span>}
                      </td>
                      <td>{new Date(s.created_at).toLocaleString('zh-CN')}</td>
                      <td><button className="btn btn-sm btn-danger" onClick={() => handleUnsubscribe(s.id)}>取消</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#64748b' }}>暂无订阅</p>}
          </div>

          <div className="card">
            <h3>通知记录</h3>
            {notifications?.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>状态</th>
                    <th>接收人</th>
                    <th>方式</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map(n => (
                    <tr key={n.id}>
                      <td>{new Date(n.sent_at || n.created_at).toLocaleString('zh-CN')}</td>
                      <td><span className="badge badge-success">{n.status_name}</span></td>
                      <td>{n.recipient}</td>
                      <td>{n.notification_type === 'email' ? '邮件' : '短信'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={{ color: '#64748b' }}>暂无通知记录</p>}
          </div>
        </div>
      )}
    </div>
  );
}
