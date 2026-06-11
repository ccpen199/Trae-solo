import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Tabs, Timeline, Steps, Descriptions, Statistic, Row, Col, Progress, List } from 'antd';
import { SearchOutlined, EyeOutlined, FileTextOutlined, EnvironmentOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

function OrderCenter() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingEvents, setTrackingEvents] = useState<any[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/orders');
      setOrders(data as any[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (order: any) => {
    setSelectedOrder(order);
    setIsDetailModalVisible(true);
    try {
      const events = await apiService.get(`/orders/${order.id}/tracking`);
      setTrackingEvents(events as any[]);
    } catch (err) {
      console.error(err);
    }
  };

  const statusMap: Record<string, { color: string; text: string }> = {
    inquiry: { color: 'blue', text: '询盘' },
    quoted: { color: 'orange', text: '报价中' },
    confirmed: { color: 'green', text: '已确认' },
    in_transit: { color: 'cyan', text: '运输中' },
    delivered: { color: 'purple', text: '已送达' },
    completed: { color: 'success', text: '已完成' },
    cancelled: { color: 'default', text: '已取消' },
  };

  const paymentStatusMap: Record<string, { color: string; text: string }> = {
    unpaid: { color: 'red', text: '未付款' },
    partial: { color: 'orange', text: '部分付款' },
    paid: { color: 'green', text: '已付款' },
  };

  const orderTypeMap: Record<string, string> = {
    voyage_booking: '航次订舱',
    spot_container: '现舱秒杀',
    bid_slot: '竞价舱位',
    vessel_purchase: '船舶交易',
    equipment_rental: '设备租赁',
  };

  const mockTrackingEvents = [
    { status: 'completed', title: '订单创建', time: '2024-01-15 10:00', location: '上海港' },
    { status: 'completed', title: '合同签署', time: '2024-01-15 14:30', location: '线上' },
    { status: 'completed', title: '货物进港', time: '2024-01-18 09:00', location: '上海港集装箱码头' },
    { status: 'completed', title: '装船完成', time: '2024-01-20 16:00', location: '上海港' },
    { status: 'active', title: '海上运输', time: '2024-01-20 - 至今', location: '太平洋海域' },
    { status: 'pending', title: '到达目的港', time: '预计 2024-02-05', location: '洛杉矶港' },
    { status: 'pending', title: '清关提货', time: '预计 2024-02-06', location: '洛杉矶港' },
  ];

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_number',
      key: 'order_number',
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (type: string) => orderTypeMap[type] || type,
    },
    {
      title: '买卖双方',
      key: 'parties',
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: '12px' }}>买方: {record.buyer_company}</div>
          <div style={{ fontSize: '12px', color: '#999' }}>卖方: {record.seller_company}</div>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: any) => (
        <span style={{ color: '#ff7a45', fontWeight: 'bold' }}>
          {record.currency} {amount?.toLocaleString()}
        </span>
      ),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '付款状态',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => {
        const info = paymentStatusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small">跟踪</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-title">订单中心</div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="全部订单" value={orders.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="进行中" value={orders.filter(o => ['in_transit', 'confirmed'].includes(o.status)).length} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="待付款" value={orders.filter(o => o.payment_status === 'unpaid').length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="已完成" value={orders.filter(o => o.status === 'completed').length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="all"
          items={[
            { key: 'all', label: '全部订单' },
            { key: 'pending', label: '待处理' },
            { key: 'in_progress', label: '进行中' },
            { key: 'completed', label: '已完成' },
          ]}
        >
          <Table
            rowKey="id"
            columns={columns}
            dataSource={orders}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Tabs>
      </Card>

      <Modal
        title="订单详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedOrder && (
          <Tabs
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <div>
                    <Descriptions title="订单信息" bordered size="small" column={2}>
                      <Descriptions.Item label="订单号">{selectedOrder.order_number}</Descriptions.Item>
                      <Descriptions.Item label="订单类型">{orderTypeMap[selectedOrder.order_type] || selectedOrder.order_type}</Descriptions.Item>
                      <Descriptions.Item label="订单金额">
                        <span style={{ color: '#ff7a45', fontWeight: 'bold' }}>
                          {selectedOrder.currency} {selectedOrder.amount?.toLocaleString()}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="订单状态">
                        <Tag color={statusMap[selectedOrder.status]?.color}>
                          {statusMap[selectedOrder.status]?.text}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="付款状态">
                        <Tag color={paymentStatusMap[selectedOrder.payment_status]?.color}>
                          {paymentStatusMap[selectedOrder.payment_status]?.text}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="合同签署">
                        {selectedOrder.contract_signed ? '已签署' : '未签署'}
                      </Descriptions.Item>
                      <Descriptions.Item label="买方">{selectedOrder.buyer_company}</Descriptions.Item>
                      <Descriptions.Item label="卖方">{selectedOrder.seller_company}</Descriptions.Item>
                      <Descriptions.Item label="创建时间" span={2}>
                        {dayjs(selectedOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
                      </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 24 }}>
                      <h4>订单进度</h4>
                      <Steps
                        direction="horizontal"
                        current={3}
                        items={[
                          { title: '询盘', icon: <FileTextOutlined /> },
                          { title: '签约', icon: <CheckCircleOutlined /> },
                          { title: '装船', icon: <CarOutlined /> },
                          { title: '运输', icon: <EnvironmentOutlined /> },
                          { title: '交付', icon: <CheckCircleOutlined /> },
                        ]}
                        style={{ marginTop: 16 }}
                      />
                    </div>

                    <div style={{ marginTop: 24, textAlign: 'right' }}>
                      <Space>
                        <Button>下载合同</Button>
                        <Button type="primary">签发电子提单</Button>
                        <Button type="primary">去付款</Button>
                      </Space>
                    </div>
                  </div>
                ),
              },
              {
                key: 'tracking',
                label: '物流跟踪',
                children: (
                  <div>
                    <div style={{ padding: 16, background: '#f0f5ff', borderRadius: 6, marginBottom: 16 }}>
                      <Space size="large">
                        <div>
                          <div style={{ color: '#999', fontSize: 12 }}>当前位置</div>
                          <div style={{ fontSize: 16, fontWeight: 'bold' }}>太平洋海域</div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 12 }}>预计到达</div>
                          <div style={{ fontSize: 16, fontWeight: 'bold' }}>2024-02-05</div>
                        </div>
                        <div>
                          <div style={{ color: '#999', fontSize: 12 }}>运输进度</div>
                          <div style={{ width: 200 }}>
                            <Progress percent={65} status="active" />
                          </div>
                        </div>
                      </Space>
                    </div>

                    <Timeline
                      items={mockTrackingEvents.map((event, idx) => ({
                        color: event.status === 'completed' ? 'green' : event.status === 'active' ? 'blue' : 'gray',
                        children: (
                          <div>
                            <div style={{ fontWeight: event.status === 'active' ? 'bold' : 'normal' }}>
                              {event.title}
                            </div>
                            <div style={{ color: '#999', fontSize: 12 }}>
                              <EnvironmentOutlined /> {event.location}
                            </div>
                            <div style={{ color: '#999', fontSize: 12 }}>{event.time}</div>
                          </div>
                        ),
                      }))}
                    />
                  </div>
                ),
              },
              {
                key: 'documents',
                label: '单证管理',
                children: (
                  <List
                    dataSource={[
                      { name: '商业发票', status: '已上传', type: 'pdf' },
                      { name: '装箱单', status: '已上传', type: 'pdf' },
                      { name: '产地证', status: '已上传', type: 'pdf' },
                      { name: '提单', status: '待签发', type: 'pdf' },
                      { name: '保险单', status: '已上传', type: 'pdf' },
                      { name: '报关单', status: '待上传', type: 'pdf' },
                    ]}
                    renderItem={(item: any) => (
                      <List.Item actions={[
                        <Button type="link" size="small">查看</Button>,
                        <Button type="link" size="small">下载</Button>,
                      ]}>
                        <List.Item.Meta
                          avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                          title={item.name}
                          description={
                            <Tag color={item.status.includes('已') ? 'green' : 'orange'}>{item.status}</Tag>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ),
              },
              {
                key: 'settlement',
                label: '结算对账',
                children: (
                  <div>
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="基本运费">USD 2,500.00</Descriptions.Item>
                      <Descriptions.Item label="附加费">USD 350.00</Descriptions.Item>
                      <Descriptions.Item label="保险费">USD 80.00</Descriptions.Item>
                      <Descriptions.Item label="其他费用">USD 120.00</Descriptions.Item>
                      <Descriptions.Item label="合计金额" span={2}>
                        <span style={{ color: '#ff7a45', fontSize: 18, fontWeight: 'bold' }}>
                          USD 3,050.00
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="已付金额">USD 1,000.00</Descriptions.Item>
                      <Descriptions.Item label="待付金额">
                        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>USD 2,050.00</span>
                      </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                      <Button type="primary" size="large">立即付款</Button>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}

export default OrderCenter;
