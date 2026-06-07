import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';

const RiderVehicle = () => {
  const [data, setData] = useState(null);
  const [vehicleType, setVehicleType] = useState('electric');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleLicense, setVehicleLicense] = useState('');
  const [insurance, setInsurance] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/rider/profile');
      setData(res.data);
      if (res.data.vehicle) {
        setVehicleType(res.data.vehicle.vehicle_type);
        setPlateNumber(res.data.vehicle.plate_number);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleType || !plateNumber) {
      alert('请填写车辆类型和车牌号');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/rider/vehicle', {
        vehicle_type: vehicleType,
        plate_number: plateNumber,
        vehicle_license: vehicleLicense,
        insurance_certificate: insurance
      });
      setMessage({ type: 'success', text: '车辆绑定资料已提交，等待审核' });
      loadData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '提交失败' });
    } finally {
      setSubmitting(false);
    }
  };

  const simulateUpload = () => {
    return `cert-${Date.now()}-mock`;
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  const status = data?.vehicle?.binding_status || 'none';

  return (
    <div className="container">
      <h1 style={{ marginBottom: '20px' }}>🚗 车辆绑定</h1>

      {message && (
        <div className={`alert alert-${message.type}`} onClick={() => setMessage(null)}>
          {message.text}
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">当前绑定状态</h3>
        <div style={{ marginBottom: '8px' }}>
          状态：
          <span className={`badge ${status === 'bound' ? 'badge-success' : status === 'pending' ? 'badge-warning' : 'badge-default'}`}>
            {status === 'bound' ? '已绑定' : status === 'pending' ? '审核中' : '未绑定'}
          </span>
        </div>
        {data?.vehicle && (
          <>
            <div>车辆类型：{data.vehicle.vehicle_type === 'electric' ? '电动车' : data.vehicle.vehicle_type === 'motorcycle' ? '摩托车' : '汽车'}</div>
            <div>车牌号：{data.vehicle.plate_number}</div>
          </>
        )}
      </div>

      {status !== 'bound' && status !== 'pending' && (
        <div className="card">
          <h3 className="card-title">绑定车辆信息</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">车辆类型</label>
                <select className="form-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                  <option value="electric">电动车</option>
                  <option value="motorcycle">摩托车</option>
                  <option value="car">汽车</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">车牌号</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入车牌号"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">行驶证照片</label>
                <div
                  style={{
                    height: '80px',
                    border: '2px dashed var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: vehicleLicense ? '#e6f4ff' : '#fafafa'
                  }}
                  onClick={() => setVehicleLicense(simulateUpload())}
                >
                  {vehicleLicense ? '✓ 已上传' : '点击上传行驶证'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">保险凭证</label>
                <div
                  style={{
                    height: '80px',
                    border: '2px dashed var(--border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    background: insurance ? '#e6f4ff' : '#fafafa'
                  }}
                  onClick={() => setInsurance(simulateUpload())}
                >
                  {insurance ? '✓ 已上传' : '点击上传保险'}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <span className="spinner" /> : '提交绑定'}
            </button>
          </form>
        </div>
      )}

      {status === 'pending' && (
        <div className="alert alert-warning">
          您的车辆绑定正在审核中，请耐心等待。
        </div>
      )}

      <div className="card">
        <h3 className="card-title">📊 阶梯提成规则</h3>
        <table className="table">
          <thead>
            <tr>
              <th>骑手等级</th>
              <th>累计订单门槛</th>
              <th>基础提成比例</th>
              <th>额外奖励提成</th>
              <th>高峰时段提成</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lv.1</td>
              <td>0 单</td>
              <td>75%</td>
              <td>-</td>
              <td>80%</td>
            </tr>
            <tr>
              <td>Lv.2</td>
              <td>100 单</td>
              <td>80%</td>
              <td>+5%</td>
              <td>85%</td>
            </tr>
            <tr>
              <td>Lv.3</td>
              <td>300 单</td>
              <td>85%</td>
              <td>+10%</td>
              <td>90%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiderVehicle;
