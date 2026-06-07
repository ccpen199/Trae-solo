import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, message, Space, Tabs, Descriptions, Timeline, Row, Col } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { productAPI } from '../api';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const MallOrder = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getOrders();
      setOrders(res.data || []);
    } catch (err) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (id) => {
    try {
      await productAPI.payOrder(id);
      message.success('支付成功');
      loadOrders();
    } catch (err) {
      message.error('支付失败');
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await productAPI.getOrderDetail(id);
      setCurrentOrder(res.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('获取订单详情失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'warning', text: '待支付' },
      paid: { color: 'processing', text: '待发货' },
      shipped: { color: 'blue', text: '待收货' },
      delivered: { color: 'cyan', text: '待安装' },
      completed: { color: 'success', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' },
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '商品',
      dataIndex: 'product_name',
    },
    {
      title: '金额',
      dataIndex: 'total_amount',
      render: (v) => <span style={{ color: '#f5222d' }}>¥{v}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => getStatusTag(v),
    },
    {
      title: '下单时间',
      dataIndex: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Button type="primary" size="small" onClick={() => handlePay(record.id)}>
              立即支付
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const items = [
    {
      key: 'all',
      label: '全部订单',
      children: (
        <Table
          columns={columns}
          dataSource={orders}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'pending',
      label: '待支付',
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter(o => o.status === 'pending')}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'processing',
      label: '进行中',
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'completed',
      label: '已完成',
      children: (
        <Table
          columns={columns}
          dataSource={orders.filter(o => o.status === 'completed')}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/mall')}>
            返回商城
          </Button>
          <h2 style={{ margin: 0 }}>我的订单</h2>
        </Space>
      </Card>

      <Card bordered={false}>
        <Tabs items={items} />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentOrder && (
          <div>
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <Row align="middle">
                <Col span={18}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{currentOrder.product_name}</p>
                  <p style={{ margin: 0, color: '#666', fontSize: 12 }}>{currentOrder.product_spec}</p>
                </Col>
                <Col span={6} style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#f5222d', fontSize: 18, fontWeight: 'bold' }}>¥{currentOrder.total_amount}</p>
                  {currentOrder.trade_in_price > 0 && (
                    <p style={{ margin: 0, color: '#52c41a', fontSize: 12 }}>以旧换新抵扣¥{currentOrder.trade_in_price}</p>
                  )}
                </Col>
              </Row>
            </Card>

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{currentOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="收货人">{currentOrder.contact_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{currentOrder.contact_phone}</Descriptions.Item>
              <Descriptions.Item label="收货地址" span={2}>{currentOrder.address}</Descriptions.Item>
              <Descriptions.Item label="支付方式">
                {{ wechat: '微信支付', alipay: '支付宝', bank: '银行卡' }[currentOrder.payment_method] || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下单时间">{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              {currentOrder.warranty_id && (
                <Descriptions.Item label="电子质保">
                  <Button type="link" size="small" onClick={() => navigate('/warranty')}>查看</Button>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="订单进度" size="small" bordered={false} style={{ background: '#fafafa' }}>
              <Timeline
                items={[
                  {
                    color: 'green',
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>订单创建</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{dayjs(currentOrder.created_at).format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                    ),
                  },
                  currentOrder.paid_at && {
                    color: 'green',
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>支付成功</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{dayjs(currentOrder.paid_at).format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                    ),
                  },
                  currentOrder.shipped_at && {
                    color: 'blue',
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>商品已发货</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{dayjs(currentOrder.shipped_at).format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                    ),
                  },
                  currentOrder.delivered_at && {
                    color: 'cyan',
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>商品已送达</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{dayjs(currentOrder.delivered_at).format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                    ),
                  },
                  currentOrder.completed_at && {
                    color: 'green',
                    children: (
                      <div>
                        <p style={{ margin: 0 }}>订单完成</p>
                        <p style={{ margin: 0, color: '#999', fontSize: 12 }}>{dayjs(currentOrder.completed_at).format('YYYY-MM-DD HH:mm')}</p>
                      </div>
                    ),
                  },
                ].filter(Boolean)}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MallOrder;
