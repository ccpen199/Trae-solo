import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/api';

const Appointment = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    arrivalTime: ''
  });

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.list();
      setAppointments(data);
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await appointmentService.create(formData);
      loadAppointments();
      setFormData({ supplierId: '', supplierName: '', arrivalTime: '' });
    } catch (error) {
      console.error('Failed to create appointment:', error);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await appointmentService.confirm(id);
      loadAppointments();
    } catch (error) {
      console.error('Failed to confirm appointment:', error);
    }
  };

  const handleCancel = async (id) => {
    try {
      await appointmentService.cancel(id);
      loadAppointments();
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: '#fff3cd', color: '#856404' },
      confirmed: { bg: '#d4edda', color: '#155724' },
      completed: { bg: '#cce5ff', color: '#004085' },
      cancelled: { bg: '#f8d7da', color: '#721c24' }
    };
    const style = statusMap[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span style={{ ...style, padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>到货预约管理</h1>
      
      <form onSubmit={handleCreate} style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3>新建预约单</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <input
            type="text"
            placeholder="供应商编号"
            value={formData.supplierId}
            onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="text"
            placeholder="供应商名称"
            value={formData.supplierName}
            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          <input
            type="datetime-local"
            value={formData.arrivalTime}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          创建预约
        </button>
      </form>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>预约单号</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>供应商编号</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>供应商名称</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>预约到货时间</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>状态</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => (
              <tr key={appt.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{appt.id}</td>
                <td style={{ padding: '12px' }}>{appt.supplierId}</td>
                <td style={{ padding: '12px' }}>{appt.supplierName}</td>
                <td style={{ padding: '12px' }}>{new Date(appt.arrivalTime).toLocaleString()}</td>
                <td style={{ padding: '12px' }}>{getStatusBadge(appt.status)}</td>
                <td style={{ padding: '12px' }}>
                  {appt.status === 'pending' && (
                    <>
                      <button onClick={() => handleConfirm(appt.id)} style={{ marginRight: '8px', padding: '4px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        确认
                      </button>
                      <button onClick={() => handleCancel(appt.id)} style={{ padding: '4px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        取消
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Appointment;