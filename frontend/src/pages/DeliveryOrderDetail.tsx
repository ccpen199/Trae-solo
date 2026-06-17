import React, { useState, useEffect } from 'react';
import { 
  Card, Tag, Button, Descriptions, Avatar, List, message, Modal, 
  Form, Input, InputNumber, Rate, Divider, Table, Space, Alert, Progress, Row, Col, Select
} from 'antd';
import { 
  UserOutlined, EnvironmentOutlined, CarOutlined, PhoneOutlined,
  PlayCircleOutlined, CheckCircleOutlined, CommentOutlined,
  ExclamationCircleOutlined, RiseOutlined, SafetyOutlined,
  FileTextOutlined, TeamOutlined, GoldOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import type { DeliveryOrder, GpsTrack, InsuranceClaim } from '../types';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;

function DeliveryOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsTracks, setGpsTracks] = useState<GpsTrack[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<InsuranceClaim[]>([]);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [gpsModalVisible, setGpsModalVisible] = useState(false);
  const [insuranceModalVisible, setInsuranceModalVisible] = useState(false);
  const [bidForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [disputeForm] = Form.useForm();
  const [insuranceForm] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data: any = await api.get(`/delivery-orders/${id}`);
      setOrder(data as DeliveryOrder);
      if (data.gps_tracks) {
        setGpsTracks(data.gps_tracks);
      }
      if (data.insurance_claims) {
        setInsuranceClaims(data.insurance_claims);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitInsurance = async (values: any) => {
    try {
      await api.post('/insurance-claims', {
        order_id: id,
        order_type: 'delivery',
        ...values,
      });
      message.success('保险理赔申请已提交');
      setInsuranceModalVisible(false);
      insuranceForm.resetFields();
      fetchOrder();
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交失败');
    }
  };

  const isVehicleMatch = (bidVehicleType: string) => {
    if (!order?.vehicle_type_required || !bidVehicleType) return false;
    return order.vehicle_type_required === bidVehicleType;
  };

  const getConfirmationProgress = () => {
    const confirmation = (order as any)?.confirmation;
    if (!confirmation) return 0;
    let count = 0;
    if (confirmation.employer_confirmed) count++;
    if (confirmation.driver_confirmed) count++;
    return Math.round((count / 2) * 100);
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
          <div>
            <div>{text}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>
              <GoldOutlined style={{ color: '#faad14', marginRight: 4 }} />
              信用分: {record.credit_score || '100'}
              {record.completed_orders !== undefined && (
                <span style={{ marginLeft: 8 }}>完成 {record.completed_orders} 单</span>
              )}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '车型',
      dataIndex: 'vehicle_type',
      key: 'vehicle_type',
      render: (text: string, record: any) => (
        <Space>
          <Tag color={isVehicleMatch(text) ? 'green' : 'default'}>
            {isVehicleMatch(text) && <span>✓ </span>}
            {text || '未填写'}
          </Tag>
          {isVehicleMatch(text) && (
            <Tag color="success">车型匹配</Tag>
          )}
        </Space>
      ),
    },
    { title: '车牌号', dataIndex: 'plate_number', key: 'plate_number', render: (text: string) => text || '未填写' },
    { 
      title: '评分', 
      dataIndex: 'rating', 
      key: 'rating', 
      render: (v: number) => (
        <Space>
          <Rate disabled defaultValue={v || 5} allowHalf style={{ fontSize: 12 }} />
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{v || '5.0'}</span>
        </Space>
      )
    },
    { title: '报价', dataIndex: 'bid_price', key: 'bid_price', render: (v: number) => <span style={{ color: '#fa8c16', fontWeight: 600 }}>¥{v}</span> },
    { title: '留言', dataIndex: 'message', key: 'message', render: (text: string) => text || '暂无留言' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        isEmployer && order.status === 'bidding' ? (
          <Button type={isVehicleMatch(record.vehicle_type) ? 'primary' : 'default'} size="small" onClick={() => handleAcceptBid(record.id)}>
            {isVehicleMatch(record.vehicle_type) ? '推荐选择' : '接受报价'}
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

      <Card title="物流履约与风控状态" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="车型智能匹配">
            <Tag color="blue">{order.vehicle_type_required}</Tag>
            {order.driver_id ? <Tag color="green">已选司机</Tag> : <Tag color="magenta">竞价匹配中</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="电子运单">
            <Tag color="cyan">{order.waybill_no}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="竞价记录">
            <Tag color={order.bids?.length ? 'green' : 'default'}>{order.bids?.length || 0} 条报价</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="GPS 轨迹">
            <Tag color={(order as any).gps_tracks?.length ? 'green' : 'default'}>
              {(order as any).gps_tracks?.length || 0} 条定位记录
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="收发确认">
            <Space wrap>
              <Tag color={(order as any).confirmation?.employer_confirmed ? 'green' : 'default'}>发货方确认</Tag>
              <Tag color={(order as any).confirmation?.driver_confirmed ? 'green' : 'default'}>司机确认</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="理赔 / 纠纷">
            <Space wrap>
              <Tag color={(order as any).insurance_claims?.length ? 'red' : 'green'}>理赔 {(order as any).insurance_claims?.length || 0}</Tag>
              <Tag color={(order as any).disputes?.length ? 'orange' : 'green'}>纠纷 {(order as any).disputes?.length || 0}</Tag>
            </Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {order.bids && order.bids.length > 0 && (
        <Card 
          title={
            <Space>
              竞价列表 ({order.bids.length})
              {order.bids.some((bid: any) => isVehicleMatch(bid.vehicle_type)) && (
                <Tag color="success">
                  {order.bids.filter((bid: any) => isVehicleMatch(bid.vehicle_type)).length} 位司机车型匹配
                </Tag>
              )}
            </Space>
          } 
          style={{ marginBottom: 16 }}
          extra={
            <Alert
              type="info"
              showIcon
              message="智能匹配提示"
              description={`订单需要 ${order.vehicle_type_required}，绿色标签表示司机车型与订单需求匹配`}
              style={{ border: 'none', padding: 0, background: 'transparent' }}
            />
          }
        >
          <Table
            dataSource={order.bids}
            columns={bidColumns}
            rowKey="id"
            size="small"
            pagination={false}
            rowClassName={(record: any) => isVehicleMatch(record.vehicle_type) ? 'bid-row-matched' : ''}
          />
          <style>{`
            .bid-row-matched {
              background: #f6ffed !important;
            }
            .bid-row-matched:hover > td {
              background: #d9f7be !important;
            }
          `}</style>
        </Card>
      )}

      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            电子运单
          </Space>
        } 
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Alert
          type="success"
          showIcon
          message="电子运单已生成"
          description={`运单号: ${order.waybill_no}，全程可追溯，保险已生效`}
          style={{ marginBottom: 16 }}
        />
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="运单号">
            <span style={{ fontWeight: 600, color: '#1890ff', fontSize: 16 }}>
              {order.waybill_no}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="货物类型">{order.goods_type || '普通货物'}</Descriptions.Item>
          <Descriptions.Item label="重量/体积">{order.weight} 吨 / {order.volume} m³</Descriptions.Item>
          <Descriptions.Item label="运输距离">{order.distance} 公里</Descriptions.Item>
          <Descriptions.Item label="所需车型">
            <Tag color="blue">{order.vehicle_type_required}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="运费">
            <span style={{ color: '#fa8c16', fontWeight: 600 }}>
              ¥{order.status === 'bidding' ? order.bid_start_price : order.final_price}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="发货地址" span={2}>
            <EnvironmentOutlined /> {order.pickup_address}
          </Descriptions.Item>
          <Descriptions.Item label="收货地址" span={2}>
            <EnvironmentOutlined /> {order.delivery_address}
          </Descriptions.Item>
          {order.description && (
            <Descriptions.Item label="货物描述" span={2}>
              {order.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {order.status !== 'bidding' && order.status !== 'cancelled' && (
        <Card title="物流履约功能模块" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%', cursor: 'pointer' }} hoverable
                onClick={() => gpsTracks.length > 0 ? setGpsModalVisible(true) : message.info('暂无GPS轨迹数据')}>
                <div style={{ textAlign: 'center' }}>
                  <EnvironmentOutlined style={{ fontSize: 32, color: gpsTracks.length > 0 ? '#13c2c2' : '#bfbfbf' }} />
                  <div style={{ fontWeight: 500, marginTop: 8 }}>运输轨迹</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {gpsTracks.length} 条定位记录
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%', cursor: 'pointer' }} hoverable
                onClick={() => message.info('收发确认状态请查看下方履约追踪卡片')}>
                <div style={{ textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div style={{ fontWeight: 500, marginTop: 8 }}>收发确认</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {getConfirmationProgress()}% 已完成
                  </div>
                  <Progress percent={getConfirmationProgress()} size="small" style={{ marginTop: 8 }} />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card size="small" style={{ height: '100%', cursor: 'pointer' }} hoverable
                onClick={() => setInsuranceModalVisible(true)}>
                <div style={{ textAlign: 'center' }}>
                  <SafetyOutlined style={{ fontSize: 32, color: insuranceClaims.length > 0 ? '#faad14' : '#52c41a' }} />
                  <div style={{ fontWeight: 500, marginTop: 8 }}>保险理赔</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                    {insuranceClaims.length > 0 ? `${insuranceClaims.length} 笔申请` : '申请理赔'}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      {insuranceClaims.length > 0 && (
        <Card title="保险理赔记录" style={{ marginBottom: 16 }}>
          <List
            dataSource={insuranceClaims}
            renderItem={(claim) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<SafetyOutlined style={{ fontSize: 24, color: '#faad14' }} />}
                  title={
                    <span>
                      理赔申请 - ¥{claim.claim_amount}
                      <Tag style={{ marginLeft: 8 }} color={claim.status === 'resolved' ? 'green' : claim.status === 'pending' ? 'orange' : 'red'}>
                        {claim.status === 'resolved' ? '已赔付' : claim.status === 'pending' ? '处理中' : claim.status}
                      </Tag>
                    </span>
                  }
                  description={
                    <span>
                      原因: {claim.claim_reason} | {claim.insurance_company}
                      {claim.payout_amount !== undefined && claim.payout_amount !== null && (
                        <span style={{ color: '#52c41a', marginLeft: 8 }}>已赔付: ¥{claim.payout_amount}</span>
                      )}
                    </span>
                  }
                />
                <span style={{ color: '#8c8c8c', fontSize: 12 }}>{claim.created_at}</span>
              </List.Item>
            )}
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
            <Rate disabled defaultValue={(order as any).rating || 5} allowHalf style={{ fontSize: 14 }} />
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

          {(isDriver || isEmployer) && order.status !== 'bidding' && order.status !== 'cancelled' && gpsTracks.length > 0 && (
            <Button size="large" icon={<EnvironmentOutlined />} onClick={() => setGpsModalVisible(true)}>
              运输轨迹
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

          {order.status !== 'bidding' && order.status !== 'cancelled' && (
            <Button icon={<SafetyOutlined />} onClick={() => setInsuranceModalVisible(true)}>
              保险理赔
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

      <Modal
        title="GPS运输轨迹"
        open={gpsModalVisible}
        onCancel={() => setGpsModalVisible(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setGpsModalVisible(false)}>关闭</Button>,
        ]}
      >
        {gpsTracks.length > 0 ? (
          <>
            <Alert
              type="info"
              showIcon
              message="运输轨迹记录"
              description={`共记录 ${gpsTracks.length} 条定位数据，展示运输过程中的位置变化。`}
              style={{ marginBottom: 16 }}
            />
            <List
              dataSource={gpsTracks}
              renderItem={(track, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        background: index === 0 ? '#52c41a' : index === gpsTracks.length - 1 ? '#ff4d4f' : '#1890ff',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {gpsTracks.length - index}
                      </div>
                    }
                    title={
                      <span>
                        {index === 0 && <Tag color="green">当前位置</Tag>}
                        {index === gpsTracks.length - 1 && <Tag color="red">起点</Tag>}
                        经度: {track.longitude?.toFixed(6)} | 纬度: {track.latitude?.toFixed(6)}
                      </span>
                    }
                    description={
                      <span>
                        {track.timestamp}
                        {track.speed !== undefined && ` | 速度: ${track.speed} km/h`}
                        {track.heading !== undefined && ` | 方向: ${track.heading}°`}
                        {track.accuracy !== undefined && ` | 精度: ±${track.accuracy}m`}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
            <EnvironmentOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>暂无轨迹数据</div>
          </div>
        )}
      </Modal>

      <Modal
        title="保险理赔申请"
        open={insuranceModalVisible}
        onCancel={() => setInsuranceModalVisible(false)}
        footer={null}
      >
        <Form form={insuranceForm} onFinish={handleSubmitInsurance} layout="vertical">
          <Form.Item label="理赔金额 (元)" name="claim_amount" rules={[{ required: true, message: '请输入理赔金额' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入申请理赔的金额" />
          </Form.Item>
          <Form.Item label="理赔原因" name="claim_reason" rules={[{ required: true, message: '请输入理赔原因' }]}>
            <Select placeholder="选择理赔原因">
              <Option value="货物破损">货物破损</Option>
              <Option value="货物丢失">货物丢失</Option>
              <Option value="运输延误">运输延误</Option>
              <Option value="温度异常">冷链温度异常</Option>
              <Option value="其他">其他原因</Option>
            </Select>
          </Form.Item>
          <Form.Item label="详细描述" name="description" rules={[{ required: true, message: '请描述具体情况' }]}>
            <TextArea rows={4} placeholder="请详细描述理赔情况，包括时间、地点、损失情况等" />
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
