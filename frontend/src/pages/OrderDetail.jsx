import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, skuApi, aftersaleApi } from '../api';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [skus, setSkus] = useState([]);
  const [substituteModal, setSubstituteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [substituteForm, setSubstituteForm] = useState({ substitution_sku_id: '', substitution_reason: '' });
  const [aftersaleModal, setAftersaleModal] = useState(false);
  const [aftersaleForm, setAftersaleForm] = useState({ type: 'refund', reason: '', refund_amount: 0 });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [orderRes, skusRes] = await Promise.all([
        orderApi.getOne(id),
        skuApi.getAll()
      ]);
      setOrderData(orderRes.data);
      setSkus(skusRes.data);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleSubstitute = async () => {
    try {
      await orderApi.substitute(id, {
        order_item_id: selectedItem.id,
        ...substituteForm
      });
      setSubstituteModal(false);
      loadData();
    } catch (err) {
      alert('替换失败');
    }
  };

  const handleCancelItem = async (itemId, reason) => {
    if (confirm('确定取消该商品？')) {
      try {
        await orderApi.cancelItem(id, { order_item_id: itemId, reason });
        loadData();
      } catch (err) {
        alert('取消失败');
      }
    }
  };

  const handleAftersale = async () => {
    try {
      await aftersaleApi.create({
        order_id: id,
        ...aftersaleForm
      });
      setAftersaleModal(false);
      loadData();
    } catch (err) {
      alert('创建售后失败');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-pending',
      picking: 'badge-picking',
      picked: 'badge-picking',
      reviewing: 'badge-pending',
      delivering: 'badge-picking',
      out_for_delivery: 'badge-picking',
      completed: 'badge-success',
      delivery_failed: 'badge-danger',
      after_sale: 'badge-warning',
      closed: 'badge-info'
    };
    return badges[status] || 'badge-info';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '待处理',
      picking: '拣货中',
      picked: '已拣货',
      reviewing: '复核中',
      delivering: '配送中',
      out_for_delivery: '配送中',
      completed: '已完成',
      delivery_failed: '配送失败',
      after_sale: '售后中',
      closed: '已关闭'
    };
    return texts[status] || status;
  };

  if (!orderData) return <div>加载中...</div>;

  const { order, items, pickTask, delivery, afterSales } = orderData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <button className="btn" onClick={() => navigate('/orders')}>← 返回</button>
          <h1 className="page-title" style={{ display: 'inline-block', marginLeft: 16, marginBottom: 0 }}>订单详情</h1>
        </div>
        <button className="btn btn-warning" onClick={() => setAftersaleModal(true)}>申请售后</button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>基本信息</h3>
        <div className="grid grid-2">
          <div className="detail-row"><span className="detail-label">订单号:</span><span className="detail-value">{order.order_no}</span></div>
          <div className="detail-row"><span className="detail-label">状态:</span><span className="detail-value"><span className={`badge ${getStatusBadge(order.status)}`}>{getStatusText(order.status)}</span></span></div>
          <div className="detail-row"><span className="detail-label">客户:</span><span className="detail-value">{order.customer_name}</span></div>
          <div className="detail-row"><span className="detail-label">电话:</span><span className="detail-value">{order.customer_phone}</span></div>
          <div className="detail-row"><span className="detail-label">地址:</span><span className="detail-value">{order.address}</span></div>
          <div className="detail-row"><span className="detail-label">时段:</span><span className="detail-value">{order.time_slot}</span></div>
          <div className="detail-row"><span className="detail-label">路线:</span><span className="detail-value">{order.route}</span></div>
          <div className="detail-row"><span className="detail-label">订单金额:</span><span className="detail-value">¥{order.total_amount.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>商品清单</h3>
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>商品名称</th>
              <th>单价</th>
              <th>订购数量</th>
              <th>实拣数量</th>
              <th>实际重量</th>
              <th>状态</th>
              <th>替换商品</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.sku_code}</td>
                <td>{item.name}</td>
                <td>¥{item.unit_price.toFixed(2)}</td>
                <td>{item.quantity} {item.unit}</td>
                <td>{item.actual_quantity !== null ? item.actual_quantity : '-'}</td>
                <td>{item.actual_weight !== null ? `${item.actual_weight} kg` : '-'}</td>
                <td><span className="badge badge-info">{item.status || '待处理'}</span></td>
                <td>{item.substitution_name || '-'}</td>
                <td>
                  {order.status === 'pending' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setSelectedItem(item);
                        setSubstituteModal(true);
                      }}>缺货替换</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleCancelItem(item.id, '用户取消')}>取消</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pickTask && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>拣货信息</h3>
          <div className="grid grid-2">
            <div className="detail-row"><span className="detail-label">拣货员:</span><span className="detail-value">{pickTask.picker_name || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">状态:</span><span className="detail-value">{pickTask.status}</span></div>
            <div className="detail-row"><span className="detail-label">开始时间:</span><span className="detail-value">{pickTask.started_at || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">完成时间:</span><span className="detail-value">{pickTask.completed_at || '-'}</span></div>
          </div>
        </div>
      )}

      {delivery && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>配送信息</h3>
          <div className="grid grid-2">
            <div className="detail-row"><span className="detail-label">骑手:</span><span className="detail-value">{delivery.rider_name || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">状态:</span><span className="detail-value">{delivery.status}</span></div>
            <div className="detail-row"><span className="detail-label">接单时间:</span><span className="detail-value">{delivery.accepted_at || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">到达时间:</span><span className="detail-value">{delivery.arrived_at || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">签收时间:</span><span className="detail-value">{delivery.signed_at || '-'}</span></div>
            <div className="detail-row"><span className="detail-label">失败原因:</span><span className="detail-value">{delivery.failure_reason || '-'}</span></div>
          </div>
        </div>
      )}

      {afterSales.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>售后记录</h3>
          <table className="table">
            <thead>
              <tr>
                <th>类型</th>
                <th>原因</th>
                <th>退款金额</th>
                <th>状态</th>
                <th>处理人</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {afterSales.map(as => (
                <tr key={as.id}>
                  <td>{as.type === 'refund' ? '退款' : as.type === 'exchange' ? '换货' : as.type}</td>
                  <td>{as.reason}</td>
                  <td>¥{as.refund_amount.toFixed(2)}</td>
                  <td><span className="badge badge-info">{as.status}</span></td>
                  <td>{as.handled_by || '-'}</td>
                  <td>{new Date(as.created_at).toLocaleString('zh-CN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {substituteModal && (
        <div className="modal-overlay" onClick={() => setSubstituteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>缺货替换 - {selectedItem?.name}</h3>
            <div className="form-group">
              <label>替换商品</label>
              <select value={substituteForm.substitution_sku_id} onChange={e => setSubstituteForm({...substituteForm, substitution_sku_id: e.target.value})}>
                <option value="">选择商品</option>
                {skus.filter(s => s.id !== selectedItem?.sku_id).map(sku => (
                  <option key={sku.id} value={sku.id}>{sku.sku_code} - {sku.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>替换原因</label>
              <textarea value={substituteForm.substitution_reason} onChange={e => setSubstituteForm({...substituteForm, substitution_reason: e.target.value})} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setSubstituteModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSubstitute}>确认替换</button>
            </div>
          </div>
        </div>
      )}

      {aftersaleModal && (
        <div className="modal-overlay" onClick={() => setAftersaleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>申请售后</h3>
            <div className="form-group">
              <label>售后类型</label>
              <select value={aftersaleForm.type} onChange={e => setAftersaleForm({...aftersaleForm, type: e.target.value})}>
                <option value="refund">退款</option>
                <option value="exchange">换货</option>
                <option value="complaint">投诉</option>
              </select>
            </div>
            <div className="form-group">
              <label>原因</label>
              <textarea value={aftersaleForm.reason} onChange={e => setAftersaleForm({...aftersaleForm, reason: e.target.value})} />
            </div>
            <div className="form-group">
              <label>退款金额</label>
              <input type="number" value={aftersaleForm.refund_amount} onChange={e => setAftersaleForm({...aftersaleForm, refund_amount: parseFloat(e.target.value)})} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setAftersaleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleAftersale}>提交申请</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetail;
