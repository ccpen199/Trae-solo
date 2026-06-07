import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Timeline, Button, Modal, Form,
  Input, Rate, message, Spin, Empty, Row, Col, Image, Divider, Space,
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined, CarOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { orderAPI } from '../../api';

const { TextArea } = Input;

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
};

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getDetail(id);
      setOrder(res.data || res);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancel = () => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消此订单吗？取消后无法恢复。',
      okText: '确认取消',
      cancelText: '再想想',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await orderAPI.cancel(id);
          message.success('订单已取消');
          fetchOrder();
        } catch {}
      },
    });
  };

  const handleReview = async (values) => {
    setReviewLoading(true);
    try {
      await orderAPI.review(id, values);
      message.success('评价提交成功');
      setReviewVisible(false);
      fetchOrder();
    } catch {
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (!order) {
    return <Empty description="订单不存在" />;
  }

  const canCancel = ['pending', 'dispatched'].includes(order.status);
  const canReview = order.status === 'completed' && !order.review;

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/requester/orders')}
        style={{ marginBottom: 16 }}
      >
        返回订单列表
      </Button>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span>
                <Tag color={typeMap[order.type]?.color}>{typeMap[order.type]?.text}</Tag>
                <Tag color={statusMap[order.status]?.color}>{statusMap[order.status]?.text}</Tag>
                {order.priority !== 0 && (
                  <Tag color={priorityMap[order.priority]?.color}>{priorityMap[order.priority]?.text}</Tag>
                )}
                {order.order_no}
              </span>
            }
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="任务标题">{order.title}</Descriptions.Item>
              <Descriptions.Item label="订单类型">{typeMap[order.type]?.text}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityMap[order.priority]?.color}>{priorityMap[order.priority]?.text || '普通'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="期望时效">
                {order.estimated_duration ? `${order.estimated_duration} 分钟` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="详细描述" span={2}>{order.description}</Descriptions.Item>
              {order.pickup_address && (
                <Descriptions.Item label="取件地址">
                  <EnvironmentOutlined /> {order.pickup_address}
                </Descriptions.Item>
              )}
              {order.delivery_address && (
                <Descriptions.Item label="送达地址">
                  <EnvironmentOutlined /> {order.delivery_address}
                </Descriptions.Item>
              )}
              {order.purchase_items && (
                <Descriptions.Item label="购买清单" span={2}>{order.purchase_items}</Descriptions.Item>
              )}
              <Descriptions.Item label="服务费">¥{order.fee}</Descriptions.Item>
              <Descriptions.Item label="额外奖励">{order.reward ? `¥${order.reward}` : '无'}</Descriptions.Item>
              <Descriptions.Item label="期望送达时间">
                {order.deadline ? dayjs(order.deadline).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="匹配方式">
                {order.assigned_at ? (
                  <Tag color="green">自动匹配</Tag>
                ) : (
                  <Tag color="orange">待匹配</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="调度时间">
                {order.assigned_at ? dayjs(order.assigned_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="跑腿员">
                {order.courier_name || '暂未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="服务要求">
                <Space size={4}>
                  {order.require_photo ? <Tag color="blue">需拍照留痕</Tag> : null}
                  {order.require_signature ? <Tag color="purple">需签收确认</Tag> : null}
                  {!order.require_photo && !order.require_signature ? '无特殊要求' : null}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="接单时间">
                {order.accepted_at ? dayjs(order.accepted_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="上门时间">
                {order.arrived_at ? dayjs(order.arrived_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {order.completed_at ? dayjs(order.completed_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(order.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              {canCancel && (
                <Button danger onClick={handleCancel}>取消订单</Button>
              )}
              {canReview && (
                <Button type="primary" onClick={() => setReviewVisible(true)} style={{ marginLeft: 8 }}>
                  评价
                </Button>
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="订单进度" size="small" style={{ marginBottom: 16 }}>
            <Timeline
              items={((order.tracking_history || []).length > 0
                ? order.tracking_history
                : [
                    { status: 'pending', time: order.created_at, note: '订单已创建' },
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
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {item.time ? dayjs(item.time).format('HH:mm') : ''}
                      </Text>
                    </div>
                    {item.note && <Text type="secondary" style={{ fontSize: 12 }}>{item.note}</Text>}
                  </div>
                ),
              }))}
            />
          </Card>

          <Card title="追踪记录" size="small">
            {order.tracking_records?.length > 0 ? (
              order.tracking_records.map((record, idx) => (
                <div key={idx} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 6 }}>
                  <div style={{ marginBottom: 4 }}>
                    <Tag color="blue">{record.action}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(record.created_at).format('MM-DD HH:mm')}
                    </Text>
                  </div>
                  {record.note && <Text style={{ fontSize: 13 }}>{record.note}</Text>}
                  {record.photos?.length > 0 && (
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {record.photos.map((photo, i) => (
                        <Image key={i} width={60} height={60} src={photo} style={{ borderRadius: 4, objectFit: 'cover' }} />
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <Empty description="暂无追踪记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="订单评价"
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={reviewLoading}
      >
        <Form form={form} layout="vertical" onFinish={handleReview}>
          <Form.Item name="rating" label="评分" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="评价内容">
            <TextArea rows={3} placeholder="请输入您的评价" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
