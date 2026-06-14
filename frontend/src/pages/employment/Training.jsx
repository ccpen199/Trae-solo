import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Select,
  Empty,
  Skeleton,
  Typography,
  Avatar,
  List,
  Progress,
  Rate,
  Modal,
  Divider,
  message,
  Tabs,
  Statistic,
} from 'antd';
import {
  BookOutlined,
  PlayCircleOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  TrophyOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import { getTrainingCourses, enrollCourse, getMyTrainings } from '../../api/employment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const mockCourses = [
  {
    id: 1,
    name: 'React高级开发实战',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=react%20programming%20course%20cover&image_size=landscape_16_9',
    provider: '智慧政务培训学院',
    type: '技术开发',
    method: 'online',
    location: '线上学习平台',
    startTime: '2024-02-01',
    endTime: '2024-03-15',
    duration: '45课时',
    credits: 5,
    price: 0,
    originalPrice: 1999,
    enrolledCount: 2568,
    rating: 4.8,
    description: '本课程深入讲解React框架的核心原理和高级应用，包括Hooks、状态管理、性能优化、微前端架构等内容，适合有一定前端基础的学员。',
    syllabus: [
      'React核心原理与虚拟DOM',
      'Hooks深度解析与自定义Hook',
      '状态管理方案对比与实践',
      'React性能优化实战',
      '微前端架构设计与实现',
      '测试与部署最佳实践',
    ],
  },
  {
    id: 2,
    name: '政务服务数字化转型',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=government%20digital%20transformation%20course&image_size=landscape_16_9',
    provider: '政务服务研究中心',
    type: '政务服务',
    method: 'offline',
    location: '北京市海淀区政务服务中心',
    startTime: '2024-02-10',
    endTime: '2024-02-12',
    duration: '3天',
    credits: 3,
    price: 0,
    originalPrice: 800,
    enrolledCount: 156,
    rating: 4.9,
    description: '本课程系统介绍政务服务数字化转型的理论框架、技术路径和实践案例，帮助学员掌握政务信息化建设的核心能力。',
    syllabus: [
      '政务服务数字化转型政策解读',
      '一体化政务服务平台建设',
      '数据共享与业务协同',
      '人工智能在政务服务中的应用',
      '政务服务安全与隐私保护',
    ],
  },
  {
    id: 3,
    name: '产品经理实战训练营',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20manager%20training%20course&image_size=landscape_16_9',
    provider: '互联网产品学院',
    type: '产品设计',
    method: 'blended',
    location: '线上+线下结合',
    startTime: '2024-02-15',
    endTime: '2024-04-15',
    duration: '2个月',
    credits: 8,
    price: 2999,
    originalPrice: 4999,
    enrolledCount: 328,
    rating: 4.7,
    description: '从需求分析到产品上线，全流程培养产品经理核心能力。包含真实项目实战，名师一对一辅导，助力学员快速成长为优秀产品经理。',
    syllabus: [
      '产品思维与用户研究',
      '需求分析与优先级管理',
      '原型设计与交互原理',
      '数据驱动的产品决策',
      '产品运营与增长策略',
      '真实项目实战演练',
    ],
  },
  {
    id: 4,
    name: '职场沟通与协作技巧',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20communication%20skills%20training&image_size=landscape_16_9',
    provider: '职业能力发展中心',
    type: '职业素养',
    method: 'online',
    location: '线上学习平台',
    startTime: '2024-02-05',
    endTime: '2024-02-25',
    duration: '20课时',
    credits: 2,
    price: 0,
    originalPrice: 399,
    enrolledCount: 5680,
    rating: 4.6,
    description: '提升职场沟通效率，掌握跨部门协作技巧，学会向上管理和向下管理，打造高效职场人际关系。',
    syllabus: [
      '高效沟通的基本原则',
      '跨部门协作与冲突管理',
      '向上管理与向下领导',
      '会议管理与演讲表达',
      '职场情商与情绪管理',
    ],
  },
];

const mockMyTrainings = [
  {
    id: 101,
    courseId: 1,
    name: 'React高级开发实战',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=react%20programming%20course%20cover&image_size=landscape_16_9',
    progress: 75,
    credits: 5,
    earnedCredits: 3,
    status: 'studying',
    enrollTime: '2024-01-20',
    lastStudyTime: '2024-01-28',
  },
  {
    id: 102,
    courseId: 4,
    name: '职场沟通与协作技巧',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=business%20communication%20skills%20training&image_size=landscape_16_9',
    progress: 100,
    credits: 2,
    earnedCredits: 2,
    status: 'completed',
    enrollTime: '2024-01-10',
    lastStudyTime: '2024-01-25',
    certificateUrl: '#',
  },
];

const courseTypes = ['全部', '技术开发', '政务服务', '产品设计', '职业素养'];
const trainingMethods = ['全部', '线上', '线下', '混合'];
const locations = ['全部', '北京', '上海', '广州', '深圳', '杭州', '成都'];
const priceRanges = [
  { key: 'all', label: '全部' },
  { key: 'free', label: '免费' },
  { key: '0-500', label: '0-500元' },
  { key: '500-2000', label: '500-2000元' },
  { key: '2000+', label: '2000元以上' },
];

const Training = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedMethod, setSelectedMethod] = useState('全部');
  const [selectedLocation, setSelectedLocation] = useState('全部');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const { loading, data: coursesData } = useRequest(getTrainingCourses, {
    onError: () => message.error('获取培训课程失败'),
  });

  const { loading: myTrainingsLoading, data: myTrainingsData } = useRequest(getMyTrainings, {
    onError: () => message.error('获取我的培训失败'),
  });

  const { loading: enrollLoading, run: runEnroll } = useRequest(enrollCourse, {
    manual: true,
    onSuccess: () => {
      message.success('报名成功！');
    },
    onError: () => message.error('报名失败，请稍后重试'),
  });

  const displayCourses = coursesData || mockCourses;
  const displayMyTrainings = myTrainingsData || mockMyTrainings;

  const isEnrolled = (courseId) => {
    return displayMyTrainings.some(t => t.courseId === courseId);
  };

  const getMethodConfig = (method) => {
    const config = {
      online: { color: 'cyan', text: '线上', icon: <PlayCircleOutlined /> },
      offline: { color: 'blue', text: '线下', icon: <EnvironmentOutlined /> },
      blended: { color: 'purple', text: '混合', icon: <BookOutlined /> },
    };
    return config[method] || config.online;
  };

  const getStatusConfig = (status) => {
    const config = {
      studying: { color: 'processing', text: '学习中' },
      completed: { color: 'success', text: '已完成' },
      expired: { color: 'default', text: '已过期' },
    };
    return config[status] || config.studying;
  };

  const filteredCourses = displayCourses.filter(course => {
    if (selectedType !== '全部' && course.type !== selectedType) return false;
    if (selectedMethod !== '全部') {
      const methodMap = { '线上': 'online', '线下': 'offline', '混合': 'blended' };
      if (course.method !== methodMap[selectedMethod]) return false;
    }
    if (selectedLocation !== '全部' && !course.location.includes(selectedLocation)) return false;
    if (selectedPrice !== 'all') {
      if (selectedPrice === 'free' && course.price !== 0) return false;
      if (selectedPrice === '0-500' && (course.price === 0 || course.price > 500)) return false;
      if (selectedPrice === '500-2000' && (course.price < 500 || course.price > 2000)) return false;
      if (selectedPrice === '2000+' && course.price <= 2000) return false;
    }
    return true;
  });

  const handleViewDetail = (course) => {
    setSelectedCourse(course);
    setDetailModalVisible(true);
  };

  const handleEnroll = async (course) => {
    try {
      await runEnroll(course.id, { name: '张三', phone: '13812345678' });
    } catch (error) {
      console.error('Enroll failed:', error);
    }
  };

  const handleDownloadCertificate = (training) => {
    message.success('证书下载成功！');
  };

  const totalCredits = displayMyTrainings.reduce((sum, t) => sum + t.earnedCredits, 0);
  const completedCount = displayMyTrainings.filter(t => t.status === 'completed').length;

  if (loading || myTrainingsLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>培训课程</Title>
      </div>

      <Card
        tabList={[
          { key: 'all', tab: '全部课程' },
          { key: 'my', tab: '我的培训' },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
        style={{ marginBottom: 16 }}
      >
        {activeTab === 'all' && (
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Select
                value={selectedType}
                onChange={setSelectedType}
                style={{ width: '100%' }}
                placeholder="课程类型"
              >
                {courseTypes.map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={selectedMethod}
                onChange={setSelectedMethod}
                style={{ width: '100%' }}
                placeholder="培训方式"
              >
                {trainingMethods.map(method => (
                  <Option key={method} value={method}>{method}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={selectedLocation}
                onChange={setSelectedLocation}
                style={{ width: '100%' }}
                placeholder="地区"
              >
                {locations.map(loc => (
                  <Option key={loc} value={loc}>{loc}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                value={selectedPrice}
                onChange={setSelectedPrice}
                style={{ width: '100%' }}
                placeholder="价格"
              >
                {priceRanges.map(range => (
                  <Option key={range.key} value={range.key}>{range.label}</Option>
                ))}
              </Select>
            </Col>
          </Row>
        )}

        {activeTab === 'my' && (
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="已获学分"
                  value={totalCredits}
                  suffix="分"
                  prefix={<TrophyOutlined style={{ color: '#FAAD14' }} />}
                  valueStyle={{ color: '#1E6FDB' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="完成课程"
                  value={completedCount}
                  suffix="门"
                  prefix={<CheckCircleOutlined style={{ color: '#52C41A' }} />}
                  valueStyle={{ color: '#52C41A' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="学习中"
                  value={displayMyTrainings.length - completedCount}
                  suffix="门"
                  prefix={<PlayCircleOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      {activeTab === 'all' && (
        filteredCourses.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredCourses.map(course => (
              <Col xs={24} sm={12} md={8} key={course.id}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        height: 160,
                        backgroundImage: `url(${course.cover})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                      }}
                    >
                      <Tag
                        color={getMethodConfig(course.method).color}
                        icon={getMethodConfig(course.method).icon}
                        style={{ position: 'absolute', top: 12, left: 12 }}
                      >
                        {getMethodConfig(course.method).text}
                      </Tag>
                      {course.price === 0 ? (
                        <Tag color="success" style={{ position: 'absolute', top: 12, right: 12 }}>免费</Tag>
                      ) : (
                        <Tag color="orange" style={{ position: 'absolute', top: 12, right: 12 }}>¥{course.price}</Tag>
                      )}
                    </div>
                  }
                  bodyStyle={{ padding: 16 }}
                >
                  <Title level={5} style={{ marginBottom: 8, minHeight: 44 }}>{course.name}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {course.provider}
                  </Text>

                  <Space direction="vertical" size={6} style={{ width: '100%', marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 13 }}>
                      <span>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {course.startTime} ~ {course.endTime}
                      </span>
                      <span>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {course.duration}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: 13 }}>
                      <span>
                        <CreditCardOutlined style={{ marginRight: 4, color: '#FAAD14' }} />
                        {course.credits}学分
                      </span>
                      <span>
                        <TeamOutlined style={{ marginRight: 4 }} />
                        {course.enrolledCount}人报名
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Rate disabled value={course.rating} allowHalf style={{ fontSize: 12 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{course.rating}</Text>
                    </div>
                  </Space>

                  <Divider style={{ margin: '12px 0' }} />

                  <Space style={{ width: '100%' }}>
                    <Button
                      type="primary"
                      block
                      onClick={() => handleViewDetail(course)}
                    >
                      查看详情
                    </Button>
                    {isEnrolled(course.id) ? (
                      <Button disabled block>
                        已报名
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEnroll(course)}
                        loading={enrollLoading}
                        block
                      >
                        {course.price === 0 ? '立即报名' : `¥${course.price} 报名`}
                      </Button>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Card>
            <Empty description="暂无符合条件的课程" />
          </Card>
        )
      )}

      {activeTab === 'my' && (
        displayMyTrainings.length > 0 ? (
          <List
            dataSource={displayMyTrainings}
            renderItem={(training) => (
              <List.Item key={training.id}>
                <Card style={{ width: '100%' }}>
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={6}>
                      <div
                        style={{
                          height: 100,
                          backgroundImage: `url(${training.cover})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderRadius: 8,
                        }}
                      />
                    </Col>
                    <Col xs={24} sm={12}>
                      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text strong style={{ fontSize: 16 }}>{training.name}</Text>
                        <Tag color={getStatusConfig(training.status).color}>
                          {getStatusConfig(training.status).text}
                        </Tag>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          报名时间: {training.enrollTime} | 上次学习: {training.lastStudyTime}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Text type="secondary" style={{ minWidth: 80 }}>学习进度:</Text>
                        <Progress
                          percent={training.progress}
                          size="small"
                          strokeColor={training.status === 'completed' ? '#52C41A' : '#1E6FDB'}
                          style={{ flex: 1, maxWidth: 300 }}
                        />
                        <Text strong style={{ color: training.status === 'completed' ? '#52C41A' : '#1E6FDB' }}>
                          {training.progress}%
                        </Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">
                          学分获取: <Text strong style={{ color: '#FAAD14' }}>{training.earnedCredits}</Text> / {training.credits} 分
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} sm={6} style={{ textAlign: 'center' }}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button type="primary" icon={<PlayCircleOutlined />} block>
                          继续学习
                        </Button>
                        {training.status === 'completed' && (
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={() => handleDownloadCertificate(training)}
                            block
                          >
                            下载证书
                          </Button>
                        )}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Card>
            <Empty description="暂无培训记录" />
          </Card>
        )
      )}

      <Modal
        title="课程详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {selectedCourse && (
          <div>
            <div
              style={{
                height: 250,
                backgroundImage: `url(${selectedCourse.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 8,
                marginBottom: 16,
                position: 'relative',
              }}
            >
              <Tag
                color={getMethodConfig(selectedCourse.method).color}
                icon={getMethodConfig(selectedCourse.method).icon}
                style={{ position: 'absolute', top: 12, left: 12 }}
              >
                {getMethodConfig(selectedCourse.method).text}
              </Tag>
              <Tag color="blue" style={{ position: 'absolute', top: 12, left: 80 }}>
                {selectedCourse.type}
              </Tag>
              {selectedCourse.price === 0 ? (
                <Tag color="success" style={{ position: 'absolute', top: 12, right: 12 }}>免费</Tag>
              ) : (
                <Tag color="orange" style={{ position: 'absolute', top: 12, right: 12 }}>¥{selectedCourse.price}</Tag>
              )}
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={16}>
                <Title level={4} style={{ marginBottom: 8 }}>{selectedCourse.name}</Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  培训机构: {selectedCourse.provider}
                </Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Rate disabled value={selectedCourse.rating} allowHalf />
                  <Text strong>{selectedCourse.rating}</Text>
                  <Text type="secondary">({selectedCourse.enrolledCount}人已报名)</Text>
                </div>
              </Col>
              <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                {selectedCourse.price === 0 ? (
                  <Text strong style={{ fontSize: 28, color: '#52C41A' }}>免费</Text>
                ) : (
                  <div>
                    <Text type="secondary" style={{ textDecoration: 'line-through' }}>
                      ¥{selectedCourse.originalPrice}
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 28, color: '#F5222D' }}>¥{selectedCourse.price}</Text>
                    </div>
                  </div>
                )}
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <div style={{ color: '#666' }}>
                  <CalendarOutlined style={{ marginRight: 4, color: '#1E6FDB' }} />
                  培训时间
                </div>
                <Text strong>{selectedCourse.startTime}</Text>
                <div style={{ color: '#999' }}>至 {selectedCourse.endTime}</div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ color: '#666' }}>
                  <ClockCircleOutlined style={{ marginRight: 4, color: '#1E6FDB' }} />
                  培训时长
                </div>
                <Text strong>{selectedCourse.duration}</Text>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ color: '#666' }}>
                  <CreditCardOutlined style={{ marginRight: 4, color: '#FAAD14' }} />
                  可获学分
                </div>
                <Text strong>{selectedCourse.credits} 分</Text>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ color: '#666' }}>
                  <EnvironmentOutlined style={{ marginRight: 4, color: '#F5222D' }} />
                  培训地点
                </div>
                <Text>{selectedCourse.location}</Text>
              </Col>
            </Row>

            <Divider orientation="left">课程简介</Divider>
            <Paragraph style={{ marginBottom: 16, color: '#666' }}>{selectedCourse.description}</Paragraph>

            <Divider orientation="left">课程大纲</Divider>
            <List
              dataSource={selectedCourse.syllabus}
              renderItem={(item, index) => (
                <List.Item>
                  <Space>
                    <Tag color="blue">第{index + 1}章</Tag>
                    <Text>{item}</Text>
                  </Space>
                </List.Item>
              )}
              style={{ marginBottom: 16 }}
            />

            <Divider />

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              {isEnrolled(selectedCourse.id) ? (
                <Button type="primary" size="large" disabled>
                  已报名
                </Button>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleEnroll(selectedCourse)}
                  loading={enrollLoading}
                >
                  {selectedCourse.price === 0 ? '立即报名' : `¥${selectedCourse.price} 立即报名`}
                </Button>
              )}
              <Button size="large" onClick={() => setDetailModalVisible(false)}>
                关闭
              </Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Training;
