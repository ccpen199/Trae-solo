import React, { useEffect, useState } from 'react';
import { Card, Button, Statistic, Row, Col, Descriptions, Tag, Spin, message, Typography, Divider } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi } from '@/api';
import { UserExam, UserExamStatus, QuestionType } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface ExamResultData {
  userExam: UserExam & {
    exam?: {
      id: string;
      name: string;
      totalScore: number;
      passScore: number;
    };
  };
  gradingDetails: {
    userExam: UserExam;
    details: Array<{
      question: {
        id: string;
        title: string;
        type: QuestionType;
        difficulty: string;
        score: number;
      };
      userAnswer: {
        id: string;
        answerContent?: string;
        answerOptions?: string[];
        score?: number;
        maxScore: number;
        isCorrect?: boolean;
        status: string;
      };
      gradingReason?: string;
    }>;
    statistics: {
      totalQuestions: number;
      autoGraded: number;
      pendingManual: number;
      correctCount: number;
      wrongCount: number;
      objectiveScore: number;
      maxObjectiveScore: number;
    };
  };
}

const ExamResultPage: React.FC = () => {
  const { userExamId } = useParams<{ userExamId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExamResultData | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!userExamId) {
        message.error('考试记录ID无效');
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const result = await examApi.getUserExam(userExamId);
        setData(result as ExamResultData);
      } catch (error) {
        console.error('Failed to fetch exam result:', error);
        message.error('获取考试结果失败');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [userExamId, navigate]);

  const getStatusBadge = (status: UserExamStatus, isPassed?: boolean) => {
    if (status === UserExamStatus.GRADED) {
      return isPassed ? (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          已通过
        </Tag>
      ) : (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          未通过
        </Tag>
      );
    }
    if (status === UserExamStatus.SUBMITTED) {
      return (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          待阅卷
        </Tag>
      );
    }
    if (status === UserExamStatus.FORCE_SUBMITTED) {
      return (
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          强制提交
        </Tag>
      );
    }
    return <Tag>{status}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const userExam = data?.userExam;
  const gradingDetails = data?.gradingDetails;
  const exam = userExam?.exam;

  const isGraded = userExam?.status === UserExamStatus.GRADED;
  const isPending = userExam?.status === UserExamStatus.SUBMITTED;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2}>考试结果</Title>
        <Text type="secondary">{exam?.name}</Text>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="考试状态"
              valueRender={() => getStatusBadge(userExam?.status || UserExamStatus.NOT_STARTED, userExam?.isPassed)}
            />
          </Col>
          {isGraded && (
            <>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="得分"
                  value={userExam?.totalScore}
                  suffix={`/ ${exam?.totalScore}`}
                  valueStyle={{
                    color: userExam?.isPassed ? '#52c41a' : '#ff4d4f',
                    fontWeight: 'bold',
                  }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="及格线"
                  value={exam?.passScore}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic
                  title="用时"
                  value={userExam?.timeSpent ? Math.floor(userExam.timeSpent / 60) : 0}
                  suffix="分钟"
                />
              </Col>
            </>
          )}
          {isPending && (
            <Col xs={24} sm={12} lg={18}>
              <div style={{ textAlign: 'center', padding: 24, background: '#fff7e6', borderRadius: 8 }}>
                <ClockCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />
                <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                  等待阅卷
                </Title>
                <Text type="secondary">
                  您的试卷包含主观题，需要老师阅卷后才能查看最终成绩
                </Text>
              </div>
            </Col>
          )}
        </Row>

        <Divider />

        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="提交时间">
            {userExam?.submittedAt ? dayjs(userExam.submittedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="第几次考试">
            第 {userExam?.attemptNumber || 1} 次
          </Descriptions.Item>
          <Descriptions.Item label="是否迟到">
            {userExam?.isLate ? '是' : '否'}
          </Descriptions.Item>
          <Descriptions.Item label="异常行为">
            {userExam?.hasAnomaly ? (
              <Tag color="red">有异常记录</Tag>
            ) : (
              <Tag color="green">无异常</Tag>
            )}
          </Descriptions.Item>
          {userExam?.screenSwitchCount !== undefined && userExam.screenSwitchCount > 0 && (
            <Descriptions.Item label="切屏次数">
              <Tag color="orange">{userExam.screenSwitchCount} 次</Tag>
            </Descriptions.Item>
          )}
          {userExam?.warningCount !== undefined && userExam.warningCount > 0 && (
            <Descriptions.Item label="警告次数">
              <Tag color="red">{userExam.warningCount} 次</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {gradingDetails && (
        <Card title="答题详情">
          {gradingDetails.details.map((detail, index) => {
            const { question, userAnswer, gradingReason } = detail;
            const isCorrect = userAnswer.isCorrect;
            const score = userAnswer.score;
            const maxScore = userAnswer.maxScore;

            return (
              <div
                key={question.id}
                style={{
                  padding: 16,
                  marginBottom: 16,
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Space>
                    <Tag color="blue">
                      第 {index + 1} 题
                    </Tag>
                    <Tag>{getQuestionTypeText(question.type)}</Tag>
                    <Tag color="orange">{maxScore} 分</Tag>
                    {isGraded && (
                      <>
                        {isCorrect === true ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            正确
                          </Tag>
                        ) : isCorrect === false ? (
                          <Tag color="red" icon={<CloseCircleOutlined />}>
                            错误
                          </Tag>
                        ) : null}
                      </>
                    )}
                  </Space>
                  {isGraded && (
                    <Text strong style={{ fontSize: 18 }}>
                      得分：<span style={{ color: score === maxScore ? '#52c41a' : '#1890ff' }}>{score}</span> / {maxScore}
                    </Text>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text strong>题目：</Text>
                  <div style={{ marginTop: 4, lineHeight: 1.8 }}>
                    {question.title}
                  </div>
                </div>

                {userAnswer.answerOptions && userAnswer.answerOptions.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>您的选择：</Text>
                    <div style={{ marginTop: 4 }}>
                      {userAnswer.answerOptions.join(', ')}
                    </div>
                  </div>
                )}

                {userAnswer.answerContent && (
                  <div style={{ marginBottom: 12 }}>
                    <Text strong>您的答案：</Text>
                    <div
                      style={{
                        marginTop: 4,
                        padding: 12,
                        background: '#fff',
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                      }}
                    >
                      {userAnswer.answerContent}
                    </div>
                  </div>
                )}

                {gradingReason && isGraded && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      background: '#e6f7ff',
                      borderRadius: 4,
                      border: '1px solid #91d5ff',
                    }}
                  >
                    <Text strong style={{ color: '#1890ff' }}>
                      评分说明：
                    </Text>
                    <div style={{ marginTop: 4 }}>{gradingReason}</div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Space size="large">
          <Button
            type="primary"
            icon={<HomeOutlined />}
            onClick={() => navigate('/dashboard')}
            size="large"
          >
            返回首页
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
            size="large"
          >
            刷新页面
          </Button>
        </Space>
      </div>
    </div>
  );
};

function getQuestionTypeText(type: QuestionType): string {
  const typeMap: Record<QuestionType, string> = {
    [QuestionType.SINGLE_CHOICE]: '单选题',
    [QuestionType.MULTIPLE_CHOICE]: '多选题',
    [QuestionType.TRUE_FALSE]: '判断题',
    [QuestionType.SHORT_ANSWER]: '简答题',
    [QuestionType.ESSAY]: '论述题',
    [QuestionType.MATERIAL]: '材料题',
  };
  return typeMap[type] || type;
}

export default ExamResultPage;
