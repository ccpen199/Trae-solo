import React, { useState, useEffect } from 'react';
import { getAppointments, getAppointment, checkInAppointment, startService, completeAppointment, cancelAppointment, markNoShow, rescheduleAppointment, getServiceAvailability } from '../api.js';
import dayjs from 'dayjs';

const statusLabels = {
  pending: '待确认',
  confirmed: '已确认',
  checked_in: '已签到',
  in_service: '服务中',
  completed: '已完成',
  rescheduled: '已改约',
  cancelled: '已取消',
  no_show: '爽约',
  late: '迟到'
};

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    store_id: ''
  });
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [completeForm, setCompleteForm] = useState({ content: '', materials: '', additional_services: '', additional_price: 0 });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', staff_id: null });
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [filters]);

  async function loadAppointments() {
    try {
      setLoading(true);
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.status) params.status = filters.status;
      if (filters.store_id) params.store_id = filters.store_id;
      const data = await getAppointments(params);
      setAppointments(data);
    } catch (err) {
      console.error('加载预约失败', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn(id) {
    if (!confirm('确认签到？')) return;
    try {
      await checkInAppointment(id);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  }

  async function handleStartService(id) {
    if (!confirm('确认开始服务？')) return;
    try {
      await startService(id);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  }

  async function handleComplete() {
    try {
      await completeAppointment(selectedAppointment.id, completeForm);
      setShowCompleteModal(false);
      loadAppointments();
      setCompleteForm({ content: '', materials: '', additional_services: '', additional_price: 0 });
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  }

  async function handleCancel() {
    try {
      await cancelAppointment(selectedAppointment.id, { reason: cancelReason });
      setShowCancelModal(false);
      setCancelReason('');
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  }

  async function handleNoShow(id) {
    if (!confirm('确认标记为爽约？')) return;
    try {
      await markNoShow(id);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  }

  async function openDetailModal(appointment) {
    try {
      const fullDetail = await getAppointment(appointment.id);
      setSelectedAppointment(fullDetail);
      setShowDetailModal(true);
    } catch (err) {
      console.error('加载详情失败', err);
      setSelectedAppointment(appointment);
      setShowDetailModal(true);
    }
  }

  function closeDetailModal() {
    setShowDetailModal(false);
    setShowCancelModal(false);
    setShowCompleteModal(false);
    setShowRescheduleModal(false);
    setCancelReason('');
    setCompleteForm({ content: '', materials: '', additional_services: '', additional_price: 0 });
    setRescheduleData({ date: '', time: '', staff_id: null });
    setAvailability(null);
  }

  async function loadAvailabilityForReschedule() {
    if (!selectedAppointment?.service_id || !rescheduleData.date || !selectedAppointment?.store_id) return;
    try {
      const data = await getServiceAvailability(selectedAppointment.service_id, {
        date: rescheduleData.date,
        store_id: selectedAppointment.store_id
      });
      setAvailability(data);
    } catch (err) {
      console.error('加载可用时段失败', err);
    }
  }

  useEffect(() => {
    if (showRescheduleModal && selectedAppointment && rescheduleData.date) {
      loadAvailabilityForReschedule();
    }
  }, [showRescheduleModal, rescheduleData.date]);

  async function handleReschedule() {
    if (!rescheduleData.time || !rescheduleData.staff_id) {
      alert('请选择时间和技师');
      return;
    }
    const slot = availability.slots.find(s => s.start === rescheduleData.time);
    try {
      await rescheduleAppointment(selectedAppointment.id, {
        appointment_date: rescheduleData.date,
        start_time: rescheduleData.time,
        end_time: slot.end,
        staff_id: rescheduleData.staff_id
      });
      setShowRescheduleModal(false);
      setRescheduleData({ date: '', time: '', staff_id: null });
      setAvailability(null);
      loadAppointments();
    } catch (err) {
      alert(err.response?.data?.error || '操作失败');
    }
  }

  function canCheckIn(status) {
    return ['confirmed', 'rescheduled'].includes(status);
  }

  function canStartService(status) {
    return ['checked_in', 'late'].includes(status);
  }

  function canComplete(status) {
    return status === 'in_service';
  }

  function canCancel(status) {
    return ['pending', 'confirmed', 'rescheduled'].includes(status);
  }

  function canReschedule(status) {
    return ['pending', 'confirmed', 'rescheduled'].includes(status);
  }

  return (
    <div>
      <h1 className="page-title">预约管理</h1>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label className="form-label">日期</label>
            <input type="date" className="form-input" value={filters.date} onChange={e => setFilters({ ...filters, date: e.target.value })} />
          </div>
          <div className="filter-item">
            <label className="form-label">状态</label>
            <select className="form-select" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">全部</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div className="filter-item">
            <button className="btn btn-secondary" onClick={loadAppointments}>刷新</button>
          </div>
        </div>

        {loading ? (
          <div>加载中...</div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">暂无预约记录</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>预约号</th>
                <th>时间</th>
                <th>顾客</th>
                <th>服务</th>
                <th>技师</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(apt => (
                <tr key={apt.id}>
                  <td>#{apt.id}</td>
                  <td>{apt.appointment_date} {apt.start_time}</td>
                  <td>{apt.customer_name}<br /><small style={{ color: '#6b7280' }}>{apt.customer_phone}</small></td>
                  <td>{apt.service_name}</td>
                  <td>{apt.staff_name}</td>
                  <td><span className={`badge badge-${apt.status}`}>{statusLabels[apt.status]}</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-sm btn-secondary" onClick={() => openDetailModal(apt)}>详情</button>
                      {canCheckIn(apt.status) && (
                        <button className="btn btn-sm btn-success" onClick={() => handleCheckIn(apt.id)}>签到</button>
                      )}
                      {canStartService(apt.status) && (
                        <button className="btn btn-sm btn-primary" onClick={() => handleStartService(apt.id)}>开始服务</button>
                      )}
                      {canComplete(apt.status) && (
                        <button className="btn btn-sm btn-success" onClick={() => { setSelectedAppointment(apt); setShowCompleteModal(true); }}>完成</button>
                      )}
                      {canReschedule(apt.status) && (
                        <button className="btn btn-sm btn-warning" onClick={() => { setSelectedAppointment(apt); setRescheduleData({ ...rescheduleData, date: apt.appointment_date }); setShowRescheduleModal(true); }}>改约</button>
                      )}
                      {canCancel(apt.status) && (
                        <button className="btn btn-sm btn-danger" onClick={async () => { 
                          try { const full = await getAppointment(apt.id); setSelectedAppointment(full); } 
                          catch { setSelectedAppointment(apt); }
                          setShowCancelModal(true); 
                        }}>取消</button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button className="btn btn-sm btn-danger" onClick={() => handleNoShow(apt.id)}>爽约</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDetailModal && selectedAppointment && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">预约详情 #{selectedAppointment.id}</h3>
              <button className="modal-close" onClick={closeDetailModal}>×</button>
            </div>
            <div>
              <p><strong>状态：</strong><span className={`badge badge-${selectedAppointment.status}`}>{statusLabels[selectedAppointment.status]}</span></p>
              <p><strong>顾客：</strong>{selectedAppointment.customer_name} ({selectedAppointment.customer_phone})</p>
              <p><strong>服务：</strong>{selectedAppointment.service_name}</p>
              <p><strong>门店：</strong>{selectedAppointment.store_name}</p>
              <p><strong>地址：</strong>{selectedAppointment.store_address || '暂无'}</p>
              <p><strong>技师：</strong>{selectedAppointment.staff_name}</p>
              <p><strong>时间：</strong>{selectedAppointment.appointment_date} {selectedAppointment.start_time} - {selectedAppointment.end_time}</p>
              <p><strong>时长：</strong>{selectedAppointment.service_duration || '未知'}分钟</p>
              <p><strong>价格：</strong>¥{selectedAppointment.total_price}</p>
              {selectedAppointment.notes && <p><strong>备注：</strong>{selectedAppointment.notes}</p>}
              
              {selectedAppointment.cancellation_rule && (
                <p style={{ color: '#f59e0b', marginTop: '0.5rem' }}><strong>取消规则：</strong>{selectedAppointment.cancellation_rule}</p>
              )}
              
              {selectedAppointment.cancel_reason && (
                <p style={{ color: '#ef4444', marginTop: '0.5rem' }}><strong>取消原因：</strong>{selectedAppointment.cancel_reason}</p>
              )}
              {selectedAppointment.cancelled_at && (
                <p style={{ color: '#ef4444' }}><strong>取消时间：</strong>{selectedAppointment.cancelled_at}</p>
              )}
              
              {selectedAppointment.reminders && selectedAppointment.reminders.length > 0 && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <h4>提醒记录</h4>
                  {selectedAppointment.reminders.map((r, i) => (
                    <p key={i} style={{ fontSize: '0.9rem', color: '#6b7280', margin: '0.25rem 0' }}>
                      • {r.type === 'booking' ? '预约成功' : r.type === 'reschedule' ? '改约提醒' : r.type === 'cancel' ? '取消通知' : r.type} - {r.created_at}
                    </p>
                  ))}
                </div>
              )}
              
              {selectedAppointment.serviceRecord && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <h4>服务记录</h4>
                  <p><strong>内容：</strong>{selectedAppointment.serviceRecord.content}</p>
                  <p><strong>耗材：</strong>{selectedAppointment.serviceRecord.materials}</p>
                  <p><strong>追加项目：</strong>{selectedAppointment.serviceRecord.additional_services || '无'}</p>
                  {selectedAppointment.serviceRecord.additional_price > 0 && (
                    <p style={{ color: '#f59e0b' }}><strong>追加费用：</strong>¥{selectedAppointment.serviceRecord.additional_price}</p>
                  )}
                  {selectedAppointment.serviceRecord.photos && (
                    <p><strong>照片：</strong>{selectedAppointment.serviceRecord.photos}</p>
                  )}
                </div>
              )}
              
              {selectedAppointment.review && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                  <h4>服务评价</h4>
                  <p><strong>评分：</strong>{'⭐'.repeat(selectedAppointment.review.rating)}</p>
                  <p><strong>评价：</strong>{selectedAppointment.review.comment}</p>
                </div>
              )}
              
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#6b7280' }}>
                <p><strong>状态流转审计：</strong></p>
                <p>• 创建时间：{selectedAppointment.created_at}</p>
                {selectedAppointment.arrived_at && <p>• 签到时间：{selectedAppointment.arrived_at}</p>}
                {selectedAppointment.completed_at && <p>• 完成时间：{selectedAppointment.completed_at}</p>}
                {selectedAppointment.cancelled_at && <p>• 取消时间：{selectedAppointment.cancelled_at}</p>}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeDetailModal}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">取消预约 #{selectedAppointment.id}</h3>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>×</button>
            </div>
            {selectedAppointment.cancellation_rule && (
              <div style={{ padding: '0.75rem', background: '#fffbeb', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', color: '#92400e' }}>
                <strong>取消规则：</strong>{selectedAppointment.cancellation_rule}
              </div>
            )}
            <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              <p><strong>服务：</strong>{selectedAppointment.service_name}</p>
              <p><strong>时间：</strong>{selectedAppointment.appointment_date} {selectedAppointment.start_time}</p>
              <p><strong>费用：</strong>¥{selectedAppointment.total_price}</p>
            </div>
            <div className="form-group">
              <label className="form-label">取消原因 *</label>
              <select className="form-select" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                <option value="">请选择原因</option>
                <option value="顾客原因">顾客原因</option>
                <option value="时间冲突">时间冲突</option>
                <option value="改期">改期</option>
                <option value="门店原因">门店原因</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>返回</button>
              <button className="btn btn-danger" onClick={handleCancel} disabled={!cancelReason}>确认取消并记录</button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowCompleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">完成服务</h3>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">服务内容</label>
              <textarea className="form-textarea" value={completeForm.content} onChange={e => setCompleteForm({ ...completeForm, content: e.target.value })} placeholder="请记录服务内容" />
            </div>
            <div className="form-group">
              <label className="form-label">使用耗材</label>
              <input className="form-input" value={completeForm.materials} onChange={e => setCompleteForm({ ...completeForm, materials: e.target.value })} placeholder="请记录使用的耗材" />
            </div>
            <div className="form-group">
              <label className="form-label">追加服务项目</label>
              <input className="form-input" value={completeForm.additional_services} onChange={e => setCompleteForm({ ...completeForm, additional_services: e.target.value })} placeholder="选填" />
            </div>
            <div className="form-group">
              <label className="form-label">追加费用 (元)</label>
              <input type="number" className="form-input" value={completeForm.additional_price} onChange={e => setCompleteForm({ ...completeForm, additional_price: Number(e.target.value) })} />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCompleteModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleComplete}>确认完成</button>
            </div>
          </div>
        </div>
      )}

      {showRescheduleModal && selectedAppointment && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">改约</h3>
              <button className="modal-close" onClick={() => setShowRescheduleModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">选择日期</label>
              <input type="date" className="form-input" value={rescheduleData.date} onChange={e => { setRescheduleData({ ...rescheduleData, date: e.target.value, time: '', staff_id: null }); setAvailability(null); }} min={dayjs().format('YYYY-MM-DD')} />
            </div>
            {availability && (
              <>
                <div className="form-group">
                  <label className="form-label">选择时段</label>
                  <div className="time-slots">
                    {availability.slots.map((slot, i) => (
                      <div
                        key={i}
                        className={`time-slot ${!slot.available ? 'disabled' : ''} ${rescheduleData.time === slot.start ? 'selected' : ''}`}
                        onClick={() => slot.available && setRescheduleData({ ...rescheduleData, time: slot.start, staff_id: null })}
                      >
                        {slot.start}
                        <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                          {slot.available_staff.length}人可用
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {rescheduleData.time && (
                  <div className="form-group">
                    <label className="form-label">选择技师</label>
                    <div className="checkbox-group">
                      {availability.slots.find(s => s.start === rescheduleData.time)?.available_staff.map(staff => (
                        <label key={staff.id} className="checkbox-item" style={{ padding: '0.5rem 1rem', border: rescheduleData.staff_id === staff.id ? '2px solid #2563eb' : '1px solid #e5e7eb', borderRadius: '8px', background: rescheduleData.staff_id === staff.id ? '#eff6ff' : 'white' }}>
                          <input type="radio" name="reschedule-staff" checked={rescheduleData.staff_id === staff.id} onChange={() => setRescheduleData({ ...rescheduleData, staff_id: staff.id })} style={{ display: 'none' }} />
                          <span>{staff.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRescheduleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleReschedule} disabled={!rescheduleData.date || !rescheduleData.time || !rescheduleData.staff_id}>确认改约</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
