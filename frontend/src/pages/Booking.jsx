import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServices, getStores, getServiceAvailability, createAppointment } from '../api.js';
import dayjs from 'dayjs';

function Booking() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [availability, setAvailability] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [availLoading, setAvailLoading] = useState(false);
  const [error, setError] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(dayjs());
  const [successId, setSuccessId] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadAvailability = useCallback(async () => {
    if (!selectedService || !selectedStore || !selectedDate) return;
    try {
      setAvailLoading(true);
      const data = await getServiceAvailability(selectedService, {
        date: selectedDate,
        store_id: selectedStore
      });
      setAvailability(data);
      setSelectedSlot(null);
      setSelectedStaff(null);
    } catch (err) {
      console.error('加载可用时段失败', err);
      setAvailability(null);
    } finally {
      setAvailLoading(false);
    }
  }, [selectedService, selectedStore, selectedDate]);

  useEffect(() => {
    if (step === 2 && selectedService && selectedStore && selectedDate) {
      loadAvailability();
    }
  }, [step, selectedDate, loadAvailability]);

  async function loadInitialData() {
    try {
      setLoading(true);
      const [servicesData, storesData] = await Promise.all([
        getServices(),
        getStores()
      ]);
      setServices(servicesData);
      setStores(storesData);
      if (storesData.length > 0) setSelectedStore(storesData[0].id);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!selectedStaff) {
      setError('请选择技师');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const result = await createAppointment({
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        service_id: selectedService,
        store_id: selectedStore,
        staff_id: selectedStaff,
        appointment_date: selectedDate,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end,
        notes: customerInfo.notes
      });
      setSuccessId(result.id);
    } catch (err) {
      setError(err.response?.data?.error || '预约失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  function handleNextStep() {
    if (step === 1) {
      if (!selectedService) {
        setError('请先点击选择一个服务项目');
        return;
      }
      if (!selectedStore) {
        setError('请先选择门店');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!selectedSlot || !selectedStaff) {
        setError('请先选择时段和技师');
        return;
      }
      setError('');
      setStep(3);
    }
  }

  function handlePrevStep() {
    setError('');
    if (step > 1) setStep(step - 1);
  }

  function handleSelectService(id) {
    setSelectedService(id);
    setError('');
  }

  function renderCalendar() {
    const startOfMonth = calendarMonth.startOf('month');
    const endOfMonth = calendarMonth.endOf('month');
    const startDay = startOfMonth.day();
    const daysInMonth = endOfMonth.date();
    const today = dayjs();

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(calendarMonth.date(i));
    }

    return (
      <div className="calendar">
        <div className="calendar-header">
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setCalendarMonth(calendarMonth.subtract(1, 'month'))}>
            上月
          </button>
          <span style={{ fontWeight: 600 }}>{calendarMonth.format('YYYY年MM月')}</span>
          <button type="button" className="btn btn-sm btn-secondary" onClick={() => setCalendarMonth(calendarMonth.add(1, 'month'))}>
            下月
          </button>
        </div>
        <div className="calendar-grid">
          {weekdays.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
          {days.map((day, i) => {
            const isDisabled = !day || day.isBefore(today, 'day');
            const isSelected = day && day.format('YYYY-MM-DD') === selectedDate;
            const isToday = day && day.isSame(today, 'day');
            return (
              <div
                key={i}
                className={`calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => !isDisabled && setSelectedDate(day.format('YYYY-MM-DD'))}
              >
                {day?.date()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (loading && services.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;
  }

  if (successId) {
    return (
      <div>
        <h1 className="page-title">预约成功</h1>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ marginBottom: '1rem' }}>预约单 #{successId} 已生成</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>您的预约已确认，请按时到店</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/appointments')}>
              查看预约管理
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => {
              setStep(1);
              setSelectedService(null);
              setSelectedSlot(null);
              setSelectedStaff(null);
              setCustomerInfo({ name: '', phone: '', notes: '' });
              setSuccessId(null);
              setError('');
            }}>
              继续预约
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedServiceData = services.find(s => s.id === selectedService);
  const selectedStoreData = stores.find(s => s.id === selectedStore);

  return (
    <div>
      <h1 className="page-title">在线预约</h1>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', fontSize: '0.9rem' }}>
          <span style={{ fontWeight: 600, color: step === 1 ? '#2563eb' : '#6b7280' }}>① 选择服务</span>
          <span style={{ color: '#9ca3af' }}>→</span>
          <span style={{ fontWeight: 600, color: step === 2 ? '#2563eb' : '#6b7280' }}>② 选择时间</span>
          <span style={{ color: '#9ca3af' }}>→</span>
          <span style={{ fontWeight: 600, color: step === 3 ? '#2563eb' : '#6b7280' }}>③ 填写信息</span>
          {selectedServiceData && (
            <span style={{ marginLeft: 'auto', color: '#2563eb' }}>
              已选: {selectedServiceData.name} · ¥{selectedServiceData.price}
            </span>
          )}
        </div>

        {step === 1 && (
          <div>
            <div className="form-group">
              <label className="form-label">选择门店</label>
              <select className="form-select" value={selectedStore || ''} onChange={e => setSelectedStore(Number(e.target.value))}>
                <option value="">请选择门店</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name} - {store.address}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">点击选择服务项目</label>
              <div className="services-grid">
                {services.map(service => (
                  <div
                    key={service.id}
                    className={`service-card ${selectedService === service.id ? 'selected' : ''}`}
                    onClick={() => handleSelectService(service.id)}
                    style={{ position: 'relative' }}
                  >
                    {selectedService === service.id && (
                      <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: '#2563eb', color: 'white', borderRadius: '50%', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>✓</div>
                    )}
                    <div className="service-name">{service.name}</div>
                    <div className="service-meta">
                      <span>{service.duration}分钟</span>
                      <span className="service-price">¥{service.price}</span>
                    </div>
                    {service.description && <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>{service.description}</p>}
                    {service.preparation && <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '0.25rem' }}>准备: {service.preparation}</p>}
                    {service.cancellation_rule && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.25rem' }}>取消: {service.cancellation_rule}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                下一步：选择时间 →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <h3 style={{ marginBottom: '1rem' }}>预约日历</h3>
                {renderCalendar()}
              </div>
              <div>
                <h3 style={{ marginBottom: '1rem' }}>可用时段 · 技师档期 · 门店容量</h3>
                {availLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>加载时段中...</div>
                ) : availability ? (
                  <div>
                    <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                      <strong>{selectedDate}</strong> | {availability.store?.name} | 门店容量 {availability.store?.capacity} | 服务时长 {selectedServiceData?.duration}分钟
                    </div>
                    {availability.slots && availability.slots.length > 0 ? (
                      <div className="time-slots">
                        {availability.slots.map((slot, i) => (
                          <div
                            key={i}
                            className={`time-slot ${!slot.available ? 'disabled' : ''} ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
                            onClick={() => slot.available && setSelectedSlot(slot)}
                          >
                            {slot.start}
                            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                              {!slot.available ? '⚠已满/冲突' : `${slot.available_staff.length}人可约`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">该日期无可用时段</div>
                    )}

                    {selectedSlot && selectedSlot.available_staff && selectedSlot.available_staff.length > 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.5rem' }}>选择技师</h4>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {selectedSlot.available_staff.map(staff => (
                            <label key={staff.id} style={{
                              padding: '0.5rem 1rem',
                              border: selectedStaff === staff.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                              borderRadius: '8px',
                              background: selectedStaff === staff.id ? '#eff6ff' : 'white',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <input type="radio" name="staff" checked={selectedStaff === staff.id} onChange={() => setSelectedStaff(staff.id)} />
                              <span>{staff.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.85rem', color: '#6b7280' }}>
                      门店容量: {selectedSlot ? `${selectedSlot.capacity_used}/${selectedSlot.capacity_total} 已占用` : '请选择时段查看'}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">时段加载中，请稍候...</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handlePrevStep}>← 上一步</button>
              <button type="button" className="btn btn-primary" onClick={handleNextStep}>
                下一步：填写信息 →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="card" style={{ background: '#f0f9ff', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>预约信息确认</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <p><strong>服务：</strong>{selectedServiceData?.name}</p>
                <p><strong>门店：</strong>{selectedStoreData?.name}</p>
                <p><strong>时间：</strong>{selectedDate} {selectedSlot?.start} - {selectedSlot?.end}</p>
                <p><strong>技师：</strong>{selectedSlot?.available_staff?.find(s => s.id === selectedStaff)?.name}</p>
                <p><strong>时长：</strong>{selectedServiceData?.duration}分钟</p>
                <p><strong>价格：</strong>¥{selectedServiceData?.price}</p>
              </div>
              {selectedServiceData?.cancellation_rule && (
                <p style={{ color: '#f59e0b', marginTop: '0.75rem', padding: '0.5rem', background: '#fffbeb', borderRadius: '6px' }}><strong>⚠ 取消规则：</strong>{selectedServiceData.cancellation_rule}</p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">姓名 *</label>
                <input className="form-input" value={customerInfo.name} onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder="请输入姓名" />
              </div>
              <div className="form-group">
                <label className="form-label">手机号 *</label>
                <input className="form-input" value={customerInfo.phone} onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} placeholder="请输入手机号" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea className="form-textarea" value={customerInfo.notes} onChange={e => setCustomerInfo({ ...customerInfo, notes: e.target.value })} placeholder="选填" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" className="btn btn-secondary" onClick={handlePrevStep}>← 上一步</button>
              <button type="button" className="btn btn-primary" disabled={!customerInfo.name || !customerInfo.phone || loading} onClick={handleSubmit}>
                {loading ? '提交中...' : '确认预约'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Booking;
