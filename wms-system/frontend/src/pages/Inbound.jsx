import React, { useState, useEffect } from 'react';
import { inboundService } from '../services/api';

const Inbound = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    appointmentId: '',
    supplierId: '',
    items: [{ sku: '', productName: '', quantity: 0 }]
  });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await inboundService.list();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load inbound orders:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await inboundService.create(formData);
      loadOrders();
      setFormData({ appointmentId: '', supplierId: '', items: [{ sku: '', productName: '', quantity: 0 }] });
    } catch (error) {
      console.error('Failed to create inbound order:', error);
    }
  };

  const handleProcessItem = async (itemId, status) => {
    try {
      await inboundService.processItem(itemId, { qualityStatus: status });
      if (selectedOrder) {
        const updated = await inboundService.getById(selectedOrder.id);
        setSelectedOrder(updated);
      }
      loadOrders();
    } catch (error) {
      console.error('Failed to process item:', error);
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await inboundService.complete(orderId);
      loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('Failed to complete order:', error);
    }
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const data = await inboundService.getById(orderId);
      setSelectedOrder(data);
    } catch (error) {
      console.error('Failed to get order details:', error);
    }
  };

  const addItemField = () => {
    setFormData({ ...formData, items: [...formData.items, { sku: '', productName: '', quantity: 0 }] });
  };

  const updateItemField = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { bg: '#fff3cd', color: '#856404' },
      processing: { bg: '#17a2b8', color: 'white' },
      completed: { bg: '#28a745', color: 'white' },
      rejected: { bg: '#dc3545', color: 'white' }
    };
    const style = statusMap[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span style={{ ...style, padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {status}
      </span>
    );
  };

  const getQualityBadge = (status) => {
    const statusMap = {
      pass: { bg: '#28a745', color: 'white' },
      fail: { bg: '#dc3545', color: 'white' },
      pending: { bg: '#ffc107', color: '#856404' }
    };
    const style = statusMap[status] || { bg: '#e2e3e5', color: '#383d41' };
    return (
      <span style={{ ...style, padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>入库管理</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <form onSubmit={handleCreate} style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h3>新建入库单</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="预约单号"
                value={formData.appointmentId}
                onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <input
                type="text"
                placeholder="供应商编号"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                required
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              {formData.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: '5px' }}>
                  <input
                    type="text"
                    placeholder="SKU"
                    value={item.sku}
                    onChange={(e) => updateItemField(index, 'sku', e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <input
                    type="text"
                    placeholder="商品名称"
                    value={item.productName}
                    onChange={(e) => updateItemField(index, 'productName', e.target.value)}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <input
                    type="number"
                    placeholder="数量"
                    value={item.quantity}
                    onChange={(e) => updateItemField(index, 'quantity', parseInt(e.target.value))}
                    required
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>
              ))}
              <button type="button" onClick={addItemField} style={{ padding: '8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                添加商品
              </button>
            </div>
            <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              创建入库单
            </button>
          </form>

          <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ padding: '15px', margin: 0, borderBottom: '1px solid #eee' }}>入库单列表</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => viewOrderDetails(order)}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    background: selectedOrder?.order?.id === order.id ? '#e7f3ff' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>{order.id}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                    供应商: {order.supplierId} | 商品数: {order.totalItems}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {selectedOrder && (
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
              <h3>入库单详情</h3>
              <div style={{ marginBottom: '20px' }}>
                <div><strong>单号:</strong> {selectedOrder.order.id}</div>
                <div><strong>状态:</strong> {getStatusBadge(selectedOrder.order.status)}</div>
                <div><strong>创建时间:</strong> {new Date(selectedOrder.order.createdAt).toLocaleString()}</div>
              </div>

              <h4>商品列表</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>商品名称</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>数量</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>质检状态</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>库位</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{item.sku}</td>
                      <td style={{ padding: '8px' }}>{item.productName}</td>
                      <td style={{ padding: '8px' }}>{item.quantity}</td>
                      <td style={{ padding: '8px' }}>{getQualityBadge(item.qualityStatus)}</td>
                      <td style={{ padding: '8px' }}>{item.locationId || '-'}</td>
                      <td style={{ padding: '8px' }}>
                        {item.qualityStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProcessItem(item.id, 'pass')}
                              style={{ marginRight: '5px', padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              合格
                            </button>
                            <button
                              onClick={() => handleProcessItem(item.id, 'fail')}
                              style={{ padding: '4px 8px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              不合格
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedOrder.order.status !== 'completed' && (
                <button
                  onClick={() => handleComplete(selectedOrder.order.id)}
                  style={{ marginTop: '15px', padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  完成入库
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbound;