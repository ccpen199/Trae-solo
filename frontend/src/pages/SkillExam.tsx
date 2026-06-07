import React, { useEffect, useState } from 'react';
import { Card, Radio, Button, Space, Spin, message, Progress, Result, Divider } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface ExamQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const SkillExam: React.FC = () => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const fetchQuestions = async () => {
    if (!tradeId) return;
    setLoading(true);
    try {
      const res = await api.skills.getExamQuestions(parseInt(tradeId));
      const questionList = Array.isArray(res.data) ? res.data : [res.data];
      setQuestions(questionList);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取考试题失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [tradeId]);

  const handleAnswerChange = (answer: number) => {
    setAnswers({ ...answers, [currentIndex]: answer });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!tradeId) return;
    const unanswered = questions.filter((_, idx) => answers[idx] === undefined).length;
    if (unanswered > 0) {
      message.warning(`还有 ${unanswered} 道题未作答`);
      return;
    }

    setSubmitting(true);
    try {
      const answerArray = questions.map((_, idx) => ({
        questionId: questions[idx].id,
        answer: answers[idx]
      }));

      const res = await api.skills.submitExam({
        tradeId: parseInt(tradeId),
        answers: answerArray
      });

      let correctCount = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) {
          correctCount++;
        }
      });
      const finalScore = Math.round((correctCount / questions.length) * 100);
      setScore(finalScore);
      setPassed(finalScore >= 60);
      setShowResult(true);
      message.success('考试提交成功');
    } catch (error: any) {
      message.error(error.response?.data?.error || '提交考试失败');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const currentQuestion = questions[currentIndex];

  if (showResult && score !== null) {
    return (
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/assessments')}
          style={{ marginBottom: '16px' }}
        >
          返回评定列表
        </Button>
        <Card>
          <Result
            status={passed ? 'success' : 'warning'}
            title={
              <div style={{ fontSize: '24px' }}>
                {passed ? '考试通过！' : '考试未通过'}
              </div>
            }
            subTitle={
              <div>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>
                  您的得分：<span style={{ fontSize: '32px', fontWeight: 'bold', color: passed ? '#52c41a' : '#faad14' }}>{score}</span> 分
                </p>
                <p style={{ color: '#8c8c8c' }}>
                  及格分数：60分 | 共 {questions.length} 道题 | 答对 {Math.round(score * questions.length / 100)} 道
                </p>
              </div>
            }
            extra={
              <Space>
                <Button type="primary" onClick={() => navigate('/assessments')}>
                  返回列表
                </Button>
                {!passed && (
                  <Button onClick={() => {
                    setShowResult(false);
                    setScore(null);
                    setAnswers({});
                    setCurrentIndex(0);
                  }}>
                    重新考试
                  </Button>
                )}
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/assessments')}
        style={{ marginBottom: '16px' }}
      >
        返回评定列表
      </Button>

      <Card title="技能理论考试">
        <Spin spinning={loading}>
          {questions.length > 0 && (
            <>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                    已答 {answeredCount} / {questions.length} 题
                  </span>
                  <span>
                    <ClockCircleOutlined style={{ color: '#faad14', marginRight: '4px' }} />
                    当前第 {currentIndex + 1} 题
                  </span>
                </div>
                <Progress
                  percent={Math.round((answeredCount / questions.length) * 100)}
                  size="small"
                />
              </div>

              <Divider />

              <div style={{ minHeight: '200px', padding: '16px 0' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>
                  {currentIndex + 1}. {currentQuestion?.question}
                </h3>
                <Radio.Group
                  value={answers[currentIndex]}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {currentQuestion?.options.map((option, idx) => (
                      <Radio key={idx} value={idx} style={{ marginBottom: '12px' }}>
                        {String.fromCharCode(65 + idx)}. {option}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>

              <Divider />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <Button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    上一题
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                  >
                    下一题
                  </Button>
                </Space>
                <Button
                  type="primary"
                  danger
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={answeredCount < questions.length}
                >
                  提交考试
                </Button>
              </div>

              <div style={{ marginTop: '24px' }}>
                <p style={{ color: '#8c8c8c', marginBottom: '8px' }}>答题卡：</p>
                <Space wrap>
                  {questions.map((_, idx) => (
                    <Button
                      key={idx}
                      size="small"
                      type={idx === currentIndex ? 'primary' : answers[idx] !== undefined ? 'default' : 'dashed'}
                      style={{
                        width: '36px',
                        height: '36px',
                        padding: 0,
                        borderColor: answers[idx] !== undefined ? '#52c41a' : undefined
                      }}
                      onClick={() => setCurrentIndex(idx)}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </Space>
              </div>
            </>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default SkillExam;
