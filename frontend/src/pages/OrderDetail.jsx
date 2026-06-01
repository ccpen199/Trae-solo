import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import dayjs from 'dayjs';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    const res = await api.get(`/orders/${id}`);
    setOrder(res.data);
  };

  const confirmOrder = async () => {
    await api.patch(`/orders/${id}/status`, { status: 'confirmed' });
    loadOrder();
    alert('订单已确认');
  };

  const createPicking = async () => {
    const res = await api.post(`/pickings/from-order/${id}`);
    navigate(`/pickings/${res.data.id}`);
  };

  const getStatusBadge = (status) => {
    const map = {
      draft: ['badge-draft', '草稿'],
      confirmed: ['badge-pending', '已确认'],
      picking: ['badge-picking', '拣配中'],
      shipped: ['badge-shipped', '已发货'],
      received: ['badge-received', '已收货']
    };
    const [cls, text] = map[status] || ['badge-draft', status];
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  if (!order) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>订单详情 - {order.order_no}</h1>
        <button className="btn" onClick={() => navigate('/orders')}>返回</button>
      </div>
      
      <div className="card">
        <div className="form-row">
          <div>
            <strong>门店：</strong>{order.store_name}
          </div>
          <div>
            <strong>下单日期：</strong>{dayjs(order.order_date).format('YYYY-MM-DD')}
          </div>
          <div>
            <strong>配送日期：</strong>{dayjs(order.delivery_date).format('YYYY-MM-DD')}
          </div>
          <div>
            <strong>状态：</strong>{getStatusBadge(order.status)}
          </div>
        </div>
        {order.remark && (
          <div style={{ marginTop: '10px' }}>
            <strong>备注：</strong>{order.remark}
          </div>
        )}
      </div>
      
      <div className="card">
        <h3>订货明细</h3>
        <table style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>商品</th>
              <th>规格</th>
              <th>单位</th>
              <th>建议数量</th>
              <th>订货数量</th>
              <th>单价</th>
              <th>小计</th>
              <th>调整原因</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td>{item.spec}</td>
                <td>{item.unit}</td>
                <td>{item.suggested_qty}</td>
                <td>{item.ordered_qty}</td>
                <td>¥{item.price}</td>
                <td>¥{item.amount.toFixed(2)}</td>
                <td>{item.adjust_reason || '-'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="6" style={{ textAlign: 'right', fontWeight: 'bold' }}>合计：</td>
              <td style={{ fontWeight: 'bold' }}>¥{order.total_amount.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="flex gap-10">
        {order.status === 'draft' && (
          <button className="btn btn-success" onClick={confirmOrder}>确认订单</button>
        )}
        {order.status === 'confirmed' && (
          <button className="btn btn-primary" onClick={createPicking}>生成拣配单</button>
        )}
      </div>
    </div>
  );
}
