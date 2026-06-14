import { useState } from 'react';
import {
  Card,
  List,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Modal,
  Timeline,
  Row,
  Col,
  Typography,
  Skeleton,
  Empty,
  message,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BellOutlined,
  FireOutlined,
  EyeOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { getExamAnnouncements, getExams } from '../../api/exam';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

const examTypeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'civil_servant', label: '公务员考试' },
  { value: 'public_institution', label: '事业单位' },
  { value: 'professional_qualification', label: '职业资格' },
  { value: 'teacher', label: '教师资格' },
  { value: 'medical', label: '医疗卫生' },
  { value: 'other', label: '其他考试' },
];

const mockAnnouncements = [
  {
    id: 1,
    name: '2024年国家公务员考试录用公告',
    type: 'civil_servant',
    typeName: '公务员考试',
    registrationStart: '2024-10-15 08:00:00',
    registrationEnd: '2024-10-24 18:00:00',
    examTime: '2024-11-26 09:00:00',
    status: 'registration',
    hot: true,
    description: '根据《中华人民共和国公务员法》《公务员录用规定》等法律法规，现将2024年度中央机关及其直属机构考试录用一级主任科员及以下和其他相当职级层次公务员工作的有关事项公告如下。',
    organizer: '中央公务员主管部门',
    examLocation: '全国各考点',
    timeline: [
      { time: '2024-10-14', title: '发布招考公告', color: '#1E6FDB' },
      { time: '2024-10-15', title: '网上报名开始', color: '#52C41A' },
      { time: '2024-10-24', title: '报名截止', color: '#FAAD14' },
      { time: '2024-11-01', title: '报名确认及缴费', color: '#722ED1' },
      { time: '2024-11-20', title: '打印准考证', color: '#13C2C2' },
      { time: '2024-11-26', title: '公共科目笔试', color: '#F5222D' },
    ],
  },
  {
    id: 2,
    name: '2024年上半年事业单位公开招聘工作人员公告',
    type: 'public_institution',
    typeName: '事业单位',
    registrationStart: '2024-04-01 09:00:00',
    registrationEnd: '2024-04-10 17:00:00',
    examTime: '2024-05-12 09:00:00',
    status: 'ended',
    hot: false,
    description: '为加强事业单位工作人员队伍建设，规范进人行为，根据《事业单位人事管理条例》等规定，现就2024年上半年事业单位公开招聘工作人员有关事项公告如下。',
    organizer: '省人力资源和社会保障厅',
    examLocation: '省直及各市考点',
    timeline: [
      { time: '2024-03-25', title: '发布招聘公告', color: '#1E6FDB' },
      { time: '2024-04-01', title: '网上报名开始', color: '#52C41A' },
      { time: '2024-04-10', title: '报名截止', color: '#FAAD14' },
      { time: '2024-04-20', title: '资格审查结果查询', color: '#722ED1' },
      { time: '2024-05-05', title: '打印准考证', color: '#13C2C2' },
      { time: '2024-05-12', title: '笔试', color: '#F5222D' },
    ],
  },
  {
    id: 3,
    name: '2024年一级建造师资格考试公告',
    type: 'professional_qualification',
    typeName: '职业资格',
    registrationStart: '2024-07-01 09:00:00',
    registrationEnd: '2024-07-15 17:00:00',
    examTime: '2024-09-07 09:00:00',
    status: 'upcoming',
    hot: true,
    description: '根据人力资源社会保障部办公厅《关于2024年度专业技术人员职业资格考试计划及有关事项的通知》，现就2024年度一级建造师资格考试工作有关事项通知如下。',
    organizer: '省人事考试中心',
    examLocation: '各市考点',
    timeline: [
      { time: '2024-06-20', title: '发布考试公告', color: '#1E6FDB' },
      { time: '2024-07-01', title: '网上报名开始', color: '#52C41A' },
      { time: '2024-07-15', title: '报名截止', color: '#FAAD14' },
      { time: '2024-08-28', title: '打印准考证', color: '#13C2C2' },
      { time: '2024-09-07', title: '考试（第一天）', color: '#F5222D' },
      { time: '2024-09-08', title: '考试（第二天）', color: '#F5222D' },
    ],
  },
  {
    id: 4,
    name: '2024年中小学教师资格考试（笔试）公告',
    type: 'teacher',
    typeName: '教师资格',
    registrationStart: '2024-01-12 09:00:00',
    registrationEnd: '2024-01-15 17:00:00',
    examTime: '2024-03-09 09:00:00',
    status: 'ended',
    hot: false,
    description: '根据教育部考试中心统一部署，2024年上半年中小学教师资格考试（笔试）将于3月9日举行，现将有关事项公告如下。',
    organizer: '省教育考试院',
    examLocation: '各市考点',
    timeline: [
      { time: '2024-01-08', title: '发布考试公告', color: '#1E6FDB' },
      { time: '2024-01-12', title: '网上报名开始', color: '#52C41A' },
      { time: '2024-01-15', title: '报名截止', color: '#FAAD14' },
      { time: '2024-03-04', title: '打印准考证', color: '#13C2C2' },
      { time: '2024-03-09', title: '笔试', color: '#F5222D' },
    ],
  },
  {
    id: 5,
    name: '2024年医师资格考试公告',
    type: 'medical',
    typeName: '医疗卫生',
    registrationStart: '2024-02-01 09:00:00',
    registrationEnd: '2024-02-15 17:00:00',
    examTime: '2024-06-15 09:00:00',
    status: 'upcoming',
    hot: false,
    description: '根据《医师资格考试暂行办法》和国家卫生健康委员会医师资格考试委员会有关规定，现将2024年医师资格考试有关事项公告如下。',
    organizer: '省卫生健康委员会',
    examLocation: '各市考点',
    timeline: [
      { time: '2024-01-25', title: '发布考试公告', color: '#1E6FDB' },
      { time: '2024-02-01', title: '网上报名开始', color: '#52C41A' },
      { time: '2024-02-15', title: '报名截止', color: '#FAAD14' },
      { time: '2024-06-01', title: '实践技能考试', color: '#722ED1' },
      { time: '2024-06-10', title: '打印准考证', color: '#13C2C2' },
      { time: '2024-06-15', title: '医学综合笔试', color: '#F5222D' },
    ],
  },
];

const mockHotExams = [
  { id: 1, name: '2024年国家公务员考试', applicants: 125800, type: '公务员考试' },
  { id: 2, name: '2024年一级建造师资格考试', applicants: 85600, type: '职业资格' },
  { id: 3, name: '2024年事业单位招聘', applicants: 68900, type: '事业单位' },
  { id: 4, name: '2024年注册会计师考试', applicants: 52300, type: '职业资格' },
];

const Announcements = () => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const { loading, data: announcements } = useRequest(getExamAnnouncements, {
    onError: () => {
      message.error('获取考试公告失败');
    },
  });

  const { loading: examsLoading, data: exams } = useRequest(getExams, {
    onError: () => {
      message.error('获取考试列表失败');
    },
  });

  const displayData = announcements || mockAnnouncements;
  const hotExams = exams || mockHotExams;

  const getTypeColor = (type) => {
    const colorMap = {
      civil_servant: '#1E6FDB',
      public_institution: '#52C41A',
      professional_qualification: '#FAAD14',
      teacher: '#722ED1',
      medical: '#13C2C2',
      other: '#8C8C8C',
    };
    return colorMap[type] || '#8C8C8C';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      upcoming: { color: 'default', text: '未开始', icon: <ClockCircleOutlined /> },
      registration: { color: 'processing', text: '报名中', icon: <EditOutlined /> },
      ended: { color: 'default', text: '已结束', icon: <ClockCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.upcoming;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getTypeName = (type) => {
    const option = examTypeOptions.find(opt => opt.value === type);
    return option ? option.label : type;
  };

  const filteredData = displayData.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleViewDetail = (item) => {
    setSelectedAnnouncement(item);
    setDetailModalVisible(true);
  };

  const handleRegister = (item) => {
    if (item.status === 'upcoming') {
      message.info('报名尚未开始，请关注报名时间');
    } else if (item.status === 'registration') {
      message.success(`即将跳转到「${item.name}」报名页面`);
    } else {
      message.warning('报名已结束');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>考试公告</Title>
        <Text type="secondary">及时获取最新考试信息，把握报名时间</Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={17}>
          <Card
            title={
              <Space>
                <BellOutlined style={{ color: '#1E6FDB' }} />
                考试公告列表
              </Space>
            }
            extra={
              <Space>
                <Search
                  placeholder="搜索考试名称"
                  allowClear
                  style={{ width: 240 }}
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  style={{ width: 140 }}
                >
                  {examTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Space>
            }
          >
            {filteredData.length === 0 ? (
              <Empty description="暂无符合条件的考试公告" />
            ) : (
              <List
                dataSource={filteredData}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    style={{ padding: '20px 0', borderBottom: '1px solid #f0f0f0' }}
                  >
                    <Card
                      hoverable
                      style={{ width: '100%', border: 'none', boxShadow: 'none', padding: 0 }}
                      bodyStyle={{ padding: 0 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                            {item.hot && <Tag color="red" icon={<FireOutlined />}>热门</Tag>}
                            <Tag color={getTypeColor(item.type)}>{getTypeName(item.type)}</Tag>
                            {getStatusTag(item.status)}
                          </div>
                          <Title level={5} style={{ margin: '0 0 12px 0', cursor: 'pointer', color: '#1E6FDB' }} onClick={() => handleViewDetail(item)}>
                            {item.name}
                          </Title>
                          <Text type="secondary" style={{ display: 'block', marginBottom: 12, lineHeight: 1.6 }}>
                            {item.description}
                          </Text>
                          <Space size={24}>
                            <Text type="secondary">
                              <CalendarOutlined style={{ marginRight: 6 }} />
                              报名时间：{dayjs(item.registrationStart).format('YYYY-MM-DD')} ~ {dayjs(item.registrationEnd).format('YYYY-MM-DD')}
                            </Text>
                            <Text type="secondary">
                              <ClockCircleOutlined style={{ marginRight: 6 }} />
                              考试时间：{dayjs(item.examTime).format('YYYY-MM-DD')}
                            </Text>
                          </Space>
                        </div>
                        <Space direction="vertical" size="middle" style={{ flexShrink: 0 }}>
                          <Button
                            type="primary"
                            onClick={() => handleRegister(item)}
                            disabled={item.status === 'ended'}
                            style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
                          >
                            {item.status === 'registration' ? '立即报名' : '查看详情'}
                          </Button>
                          <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(item)}>
                            查看详情
                          </Button>
                        </Space>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: '#F5222D' }} />
                热门考试推荐
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            {hotExams.map((exam, index) => (
              <div
                key={exam.id}
                style={{
                  padding: '12px 0',
                  borderBottom: index < hotExams.length - 1 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      background: index < 3 ? '#F5222D' : '#8C8C8C',
                      color: '#fff',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <Text strong style={{ flex: 1 }}>{exam.name}</Text>
                </div>
                <div style={{ paddingLeft: 32 }}>
                  <Space size={12}>
                    <Tag color="blue" style={{ margin: 0 }}>{exam.type}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {exam.applicants.toLocaleString()} 人已报名
                    </Text>
                  </Space>
                </div>
              </div>
            ))}
          </Card>

          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#1E6FDB' }} />
                考试须知
              </Space>
            }
          >
            <div style={{ lineHeight: 2 }}>
              <Text type="secondary">• 请在规定时间内完成报名</Text>
              <br />
              <Text type="secondary">• 确保填写信息真实准确</Text>
              <br />
              <Text type="secondary">• 提前准备相关证明材料</Text>
              <br />
              <Text type="secondary">• 按时打印准考证参加考试</Text>
              <br />
              <Text type="secondary">• 遵守考场纪律，诚信应考</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <BellOutlined style={{ color: '#1E6FDB' }} />
            考试详情
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="register"
            type="primary"
            onClick={() => selectedAnnouncement && handleRegister(selectedAnnouncement)}
            disabled={selectedAnnouncement?.status === 'ended'}
            style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
          >
            {selectedAnnouncement?.status === 'registration' ? '立即报名' : '查看详情'}
          </Button>,
        ]}
      >
        {selectedAnnouncement && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Space style={{ marginBottom: 12 }}>
                {selectedAnnouncement.hot && <Tag color="red" icon={<FireOutlined />}>热门</Tag>}
                <Tag color={getTypeColor(selectedAnnouncement.type)}>{selectedAnnouncement.typeName}</Tag>
                {getStatusTag(selectedAnnouncement.status)}
              </Space>
              <Title level={4} style={{ margin: '0 0 12px 0' }}>{selectedAnnouncement.name}</Title>
              <Space size={24}>
                <Text type="secondary">
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  报名时间：{dayjs(selectedAnnouncement.registrationStart).format('YYYY-MM-DD HH:mm')} ~ {dayjs(selectedAnnouncement.registrationEnd).format('YYYY-MM-DD HH:mm')}
                </Text>
              </Space>
              <Space size={24} style={{ marginTop: 8 }}>
                <Text type="secondary">
                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                  考试时间：{dayjs(selectedAnnouncement.examTime).format('YYYY-MM-DD HH:mm')}
                </Text>
              </Space>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ marginBottom: 16 }}>考试介绍</Title>
              <Text style={{ lineHeight: 1.8 }}>{selectedAnnouncement.description}</Text>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card size="small" title="主办单位" bordered={false} style={{ background: '#f5f9ff' }}>
                    {selectedAnnouncement.organizer}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" title="考试地点" bordered={false} style={{ background: '#f5f9ff' }}>
                    {selectedAnnouncement.examLocation}
                  </Card>
                </Col>
              </Row>
            </div>

            <Divider />

            <div>
              <Title level={5} style={{ marginBottom: 16 }}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#1E6FDB' }} />
                  重要时间节点
                </Space>
              </Title>
              <Timeline
                items={selectedAnnouncement.timeline.map(item => ({
                  color: item.color,
                  children: (
                    <div>
                      <Text strong>{item.title}</Text>
                      <div style={{ color: '#999', fontSize: 12 }}>{item.time}</div>
                    </div>
                  ),
                }))}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Announcements;
