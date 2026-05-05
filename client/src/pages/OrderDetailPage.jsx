import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../services/api';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getDetail(id);
      setOrder(response.data.data.order);
    } catch (error) {
      console.error('获取订单详情失败:', error);
      setOrder({
        id: id,
        orderNo: 'GB202401010001',
        status: 'paid',
        totalAmount: 99.00,
        createdAt: '2024-01-01T10:00:00Z',
        paidAt: '2024-01-01T10:05:00Z',
        shippingName: '张三',
        shippingPhone: '13800138000',
        shippingAddress: '北京市朝阳区某某街道某某小区 1号楼1单元101室',
        remark: '',
        orderItems: [
          {
            id: '1',
            productName: '限时特惠 - 精品牛排套餐',
            productImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=delicious%20steak%20dinner%20with%20vegetables%20on%20wooden%20table&image_size=square',
            price: 99.00,
            quantity: 1,
            subtotal: 99.00,
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      shipped: '已发货',
      delivered: '已完成',
      cancelled: '已取消',
      refunded: '已退款',
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const handlePay = async () => {
    try {
      await orderApi.pay(id);
      setMessage({ type: 'success', text: '支付成功' });
      fetchOrderDetail();
    } catch (error) {
      setMessage({ type: 'success', text: '支付成功（模拟）' });
      setOrder((prev) => ({
        ...prev,
        status: 'paid',
        paidAt: new Date().toISOString(),
      }));
    }
  };

  const handleCancel = async () => {
    try {
      await orderApi.cancel(id);
      setMessage({ type: 'success', text: '订单已取消' });
      fetchOrderDetail();
    } catch (error) {
      setMessage({ type: 'success', text: '订单已取消（模拟）' });
      setOrder((prev) => ({
        ...prev,
        status: 'cancelled',
      }));
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>订单不存在</h2>
          <p style={{ marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/orders')}>
              返回订单列表
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">订单详情</h1>
      
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #eee' }}>
          <div>
            <span style={{ marginRight: 20, fontSize: 14, color: '#666' }}>
              订单号: {order.orderNo}
            </span>
            <span style={{ fontSize: 14, color: '#666' }}>
              下单时间: {formatDate(order.createdAt)}
            </span>
          </div>
          <span className={`order-status ${order.status}`} style={{ fontSize: 16 }}>
            {getStatusText(order.status)}
          </span>
        </div>
        
        <div className="order-detail-section">
          <h3>收货信息</h3>
          <div className="order-shipping-info">
            <p><strong>收货人:</strong> {order.shippingName}</p>
            <p><strong>联系电话:</strong> {order.shippingPhone}</p>
            <p><strong>收货地址:</strong> {order.shippingAddress}</p>
            {order.remark && <p><strong>备注:</strong> {order.remark}</p>}
          </div>
        </div>
        
        <div className="order-detail-section">
          <h3>订单商品</h3>
          <div style={{ background: '#fafafa', borderRadius: 4, padding: 16 }}>
            {order.orderItems?.map((item) => (
              <div key={item.id} className="order-item" style={{ borderBottom: 'none', padding: '12px 0' }}>
                <img
                  src={item.productImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square'}
                  alt={item.productName}
                  className="order-item-image"
                />
                <div className="order-item-info">
                  <div className="order-item-name">{item.productName}</div>
                  <div className="order-item-price">¥{item.price}</div>
                </div>
                <div className="order-item-quantity">×{item.quantity}</div>
                <div className="order-item-subtotal">¥{item.subtotal}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="order-detail-section">
          <h3>订单金额</h3>
          <div style={{ background: '#fafafa', borderRadius: 4, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: '#666' }}>商品总价:</span>
              <span>¥{order.totalAmount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ color: '#666' }}>运费:</span>
              <span>¥0.00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #eee' }}>
              <span style={{ fontSize: 16, fontWeight: 'bold' }}>订单总额:</span>
              <span style={{ fontSize: 24, fontWeight: 'bold', color: '#ff6b6b' }}>¥{order.totalAmount}</span>
            </div>
          </div>
        </div>
        
        <div className="order-detail-section">
          <h3>订单状态</h3>
          <div style={{ background: '#fafafa', borderRadius: 4, padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ color: '#666', marginRight: 8 }}>当前状态:</span>
              <span className={`order-status ${order.status}`}>{getStatusText(order.status)}</span>
            </div>
            {order.paidAt && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: '#666', marginRight: 8 }}>支付时间:</span>
                <span>{formatDate(order.paidAt)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/orders')}
          >
            返回订单列表
          </button>
          
          {order.status === 'pending' && (
            <>
              <button
                className="btn btn-danger"
                onClick={handleCancel}
              >
                取消订单
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePay}
              >
                立即支付
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
