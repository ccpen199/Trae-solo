import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api.js';

function OrderForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id');

  const [customers, setCustomers] = useState([]);
  const [optometryList, setOptometryList] = useState([]);
  const [frames, setFrames] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [priceInfo, setPriceInfo] = useState(null);
  const [form, setForm] = useState({
    customer_id: customerId || '',
    optometry_id: '',
    frame_id: '',
    lens_id: '',
    discount: 0,
    delivery_date: '',
    salesperson: '',
    notes: ''
  });

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (form.customer_id) {
      loadOptometry(form.customer_id);
    } else {
      setOptometryList([]);
    }
  }, [form.customer_id]);

  useEffect(() => {
    if (form.frame_id || form.lens_id) {
      calculatePrice();
    } else {
      setPriceInfo(null);
    }
  }, [form.frame_id, form.lens_id, form.discount]);

  const loadCustomers = async () => {
    const res = await api.get('/customers', { params: { pageSize: 100 } });
    setCustomers(res.data.data);
  };

  const loadOptometry = async (customerId) => {
    const res = await api.get('/optometry', { params: { customer_id: customerId, pageSize: 50 } });
    setOptometryList(res.data.data);
  };

  const loadProducts = async () => {
    const [framesRes, lensesRes] = await Promise.all([
      api.get('/products', { params: { type: 'frame', pageSize: 100 } }),
      api.get('/products', { params: { type: 'lens', pageSize: 100 } })
    ]);
    setFrames(framesRes.data.data);
    setLenses(lensesRes.data.data);
  };

  const calculatePrice = async () => {
    try {
      const res = await api.post('/orders/calculate', {
        frame_id: form.frame_id || null,
        lens_id: form.lens_id || null,
        discount: parseFloat(form.discount) || 0
      });
      setPriceInfo(res.data);
    } catch (e) {
      setPriceInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) {
      alert('请选择客户');
      return;
    }
    if (!priceInfo) {
      alert('请选择镜架或镜片');
      return;
    }

    const data = {
      ...form,
      discount: parseFloat(form.discount) || 0
    };

    await api.post('/orders', data);
    alert('订单创建成功');
    navigate('/orders');
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button className="btn btn-default" onClick={() => navigate(-1)}>← 返回</button>
        <h2>创建配镜订单</h2>
      </div>

      <div className="alert alert-warning">
        ⚠️ 订单价格由后端统一计算，前端仅作展示
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="card-title">基本信息</div>
          <div className="form-row">
            <div className="form-group">
              <label>客户 *</label>
              <select
                required
                value={form.customer_id}
                onChange={e => setForm({ ...form, customer_id: e.target.value, optometry_id: '' })}
              >
                <option value="">请选择客户</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                    {Boolean(c.is_child) && ' [儿童]'}
                    {Boolean(c.is_special) && ' [特殊]'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>验光处方</label>
              <select
                value={form.optometry_id}
                onChange={e => setForm({ ...form, optometry_id: e.target.value })}
                disabled={!form.customer_id}
              >
                <option value="">请选择验光记录</option>
                {optometryList.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.created_at?.split('T')[0]} - {o.optometrist}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>销售员</label>
              <input
                value={form.salesperson}
                onChange={e => setForm({ ...form, salesperson: e.target.value })}
                placeholder="请输入销售员姓名"
              />
            </div>
            <div className="form-group">
              <label>预计交付日期</label>
              <input
                type="date"
                value={form.delivery_date}
                onChange={e => setForm({ ...form, delivery_date: e.target.value })}
              />
            </div>
          </div>

          <div className="card-title" style={{ marginTop: 20 }}>商品选择</div>
          <div className="form-row">
            <div className="form-group">
              <label>镜架</label>
              <select
                value={form.frame_id}
                onChange={e => setForm({ ...form, frame_id: e.target.value })}
              >
                <option value="">请选择镜架</option>
                {frames.map(f => (
                  <option key={f.id} value={f.id} disabled={f.stock <= 0}>
                    {f.brand} {f.name} - ¥{f.price}
                    {f.stock <= 0 && ' [库存不足]'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>镜片</label>
              <select
                value={form.lens_id}
                onChange={e => setForm({ ...form, lens_id: e.target.value })}
              >
                <option value="">请选择镜片</option>
                {lenses.map(l => (
                  <option key={l.id} value={l.id} disabled={l.stock <= 0}>
                    {l.brand} {l.name} - ¥{l.price}
                    {l.stock <= 0 && ' [库存不足]'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>优惠金额 (元)</label>
            <input
              type="number"
              min="0"
              value={form.discount}
              onChange={e => setForm({ ...form, discount: e.target.value })}
              placeholder="输入优惠金额"
            />
          </div>

          {priceInfo && (
            <div className="card" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
              <div className="card-title">价格明细（后端计算）</div>
              <div style={{ lineHeight: 2.5 }}>
                <div>镜架价格：<span style={{ float: 'right' }}>¥{priceInfo.frame_price}</span></div>
                <div>镜片价格：<span style={{ float: 'right' }}>¥{priceInfo.lens_price}</span></div>
                <div>小计：<span style={{ float: 'right' }}>¥{priceInfo.subtotal}</span></div>
                <div>优惠：<span style={{ float: 'right', color: '#f5222d' }}>-¥{priceInfo.discount}</span></div>
                <div style={{ fontSize: 18, fontWeight: 'bold', paddingTop: 8, borderTop: '1px dashed #ccc' }}>
                  应收金额：<span style={{ float: 'right', color: '#f5222d' }}>¥{priceInfo.total_amount}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>备注</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows="3"
              placeholder="订单备注"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-default" onClick={() => navigate(-1)}>取消</button>
            <button type="submit" className="btn btn-primary" disabled={!priceInfo}>创建订单</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OrderForm;
