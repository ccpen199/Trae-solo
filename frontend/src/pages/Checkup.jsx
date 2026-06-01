import React, { useState, useEffect } from 'react';
import { appointmentAPI, checkupAPI } from '../api.js';

function Checkup({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [records, setRecords] = useState([]);
  const [editingRecord, setEditingRecord] = useState(null);
  const [message, setMessage] = useState(null);
  const [resultForm, setResultForm] = useState({ result: '', is_abnormal: false, doctor_comment: '' });

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const res = await appointmentAPI.getAll();
      setAppointments(res.data.filter(a => a.status === 'checked_in' || a.status === 'completed'));
    } catch (err) {
      setMessage({ type: 'error', text: '加载数据失败' });
    }
  };

  const loadRecords = async (appointmentId) => {
    try {
      const res = await checkupAPI.getByAppointment(appointmentId);
      setRecords(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: '加载检查记录失败' });
    }
  };

  const handleSelectAppointment = (apt) => {
    setSelectedAppointment(apt);
    loadRecords(apt.id);
  };

  const handleSample = async (recordId) => {
    try {
      await checkupAPI.sample(recordId);
      setMessage({ type: 'success', text: '采样成功' });
      loadRecords(selectedAppointment.id);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
    }
  };

  const handleResultSubmit = async () => {
    try {
      await checkupAPI.recordResult(editingRecord.id, resultForm);
      setMessage({ type: 'success', text: '结果录入成功' });
      setEditingRecord(null);
      setResultForm({ result: '', is_abnormal: false, doctor_comment: '' });
      loadRecords(selectedAppointment.id);
      loadAppointments();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
    }
  };

  const handleSkip = async (recordId) => {
    const reason = prompt('请输入漏检原因：');
    if (reason) {
      try {
        await checkupAPI.skip(recordId, reason);
        setMessage({ type: 'success', text: '已标记为漏检' });
        loadRecords(selectedAppointment.id);
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-gray',
      sampled: 'badge-info',
      testing: 'badge-warning',
      completed: 'badge-success',
      skipped: 'badge-danger'
    };
    return badges[status] || 'badge-gray';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待检查',
      sampled: '已采样',
      testing: '检验中',
      completed: '已完成',
      skipped: '漏检'
    };
    return texts[status] || status;
  };

  return (
    <div>
      <h2 className="page-title">体检执行</h2>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
        <div className="card">
          <h3 className="mb-4">待体检列表</h3>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {appointments.map(apt => (
              <div
                key={apt.id}
                className={`check-item ${selectedAppointment?.id === apt.id ? 'abnormal' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => handleSelectAppointment(apt)}
              >
                <div className="check-item-header">
                  <div className="check-item-name">{apt.customer_name}</div>
                  <div className="check-item-range">
                    {apt.appointment_no} | {apt.package_name}
                  </div>
                </div>
                <span className={`badge status-${apt.status}`}>
                  {apt.status === 'checked_in' ? '体检中' : '已完成'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4">检查项目</h3>
          {selectedAppointment ? (
            <>
              <div className="mb-4" style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '6px' }}>
                <p><strong>客户：</strong>{selectedAppointment.customer_name} | <strong>套餐：</strong>{selectedAppointment.package_name}</p>
              </div>

              <div className="item-list">
                {records.map(record => (
                  <div key={record.id} className="item-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 200px' }}>
                    <div>
                      <div className="font-bold">{record.item_name} {record.is_key && <span className="badge badge-danger">关键</span>}</div>
                      <div className="text-xs text-gray">{record.category}</div>
                    </div>
                    <div className="text-sm text-gray">{record.reference_range}</div>
                    <div className="text-sm text-gray">{record.unit}</div>
                    <span className={`badge ${getStatusBadge(record.status)}`}>
                      {getStatusText(record.status)}
                    </span>
                    <div className="flex gap-2">
                      {record.status === 'pending' && (
                        <>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSample(record.id)}>采样</button>
                          <button className="btn btn-warning btn-sm" onClick={() => handleSkip(record.id)}>漏检</button>
                        </>
                      )}
                      {record.status === 'sampled' && (
                        <button className="btn btn-success btn-sm" onClick={() => { setEditingRecord(record); setResultForm({ result: record.result || '', is_abnormal: record.is_abnormal || false, doctor_comment: record.doctor_comment || '' }); }}>录入结果</button>
                      )}
                      {record.status === 'completed' && (
                        <div className="text-sm">
                          <span className={record.is_abnormal ? 'text-danger font-bold' : ''}>{record.result}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray">请选择一个客户查看检查项目</p>
          )}
        </div>
      </div>

      {editingRecord && (
        <div className="modal-overlay" onClick={() => setEditingRecord(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>录入检查结果 - {editingRecord.item_name}</h3>
            <div className="form-group">
              <label>参考范围</label>
              <input type="text" value={editingRecord.reference_range} disabled />
            </div>
            <div className="form-group">
              <label>检查结果 *</label>
              <input
                type="text"
                value={resultForm.result}
                onChange={e => setResultForm({ ...resultForm, result: e.target.value })}
                placeholder="请输入检查结果"
              />
            </div>
            <div className="form-group">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={resultForm.is_abnormal}
                  onChange={e => setResultForm({ ...resultForm, is_abnormal: e.target.checked })}
                />
                结果异常
              </label>
            </div>
            <div className="form-group">
              <label>医生意见</label>
              <textarea
                rows="3"
                value={resultForm.doctor_comment}
                onChange={e => setResultForm({ ...resultForm, doctor_comment: e.target.value })}
                placeholder="请输入医生意见"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setEditingRecord(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleResultSubmit}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkup;
