import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Typography, Spin, message } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  EditOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { statisticsApi, examApi } from '@/api';
import { useRoleStore } from '@/store';
import { Exam, ExamStatus, UserExamStatus } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DashboardData {
  overview: {
    totalUsers: number;
    totalQuestions: number;
    totalExams: number;
    totalExamPapers: number;
  };
  roleDistribution: Record<string, number>;
  userExamStats: {
    total: number;
    inProgress: number;
    submitted: number;
    graded: number;
    hasAnomaly: number;
  };
  activeExams: Exam[];
  recentExams: Exam[];
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, isQuestionSetter, isGrader, isExaminee } = useRoleStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (isAdmin() || isQuestionSetter()) {
          const result = await statisticsApi.getDashboardStatistics();
          setData(result as DashboardData);
        }

        if (isExaminee()) {
          const examsResult = await examApi.getExams({ pageSize: 10 });
          const now = dayjs();
          const upcoming = examsResult.data.filter(
            (exam) =>
              exam.status === ExamStatus.PUBLISHED ||
              exam.status === ExamStatus.ONGOING
          );
          setUpcomingExams(upcoming);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, isQuestionSetter, isExaminee]);

  const getStatusTag = (status: ExamStatus) => {
    const statusMap: Record<ExamStatus, { color: string; text: string }> = {
      [ExamStatus.DRAFT]: { color: 'default', text: '草稿' },
      [ExamStatus.PUBLISHED]: { color: 'blue', text: '已发布' },
      [ExamStatus.ONGOING]: { color: 'green', text: '进行中' },
      [ExamStatus.ENDED]: { color: 'default', text: '已结束' },
      [ExamStatus.ARCHIVED]: { color: 'default', text: '已归档' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        工作台
      </Title>

      {isExaminee() ? (
        <div>
          <Card style={{ marginBottom: 24 }}>
            <Title level={4} style={{ marginBottom: 16 }}>
              我的考试
            </Title>
            {upcomingExams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">暂无可用考试</Text>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {upcomingExams.map((exam) => (
                  <Col xs={24} sm={12} lg={8} key={exam.id}>
                    <Card
                      hoverable
                      onClick={() => navigate(`/exams/take/${exam.id}`)}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          {getStatusTag(exam.status)}
                          {exam.status === ExamStatus.ONGOING && (
                            <Tag color="green">可参加</Tag>
                          )}
                        </Space>
                        <Text strong style={{ fontSize: 16, display: 'block' }}>
                          {exam.name}
                        </Text>
                        <Text type="secondary">
                          开始时间：{dayjs(exam.startTime).format('YYYY-MM-DD HH:mm')}
                        </Text>
                        <Text type="secondary">
                          时长：{exam.duration} 分钟 | 满分：{exam.totalScore} 分
                        </Text>
                        <Button type="primary" block icon={<ArrowRightOutlined />}>
                          进入考试
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="用户总数"
                  value={data?.overview?.totalUsers || 0}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="题目总数"
                  value={data?.overview?.totalQuestions || 0}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="试卷总数"
                  value={data?.overview?.totalExamPapers || 0}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="考试总数"
                  value={data?.overview?.totalExams || 0}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={12}>
              <Card title="考试统计">
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <Statistic
                      title="考试进行中"
                      value={data?.userExamStats?.inProgress || 0}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="待阅卷"
                      value={data?.userExamStats?.submitted || 0}
                      valueStyle={{ color: '#faad14' }}
                      prefix={<EditOutlined />}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="已阅卷"
                      value={data?.userExamStats?.graded || 0}
                      valueStyle={{ color: '#52c41a' }}
                      prefix={<CheckCircleOutlined />}
                    />
                  </Col>
                  <Col xs={12}>
                    <Statistic
                      title="异常记录"
                      value={data?.userExamStats?.hasAnomaly || 0}
                      valueStyle={{ color: '#ff4d4f' }}
                      prefix={<ExclamationCircleOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={12}>
              <Card title="快捷操作">
                <Row gutter={[16, 16]}>
                  {isQuestionSetter() && (
                    <>
                      <Col xs={12}>
                        <Button
                          type="primary"
                          block
                          icon={<FileTextOutlined />}
                          onClick={() => navigate('/questions/create')}
                        >
                          创建题目
                        </Button>
                      </Col>
                      <Col xs={12}>
                        <Button
                          block
                          icon={<BookOutlined />}
                          onClick={() => navigate('/exam-papers/create')}
                        >
                          组卷
                        </Button>
                      </Col>
                    </>
                  )}
                  {isAdmin() && (
                    <>
                      <Col xs={12}>
                        <Button
                          block
                          icon={<SafetyCertificateOutlined />}
                          onClick={() => navigate('/exams/create')}
                        >
                          创建考试
                        </Button>
                      </Col>
                      <Col xs={12}>
                        <Button
                          block
                          icon={<BarChartOutlined />}
                          onClick={() => navigate('/statistics')}
                        >
                          数据统计
                        </Button>
                      </Col>
                    </>
                  )}
                  {isGrader() && (
                    <Col xs={12}>
                      <Button
                        type="primary"
                        block
                        icon={<EditOutlined />}
                        onClick={() => navigate('/grading')}
                      >
                        阅卷任务
                      </Button>
                    </Col>
                  )}
                </Row>
              </Card>
            </Col>
          </Row>

          {(isAdmin() || isQuestionSetter()) && (
            <Card title="最近考试">
              <Table
                dataSource={data?.recentExams || []}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '考试名称',
                    dataIndex: 'name',
                    key: 'name',
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (status: ExamStatus) => getStatusTag(status),
                  },
                  {
                    title: '开始时间',
                    dataIndex: 'startTime',
                    key: 'startTime',
                    render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
                  },
                  {
                    title: '结束时间',
                    dataIndex: 'endTime',
                    key: 'endTime',
                    render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm'),
                  },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_: unknown, record: Exam) => (
                      <Space>
                        {isAdmin() && (
                          <Button
                            type="link"
                            onClick={() => navigate(`/statistics/exam/${record.id}`)}
                          >
                            查看统计
                          </Button>
                        )}
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
