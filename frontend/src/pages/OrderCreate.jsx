import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function OrderCreate() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [suggestions, setSuggestions] = useState([]);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadSuggestions();
    }
  }, [selectedStore]);

  const loadStores = async () => {
    const res = await api.get('/stores');
    setStores(res.data);
    if (res.data.length > 0) {
      setSelectedStore(res.data[0].id);
    }
  };

  const loadSuggestions = async () => {
    const res = await api.get(`/orders/suggestion/${selectedStore}`, { params: { deliveryDate } });
    setSuggestions(res.data.map(s => ({ ...s, ordered_qty: s.suggested_qty, adjust_reason: '' })));
  };

  const updateQty = (idx, qty) => {
    const newItems = [...suggestions];
    const item = newItems[idx];
    const oldQty = item.ordered_qty;
    item.ordered_qty = Math.max(qty, 0);
    
    if (qty !== item.suggested_qty && !item.adjust_reason) {
      item.adjust_reason = qty > item.suggested_qty ? '超量订货' : '减少订货';
    } else if (qty === item.suggested_qty) {
      item.adjust_reason = '';
    }
    
    setSuggestions(newItems);
  };

  const updateReason = (idx, reason) => {
    const newItems = [...suggestions];
    newItems[idx].adjust_reason = reason;
    setSuggestions(newItems);
  };

  const submitOrder = async () => {
    const items = suggestions.filter(s => s.ordered_qty > 0);
    if (items.length === 0) {
      alert('请至少选择一个商品');
      return;
    }
    
    const res = await api.post('/orders', {
      store_id: selectedStore,
      delivery_date: deliveryDate,
      items: items.map(s => ({
        product_id: s.product_id,
        suggested_qty: s.suggested_qty,
        ordered_qty: s.ordered_qty,
        adjust_reason: s.adjust_reason,
        price: s.price
      })),
      remark,
      created_by: '门店系统'
    });
    
    alert('订单创建成功');
    navigate(`/orders/${res.data.id}`);
  };

  const totalAmount = suggestions.reduce((sum, s) => sum + s.ordered_qty * s.price, 0);

  return (
    <div>
      <div className="page-header">
        <h1>创建订货单</h1>
      </div>
      
      <div className="card">
        <div className="form-row">
          <div className="form-group">
            <label>门店</label>
            <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>配送日期</label>
            <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label>备注</label>
          <input value={remark} onChange={(e) => setRemark(e.target.value)} />
        </div>
      </div>
      
      <div className="card order-items">
        <h3>订货明细（系统根据历史销量、安全库存给出建议）</h3>
        <table style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>商品</th>
              <th>规格</th>
              <th>当前库存</th>
              <th>日均销量</th>
              <th>安全库存</th>
              <th>建议数量</th>
              <th>订货数量</th>
              <th>单价</th>
              <th>小计</th>
              <th>调整原因</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s, idx) => (
              <tr key={s.product_id}>
                <td>{s.product_name}</td>
                <td>{s.spec}</td>
                <td>{s.current_stock}</td>
                <td>{s.avg_sales}</td>
                <td>{s.safety_stock}</td>
                <td className="text-success">{s.suggested_qty}</td>
                <td>
                  <input 
                    type="number" 
                    value={s.ordered_qty} 
                    min="0"
                    onChange={(e) => updateQty(idx, parseFloat(e.target.value))}
                  />
                </td>
                <td>¥{s.price}</td>
                <td>¥{(s.ordered_qty * s.price).toFixed(2)}</td>
                <td>
                  <input 
                    value={s.adjust_reason} 
                    onChange={(e) => updateReason(idx, e.target.value)}
                    placeholder="调整原因"
                    style={{ width: '100px', padding: '4px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="8" style={{ textAlign: 'right', fontWeight: 'bold' }}>合计：</td>
              <td style={{ fontWeight: 'bold' }}>¥{totalAmount.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="flex gap-10">
        <button className="btn btn-primary" onClick={submitOrder}>提交订单</button>
        <button className="btn" onClick={() => navigate('/orders')}>取消</button>
      </div>
    </div>
  );
}
