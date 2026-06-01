import React, { useState, useEffect } from 'react';
import { appointmentAPI, packageAPI, timeslotAPI } from '../api.js';

function Appointments({ user }) {
  const [appointments, setAppointments] = useState([]);
  const [packages, setPackages] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [customerPhone, setCustomerPhone] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_id_card: '',
    gender: '',
    age: '',
    package_id: '',
    time_slot_id: '',
    selectedDate: new Date().toISOString().split('T')[0]
  });

  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (formData.selectedDate && formData.package_id) {
      timeslotAPI.getAvailable(formData.selectedDate, formData.package_id)
        .then(res => setAvailableSlots(res.data))
        .catch(() => setAvailableSlots([]));
    }
  }, [formData.selectedDate, formData.package_id]);

  const loadData = async () => {
    try {
      const [aptRes, pkgRes] = await Promise.all([
        appointmentAPI.getAll(activeTab === 'all' ? null : activeTab),
        packageAPI.getPublished()
      ]);
      setAppointments(aptRes.data);
      setPackages(pkgRes.data);
    } catch (err) {
      setMessage({ type: 'error', text: '加载数据失败' });
    }
  };

  const loadDetail = async (id) => {
    try {
      const res = await appointmentAPI.get(id);
      setShowDetail(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: '加载详情失败' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await appointmentAPI.create(formData);
      setMessage({ type: 'success', text: '预约成功' });
      loadData();
      setShowModal(false);
      setFormData({
        customer_name: '',
        customer_phone: '',
        customer_id_card: '',
        gender: '',
        age: '',
        package_id: '',
        time_slot_id: '',
        selectedDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '预约失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      switch (action) {
        case 'pay':
          await appointmentAPI.pay(id);
          setMessage({ type: 'success', text: '支付成功' });
          break;
        case 'checkin':
          await appointmentAPI.checkin(id);
          setMessage({ type: 'success', text: '签到成功' });
          break;
        case 'cancel':
          const reason = prompt('请输入取消原因：');
          if (reason !== null) {
            await appointmentAPI.cancel(id, reason);
            setMessage({ type: 'success', text: '取消成功' });
          }
          break;
        case 'noshow':
          await appointmentAPI.markNoShow(id);
          setMessage({ type: 'success', text: '已标记为爽约' });
          break;
        case 'refund':
          await appointmentAPI.refund(id);
          setMessage({ type: 'success', text: '退款成功' });
          break;
      }
      loadData();
      if (showDetail?.id === id) loadDetail(id);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || '操作失败' });
    }
  };

  const handleSearchByPhone = async () => {
    if (!customerPhone) {
      loadData();
      return;
    }
    try {
      const res = await appointmentAPI.getAll(activeTab === 'all' ? null : activeTab);
      const filtered = res.data.filter(apt => 
        apt.phone.includes(customerPhone) ||
        apt.customer_name.includes(customerPhone) ||
        apt.appointment_no.includes(customerPhone) ||
        apt.package_name.includes(customerPhone)
      );
      setAppointments(filtered);
    } catch (err) {
      setMessage({ type: 'error', text: '查询失败' });
    }
  };

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'confirmed', label: '待签到' },
    { key: 'checked_in', label: '体检中' },
    { key: 'completed', label: '已完成' },
    { key: 'cancelled', label: '已取消' }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="page-title" style={{ margin: 0 }}>预约管理</h2>
        {user.role !== 'customer' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + 新建预约
          </button>
        )}
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <div className="tabs">
            {tabs.map(tab => (
              <div
                key={tab.key}
                className={`tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索手机号/客户名/预约号/套餐"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearchByPhone()}
              style={{ width: 240 }}
            />
            <button className="btn btn-secondary" onClick={handleSearchByPhone}>搜索</button>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>预约号</th>
              <th>客户</th>
              <th>套餐</th>
              <th>日期时间</th>
              <th>状态</th>
              <th>支付</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map(apt => (
              <tr key={apt.id}>
                <td>{apt.appointment_no}</td>
                <td>
                  <div className="font-bold">{apt.customer_name}</div>
                  <div className="text-xs text-gray">{apt.phone}</div>
                </td>
                <td>{apt.package_name}</td>
                <td>
                  <div>{apt.date}</div>
                  <div className="text-xs text-gray">{apt.time}</div>
                </td>
                <td>
                  <span className={`badge status-${apt.status}`}>
                    {getStatusText(apt.status)}
                  </span>
                </td>
                <td>
                  <span className={`badge ${apt.payment_status === 'paid' ? 'badge-success' : apt.payment_status === 'refunded' ? 'badge-warning' : 'badge-gray'}`}>
                    {apt.payment_status === 'paid' ? '已支付' : apt.payment_status === 'refunded' ? '已退款' : '未支付'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => loadDetail(apt.id)}>详情</button>
                  {apt.status === 'confirmed' && apt.payment_status === 'unpaid' && user.role !== 'customer' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleAction(apt.id, 'pay')}>支付</button>
                  )}
                  {apt.status === 'confirmed' && apt.payment_status === 'paid' && user.role !== 'customer' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleAction(apt.id, 'checkin')}>签到</button>
                  )}
                  {apt.status === 'confirmed' && (
                    <button className="btn btn-warning btn-sm" onClick={() => handleAction(apt.id, 'cancel')}>取消</button>
                  )}
                  {apt.status === 'confirmed' && user.role !== 'customer' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleAction(apt.id, 'noshow')}>爽约</button>
                  )}
                  {apt.payment_status === 'paid' && apt.status !== 'checked_in' && apt.status !== 'completed' && user.role === 'admin' && (
                    <button className="btn btn-warning btn-sm" onClick={() => handleAction(apt.id, 'refund')}>退款</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>新建预约</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>客户姓名 *</label>
                  <input
                    type="text"
                    required
                    value={formData.customer_name}
                    onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>手机号 *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customer_phone}
                    onChange={e => setFormData({ ...formData, customer_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>身份证号</label>
                  <input
                    type="text"
                    value={formData.customer_id_card}
                    onChange={e => setFormData({ ...formData, customer_id_card: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>性别</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="">请选择</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>选择套餐 *</label>
                <select
                  required
                  value={formData.package_id}
                  onChange={e => setFormData({ ...formData, package_id: e.target.value })}
                >
                  <option value="">请选择套餐</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - ¥{pkg.price}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>选择日期 *</label>
                  <input
                    type="date"
                    required
                    value={formData.selectedDate}
                    onChange={e => setFormData({ ...formData, selectedDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>选择时间 *</label>
                  <select
                    required
                    value={formData.time_slot_id}
                    onChange={e => setFormData({ ...formData, time_slot_id: e.target.value })}
                  >
                    <option value="">请选择时间</option>
                    {availableSlots.map(slot => (
                      <option key={slot.id} value={slot.id} disabled={slot.available <= 0}>
                        {slot.time} (剩余{slot.available}个名额)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '提交中...' : '提交预约'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <h3>预约详情 - {showDetail.appointment_no}</h3>
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <div className="form-row">
                <div>
                  <p><strong>客户：</strong>{showDetail.customer_name}</p>
                  <p><strong>手机号：</strong>{showDetail.phone}</p>
                  <p><strong>套餐：</strong>{showDetail.package_name}</p>
                </div>
                <div>
                  <p><strong>日期：</strong>{showDetail.date} {showDetail.time}</p>
                  <p><strong>状态：</strong>
                    <span className={`badge status-${showDetail.status}`}>
                      {getStatusText(showDetail.status)}
                    </span>
                  </p>
                  <p><strong>支付：</strong>{showDetail.payment_status === 'paid' ? '已支付' : '未支付'}</p>
                </div>
              </div>
            </div>

            <h4 style={{ marginBottom: '12px' }}>变更记录</h4>
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>类型</th>
                  <th>变更内容</th>
                  <th>操作人</th>
                </tr>
              </thead>
              <tbody>
                {showDetail.changes?.map((change, i) => (
                  <tr key={i}>
                    <td>{change.created_at}</td>
                    <td>{change.change_type === 'status_change' ? '状态变更' : change.change_type === 'cancel' ? '取消' : '改期'}</td>
                    <td>{change.reason}</td>
                    <td>{change.operator_name || '系统'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetail(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusText(status) {
  const texts = {
    pending: '待确认',
    confirmed: '已确认',
    checked_in: '已签到',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '爽约',
    refunded: '已退款'
  };
  return texts[status] || status;
}

export default Appointments;
