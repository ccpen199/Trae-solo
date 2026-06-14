import { useState, useEffect } from 'react';
import {
  Select,
  Button,
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Typography,
  Space,
  List,
  Avatar,
  Modal,
  Form,
  DatePicker,
  Input,
  message,
  Empty,
  Spin,
} from 'antd';
import {
  TeamOutlined,
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jobs, interviews, resumes } from '../../api/endpoints';
import type { Job, JobMatch, Resume } from '../../types';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TalentRecommend = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [jobList, setJobList] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | undefined>();
  const [recommendations, setRecommendations] = useState<JobMatch[]>([]);
  const [resumeDetail, setResumeDetail] = useState<Resume | null>(null);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const [interviewForm] = Form.useForm();

  useEffect(() => {
    fetchJobList();
    const jobIdFromUrl = searchParams.get('jobId');
    if (jobIdFromUrl) {
      setSelectedJob(parseInt(jobIdFromUrl));
    }
  }, [searchParams]);

  const fetchJobList = async () => {
    try {
      const response = await jobs.list({ pageSize: 100, status: 'active' });
      setJobList(response.data.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleRecommend = async () => {
    if (!selectedJob) {
      message.warning('请先选择岗位');
      return;
    }

    setRecommending(true);
    try {
      const response = await jobs.recommend(selectedJob, 10);
      const mapped = response.data.map((item: any) => ({
        id: item.resumeId,
        jobId: item.jobId,
        resumeId: item.resumeId,
        similarityScore: item.overallScore,
        skillMatchScore: item.skillMatch,
        experienceMatchScore: item.experienceMatch,
        recommendedAt: new Date(),
        status: item.status,
        resume: item.resume,
      }));
      setRecommendations(mapped);
      message.success(`为您找到 ${mapped.length} 位匹配的候选人`);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      message.error('获取推荐失败，请重试');
    } finally {
      setRecommending(false);
    }
  };

  const handleViewResume = async (resumeId: number) => {
    setLoading(true);
    try {
      const resume = await resumes.getDetail(resumeId);
      setResumeDetail(resume);
      setResumeModalVisible(true);
    } catch (error) {
      console.error('Failed to fetch resume detail:', error);
      message.error('获取简历详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteInterview = (resumeId: number) => {
    setSelectedResume(resumeId);
    setInterviewModalVisible(true);
    interviewForm.resetFields();
  };

  const handleCreateInterview = async (values: any) => {
    if (!selectedJob || !selectedResume) return;

    try {
      await interviews.create({
        jobId: selectedJob,
        jobseekerId: selectedResume,
        companyId: 1,
        interviewTime: values.interviewTime.toDate(),
        location: values.location,
        interviewer: values.interviewer,
        status: 'pending',
        calendarSynced: false,
      });
      message.success('面试邀请已发送');
      setInterviewModalVisible(false);
    } catch (error) {
      console.error('Failed to create interview:', error);
      message.error('创建面试安排失败');
    }
  };

  const getMatchVennOption = (jobMatch: JobMatch) => {
    const skillScore = jobMatch.skillMatchScore || 0;
    const expScore = jobMatch.experienceMatchScore || 0;
    const overallScore = jobMatch.similarityScore || 0;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}%',
      },
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          splitNumber: 5,
          radius: '100%',
          center: ['50%', '75%'],
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, '#ff4d4f'],
                [0.6, '#faad14'],
                [0.8, '#1890ff'],
                [1, '#52c41a'],
              ],
            },
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '60%',
            width: 10,
            itemStyle: {
              color: 'auto',
            },
          },
          axisTick: {
            length: 8,
            lineStyle: {
              color: 'auto',
            },
          },
          splitLine: {
            length: 15,
            lineStyle: {
              color: 'auto',
            },
          },
          axisLabel: {
            color: '#666',
            fontSize: 12,
            distance: -40,
            formatter: '{value}',
          },
          title: {
            offsetCenter: [0, '-10%'],
            fontSize: 14,
            color: '#666',
          },
          detail: {
            fontSize: 28,
            offsetCenter: [0, '-35%'],
            valueAnimation: true,
            formatter: '{value}%',
            color: 'auto',
          },
          data: [
            {
              value: Math.round(overallScore * 100),
              name: '综合匹配度',
            },
          ],
        },
      ],
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#1890ff';
    if (score >= 0.4) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreTag = (score: number | undefined) => {
    if (!score) return <Tag>-</Tag>;
    const percentage = Math.round(score * 100);
    return (
      <Tag color={getScoreColor(score)}>
        {percentage}%
      </Tag>
    );
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: '24px' }}>
        <TeamOutlined style={{ marginRight: '8px' }} />
        人才推荐
      </Title>

      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Select
              placeholder="请选择要推荐的岗位"
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              value={selectedJob}
              onChange={(value) => setSelectedJob(value)}
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
            >
              {jobList.map((job) => (
                <Option key={job.id} value={job.id}>
                  {job.title} - {job.workLocation || '未设置地点'}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleRecommend}
              loading={recommending}
              block
            >
              推荐候选人
            </Button>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Text type="secondary">
              {recommendations.length > 0
                ? `共找到 ${recommendations.length} 位匹配候选人`
                : '选择岗位后点击推荐按钮获取候选人列表'}
            </Text>
          </Col>
        </Row>
      </Card>

      <Spin spinning={recommending}>
        {recommendations.length > 0 ? (
          <List
            dataSource={recommendations}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  marginBottom: '16px',
                  padding: '0',
                  border: 'none',
                }}
              >
                <Card hoverable>
                  <Row gutter={24} align="middle">
                    <Col span={4}>
                      <div style={{ textAlign: 'center' }}>
                        <Avatar
                          size={64}
                          icon={<UserOutlined />}
                          style={{ marginBottom: '8px' }}
                        />
                        <Title level={5} style={{ margin: '0 0 4px 0' }}>
                          {item.resume?.name}
                        </Title>
                        <Tag color={getScoreColor(item.similarityScore || 0)}>
                          <StarOutlined /> 综合匹配 {Math.round((item.similarityScore || 0) * 100)}%
                        </Tag>
                      </div>
                    </Col>

                    <Col span={10}>
                      <div style={{ height: '200px' }}>
                        <ReactECharts
                          option={getMatchVennOption(item)}
                          style={{ height: '100%', width: '100%' }}
                        />
                      </div>
                    </Col>

                    <Col span={6}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <Text type="secondary">技能匹配度：</Text>
                          {getScoreTag(item.skillMatchScore)}
                          <Progress
                            percent={Math.round((item.skillMatchScore || 0) * 100)}
                            showInfo={false}
                            size="small"
                            strokeColor={getScoreColor(item.skillMatchScore || 0)}
                          />
                        </div>
                        <div>
                          <Text type="secondary">经验匹配度：</Text>
                          {getScoreTag(item.experienceMatchScore)}
                          <Progress
                            percent={Math.round((item.experienceMatchScore || 0) * 100)}
                            showInfo={false}
                            size="small"
                            strokeColor={getScoreColor(item.experienceMatchScore || 0)}
                          />
                        </div>
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary">期望薪资：</Text>
                          <Text strong>
                            {item.resume?.expectedSalary
                              ? `${item.resume.expectedSalary}K`
                              : '面议'}
                          </Text>
                        </div>
                        <div>
                          <Text type="secondary">学历：</Text>
                          <Text strong>{item.resume?.education || '-'}</Text>
                        </div>
                      </Space>
                    </Col>

                    <Col span={4} style={{ textAlign: 'right' }}>
                      <Space direction="vertical" size="small">
                        <Button
                          icon={<EyeOutlined />}
                          onClick={() => handleViewResume(item.resumeId)}
                          block
                        >
                          查看简历
                        </Button>
                        <Button
                          type="primary"
                          icon={<CalendarOutlined />}
                          onClick={() => handleInviteInterview(item.resumeId)}
                          block
                        >
                          发起面试
                        </Button>
                      </Space>
                    </Col>
                  </Row>

                  <Card
                    type="inner"
                    title="推荐理由"
                    size="small"
                    style={{ marginTop: '16px' }}
                  >
                    <Space wrap>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>
                        该候选人具备 {item.resume?.education || '本科'} 学历，
                        期望职位为 {item.resume?.expectedPosition || '相关岗位'}，
                        与岗位要求高度匹配。
                      </Text>
                      {item.skillMatchScore && item.skillMatchScore >= 0.8 && (
                        <>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <Text type="success">技能匹配度高，掌握核心技能。</Text>
                        </>
                      )}
                      {item.experienceMatchScore && item.experienceMatchScore >= 0.8 && (
                        <>
                          <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          <Text type="success">工作经验丰富，能够快速上手。</Text>
                        </>
                      )}
                    </Space>
                  </Card>
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={
              <Space direction="vertical">
                <Text>请选择岗位并点击推荐按钮</Text>
                <Text type="secondary">系统将根据岗位要求智能匹配最合适的候选人</Text>
              </Space>
            }
          />
        )}
      </Spin>

      <Modal
        title={
          <Space>
            <UserOutlined />
            <span>简历详情</span>
          </Space>
        }
        open={resumeModalVisible}
        onCancel={() => setResumeModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResumeModalVisible(false)}>
            关闭
          </Button>,
          selectedJob && (
            <Button
              key="invite"
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => {
                setResumeModalVisible(false);
                handleInviteInterview(resumeDetail?.id || 0);
              }}
            >
              发起面试邀请
            </Button>
          ),
        ]}
        width={700}
      >
        {resumeDetail ? (
          <Spin spinning={loading}>
            <Card>
              <Row gutter={24}>
                <Col span={8} style={{ textAlign: 'center' }}>
                  <Avatar size={80} icon={<UserOutlined />} />
                  <Title level={4} style={{ marginTop: '12px', marginBottom: '4px' }}>
                    {resumeDetail.name}
                  </Title>
                  <Text type="secondary">{resumeDetail.expectedPosition || '未填写'}</Text>
                </Col>
                <Col span={16}>
                  <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">联系电话：</Text>
                        <Text strong>{resumeDetail.phone}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">邮箱：</Text>
                        <Text strong>{resumeDetail.email}</Text>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Text type="secondary">学历：</Text>
                        <Text strong>{resumeDetail.education || '-'}</Text>
                      </Col>
                      <Col span={12}>
                        <Text type="secondary">期望薪资：</Text>
                        <Text strong>
                          {resumeDetail.expectedSalary
                            ? `${resumeDetail.expectedSalary}K`
                            : '面议'}
                        </Text>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={24}>
                        <Text type="secondary">年龄：</Text>
                        <Text strong>{resumeDetail.age || '-'}</Text>
                        <Text type="secondary" style={{ marginLeft: '24px' }}>
                          性别：
                        </Text>
                        <Text strong>{resumeDetail.gender || '-'}</Text>
                      </Col>
                    </Row>
                  </Space>
                </Col>
              </Row>

              {resumeDetail.requiredSkills && resumeDetail.requiredSkills.length > 0 && (
                <Card title="技能标签" size="small" style={{ marginTop: '16px' }}>
                  <Space wrap>
                    {resumeDetail.requiredSkills.map((skill, idx) => (
                      <Tag key={idx} color="blue">
                        {skill}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              )}

              {resumeDetail.workExperience && resumeDetail.workExperience.length > 0 && (
                <Card title="工作经历" size="small" style={{ marginTop: '16px' }}>
                  <List
                    dataSource={resumeDetail.workExperience}
                    renderItem={(exp, idx) => (
                      <List.Item key={idx}>
                        <List.Item.Meta
                          title={
                            <Space>
                              <Text strong>{exp.position}</Text>
                              <Text type="secondary">@</Text>
                              <Text>{exp.company}</Text>
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={0}>
                              <Text type="secondary">
                                {exp.startDate} - {exp.endDate || '至今'}
                              </Text>
                              <Text>{exp.description}</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              )}

              {resumeDetail.certifications && resumeDetail.certifications.length > 0 && (
                <Card title="证书资质" size="small" style={{ marginTop: '16px' }}>
                  <Space wrap>
                    {resumeDetail.certifications.map((cert, idx) => (
                      <Tag key={idx} color="green">
                        {cert.name}
                      </Tag>
                    ))}
                  </Space>
                </Card>
              )}
            </Card>
          </Spin>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>发起面试邀请</span>
          </Space>
        }
        open={interviewModalVisible}
        onCancel={() => setInterviewModalVisible(false)}
        footer={null}
      >
        <Form
          form={interviewForm}
          layout="vertical"
          onFinish={handleCreateInterview}
        >
          <Form.Item
            name="interviewTime"
            label="面试时间"
            rules={[{ required: true, message: '请选择面试时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              format="YYYY-MM-DD HH:mm"
              placeholder="请选择面试时间"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item
            name="location"
            label="面试地点"
            rules={[{ required: true, message: '请输入面试地点' }]}
          >
            <Input placeholder="请输入面试地点" />
          </Form.Item>
          <Form.Item
            name="interviewer"
            label="面试官"
            rules={[{ required: true, message: '请输入面试官姓名' }]}
          >
            <Input placeholder="请输入面试官姓名" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setInterviewModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                发送邀请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TalentRecommend;
