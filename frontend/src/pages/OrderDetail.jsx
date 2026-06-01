import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api.js';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ status: '', processor: '', notes: '' });

  const statusMap = {
    ordered: { label: '已下单', badge: 'badge-warning' },
    lens_arrived: { label: '镜片到货', badge: 'badge-info' },
    processing: { label: '加工中', badge: 'badge-primary' },
    quality_check: { label: '质检中', badge: 'badge-info' },
    ready: { label: '待取镜', badge: 'badge-success' },
    completed: { label: '已完成', badge: 'badge-success' },
    cancelled: { label: '已取消', badge: 'badge-error' },
  };

  const processingLabels = {
    ordered: '订单已创建',
    lens_arrived: '镜片到货',
    processing: '开始加工',
    quality_check: '质量检查',
    ready: '待取镜',
    completed: '已取镜/完成',
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    const res = await api.get(`/orders/${id}`);
    setOrder(res.data);
    setPaidAmount(res.data.paid_amount || '');
  };

  const handlePayment = async () => {
    if (!confirm('确认更新支付金额吗？')) return;
    await api.put(`/orders/${id}/payment`, { paid_amount: parseFloat(paidAmount) || 0 });
    alert('支付金额已更新');
    loadOrder();
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    await api.put(`/orders/${id}/status`, statusForm);
    alert('状态已更新');
    setShowStatusModal(false);
    loadOrder();
  };

  if (!order) return <div>加载中...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-default" onClick={() => navigate(-1)}>← 返回</button>
          <h2>订单 {order.order_no}</h2>
          <span className={`badge ${statusMap[order.status]?.badge || 'badge-info'}`}>
            {statusMap[order.status]?.label || order.status}
          </span>
        </div>
        <button className="btn btn-primary" onClick={() => setShowStatusModal(true)}>更新状态</button>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">订单信息</div>
          <div style={{ lineHeight: 2.5 }}>
            <div>客户：<Link to={`/customers/${order.customer_id}`}>{order.customer_name}</Link></div>
            <div>手机号：{order.customer_phone}</div>
            <div>销售员：{order.salesperson || '-'}</div>
            <div>预计交付：{order.delivery_date?.split('T')[0] || '-'}</div>
            <div>创建时间：{order.created_at}</div>
            <div>备注：{order.notes || '-'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">价格信息</div>
          <div style={{ lineHeight: 2.5 }}>
            <div>镜架：{order.frame_name || '-'} <span style={{ float: 'right' }}>¥{order.frame_price}</span></div>
            <div>镜片：{order.lens_name || '-'} <span style={{ float: 'right' }}>¥{order.lens_price}</span></div>
            <div>优惠：<span style={{ float: 'right', color: '#f5222d' }}>-¥{order.discount}</span></div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: 8, marginTop: 8 }}>
              <strong>应收：</strong>
              <span style={{ float: 'right', color: '#f5222d', fontSize: 18, fontWeight: 'bold' }}>¥{order.total_amount}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <strong>已付：</strong>
              <span style={{ float: 'right' }}>¥{order.paid_amount || 0}</span>
            </div>
            <div style={{ clear: 'both', paddingTop: 16 }}>
              <div className="form-group" style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label>录入支付</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={e => setPaidAmount(e.target.value)}
                    placeholder="输入已付金额"
                  />
                </div>
                <button className="btn btn-success" onClick={handlePayment}>确认</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {order.optometry && (
        <div className="card">
          <div className="card-title">验光处方</div>
          <div className="grid-2">
            <div>
              <strong>右眼 (OD)</strong>
              <div style={{ lineHeight: 2, marginTop: 8 }}>
                <div>球镜：{order.optometry.sphere_od || '-'}</div>
                <div>柱镜：{order.optometry.cylinder_od || '-'}</div>
                <div>轴位：{order.optometry.axis_od || '-'}</div>
                <div>矫正视力：{order.optometry.corrected_vision_od || '-'}</div>
              </div>
            </div>
            <div>
              <strong>左眼 (OS)</strong>
              <div style={{ lineHeight: 2, marginTop: 8 }}>
                <div>球镜：{order.optometry.sphere_os || '-'}</div>
                <div>柱镜：{order.optometry.cylinder_os || '-'}</div>
                <div>轴位：{order.optometry.axis_os || '-'}</div>
                <div>矫正视力：{order.optometry.corrected_vision_os || '-'}</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            瞳距：{order.optometry.pd || '-'} mm | 验光师：{order.optometry.optometrist}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">加工流程</div>
        <div className="timeline">
          {order.processing?.map((p, i) => (
            <div key={p.id} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <strong>{processingLabels[p.status] || p.status}</strong>
                {p.processor && <span style={{ marginLeft: 12 }}>处理人：{p.processor}</span>}
                {p.notes && <div style={{ color: '#666', marginTop: 4 }}>{p.notes}</div>}
                <div className="timeline-time">{p.created_at}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showStatusModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 400 }}>
            <div className="card-title">更新订单状态</div>
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label>新状态 *</label>
                <select
                  required
                  value={statusForm.status}
                  onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="">请选择</option>
                  {Object.entries(statusMap).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>处理人</label>
                <input
                  value={statusForm.processor}
                  onChange={e => setStatusForm({ ...statusForm, processor: e.target.value })}
                  placeholder="请输入处理人姓名"
                />
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea
                  value={statusForm.notes}
                  onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                  rows="3"
                  placeholder="状态变更备注"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-default" onClick={() => setShowStatusModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
