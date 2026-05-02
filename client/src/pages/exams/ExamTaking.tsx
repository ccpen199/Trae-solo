import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Card,
  Button,
  Radio,
  Checkbox,
  Input,
  Row,
  Col,
  Steps,
  Modal,
  Typography,
  Badge,
  Tag,
  Space,
  message,
  Spin,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useExamStore, useAuthStore } from '@/store';
import { examApi } from '@/api';
import { QuestionType, ExamQuestion, AnomalyType } from '@/types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Step } = Steps;

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ExamTakingPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const {
    questions,
    currentQuestionIndex,
    timeRemaining,
    isStarted,
    isSubmitting,
    warningCount,
    userExamId,
    getAnswer,
    isQuestionAnswered,
    getProgress,
    startExam,
    setCurrentQuestion,
    nextQuestion,
    prevQuestion,
    toggleOption,
    setAnswerContent,
    saveAnswer,
    setTimeRemaining,
    decrementTime,
    resetExam,
  } = useExamStore();

  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityRef = useRef<'visible' | 'hidden'>('visible');
  const lastSaveRef = useRef<Date>(new Date());

  useEffect(() => {
    const initExam = async () => {
      if (!examId) {
        message.error('考试ID无效');
        navigate('/dashboard');
        return;
      }

      try {
        setLoading(true);
        const result = await examApi.startExam(examId);
        
        startExam({
          userExamId: result.userExam.id,
          examId: result.exam.id,
          examName: result.exam.name,
          duration: result.exam.duration,
          endTime: new Date(result.userExam.endTime),
          questions: result.questions,
        });
      } catch (error) {
        console.error('Failed to start exam:', error);
        message.error('开始考试失败');
        navigate('/dashboard');
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    initExam();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      resetExam();
    };
  }, [examId, navigate, startExam, resetExam]);

  useEffect(() => {
    if (!isStarted || initializing) return;

    timerRef.current = setInterval(() => {
      decrementTime();
      
      if (timeRemaining <= 0) {
        handleAutoSubmit();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isStarted, initializing, timeRemaining, decrementTime]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!isStarted || !userExamId) return;

      const currentVisibility = document.hidden ? 'hidden' : 'visible';
      
      if (currentVisibility === 'hidden' && visibilityRef.current === 'visible') {
        try {
          await examApi.reportAnomaly(userExamId, {
            type: AnomalyType.SCREEN_SWITCH,
            details: {
              switchCount: warningCount + 1,
              maxAllowed: 3,
              durationAway: 0,
            },
          });
          message.warning('检测到切屏行为，请专注于考试');
        } catch (error) {
          console.error('Failed to report screen switch:', error);
        }
      }
      
      visibilityRef.current = currentVisibility;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isStarted, userExamId, warningCount, examApi]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isStarted && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '您的考试进度可能会丢失，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isStarted, isSubmitting]);

  const handleAutoSubmit = async () => {
    if (!userExamId) return;
    
    message.info('考试时间已到，自动提交中...');
    
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      setShowConfirm(false);
      
      const result = await examApi.submitExam(userExamId);
      
      message.success('考试提交成功');
      navigate(`/exams/result/${userExamId}`);
    } catch (error) {
      console.error('Failed to submit exam:', error);
      message.error('提交失败，请重试');
    }
  };

  const handleSubmit = async () => {
    if (!userExamId) return;
    
    try {
      setShowConfirm(false);
      setIsSubmitting(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      const result = await examApi.submitExam(userExamId);
      
      message.success('考试提交成功');
      navigate(`/exams/result/${userExamId}`);
    } catch (error) {
      console.error('Failed to submit exam:', error);
      message.error('提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoSaveAnswer = async (questionId: string) => {
    if (!userExamId) return;
    
    const now = new Date();
    if (now.getTime() - lastSaveRef.current.getTime() < 5000) {
      return;
    }
    
    lastSaveRef.current = now;
    
    const answer = getAnswer(questionId);
    if (!answer) return;
    
    try {
      await examApi.saveAnswer(userExamId, {
        questionId,
        answerContent: answer.answerContent,
        answerOptions: answer.answerOptions,
      });
    } catch (error) {
      console.error('Failed to auto-save answer:', error);
    }
  };

  const handleOptionChange = (optionId: string) => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const isMultiple = question.type === QuestionType.MULTIPLE_CHOICE;
    toggleOption(question.id, optionId, isMultiple);
    autoSaveAnswer(question.id);
  };

  const handleContentChange = (value: string) => {
    const question = questions[currentQuestionIndex];
    if (!question) return;

    setAnswerContent(question.id, value);
    autoSaveAnswer(question.id);
  };

  const renderQuestionContent = () => {
    const question = questions[currentQuestionIndex];
    if (!question) return null;

    const answer = getAnswer(question.id);

    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 500,
              lineHeight: 1.8,
              marginBottom: 16,
            }}
            dangerouslySetInnerHTML={{ __html: question.content }}
          />

          {question.options && question.options.length > 0 && (
            <div style={{ marginTop: 16 }}>
              {question.type === QuestionType.SINGLE_CHOICE ? (
                <Radio.Group
                  value={answer?.answerOptions?.[0]}
                  onChange={(e) => handleOptionChange(e.target.value)}
                  style={{ display: 'block' }}
                >
                  {question.options.map((option) => (
                    <Radio
                      key={option.id}
                      value={option.id}
                      style={{
                        display: 'block',
                        height: 40,
                        lineHeight: '40px',
                        fontSize: 16,
                        marginInlineStart: 0,
                      }}
                    >
                      <span style={{ marginLeft: 8 }}>
                        <Text strong>{option.label}.</Text> {option.content}
                      </span>
                    </Radio>
                  ))}
                </Radio.Group>
              ) : (
                <Checkbox.Group
                  value={answer?.answerOptions || []}
                  onChange={(checkedValues) => {
                    const question = questions[currentQuestionIndex];
                    if (!question) return;
                    
                    const newOptions = checkedValues as string[];
                    saveAnswer(question.id, { answerOptions: newOptions });
                    autoSaveAnswer(question.id);
                  }}
                  style={{ display: 'block' }}
                >
                  {question.options.map((option) => (
                    <Checkbox
                      key={option.id}
                      value={option.id}
                      style={{
                        display: 'block',
                        height: 40,
                        lineHeight: '40px',
                        fontSize: 16,
                        marginInlineStart: 0,
                      }}
                    >
                      <span style={{ marginLeft: 8 }}>
                        <Text strong>{option.label}.</Text> {option.content}
                      </span>
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              )}
            </div>
          )}

          {question.type === QuestionType.TRUE_FALSE && (
            <Radio.Group
              value={answer?.answerContent}
              onChange={(e) => handleContentChange(e.target.value)}
              style={{ display: 'block' }}
            >
              <Radio value="true" style={{ fontSize: 16, marginInlineStart: 0, marginRight: 32 }}>
                对
              </Radio>
              <Radio value="false" style={{ fontSize: 16, marginInlineStart: 0 }}>
                错
              </Radio>
            </Radio.Group>
          )}

          {(question.type === QuestionType.SHORT_ANSWER ||
            question.type === QuestionType.ESSAY ||
            question.type === QuestionType.MATERIAL) && (
            <div style={{ marginTop: 16 }}>
              <TextArea
                value={answer?.answerContent || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="请在此输入您的答案..."
                rows={question.type === QuestionType.ESSAY ? 10 : 5}
                style={{ fontSize: 16 }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const progress = getProgress();

  if (loading || initializing) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" tip="正在加载考试..." />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: '#fff',
          padding: '16px 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            {useExamStore.getState().examName}
          </Title>
          {warningCount > 0 && (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              警告 {warningCount} 次
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Statistic
            title="剩余时间"
            value={formatTime(timeRemaining)}
            valueStyle={{
              color: timeRemaining < 300 ? '#ff4d4f' : '#1890ff',
              fontWeight: 'bold',
              fontSize: 24,
            }}
            prefix={<ClockCircleOutlined />}
          />
          <Statistic
            title="答题进度"
            value={`${progress.answered}/${progress.total}`}
            valueStyle={{ fontWeight: 'bold' }}
          />
          <Button
            type="primary"
            danger
            icon={<CheckCircleOutlined />}
            onClick={() => setShowConfirm(true)}
            loading={isSubmitting}
          >
            交卷
          </Button>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={18}>
            <Card>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <Tag color="blue">
                  第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题
                </Tag>
                <Space>
                  {currentQuestion && (
                    <>
                      <Tag>{getQuestionTypeText(currentQuestion.type)}</Tag>
                      <Tag color="orange">{currentQuestion.score} 分</Tag>
                      {isQuestionAnswered(currentQuestion.id) && (
                        <Tag color="green">已作答</Tag>
                      )}
                    </>
                  )}
                </Space>
              </div>

              {renderQuestionContent()}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 32,
                  paddingTop: 24,
                  borderTop: '1px solid #f0f0f0',
                }}
              >
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={prevQuestion}
                  disabled={isFirstQuestion}
                  size="large"
                >
                  上一题
                </Button>

                <Space>
                  <Button
                    icon={<SaveOutlined />}
                    onClick={() => {
                      if (currentQuestion) {
                        autoSaveAnswer(currentQuestion.id);
                        message.success('答案已保存');
                      }
                    }}
                    size="large"
                  >
                    保存
                  </Button>
                </Space>

                {isLastQuestion ? (
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => setShowConfirm(true)}
                    size="large"
                  >
                    完成作答
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={nextQuestion}
                    size="large"
                  >
                    下一题
                  </Button>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={6}>
            <Card title="答题卡" style={{ position: 'sticky', top: 100 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {questions.map((question, index) => {
                  const answered = isQuestionAnswered(question.id);
                  const isCurrent = index === currentQuestionIndex;

                  return (
                    <Button
                      key={question.id}
                      onClick={() => setCurrentQuestion(index)}
                      style={{
                        width: 40,
                        height: 40,
                        padding: 0,
                        borderRadius: 8,
                        background: answered ? '#52c41a' : isCurrent ? '#1890ff' : '#fff',
                        borderColor: answered ? '#52c41a' : isCurrent ? '#1890ff' : '#d9d9d9',
                        color: answered || isCurrent ? '#fff' : '#000',
                        fontWeight: isCurrent ? 'bold' : 'normal',
                      }}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: '#52c41a',
                      borderRadius: 4,
                    }}
                  />
                  <Text>已作答</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  />
                  <Text>未作答</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      background: '#1890ff',
                      borderRadius: 4,
                    }}
                  />
                  <Text>当前题</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            确认交卷
          </Space>
        }
        open={showConfirm}
        onOk={handleSubmit}
        onCancel={() => setShowConfirm(false)}
        confirmLoading={isSubmitting}
        okText="确认交卷"
        cancelText="继续答题"
        okButtonProps={{ danger: true }}
      >
        <div style={{ padding: '16px 0' }}>
          <Text strong>您确定要提交试卷吗？</Text>
          <div style={{ marginTop: 16 }}>
            <Text>
              答题进度：{progress.answered} / {progress.total} 题
            </Text>
          </div>
          {progress.answered < progress.total && (
            <div style={{ marginTop: 8, color: '#faad14' }}>
              <Text type="warning">
                您还有 {progress.total - progress.answered} 题未作答，确定要提交吗？
              </Text>
            </div>
          )}
          <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              提交后将无法继续作答，请确认您的答案已全部填写完毕。
            </Text>
          </div>
        </div>
      </Modal>
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

export default ExamTakingPage;
