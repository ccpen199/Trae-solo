import { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Spin,
  Button,
  Space,
  Tag,
  Tabs,
  Timeline,
  Row,
  Col,
  Rate,
  Modal,
  message,
  Steps,
  Input,
  Select,
  Form,
  Alert,
  Avatar,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  StarOutlined,
  ClockCircleOutlined,
  SendOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  CommentOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../../api';
import {
  Order,
  OrderStatus,
  OrderMode,
  WorkerRole,
  OrderStatusMap,
  OrderStatusColor,
  OrderModeMap,
  WorkerRoleMap,
  ServiceNode,
  GrabRecord,
  FrequencyMap,
} from '../../types';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

interface OrderReview {
  id: string;
  order_id: string;
  rating: number;
  content?: string;
  tags?: string[];
  created_at: string;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [nodes, setNodes] = useState<ServiceNode[]>([]);
  const [grabRecords, setGrabRecords] = useState<GrabRecord[]>([]);
  const [review, setReview] = useState<OrderReview | null>(null);

  const [completeNodeLoading, setCompleteNodeLoading] = useState<string | null>(null);
  const [grabAcceptLoading, setGrabAcceptLoading] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await orderApi.detail(id!);
      setOrder(result.order);
      setNodes(result.nodes || []);
      setGrabRecords(result.grab_records || []);
      setReview(result.review || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = () => {
    Modal.confirm({
      title: '打卡确认',
      content: (
        <div>
          <p>模拟GPS定位和人脸识别打卡</p>
          <p style={{ color: '#666', fontSize: 12 }}>
            经度: 121.4737 &nbsp; 纬度: 31.2304
          </p>
          <p style={{ color: '#52c41a', fontSize: 12 }}>人脸识别: 通过 ✓</p>
        </div>
      ),
      okText: '确认打卡',
      cancelText: '取消',
      onOk: async () => {
        try {
          const gps = { lng: 121.4737, lat: 31.2304 };
          await orderApi.checkin(id!, gps, true);
          message.success('打卡成功');
          fetchDetail();
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const handleCompleteOrder = () => {
    Modal.confirm({
      title: '完成订单',
      content: '确认该订单服务已全部完成？',
      okText: '确认完成',
      cancelText: '取消',
      onOk: async () => {
        try {
          await orderApi.complete(id!);
          message.success('订单已完成');
          fetchDetail();
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const handleDispute = () => {
    Modal.confirm({
      title: '纠纷仲裁',
      content: '确认发起纠纷仲裁？相关专员将在24小时内介入处理。',
      okText: '确认发起',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        message.info('纠纷仲裁已提交，请等待处理');
      },
    });
  };

  const handleCompleteNode = async (node: ServiceNode) => {
    Modal.confirm({
      title: `标记节点完成：${node.node_name}`,
      content: (
        <div>
          <p style={{ color: '#666' }}>{node.node_description}</p>
          <p style={{ color: '#fa8c16', fontSize: 12 }}>确认该服务节点已完成？</p>
        </div>
      ),
      okText: '确认完成',
      cancelText: '取消',
      onOk: async () => {
        setCompleteNodeLoading(node.id);
        try {
          await orderApi.completeNode(id!, node.id);
          message.success('节点已完成');
          fetchDetail();
        } catch (error) {
          console.error(error);
        } finally {
          setCompleteNodeLoading(null);
        }
      },
    });
  };

  const handleGrabAccept = async (record: GrabRecord) => {
    Modal.confirm({
      title: '确认接单',
      content: `确定将订单派给 ${record.worker_name} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setGrabAcceptLoading(record.id);
        try {
          await orderApi.accept(id!, record.worker_id);
          message.success('接单成功');
          fetchDetail();
        } catch (error) {
          console.error(error);
        } finally {
          setGrabAcceptLoading(null);
        }
      },
    });
  };

  const handleSubmitReview = async () => {
    try {
      const values = await reviewForm.validateFields();
      setReviewLoading(true);
      await orderApi.review(id!, values.rating, values.content, values.tags);
      message.success('评价提交成功');
      setReviewOpen(false);
      reviewForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setReviewLoading(false);
    }
  };

  const renderTopActions = () => {
    if (!order) return null;
    const actions = [];

    if (order.status === 'accepted') {
      actions.push(
        <Button
          key="checkin"
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleCheckin}
        >
          打卡
        </Button>
      );
    }

    if (order.status === 'in_progress') {
      actions.push(
        <Button
          key="complete"
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={handleCompleteOrder}
        >
          完成订单
        </Button>
      );
    }

    if (order.status !== 'cancelled' && order.status !== 'disputed') {
      actions.push(
        <Button
          key="dispute"
          danger
          icon={<WarningOutlined />}
          onClick={handleDispute}
        >
          纠纷仲裁
        </Button>
      );
    }

    return actions;
  };

  const renderOrderInfoTab = () => {
    if (!order) return null;
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="雇主信息" className="card-hover">
          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="雇主姓名">
              <Space>
                <Avatar icon={<UserOutlined />} size={24} style={{ background: '#1677ff' }} />
                <span style={{ fontWeight: 500 }}>{order.employer_name || '-'}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              <Space>
                <PhoneOutlined style={{ color: '#52c41a' }} />
                <span>{order.employer_phone || '-'}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="所在城市">
              <Tag color="blue">{order.city || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所在区域">
              <Tag color="geekblue">{order.district || '-'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="详细地址" span={2}>
              <Space>
                <EnvironmentOutlined style={{ color: '#999' }} />
                <span>{order.address || '-'}</span>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="地图位置" span={2}>
              <div
                style={{
                  height: 180,
                  background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #91caff',
                }}
              >
                <EnvironmentOutlined style={{ fontSize: 40, color: '#1677ff' }} />
                <div style={{ marginTop: 12, fontWeight: 500, color: '#1677ff' }}>
                  {order.city} {order.district}
                </div>
                <div style={{ marginTop: 4, fontFamily: 'monospace', color: '#666', fontSize: 12 }}>
                  经度: 121.4737 &nbsp;|&nbsp; 纬度: 31.2304
                </div>
              </div>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="阿姨信息" className="card-hover">
          {order.worker_name ? (
            <Descriptions column={2} bordered size="middle">
              <Descriptions.Item label="阿姨姓名">
                <Space>
                  <Avatar icon={<UserOutlined />} size={24} style={{ background: '#52c41a' }} />
                  <span style={{ fontWeight: 500 }}>{order.worker_name}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="服务类型">
                <Tag color="blue">{WorkerRoleMap[order.service_type] || order.service_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务模式">
                <Tag color={order.mode === 'grab' ? 'orange' : 'purple'}>
                  {order.mode === 'grab' ? <ThunderboltOutlined /> : <SendOutlined />}
                  &nbsp;{OrderModeMap[order.mode]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="服务频次">
                {FrequencyMap[order.frequency] || order.frequency}
              </Descriptions.Item>
              <Descriptions.Item label="预算金额" span={2}>
                <span style={{ fontWeight: 500, color: '#fa8c16', fontSize: 16 }}>
                  ¥{order.budget_min} - ¥{order.budget_max}
                </span>
              </Descriptions.Item>
              {order.actual_amount && (
                <Descriptions.Item label="实际结算金额" span={2}>
                  <span style={{ fontWeight: 600, color: '#52c41a', fontSize: 18 }}>
                    ¥{order.actual_amount}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="暂无阿姨信息"
              description="该订单尚未分配阿姨，请前往抢单记录进行派单操作"
            />
          )}
        </Card>

        <Card title="服务说明" className="card-hover">
          <div style={{ padding: '4px 0', lineHeight: 1.8, color: '#333' }}>
            {order.description || '暂无服务说明'}
          </div>
          {order.special_requirements_data && order.special_requirements_data.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8, color: '#666', fontSize: 13 }}>特殊要求：</div>
              <Space size={[8, 8]} wrap>
                {order.special_requirements_data.map((req, idx) => (
                  <Tag key={idx} color="magenta">
                    {req}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </Card>
      </Space>
    );
  };

  const renderNodesTab = () => {
    if (!order) return null;
    const stepItems = nodes.map((node) => ({
      title: node.node_name,
      description: node.node_description,
      status: node.status === 'completed' ? ('finish' as const) : ('process' as const),
    }));

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card title="服务进度总览" className="card-hover">
          <Steps
            direction="vertical"
            current={nodes.filter((n) => n.status === 'completed').length}
            items={stepItems}
          />
        </Card>

        <Card title="节点详情" className="card-hover">
          <Timeline
            items={nodes.map((node) => ({
              color: node.status === 'completed' ? 'green' : 'gray',
              dot:
                node.status === 'completed' ? (
                  <CheckCircleOutlined style={{ fontSize: 16 }} />
                ) : (
                  <ClockCircleOutlined style={{ fontSize: 16 }} />
                ),
              children: (
                <Card
                  size="small"
                  style={{
                    marginTop: 4,
                    marginBottom: 8,
                    borderColor: node.status === 'completed' ? '#b7eb8f' : '#e8e8e8',
                    background: node.status === 'completed' ? '#f6ffed' : 'white',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>
                        {node.node_name}
                        <Tag
                          color={node.status === 'completed' ? 'green' : 'default'}
                          style={{ marginLeft: 8 }}
                        >
                          {node.status === 'completed' ? '已完成' : '待完成'}
                        </Tag>
                      </div>
                      <div style={{ color: '#666', marginTop: 4, fontSize: 13 }}>
                        {node.node_description}
                      </div>
                      {node.completed_at && (
                        <div style={{ color: '#999', marginTop: 6, fontSize: 12 }}>
                          <ClockCircleOutlined /> {node.completed_at}
                        </div>
                      )}
                      {node.note && (
                        <div style={{ color: '#666', marginTop: 6, fontSize: 12 }}>
                          备注：{node.note}
                        </div>
                      )}
                    </div>
                    {order.status === 'in_progress' && node.status !== 'completed' && (
                      <Button
                        type="primary"
                        size="small"
                        loading={completeNodeLoading === node.id}
                        onClick={() => handleCompleteNode(node)}
                      >
                        标记完成
                      </Button>
                    )}
                  </div>
                </Card>
              ),
            }))}
          />
        </Card>
      </Space>
    );
  };

  const renderGrabTab = () => {
    return (
      <Card
        title={`抢单记录 (${grabRecords.length})`}
        className="card-hover"
        extra={
          order?.status === 'pending' && order?.mode === 'grab' ? (
            <Tag color="orange">等待派单</Tag>
          ) : null
        }
      >
        {grabRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            暂无抢单记录
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {grabRecords.map((record) => (
              <Card
                key={record.id}
                size="small"
                className="card-hover"
                style={{
                  borderColor:
                    record.status === 'accepted' ? '#52c41a' : '#e8e8e8',
                  background:
                    record.status === 'accepted' ? '#f6ffed' : 'white',
                }}
                actions={
                  record.status === 'pending' && order?.status === 'pending'
                    ? [
                        <Button
                          key="accept"
                          type="primary"
                          size="small"
                          loading={grabAcceptLoading === record.id}
                          onClick={() => handleGrabAccept(record)}
                        >
                          确认接单
                        </Button>,
                      ]
                    : []
                }
              >
                <Row gutter={16} align="middle">
                  <Col xs={24} sm={8}>
                    <Space>
                      <Avatar icon={<UserOutlined />} style={{ background: '#52c41a' }} />
                      <span style={{ fontWeight: 500, fontSize: 15 }}>
                        {record.worker_name}
                      </span>
                    </Space>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Space>
                      <Rate disabled allowHalf value={record.worker_rating} style={{ fontSize: 12 }} />
                      <span style={{ color: '#666', fontSize: 12 }}>
                        {record.worker_rating.toFixed(1)}
                      </span>
                    </Space>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
                      <Tag color={record.status === 'accepted' ? 'green' : 'orange'}>
                        {record.status === 'accepted' ? '已接单' : '抢单中'}
                      </Tag>
                    </Space>
                  </Col>
                  <Col xs={24}>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                      <ClockCircleOutlined /> 抢单时间：{record.grab_time}
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        )}
      </Card>
    );
  };

  const renderReviewTab = () => {
    if (!order) return null;
    const reviewTags = ['服务态度好', '工作认真', '准时到达', '技能专业', '沟通顺畅', '干净利落'];

    if (review) {
      return (
        <Card title="订单评价" className="card-hover">
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <Rate disabled allowHalf value={review.rating} />
              <span style={{ marginLeft: 12, fontWeight: 600, fontSize: 18, color: '#fa8c16' }}>
                {review.rating}.0
              </span>
            </div>
            {review.tags && review.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <Space size={[8, 8]} wrap>
                  {review.tags.map((tag, idx) => (
                    <Tag key={idx} color="blue" icon={<LikeOutlined />}>
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
            {review.content && (
              <div
                style={{
                  padding: 16,
                  background: '#fafafa',
                  borderRadius: 8,
                  lineHeight: 1.8,
                  color: '#333',
                }}
              >
                <CommentOutlined style={{ color: '#999', marginRight: 8 }} />
                {review.content}
              </div>
            )}
            <div style={{ marginTop: 12, color: '#999', fontSize: 12 }}>
              评价时间：{review.created_at}
            </div>
          </div>
        </Card>
      );
    }

    if (order.status === 'completed') {
      return (
        <Card title="订单评价" className="card-hover">
          <div style={{ marginBottom: 16 }}>
            <Alert
              type="info"
              showIcon
              message="订单已完成，请对本次服务进行评价"
              description="您的评价将帮助我们持续提升服务质量"
            />
          </div>
          <Button
            type="primary"
            icon={<StarOutlined />}
            onClick={() => setReviewOpen(true)}
          >
            去评价
          </Button>

          <Modal
            title="提交评价"
            open={reviewOpen}
            onCancel={() => setReviewOpen(false)}
            onOk={handleSubmitReview}
            confirmLoading={reviewLoading}
            okText="提交评价"
            cancelText="取消"
            width={560}
          >
            <Form
              form={reviewForm}
              layout="vertical"
              initialValues={{ rating: 5, tags: [] }}
            >
              <Form.Item
                name="rating"
                label="服务评分"
                rules={[{ required: true, message: '请选择评分' }]}
              >
                <Rate allowHalf />
              </Form.Item>
              <Form.Item name="tags" label="评价标签">
                <Select
                  mode="multiple"
                  placeholder="选择标签（可多选）"
                  style={{ width: '100%' }}
                  maxTagCount={6}
                >
                  {reviewTags.map((tag) => (
                    <Option key={tag} value={tag}>
                      {tag}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="content" label="评价内容">
                <TextArea
                  rows={4}
                  placeholder="请描述您对本次服务的感受..."
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Form>
          </Modal>
        </Card>
      );
    }

    return (
      <Card title="订单评价" className="card-hover">
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <StarOutlined style={{ fontSize: 48, color: '#e8e8e8' }} />
          <div style={{ marginTop: 12 }}>订单完成后即可评价</div>
        </div>
      </Card>
    );
  };

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <ShoppingCartOutlined /> 订单信息
        </span>
      ),
      children: renderOrderInfoTab(),
    },
    {
      key: 'nodes',
      label: (
        <span>
          <SafetyCertificateOutlined /> 服务节点 ({nodes.length})
        </span>
      ),
      children: renderNodesTab(),
    },
    {
      key: 'grab',
      label: (
        <span>
          <ThunderboltOutlined /> 抢单记录 ({grabRecords.length})
        </span>
      ),
      children: renderGrabTab(),
    },
    {
      key: 'review',
      label: (
        <span>
          <StarOutlined /> 评价
        </span>
      ),
      children: renderReviewTab(),
    },
  ];

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Card
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 16 }}
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Space>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
                  返回列表
                </Button>
                <span style={{ fontSize: 18, fontWeight: 600 }}>
                  <ShoppingCartOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                  订单详情
                </span>
              </Space>
            </div>
          }
          extra={<Space>{renderTopActions()}</Space>}
        />

        <Card title="基础信息" style={{ marginBottom: 16 }} className="card-hover">
          <Descriptions column={2} bordered size="middle">
            <Descriptions.Item label="订单号">
              <span style={{ fontFamily: 'monospace' }}>{order?.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Tag color={order ? OrderStatusColor[order.status] : 'default'}>
                {order ? OrderStatusMap[order.status] : '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单标题">
              <span style={{ fontWeight: 500 }}>{order?.title || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="服务类型">
              <Tag color="blue">
                {order ? WorkerRoleMap[order.service_type as WorkerRole] : '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单模式">
              <Tag color={order?.mode === 'grab' ? 'orange' : 'purple'}>
                {order?.mode === 'grab' ? <ThunderboltOutlined /> : <SendOutlined />}
                &nbsp;{order ? OrderModeMap[order.mode as OrderMode] : '-'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="服务频次">
              {order ? FrequencyMap[order.frequency] || order.frequency : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="服务时长">
              {order?.duration_hours} 小时
            </Descriptions.Item>
            <Descriptions.Item label="服务周期">
              {order?.start_date} ~ {order?.end_date || '长期'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              <ClockCircleOutlined style={{ color: '#999' }} /> {(order as any)?.created_at || '-'}
            </Descriptions.Item>
            {order?.checkin_time && (
              <Descriptions.Item label="打卡时间">
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> {order.checkin_time}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        <Card className="card-hover" bodyStyle={{ padding: '8px 0 0 0' }}>
          <Tabs
            defaultActiveKey="info"
            items={tabItems}
            style={{ padding: '0 20px 20px 20px' }}
          />
        </Card>
      </Spin>
    </div>
  );
}
