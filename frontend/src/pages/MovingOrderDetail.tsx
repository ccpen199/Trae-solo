import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Descriptions, Avatar, List, message, Modal, Form, Input, Rate, Divider, Space } from 'antd';
import { 
  UserOutlined, EnvironmentOutlined, CarryOutOutlined, PhoneOutlined,
  PlayCircleOutlined, CheckCircleOutlined, CommentOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import type { MovingOrder } from '../types';
import { useAuth } from '../context/AuthContext';

function MovingOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<MovingOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [claimModalVisible, setClaimModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [disputeForm] = Form.useForm();
  const [claimForm] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await api.get(`/moving-orders/${id}`);
      setOrder(data as MovingOrder);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待指派', color: 'orange' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '搬家中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleStart = async () => {
    try {
      await api.post(`/moving-orders/${id}/start`);
      message.success('搬家已开始');
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleComplete = async () => {
    Modal.confirm({
      title: '确认完工',
      content: '请确认搬家服务已完成',
      onOk: async () => {
        try {
          await api.post(`/moving-orders/${id}/complete`, {});
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
        order_type: 'moving',
        reviewee_id: order?.employer_id === user?.id ? order?.driver_id : order?.employer_id,
        ...values,
      });
      message.success('评价提交成功');
      setReviewModalVisible(false);
      reviewForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const handleSubmitDispute = async (values: any) => {
    try {
      await api.post('/disputes', {
        order_id: id,
        order_type: 'moving',
        respondent_id: order?.employer_id === user?.id ? order?.driver_id : order?.employer_id,
        ...values,
      });
      message.success('纠纷提交成功');
      setDisputeModalVisible(false);
      disputeForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const handleSubmitClaim = async (values: any) => {
    try {
      await api.post('/insurance-claims', {
        order_id: id,
        order_type: 'moving',
        ...values,
      });
      message.success('理赔申请提交成功');
      setClaimModalVisible(false);
      claimForm.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  if (loading) return <div className="page-container">加载中...</div>;
  if (!order) return <div className="page-container">订单不存在</div>;

  const statusInfo = getStatusText(order.status);
  const isEmployer = user?.id === order.employer_id;

  return (
    <div className="page-container">
      <Card 
        title={
          <span>
            <CarryOutOutlined /> {order.title}
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
          <Descriptions.Item label="车型">{order.vehicle_type}</Descriptions.Item>
          <Descriptions.Item label="运输距离">{order.distance} km</Descriptions.Item>
          <Descriptions.Item label="起始地址" span={2}>
            <EnvironmentOutlined /> {order.from_address}
            <Tag color="blue" style={{ marginLeft: 8 }}>
              {order.from_floor}楼 {order.from_elevator ? '有电梯' : '无电梯'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="目的地址" span={2}>
            <EnvironmentOutlined /> {order.to_address}
            <Tag color="green" style={{ marginLeft: 8 }}>
              {order.to_floor}楼 {order.to_elevator ? '有电梯' : '无电梯'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="基础费用">¥{order.base_price}</Descriptions.Item>
          <Descriptions.Item label="打包费用">¥{order.package_price}</Descriptions.Item>
          <Descriptions.Item label="楼层费用">¥{order.floor_price}</Descriptions.Item>
          <Descriptions.Item label="总价" style={{ color: '#fa8c16', fontWeight: 600 }}>
            ¥{order.total_price}
          </Descriptions.Item>
          <Descriptions.Item label="搬家日期">{order.move_date || '未指定'}</Descriptions.Item>
          <Descriptions.Item label="发布时间">{order.created_at}</Descriptions.Item>
          <Descriptions.Item label="服务描述" span={2}>
            {order.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {order.service_packages && order.service_packages.length > 0 && (
        <Card title="服务包" style={{ marginBottom: 16 }} size="small">
          <List
            dataSource={order.service_packages}
            renderItem={(pkg: any) => (
              <List.Item>
                <List.Item.Meta
                  title={pkg.name}
                  description={pkg.description}
                />
                <span style={{ color: '#fa8c16' }}>¥{pkg.base_price}</span>
              </List.Item>
            )}
          />
        </Card>
      )}

      {order.package_list && order.package_list.length > 0 && (
        <Card title={`物品清单 (${order.package_list.length}项)`} style={{ marginBottom: 16 }} size="small">
          <List
            dataSource={order.package_list}
            renderItem={(item: any) => (
              <List.Item>
                <List.Item.Meta
                  title={item.name}
                  description={
                    <Space>
                      <span>数量: {item.quantity}</span>
                      {item.size && <span>尺寸: {item.size === 'small' ? '小' : item.size === 'medium' ? '中' : '大'}</span>}
                      {item.fragile && <Tag color="red">易碎</Tag>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card title="雇主信息" style={{ marginBottom: 16 }} size="small">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar icon={<UserOutlined />} src={order.employer_avatar} size={40} />
          <div style={{ marginLeft: 12 }}>
            <div style={{ fontWeight: 500 }}>{order.employer_real_name || order.employer_name}</div>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>
              <PhoneOutlined /> {order.employer_phone || '未填写'}
            </div>
          </div>
        </div>
      </Card>

      {order.driver_id && (
        <Card title="司机信息" style={{ marginBottom: 16 }} size="small">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<CarryOutOutlined />} src={order.driver_avatar} size={40} style={{ background: '#fa8c16' }} />
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{order.driver_real_name || order.driver_name}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                {order.vehicle_type} · <PhoneOutlined /> {order.driver_phone || '未填写'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {order.workers && order.workers.length > 0 && (
        <Card title={`搬运工人 (${order.workers.length}人)`} style={{ marginBottom: 16 }} size="small">
          <List
            dataSource={order.workers}
            renderItem={(worker: any) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={worker.avatar} icon={<UserOutlined />} />}
                  title={worker.real_name || worker.username}
                  description={worker.skills?.join(', ') || '专业搬运工'}
                />
                <Rate disabled defaultValue={worker.rating || 5} allowHalf style={{ fontSize: 12 }} />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {(order.driver_id === user?.id || (order.workers?.some((w: any) => w.id === user?.id))) && order.status === 'accepted' && (
            <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleStart}>
              开始搬家
            </Button>
          )}

          {(order.driver_id === user?.id || isEmployer) && order.status === 'in_progress' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleComplete}>
              确认完工
            </Button>
          )}

          {order.status === 'completed' && (
            <Button icon={<CommentOutlined />} onClick={() => setReviewModalVisible(true)}>
              发表评价
            </Button>
          )}

          {isEmployer && order.status === 'completed' && (
            <Button danger icon={ExclamationCircleOutlined} onClick={() => setClaimModalVisible(true)}>
              申请理赔
            </Button>
          )}

          {order.status !== 'pending' && order.status !== 'completed' && (
            <Button icon={<ExclamationCircleOutlined />} onClick={() => setDisputeModalVisible(true)}>
              申请纠纷
            </Button>
          )}
        </div>
      </Card>

      <Modal title="发表评价" open={reviewModalVisible} onCancel={() => setReviewModalVisible(false)} footer={null}>
        <Form form={reviewForm} onFinish={handleSubmitReview} layout="vertical">
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

      <Modal title="申请纠纷" open={disputeModalVisible} onCancel={() => setDisputeModalVisible(false)} footer={null}>
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

      <Modal title="保险理赔申请" open={claimModalVisible} onCancel={() => setClaimModalVisible(false)} footer={null}>
        <Form form={claimForm} onFinish={handleSubmitClaim} layout="vertical">
          <Form.Item label="理赔金额 (元)" name="claim_amount" rules={[{ required: true, message: '请输入理赔金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入理赔金额" />
          </Form.Item>
          <Form.Item label="理赔原因" name="claim_reason" rules={[{ required: true, message: '请输入理赔原因' }]}>
            <Input placeholder="请输入理赔原因" />
          </Form.Item>
          <Form.Item label="详细描述" name="description">
            <Input.TextArea rows={4} placeholder="请详细描述理赔情况" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default MovingOrderDetail;
