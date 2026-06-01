import React, { useState, useEffect } from 'react';
import { getDevices, getDevice, updateDeviceLocation, addMaintenance } from '../api.js';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [locationForm, setLocationForm] = useState({ current_location: '' });
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_date: '',
    maintenance_type: 'routine',
    description: '',
    cost: '',
    technician: ''
  });

  useEffect(() => {
    loadDevices();
  }, [filterStatus]);

  const loadDevices = async () => {
    try {
      const res = await getDevices(filterStatus ? { status: filterStatus } : {});
      console.log('设备列表API返回:', res.data);
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('加载设备失败:', error);
      setDevices([]);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await getDevice(id);
      console.log('设备详情API返回:', res.data);
      setDetailData(res.data || {});
      setShowDetail(id);
    } catch (error) {
      console.error('加载设备详情失败:', error);
      setDetailData({});
    }
  };

  const handleOpenLocationModal = (device) => {
    setSelectedDevice(device);
    setLocationForm({ current_location: device.current_location || '' });
    setShowLocationModal(true);
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    try {
      await updateDeviceLocation(selectedDevice.id, locationForm);
      setShowLocationModal(false);
      loadDevices();
      if (showDetail) {
        handleViewDetail(showDetail);
      }
    } catch (error) {
      alert('更新位置失败: ' + error.message);
    }
  };

  const handleOpenMaintenanceModal = (device) => {
    setSelectedDevice(device);
    setMaintenanceForm({
      maintenance_date: new Date().toISOString().split('T')[0],
      maintenance_type: 'routine',
      description: '',
      cost: '',
      technician: ''
    });
    setShowMaintenanceModal(true);
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      await addMaintenance(selectedDevice.id, maintenanceForm);
      setShowMaintenanceModal(false);
      if (showDetail) {
        handleViewDetail(showDetail);
      }
    } catch (error) {
      alert('添加保养记录失败: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      'idle': ['空闲', 'secondary'],
      'in_use': ['使用中', 'success'],
      'maintenance': ['维护中', 'warning'],
      'returned': ['已归还', 'info']
    };
    const [text, type] = map[status] || ['未知', 'secondary'];
    return <span className={`badge ${type}`}>{text}</span>;
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>设备台账管理</h1>
          <p>设备全生命周期跟踪与监控</p>
        </div>
        <div className="flex-gap">
          <select className="form-group" style={{ margin: 0, width: '150px' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="idle">空闲</option>
            <option value="in_use">使用中</option>
            <option value="maintenance">维护中</option>
          </select>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>序列号</th>
              <th>设备名称</th>
              <th>品牌型号</th>
              <th>当前位置</th>
              <th>采购价</th>
              <th>现值</th>
              <th>异常移动</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-muted py-4">暂无设备数据</td>
              </tr>
            ) : (
              devices.map(device => (
                <tr key={device.id}>
                  <td><code>{device.serial_no || '-'}</code></td>
                  <td>{device.device_name || '-'}</td>
                  <td>{device.brand || ''} {device.device_model || '-'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {device.current_location || '-'}
                  </td>
                  <td>¥{device.purchase_price != null ? Number(device.purchase_price).toLocaleString() : '-'}</td>
                  <td>¥{device.current_value != null ? Number(device.current_value).toLocaleString() : '-'}</td>
                  <td>{device.abnormal_movement > 0 ? (
                    <span className="badge danger">{device.abnormal_movement} 次</span>
                  ) : <span className="text-muted">0</span>}</td>
                  <td>{getStatusBadge(device.status)}</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-sm btn-primary" onClick={() => handleViewDetail(device.id)}>
                        详情
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleOpenLocationModal(device)}>
                        更新位置
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetail && detailData && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h2>设备详情 - {detailData.serial_no || '-'}</h2>
              <button className="close-btn" onClick={() => setShowDetail(null)}>&times;</button>
            </div>
            <div className="grid-2 mb-2">
              <div>设备名称: {detailData.device_name || '-'}</div>
              <div>品牌型号: {detailData.brand || ''} {detailData.device_model || '-'}</div>
              <div>采购日期: {detailData.purchase_date || '-'}</div>
              <div>采购价格: ¥{detailData.purchase_price != null ? Number(detailData.purchase_price).toLocaleString() : '-'}</div>
              <div>当前价值: ¥{detailData.current_value != null ? Number(detailData.current_value).toLocaleString() : '-'}</div>
              <div>状态: {getStatusBadge(detailData.status)}</div>
              <div>交付状态: {detailData.delivery_status === 'delivered' ? '已交付' : detailData.delivery_status === 'returned' ? '已退租' : detailData.delivery_status || '-'}</div>
              <div>异常移动: {detailData.abnormal_movement != null ? detailData.abnormal_movement + ' 次' : '-'}</div>
            </div>
            <div className="mb-2">
              <h4>当前位置</h4>
              <div className="flex-between">
                <span>{detailData.current_location || '-'}</span>
                <button className="btn btn-sm btn-primary" onClick={() => handleOpenLocationModal(detailData)}>
                  更新位置
                </button>
              </div>
            </div>
            <div className="mb-2">
              <div className="flex-between">
                <h4>保养记录</h4>
                <button className="btn btn-sm btn-primary" onClick={() => handleOpenMaintenanceModal(detailData)}>
                  + 新增保养
                </button>
              </div>
              {(detailData.maintenance || []).length === 0 ? (
                <div className="text-muted">暂无保养记录</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>日期</th>
                      <th>类型</th>
                      <th>描述</th>
                      <th>费用</th>
                      <th>技师</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detailData.maintenance || []).map(m => (
                      <tr key={m.id}>
                        <td>{m.maintenance_date || '-'}</td>
                        <td>{m.maintenance_type === 'routine' ? '例行保养' : m.maintenance_type === 'repair' ? '故障维修' : (m.maintenance_type || '-')}</td>
                        <td>{m.description || '-'}</td>
                        <td>¥{m.cost != null ? Number(m.cost).toLocaleString() : '-'}</td>
                        <td>{m.technician || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div>
              <h4>告警记录</h4>
              {(detailData.alerts || []).length === 0 ? (
                <div className="text-muted">暂无告警记录</div>
              ) : (
                (detailData.alerts || []).map(a => (
                  <div key={a.id} className={`alert-item ${a.alert_level || 'info'}`}>
                    <div className="flex-between">
                      <div>
                        <strong>{a.alert_type === 'abnormal_movement' ? '异常移动' : a.alert_type || '告警'}</strong>
                        <div className="text-muted" style={{ fontSize: '12px' }}>{a.description || '-'}</div>
                      </div>
                      <span className={`badge ${a.status === 'active' ? 'warning' : 'success'}`}>
                        {a.status === 'active' ? '待处理' : '已处理'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>更新设备位置</h2>
              <button className="close-btn" onClick={() => setShowLocationModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleUpdateLocation}>
              <div className="form-group">
                <label>新位置 *</label>
                <input type="text" required value={locationForm.current_location}
                  onChange={e => setLocationForm({ current_location: e.target.value })}
                  placeholder="请输入设备当前位置" />
              </div>
              <div className="text-muted" style={{ marginBottom: '16px' }}>
                提示：如果位置发生变更，系统将自动记录异常移动告警
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLocationModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认更新</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMaintenanceModal && (
        <div className="modal-overlay" onClick={() => setShowMaintenanceModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新增保养记录</h2>
              <button className="close-btn" onClick={() => setShowMaintenanceModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleAddMaintenance}>
              <div className="form-row">
                <div className="form-group">
                  <label>保养日期 *</label>
                  <input type="date" required value={maintenanceForm.maintenance_date}
                    onChange={e => setMaintenanceForm({...maintenanceForm, maintenance_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>保养类型</label>
                  <select value={maintenanceForm.maintenance_type}
                    onChange={e => setMaintenanceForm({...maintenanceForm, maintenance_type: e.target.value})}>
                    <option value="routine">例行保养</option>
                    <option value="repair">故障维修</option>
                    <option value="inspection">定期检查</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>保养描述</label>
                <textarea rows="3" value={maintenanceForm.description}
                  onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})}
                  placeholder="请描述保养内容" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>费用(元)</label>
                  <input type="number" value={maintenanceForm.cost}
                    onChange={e => setMaintenanceForm({...maintenanceForm, cost: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>技师</label>
                  <input type="text" value={maintenanceForm.technician}
                    onChange={e => setMaintenanceForm({...maintenanceForm, technician: e.target.value})} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMaintenanceModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">保存记录</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
