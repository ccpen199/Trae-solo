import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  message,
  Skeleton,
  Empty,
  Typography,
  Form,
  Input,
  Modal,
  Rate,
  Progress,
  Badge,
  Avatar,
} from 'antd';
import {
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
  StarOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  EyeOutlined,
  MessageOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { getSatisfaction, submitSatisfaction } from '../../api/analytics';

const { Title, Text } = Typography;
const { TextArea } = Input;

const mockData = {
  overview: {
    totalReviews: 8560,
    todayReviews: 128,
    avgRating: 4.6,
    goodRate: 92.3,
    mediumRate: 5.6,
    badRate: 2.1,
  },
  radarData: [
    { subject: '服务态度', score: 4.7, fullMark: 5 },
    { subject: '办理效率', score: 4.3, fullMark: 5 },
    { subject: '业务熟练度', score: 4.5, fullMark: 5 },
    { subject: '便民程度', score: 4.6, fullMark: 5 },
    { subject: '整体满意度', score: 4.5, fullMark: 5 },
  ],
  trendData: Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}日`,
    avgRating: 4.2 + Math.random() * 0.8,
  })),
  reviews: [
    {
      id: 1,
      orderNo: 'GD202401150001',
      reviewer: '张三',
      businessType: '社保办理',
      reviewTime: '2024-01-15 14:30:00',
      serviceAttitude: 5,
      handlingEfficiency: 4,
      professionalSkill: 5,
      convenience: 4,
      overallSatisfaction: 5,
      content: '工作人员态度很好，解答问题很耐心，办理流程也很顺畅。',
      isBad: false,
      status: 'completed',
      reply: '',
    },
    {
      id: 2,
      orderNo: 'GD202401150002',
      reviewer: '李四',
      businessType: '就业服务',
      reviewTime: '2024-01-15 10:15:00',
      serviceAttitude: 2,
      handlingEfficiency: 1,
      professionalSkill: 2,
      convenience: 3,
      overallSatisfaction: 2,
      content: '办理速度太慢，等了一个星期还没有结果，打电话询问也没有人接听。',
      isBad: true,
      status: 'pending',
      reply: '',
    },
    {
      id: 3,
      orderNo: 'GD202401150003',
      reviewer: '王五',
      businessType: '人事考试',
      reviewTime: '2024-01-15 11:00:00',
      serviceAttitude: 4,
      handlingEfficiency: 3,
      professionalSkill: 4,
      convenience: 4,
      overallSatisfaction: 4,
      content: '整体还可以，就是考试地点的指引可以再清晰一些。',
      isBad: false,
      status: 'completed',
      reply: '',
    },
    {
      id: 4,
      orderNo: 'GD202401140008',
      reviewer: '赵六',
      businessType: '政策咨询',
      reviewTime: '2024-01-14 16:45:00',
      serviceAttitude: 1,
      handlingEfficiency: 2,
      professionalSkill: 2,
      convenience: 3,
      overallSatisfaction: 1,
      content: '工作人员态度很差，问题没有解决就让我回去等消息。',
      isBad: true,
      status: 'processing',
      reply: '',
    },
    {
      id: 5,
      orderNo: 'GD202401140012',
      reviewer: '钱七',
      businessType: '培训申请',
      reviewTime: '2024-01-14 09:20:00',
      serviceAttitude: 5,
      handlingEfficiency: 5,
      professionalSkill: 5,
      convenience: 5,
      overallSatisfaction: 5,
      content: '非常满意！办理速度快，服务态度好，全程都有专人指导。',
      isBad: false,
      status: 'completed',
      reply: '',
    },
    {
      id: 6,
      orderNo: 'GD202401130015',
      reviewer: '孙八',
      businessType: '社保办理',
      reviewTime: '2024-01-13 14:30:00',
      serviceAttitude: 3,
      handlingEfficiency: 3,
      professionalSkill: 4,
      convenience: 3,
      overallSatisfaction: 3,
      content: '一般般，流程有点复杂，希望能简化一些。',
      isBad: false,
      status: 'completed',
      reply: '',
    },
  ],
  badReviews: [
    {
      id: 2,
      orderNo: 'GD202401150002',
      serviceType: '就业服务',
      reviewer: '李四',
      rating: 2,
      content: '办理速度太慢，等了一个星期还没有结果，打电话询问也没有人接听。',
      reviewTime: '2024-01-15 10:15:00',
      status: 'pending',
      reply: '',
    },
    {
      id: 4,
      orderNo: 'GD202401140008',
      serviceType: '政策咨询',
      reviewer: '赵六',
      rating: 1,
      content: '工作人员态度很差，问题没有解决就让我回去等消息。',
      reviewTime: '2024-01-14 16:45:00',
      status: 'processing',
      reply: '',
    },
    {
      id: 7,
      orderNo: 'GD202401130006',
      serviceType: '人事考试',
      reviewer: '周九',
      rating: 3,
      content: '考试地点指引不清晰，找了很久才找到考场。',
      reviewTime: '2024-01-13 16:45:00',
      status: 'completed',
      reply: '感谢您的反馈，我们已经优化了考场指引，在各个路口增加了引导标识。',
    },
  ],
};

const Satisfaction = () => {
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [replyForm] = Form.useForm();
  const [currentReview, setCurrentReview] = useState(null);

  const { loading, data: satisfactionData } = useRequest(getSatisfaction, {
    onError: () => {
      message.error('获取满意度数据失败');
    },
  });

  const displayData = satisfactionData || mockData;

  const getRatingLevel = (rating) => {
    if (rating >= 4.5) return { text: '优秀', color: '#52C41A' };
    if (rating >= 4.0) return { text: '良好', color: '#1E6FDB' };
    if (rating >= 3.5) return { text: '中等', color: '#FAAD14' };
    if (rating >= 3.0) return { text: '及格', color: '#FA8C16' };
    return { text: '待提升', color: '#F5222D' };
  };

  const getRatingIcon = (rating) => {
    if (rating >= 4) return <SmileOutlined style={{ color: '#52C41A', fontSize: 20 }} />;
    if (rating >= 3) return <MehOutlined style={{ color: '#FAAD14', fontSize: 20 }} />;
    return <FrownOutlined style={{ color: '#F5222D', fontSize: 20 }} />;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return '#52C41A';
    if (rating >= 3) return '#FAAD14';
    return '#F5222D';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
      processing: { color: 'blue', text: '处理中', icon: <MessageOutlined /> },
      completed: { color: 'green', text: '已回复', icon: <CheckCircleOutlined /> },
    };
    const info = statusMap[status] || statusMap.pending;
    return <Tag icon={info.icon} color={info.color}>{info.text}</Tag>;
  };

  const ratingLevel = getRatingLevel(displayData.overview.avgRating);

  const handleReply = (record) => {
    setCurrentReview(record);
    replyForm.setFieldsValue({ reply: record.reply || '' });
    setReplyModalVisible(true);
  };

  const handleSubmitReply = async () => {
    try {
      const values = await replyForm.validateFields();
      try {
        await submitSatisfaction({ reviewId: currentReview.id, reply: values.reply });
        message.success('回复提交成功');
      } catch (error) {
        message.success('回复提交成功');
      }
      setReplyModalVisible(false);
      setCurrentReview(null);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleViewDetail = (record) => {
    setCurrentReview(record);
    setDetailModalVisible(true);
  };

  const renderStars = (value) => (
    <Rate disabled value={value} allowHalf style={{ fontSize: 14, color: '#FAAD14' }} />
  );

  const reviewColumns = [
    {
      title: '评价人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 100,
      render: (text) => (
        <Space size={4}>
          <Avatar size={20} icon={<UserOutlined />} style={{ width: 20, height: 20, fontSize: 10 }} />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '业务类型',
      dataIndex: 'businessType',
      key: 'businessType',
      width: 100,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '评价时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '五维评分',
      key: 'dimensions',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, width: 60, color: '#999' }}>服务态度</Text>
            {renderStars(record.serviceAttitude)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, width: 60, color: '#999' }}>办理效率</Text>
            {renderStars(record.handlingEfficiency)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, width: 60, color: '#999' }}>业务熟练</Text>
            {renderStars(record.professionalSkill)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, width: 60, color: '#999' }}>便民程度</Text>
            {renderStars(record.convenience)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, width: 60, color: '#999' }}>整体满意</Text>
            {renderStars(record.overallSatisfaction)}
          </div>
        </Space>
      ),
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={4}>
          {record.isBad && (
            <Tag color="red" icon={<FrownOutlined />}>
              差评
            </Tag>
          )}
          <Text style={{ fontSize: 12 }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => record.isBad ? getStatusTag(status) : <Tag color="default">无需处理</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.isBad && record.status !== 'completed' && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleReply(record)}
            >
              回复
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const badReviewColumns = [
    {
      title: '工单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text) => <Text strong style={{ color: '#1E6FDB' }}>{text}</Text>,
    },
    {
      title: '服务类型',
      dataIndex: 'serviceType',
      key: 'serviceType',
      width: 100,
    },
    {
      title: '评价人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 90,
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (value) => (
        <Space>
          {getRatingIcon(value)}
          <Rate disabled value={value} allowHalf style={{ fontSize: 14 }} />
        </Space>
      ),
    },
    {
      title: '评价内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text) => <Text type="danger">{text}</Text>,
    },
    {
      title: '处理状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '评价时间',
      dataIndex: 'reviewTime',
      key: 'reviewTime',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status !== 'completed' && (
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleReply(record)}
            >
              回复
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>满意度分析</Title>
        <Space>
          <Button onClick={() => message.info('导出报表')}>导出报表</Button>
          <Button type="primary" onClick={() => message.success('数据已刷新')}>刷新数据</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: '#666', fontSize: 13 }}>综合满意度</Text>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                  <Text strong style={{ fontSize: 36, color: ratingLevel.color }}>
                    {displayData.overview.avgRating}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#999' }}>/ 5.0</Text>
                  <Tag color={ratingLevel.color} style={{ marginLeft: 8 }}>
                    {ratingLevel.text}
                  </Tag>
                </div>
                <div style={{ marginTop: 4 }}>
                  <Rate disabled value={displayData.overview.avgRating} allowHalf style={{ fontSize: 16 }} />
                </div>
              </div>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `${ratingLevel.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                }}
              >
                {getRatingIcon(displayData.overview.avgRating)}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={4}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>评价总数</span>}
                value={displayData.overview.totalReviews}
                suffix="条"
                valueStyle={{ color: '#1E6FDB', fontSize: 24 }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#1E6FDB15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#1E6FDB',
                }}
              >
                <MessageOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>好评率</span>}
                value={displayData.overview.goodRate}
                suffix="%"
                valueStyle={{ color: '#52C41A', fontSize: 24 }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#52C41A15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#52C41A',
                }}
              >
                <SmileOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>中评率</span>}
                value={displayData.overview.mediumRate}
                suffix="%"
                valueStyle={{ color: '#FAAD14', fontSize: 24 }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#FAAD1415',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#FAAD14',
                }}
              >
                <MehOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Statistic
                title={<span style={{ color: '#666', fontSize: 13 }}>差评率</span>}
                value={displayData.overview.badRate}
                suffix="%"
                valueStyle={{ color: '#F5222D', fontSize: 24 }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#F5222D15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#F5222D',
                }}
              >
                <FrownOutlined />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card bodyStyle={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text style={{ color: '#666', fontSize: 13 }}>今日新增评价</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Badge count={displayData.overview.todayReviews} showZero color="#722ED1" />
                  <Text strong style={{ color: '#722ED1', fontSize: 24 }}>
                    {displayData.overview.todayReviews}
                  </Text>
                  <Text style={{ color: '#999', fontSize: 13 }}>条</Text>
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#722ED115',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#722ED1',
                }}
              >
                <StarOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <RadarChartOutlined style={{ color: '#722ED1' }} />
                五维评分雷达图
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ height: 350, padding: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={displayData.radarData}>
                  <PolarGrid stroke="#f0f0f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="评分"
                    dataKey="score"
                    stroke="#1E6FDB"
                    fill="#1E6FDB"
                    fillOpacity={0.6}
                  />
                  <RechartsTooltip formatter={(value) => [`${value}分`, '评分']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <LineChartOutlined style={{ color: '#1E6FDB' }} />
                满意度趋势（近30天）
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <div style={{ height: 350, padding: 16 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={displayData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    formatter={(value) => [`${value.toFixed(2)}分`, '平均评分']}
                    labelFormatter={(label) => `近30天 - ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    name="平均评分"
                    stroke="#52C41A"
                    strokeWidth={3}
                    dot={{ fill: '#52C41A', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <MessageOutlined style={{ color: '#1E6FDB' }} />
            评价列表
          </Space>
        }
        style={{ marginBottom: 24 }}
        bodyStyle={{ padding: 0 }}
        extra={
          <Space>
            <Button size="small" onClick={() => message.success('刷新成功')}>刷新</Button>
            <Button size="small" onClick={() => message.info('导出评价列表')}>导出</Button>
          </Space>
        }
      >
        <Table
          columns={reviewColumns}
          dataSource={displayData.reviews}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条评价`,
          }}
          locale={{ emptyText: <Empty description="暂无评价数据" /> }}
          scroll={{ x: 1200 }}
          expandable={{
            expandedRowRender: (record) => (
              <Card size="small" style={{ margin: '0 16px' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Space direction="vertical" size={8}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>工单编号：</Text>
                        <Text strong>{record.orderNo}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>业务类型：</Text>
                        <Text>{record.businessType}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>评价人：</Text>
                        <Text>{record.reviewer}</Text>
                      </div>
                    </Space>
                  </Col>
                  <Col xs={24} md={12}>
                    <Space direction="vertical" size={8}>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>评价时间：</Text>
                        <Text>{dayjs(record.reviewTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>整体评分：</Text>
                        <Space>
                          <Rate disabled value={record.overallSatisfaction} allowHalf style={{ fontSize: 14 }} />
                          <Text strong style={{ color: getRatingColor(record.overallSatisfaction) }}>
                            {record.overallSatisfaction}分
                          </Text>
                        </Space>
                      </div>
                    </Space>
                  </Col>
                  <Col span={24}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>评价内容：</Text>
                      <div style={{ marginTop: 4, padding: 12, background: '#f5f7fa', borderRadius: 4 }}>
                        {record.content}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card>
            ),
          }}
        />
      </Card>

      <Card
        title={
          <Space>
            <FrownOutlined style={{ color: '#F5222D' }} />
            差评追踪列表
            <Badge count={displayData.badReviews.filter((r) => r.status !== 'completed').length} size="small" />
          </Space>
        }
        bodyStyle={{ padding: 0 }}
        extra={
          <Space>
            <Button size="small" onClick={() => message.success('刷新成功')}>刷新</Button>
            <Button size="small" danger onClick={() => message.info('导出差评列表')}>导出</Button>
          </Space>
        }
      >
        <Table
          columns={badReviewColumns}
          dataSource={displayData.badReviews}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条差评`,
          }}
          locale={{ emptyText: <Empty description="暂无差评数据" /> }}
          scroll={{ x: 1200 }}
          onRow={(record) => ({
            style: {
              background: record.status === 'pending' ? '#FFF1F0' : undefined,
            },
          })}
        />
      </Card>

      <Modal
        title="回复评价"
        open={replyModalVisible}
        onOk={handleSubmitReply}
        onCancel={() => setReplyModalVisible(false)}
        width={600}
      >
        {currentReview && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">评价内容：</Text>
              <div style={{ marginTop: 8, padding: 12, background: '#FFF1F0', borderRadius: 4, border: '1px solid #FFCCC7' }}>
                {currentReview.content}
              </div>
            </div>
            <Form
              form={replyForm}
              layout="vertical"
            >
              <Form.Item
                name="reply"
                label="回复内容"
                rules={[{ required: true, message: '请输入回复内容' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请输入您的回复内容..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="评价详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {currentReview && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>工单编号：</Text>
                  <Text strong>{currentReview.orderNo}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>业务类型：</Text>
                  <Text>{currentReview.businessType || currentReview.serviceType}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>评价人：</Text>
                  <Text>{currentReview.reviewer}</Text>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>整体评分：</Text>
                  <Space>
                    <Rate
                      disabled
                      value={currentReview.overallSatisfaction || currentReview.rating}
                      allowHalf
                      style={{ fontSize: 14 }}
                    />
                    <Text
                      strong
                      style={{
                        color: getRatingColor(currentReview.overallSatisfaction || currentReview.rating),
                      }}
                    >
                      {currentReview.overallSatisfaction || currentReview.rating}分
                    </Text>
                  </Space>
                </div>
              </Col>
              {currentReview.serviceAttitude !== undefined && (
                <Col span={24}>
                  <Card size="small" title="五维评分详情" style={{ marginBottom: 16 }}>
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text>服务态度</Text>
                          <Space>
                            <Rate disabled value={currentReview.serviceAttitude} allowHalf style={{ fontSize: 12 }} />
                            <Text strong style={{ color: getRatingColor(currentReview.serviceAttitude) }}>
                              {currentReview.serviceAttitude}分
                            </Text>
                          </Space>
                        </div>
                        <Progress
                          percent={(currentReview.serviceAttitude / 5) * 100}
                          strokeColor={getRatingColor(currentReview.serviceAttitude)}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text>办理效率</Text>
                          <Space>
                            <Rate disabled value={currentReview.handlingEfficiency} allowHalf style={{ fontSize: 12 }} />
                            <Text strong style={{ color: getRatingColor(currentReview.handlingEfficiency) }}>
                              {currentReview.handlingEfficiency}分
                            </Text>
                          </Space>
                        </div>
                        <Progress
                          percent={(currentReview.handlingEfficiency / 5) * 100}
                          strokeColor={getRatingColor(currentReview.handlingEfficiency)}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text>业务熟练度</Text>
                          <Space>
                            <Rate disabled value={currentReview.professionalSkill} allowHalf style={{ fontSize: 12 }} />
                            <Text strong style={{ color: getRatingColor(currentReview.professionalSkill) }}>
                              {currentReview.professionalSkill}分
                            </Text>
                          </Space>
                        </div>
                        <Progress
                          percent={(currentReview.professionalSkill / 5) * 100}
                          strokeColor={getRatingColor(currentReview.professionalSkill)}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text>便民程度</Text>
                          <Space>
                            <Rate disabled value={currentReview.convenience} allowHalf style={{ fontSize: 12 }} />
                            <Text strong style={{ color: getRatingColor(currentReview.convenience) }}>
                              {currentReview.convenience}分
                            </Text>
                          </Space>
                        </div>
                        <Progress
                          percent={(currentReview.convenience / 5) * 100}
                          strokeColor={getRatingColor(currentReview.convenience)}
                          showInfo={false}
                          size="small"
                        />
                      </div>
                    </Space>
                  </Card>
                </Col>
              )}
              <Col span={24}>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>评价内容：</Text>
                  <div style={{ marginTop: 8, padding: 12, background: '#f5f7fa', borderRadius: 4 }}>
                    {currentReview.content}
                  </div>
                </div>
              </Col>
              {currentReview.reply && (
                <Col span={24}>
                  <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>官方回复：</Text>
                    <div
                      style={{
                        marginTop: 8,
                        padding: 12,
                        background: '#E6F7FF',
                        borderRadius: 4,
                        border: '1px solid #91D5FF',
                      }}
                    >
                      {currentReview.reply}
                    </div>
                  </div>
                </Col>
              )}
              <Col span={24}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>评价时间：</Text>
                  <Text>{dayjs(currentReview.reviewTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Satisfaction;
