import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Input, Select, DatePicker, Space,
  Modal, Descriptions, Form, message, Spin, Row, Col, Timeline,
  Empty, Image, Divider, Rate, Alert,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, SwapOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined,
  CarOutlined, EnvironmentOutlined, UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI, orderAPI } from '../../api';

const { RangePicker } = DatePicker;

const statusMap = {
  pending: { text: '待接单', color: 'orange' },
  dispatched: { text: '已调度', color: 'blue' },
  accepted: { text: '已接单', color: 'cyan' },
  arrived: { text: '已上门', color: 'geekblue' },
  in_progress: { text: '进行中', color: 'processing' },
  completed: { text: '已完成', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
  timeout: { text: '超时', color: 'volcano' },
};

const typeMap = {
  pickup_delivery: { text: '帮取送', color: 'blue' },
  purchase: { text: '帮买', color: 'green' },
  allpurpose: { text: '全能帮', color: 'purple' },
  queue: { text: '帮排队', color: 'orange' },
};

const priorityMap = {
  0: { text: '普通', color: 'default' },
  1: { text: '加急', color: 'orange' },
  2: { text: '特急', color: 'red' },
};

const timelineIconMap = {
  pending: <ClockCircleOutlined />,
  dispatched: <ExclamationCircleOutlined />,
  accepted: <CheckCircleOutlined />,
  arrived: <CarOutlined />,
  in_progress: <EnvironmentOutlined />,
  completed: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  cancelled: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  timeout: <ExclamationCircleOutlined style={{ color: '#fa541c' }} />,
};

export default function OrderManage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, total: 0, pageSize: 10 });
  const [filters, setFilters] = useState({ status: undefined, type: undefined, dateRange: null, search: '' });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [orderDetail, setOrderDetail] = useState(null);
  const [orderTracking, setOrderTracking] = useState([]);
  const [orderReviews, setOrderReviews] = useState([]);
  const [reassignVisible, setReassignVisible] = useState(false);
  const [reassignOrder, setReassignOrder] = useState(null);
  const [reassignForm] = Form.useForm();

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, pageSize: pagination.pageSize };
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.search) params.search = filters.search;
      if (filters.dateRange) {
        params.start_date = filters.dateRange[0].format('YYYY-MM-DD');
        params.end_date = filters.dateRange[1].format('YYYY-MM-DD');
      }
      const res = await adminAPI.getOrders(params);
      const data = res.data || res;
      setOrders(data.orders || data.list || data.items || []);
      setPagination((prev) => ({ ...prev, current: page, total: data.total || 0 }));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleReassign = async (values) => {
    try {
      await adminAPI.manualDispatch({
        order_id: reassignOrder.id,
        courier_id: values.courier_id,
      });
      message.success('已重新分配跑腿员');
      setReassignVisible(false);
      reassignForm.resetFields();
      fetchOrders();
    } catch {}
  };

  const fetchOrderDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await orderAPI.getDetail(id);
      const data = res.data || res;
      setOrderDetail(data.order);
      setOrderTracking(data.tracking || []);
      setOrderReviews(data.reviews || []);
    } catch {
      setOrderDetail(null);
      setOrderTracking([]);
      setOrderReviews([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const openDetail = (record) => {
    setCurrentOrder(record);
    setOrderDetail(null);
    setOrderTracking([]);
    setOrderReviews([]);
    setDetailVisible(true);
    fetchOrderDetail(record.id);
  };

  const columns = [
    {
      title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160,
      render: (v, record) => (
        <Button type="link" size="small" onClick={() => openDetail(record)}>
          {v}
        </Button>
      ),
    },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 120 },
    {
      title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (v) => <Tag color={priorityMap[v]?.color}>{priorityMap[v]?.text || '普通'}</Tag>,
    },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 90,
      render: (v) => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text || v}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text || v}</Tag>,
    },
    { title: '费用', dataIndex: 'fee', key: 'fee', width: 80, render: (v) => `¥${v}` },
    { title: '跑腿员', dataIndex: 'courier_name', key: 'courier_name', width: 90, render: (v) => v || '-' },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 140,
      render: (v) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '操作', key: 'actions', width: 140,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openDetail(record)}
          >
            详情
          </Button>
          {(record.status === 'timeout' || record.status === 'dispatched') && (
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => { setReassignOrder(record); setReassignVisible(true); }}
            >
              重分配
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="订单管理">
        <Space wrap style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索订单号"
            prefix={<SearchOutlined />}
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            onPressEnter={() => fetchOrders(1)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="订单状态"
            value={filters.status}
            onChange={(v) => setFilters((prev) => ({ ...prev, status: v }))}
            allowClear
            style={{ width: 130 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v.text }))}
          />
          <Select
            placeholder="订单类型"
            value={filters.type}
            onChange={(v) => setFilters((prev) => ({ ...prev, type: v }))}
            allowClear
            style={{ width: 130 }}
            options={Object.entries(typeMap).map(([k, v]) => ({ value: k, label: v.text }))}
          />
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters((prev) => ({ ...prev, dateRange: dates }))}
          />
          <Button type="primary" onClick={() => fetchOrders(1)}>查询</Button>
          <Button onClick={() => {
            setFilters({ status: undefined, type: undefined, dateRange: null, search: '' });
            fetchOrders(1);
          }}>重置</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            total: pagination.total,
            pageSize: pagination.pageSize,
            onChange: fetchOrders,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="middle"
          scroll={{ x: 900 }}
        />
      </Card>

      <Modal
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {detailLoading ? (
          <Spin size="large" style={{ display: 'block', margin: '60px auto' }} />
        ) : orderDetail ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <Tag color={typeMap[orderDetail.type]?.color}>{typeMap[orderDetail.type]?.text}</Tag>
              <Tag color={statusMap[orderDetail.status]?.color}>{statusMap[orderDetail.status]?.text}</Tag>
              {orderDetail.priority !== 0 && (
                <Tag color={priorityMap[orderDetail.priority]?.color}>{priorityMap[orderDetail.priority]?.text}</Tag>
              )}
              <span style={{ marginLeft: 8, fontWeight: 500 }}>{orderDetail.order_no}</span>
            </div>

            <Row gutter={24}>
              <Col xs={24} lg={16}>
                <Card size="small" title="订单信息" style={{ marginBottom: 16 }}>
                  <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                    <Descriptions.Item label="任务标题">{orderDetail.title}</Descriptions.Item>
                    <Descriptions.Item label="订单类型">{typeMap[orderDetail.type]?.text}</Descriptions.Item>
                    <Descriptions.Item label="优先级">
                      <Tag color={priorityMap[orderDetail.priority]?.color}>{priorityMap[orderDetail.priority]?.text || '普通'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="期望时效">
                      {orderDetail.estimated_duration ? `${orderDetail.estimated_duration} 分钟` : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="服务费">¥{orderDetail.fee}</Descriptions.Item>
                    <Descriptions.Item label="额外奖励">{orderDetail.reward ? `¥${orderDetail.reward}` : '无'}</Descriptions.Item>
                    <Descriptions.Item label="期望送达时间">
                      {orderDetail.deadline ? dayjs(orderDetail.deadline).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="匹配方式">
                      {orderDetail.assigned_at ? (
                        <Tag color="green">自动匹配</Tag>
                      ) : (
                        <Tag color="orange">待匹配</Tag>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="调度时间">
                      {orderDetail.assigned_at ? dayjs(orderDetail.assigned_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="需求方">
                      <Space size={4}>
                        <UserOutlined />
                        {orderDetail.requester_name || `ID: ${orderDetail.requester_id?.slice(0, 8)}`}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="跑腿员">
                      {orderDetail.courier_name || '暂未分配'}
                    </Descriptions.Item>
                    <Descriptions.Item label="服务要求">
                      <Space size={4}>
                        {orderDetail.require_photo ? <Tag color="blue">需拍照留痕</Tag> : null}
                        {orderDetail.require_signature ? <Tag color="purple">需签收确认</Tag> : null}
                        {!orderDetail.require_photo && !orderDetail.require_signature ? '无特殊要求' : null}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="接单时间">
                      {orderDetail.accepted_at ? dayjs(orderDetail.accepted_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="上门时间">
                      {orderDetail.arrived_at ? dayjs(orderDetail.arrived_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="完成时间">
                      {orderDetail.completed_at ? dayjs(orderDetail.completed_at).format('YYYY-MM-DD HH:mm') : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {dayjs(orderDetail.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Descriptions.Item>
                    <Descriptions.Item label="详细描述" span={2}>{orderDetail.description || '-'}</Descriptions.Item>
                    {orderDetail.pickup_address && (
                      <Descriptions.Item label="取件地址">
                        <EnvironmentOutlined /> {orderDetail.pickup_address}
                      </Descriptions.Item>
                    )}
                    {orderDetail.delivery_address && (
                      <Descriptions.Item label="送达地址">
                        <EnvironmentOutlined /> {orderDetail.delivery_address}
                      </Descriptions.Item>
                    )}
                    {orderDetail.purchase_items && (
                      <Descriptions.Item label="购买清单" span={2}>{orderDetail.purchase_items}</Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>

                <Card size="small" title="履约时间线" style={{ marginBottom: 16 }}>
                  <Timeline
                    items={((orderTracking || []).length > 0
                      ? orderTracking
                      : [
                          { status: 'pending', time: orderDetail.created_at, note: '订单已创建' },
                        ]
                    ).map((item) => ({
                      color: statusMap[item.status]?.color || 'blue',
                      dot: timelineIconMap[item.status],
                      children: (
                        <div>
                          <div>
                            <Tag color={statusMap[item.status]?.color} style={{ marginRight: 4 }}>
                              {statusMap[item.status]?.text || item.status}
                            </Tag>
                            <span style={{ fontSize: 12, color: '#999' }}>
                              {item.time ? dayjs(item.time).format('YYYY-MM-DD HH:mm') : ''}
                            </span>
                          </div>
                          {item.note && <div style={{ fontSize: 13, marginTop: 4 }}>{item.note}</div>}
                          {item.photos?.length > 0 && (
                            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {item.photos.map((photo, i) => (
                                <Image
                                  key={i}
                                  width={80}
                                  height={80}
                                  src={photo}
                                  style={{ borderRadius: 4, objectFit: 'cover' }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ),
                    }))}
                  />
                </Card>

                {orderDetail.status === 'timeout' && (
                  <Alert
                    message="订单超时"
                    description={`已超时 ${Math.round((Date.now() - new Date(orderDetail.deadline).getTime()) / 60000)} 分钟，请尽快处理或转派`}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                    action={
                      <Button
                        size="small"
                        danger
                        onClick={() => { setReassignOrder(orderDetail); setReassignVisible(true); setDetailVisible(false); }}
                      >
                        立即转派
                      </Button>
                    }
                  />
                )}
              </Col>

              <Col xs={24} lg={8}>
                {orderReviews?.length > 0 ? (
                  <Card size="small" title="双向评价" style={{ marginBottom: 16 }}>
                    {orderReviews.map((review, idx) => (
                      <div key={idx} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: idx < orderReviews.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Tag color={review.reviewer_role === 'requester' ? 'blue' : 'green'}>
                            {review.reviewer_role === 'requester' ? '需求方评价' : '跑腿员评价'}
                          </Tag>
                          <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                        </div>
                        {review.comment && <div style={{ fontSize: 13 }}>{review.comment}</div>}
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                          {dayjs(review.created_at).format('YYYY-MM-DD HH:mm')}
                        </div>
                      </div>
                    ))}
                  </Card>
                ) : orderDetail.status === 'completed' ? (
                  <Alert message="暂无评价" type="info" showIcon style={{ marginBottom: 16 }} />
                ) : null}

                <Card size="small" title="追踪留痕记录">
                  {orderTracking?.filter(t => t.photos?.length > 0 || t.location).length > 0 ? (
                    orderTracking.filter(t => t.photos?.length > 0 || t.location).map((record, idx) => (
                      <div key={idx} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 6 }}>
                        <div style={{ marginBottom: 4 }}>
                          <Tag color="blue">{record.action}</Tag>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            {dayjs(record.created_at).format('MM-DD HH:mm')}
                          </span>
                        </div>
                        {record.location && (
                          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                            <EnvironmentOutlined /> {record.location}
                          </div>
                        )}
                        {record.photos?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {record.photos.map((photo, i) => (
                              <Image
                                key={i}
                                width={60}
                                height={60}
                                src={photo}
                                style={{ borderRadius: 4, objectFit: 'cover' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <Empty description="暂无留痕记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <Empty description="加载失败" />
        )}
      </Modal>

      <Modal
        title="重新分配跑腿员"
        open={reassignVisible}
        onCancel={() => { setReassignVisible(false); reassignForm.resetFields(); }}
        onOk={() => reassignForm.submit()}
      >
        <Form form={reassignForm} layout="vertical" onFinish={handleReassign}>
          <Form.Item name="courier_id" label="跑腿员ID" rules={[{ required: true, message: '请输入跑腿员ID' }]}>
            <Input placeholder="请输入要分配的跑腿员ID" />
          </Form.Item>
          <Form.Item name="reason" label="重分配原因">
            <Input.TextArea rows={2} placeholder="请输入原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
