import React, { useState, useEffect } from 'react';
import {
  Card,
  Tag,
  Tabs,
  Button,
  Avatar,
  Descriptions,
  List,
  Rate,
  Progress,
  Statistic,
  Row,
  Col,
  Image,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Empty,
  Space
} from 'antd';
import {
  ArrowLeftOutlined,
  SafetyOutlined,
  UserOutlined,
  StarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  TrophyOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Provider, PortfolioItem, ReviewComment } from '@/types';
import { providerApi, portfolioApi, analyticsApi } from '@/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

const TalentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<ReviewComment[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [providerData, portfolioData, reviewsData, statsData] = await Promise.all([
        providerApi.getDetail(id),
        portfolioApi.getList(id, { page: 1, pageSize: 100 }),
        providerApi.getReviews(id, { page: 1, pageSize: 100 }),
        analyticsApi.getProviderStats(id)
      ]);
      setProvider(providerData);
      setPortfolio(portfolioData.list || []);
      setReviews(reviewsData.list || []);
      setStats(statsData);
    } catch (error) {
      console.error('Fetch talent detail error:', error);
      message.error('获取人才详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleInvite = async (values: any) => {
    try {
      setSubmitting(true);
      message.success('邀请已发送');
      setInviteModalVisible(false);
      inviteForm.resetFields();
    } catch (error) {
      console.error('Invite error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString('zh-CN')}`;
  };

  const getRatingDistributionOption = () => {
    const distribution = stats?.ratingDistribution || [10, 20, 30, 25, 15];
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['1星', '2星', '3星', '4星', '5星'],
        axisLabel: { color: '#666' }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#666', formatter: '{value}%' }
      },
      series: [{
        data: distribution,
        type: 'bar',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1E40AF' },
              { offset: 1, color: '#3B82F6' }
            ]
          }
        },
        barWidth: '50%'
      }]
    };
  };

  const getTaskTrendOption = () => {
    const trend = stats?.monthlyTasks || [5, 8, 12, 10, 15, 18];
    return {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        axisLabel: { color: '#666' }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#666' }
      },
      series: [{
        data: trend,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
              { offset: 1, color: 'rgba(30, 64, 175, 0.05)' }
            ]
          }
        },
        lineStyle: { color: '#1E40AF', width: 2 },
        itemStyle: { color: '#1E40AF' }
      }]
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center h-96">
        <Empty description="服务商不存在" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'info',
      label: <span><FileTextOutlined />基本资料</span>,
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card title="个人简介">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {provider.bio || '暂无个人简介'}
              </p>
            </Card>
            <Card title="技能专长" className="mt-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {provider.skills?.map((skill, index) => (
                  <Tag key={index} color="blue" className="text-base px-4 py-1">
                    {skill}
                  </Tag>
                ))}
              </div>
            </Card>
            <Card title="资质认证" className="mt-6">
              {provider.certifications?.length > 0 ? (
                <List
                  dataSource={provider.certifications}
                  renderItem={(cert) => (
                    <List.Item className="p-4 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center gap-3">
                        <SafetyOutlined className="text-green-500 text-xl" />
                        <div>
                          <div className="font-medium">{cert}</div>
                          <div className="text-sm text-gray-500">已通过平台认证</div>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无资质认证" />
              )}
            </Card>
          </div>
          <div>
            <Card title="履约数据">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <TrophyOutlined className="text-3xl text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{provider.completedTasks}</div>
                    <div className="text-sm text-gray-500">完成项目</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <StarOutlined className="text-3xl text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">{provider.rating}</div>
                    <div className="text-sm text-gray-500">综合评分</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <ThunderboltOutlined className="text-3xl text-orange-600 mb-2" />
                    <div className="text-2xl font-bold text-orange-600">{provider.responseRate}%</div>
                    <div className="text-sm text-gray-500">响应率</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <ClockCircleOutlined className="text-3xl text-purple-600 mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{provider.responseTime}m</div>
                    <div className="text-sm text-gray-500">平均响应</div>
                  </div>
                </Col>
              </Row>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">按时交付率</span>
                  <span className="font-bold text-green-600">{stats?.onTimeRate || 95}%</span>
                </div>
                <Progress percent={stats?.onTimeRate || 95} status="success" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">客户满意度</span>
                  <span className="font-bold text-blue-600">{stats?.satisfactionRate || 92}%</span>
                </div>
                <Progress percent={stats?.satisfactionRate || 92} strokeColor="#1E40AF" />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">复购率</span>
                  <span className="font-bold text-purple-600">{stats?.repeatRate || 45}%</span>
                </div>
                <Progress percent={stats?.repeatRate || 45} strokeColor="#7C3AED" />
              </div>
            </Card>
            <Card title="收入趋势" className="mt-6">
              <ReactECharts option={getTaskTrendOption()} style={{ height: 250 }} />
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'portfolio',
      label: <span><TrophyOutlined />作品集 ({portfolio.length})</span>,
      children: (
        <Card>
          {portfolio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.map((item) => (
                <Card
                  key={item.id}
                  hoverable
                  className="overflow-hidden"
                  cover={
                    item.images?.length > 0 ? (
                      <Image
                        src={item.images[0]}
                        alt={item.title}
                        height={200}
                        style={{ objectFit: 'cover' }}
                        fallback="https://via.placeholder.com/400x200?text=No+Image"
                      />
                    ) : (
                      <div className="h-48 bg-gray-100 flex items-center justify-center">
                        <FileTextOutlined className="text-5xl text-gray-300" />
                      </div>
                    )
                  }
                >
                  <Card.Meta
                    title={item.title}
                    description={
                      <div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Tag color="blue">{item.categoryName}</Tag>
                          {item.skills?.slice(0, 3).map((s, i) => (
                            <Tag key={i}>{s}</Tag>
                          ))}
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <StarOutlined className="text-yellow-400" />
                            {item.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChartOutlined />
                            {item.views}
                          </span>
                          {item.budget && (
                            <span className="text-primary-700 font-medium">
                              {formatCurrency(item.budget)}
                            </span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          ) : (
            <Empty description="暂无作品集" />
          )}
        </Card>
      )
    },
    {
      key: 'reviews',
      label: <span><StarOutlined />历史评价 ({reviews.length})</span>,
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="评分分布">
              <ReactECharts option={getRatingDistributionOption()} style={{ height: 300 }} />
            </Card>
          </div>
          <div className="lg:col-span-2">
            <Card title="全部评价">
              {reviews.length > 0 ? (
                <List
                  dataSource={reviews}
                  renderItem={(review) => (
                    <List.Item className="flex-col items-start p-4 bg-gray-50 rounded-lg mb-3">
                      <div className="flex items-center gap-3 mb-2 w-full">
                        <Avatar src={undefined} icon={<UserOutlined />}>
                          {review.reviewerName?.charAt(0)}
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{review.reviewerName}</span>
                            {review.rating && (
                              <Rate disabled allowHalf defaultValue={review.rating} style={{ fontSize: 14 }} />
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {dayjs(review.createdAt).format('YYYY-MM-DD HH:mm')}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 ml-12 whitespace-pre-wrap">{review.content}</p>
                      {review.attachments?.length > 0 && (
                        <div className="ml-12 mt-2 flex flex-wrap gap-2">
                          {review.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                            >
                              <PaperClipOutlined />
                              {file.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无评价" />
              )}
            </Card>
          </div>
        </div>
      )
    },
    {
      key: 'performance',
      label: <span><BarChartOutlined />履约数据</span>,
      children: (
        <div>
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="累计完成项目"
                  value={provider.completedTasks}
                  prefix={<TrophyOutlined className="text-blue-600" />}
                  valueStyle={{ color: '#1E40AF' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="累计总收入"
                  value={provider.totalEarnings}
                  prefix="¥"
                  precision={2}
                  formatter={(value) => new Intl.NumberFormat('zh-CN').format(value as number)}
                  valueStyle={{ color: '#52C41A' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="平均项目金额"
                  value={stats?.avgBudget || 8000}
                  prefix="¥"
                  formatter={(value) => new Intl.NumberFormat('zh-CN').format(value as number)}
                  valueStyle={{ color: '#FA8C16' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic
                  title="服务年限"
                  value={provider.experienceYears}
                  suffix="年"
                  valueStyle={{ color: '#722ED1' }}
                />
              </Card>
            </Col>
          </Row>
          <Card title="月度完成趋势">
            <ReactECharts option={getTaskTrendOption()} style={{ height: 400 }} />
          </Card>
        </div>
      )
    }
  ];

  return (
    <div>
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/employer/talent')}
            >
              返回列表
            </Button>
          </div>
          <Space>
            <Button icon={<MessageOutlined />}>
              发送消息
            </Button>
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={() => setInviteModalVisible(true)}
            >
              邀请合作
            </Button>
          </Space>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex items-center gap-6">
            <Avatar size={120} src={provider.avatar} icon={<UserOutlined />}>
              {provider.name?.charAt(0)}
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-800">{provider.name}</h2>
                {provider.verified && (
                  <Tag color="green" icon={<SafetyOutlined />} className="text-sm px-3 py-1">
                    已认证
                  </Tag>
                )}
                <Tag color="blue" className="text-sm px-3 py-1">
                  Lv.{provider.level} {provider.levelName}
                </Tag>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Rate disabled allowHalf defaultValue={provider.rating} style={{ fontSize: 18 }} />
                  <span className="text-lg font-bold text-yellow-500">{provider.rating}</span>
                  <span className="text-gray-500">({provider.reviewCount}条评价)</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                {provider.location && (
                  <span className="flex items-center gap-1">
                    <EnvironmentOutlined />
                    {provider.location}
                  </span>
                )}
                {provider.company && (
                  <span className="flex items-center gap-1">
                    <TeamOutlined />
                    {provider.company}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ClockCircleOutlined />
                  入驻于 {dayjs(provider.createdAt).format('YYYY年MM月')}
                </span>
              </div>
            </div>
          </div>
          <div className="lg:ml-auto flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-700">{provider.completedTasks}</div>
              <div className="text-sm text-gray-500">完成项目</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{formatCurrency(provider.totalEarnings)}</div>
              <div className="text-sm text-gray-500">累计收入</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{provider.responseRate}%</div>
              <div className="text-sm text-gray-500">响应率</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      </Card>

      <Modal
        title="邀请合作"
        open={inviteModalVisible}
        onCancel={() => {
          setInviteModalVisible(false);
          inviteForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInvite}
        >
          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name="projectDesc"
            label="项目描述"
            rules={[{ required: true, message: '请输入项目描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述项目需求..." />
          </Form.Item>
          <Form.Item
            name="budget"
            label="预算范围"
            rules={[{ required: true, message: '请输入预算范围' }]}
          >
            <Input placeholder="例如：¥5,000 - ¥10,000" />
          </Form.Item>
          <Form.Item
            name="deadline"
            label="期望交付时间"
          >
            <Input placeholder="例如：30天内" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-2">
            <Button onClick={() => {
              setInviteModalVisible(false);
              inviteForm.resetFields();
            }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              发送邀请
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TalentDetail;
