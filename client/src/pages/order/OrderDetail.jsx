import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Tabs,
  Descriptions,
  Empty,
  Spin,
  message,
  Divider,
  Avatar,
  Steps,
  Modal,
  Form,
  Rate,
  Input,
  Upload,
  Alert,
  Timeline
} from 'antd';
import {
  ArrowLeftOutlined,
  MessageOutlined,
  StarOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  PictureOutlined,
  VideoCameraOutlined,
  SendOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { orderAPI, reviewAPI, merchantAPI, serviceAPI } from '../../api/index.js';
import { isCouple, isMerchant } from '../../utils/auth.js';
import ReviewList from '../../components/common/ReviewList.jsx';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { TextArea } = Input;

const ORDER_STATUS = {
  pending: { label: '待付款', color: 'orange', icon: <ClockCircleOutlined /> },
  paid: { label: '已付款', color: 'blue', icon: <DollarOutlined /> },
  confirmed: { label: '已确认', color: 'cyan', icon: <CheckCircleOutlined /> },
  in_progress: { label: '服务中', color: 'purple', icon: <CalendarOutlined /> },
  completed: { label: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  cancelled: { label: '已取消', color: 'default', icon: <ExclamationCircleOutlined /> },
  refunded: { label: '已退款', color: 'default', icon: <DollarOutlined /> }
};

const STATUS_FLOW = ['pending', 'paid', 'confirmed', 'in_progress', 'completed'];

const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'info';

  const [loading, setLoading] = useState({
    order: false,
    merchant: false,
    service: false
  });
  const [order, setOrder] = useState(null);
  const [merchant, setMerchant] = useState(null);
  const [service, setService] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);

  useEffect(() => {
    if (id) {
      fetchOrderDetail();
    }
  }, [id]);

  useEffect(() => {
    if (order) {
      if (order.merchant_id) {
        fetchMerchantDetail(order.merchant_id);
      }
      if (order.service_id) {
        fetchServiceDetail(order.service_id);
      }
    }
  }, [order]);

  useEffect(() => {
    if (initialTab === 'review' && order?.status === 'completed' && !order.reviewed) {
      setReviewModalVisible(true);
    }
  }, [initialTab, order]);

  const fetchOrderDetail = async () => {
    setLoading(prev => ({ ...prev, order: true }));
    try {
      const response = await orderAPI.detail(id);
      setOrder(response.data);
    } catch (error) {
      message.error('获取订单详情失败');
    } finally {
      setLoading(prev => ({ ...prev, order: false }));
    }
  };

  const fetchMerchantDetail = async (merchantId) => {
    setLoading(prev => ({ ...prev, merchant: true }));
    try {
      const response = await merchantAPI.detail(merchantId);
      setMerchant(response.data);
    } catch (error) {
      console.error('获取商家详情失败', error);
    } finally {
      setLoading(prev => ({ ...prev, merchant: false }));
    }
  };

  const fetchServiceDetail = async (serviceId) => {
    setLoading(prev => ({ ...prev, service: true }));
    try {
      const response = await serviceAPI.detail(serviceId);
      setService(response.data);
    } catch (error) {
      console.error('获取服务详情失败', error);
    } finally {
      setLoading(prev => ({ ...prev, service: false }));
    }
  };

  const handleUpdateStatus = async (newStatus, label) => {
    try {
      await orderAPI.updateStatus(id, newStatus);
      message.success(`${label}成功`);
      fetchOrderDetail();
    } catch (error) {
      message.error(`${label}失败`);
    }
  };

  const handleSubmitReview = async (values) => {
    setReviewSubmitting(true);
    try {
      const data = {
        order_id: id,
        service_id: order.service_id,
        merchant_id: order.merchant_id,
        rating: values.rating,
        content: values.content,
        images: uploadedImages,
        videos: uploadedVideos
      };
      await reviewAPI.create(data);
      message.success('评价提交成功');
      setReviewModalVisible(false);
      setReviewSubmitted(true);
      reviewForm.resetFields();
      setUploadedImages([]);
      setUploadedVideos([]);
      fetchOrderDetail();
    } catch (error) {
      message.error('评价提交失败');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImages(prev => [...prev, e.target.result]);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleVideoUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedVideos(prev => [...prev, e.target.result]);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setUploadedVideos(prev => prev.filter((_, i) => i !== index));
  };

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    const index = STATUS_FLOW.indexOf(order.status);
    return index === -1 ? 0 : index;
  };

  const getStatusConfig = (status) => {
    return ORDER_STATUS[status] || { label: status, color: 'default', icon: null };
  };

  const renderStatusSteps = () => {
    if (!order) return null;

    const currentStep = getCurrentStepIndex();
    const isCancelled = order.status === 'cancelled' || order.status === 'refunded';

    return (
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Title level={4} style={{ marginBottom: 24 }}>订单进度</Title>
        {isCancelled ? (
          <Alert
            message={`订单已${order.status === 'cancelled' ? '取消' : '退款'}`}
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
          />
        ) : (
          <Steps current={currentStep} size="small">
            {STATUS_FLOW.map(status => {
              const config = getStatusConfig(status);
              return (
                <Step
                  key={status}
                  title={config.label}
                  icon={config.icon}
                />
              );
            })}
          </Steps>
        )}
        {order.status_logs && order.status_logs.length > 0 && (
          <>
            <Divider />
            <Title level={5} style={{ marginBottom: 16 }}>操作记录</Title>
            <Timeline size="small">
              {order.status_logs.map((log, index) => (
                <Timeline.Item
                  key={index}
                  color={index === order.status_logs.length - 1 ? '#ff4d6d' : undefined}
                >
                  <Space direction="vertical" size={2}>
                    <Text strong>{getStatusConfig(log.status).label}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {log.created_at}
                    </Text>
                    {log.remark && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        备注：{log.remark}
                      </Text>
                    )}
                  </Space>
                </Timeline.Item>
              ))}
            </Timeline>
          </>
        )}
      </Card>
    );
  };

  const renderOrderInfo = () => {
    if (!order) return null;

    const statusConfig = getStatusConfig(order.status);

    return (
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>订单信息</Title>
          </Col>
          <Col>
            <Tag color={statusConfig.color} icon={statusConfig.icon} style={{ fontSize: 14, padding: '4px 12px' }}>
              {statusConfig.label}
            </Tag>
          </Col>
        </Row>
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="订单号">
            <Text copyable>{order.order_no}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="下单时间">
            {order.created_at}
          </Descriptions.Item>
          <Descriptions.Item label="服务类型">
            {order.service_category_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="支付方式">
            {order.payment_method || '在线支付'}
          </Descriptions.Item>
          <Descriptions.Item label="服务日期">
            {order.service_date || '-'}
            {order.service_time && ` ${order.service_time}`}
          </Descriptions.Item>
          <Descriptions.Item label="服务地点">
            {order.address || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系人">
            {order.contact_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {order.contact_phone || '-'}
          </Descriptions.Item>
          {order.remark && (
            <Descriptions.Item label="订单备注" span={2}>
              {order.remark}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider />

        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size={4}>
              <Text type="secondary">订单金额</Text>
              <div style={{ color: '#ff4d6d', fontSize: 28, fontWeight: 'bold' }}>
                ¥{order.total_amount?.toLocaleString()}
              </div>
              {order.discount_amount > 0 && (
                <Text type="secondary">优惠：-¥{order.discount_amount?.toLocaleString()}</Text>
              )}
            </Space>
          </Col>
          <Col>
            <Space direction="vertical" size={4} style={{ textAlign: 'right' }}>
              <Text type="secondary">已付金额</Text>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                ¥{order.paid_amount?.toLocaleString() || 0}
              </div>
              {order.paid_amount < order.total_amount && (
                <Text type="danger">待付：¥{(order.total_amount - order.paid_amount)?.toLocaleString()}</Text>
              )}
            </Space>
          </Col>
        </Row>

        {order.status !== 'cancelled' && order.status !== 'refunded' && order.status !== 'completed' && (
          <>
            <Divider />
            <Row gutter={[12, 12]} justify="end">
              {isCouple() && order.status === 'pending' && (
                <>
                  <Button onClick={() => handleUpdateStatus('cancelled', '取消订单')} danger>
                    取消订单
                  </Button>
                  <Button type="primary" onClick={() => handleUpdateStatus('paid', '付款')}>
                    立即付款
                  </Button>
                </>
              )}
              {isCouple() && order.status === 'paid' && (
                <Button type="primary" onClick={() => handleUpdateStatus('confirmed', '确认订单')}>
                  确认订单
                </Button>
              )}
              {isCouple() && order.status === 'in_progress' && (
                <Button type="primary" onClick={() => handleUpdateStatus('completed', '确认完成')}>
                  确认服务完成
                </Button>
              )}
              {isMerchant() && order.status === 'paid' && (
                <Button type="primary" onClick={() => handleUpdateStatus('confirmed', '确认接单')}>
                  确认接单
                </Button>
              )}
              {isMerchant() && order.status === 'confirmed' && (
                <Button type="primary" onClick={() => handleUpdateStatus('in_progress', '开始服务')}>
                  开始服务
                </Button>
              )}
              {isMerchant() && order.status === 'in_progress' && (
                <Button type="primary" onClick={() => handleUpdateStatus('completed', '标记完成')}>
                  标记服务完成
                </Button>
              )}
            </Row>
          </>
        )}

        {order.status === 'completed' && !order.reviewed && isCouple() && (
          <>
            <Divider />
            <Alert
              message="服务已完成，快去评价吧！"
              type="info"
              showIcon
              action={
                <Button size="small" type="primary" onClick={() => setReviewModalVisible(true)}>
                  去评价
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          </>
        )}

        {order.reviewed && (
          <>
            <Divider />
            <Alert
              message="您已对此订单进行评价"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          </>
        )}
      </Card>
    );
  };

  const renderServiceInfo = () => {
    if (!order) return null;

    return (
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Title level={4} style={{ marginBottom: 16 }}>服务信息</Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <div
              onClick={() => order.service_id && navigate(`/services/${order.service_id}`)}
              style={{
                width: '100%',
                paddingTop: '75%',
                backgroundImage: `url(${order.service_image || service?.images?.[0] || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wedding%20${encodeURIComponent(order.service_category || 'service')}&image_size=square`})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            />
          </Col>
          <Col xs={24} sm={18}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Title
                level={4}
                style={{ margin: 0, cursor: order.service_id ? 'pointer' : 'default' }}
                onClick={() => order.service_id && navigate(`/services/${order.service_id}`)}
              >
                {order.service_name || service?.name}
                <EyeOutlined style={{ marginLeft: 8, fontSize: 14, color: '#999' }} />
              </Title>
              <Space wrap size={[8, 8]}>
                {order.service_category_name && (
                  <Tag color="blue">{order.service_category_name}</Tag>
                )}
                {service?.tags && service.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </Space>
              {service?.description && (
                <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                  {service.description}
                </Paragraph>
              )}
              <div style={{ color: '#ff4d6d', fontSize: 20, fontWeight: 'bold' }}>
                ¥{order.service_price?.toLocaleString() || service?.price?.toLocaleString()}
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderMerchantInfo = () => {
    if (!order && !merchant) return null;

    const merchantData = merchant || {
      company_name: order?.company_name,
      logo: order?.merchant_logo,
      rating: order?.merchant_rating,
      contact_phone: order?.merchant_phone,
      contact_name: order?.merchant_contact
    };

    return (
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Title level={4} style={{ marginBottom: 16 }}>商家信息</Title>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
            <Avatar
              size={80}
              src={merchantData.logo}
              onClick={() => order?.merchant_id && navigate(`/merchants/${order.merchant_id}`)}
              style={{ cursor: order?.merchant_id ? 'pointer' : 'default' }}
            >
              {merchantData.company_name?.[0]}
            </Avatar>
          </Col>
          <Col xs={24} sm={20}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Title
                level={4}
                style={{ margin: 0, cursor: order?.merchant_id ? 'pointer' : 'default' }}
                onClick={() => order?.merchant_id && navigate(`/merchants/${order.merchant_id}`)}
              >
                {merchantData.company_name}
                <EyeOutlined style={{ marginLeft: 8, fontSize: 14, color: '#999' }} />
              </Title>
              <Space size={12}>
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  <Text strong>{merchantData.rating || '5.0'}</Text>
                </Space>
                {merchant?.review_count > 0 && (
                  <Text type="secondary">{merchant.review_count}条评价</Text>
                )}
              </Space>
              <Space size={24}>
                {merchantData.contact_phone && (
                  <Space>
                    <PhoneOutlined style={{ color: '#1890ff' }} />
                    <Text>{merchantData.contact_phone}</Text>
                  </Space>
                )}
                {merchantData.contact_name && (
                  <Space>
                    <UserOutlined style={{ color: '#722ed1' }} />
                    <Text>{merchantData.contact_name}</Text>
                  </Space>
                )}
              </Space>
              {merchant?.city && (
                <Space>
                  <EnvironmentOutlined style={{ color: '#52c41a' }} />
                  <Text type="secondary">{merchant.city}</Text>
                </Space>
              )}
              {merchant?.description && (
                <Paragraph type="secondary" style={{ margin: 0, fontSize: 13 }}>
                  {merchant.description}
                </Paragraph>
              )}
            </Space>
          </Col>
        </Row>
        <Divider />
        <Space size={12}>
          <Button icon={<MessageOutlined />} type="primary">
            联系商家
          </Button>
          {order?.merchant_id && (
            <Button icon={<ShopOutlined />} onClick={() => navigate(`/merchants/${order.merchant_id}`)}>
              进入店铺
            </Button>
          )}
        </Space>
      </Card>
    );
  };

  const tabItems = [
    {
      key: 'info',
      label: '订单详情'
    },
    {
      key: 'reviews',
      label: '用户评价'
    }
  ];

  if (loading.order && !order) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Card loading={true} style={{ maxWidth: 800, margin: '0 auto' }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Empty description="订单不存在" />
        <Button onClick={() => navigate('/orders')} style={{ marginTop: 16 }}>
          返回订单列表
        </Button>
      </div>
    );
  }

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button type="link" onClick={() => navigate(-1)} style={{ padding: 0 }}>
            <ArrowLeftOutlined /> 返回
          </Button>
          <Space>
            <Button icon={<MessageOutlined />}>联系客服</Button>
            {order.status === 'completed' && !order.reviewed && isCouple() && (
              <Button type="primary" icon={<StarOutlined />} onClick={() => setReviewModalVisible(true)}>
                评价订单
              </Button>
            )}
          </Space>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        {renderStatusSteps()}

        <Card style={{ borderRadius: 12, marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
            size="large"
          />
          <div style={{ padding: '0 24px 24px' }}>
            {activeTab === 'info' && (
              <>
                {renderOrderInfo()}
                {renderServiceInfo()}
                {renderMerchantInfo()}
              </>
            )}
            {activeTab === 'reviews' && (
              <div>
                {order.status === 'completed' && !order.reviewed && isCouple() && (
                  <Alert
                    message="您还没有对此订单进行评价"
                    type="info"
                    showIcon
                    action={
                      <Button size="small" type="primary" onClick={() => setReviewModalVisible(true)}>
                        去评价
                      </Button>
                    }
                    style={{ marginBottom: 24 }}
                  />
                )}
                <ReviewList
                  orderId={id}
                  serviceId={order.service_id}
                  merchantId={order.merchant_id}
                  showStats={true}
                  showFilter={true}
                  onReviewSubmitted={reviewSubmitted}
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        title="评价订单"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleSubmitReview}
          initialValues={{ rating: 5 }}
        >
          <Form.Item
            name="rating"
            label="服务评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate style={{ fontSize: 24 }} />
          </Form.Item>
          <Form.Item
            name="content"
            label="评价内容"
            rules={[{ required: true, message: '请输入评价内容' }, { min: 10, message: '评价内容至少10个字' }]}
          >
            <TextArea
              rows={4}
              placeholder="分享您的服务体验，帮助其他新人做出更好的选择..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item label="上传图片（可选）">
            <Space wrap>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={handleImageUpload}
                accept="image/*"
                multiple
              >
                <div>
                  <PictureOutlined style={{ fontSize: 24 }} />
                  <div style={{ marginTop: 4, fontSize: 12 }}>上传图片</div>
                </div>
              </Upload>
              {uploadedImages.map((img, index) => (
                <div key={index} style={{ position: 'relative', width: 100, height: 100 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => removeImage(index)}
                    style={{ position: 'absolute', top: -8, right: -8, padding: 0 }}
                  />
                </div>
              ))}
            </Space>
          </Form.Item>
          <Form.Item label="上传视频（可选）">
            <Space wrap>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={handleVideoUpload}
                accept="video/*"
                multiple
              >
                <div>
                  <VideoCameraOutlined style={{ fontSize: 24 }} />
                  <div style={{ marginTop: 4, fontSize: 12 }}>上传视频</div>
                </div>
              </Upload>
              {uploadedVideos.map((video, index) => (
                <div key={index} style={{ position: 'relative', width: 100, height: 100, background: '#000', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VideoCameraOutlined style={{ fontSize: 24, color: '#fff' }} />
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => removeVideo(index)}
                    style={{ position: 'absolute', top: -8, right: -8, padding: 0 }}
                  />
                </div>
              ))}
            </Space>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space size={12} style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={reviewSubmitting} icon={<SendOutlined />}>
                提交评价
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrderDetail;
