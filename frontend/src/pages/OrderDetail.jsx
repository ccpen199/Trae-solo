import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Divider, List, Tag, message, Modal, Steps } from 'antd';
import { ArrowLeftOutlined, QrcodeOutlined, RollbackOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { ordersAPI, eticketsAPI } from '../api';
import dayjs from 'dayjs';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.detail(id);
      setOrder(res.order);
      setItems(res.items || []);
      setTickets(res.tickets || []);
    } catch (err) {
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = () => {
    Modal.confirm({
      title: '确认退款',
      content: '根据退改签政策，将根据开场时间计算退款金额。是否继续？',
      onOk: async () => {
        try {
          await ordersAPI.refund(id);
          message.success('退款申请已提交');
          loadOrder();
        } catch (err) {
          message.error(err.response?.data?.error || '退款失败');
        }
      }
    });
  };

  const getStatusTag = (status) => {
    if (status === 'refunded') return <Tag color="orange">已退款</Tag>;
    if (status === 'paid') return <Tag color="green">已支付</Tag>;
    if (status === 'pending') return <Tag color="blue">待支付</Tag>;
    if (status === 'cancelled') return <Tag color="gray">已取消</Tag>;
    return <Tag>{status}</Tag>;
  };

  const getStep = () => {
    if (order?.status === 'refunded') return 3;
    if (order?.status === 'paid') return 2;
    if (order?.status === 'pending') return 1;
    return 0;
  };

  if (loading) {
    return <div style={{ padding: 60, textAlign: 'center' }}>加载中...</div>;
  }

  if (!order) {
    return <div style={{ padding: 60, textAlign: 'center' }}>订单不存在</div>;
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
          返回订单列表
        </Button>
        <h2 style={{ margin: 0 }}>订单详情</h2>
      </Space>

      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: 8 }}>{order.event?.title || order.title}</h3>
              <Space>{getStatusTag(order.status)}</Space>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ marginBottom: 4 }}>订单金额</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f', margin: 0 }}>¥{order.pay_amount}</p>
            </div>
          </div>

          <Steps
            current={getStep()}
            items={[
              { title: '提交订单', icon: order.status !== 'pending' ? <CheckCircleOutlined /> : <ClockCircleOutlined /> },
              { title: '支付成功', icon: order.status === 'paid' || order.status === 'refunded' ? <CheckCircleOutlined /> : <ClockCircleOutlined /> },
              { title: order.status === 'refunded' ? '已退款' : '完成观演', icon: order.status === 'refunded' ? <RollbackOutlined /> : <CheckCircleOutlined /> }
            ]}
          />
        </Space>
      </Card>

      <Card title="票品信息" style={{ marginBottom: 24 }}>
        <List
          dataSource={tickets}
          renderItem={(ticket) => (
            <List.Item
              actions={[
                <Button type="link" icon={<QrcodeOutlined />} onClick={() => navigate('/tickets')}>
                  查看电子票
                </Button>
              ]}
            >
              <List.Item.Meta
                title={ticket.seat_info ? JSON.parse(ticket.seat_info).row + '排' + JSON.parse(ticket.seat_info).number + '座' : '座位信息'}
                description={
                  <Space>
                    <Tag color="blue">{ticket.ticket_no}</Tag>
                    <Tag color={ticket.status === 'used' ? 'gray' : 'green'}>
                      {ticket.status === 'used' ? '已使用' : '未使用'}
                    </Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title="订单信息" style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="订单编号">{order.order_no}</Descriptions.Item>
          <Descriptions.Item label="下单时间">{dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="联系人">{order.contact_name}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{order.contact_phone}</Descriptions.Item>
          <Descriptions.Item label="支付方式">{order.payment_method || '在线支付'}</Descriptions.Item>
          <Descriptions.Item label="支付时间">{order.paid_at ? dayjs(order.paid_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {order.refund_status !== 'none' && (
        <Card title="退款信息" style={{ marginBottom: 24 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="退款状态">
              <Tag color="orange">{order.refund_status === 'full' ? '全额退款' : '部分退款'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="退款金额">¥{order.refund_amount}</Descriptions.Item>
            <Descriptions.Item label="退款时间">{order.refunded_at ? dayjs(order.refunded_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {order.status === 'paid' && (
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Button type="primary" size="large" block icon={<QrcodeOutlined />} onClick={() => navigate('/tickets')}>
              查看电子票
            </Button>
            <Button danger block icon={<RollbackOutlined />} onClick={handleRefund}>
              申请退款
            </Button>
            <p style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>
              温馨提示：距开场不足6小时不可退款，48小时以上可退90%，24-48小时可退70%，6-24小时可退50%
            </p>
          </Space>
        </Card>
      )}
    </div>
  );
}

export default OrderDetail;
