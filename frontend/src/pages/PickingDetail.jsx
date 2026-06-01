import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function PickingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [picking, setPicking] = useState(null);
  const [products, setProducts] = useState([]);
  const [driver, setDriver] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');

  useEffect(() => {
    loadPicking();
    loadProducts();
  }, [id]);

  const loadPicking = async () => {
    const res = await api.get(`/pickings/${id}`);
    setPicking(res.data);
    setDriver(res.data.driver || '');
    setDriverPhone(res.data.driver_phone || '');
    setEstimatedArrival(res.data.estimated_arrival ? dayjs(res.data.estimated_arrival).format('YYYY-MM-DDTHH:mm') : '');
  };

  const loadProducts = async () => {
    const res = await api.get('/products');
    setProducts(res.data);
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...picking.items];
    newItems[idx][field] = value;
    
    if (field === 'picked_qty') {
      const shipped = newItems[idx].shipped_qty || 0;
      newItems[idx].shortage_qty = newItems[idx].ordered_qty - value - shipped;
    }
    if (field === 'shipped_qty') {
      const picked = newItems[idx].picked_qty || 0;
      newItems[idx].shortage_qty = newItems[idx].ordered_qty - picked - value;
    }
    
    setPicking({ ...picking, items: newItems });
  };

  const savePicking = async (status) => {
    await api.patch(`/pickings/${id}`, {
      items: picking.items,
      driver,
      driver_phone: driverPhone,
      estimated_arrival: estimatedArrival,
      status
    });
    
    if (status === 'shipped') {
      const res = await api.post(`/receipts/from-picking/${id}`);
      alert('已发货，收货单已生成');
      navigate(`/receipts/${res.data.id}`);
    } else {
      alert('保存成功');
      loadPicking();
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: ['badge-pending', '待拣配'],
      picking: ['badge-picking', '拣配中'],
      shipped: ['badge-shipped', '已发货']
    };
    const [cls, text] = map[status] || ['badge-pending', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  if (!picking) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>拣配单详情 - {picking.picking_no}</h1>
        <button className="btn" onClick={() => navigate('/pickings')}>返回</button>
      </div>
      
      <div className="card">
        <div className="form-row">
          <div>
            <strong>订单号：</strong>{picking.order_no}
          </div>
          <div>
            <strong>门店：</strong>{picking.store_name}
          </div>
          <div>
            <strong>配送日期：</strong>{dayjs(picking.delivery_date).format('YYYY-MM-DD')}
          </div>
          <div>
            <strong>状态：</strong>{getStatusBadge(picking.status)}
          </div>
        </div>
        <div className="form-row mt-20">
          <div className="form-group">
            <label>司机姓名</label>
            <input value={driver} onChange={(e) => setDriver(e.target.value)} />
          </div>
          <div className="form-group">
            <label>司机电话</label>
            <input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>预计到达时间</label>
            <input type="datetime-local" value={estimatedArrival} onChange={(e) => setEstimatedArrival(e.target.value)} />
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3>拣配明细</h3>
        <table style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>商品</th>
              <th>规格</th>
              <th>订货数量</th>
              <th>已拣数量</th>
              <th>已发数量</th>
              <th>缺货数量</th>
              <th>缺货原因</th>
              <th>替代商品</th>
            </tr>
          </thead>
          <tbody>
            {picking.items.map((item, idx) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.spec}</td>
                <td>{item.ordered_qty}</td>
                <td>
                  <input 
                    type="number" 
                    value={item.picked_qty || 0} 
                    min="0"
                    onChange={(e) => updateItem(idx, 'picked_qty', parseFloat(e.target.value))}
                    style={{ width: '80px' }}
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.shipped_qty || 0} 
                    min="0"
                    onChange={(e) => updateItem(idx, 'shipped_qty', parseFloat(e.target.value))}
                    style={{ width: '80px' }}
                  />
                </td>
                <td className={item.shortage_qty > 0 ? 'text-danger' : ''}>
                  {item.shortage_qty || 0}
                </td>
                <td>
                  <input 
                    value={item.shortage_reason || ''} 
                    onChange={(e) => updateItem(idx, 'shortage_reason', e.target.value)}
                    placeholder="缺货原因"
                    style={{ width: '100px' }}
                  />
                </td>
                <td>
                  <select 
                    value={item.substitute_product_id || ''} 
                    onChange={(e) => updateItem(idx, 'substitute_product_id', e.target.value)}
                    style={{ width: '120px' }}
                  >
                    <option value="">无替代</option>
                    {products.filter(p => p.id !== item.product_id).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-10">
        <button className="btn btn-primary" onClick={() => savePicking('picking')}>保存拣配</button>
        {picking.status !== 'shipped' && (
          <button className="btn btn-success" onClick={() => savePicking('shipped')}>确认发货</button>
        )}
      </div>
    </div>
  );
}
