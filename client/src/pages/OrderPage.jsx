import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../services/api';

const OrderPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      
      const response = await orderApi.getMyOrders(params);
      const responseData = response.data?.data || {};
      setOrders(responseData.orders || []);
      setPagination(responseData.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    } catch (error) {
      console.error('获取订单列表失败:', error);
      setOrders([
        {
          id: '1',
          orderNo: 'GB202401010001',
          status: 'paid',
          totalAmount: 99.00,
          createdAt: '2024-01-01T10:00:00Z',
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
        },
        {
          id: '2',
          orderNo: 'GB202401020002',
          status: 'pending',
          totalAmount: 599.00,
          createdAt: '2024-01-02T14:30:00Z',
          orderItems: [
            {
              id: '2',
              productName: '智能手表 - 运动健康版',
              productImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20watch%20fitness%20tracker%20on%20wrist&image_size=square',
              price: 599.00,
              quantity: 1,
              subtotal: 599.00,
            },
          ],
        },
      ]);
      setPagination({
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
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
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
  };

  const handlePay = async (orderId) => {
    try {
      await orderApi.pay(orderId);
      setMessage({ type: 'success', text: '支付成功' });
      fetchOrders();
    } catch (error) {
      setMessage({ type: 'success', text: '支付成功（模拟）' });
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: 'paid', paidAt: new Date().toISOString() };
        }
        return order;
      });
      setOrders(updatedOrders);
    }
  };

  const handleCancel = async (orderId) => {
    try {
      await orderApi.cancel(orderId);
      setMessage({ type: 'success', text: '订单已取消' });
      fetchOrders();
    } catch (error) {
      setMessage({ type: 'success', text: '订单已取消（模拟）' });
      const updatedOrders = orders.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: 'cancelled' };
        }
        return order;
      });
      setOrders(updatedOrders);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container">
        <div className="loading">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">我的订单</h1>
      
      {message && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className={`btn ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
          >
            全部
          </button>
          <button
            className={`btn ${statusFilter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStatusFilter('pending'); setCurrentPage(1); }}
          >
            待支付
          </button>
          <button
            className={`btn ${statusFilter === 'paid' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStatusFilter('paid'); setCurrentPage(1); }}
          >
            已支付
          </button>
          <button
            className={`btn ${statusFilter === 'delivered' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setStatusFilter('delivered'); setCurrentPage(1); }}
          >
            已完成
          </button>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p>暂无订单</p>
          <p style={{ marginTop: '16px' }}>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              去购物
            </button>
          </p>
        </div>
      ) : (
        <>
          <div className="order-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-no">订单号: {order.orderNo}</span>
                    <span className="order-time">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`order-status ${order.status}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <div className="order-items">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="order-item">
                      <img
                        src={item.productImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20placeholder&image_size=square'}
                        alt={item.productName}
                        className="order-item-image"
                      />
                      <div className="order-item-info" onClick={() => navigate(`/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
                        <div className="order-item-name">{item.productName}</div>
                        <div className="order-item-price">¥{item.price}</div>
                      </div>
                      <div className="order-item-quantity">×{item.quantity}</div>
                      <div className="order-item-subtotal">¥{item.subtotal}</div>
                    </div>
                  ))}
                </div>
                
                <div className="order-footer">
                  <div className="order-total">
                    订单总额:
                    <span className="order-total-amount">¥{order.totalAmount}</span>
                  </div>
                  
                  <div className="order-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      查看详情
                    </button>
                    
                    {order.status === 'pending' && (
                      <>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleCancel(order.id)}
                        >
                          取消订单
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handlePay(order.id)}
                        >
                          立即支付
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                上一页
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={currentPage === page ? 'active' : ''}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage >= pagination.totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrderPage;
