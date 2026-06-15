import React, { useState, useEffect } from 'react';
import { 
  Card, Tag, Button, Descriptions, Avatar, List, message, Modal, 
  Form, Input, InputNumber, Rate, Divider, Table, Space
} from 'antd';
import { 
  UserOutlined, EnvironmentOutlined, CarOutlined, PhoneOutlined,
  PlayCircleOutlined, CheckCircleOutlined, CommentOutlined,
  ExclamationCircleOutlined, RiseOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import type { DeliveryOrder } from '../types';
import { useAuth } from '../context/AuthContext';

function DeliveryOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [bidForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [disputeForm] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await api.get(`/delivery-orders/${id}`);
      setOrder(data as DeliveryOrder);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      bidding: { text: '竞价中', color: 'magenta' },
      accepted: { text: '已接单', color: 'blue' },
      in_progress: { text: '运输中', color: 'green' },
      completed: { text: '已完成', color: 'default' },
      cancelled: { text: '已取消', color: 'red' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleBid = async (values: any) => {
    try {
      await api.post(`/delivery-orders/${id}/bid`, values);
      message.success('竞价提交成功');
      setBidModalVisible(false);
      bidForm.resetFields();
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    Modal.confirm({
      title: '确认接受报价',
      content: '确定要接受该司机的报价吗？',
      onOk: async () => {
        try {
          await api.post(`/delivery-orders/${id}/accept-bid`, { bid_id: bidId });
          message.success('已接受报价');
          fetchOrder();
        } catch (error: any) {
          message.error(error.response?.data?.error || '操作失败');
        }
      },
    });
  };

  const handleStart = async () => {
    try {
      await api.post(`/delivery-orders/${id}/start`);
      message.success('运输已开始');
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleComplete = async () => {
    Modal.confirm({
      title: '确认送达',
      content: user?.role === 'driver' ? '确认货物已送达？' : '确认已收到货物？',
      onOk: async () => {
        try {
          await api.post(`/delivery-orders/${id}/complete`, {});
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
        order_type: 'delivery',
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
        order_type: 'delivery',
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

  if (loading) return <div className="page-container">加载中...</div>;
  if (!order) return <div className="page-container">订单不存在</div>;

  const statusInfo = getStatusText(order.status);
  const isEmployer = user?.id === order.employer_id;
  const isDriver = user?.id === order.driver_id;

  const bidColumns = [
    {
      title: '司机',
      dataIndex: 'driver_name',
      key: 'driver_name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar src={record.driver_avatar} icon={<UserOutlined />} size="small" />
          <span>{text}</span>
          <span style={{ color: '#8c8c8c', fontSize: 12 }}>信用分:{record.credit_score}</span>
        </Space>
      ),
    },
    { title: '车型', dataIndex: 'vehicle_type', key: 'vehicle_type' },
    { title: '车牌号', dataIndex: 'plate_number', key: 'plate_number' },
    { title: '评分', dataIndex: 'rating', key: 'rating', render: (v: number) => <Rate disabled defaultValue={v} allowHalf style={{ fontSize: 12 }} /> },
    { title: '完成订单', dataIndex: 'completed_orders', key: 'completed_orders' },
    { title: '报价', dataIndex: 'bid_price', key: 'bid_price', render: (v: number) => <span style={{ color: '#fa8c16', fontWeight: 600 }}>¥{v}</span> },
    { title: '留言', dataIndex: 'message', key: 'message' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        isEmployer && order.status === 'bidding' ? (
          <Button type="primary" size="small" onClick={() => handleAcceptBid(record.id)}>
            接受报价
          </Button>
        ) : (
          <Tag color={record.status === 'accepted' ? 'green' : 'default'}>
            {record.status === 'accepted' ? '已中标' : '待选中'}
          </Tag>
        )
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card 
        title={
          <span>
            <CarOutlined /> {order.title}
            <Tag color={statusInfo.color} style={{ marginLeft: 12 }}>{statusInfo.text}</Tag>
          </span>
        }
        extra={
          <span style={{ color: '#fa8c16', fontSize: 24, fontWeight: 600 }}>
            {order.status === 'bidding' ? `起拍 ¥${order.bid_start_price}` : `¥${order.final_price}`}
          </span>
        }
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="运单号">{order.waybill_no}</Descriptions.Item>
          <Descriptions.Item label="所需车型">{order.vehicle_type_required}</Descriptions.Item>
          <Descriptions.Item label="货物类型">{order.goods_type || '普通货物'}</Descriptions.Item>
          <Descriptions.Item label="重量/体积">{order.weight}吨 / {order.volume}m³</Descriptions.Item>
          <Descriptions.Item label="运输距离">{order.distance} km</Descriptions.Item>
          <Descriptions.Item label="发布时间">{order.created_at}</Descriptions.Item>
          <Descriptions.Item label="发货地址" span={2}>
            <EnvironmentOutlined /> {order.pickup_address}
          </Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>
            <EnvironmentOutlined /> {order.delivery_address}
          </Descriptions.Item>
          <Descriptions.Item label="货物描述" span={2}>
            {order.description || '暂无描述'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {order.bids && order.bids.length > 0 && (
        <Card title={`竞价列表 (${order.bids.length})`} style={{ marginBottom: 16 }}>
          <Table
            dataSource={order.bids}
            columns={bidColumns}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </Card>
      )}

      <Card title="发货人信息" style={{ marginBottom: 16 }} size="small">
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
        <Card title="承运人信息" style={{ marginBottom: 16 }} size="small">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar icon={<CarOutlined />} src={order.driver_avatar} size={40} style={{ background: '#52c41a' }} />
            <div style={{ marginLeft: 12, flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{order.driver_real_name || order.driver_name}</div>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                {order.vehicle_type} · {order.plate_number} · <PhoneOutlined /> {order.driver_phone || '未填写'}
              </div>
            </div>
            <Rate disabled defaultValue={order.rating || 5} allowHalf style={{ fontSize: 14 }} />
          </div>
        </Card>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {user?.role === 'driver' && order.status === 'bidding' && (
            <Button type="primary" size="large" icon={<RiseOutlined />} onClick={() => setBidModalVisible(true)}>
              我要竞价
            </Button>
          )}
          
          {isDriver && order.status === 'accepted' && (
            <Button type="primary" size="large" icon={<PlayCircleOutlined />} onClick={handleStart}>
              开始运输
            </Button>
          )}

          {isDriver && order.status === 'in_progress' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleComplete}>
              确认送达
            </Button>
          )}

          {isEmployer && order.status === 'in_progress' && (
            <Button type="primary" size="large" icon={<CheckCircleOutlined />} onClick={handleComplete}>
              确认收货
            </Button>
          )}

          {order.status === 'completed' && (
            <Button icon={<CommentOutlined />} onClick={() => setReviewModalVisible(true)}>
              发表评价
            </Button>
          )}

          {(isDriver || isEmployer) && order.status !== 'bidding' && order.status !== 'completed' && (
            <Button icon={<ExclamationCircleOutlined />} onClick={() => setDisputeModalVisible(true)}>
              申请纠纷
            </Button>
          )}
        </div>
      </Card>

      <Modal title="提交报价" open={bidModalVisible} onCancel={() => setBidModalVisible(false)} footer={null}>
        <Form form={bidForm} onFinish={handleBid} layout="vertical">
          <Form.Item label="报价金额 (元)" name="bid_price" rules={[{ required: true, message: '请输入报价' }]}>
            <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入您的报价" />
          </Form.Item>
          <Form.Item label="留言" name="message">
            <Input.TextArea rows={3} placeholder="可以给发货人留言" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交报价</Button>
          </Form.Item>
        </Form>
      </Modal>

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
    </div>
  );
}

export default DeliveryOrderDetail;
