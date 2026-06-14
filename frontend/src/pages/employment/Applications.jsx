import { useState, useMemo } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Table,
  Empty,
  Skeleton,
  Typography,
  Modal,
  message,
  Tabs,
  Descriptions,
  Timeline,
  Popconfirm,
} from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useRequest from '../../hooks/useRequest';
import { getJobApplications } from '../../api/employment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const mockApplications = [
  {
    id: 1,
    jobId: 1,
    jobTitle: '高级前端开发工程师',
    company: '科技创新有限公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20company%20logo%20blue&image_size=square',
    salary: '20K-35K',
    location: '北京市朝阳区',
    applyTime: '2024-01-16 10:30:00',
    status: 'interviewing',
    resumeName: '张三_前端开发_5年.pdf',
    coverLetter: '本人有5年前端开发经验，精通React技术栈，有大型政务系统开发经验，非常适合该岗位。',
    expectedSalary: '25K-30K',
    interviewTime: '2024-01-22 14:00',
    interviewAddress: '北京市朝阳区建国路88号SOHO现代城A座12层会议室B',
    contactPerson: '李经理',
    contactPhone: '010-88888888',
    timeline: [
      { time: '2024-01-16 10:30', status: '已投递', description: '简历已成功投递' },
      { time: '2024-01-17 14:20', status: '已查看', description: 'HR已查看您的简历' },
      { time: '2024-01-18 09:00', status: '面试邀请', description: '已邀请求职者参加面试' },
    ],
  },
  {
    id: 2,
    jobId: 2,
    jobTitle: 'Java后端开发工程师',
    company: '智慧政务科技公司',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=government%20tech%20logo&image_size=square',
    salary: '18K-30K',
    location: '北京市海淀区',
    applyTime: '2024-01-15 14:20:00',
    status: 'viewed',
    resumeName: '张三_前端开发_5年.pdf',
    coverLetter: '有丰富的后端开发经验，熟悉Spring Boot、微服务架构。',
    expectedSalary: '20K-25K',
    interviewTime: null,
    interviewAddress: null,
    contactPerson: null,
    contactPhone: null,
    timeline: [
      { time: '2024-01-15 14:20', status: '已投递', description: '简历已成功投递' },
      { time: '2024-01-16 10:30', status: '已查看', description: 'HR已查看您的简历' },
    ],
  },
  {
    id: 3,
    jobId: 3,
    jobTitle: '产品经理',
    company: '数字科技集团',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20tech%20group%20logo&image_size=square',
    salary: '25K-40K',
    location: '上海市浦东新区',
    applyTime: '2024-01-10 09:15:00',
    status: 'applied',
    resumeName: '张三_前端开发_5年.pdf',
    coverLetter: '有3年产品经理经验，负责过多个大型项目。',
    expectedSalary: '25K-35K',
    interviewTime: null,
    interviewAddress: null,
    contactPerson: null,
    contactPhone: null,
    timeline: [
      { time: '2024-01-10 09:15', status: '已投递', description: '简历已成功投递' },
    ],
  },
  {
    id: 4,
    jobId: 4,
    jobTitle: 'UI/UX设计师',
    company: '创意设计工作室',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20design%20studio%20logo&image_size=square',
    salary: '15K-25K',
    location: '广州市天河区',
    applyTime: '2024-01-05 16:45:00',
    status: 'rejected',
    resumeName: '张三_前端开发_5年.pdf',
    coverLetter: '虽然是前端开发，但对设计也有浓厚兴趣。',
    expectedSalary: '15K-20K',
    interviewTime: null,
    interviewAddress: null,
    contactPerson: null,
    contactPhone: null,
    rejectReason: '岗位要求有3年以上UI设计经验，您的工作经历与岗位要求不太匹配。',
    timeline: [
      { time: '2024-01-05 16:45', status: '已投递', description: '简历已成功投递' },
      { time: '2024-01-08 11:00', status: '已查看', description: 'HR已查看您的简历' },
      { time: '2024-01-09 15:30', status: '已拒绝', description: '很遗憾，您的简历未通过筛选' },
    ],
  },
  {
    id: 5,
    jobId: 5,
    jobTitle: '全栈开发工程师',
    company: '互联网巨头',
    companyLogo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=internet%20giant%20company%20logo&image_size=square',
    salary: '25K-40K',
    location: '深圳市南山区',
    applyTime: '2023-12-20 11:00:00',
    status: 'offered',
    resumeName: '张三_前端开发_5年.pdf',
    coverLetter: '全栈开发经验丰富，前后端技术栈齐全。',
    expectedSalary: '28K-35K',
    interviewTime: '2023-12-28 10:00',
    interviewAddress: '深圳市南山区科技园腾讯大厦',
    contactPerson: '王总监',
    contactPhone: '0755-88888888',
    offerSalary: '30K-35K',
    offerBenefits: ['五险一金', '年终奖金', '股票期权', '带薪年假15天'],
    timeline: [
      { time: '2023-12-20 11:00', status: '已投递', description: '简历已成功投递' },
      { time: '2023-12-21 16:30', status: '已查看', description: 'HR已查看您的简历' },
      { time: '2023-12-22 10:00', status: '面试邀请', description: '邀请求职者参加第一轮面试' },
      { time: '2023-12-28 10:00', status: '面试中', description: '第一轮面试进行中' },
      { time: '2024-01-02 14:00', status: '面试中', description: '第二轮面试进行中' },
      { time: '2024-01-05 09:00', status: '已录用', description: '恭喜您，已获得该岗位录用通知' },
    ],
  },
];

const statusTabs = [
  { key: 'all', label: '全部', count: 5 },
  { key: 'applied', label: '待查看', count: 1 },
  { key: 'viewed', label: '已查看', count: 1 },
  { key: 'interviewing', label: '面试邀请', count: 1 },
  { key: 'offered', label: '已录用', count: 1 },
  { key: 'rejected', label: '已拒绝', count: 1 },
];

const Applications = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const { loading, data: applicationsData } = useRequest(getJobApplications, {
    onError: () => message.error('获取投递记录失败'),
  });

  const displayApplications = applicationsData || mockApplications;

  const getStatusConfig = (status) => {
    const config = {
      applied: { color: 'blue', text: '待查看', icon: <SendOutlined /> },
      viewed: { color: 'cyan', text: '已查看', icon: <EyeOutlined /> },
      interviewing: { color: 'orange', text: '面试邀请', icon: <CalendarOutlined /> },
      offered: { color: 'green', text: '已录用', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined /> },
    };
    return config[status] || config.applied;
  };

  const filteredApplications = useMemo(() => {
    if (activeTab === 'all') return displayApplications;
    return displayApplications.filter(app => app.status === activeTab);
  }, [displayApplications, activeTab]);

  const handleViewDetail = (application) => {
    setSelectedApplication(application);
    setDetailModalVisible(true);
  };

  const handleCancelApply = (applicationId) => {
    message.success('已撤销投递');
  };

  const handleGoToJob = (jobId) => {
    navigate(`/employment/jobs/${jobId}`);
    setDetailModalVisible(false);
  };

  const columns = [
    {
      title: '岗位信息',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text, record) => (
        <Space>
          <img src={record.companyLogo} alt="" style={{ width: 40, height: 40, borderRadius: 4 }} />
          <div>
            <Text strong style={{ display: 'block', cursor: 'pointer', color: '#1E6FDB' }} onClick={() => handleGoToJob(record.jobId)}>
              {text}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.company}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '薪资范围',
      dataIndex: 'salary',
      key: 'salary',
      render: (text) => <Text strong style={{ color: '#F5222D' }}>{text}</Text>,
    },
    {
      title: '工作地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '投递时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 180,
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const config = getStatusConfig(status);
        return <Tag icon={config.icon} color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            查看详情
          </Button>
          {record.status === 'applied' && (
            <Popconfirm
              title="确定要撤销投递吗？"
              description="撤销后该公司将无法查看您的简历"
              onConfirm={() => handleCancelApply(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger size="small">
                撤销投递
              </Button>
            </Popconfirm>
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
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>投递记录</Title>
        <Text type="secondary">查看您的所有岗位投递记录和状态</Text>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={statusTabs.map(tab => ({
            key: tab.key,
            label: (
              <Space>
                {tab.label}
                <Tag color={activeTab === tab.key ? '#1E6FDB' : 'default'}>{tab.count}</Tag>
              </Space>
            ),
          }))}
        />

        <Table
          columns={columns}
          dataSource={filteredApplications}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{ emptyText: <Empty description="暂无投递记录" /> }}
        />
      </Card>

      <Modal
        title="投递详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedApplication?.status !== 'rejected' && (
            <Button key="view" type="primary" onClick={() => handleGoToJob(selectedApplication.jobId)}>
              查看岗位
            </Button>
          ),
        ]}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {selectedApplication && (
          <div>
            <Card
              style={{ marginBottom: 16 }}
              bodyStyle={{ padding: 16 }}
            >
              <Space align="start" style={{ width: '100%' }}>
                <img src={selectedApplication.companyLogo} alt="" style={{ width: 56, height: 56, borderRadius: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Title level={4} style={{ margin: 0 }}>{selectedApplication.jobTitle}</Title>
                    <Tag color={getStatusConfig(selectedApplication.status).color} icon={getStatusConfig(selectedApplication.status).icon}>
                      {getStatusConfig(selectedApplication.status).text}
                    </Tag>
                  </div>
                  <Text type="secondary">{selectedApplication.company}</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text strong style={{ color: '#F5222D', fontSize: 18 }}>{selectedApplication.salary}</Text>
                    <Text type="secondary" style={{ marginLeft: 16 }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {selectedApplication.location}
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>

            {selectedApplication.status === 'rejected' && selectedApplication.rejectReason && (
              <Card
                style={{ marginBottom: 16, background: '#fff1f0', borderColor: '#ffa39e' }}
              >
                <Space align="start">
                  <CloseCircleOutlined style={{ color: '#F5222D', fontSize: 20 }} />
                  <div>
                    <Text strong style={{ color: '#F5222D' }}>很遗憾，您的简历未通过筛选</Text>
                    <div style={{ color: '#666', marginTop: 4 }}>{selectedApplication.rejectReason}</div>
                  </div>
                </Space>
              </Card>
            )}

            {selectedApplication.status === 'offered' && (
              <Card
                style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
              >
                <Space align="start">
                  <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 20 }} />
                  <div>
                    <Text strong style={{ color: '#52C41A', fontSize: 16 }}>恭喜您，已获得录用通知！</Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">录用薪资：</Text>
                      <Text strong style={{ color: '#F5222D' }}>{selectedApplication.offerSalary}</Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">福利待遇：</Text>
                      {selectedApplication.offerBenefits?.map((benefit, idx) => (
                        <Tag key={idx} color="green" style={{ marginBottom: 4 }}>{benefit}</Tag>
                      ))}
                    </div>
                  </div>
                </Space>
              </Card>
            )}

            {selectedApplication.interviewTime && (
              <Card
                style={{ marginBottom: 16, background: '#fff7e6', borderColor: '#ffd591' }}
                title={
                  <Space>
                    <CalendarOutlined style={{ color: '#FAAD14' }} />
                    面试安排
                  </Space>
                }
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="面试时间">{selectedApplication.interviewTime}</Descriptions.Item>
                  <Descriptions.Item label="面试地点">{selectedApplication.interviewAddress}</Descriptions.Item>
                  {selectedApplication.contactPerson && (
                    <Descriptions.Item label="联系人">
                      {selectedApplication.contactPerson}
                      {selectedApplication.contactPhone && ` (${selectedApplication.contactPhone})`}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            <Card title="投递信息" style={{ marginBottom: 16 }}>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="投递时间">{selectedApplication.applyTime}</Descriptions.Item>
                <Descriptions.Item label="简历">
                  <FileTextOutlined style={{ marginRight: 4 }} />
                  {selectedApplication.resumeName}
                </Descriptions.Item>
                <Descriptions.Item label="期望薪资">{selectedApplication.expectedSalary}</Descriptions.Item>
                <Descriptions.Item label="联系方式">
                  <PhoneOutlined style={{ marginRight: 4 }} />
                  138****5678
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {selectedApplication.coverLetter && (
              <Card title="自荐信" style={{ marginBottom: 16 }}>
                <Text type="secondary">{selectedApplication.coverLetter}</Text>
              </Card>
            )}

            <Card
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#1E6FDB' }} />
                  处理进度
                </Space>
              }
            >
              <Timeline
                items={selectedApplication.timeline?.map((item, index) => {
                  const isLast = index === selectedApplication.timeline.length - 1;
                  let color = 'blue';
                  if (item.status === '已查看') color = 'cyan';
                  if (item.status === '面试邀请') color = 'orange';
                  if (item.status === '面试中') color = 'orange';
                  if (item.status === '已录用') color = 'green';
                  if (item.status === '已拒绝') color = 'red';
                  return {
                    color: isLast ? color : 'gray',
                    children: (
                      <div>
                        <Text strong>{item.status}</Text>
                        <div style={{ color: '#666', fontSize: 12 }}>{item.description}</div>
                        <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
                      </div>
                    ),
                  };
                })}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Applications;
