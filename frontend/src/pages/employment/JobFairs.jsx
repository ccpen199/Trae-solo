import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Empty,
  Skeleton,
  Typography,
  Avatar,
  List,
  Modal,
  Descriptions,
  Divider,
  message,
  Tabs,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  FileTextOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BuildingOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import { getJobFairs, registerFair } from '../../api/employment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const mockJobFairs = [
  {
    id: 1,
    name: '2024年春季大型人才招聘会',
    type: 'offline',
    time: '2024-02-15 09:00-17:00',
    location: '北京市朝阳区国家会议中心',
    companyCount: 200,
    jobCount: 3000,
    status: 'registered',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=job%20fair%20event%20banner&image_size=landscape_16_9',
    description: '本次招聘会由北京市人力资源和社会保障局主办，汇集200家知名企业，提供3000+优质岗位，涵盖互联网、金融、教育、医疗等多个行业。',
    companies: [
      { id: 1, name: '科技创新有限公司', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tech%20company%20logo&image_size=square', jobs: 50 },
      { id: 2, name: '智慧政务科技公司', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=government%20tech%20logo&image_size=square', jobs: 30 },
      { id: 3, name: '数字科技集团', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20tech%20group%20logo&image_size=square', jobs: 45 },
      { id: 4, name: '互联网巨头', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=internet%20giant%20logo&image_size=square', jobs: 80 },
    ],
    organizer: '北京市人力资源和社会保障局',
    contact: '010-12345678',
  },
  {
    id: 2,
    name: '互联网行业专场招聘会',
    type: 'online',
    time: '2024-02-20 10:00-16:00',
    location: '线上直播平台',
    companyCount: 80,
    jobCount: 1200,
    status: 'unregistered',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=online%20job%20fair%20virtual%20event&image_size=landscape_16_9',
    description: '专注互联网行业的线上招聘会，汇集80家互联网企业，涵盖前端、后端、产品、设计、运营等多个岗位类别。',
    companies: [
      { id: 5, name: '互联网科技公司', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=internet%20tech%20company%20logo&image_size=square', jobs: 60 },
      { id: 6, name: '电商平台', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ecommerce%20platform%20logo&image_size=square', jobs: 40 },
    ],
    organizer: '中国互联网协会',
    contact: '400-123-4567',
  },
  {
    id: 3,
    name: '高校毕业生就业双选会',
    type: 'offline',
    time: '2024-03-01 09:00-15:00',
    location: '北京市海淀区清华大学体育馆',
    companyCount: 150,
    jobCount: 2500,
    status: 'unregistered',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=university%20career%20fair%20event&image_size=landscape_16_9',
    description: '面向2024届高校毕业生的就业双选会，涵盖国企、事业单位、知名民营企业等150家用人单位。',
    companies: [
      { id: 7, name: '国有企业集团', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=state%20owned%20enterprise%20logo&image_size=square', jobs: 100 },
      { id: 8, name: '科研院所', logo: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=research%20institute%20logo&image_size=square', jobs: 50 },
    ],
    organizer: '北京市教育委员会',
    contact: '010-87654321',
  },
  {
    id: 4,
    name: '2024年冬季招聘会',
    type: 'offline',
    time: '2024-01-10 09:00-17:00',
    location: '北京市西城区展览馆',
    companyCount: 180,
    jobCount: 2800,
    status: 'cancelled',
    cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=winter%20job%20fair%20event&image_size=landscape_16_9',
    description: '已结束的冬季招聘会回顾。',
    companies: [],
    organizer: '北京市人力资源和社会保障局',
    contact: '010-12345678',
  },
];

const tabList = [
  { key: 'all', tab: '全部' },
  { key: 'online', tab: '线上' },
  { key: 'offline', tab: '线下' },
  { key: 'recent', tab: '近期' },
  { key: 'history', tab: '历史' },
];

const JobFairs = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedFair, setSelectedFair] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const { loading, data: fairsData } = useRequest(getJobFairs, {
    onError: () => message.error('获取招聘会列表失败'),
  });

  const { loading: registerLoading, run: runRegister } = useRequest(registerFair, {
    manual: true,
    onSuccess: () => {
      message.success('预约成功！');
    },
    onError: () => message.error('预约失败，请稍后重试'),
  });

  const displayFairs = fairsData || mockJobFairs;

  const getStatusConfig = (status) => {
    const config = {
      unregistered: { color: 'default', text: '未预约', icon: <ClockCircleOutlined /> },
      registered: { color: 'success', text: '已预约', icon: <CheckCircleOutlined /> },
      cancelled: { color: 'error', text: '已取消', icon: <CloseCircleOutlined /> },
    };
    return config[status] || config.unregistered;
  };

  const getTypeConfig = (type) => {
    const config = {
      online: { color: 'cyan', text: '线上', icon: <CloudOutlined /> },
      offline: { color: 'blue', text: '线下', icon: <EnvironmentOutlined /> },
    };
    return config[type] || config.offline;
  };

  const filteredFairs = displayFairs.filter(fair => {
    if (activeTab === 'all') return true;
    if (activeTab === 'online') return fair.type === 'online';
    if (activeTab === 'offline') return fair.type === 'offline';
    if (activeTab === 'recent') return fair.status !== 'cancelled';
    if (activeTab === 'history') return fair.status === 'cancelled';
    return true;
  });

  const handleViewDetail = (fair) => {
    setSelectedFair(fair);
    setDetailModalVisible(true);
  };

  const handleRegister = async (fair) => {
    try {
      await runRegister(fair.id, { name: '张三', phone: '13812345678' });
      fair.status = 'registered';
    } catch (error) {
      console.error('Register failed:', error);
    }
  };

  const handleCancelRegister = (fair) => {
    Modal.confirm({
      title: '确认取消预约',
      content: '确定要取消本次招聘会的预约吗？',
      okText: '确认取消',
      cancelText: '再想想',
      onOk: () => {
        fair.status = 'unregistered';
        message.success('已取消预约');
      },
    });
  };

  const handleShowQRCode = () => {
    setQrModalVisible(true);
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 15 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>招聘会</Title>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {tabList.map(tab => (
            <TabPane tab={tab.tab} key={tab.key} />
          ))}
        </Tabs>
      </Card>

      {filteredFairs.length > 0 ? (
        <Row gutter={[16, 16]}>
          {filteredFairs.map(fair => (
            <Col xs={24} sm={12} md={8} key={fair.id}>
              <Card
                hoverable
                cover={
                  <div
                    style={{
                      height: 160,
                      backgroundImage: `url(${fair.cover})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                    }}
                  >
                    <Tag
                      color={getTypeConfig(fair.type).color}
                      icon={getTypeConfig(fair.type).icon}
                      style={{ position: 'absolute', top: 12, left: 12 }}
                    >
                      {getTypeConfig(fair.type).text}
                    </Tag>
                    <Tag
                      color={getStatusConfig(fair.status).color}
                      icon={getStatusConfig(fair.status).icon}
                      style={{ position: 'absolute', top: 12, right: 12 }}
                    >
                      {getStatusConfig(fair.status).text}
                    </Tag>
                  </div>
                }
                bodyStyle={{ padding: 16 }}
              >
                <Title level={5} style={{ marginBottom: 8, minHeight: 44 }}>{fair.name}</Title>

                <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: 13 }}>
                    <CalendarOutlined style={{ color: '#1E6FDB' }} />
                    <Text>{fair.time}</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#666', fontSize: 13 }}>
                    <EnvironmentOutlined style={{ color: '#F5222D' }} />
                    <Text ellipsis style={{ maxWidth: 200 }}>{fair.location}</Text>
                  </div>
                  <div style={{ display: 'flex', gap: 16, color: '#666', fontSize: 13 }}>
                    <span>
                      <TeamOutlined style={{ marginRight: 4, color: '#52C41A' }} />
                      {fair.companyCount}家企业
                    </span>
                    <span>
                      <FileTextOutlined style={{ marginRight: 4, color: '#FAAD14' }} />
                      {fair.jobCount}个岗位
                    </span>
                  </div>
                </Space>

                <Divider style={{ margin: '12px 0' }} />

                <Space style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    onClick={() => handleViewDetail(fair)}
                  >
                    查看详情
                  </Button>
                  {fair.status === 'unregistered' && (
                    <Button
                      onClick={() => handleRegister(fair)}
                      loading={registerLoading}
                      block
                    >
                      立即预约
                    </Button>
                  )}
                  {fair.status === 'registered' && (
                    <Button
                      danger
                      onClick={() => handleCancelRegister(fair)}
                      block
                    >
                      取消预约
                    </Button>
                  )}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Empty description="暂无招聘会信息" />
        </Card>
      )}

      <Modal
        title="招聘会详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        {selectedFair && (
          <div>
            <div
              style={{
                height: 200,
                backgroundImage: `url(${selectedFair.cover})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 8,
                marginBottom: 16,
                position: 'relative',
              }}
            >
              <Tag
                color={getTypeConfig(selectedFair.type).color}
                icon={getTypeConfig(selectedFair.type).icon}
                style={{ position: 'absolute', top: 12, left: 12 }}
              >
                {getTypeConfig(selectedFair.type).text}
              </Tag>
              <Tag
                color={getStatusConfig(selectedFair.status).color}
                icon={getStatusConfig(selectedFair.status).icon}
                style={{ position: 'absolute', top: 12, right: 12 }}
              >
                {getStatusConfig(selectedFair.status).text}
              </Tag>
            </div>

            <Title level={4} style={{ marginBottom: 16 }}>{selectedFair.name}</Title>

            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="举办时间">{selectedFair.time}</Descriptions.Item>
              <Descriptions.Item label="举办地点">{selectedFair.location}</Descriptions.Item>
              <Descriptions.Item label="主办方">{selectedFair.organizer}</Descriptions.Item>
              <Descriptions.Item label="联系方式">{selectedFair.contact}</Descriptions.Item>
              <Descriptions.Item label="参会企业">{selectedFair.companyCount}家</Descriptions.Item>
              <Descriptions.Item label="提供岗位">{selectedFair.jobCount}个</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">招聘会介绍</Divider>
            <Paragraph style={{ marginBottom: 16, color: '#666' }}>{selectedFair.description}</Paragraph>

            {selectedFair.status === 'registered' && (
              <Card
                style={{ marginBottom: 16, background: '#f6ffed', borderColor: '#b7eb8f' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52C41A', fontSize: 20 }} />
                    <Text strong style={{ color: '#52C41A' }}>您已成功预约本次招聘会</Text>
                  </Space>
                  <Button type="primary" icon={<QrcodeOutlined />} onClick={handleShowQRCode}>
                    查看参会凭证
                  </Button>
                </div>
              </Card>
            )}

            {selectedFair.companies && selectedFair.companies.length > 0 && (
              <>
                <Divider orientation="left">参会企业</Divider>
                <List
                  dataSource={selectedFair.companies}
                  renderItem={(company) => (
                    <List.Item key={company.id}>
                      <List.Item.Meta
                        avatar={<Avatar src={company.logo} shape="square" />}
                        title={company.name}
                        description={`提供 ${company.jobs} 个岗位`}
                      />
                      <Button type="link">查看岗位</Button>
                    </List.Item>
                  )}
                />
              </>
            )}

            <Divider />

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              {selectedFair.status === 'unregistered' && (
                <Button
                  type="primary"
                  size="large"
                  onClick={() => handleRegister(selectedFair)}
                  loading={registerLoading}
                >
                  立即预约
                </Button>
              )}
              {selectedFair.status === 'registered' && (
                <Button
                  danger
                  size="large"
                  onClick={() => handleCancelRegister(selectedFair)}
                >
                  取消预约
                </Button>
              )}
              <Button size="large" onClick={() => setDetailModalVisible(false)}>
                关闭
              </Button>
            </Space>
          </div>
        )}
      </Modal>

      <Modal
        title="参会凭证"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div
            style={{
              width: 200,
              height: 200,
              margin: '0 auto 16px',
              background: '#f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <QrcodeOutlined style={{ fontSize: 100, color: '#1E6FDB' }} />
          </div>
          <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
            {selectedFair?.name}
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            预约人: 张三
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
            手机号: 138****5678
          </Text>
          <Text type="secondary" style={{ display: 'block' }}>
            请在入场时出示此二维码
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default JobFairs;
