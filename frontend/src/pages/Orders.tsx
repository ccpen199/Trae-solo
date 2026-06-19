import { useState, useEffect } from 'react';
import { Card, Tabs, Button, Tag, Spin, Empty, Modal, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface OrderItem {
  skuId: string;
  skuTitle: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'confirmed' | 'refunded';
  createdAt: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: 'default' },
  paid: { label: '待发货', color: 'blue' },
  shipped: { label: '待收货', color: 'orange' },
  confirmed: { label: '已完成', color: 'green' },
  refunded: { label: '已退款', color: 'red' },
};

const tabKeys = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '待发货' },
  { key: 'shipped', label: '待收货' },
  { key: 'confirmed', label: '已完成' },
];

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', {
        params: { status: activeTab === 'all' ? undefined : activeTab },
      });
      setOrders(data.items || []);
    } catch {
      setOrders([
        { id: 'ORD001', items: [{ skuId: '1', skuTitle: '有机蔬菜礼盒', quantity: 2, price: 68 }], totalAmount: 136, status: 'shipped', createdAt: '2026-06-18T10:00:00Z' },
        { id: 'ORD002', items: [{ skuId: '2', skuTitle: '社区家政清洁服务', quantity: 1, price: 120 }], totalAmount: 120, status: 'pending', createdAt: '2026-06-19T09:00:00Z' },
        { id: 'ORD003', items: [{ skuId: '3', skuTitle: '进口水果拼盘', quantity: 1, price: 88 }, { skuId: '5', skuTitle: '品牌洗衣液', quantity: 2, price: 35 }], totalAmount: 158, status: 'confirmed', createdAt: '2026-06-17T14:00:00Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const handleConfirm = async (orderId: string) => {
    Modal.confirm({
      title: '确认收货',
      content: '确认收货后资金将释放给卖家，确认吗？',
      onOk: async () => {
        try {
          await api.post(`/orders/${orderId}/confirm`);
          message.success('已确认收货，资金已释放');
          fetchOrders();
        } catch {
          message.error('确认收货失败');
        }
      },
    });
  };

  const handleRefund = async (orderId: string) => {
    Modal.confirm({
      title: '申请退款',
      content: '确定要申请退款吗？',
      onOk: async () => {
        try {
          await api.post(`/orders/${orderId}/refund`);
          message.success('退款申请已提交');
          fetchOrders();
        } catch {
          message.error('退款申请失败');
        }
      },
    });
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabKeys}
        />

        {orders.length === 0 ? (
          <Empty description="暂无订单" />
        ) : (
          orders.map((order) => (
            <Card
              key={order.id}
              style={{ marginBottom: 12 }}
              size="small"
              title={
                <span>
                  订单号: {order.id}
                  <Tag color={statusMap[order.status]?.color} style={{ marginLeft: 8 }}>
                    {statusMap[order.status]?.label}
                  </Tag>
                </span>
              }
              extra={
                <span style={{ color: '#888' }}>{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
              }
            >
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>{item.skuTitle} × {item.quantity}</span>
                  <span>¥{item.price * item.quantity}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#f50', fontWeight: 'bold', fontSize: 16 }}>
                  合计: ¥{order.totalAmount}
                </span>
                <div>
                  {order.status === 'shipped' && (
                    <Button type="primary" size="small" onClick={() => handleConfirm(order.id)}>
                      确认收货
                    </Button>
                  )}
                  {(order.status === 'paid' || order.status === 'shipped') && (
                    <Button size="small" danger style={{ marginLeft: 8 }} onClick={() => handleRefund(order.id)}>
                      申请退款
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </Card>
    </div>
  );
};

export default Orders;
