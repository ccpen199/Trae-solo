import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Progress,
  Empty,
  Skeleton,
  Typography,
  Avatar,
  Descriptions,
  Divider,
  List,
  Modal,
  Form,
  Input,
  Select,
  message,
  Steps,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  HeartOutlined,
  HeartFilled,
  SendOutlined,
  ShareAltOutlined,
  MapPinOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  BuildOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import { getJob, applyJob } from '../../api/employment';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

const mockJobDetail = {
  id: 1,
  title: '高级前端开发工程师',
  salary: '20K-35K',
  type: '全职',
  location: '北京市朝阳区',
  publishTime: '2024-01-15',
  benefits: ['五险一金', '年终奖金', '带薪年假', '弹性工作', '年度体检', '节日福利'],
  matchScore: 92,
  education: '本科',
  experience: '3-5年',
  industry: '互联网',
  responsibilities: [
    '负责公司核心产品的前端架构设计与开发',
    '优化用户界面和用户体验，提升产品性能',
    '参与技术方案评审，解决复杂技术问题',
    '指导初级开发人员，进行代码审查',
    '与产品、设计、后端团队紧密协作，推动项目落地',
  ],
  requirements: [
    '本科及以上学历，计算机相关专业',
    '3年以上前端开发经验，有大型项目经验优先',
    '精通React/Vue等主流前端框架',
    '熟悉TypeScript，了解Node.js',
    '具备良好的沟通能力和团队协作精神',
    '有政务系统开发经验者优先',
  ],
  company: {
    name: '科技创新有限公司',
    logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20company%20logo%20blue&image_size=square',
    size: '500-1000人',
    industry: '互联网/科技',
    description: '科技创新有限公司是一家专注于政务数字化转型的高新技术企业，致力于为政府部门提供智慧政务解决方案。公司成立于2015年，现有员工800余人，业务覆盖全国30多个省市。',
    businessInfo: {
      registeredCapital: '5000万人民币',
      establishedDate: '2015-06-18',
      legalPerson: '张三',
      businessScope: '技术开发、技术服务、技术咨询、技术转让；计算机系统服务；基础软件服务；应用软件服务；数据处理；公共关系服务；会议服务；承办展览展示活动。',
      creditCode: '91110108MA001ABCDEF',
    },
  },
  address: '北京市朝阳区建国路88号SOHO现代城A座12层',
  similarJobs: [
    { id: 2, title: 'Java后端开发工程师', salary: '18K-30K', company: '智慧政务科技公司', matchScore: 85 },
    { id: 3, title: '全栈开发工程师', salary: '25K-40K', company: '数字科技集团', matchScore: 88 },
    { id: 4, title: '前端架构师', salary: '35K-50K', company: '互联网巨头', matchScore: 95 },
  ],
  applicationStatus: null,
};

const mockApplicationStatus = {
  status: 'interviewing',
  appliedTime: '2024-01-16 10:30:00',
  timeline: [
    { time: '2024-01-16 10:30', status: '已投递', description: '简历已成功投递' },
    { time: '2024-01-17 14:20', status: '已查看', description: 'HR已查看您的简历' },
    { time: '2024-01-18 09:00', status: '面试中', description: '已邀请求职者参加面试' },
  ],
  interviewTime: '2024-01-22 14:00',
  interviewAddress: '北京市朝阳区建国路88号SOHO现代城A座12层会议室B',
};

const JobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { loading, data: jobData } = useRequest(() => getJob(id), {
    onError: () => message.error('获取岗位详情失败'),
  });

  const { loading: applyLoading, run: runApply } = useRequest(applyJob, {
    manual: true,
    onSuccess: () => {
      message.success('简历投递成功！');
      setApplyModalVisible(false);
      form.resetFields();
    },
    onError: () => message.error('投递失败，请稍后重试'),
  });

  const job = jobData || mockJobDetail;
  const hasApplied = mockApplicationStatus;

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    message.success(isFavorite ? '已取消收藏' : '已添加收藏');
  };

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const handleApply = () => {
    setApplyModalVisible(true);
  };

  const submitApply = async () => {
    try {
      const values = await form.validateFields();
      await runApply(id, values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return '#52C41A';
    if (score >= 80) return '#1E6FDB';
    if (score >= 70) return '#FAAD14';
    return '#F5222D';
  };

  const getStatusConfig = (status) => {
    const config = {
      applied: { color: 'blue', text: '已投递', icon: <SendOutlined /> },
      viewed: { color: 'cyan', text: '已查看', icon: <UserOutlined /> },
      interviewing: { color: 'orange', text: '面试中', icon: <ClockCircleOutlined /> },
      offered: { color: 'green', text: '已录用', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '不合适', icon: <CloseCircleOutlined /> },
    };
    return config[status] || config.applied;
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 20 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/employment/jobs')}
        style={{ marginBottom: 16 }}
      >
        返回岗位列表
      </Button>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={16}>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={16}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <Avatar src={job.company.logo} size={64} shape="square" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Title level={3} style={{ margin: 0 }}>{job.title}</Title>
                      <Tag color="#1E6FDB">{job.type}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 16 }}>{job.company.name}</Text>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16, color: '#666' }}>
                  <span>
                    <MapPinOutlined style={{ marginRight: 4 }} />
                    {job.location}
                  </span>
                  <span>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {job.publishTime}
                  </span>
                  <span>
                    <BulbOutlined style={{ marginRight: 4 }} />
                    {job.experience}
                  </span>
                  <span>
                    <BuildOutlined style={{ marginRight: 4 }} />
                    {job.education}
                  </span>
                </div>

                <div style={{ marginBottom: 16 }}>
                  {job.benefits.map((benefit, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
                      {benefit}
                    </Tag>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
                  <Text type="secondary">智能匹配度:</Text>
                  <Progress
                    type="dashboard"
                    percent={job.matchScore}
                    size={80}
                    strokeColor={getMatchScoreColor(job.matchScore)}
                  />
                  <div>
                    <Text strong style={{ fontSize: 24, color: getMatchScoreColor(job.matchScore) }}>
                      {job.matchScore}%
                    </Text>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      您的简历与该岗位高度匹配
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={8} style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">月薪范围</Text>
                </div>
                <Text strong style={{ fontSize: 32, color: '#F5222D' }}>
                  {job.salary}
                </Text>
                <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                  14薪 · 年终奖金
                </div>
              </Col>
            </Row>
          </Card>

          {hasApplied && (
            <Card
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52C41A' }} />
                  投递状态追踪
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <div style={{ marginBottom: 16 }}>
                <Tag color={getStatusConfig(hasApplied.status).color} icon={getStatusConfig(hasApplied.status).icon}>
                  {getStatusConfig(hasApplied.status).text}
                </Tag>
                <Text type="secondary" style={{ marginLeft: 8 }}>
                  投递时间: {hasApplied.appliedTime}
                </Text>
              </div>

              {hasApplied.interviewTime && (
                <div style={{ padding: 12, background: '#fff7e6', borderRadius: 8, marginBottom: 16 }}>
                  <Text strong style={{ color: '#FAAD14' }}>面试安排</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">面试时间: </Text>
                    <Text strong>{hasApplied.interviewTime}</Text>
                  </div>
                  <div>
                    <Text type="secondary">面试地点: </Text>
                    <Text>{hasApplied.interviewAddress}</Text>
                  </div>
                </div>
              )}

              <Timeline
                items={hasApplied.timeline.map(item => ({
                  color: item.status === '面试中' ? 'orange' : item.status === '已查看' ? 'cyan' : 'blue',
                  children: (
                    <div>
                      <Text strong>{item.status}</Text>
                      <div style={{ color: '#666', fontSize: 12 }}>{item.description}</div>
                      <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}

          <Card
            title={
              <Space>
                <SendOutlined style={{ color: '#1E6FDB' }} />
                岗位职责
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {job.responsibilities.map((item, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <Text>{item}</Text>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: '#1E6FDB' }} />
                任职要求
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <ul style={{ paddingLeft: 20, margin: 0 }}>
              {job.requirements.map((item, index) => (
                <li key={index} style={{ marginBottom: 8 }}>
                  <Text>{item}</Text>
                </li>
              ))}
            </ul>
          </Card>

          <Card
            title={
              <Space>
                <BankOutlined style={{ color: '#1E6FDB' }} />
                公司介绍
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <Avatar src={job.company.logo} size={80} shape="square" />
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ marginBottom: 4 }}>{job.company.name}</Title>
                <div style={{ marginBottom: 8 }}>
                  <Tag>{job.company.industry}</Tag>
                  <Tag>{job.company.size}</Tag>
                </div>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  {job.company.description}
                </Paragraph>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Title level={5} style={{ marginBottom: 12 }}>工商信息</Title>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="注册资本">{job.company.businessInfo.registeredCapital}</Descriptions.Item>
              <Descriptions.Item label="成立日期">{job.company.businessInfo.establishedDate}</Descriptions.Item>
              <Descriptions.Item label="法人代表">{job.company.businessInfo.legalPerson}</Descriptions.Item>
              <Descriptions.Item label="统一社会信用代码">{job.company.businessInfo.creditCode}</Descriptions.Item>
              <Descriptions.Item label="经营范围">{job.company.businessInfo.businessScope}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={
              <Space>
                <EnvironmentOutlined style={{ color: '#1E6FDB' }} />
                工作地址
              </Space>
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <EnvironmentOutlined style={{ color: '#F5222D', fontSize: 18 }} />
              <Text strong>{job.address}</Text>
            </div>
            <div
              style={{
                height: 200,
                background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1890ff',
              }}
            >
              <Text strong>地图占位 - 工作地点地图</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={8}>
          <Card style={{ position: 'sticky', top: 24, marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
                onClick={handleApply}
                block
                disabled={!!hasApplied}
              >
                {hasApplied ? '已投递' : '投递简历'}
              </Button>

              <Space style={{ width: '100%' }}>
                <Button
                  size="large"
                  icon={isFavorite ? <HeartFilled style={{ color: '#F5222D' }} /> : <HeartOutlined />}
                  onClick={toggleFavorite}
                  style={{ flex: 1 }}
                >
                  {isFavorite ? '已收藏' : '收藏'}
                </Button>
                <Button
                  size="large"
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                  style={{ flex: 1 }}
                >
                  分享
                </Button>
              </Space>
            </Space>
          </Card>

          <Card
            title={
              <Space>
                <BulbOutlined style={{ color: '#FAAD14' }} />
                相似岗位
              </Space>
            }
          >
            {job.similarJobs.length > 0 ? (
              <List
                dataSource={job.similarJobs}
                renderItem={(similarJob) => (
                  <List.Item
                    key={similarJob.id}
                    style={{ cursor: 'pointer', padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                    onClick={() => navigate(`/employment/jobs/${similarJob.id}`)}
                  >
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong>{similarJob.title}</Text>
                        <Text type="success" strong>{similarJob.matchScore}%</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{similarJob.company}</Text>
                        <Text type="danger" style={{ fontSize: 12 }}>{similarJob.salary}</Text>
                      </div>
                      <Progress
                        percent={similarJob.matchScore}
                        size="small"
                        showInfo={false}
                        strokeColor={getMatchScoreColor(similarJob.matchScore)}
                        style={{ marginTop: 4 }}
                      />
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="暂无相似岗位" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="投递简历"
        open={applyModalVisible}
        onOk={submitApply}
        onCancel={() => setApplyModalVisible(false)}
        confirmLoading={applyLoading}
        okText="确认投递"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入您的姓名" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入您的手机号" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input placeholder="请输入您的邮箱" />
          </Form.Item>
          <Form.Item
            name="expectedSalary"
            label="期望薪资"
            rules={[{ required: true, message: '请选择期望薪资' }]}
          >
            <Select placeholder="请选择期望薪资">
              <Option value="15K-20K">15K-20K</Option>
              <Option value="20K-25K">20K-25K</Option>
              <Option value="25K-30K">25K-30K</Option>
              <Option value="30K-35K">30K-35K</Option>
              <Option value="35K+">35K以上</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="message"
            label="自我推荐"
          >
            <TextArea rows={4} placeholder="简单介绍一下您的优势和求职意向（选填）" maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分享岗位"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div
            style={{
              width: 150,
              height: 150,
              margin: '0 auto 16px',
              background: '#f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text type="secondary">二维码占位</Text>
          </div>
          <Text type="secondary">扫描二维码分享给好友</Text>
          <Divider />
          <Space>
            <Button>微信好友</Button>
            <Button>朋友圈</Button>
            <Button>复制链接</Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default JobDetail;
