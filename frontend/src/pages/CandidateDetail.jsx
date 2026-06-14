import { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Avatar,
  Tag,
  Button,
  Tabs,
  Table,
  Progress,
  Spin,
  message,
  Space,
  Descriptions,
  List,
  Typography,
  Divider,
  Modal,
  Select,
} from 'antd';
import {
  RobotOutlined,
  VideoCameraOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../context/AuthContext';
import { candidates, jobs } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

function CandidateDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [jobOptions, setJobOptions] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  useEffect(() => {
    fetchDetail();
    fetchJobOptions();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await candidates.getDetail(id);
      if (res.code === 0) {
        setDetail(res.data);
      }
    } catch (err) {
      console.error('获取求职者详情失败:', err);
      message.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobOptions = async () => {
    try {
      const res = await jobs.getList({ pageSize: 100 });
      if (res.code === 0) {
        setJobOptions(res.data.list || []);
      }
    } catch (err) {
      console.error('获取岗位列表失败:', err);
    }
  };

  const handleMatch = async () => {
    if (!selectedJob) {
      message.warning('请选择要匹配的岗位');
      return;
    }
    setMatchLoading(true);
    try {
      const res = await candidates.match(selectedJob, id);
      if (res.code === 0) {
        message.success('AI匹配完成');
        setMatchModalVisible(false);
        fetchDetail();
      }
    } catch (err) {
      console.error('AI匹配失败:', err);
      message.error('AI匹配失败');
    } finally {
      setMatchLoading(false);
    }
  };

  const handleInterview = () => {
    message.info(`正在为 ${detail?.name} 发起面试...`);
  };

  const handleOffer = () => {
    message.info(`正在为 ${detail?.name} 发送Offer...`);
  };

  const getIntentionColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  const getRadarOption = () => {
    const skills = detail?.skillScores || [
      { name: '专业技能', score: 75 },
      { name: '沟通能力', score: 80 },
      { name: '团队协作', score: 85 },
      { name: '学习能力', score: 90 },
      { name: '项目经验', score: 70 },
      { name: '学历背景', score: 80 },
    ];
    return {
      tooltip: {},
      radar: {
        indicator: skills.map((s) => ({
          name: s.name,
          max: 100,
        })),
        radius: '70%',
        center: ['50%', '50%'],
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: skills.map((s) => s.score),
              name: '技能评分',
              areaStyle: {
                color: 'rgba(24, 144, 255, 0.3)',
              },
              lineStyle: {
                color: '#1890ff',
              },
              itemStyle: {
                color: '#1890ff',
              },
            },
          ],
        },
      ],
    };
  };

  const workColumns = [
    {
      title: '公司名称',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: '在职时间',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '工作内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
  ];

  const educationColumns = [
    {
      title: '学校',
      dataIndex: 'school',
      key: 'school',
    },
    {
      title: '学历',
      dataIndex: 'degree',
      key: 'degree',
    },
    {
      title: '专业',
      dataIndex: 'major',
      key: 'major',
    },
    {
      title: '在校时间',
      dataIndex: 'duration',
      key: 'duration',
    },
  ];

  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '担任角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '项目时间',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: '项目描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  const matchColumns = [
    {
      title: '岗位名称',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
    },
    {
      title: '匹配度',
      dataIndex: 'matchScore',
      key: 'matchScore',
      render: (score) => (
        <Progress
          percent={score}
          size="small"
          status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: '匹配时间',
      dataIndex: 'matchTime',
      key: 'matchTime',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const applicationColumns = [
    {
      title: '岗位名称',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
    },
    {
      title: '投递时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          applied: { color: 'default', text: '已投递' },
          screening: { color: 'blue', text: '筛选中' },
          interview: { color: 'cyan', text: '面试中' },
          offer: { color: 'gold', text: '已发Offer' },
          hired: { color: 'green', text: '已入职' },
          rejected: { color: 'red', text: '已淘汰' },
        };
        const info = statusMap[status] || { color: 'default', text: status };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return <div style={{ padding: 24, textAlign: 'center' }}>未找到求职者信息</div>;
  }

  return (
    <div style={{ padding: '16px' }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/candidates')}>
              返回列表
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              求职者详情
            </Title>
          </Space>
          <Space>
            <Button
              type="primary"
              icon={<RobotOutlined />}
              onClick={() => setMatchModalVisible(true)}
            >
              AI匹配岗位
            </Button>
            <Button
              icon={<VideoCameraOutlined />}
              onClick={handleInterview}
            >
              发起面试
            </Button>
            <Button
              icon={<SendOutlined />}
              onClick={handleOffer}
            >
              发送Offer
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8} lg={6}>
            <Card bordered={false} style={{ background: '#fafafa', borderRadius: 12 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar size={100} src={detail.avatar}>
                  {detail.name?.charAt(0)}
                </Avatar>
                <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                  {detail.name}
                </Title>
                <Space wrap>
                  {detail.education && <Tag color="blue">{detail.education}</Tag>}
                  {detail.experience && <Tag color="green">{detail.experience}</Tag>}
                  {detail.expectedSalary && <Tag color="gold">{detail.expectedSalary}</Tag>}
                </Space>
              </div>

              <Descriptions column={1} size="small" bordered={false}>
                <Descriptions.Item label={<><PhoneOutlined /> 性别</>}>
                  {detail.gender || '未知'}
                </Descriptions.Item>
                <Descriptions.Item label={<><TeamOutlined /> 年龄</>}>
                  {detail.age || '未知'}岁
                </Descriptions.Item>
                <Descriptions.Item label={<><PhoneOutlined /> 手机号</>}>
                  {detail.phone}
                </Descriptions.Item>
                <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
                  {detail.email}
                </Descriptions.Item>
                <Descriptions.Item label={<><EnvironmentOutlined /> 所在城市</>}>
                  {detail.city}
                </Descriptions.Item>
                <Descriptions.Item label={<><TeamOutlined /> 工作年限</>}>
                  {detail.experience}
                </Descriptions.Item>
                <Descriptions.Item label={<><BookOutlined /> 学历</>}>
                  {detail.education}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  意向度预测
                </Text>
                <Progress
                  percent={detail.intentionScore || 0}
                  status={getIntentionColor(detail.intentionScore)}
                  strokeWidth={16}
                  format={(percent) => `${percent}%`}
                />
                <div style={{ marginTop: 8, textAlign: 'center', color: '#999', fontSize: 12 }}>
                  基于AI算法预测的求职意向度
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={16} lg={18}>
            <Card bordered={false}>
              <Tabs defaultActiveKey="resume">
                <TabPane tab="简历信息" key="resume">
                  <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>工作经历</Title>
                    <Table
                      columns={workColumns}
                      dataSource={detail.workExperience || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>教育经历</Title>
                    <Table
                      columns={educationColumns}
                      dataSource={detail.educationExperience || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>项目经历</Title>
                    <Table
                      columns={projectColumns}
                      dataSource={detail.projectExperience || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>

                  <div>
                    <Title level={5} style={{ marginBottom: 16 }}>技能标签</Title>
                    <Space wrap>
                      {(detail.skills || []).map((skill, index) => (
                        <Tag key={index} color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                          {skill}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </TabPane>

                <TabPane tab="技能图谱" key="skills">
                  <div style={{ height: '500px' }}>
                    <ReactECharts option={getRadarOption()} style={{ height: '100%' }} />
                  </div>
                </TabPane>

                <TabPane tab="匹配记录" key="matches">
                  <Table
                    columns={matchColumns}
                    dataSource={detail.matches || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </TabPane>

                <TabPane tab="投递记录" key="applications">
                  <Table
                    columns={applicationColumns}
                    dataSource={detail.applications || []}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    onRow={(record) => ({
                      onClick: () => navigate(`/applications/${record.id}`),
                      style: { cursor: 'pointer' },
                    })}
                  />
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="AI岗位匹配"
        open={matchModalVisible}
        onCancel={() => setMatchModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setMatchModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={matchLoading} onClick={handleMatch}>
            开始匹配
          </Button>,
        ]}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            选择要匹配的岗位，AI将自动分析求职者与岗位的匹配度
          </Text>
        </div>
        <Select
          placeholder="请选择岗位"
          style={{ width: '100%' }}
          onChange={setSelectedJob}
          showSearch
          optionFilterProp="children"
        >
          {jobOptions.map((job) => (
            <Option key={job.id} value={job.id}>
              {job.title}
            </Option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

export default CandidateDetail;
