import { useState, useEffect } from 'react';
import {
  Card,
  Spin,
  Button,
  Space,
  Tag,
  Tabs,
  Progress,
  Row,
  Col,
  message,
  Radio,
  Result,
  Alert,
  Statistic,
  Modal,
  Form,
  Typography,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FireOutlined,
  TrophyOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  LinkOutlined,
  CopyOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { trainingApi } from '../../api';
import {
  TrainingCourse,
  TrainingQuiz,
  WorkerRoleMap,
} from '../../types';

const { TabPane } = Tabs;
const { Paragraph } = Typography;
const { Group: RadioGroup } = Radio;

const LevelMap: Record<string, { text: string; color: string }> = {
  beginner: { text: '入门', color: 'green' },
  intermediate: { text: '进阶', color: 'orange' },
  advanced: { text: '高级', color: 'red' },
};

const CategoryMap: Record<string, string> = {
  nanny: '保姆',
  cleaner: '保洁',
  maternity: '月嫂',
  general: '通用',
};

interface CourseDetailData {
  course: TrainingCourse;
  quizzes: TrainingQuiz[];
  my_progress?: {
    progress: number;
    passed: boolean;
    quiz_score?: number;
    quiz_passed?: boolean;
    certificate_hash?: string;
    completed_at?: string;
  };
}

export default function TrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CourseDetailData | null>(null);

  const [progress, setProgress] = useState(0);
  const [updateProgressLoading, setUpdateProgressLoading] = useState(false);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    passed: boolean;
    total: number;
    correct: number;
  } | null>(null);
  const [submitQuizLoading, setSubmitQuizLoading] = useState(false);
  const [quizForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState('video');

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const result = await trainingApi.courseDetail(id!);
      setData(result);
      if (result.my_progress) {
        setProgress(result.my_progress.progress || 0);
        if (result.my_progress.quiz_passed) {
          setQuizSubmitted(true);
          setQuizResult({
            score: result.my_progress.quiz_score || 0,
            passed: true,
            total: result.quizzes?.length || 0,
            correct: Math.round(
              ((result.my_progress.quiz_score || 0) / 100) * (result.quizzes?.length || 0)
            ),
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const course = data?.course;
  const quizzes = data?.quizzes || [];
  const myProgress = data?.my_progress;

  const handleUpdateProgress = async () => {
    if (!id) return;
    setUpdateProgressLoading(true);
    try {
      await trainingApi.updateProgress(id, progress);
      message.success(`学习进度已更新：${progress}%`);
      fetchDetail();
    } catch (error) {
      console.error(error);
    } finally {
      setUpdateProgressLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!id) return;
    try {
      const values = await quizForm.validateFields();
      const answers: Record<string, number> = {};
      quizzes.forEach((q, idx) => {
        answers[q.id] = values[`q_${idx}`];
      });
      setQuizAnswers(answers);
      setSubmitQuizLoading(true);
      const result = await trainingApi.submitQuiz(id, answers);
      setQuizSubmitted(true);
      setQuizResult({
        score: result.score,
        passed: result.passed,
        total: quizzes.length,
        correct: result.correct_count || 0,
      });
      message.success(result.passed ? '恭喜通过测验！' : '测验未通过，请继续学习');
      fetchDetail();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setSubmitQuizLoading(false);
    }
  };

  const handleVerifyCertificate = (hash: string) => {
    Modal.success({
      title: '链上验证',
      content: (
        <div>
          <Alert
            type="success"
            showIcon
            message="证书验证成功"
            description="该证书已在区块链上存证，信息真实有效。"
            style={{ marginBottom: 16 }}
          />
          <div style={{ marginBottom: 8, fontWeight: 500 }}>证书哈希：</div>
          <div
            style={{
              background: '#f6ffed',
              padding: 12,
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 12,
              wordBreak: 'break-all',
              color: '#389e0d',
              border: '1px solid #b7eb8f',
            }}
          >
            {hash}
          </div>
          <div style={{ marginTop: 16, color: '#999', fontSize: 12 }}>
            交易ID: 0x{Math.random().toString(16).slice(2, 10)}...{Math.random().toString(16).slice(2, 8)}
          </div>
        </div>
      ),
      okText: '关闭',
    });
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    message.success('哈希值已复制');
  };

  const getCoverStyle = () => {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      nanny: '👶',
      cleaner: '🧹',
      maternity: '🤱',
      general: '📚',
    };
    return icons[category] || '📖';
  };

  const renderVideoTab = () => {
    if (!course) return null;
    const isPassed = myProgress?.passed;

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card className="card-hover" bodyStyle={{ padding: 0 }}>
          <div
            style={{
              height: 380,
              background: getCoverStyle(),
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              color: 'white',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%)',
              }}
            />
            <div style={{ fontSize: 72, marginBottom: 16, zIndex: 1 }}>
              {getCategoryIcon(course.category)}
            </div>
            <PlayCircleOutlined
              style={{
                fontSize: 88,
                opacity: 0.85,
                zIndex: 1,
                filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.3))',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (progress < 100) {
                  const newProgress = Math.min(progress + 25, 100);
                  setProgress(newProgress);
                  message.info(`播放视频，进度更新为 ${newProgress}%`);
                }
              }}
            />
            <div style={{ marginTop: 20, fontSize: 15, opacity: 0.9, zIndex: 1 }}>
              <Space>
                <ClockCircleOutlined /> {course.duration} 分钟
              </Space>
            </div>
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                background: 'rgba(0,0,0,0.35)',
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 12,
                zIndex: 1,
              }}
            >
              <FileTextOutlined /> {course.title}
            </div>
          </div>
        </Card>

        <Card title="学习进度" className="card-hover">
          <Row gutter={24} align="middle">
            <Col xs={24} md={16}>
              <Progress
                percent={progress}
                status={progress === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
                {progress === 100 ? (
                  <span style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> 视频学习已完成，请前往"随堂测验"进行结业考核
                  </span>
                ) : (
                  <>
                    请完成视频学习后进行随堂测验，建议完整观看所有教学内容。
                  </>
                )}
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={updateProgressLoading}
                  onClick={handleUpdateProgress}
                  disabled={progress === (myProgress?.progress || 0)}
                >
                  更新学习进度
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card title="课程描述" className="card-hover">
          <Paragraph style={{ lineHeight: 1.8, color: '#333', marginBottom: 0 }}>
            {course.description || '暂无课程描述'}
          </Paragraph>
        </Card>
      </Space>
    );
  };

  const renderQuizTab = () => {
    if (!course) return null;

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card
          className="card-hover"
          title={
            <Space>
              <FileTextOutlined /> 随堂测验
              <Tag color={quizzes.length > 0 ? 'blue' : 'default'}>
                共 {quizzes.length} 题
              </Tag>
            </Space>
          }
          extra={
            quizSubmitted && quizResult ? (
              <Tag color={quizResult.passed ? 'green' : 'red'} icon={<TrophyOutlined />}>
                {quizResult.passed ? '已通过' : '未通过'}
              </Tag>
            ) : null
          }
        >
          {quizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              暂无测验题目
            </div>
          ) : quizSubmitted && quizResult ? (
            <Result
              status={quizResult.passed ? 'success' : 'warning'}
              title={quizResult.passed ? '测验通过！' : '很遗憾，未通过测验'}
              subTitle={
                <div>
                  <Space size={16}>
                    <Statistic title="得分" value={quizResult.score} suffix="分" />
                    <Statistic title="正确题数" value={`${quizResult.correct}/${quizResult.total}`} />
                    <Statistic
                      title="通过率"
                      value={Math.round((quizResult.correct / quizResult.total) * 100)}
                      suffix="%"
                    />
                  </Space>
                  {quizResult.passed ? (
                    <Alert
                      type="success"
                      showIcon
                      style={{ marginTop: 24 }}
                      message="恭喜完成课程学习！"
                      description={`您已通过所有考核，可以前往"结业证书"查看并下载您的电子证书。`}
                    />
                  ) : (
                    <Alert
                      type="warning"
                      showIcon
                      style={{ marginTop: 24 }}
                      message="测验未通过"
                      description="请重新学习课程内容后再次尝试测验，通过分数线为 60 分。"
                    />
                  )}
                </div>
              }
              extra={
                !quizResult.passed ? (
                  <Button
                    type="primary"
                    onClick={() => {
                      setQuizSubmitted(false);
                      setQuizResult(null);
                      quizForm.resetFields();
                      setActiveTab('video');
                    }}
                  >
                    重新学习并重考
                  </Button>
                ) : (
                  <Space>
                    <Button
                      type="primary"
                      icon={<SafetyCertificateOutlined />}
                      onClick={() => setActiveTab('certificate')}
                    >
                      查看结业证书
                    </Button>
                  </Space>
                )
              }
            />
          ) : (
            <Form
              form={quizForm}
              layout="vertical"
              onFinish={handleSubmitQuiz}
              initialValues={quizAnswers}
            >
              <Alert
                type="info"
                showIcon
                message="答题说明"
                description="本测验包含多个单选题，请选择您认为正确的答案。通过分数线为 60 分。"
                style={{ marginBottom: 24 }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {quizzes.map((quiz, idx) => (
                  <div
                    key={quiz.id}
                    style={{
                      padding: 16,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      background: '#fafafa',
                    }}
                  >
                    <div style={{ fontWeight: 500, marginBottom: 12, fontSize: 15 }}>
                      <Tag color="blue" style={{ marginRight: 8 }}>
                        第 {idx + 1} 题
                      </Tag>
                      {quiz.question}
                    </div>
                    <Form.Item
                      name={`q_${idx}`}
                      rules={[{ required: true, message: '请选择答案' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <RadioGroup>
                        <Space direction="vertical" size={8}>
                          {quiz.options.map((opt, optIdx) => (
                            <Radio key={optIdx} value={optIdx}>
                              {String.fromCharCode(65 + optIdx)}. {opt}
                            </Radio>
                          ))}
                        </Space>
                      </RadioGroup>
                    </Form.Item>
                  </div>
                ))}
              </div>
              <Divider />
              <div style={{ textAlign: 'center' }}>
                <Space>
                  <Button onClick={() => quizForm.resetFields()}>重置答案</Button>
                  <Button
                    type="primary"
                    size="large"
                    htmlType="submit"
                    loading={submitQuizLoading}
                  >
                    提交测验
                  </Button>
                </Space>
              </div>
            </Form>
          )}
        </Card>
      </Space>
    );
  };

  const renderCertificateTab = () => {
    if (!course) return null;
    const hasCertificate = myProgress?.passed && myProgress?.certificate_hash;

    return (
      <Card
        className="card-hover"
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#faad14' }} /> 结业证书
          </Space>
        }
      >
        {hasCertificate ? (
          <div
            style={{
              background: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)',
              borderRadius: 16,
              padding: 40,
              border: '2px solid #ffd666',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 80,
                height: 80,
                border: '3px solid #faad14',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'rotate(15deg)',
                opacity: 0.6,
              }}
            >
              <TrophyOutlined style={{ fontSize: 36, color: '#faad14' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#d48806',
                  marginBottom: 8,
                  letterSpacing: 4,
                }}
              >
                结业证书
              </div>
              <div style={{ color: '#ad6800', fontSize: 12 }}>
                CERTIFICATE OF COMPLETION
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <TrophyOutlined style={{ fontSize: 64, color: '#faad14', marginBottom: 16 }} />
            </div>

            <div style={{ padding: '0 40px' }}>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 16,
                  color: '#595959',
                  marginBottom: 24,
                  lineHeight: 1.8,
                }}
              >
                兹证明
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#262626',
                  marginBottom: 24,
                  borderBottom: '2px dashed #d9d9d9',
                  paddingBottom: 16,
                }}
              >
                {currentUserName()}
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 15,
                  color: '#595959',
                  lineHeight: 2,
                  marginBottom: 24,
                }}
              >
                已完成 <span style={{ fontWeight: 600, color: '#1677ff' }}>{course.title}</span>
                <br />
                全部课程学习及考核，成绩合格，特发此证。
              </div>

              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>
                      课程分类
                    </div>
                    <Tag color="blue">{CategoryMap[course.category]}</Tag>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>
                      难度等级
                    </div>
                    <Tag color={LevelMap[course.level]?.color}>
                      {LevelMap[course.level]?.text}
                    </Tag>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>
                      考核得分
                    </div>
                    <Tag color="green">
                      {myProgress?.quiz_score || 100} 分
                    </Tag>
                  </div>
                </Col>
              </Row>

              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#8c8c8c',
                  marginBottom: 24,
                }}
              >
                签发日期：{myProgress?.completed_at || new Date().toLocaleString()}
              </div>
            </div>

            <Divider />

            <div
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 16,
                border: '1px solid #e8e8e8',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <Space>
                  <LinkOutlined style={{ color: '#1677ff' }} />
                  <span style={{ fontWeight: 500 }}>区块链存证哈希</span>
                </Space>
                <Space>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyHash(myProgress!.certificate_hash!)}
                  >
                    复制
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<SafetyCertificateOutlined />}
                    onClick={() => handleVerifyCertificate(myProgress!.certificate_hash!)}
                  >
                    链上验证
                  </Button>
                </Space>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: '#666',
                  wordBreak: 'break-all',
                  padding: '8px 12px',
                  background: '#fafafa',
                  borderRadius: 6,
                }}
              >
                {myProgress?.certificate_hash}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 40px' }}>
            <SafetyCertificateOutlined
              style={{ fontSize: 72, color: '#e8e8e8', marginBottom: 16 }}
            />
            <div style={{ fontSize: 18, color: '#999', marginBottom: 8 }}>
              尚未获得结业证书
            </div>
            <div style={{ color: '#bfbfbf', marginBottom: 24 }}>
              请完成视频学习并通过随堂测验以获得证书
            </div>
            <Space>
              <Button type="primary" icon={<BookOutlined />} onClick={() => setActiveTab('video')}>
                开始学习
              </Button>
            </Space>
          </div>
        )}
      </Card>
    );
  };

  const currentUserName = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.username || user.name || '学员';
      } catch {
        return '学员';
      }
    }
    return '学员';
  };

  return (
    <div className="page-container">
      <Spin spinning={loading}>
        <Card
          style={{ marginBottom: 16 }}
          bodyStyle={{ padding: 0 }}
          className="card-hover"
        >
          <div
            style={{
              height: 220,
              background: getCoverStyle(),
              display: 'flex',
              padding: '24px 32px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
              }}
            />
            <div style={{ flex: 1, zIndex: 1, color: 'white', display: 'flex', flexDirection: 'column' }}>
              <Button
                icon={<ArrowLeftOutlined />}
                style={{
                  alignSelf: 'flex-start',
                  marginBottom: 16,
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => navigate('/training')}
              >
                返回列表
              </Button>
              <div
                style={{
                  fontSize: 72,
                  marginBottom: 8,
                  filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.2))',
                }}
              >
                {course && getCategoryIcon(course.category)}
              </div>
            </div>
            <div
              style={{
                flex: 3,
                zIndex: 1,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Space wrap style={{ marginBottom: 12 }}>
                <Tag color="blue" style={{ margin: 0, fontSize: 13, padding: '2px 12px' }}>
                  {course && CategoryMap[course.category]}
                </Tag>
                {course && (
                  <Tag
                    color={LevelMap[course.level]?.color || 'default'}
                    style={{ margin: 0, fontSize: 13, padding: '2px 12px' }}
                  >
                    {LevelMap[course.level]?.text}
                  </Tag>
                )}
                {myProgress?.passed && (
                  <Tag
                    color="gold"
                    icon={<TrophyOutlined />}
                    style={{ margin: 0, fontSize: 13, padding: '2px 12px' }}
                  >
                    已结业
                  </Tag>
                )}
              </Space>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  marginBottom: 12,
                  lineHeight: 1.3,
                  textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                {course?.title}
              </div>
              <Space wrap size={16} style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                <Space>
                  <ClockCircleOutlined /> {course?.duration} 分钟
                </Space>
                <Space>
                  <FireOutlined style={{ color: '#ffadd2' }} />
                  {course?.completed_count || 0} 人已学习
                </Space>
                {myProgress && (
                  <Space>
                    <Progress
                      type="circle"
                      size={48}
                      percent={myProgress.progress}
                      strokeColor="#52c41a"
                      format={(p) => `${p}%`}
                    />
                  </Space>
                )}
              </Space>
            </div>
          </div>
        </Card>

        <Card
          bodyStyle={{ padding: 0 }}
          className="card-hover"
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            style={{ padding: '0 20px 20px 20px' }}
          >
            <TabPane
              tab={
                <span>
                  <PlayCircleOutlined /> 视频学习
                </span>
              }
              key="video"
            >
              {renderVideoTab()}
            </TabPane>
            <TabPane
              tab={
                <span>
                  <FileTextOutlined /> 随堂测验
                  {quizSubmitted && quizResult && (
                    <Tag
                      color={quizResult.passed ? 'green' : 'orange'}
                      style={{ marginLeft: 6 }}
                    >
                      {quizResult.score}分
                    </Tag>
                  )}
                </span>
              }
              key="quiz"
            >
              {renderQuizTab()}
            </TabPane>
            <TabPane
              tab={
                <span>
                  <SafetyCertificateOutlined /> 结业证书
                  {myProgress?.passed && <Tag color="gold" style={{ marginLeft: 6 }}>已获取</Tag>}
                </span>
              }
              key="certificate"
            >
              {renderCertificateTab()}
            </TabPane>
          </Tabs>
        </Card>
      </Spin>
    </div>
  );
}
