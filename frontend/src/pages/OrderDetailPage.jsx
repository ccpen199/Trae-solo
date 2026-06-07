import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Timeline,
  Form,
  Input,
  Rate,
  message,
  Modal,
  Upload,
  Typography,
  Divider,
  Progress,
  Alert,
  List,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  VideoCameraOutlined,
  CameraOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  StarOutlined,
  SafetyOutlined,
  BarcodeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getOrder, updateOrderStatus, uploadEvidence, addRating, getRecommendedEngineers, assignEngineer } from '../services/orderService';
import useStore from '../store/useStore';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

const OrderDetailPage = () => {
  const { setCurrentView, orderStatusMap } = useStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ratingForm] = Form.useForm();
  const [engineers, setEngineers] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const orderId = useStore.getState().selectedOrderId;

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  const loadOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await getOrder(orderId);
      setOrder(res.data);
    } catch (error) {
      message.error('加载订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadEngineers = async () => {
    try {
      const res = await getRecommendedEngineers({
        lat: order?.user_lat,
        lng: order?.user_lng,
        skills: order?.predicted_faults?.map(f => f.code)?.join(',') || ''
      });
      setEngineers(res.data || []);
    } catch (error) {
      console.error('Failed to load engineers:', error);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const data = { status: newStatus };
      if (newStatus === 2) {
        data.arrival_time = new Date().toISOString();
        setIsRecording(true);
      }
      if (newStatus === 4) {
        data.complete_time = new Date().toISOString();
        setIsRecording(false);
      }
      await updateOrderStatus(orderId, data);
      message.success('状态更新成功');
      loadOrderDetail();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleAssignEngineer = async (engineerId) => {
    try {
      await assignEngineer(orderId, engineerId);
      message.success('工程师指派成功');
      setShowAssignModal(false);
      loadOrderDetail();
    } catch (error) {
      message.error('指派失败');
    }
  };

  const handleSubmitRating = async (values) => {
    try {
      await addRating(orderId, values);
      message.success('评价提交成功');
      loadOrderDetail();
    } catch (error) {
      message.error('提交失败');
    }
  };

  const getTimelineItems = () => {
    const items = [];
    if (!order) return items;

    items.push({
      color: 'green',
      children: (
        <Space direction="vertical" size={0}>
          <Text strong>订单创建</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(order.created_at).format('YYYY-MM-DD HH:mm')}</Text>
        </Space>
      )
    });

    if (order.status >= 1 && order.Engineer) {
      items.push({
        color: 'blue',
        children: (
          <Space direction="vertical" size={0}>
            <Text strong>工程师已接单</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{order.Engineer.name} 已接受订单</Text>
          </Space>
        )
      });
    }

    if (order.arrival_time) {
      items.push({
        color: 'processing',
        children: (
          <Space direction="vertical" size={0}>
            <Text strong>工程师已到达</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(order.arrival_time).format('YYYY-MM-DD HH:mm')}</Text>
            {isRecording && (
              <div className="video-recording-indicator">
                <span className="recording-dot"></span>
                正在录像中
              </div>
            )}
          </Space>
        )
      });
    }

    if (order.complete_time) {
      items.push({
        color: 'purple',
        children: (
          <Space direction="vertical" size={0}>
            <Text strong>维修完成</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(order.complete_time).format('YYYY-MM-DD HH:mm')}</Text>
          </Space>
        )
      });
    }

    if (order.status >= 5) {
      items.push({
        color: 'green',
        children: (
          <Space direction="vertical" size={0}>
            <Text strong>订单已完成</Text>
            <Space>
              {[...Array(5)].map((_, i) => (
                <StarOutlined
                  key={i}
                  style={{ color: i < (order.rating || 0) ? '#faad14' : '#d9d9d9' }}
                />
              ))}
            </Space>
            <Text type="secondary" style={{ fontSize: 12 }}>{order.comment}</Text>
          </Space>
        )
      });
    }

    return items;
  };

  if (!order) {
    return (
      <Card>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentView('orders')}>
            返回列表
          </Button>
          <Text type="secondary">订单不存在或已被删除</Text>
        </Space>
      </Card>
    );
  }

  const status = orderStatusMap[order.status] || { text: '未知', color: 'default' };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentView('orders')}>
          返回列表
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          订单详情
          <Tag color={status.color} style={{ marginLeft: 12 }}>{status.text}</Tag>
        </Title>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="订单信息" loading={loading}>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{order.device_model}</Descriptions.Item>
              <Descriptions.Item label="设备类型">{order.device_type}</Descriptions.Item>
              <Descriptions.Item label="总费用">
                <Text strong style={{ color: '#faad14', fontSize: 18 }}>¥{order.total_cost || 0}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="故障描述" span={2}>
                {order.fault_description}
              </Descriptions.Item>
              {order.part_trace_code && (
                <Descriptions.Item label="配件溯源码" span={2}>
                  <Space>
                    <BarcodeOutlined />
                    <Text code>{order.part_trace_code}</Text>
                    <Tag color="green">原厂正品</Tag>
                  </Space>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="智能诊断结果" style={{ marginTop: 16 }}>
            {order.predicted_faults?.length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message={`预判准确率: ${(order.prediction_accuracy || 0).toFixed(1)}%`}
                  type="info"
                  showIcon
                />
                {order.predicted_faults.map((fault, idx) => (
                  <Card 
                    key={fault.code} 
                    size="small"
                    type="inner"
                    title={
                      <Space>
                        <Tag color={idx === 0 ? 'red' : idx === 1 ? 'orange' : 'blue'}>
                          TOP{idx + 1}
                        </Tag>
                        <Text strong>{fault.name}</Text>
                        <Tag color="purple">{fault.code}</Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          难度: {'★'.repeat(fault.difficulty || 2)}{'☆'.repeat(5 - (fault.difficulty || 2))}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Space>
                        <Text strong style={{ color: '#faad14' }}>预估: ¥{fault.estimatedCost}</Text>
                        <Text type="secondary">耗时: {fault.estimatedHours}h</Text>
                      </Space>
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Progress
                        percent={Math.round(fault.confidence * 100)}
                        size="small"
                        strokeColor={{
                          '0%': idx === 0 ? '#f5222d' : idx === 1 ? '#fa8c16' : '#1890ff',
                          '100%': idx === 0 ? '#ff4d4f' : idx === 1 ? '#ffa940' : '#40a9ff'
                        }}
                      />
                      <Row gutter={16}>
                        <Col span={12}>
                          <Card size="small" title={<Text type="secondary" style={{ fontSize: 12 }}>症状代码库</Text>}>
                            {fault.description}
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" title={<Text type="secondary" style={{ fontSize: 12 }}>诊断树步骤</Text>}>
                            <List size="small">
                              <List.Item>1. 外观检查：屏幕碎裂程度</List.Item>
                              <List.Item>2. 功能测试：触摸/显示</List.Item>
                              <List.Item>3. 拆机检测：排线/主板</List.Item>
                            </List>
                          </Card>
                        </Col>
                      </Row>
                      <Card size="small" title={<Text type="secondary" style={{ fontSize: 12 }}>维修方案知识图谱</Text>}>
                        <Text type="secondary" style={{ whiteSpace: 'pre-line' }}>
                          {fault.solution || '1. 准备工具和配件\n2. 拆机检测\n3. 执行维修\n4. 功能测试\n5. 装机复原'}
                        </Text>
                      </Card>
                    </Space>
                  </Card>
                ))}
              </Space>
            ) : (
              <Text type="secondary">无诊断数据</Text>
            )}
          </Card>

          <Card 
            title="维修凭证" 
            style={{ marginTop: 16 }}
            extra={
              <Space>
                {order.before_image_hash ? <Tag color="green">维修前照片 ✓</Tag> : <Tag color="red">维修前照片 ✗</Tag>}
                {order.video_url ? <Tag color="green">全程录像 ✓</Tag> : <Tag color="red">全程录像 ✗</Tag>}
                {order.after_image_hash ? <Tag color="green">维修后照片 ✓</Tag> : <Tag color="red">维修后照片 ✗</Tag>}
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {order.status >= 2 && !order.video_url && (
                <Alert
                  message="⚠️ 维修强制录像未完成"
                  description="根据平台规定，维修过程必须全程录像，请确认录像已上传并生成时间戳摘要"
                  type="warning"
                  showIcon
                />
              )}

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Card size="small" title="维修前照片" extra={<Tag color={order.before_image_hash ? 'green' : 'default'}>{order.before_image_hash ? '已完成' : '待上传'}</Tag>}>
                    {order.before_image_hash ? (
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div style={{ textAlign: 'center' }}>
                          <CameraOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                        </div>
                        <Divider style={{ margin: '4px 0' }} />
                        <div>
                          <Text type="secondary" style={{ fontSize: 11 }}>图片哈希值(SHA256):</Text>
                          <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                            {order.before_image_hash}
                          </Text>
                        </div>
                      </Space>
                    ) : (
                      <Upload.Dragger beforeUpload={() => false} style={{ padding: 20 }}>
                        <CameraOutlined style={{ fontSize: 24 }} />
                        <p>上传维修前照片</p>
                        <p className="ant-upload-hint">用于维修前后对比</p>
                      </Upload.Dragger>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" title="维修全程录像" extra={<Tag color={order.video_url ? 'green' : 'default'}>{order.video_url ? '已完成' : '待录制'}</Tag>}>
                    {order.video_url ? (
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div style={{ textAlign: 'center' }}>
                          <VideoCameraOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                        </div>
                        <Divider style={{ margin: '4px 0' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>时间戳摘要片段:</Text>
                        <List
                          size="small"
                          dataSource={[
                            { time: '00:00', event: '开始录像，设备外观检查' },
                            { time: '05:32', event: '拆机，检查内部元件' },
                            { time: '12:15', event: '执行维修操作' },
                            { time: '18:45', event: '功能测试验证' },
                            { time: '22:10', event: '装机完成，清洁设备' }
                          ]}
                          renderItem={(item, idx) => (
                            <List.Item>
                              <Tag color="blue" style={{ minWidth: 60 }}>{item.time}</Tag>
                              <Text style={{ fontSize: 12 }}>{item.event}</Text>
                            </List.Item>
                          )}
                        />
                      </Space>
                    ) : (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        {isRecording ? (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div className="video-recording-indicator" style={{ marginBottom: 8 }}>
                              <span className="recording-dot"></span>
                              正在录制中...
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>录像时长: 00:05:32</Text>
                          </Space>
                        ) : (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <VideoCameraOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                            <Text type="secondary">维修过程录像</Text>
                          </Space>
                        )}
                      </div>
                    )}
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card size="small" title="维修后照片" extra={<Tag color={order.after_image_hash ? 'green' : 'default'}>{order.after_image_hash ? '已完成' : '待上传'}</Tag>}>
                    {order.after_image_hash ? (
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        <div style={{ textAlign: 'center' }}>
                          <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                        </div>
                        <Divider style={{ margin: '4px 0' }} />
                        <div>
                          <Text type="secondary" style={{ fontSize: 11 }}>图片哈希值(SHA256):</Text>
                          <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                            {order.after_image_hash}
                          </Text>
                        </div>
                      </Space>
                    ) : (
                      <Upload.Dragger beforeUpload={() => false} style={{ padding: 20 }}>
                        <CameraOutlined style={{ fontSize: 24 }} />
                        <p>上传维修后照片</p>
                        <p className="ant-upload-hint">用于维修前后对比</p>
                      </Upload.Dragger>
                    )}
                  </Card>
                </Col>
              </Row>

              {order.part_trace_code && (
                <Card size="small" title="原厂配件溯源码">
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Space>
                        <BarcodeOutlined style={{ fontSize: 24, color: '#1677ff' }} />
                        <div>
                          <Text strong>溯源码</Text>
                          <Text code style={{ display: 'block', fontSize: 12 }}>
                            {order.part_trace_code}
                          </Text>
                        </div>
                      </Space>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Space>
                        <SafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                        <div>
                          <Text strong style={{ color: '#52c41a' }}>原厂正品认证</Text>
                          <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                            配件已通过厂商验证，享受质保服务
                          </Text>
                        </div>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              )}
            </Space>
          </Card>

          {order.status === 4 && (
            <Card title="服务评价" style={{ marginTop: 16 }}>
              <Form
                form={ratingForm}
                layout="vertical"
                onFinish={handleSubmitRating}
              >
                <Form.Item label="维修评分" name="rating" rules={[{ required: true }]}>
                  <Rate />
                </Form.Item>
                <Form.Item label="评价内容" name="comment">
                  <TextArea rows={3} placeholder="请描述您的维修体验..." />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    提交评价
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title="用户信息">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="姓名">
                <Space><UserOutlined />{order.user_name}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="电话">
                <Space><PhoneOutlined />{order.user_phone}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="地址">
                <Space><EnvironmentOutlined />{order.user_address}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="预约时间">
                <Space>
                  <ClockCircleOutlined />
                  {order.appointment_time ? dayjs(order.appointment_time).format('YYYY-MM-DD HH:mm') : '未预约'}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card 
            title="维修工程师" 
            style={{ marginTop: 16 }}
            extra={
              order.status === 0 && (
                <Button type="link" onClick={() => { loadEngineers(); setShowAssignModal(true); }}>
                  指派工程师
                </Button>
              )
            }
          >
            {order.Engineer ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Avatar size="large" icon={<UserOutlined />} />
                  <div>
                    <Text strong>{order.Engineer.name}</Text>
                    <Tag color="blue">L{order.Engineer.certificate_level}</Tag>
                  </div>
                </Space>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="联系电话">{order.Engineer.phone}</Descriptions.Item>
                </Descriptions>
              </Space>
            ) : (
              <Text type="secondary">暂未指派工程师</Text>
            )}
          </Card>

          <Card title="订单进度" style={{ marginTop: 16 }}>
            <Timeline
              className="order-timeline"
              items={getTimelineItems()}
            />
          </Card>

          <Card title="操作" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {order.status === 0 && (
                <Button type="primary" block onClick={() => handleStatusChange(1)}>
                  确认接单
                </Button>
              )}
              {order.status === 1 && (
                <Button type="primary" block onClick={() => handleStatusChange(2)}>
                  开始维修（到达现场）
                </Button>
              )}
              {order.status === 2 && (
                <Button type="primary" block onClick={() => handleStatusChange(3)}>
                  维修完成，等待确认
                </Button>
              )}
              {order.status === 3 && (
                <Button type="primary" block onClick={() => handleStatusChange(4)}>
                  确认完成
                </Button>
              )}
              <Space style={{ width: '100%' }}>
                <Button block onClick={() => setCurrentView('orders')}>
                  返回列表
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="指派工程师"
        open={showAssignModal}
        onCancel={() => setShowAssignModal(false)}
        footer={null}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {engineers.map(eng => (
            <Card key={eng.id} size="small" className="engineer-card">
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Avatar icon={<UserOutlined />} />
                  <div>
                    <Text strong>{eng.name}</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>L{eng.certificateLevel}</Tag>
                    <div style={{ fontSize: 12 }}>
                      <Text type="secondary">距离 {eng.distance}km · 预计 {eng.eta} 分钟到达</Text>
                    </div>
                  </div>
                </Space>
                <Space direction="vertical" align="end" size={0}>
                  <Text strong style={{ color: '#1677ff' }}>{eng.matchScore}分</Text>
                  <Button type="primary" size="small" onClick={() => handleAssignEngineer(eng.id)}>
                    指派
                  </Button>
                </Space>
              </Space>
            </Card>
          ))}
        </Space>
      </Modal>
    </Space>
  );
};

export default OrderDetailPage;
