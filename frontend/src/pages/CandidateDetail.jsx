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
  Typography,
  Divider,
  Modal,
  Select,
  DatePicker,
  TimePicker,
  InputNumber,
  Input,
  Form,
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
  CheckCircleOutlined,
  TrophyOutlined,
  DollarOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { useAuth } from '../context/AuthContext';
import { candidates, jobs, interviews, applications, offers } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

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
  const [matchResult, setMatchResult] = useState(null);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewForm] = Form.useForm();
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerForm] = Form.useForm();

  const candidate = detail?.candidate || detail;
  const resumeList = detail?.resumes || [];
  const applicationList = detail?.applications || [];

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
        setMatchResult(res.data);
        await fetchDetail();
      }
    } catch (err) {
      console.error('AI匹配失败:', err);
      message.error('AI匹配失败');
    } finally {
      setMatchLoading(false);
    }
  };

  const ensureApplication = async (jobId) => {
    const existing = applicationList.find((app) => app.job_id === jobId || app.jobId === jobId);
    if (existing) return existing;
    const res = await applications.create({
      candidate_id: id,
      job_id: jobId,
      status: 'screening',
    });
    if (res.code === 0) {
      await fetchDetail();
      return res.data;
    }
    throw new Error('创建申请失败');
  };

  const handleInterviewSubmit = async () => {
    try {
      const values = await interviewForm.validateFields();
      setInterviewLoading(true);
      const application = await ensureApplication(values.job_id);
      const scheduleTime = values.schedule_date && values.schedule_time
        ? dayjs(values.schedule_date)
            .hour(values.schedule_time.hour())
            .minute(values.schedule_time.minute())
            .format('YYYY-MM-DD HH:mm:ss')
        : undefined;
      const res = await interviews.create({
        application_id: application.id,
        job_id: values.job_id,
        candidate_id: id,
        interview_type: values.interview_type,
        schedule_time: scheduleTime,
        duration: values.duration,
        interviewer_name: values.interviewer_name,
        interviewer_phone: values.interviewer_phone,
      });
      if (res.code === 0) {
        message.success('面试安排成功');
        setInterviewModalVisible(false);
        interviewForm.resetFields();
        fetchDetail();
      } else {
        message.error(res.message || '面试安排失败');
      }
    } catch (err) {
      if (err.errorFields) return;
      console.error('面试安排失败:', err);
      message.error('面试安排失败');
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleOfferSubmit = async () => {
    try {
      const values = await offerForm.validateFields();
      setOfferLoading(true);
      const application = await ensureApplication(values.job_id);
      const res = await offers.create({
        application_id: application.id,
        job_id: values.job_id,
        candidate_id: id,
        salary_min: values.salary_min,
        salary_max: values.salary_max,
        probation_salary: values.probation_salary,
        probation_period: values.probation_period,
        entry_date: values.entry_date ? values.entry_date.format('YYYY-MM-DD') : undefined,
        work_place: values.work_place,
        benefits: values.benefits,
        other_terms: values.other_terms,
      });
      if (res.code === 0) {
        message.success('Offer发送成功');
        setOfferModalVisible(false);
        offerForm.resetFields();
        fetchDetail();
      } else {
        message.error(res.message || 'Offer发送失败');
      }
    } catch (err) {
      if (err.errorFields) return;
      console.error('Offer发送失败:', err);
      message.error('Offer发送失败');
    } finally {
      setOfferLoading(false);
    }
  };

  const getIntentionColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'normal';
    return 'exception';
  };

  const getRadarOption = () => {
    const source = matchResult || candidate;
    const skills = source?.skillScores || [
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
    { title: '公司名称', dataIndex: 'company', key: 'company' },
    { title: '职位', dataIndex: 'position', key: 'position' },
    { title: '在职时间', dataIndex: 'duration', key: 'duration' },
    { title: '工作内容', dataIndex: 'content', key: 'content', ellipsis: true },
  ];

  const educationColumns = [
    { title: '学校', dataIndex: 'school', key: 'school' },
    { title: '学历', dataIndex: 'degree', key: 'degree' },
    { title: '专业', dataIndex: 'major', key: 'major' },
    { title: '在校时间', dataIndex: 'duration', key: 'duration' },
  ];

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '担任角色', dataIndex: 'role', key: 'role' },
    { title: '项目时间', dataIndex: 'duration', key: 'duration' },
    { title: '项目描述', dataIndex: 'description', key: 'description', ellipsis: true },
  ];

  const matchColumns = [
    { title: '岗位名称', dataIndex: 'jobTitle', key: 'jobTitle',
      render: (text, record) => record.job_title || record.jobTitle || text,
    },
    { title: '匹配度', dataIndex: 'matchScore', key: 'matchScore',
      render: (score, record) => {
        const val = score || record.match_score || 0;
        return (
          <Progress
            percent={val}
            size="small"
            status={val >= 80 ? 'success' : val >= 60 ? 'normal' : 'exception'}
          />
        );
      },
    },
    {
      title: '匹配详情',
      key: 'matchDetail',
      render: (_, record) => {
        const breakdown = record.match_breakdown || record.matchBreakdown;
        if (!breakdown) return '-';
        return (
          <Space size={4} wrap>
            {breakdown.skillMatch != null && <Tag color="blue">技能 {breakdown.skillMatch}%</Tag>}
            {breakdown.experienceMatch != null && <Tag color="green">经验 {breakdown.experienceMatch}%</Tag>}
            {breakdown.salaryMatch != null && <Tag color="gold">薪资 {breakdown.salaryMatch}%</Tag>}
            {breakdown.intentionScore != null && <Tag color="purple">意向 {breakdown.intentionScore}%</Tag>}
          </Space>
        );
      },
    },
    {
      title: '匹配时间',
      dataIndex: 'matchTime',
      key: 'matchTime',
      render: (time, record) => {
        const t = time || record.match_time || record.created_at;
        return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-';
      },
    },
  ];

  const applicationColumns = [
    {
      title: '岗位名称',
      dataIndex: 'jobTitle',
      key: 'jobTitle',
      render: (text, record) => record.job_title || record.jobTitle || text,
    },
    {
      title: '投递时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      render: (time, record) => {
        const t = time || record.applied_at || record.created_at;
        return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-';
      },
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
    {
      title: '匹配分',
      key: 'matchScore',
      render: (_, record) => {
        const score = record.match_score || record.matchScore;
        if (score == null) return '-';
        return (
          <Progress
            percent={score}
            size="small"
            status={score >= 80 ? 'success' : score >= 60 ? 'normal' : 'exception'}
          />
        );
      },
    },
  ];

  const matchRecords = applicationList.filter(
    (app) => app.match_score != null || app.matchScore != null
  );

  const salaryRange = () => {
    const min = candidate.expected_salary_min;
    const max = candidate.expected_salary_max;
    if (min && max) return `${min}-${max}K`;
    if (min) return `${min}K起`;
    if (max) return `${max}K以内`;
    return null;
  };

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
              onClick={() => {
                setMatchResult(null);
                setMatchModalVisible(true);
              }}
            >
              AI匹配岗位
            </Button>
            <Button
              icon={<VideoCameraOutlined />}
              onClick={() => setInterviewModalVisible(true)}
            >
              发起面试
            </Button>
            <Button
              icon={<SendOutlined />}
              onClick={() => setOfferModalVisible(true)}
            >
              发送Offer
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={8} lg={6}>
            <Card bordered={false} style={{ background: '#fafafa', borderRadius: 12 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar size={100} src={candidate.avatar}>
                  {candidate.name?.charAt(0)}
                </Avatar>
                <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                  {candidate.name}
                </Title>
                <Space wrap>
                  {candidate.highest_education && <Tag color="blue">{candidate.highest_education}</Tag>}
                  {candidate.work_years != null && <Tag color="green">{candidate.work_years}年经验</Tag>}
                  {salaryRange() && <Tag color="gold">{salaryRange()}</Tag>}
                </Space>
              </div>

              <Descriptions column={1} size="small" bordered={false}>
                <Descriptions.Item label={<><PhoneOutlined /> 性别</>}>
                  {candidate.gender || '未知'}
                </Descriptions.Item>
                <Descriptions.Item label={<><TeamOutlined /> 年龄</>}>
                  {candidate.age || '未知'}岁
                </Descriptions.Item>
                <Descriptions.Item label={<><PhoneOutlined /> 手机号</>}>
                  {candidate.phone}
                </Descriptions.Item>
                <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
                  {candidate.email}
                </Descriptions.Item>
                <Descriptions.Item label={<><EnvironmentOutlined /> 所在城市</>}>
                  {candidate.city}
                </Descriptions.Item>
                <Descriptions.Item label={<><EnvironmentOutlined /> 期望城市</>}>
                  {candidate.expected_city || '未设置'}
                </Descriptions.Item>
                <Descriptions.Item label={<><TeamOutlined /> 工作年限</>}>
                  {candidate.work_years != null ? `${candidate.work_years}年` : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label={<><BookOutlined /> 学历</>}>
                  {candidate.highest_education || '未知'}
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  意向度预测
                </Text>
                <Progress
                  percent={candidate.intention_score || candidate.intentionScore || 0}
                  status={getIntentionColor(candidate.intention_score || candidate.intentionScore || 0)}
                  strokeWidth={16}
                  format={(percent) => `${percent}%`}
                />
                <div style={{ marginTop: 8, textAlign: 'center', color: '#999', fontSize: 12 }}>
                  基于AI算法预测的求职意向度
                </div>
              </div>

              <Divider />

              <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                  技能标签
                </Text>
                <Space wrap>
                  {(candidate.skill_tags || '').split(',').filter(Boolean).map((skill, index) => (
                    <Tag key={index} color="blue">{skill.trim()}</Tag>
                  ))}
                </Space>
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
                      dataSource={candidate.workExperience || candidate.work_experience || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>教育经历</Title>
                    <Table
                      columns={educationColumns}
                      dataSource={candidate.educationExperience || candidate.education_experience || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Title level={5} style={{ marginBottom: 16 }}>项目经历</Title>
                    <Table
                      columns={projectColumns}
                      dataSource={candidate.projectExperience || candidate.project_experience || []}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
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
                    dataSource={matchRecords}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                </TabPane>

                <TabPane tab="投递记录" key="applications">
                  <Table
                    columns={applicationColumns}
                    dataSource={applicationList}
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

            {matchResult && (
              <Card
                title="AI匹配结果"
                style={{ marginTop: 16 }}
                extra={<Button size="small" onClick={() => setMatchResult(null)}>关闭</Button>}
              >
                <Row gutter={16}>
                  <Col span={6}>
                    <Card bordered={false} style={{ textAlign: 'center', background: '#f6ffed' }}>
                      <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">技能匹配</Text>
                      </div>
                      <Title level={3} style={{ color: '#52c41a', margin: '8px 0 0' }}>
                        {matchResult.skillMatch ?? matchResult.skill_match ?? '-'}%
                      </Title>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card bordered={false} style={{ textAlign: 'center', background: '#e6f7ff' }}>
                      <TrophyOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">经验匹配</Text>
                      </div>
                      <Title level={3} style={{ color: '#1890ff', margin: '8px 0 0' }}>
                        {matchResult.experienceMatch ?? matchResult.experience_match ?? '-'}%
                      </Title>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card bordered={false} style={{ textAlign: 'center', background: '#fff7e6' }}>
                      <DollarOutlined style={{ fontSize: 32, color: '#fa8c16' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">薪资匹配</Text>
                      </div>
                      <Title level={3} style={{ color: '#fa8c16', margin: '8px 0 0' }}>
                        {matchResult.salaryMatch ?? matchResult.salary_match ?? '-'}%
                      </Title>
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card bordered={false} style={{ textAlign: 'center', background: '#f9f0ff' }}>
                      <HeartOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                      <div style={{ marginTop: 8 }}>
                        <Text type="secondary">意向评分</Text>
                      </div>
                      <Title level={3} style={{ color: '#722ed1', margin: '8px 0 0' }}>
                        {matchResult.intentionScore ?? matchResult.intention_score ?? '-'}%
                      </Title>
                    </Card>
                  </Col>
                </Row>
                {(matchResult.matchScore ?? matchResult.match_score) != null && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Text strong>综合匹配度：</Text>
                    <Progress
                      type="circle"
                      percent={matchResult.matchScore ?? matchResult.match_score}
                      size={80}
                      status={(matchResult.matchScore ?? matchResult.match_score) >= 80 ? 'success' : 'normal'}
                    />
                  </div>
                )}
              </Card>
            )}
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

      <Modal
        title="发起面试"
        open={interviewModalVisible}
        onCancel={() => {
          setInterviewModalVisible(false);
          interviewForm.resetFields();
        }}
        confirmLoading={interviewLoading}
        onOk={handleInterviewSubmit}
        destroyOnClose
        width={560}
      >
        <Form form={interviewForm} layout="vertical" preserve={false}>
          <Form.Item
            name="job_id"
            label="选择岗位"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select placeholder="请选择岗位" showSearch optionFilterProp="children">
              {jobOptions.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="schedule_date" label="面试日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="schedule_time" label="面试时间">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="interview_type"
            label="面试方式"
            rules={[{ required: true, message: '请选择面试方式' }]}
          >
            <Select placeholder="请选择面试方式">
              <Option value="video">视频面试</Option>
              <Option value="phone">电话面试</Option>
              <Option value="onsite">现场面试</Option>
            </Select>
          </Form.Item>
          <Form.Item name="duration" label="面试时长（分钟）">
            <InputNumber min={15} max={480} style={{ width: '100%' }} placeholder="请输入面试时长" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="interviewer_name" label="面试官姓名">
                <Input placeholder="请输入面试官姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="interviewer_phone" label="面试官电话">
                <Input placeholder="请输入面试官电话" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="发送Offer"
        open={offerModalVisible}
        onCancel={() => {
          setOfferModalVisible(false);
          offerForm.resetFields();
        }}
        confirmLoading={offerLoading}
        onOk={handleOfferSubmit}
        destroyOnClose
        width={560}
      >
        <Form form={offerForm} layout="vertical" preserve={false}>
          <Form.Item
            name="job_id"
            label="选择岗位"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select placeholder="请选择岗位" showSearch optionFilterProp="children">
              {jobOptions.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="salary_min" label="薪资下限（K/月）" rules={[{ required: true, message: '请输入薪资下限' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="薪资下限" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="salary_max" label="薪资上限（K/月）" rules={[{ required: true, message: '请输入薪资上限' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="薪资上限" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="entry_date" label="入职日期" rules={[{ required: true, message: '请选择入职日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="probation_salary" label="试用期薪资（K/月）">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="试用期薪资" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="probation_period" label="试用期（月）">
                <InputNumber min={0} max={12} style={{ width: '100%' }} placeholder="试用期月数" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="work_place" label="工作地点">
            <Input placeholder="请输入工作地点" />
          </Form.Item>
          <Form.Item name="benefits" label="福利待遇">
            <Input placeholder="请输入福利待遇" />
          </Form.Item>
          <Form.Item name="other_terms" label="Offer内容">
            <TextArea rows={4} placeholder="请输入Offer详细内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default CandidateDetail;
