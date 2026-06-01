import React, { useState, useEffect } from 'react';
import { getContracts, getContract, createContract, getCustomers } from '../api.js';

export default function Contracts() {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    total_amount: '',
    lease_term: 12,
    start_date: '',
    end_date: '',
    deposit: '',
    delivery_address: '',
    insurance_coverage: '',
    default_clause: '',
    devices: [{ device_name: '', device_model: '', brand: '', unit_price: '', quantity: 1 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [contractsRes, customersRes] = await Promise.all([
        getContracts(),
        getCustomers({ status: 'approved' })
      ]);
      console.log('合同列表API返回:', contractsRes.data);
      console.log('客户列表API返回:', customersRes.data);
      setContracts(Array.isArray(contractsRes.data) ? contractsRes.data : []);
      setCustomers(Array.isArray(customersRes.data) ? customersRes.data : []);
    } catch (error) {
      console.error('加载数据失败:', error);
      setContracts([]);
      setCustomers([]);
    }
  };

  const handleCustomerChange = (e) => {
    const customer = customers.find(c => c.id == e.target.value);
    setFormData({
      ...formData,
      customer_id: e.target.value,
      customer_name: customer?.company_name || '',
      delivery_address: customer?.address || ''
    });
  };

  const handleAddDevice = () => {
    setFormData({
      ...formData,
      devices: [...formData.devices, { device_name: '', device_model: '', brand: '', unit_price: '', quantity: 1 }]
    });
  };

  const handleDeviceChange = (index, field, value) => {
    const newDevices = [...formData.devices];
    newDevices[index][field] = value;
    setFormData({ ...formData, devices: newDevices });
  };

  const handleRemoveDevice = (index) => {
    const newDevices = formData.devices.filter((_, i) => i !== index);
    setFormData({ ...formData, devices: newDevices });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createContract(formData);
      setShowModal(false);
      loadData();
    } catch (error) {
      alert('创建合同失败: ' + error.message);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await getContract(id);
      console.log('合同详情API返回:', res.data);
      setDetailData(res.data || {});
      setShowDetail(id);
    } catch (error) {
      console.error('加载合同详情失败:', error);
      setDetailData({});
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'active': ['执行中', 'success'],
      'pending': ['待生效', 'warning'],
      'completed': ['已完成', 'secondary'],
      'terminated': ['已终止', 'danger']
    };
    const [text, type] = map[status] || ['未知', 'secondary'];
    return <span className={`badge ${type}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>租赁合同管理</h1>
          <p>设备租赁合同全生命周期管理</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 新建合同
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>合同编号</th>
              <th>客户名称</th>
              <th>合同金额</th>
              <th>租期</th>
              <th>开始日期</th>
              <th>结束日期</th>
              <th>押金</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {contracts.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-4">暂无合同数据</td>
              </tr>
            ) : (
              contracts.map(contract => (
                <tr key={contract.id}>
                  <td>{contract.contract_no || '-'}</td>
                  <td>{contract.customer_name || '-'}</td>
                  <td>¥{contract.total_amount != null ? Number(contract.total_amount).toLocaleString() : '-'}</td>
                  <td>{contract.lease_term != null ? contract.lease_term + ' 个月' : '-'}</td>
                  <td>{contract.start_date || '-'}</td>
                  <td>{contract.end_date || '-'}</td>
                  <td>¥{contract.deposit != null ? Number(contract.deposit).toLocaleString() : '-'}</td>
                  <td>{getStatusBadge(contract.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleViewDetail(contract.id)}>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>新建租赁合同</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>选择客户 *</label>
                  <select required value={formData.customer_id} onChange={handleCustomerChange}>
                    <option value="">请选择已授信客户</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.company_name} (额度: ¥{c.approved_limit?.toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>合同总金额(元) *</label>
                  <input type="number" required value={formData.total_amount}
                    onChange={e => setFormData({...formData, total_amount: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>租期(月) *</label>
                  <input type="number" required value={formData.lease_term}
                    onChange={e => setFormData({...formData, lease_term: parseInt(e.target.value)})} />
                </div>
                <div className="form-group">
                  <label>押金(元)</label>
                  <input type="number" value={formData.deposit}
                    onChange={e => setFormData({...formData, deposit: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>开始日期 *</label>
                  <input type="date" required value={formData.start_date}
                    onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>结束日期 *</label>
                  <input type="date" required value={formData.end_date}
                    onChange={e => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>交付地址</label>
                <input type="text" value={formData.delivery_address}
                  onChange={e => setFormData({...formData, delivery_address: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>保险金额(元)</label>
                  <input type="number" value={formData.insurance_coverage}
                    onChange={e => setFormData({...formData, insurance_coverage: e.target.value})} />
                </div>
              </div>

              <div className="mb-2">
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <h4 style={{ margin: 0 }}>设备清单</h4>
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleAddDevice}>
                    + 添加设备
                  </button>
                </div>
                {formData.devices.map((device, index) => (
                  <div key={index} style={{ padding: '12px', background: '#f8f9fa', borderRadius: '6px', marginBottom: '8px' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <strong>设备 {index + 1}</strong>
                      {formData.devices.length > 1 && (
                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleRemoveDevice(index)}>
                          删除
                        </button>
                      )}
                    </div>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label>设备名称</label>
                        <input type="text" value={device.device_name}
                          onChange={e => handleDeviceChange(index, 'device_name', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label>型号</label>
                        <input type="text" value={device.device_model}
                          onChange={e => handleDeviceChange(index, 'device_model', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row" style={{ marginBottom: 0 }}>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label>品牌</label>
                        <input type="text" value={device.brand}
                          onChange={e => handleDeviceChange(index, 'brand', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '8px' }}>
                        <label>单价(元)</label>
                        <input type="number" value={device.unit_price}
                          onChange={e => handleDeviceChange(index, 'unit_price', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建合同</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailData && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>合同详情 - {detailData.contract_no}</h2>
              <button className="close-btn" onClick={() => setShowDetail(null)}>&times;</button>
            </div>
            <div className="grid-2 mb-2">
              <div>客户: {detailData.customer_name || '-'}</div>
              <div>状态: {getStatusBadge(detailData.status)}</div>
              <div>合同金额: ¥{detailData.total_amount != null ? Number(detailData.total_amount).toLocaleString() : '-'}</div>
              <div>租期: {detailData.lease_term != null ? detailData.lease_term + ' 个月' : '-'}</div>
              <div>开始日期: {detailData.start_date || '-'}</div>
              <div>结束日期: {detailData.end_date || '-'}</div>
              <div>押金: ¥{detailData.deposit != null ? Number(detailData.deposit).toLocaleString() : '-'}</div>
              <div>月租金: ¥{detailData.total_amount != null && detailData.lease_term ? Math.floor(Number(detailData.total_amount) / Number(detailData.lease_term)).toLocaleString() : '-'}</div>
              <div>保险金额: ¥{detailData.insurance_coverage != null ? Number(detailData.insurance_coverage).toLocaleString() : '-'}</div>
              <div>交付地址: {detailData.delivery_address || '-'}</div>
            </div>
            {detailData.default_clause && (
              <div className="mb-2">
                <h4>违约条款</h4>
                <div className="text-muted">{detailData.default_clause}</div>
              </div>
            )}
            <div className="mb-2">
              <h4>租赁设备 ({(detailData.devices || []).length} 台)</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>序列号</th>
                    <th>设备名称</th>
                    <th>型号</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailData.devices || []).length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted">暂无设备数据</td></tr>
                  ) : (
                    (detailData.devices || []).map(d => (
                      <tr key={d.id}>
                        <td>{d.serial_no || '-'}</td>
                        <td>{d.device_name || '-'}</td>
                        <td>{d.device_model || '-'}</td>
                        <td><span className="badge info">{d.status || '-'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div>
              <h4>账单计划</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>账单编号</th>
                    <th>金额</th>
                    <th>到期日</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {(detailData.bills || []).length === 0 ? (
                    <tr><td colSpan="4" className="text-center text-muted">暂无账单数据</td></tr>
                  ) : (
                    (detailData.bills || []).map(b => (
                      <tr key={b.id}>
                        <td>{b.bill_no || '-'}</td>
                        <td>¥{b.amount != null ? Number(b.amount).toLocaleString() : '-'}</td>
                        <td>{b.due_date || '-'}</td>
                        <td><span className={`badge ${b.status === 'paid' ? 'success' : b.status === 'partial' ? 'warning' : 'danger'}`}>
                          {b.status === 'paid' ? '已付' : b.status === 'partial' ? '部分' : '未付'}
                        </span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
