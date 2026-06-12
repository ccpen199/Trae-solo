import { useState, useEffect } from 'react';
import { Card, Descriptions, Typography, Button, Space, Row, Col, Progress, List, Avatar, Tag, Modal, QRCode, Statistic, Alert, App } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlayCircleOutlined, CheckCircleOutlined, TrophyOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [myProgress, setMyProgress] = useState<any[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [showCert, setShowCert] = useState(false);
  const [certData, setCertData] = useState<any>(null);
  const { message } = App.useApp();

  useEffect(() => {
    api.get(`/lms/courses/${id}`).then((d: any) => {
      setCourse(d.course);
      setLessons(d.lessons || []);
      setProgress(d.progress || 0);
      setMyProgress(d.myProgress || []);
      if (d.lessons?.length > 0) setCurrentLesson(d.lessons[0]);
    });
  }, [id]);

  const studyLesson = async (lesson: any) => {
    setCurrentLesson(lesson);
    try {
      const data = await api.post(`/lms/courses/${id}/lessons/${lesson.id}/progress`, { progress: 100, completed: true }) as any;
      message.success(`学习进度：${data.overallProgress || 0}%`);
      setProgress(data.overallProgress || 0);
      if (data.overallProgress >= 100) {
        const certs: any = await api.get('/lms/my/certificates');
        const cert = certs.certificates?.find((c: any) => c.course_id === id);
        if (cert) { setCertData(cert); setShowCert(true); }
      }
      const d: any = await api.get(`/lms/courses/${id}`);
      setMyProgress(d.myProgress || []);
    } catch (e: any) { message.error(e.error || '更新进度失败'); }
  };

  const isLessonCompleted = (lessonId: string) => myProgress.some((p: any) => p.lesson_id === lessonId && p.completed);

  if (!course) return <Card loading />;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{course.title}</Title>
        <Tag color="purple">{course.category || '未分类'}</Tag>
        <Tag color={course.status === 'published' ? 'green' : 'orange'}>{course.status === 'published' ? '已发布' : '草稿'}</Tag>
        {(user?.role === 'trainer' || user?.role === 'admin') && (
          <Button icon={<EditOutlined />} onClick={() => navigate(`/courses/${id}/edit`)}>编辑</Button>
        )}
      </Space>

      {progress >= 100 && (
        <Alert type="success" showIcon message="🎉 恭喜您已完成全部课程！" action={<Button size="small" type="primary" onClick={() => setShowCert(true)}>查看证书</Button>} />
      )}

      <Row gutter={16}>
        <Col xs={24} md={16}>
          <Card>
            <div style={{ height: 360, background: '#000', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', borderRadius: 8, marginBottom: 24 }}>
              <PlayCircleOutlined style={{ fontSize: 80, opacity: 0.6 }} />
              <Text style={{ marginTop: 16, fontSize: 18 }}>
                {currentLesson ? `正在学习：${currentLesson.title}` : '请选择课时开始学习'}
              </Text>
              {currentLesson && <Text type="secondary" style={{ marginTop: 8 }}>
                课时时长：{currentLesson.duration || 0} 分钟 · 讲师：{course.trainer_name}
              </Text>}
            </div>

            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="课程讲师">{course.trainer_name || '培训师'}</Descriptions.Item>
              <Descriptions.Item label="课程时长">{course.duration || 0} 分钟 · 共 {lessons.length} 个课时</Descriptions.Item>
            </Descriptions>

            <Title level={5}>课程介绍</Title>
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{course.description || '暂无介绍'}</Paragraph>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card title={<span><TrophyOutlined style={{ color: '#faad14' }} /> 我的学习进度</span>}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Progress type="dashboard" percent={progress} size={120} />
              <div style={{ marginTop: 8, color: '#999' }}>
                {myProgress.filter((p: any) => p.completed).length} / {lessons.length} 课时已完成
              </div>
            </div>
          </Card>

          <Card title={<span><BookOutlined /> 课程目录</span>} style={{ marginTop: 16 }}>
            <List
              dataSource={lessons}
              renderItem={(l: any, i) => {
                const completed = isLessonCompleted(l.id);
                return (
                  <List.Item
                    className="card-hover"
                    onClick={() => studyLesson(l)}
                    style={{
                      padding: '12px 0', cursor: 'pointer',
                      background: currentLesson?.id === l.id ? '#e6f4ff' : 'transparent',
                      borderRadius: 4, paddingLeft: 8, paddingRight: 8
                    }}
                  >
                    <Space>
                      {completed ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#d9d9d9', color: 'white', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                      )}
                      <div>
                        <Text strong={completed || currentLesson?.id === l.id}>{l.title}</Text>
                        <div style={{ fontSize: 12, color: '#999' }}>{l.duration || 0} 分钟</div>
                      </div>
                    </Space>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>

      <Modal title="🎉 结业证书" open={showCert} onCancel={() => setShowCert(false)} footer={null} width={560}>
        {certData && (
          <div style={{ background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', padding: 40, borderRadius: 8, textAlign: 'center', color: '#333' }}>
            <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
            <Title level={3} style={{ marginTop: 16, color: '#333' }}>结业证书</Title>
            <div style={{ fontSize: 16, margin: '16px 0' }}>
              兹证明 <strong>{user?.name}</strong>
            </div>
            <div style={{ fontSize: 14, marginBottom: 16 }}>已完成《<strong>{certData.course_name}</strong>》全部课程学习</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>证书编号：{certData.certificate_no}</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 24 }}>
              学习得分：{certData.score || 100}分 · 颁发日期：{dayjs(certData.issued_at).format('YYYY年MM月DD日')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <QRCode value={`${window.location.origin}/cert-verify/${certData.certificate_no}`} size={80} />
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>扫码验证证书真伪</div>
          </div>
        )}
      </Modal>
    </Space>
  );
}
