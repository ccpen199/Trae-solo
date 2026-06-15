import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Descriptions, Avatar, List, message, Modal, Form, Input, Rate, Divider } from 'antd';
import { 
  UserOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  PhoneOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  CommentOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import type { LaborOrder, Review } from '../types';
import { useAuth } from '../context/AuthContext';

function LaborOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<LaborOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [disputeForm] = Form.useForm();

  useEffect(() => {
    fetchOrder();
    fetchReviews();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await api.get(`/labor-orders/${id}`);
      setOrder(data as LaborOrder);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data: any = await api.get(`/reviews/${id}`);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待接单', color: 'orange' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '进行中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
      split: { text: '已拆单', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleTakeOrder = async () => {
    try {
      await api.post(`/labor-orders/${id}/take-order`);
      message.success('接单成功');
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '接单失败');
    }
  };

  const handleStartService = async () => {
    try {
      await api.post(`/labor-orders/${id}/start`);
      message.success('服务已开始');
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleComplete = async () => {
    Modal.confirm({
      title: '确认完工',
      content: '请确认服务已完成',
      onOk: async () => {
        try {
          await api.post(`/labor-orders/${id}/complete`, {});
          message.success('确认已提交');
          fetchOrder();
        } catch (error: any) {
          message.error(error.response?.data?.error || '操作失败');
        }
      },
    });
  };

  const handleSubmitReview = async (values: any) => {
    try {
      await api.post('/reviews', {
        order_id: id,
        order_type: 'labor',
        reviewee_id: order?.employer_id === user?.id ? order?.worker_id : order?.employer_id,
        ...values,
      });
      message.success('评价提交成功');
      setReviewModalVisible(false);
      form.resetFields();
      fetchReviews();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const handleSubmitDispute = async (values: any) => {
    try {
      await api.post('/disputes', {
        order_id: id,
        order_type: 'labor',
        respondent_id: order?.employer_id === user?.id ? order?.worker_id : order?.employer_id,
        ...values,
      });
      message.success('纠纷提交成功');
      setDisputeModalVisible(false);
      disputeForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  if (loading) return <div className="page-container">加载中...</div>;
  if (!order) return <div className="page-container">订单不存在</div>;

  const statusInfo = getStatusText(order.status);
  const isEmployer = user?.id === order.employer_id;
  const isWorker = user?.id === order.worker_id;

  return (
    <div className="page-container">
      <Card 
        title={
          <span>
            {order.title}
            <Tag color={statusInfo.color} style={{ marginLeft: 12 }}>{statusInfo.text}</Tag>
          </span>
        }
        extra={
          <span style={{ color: '#fa8c16', fontSize: 24, fontWeight: 600 }}>
            ¥{order.total_price}
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="服务类型">
            {order.category || '用工服务'}
          </Descriptions.Item>
          <Descriptions.Item label="计价方式">
            {order.pricing_type === 'hourly' ? '按小时计价' : '按任务计价'}
          </Descriptions.Item>
          <Descriptions.Item label="服务地址">
            <EnvironmentOutlined /> {order.city} {order.address}
          </Descriptions.Item>
          <Descriptions.Item label="需求人数">
            {order.worker_count} 人
          </Descriptions.Item>
          {order.pricing_type === 'hourly' && (
            <>
              <Descriptions.Item label="单价">¥{order.price_per_hour}/小时</Descriptions.Item>
              <Descriptions.Item label="预估工时">{order.estimated_hours} 小时</Descriptions.Item>
            </>
          )}
          {order.pricing_type === 'task' && (
            <Descriptions.Item label="任务价格" span={2}>¥{order.task_price}</Descriptions.Item>
          )}
          {order.start_time && (
            <Descriptions.Item label="开始时间">
              <ClockCircleOutlined /> {order.start_time}
            </Descriptions.Item>
          )}
          {order.end_time && (
            <Descriptions.Item label="结束时间">{order.end_time}</Descriptions.Item>
          )}
          {order.skills_required && order.skills_required.length > 0 && (
            <Descriptions.Item label="技能要求" span={2}>
              {order.skills_required.map(skill => (
                <Tag key={skill}>{skill}</Tag>
              ))}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="服务描述" span={2}>
            {order.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>

        {order.sub_orders && order.sub_orders.length > 0 && (
          <>
            <Divider orientation="left">子订单</Divider>
            <List
              dataSource={order.sub_orders}
              renderItem={(sub: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={sub.title}
                    description={
                      <span>
                        <Tag color={getStatusText(sub.status).color}>
                          {getStatusText(sub.status).text}
                        </Tag>
                        {sub.worker_name && ` 工人: ${sub.worker_name}`}
                        <span style={{ float: 'right' }}>¥{sub.total_price}</span>
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Card>

      <Card title="雇主信息" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} src={order.employer_avatar} size={48} />
          <div style={{ marginLeft: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 500 }}>{order.employer_real_name || order.employer_name}</div>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>
              <PhoneOutlined /> {order.employer_phone || '未填写'}
            </div>
          </div>
        </div>
      </Card>

      {order.worker_id && (
        <Card title="工人信息" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<UserOutlined />} src={order.worker_avatar} size={48} />
            <div style={{ marginLeft: 16, flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{order.worker_real_name || order.worker_name}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                <PhoneOutlined /> {order.worker_phone || '未填写'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {reviews.length > 0 && (
        <Card title="评价" style={{ marginBottom: 16 }}>
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={review.reviewer_avatar} icon={<UserOutlined />} />}
                  title={
                    <span>
                      {review.reviewer_name}
                      <Rate disabled defaultValue={review.rating} style={{ marginLeft: 12, fontSize: 14 }} />
                    </span>
                  }
                  description={review.content || '暂无评价内容'}
                />
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>{review.created_at}</span>
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {user?.role === 'worker' && order.status === 'pending' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleTakeOrder}>
              立即接单
            </Button>
          )}
          
          {(isWorker || isEmployer) && order.status === 'accepted' && (
            <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleStartService}>
              开始服务
            </Button>
          )}

          {isWorker && order.status === 'in_progress' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleComplete}>
              确认完工
            </Button>
          )}

          {isEmployer && order.status === 'in_progress' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleComplete}>
              确认收货
            </Button>
          )}

          {order.status === 'completed' && reviews.length === 0 && (
            <Button icon={<CommentOutlined />} onClick={() => setReviewModalVisible(true)}>
              发表评价
            </Button>
          )}

          {(isWorker || isEmployer) && order.status !== 'pending' && order.status !== 'completed' && (
            <Button icon={<ExclamationCircleOutlined />} onClick={() => setDisputeModalVisible(true)}>
              申请纠纷
            </Button>
          )}
        </div>
      </Card>

      <Modal
        title="发表评价"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmitReview} layout="vertical">
          <Form.Item label="评分" name="rating" rules={[{ required: true, message: '请评分' }]}>
            <Rate />
          </Form.Item>
          <Form.Item label="评价内容" name="content">
            <Input.TextArea rows={4} placeholder="请输入评价内容" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交评价</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="申请纠纷"
        open={disputeModalVisible}
        onCancel={() => setDisputeModalVisible(false)}
        footer={null}
      >
        <Form form={disputeForm} onFinish={handleSubmitDispute} layout="vertical">
          <Form.Item label="纠纷原因" name="reason" rules={[{ required: true, message: '请输入纠纷原因' }]}>
            <Input placeholder="请简要描述纠纷原因" />
          </Form.Item>
          <Form.Item label="详细描述" name="description">
            <Input.TextArea rows={4} placeholder="请详细描述纠纷情况" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default LaborOrderDetail;
