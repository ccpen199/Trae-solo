import { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Space, Typography, Divider, Button, Progress, Row, Col, Alert, Avatar, Table, App, Modal } from 'antd';
import { ArrowLeftOutlined, SendOutlined, EditOutlined, UserOutlined, BulbOutlined, MessageOutlined, GlobalOutlined, PayCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAppStore } from '../store';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [job, setJob] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    api.get(`/jobs/${id}`).then((d: any) => setJob(d.job));
    if (user?.role === 'hr') {
      api.get(`/matching/resumes/recommend/${id}`).then((d: any) => setRecommendations(d.recommendations || []));
      api.get('/jobs/applications/list').then((d: any) => setApplications((d.applications || []).filter((a: any) => a.job_id === id)));
    }
  }, [id, user]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/jobs/${id}/apply`);
      message.success('投递成功！请等待HR回复');
      setApplied(true);
    } catch (e: any) {
      message.error(e.error || '投递失败');
    } finally { setApplying(false); }
  };

  if (!job) return <Card loading />;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{job.title}</Title>
        <Tag color={job.status === 'open' ? 'green' : 'default'}>{job.status === 'open' ? '招聘中' : '已关闭'}</Tag>
      </Space>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card>
            <Space size="large" wrap style={{ marginBottom: 16 }}>
              <Tag color="red" style={{ fontSize: 14 }}><PayCircleOutlined /> {job.salary_min || 0}-{job.salary_max || 0}K / 月</Tag>
              <Tag color="blue" style={{ fontSize: 14 }}><GlobalOutlined /> {job.location || '远程'}</Tag>
              <Tag color="purple" style={{ fontSize: 14 }}>{job.experience_level || '经验不限'}</Tag>
              <Tag color="cyan" style={{ fontSize: 14 }}>{job.education_level || '学历不限'}</Tag>
              {job.industry && <Tag color="orange" style={{ fontSize: 14 }}>{job.industry}</Tag>}
            </Space>

            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="所属部门">{job.department || '未分类'}</Descriptions.Item>
              <Descriptions.Item label="招聘负责人">{job.hr_name} · 发布于 {dayjs(job.created_at).format('YYYY-MM-DD')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">岗位职责</Divider>
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{job.description || '暂无描述'}</Paragraph>

            <Divider orientation="left">任职要求</Divider>
            {(job.requirements || []).length === 0 ? <Text type="secondary">暂无</Text> :
              <ul>{job.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}</ul>
            }

            <Divider orientation="left">技能标签</Divider>
            <Space wrap>
              {(job.skills || []).map((s: string) => <Tag key={s} color="blue" style={{ padding: '4px 12px' }}>{s}</Tag>)}
            </Space>

            <Divider />

            {user?.role === 'jobseeker' ? (
              <Space>
                <Button type="primary" size="large" icon={<SendOutlined />} loading={applying} disabled={applied || job.status !== 'open'} onClick={handleApply}>
                  {applied ? '已投递' : '立即投递'}
                </Button>
                <Button size="large" icon={<MessageOutlined />} onClick={() => navigate('/chat')}>咨询HR</Button>
              </Space>
            ) : user?.role === 'hr' && (
              <Space>
                <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/jobs/${id}/edit`)}>编辑岗位</Button>
                <Button icon={<MessageOutlined />}>查看申请 ({applications.length})</Button>
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {user?.role === 'hr' && (
            <Card title={<span><BulbOutlined /> 智能推荐人才</span>} style={{ marginBottom: 16 }}>
              {recommendations.length === 0 ? <Alert type="info" message="暂无匹配的候选人" /> : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {recommendations.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="card-hover" onClick={() => navigate(`/resumes/${r.id}`)} style={{ padding: 12, border: '1px solid #f0f0f0', borderRadius: 8, cursor: 'pointer' }}>
                      <div className="flex-between">
                        <Space>
                          <Avatar icon={<UserOutlined />} />
                          <div>
                            <Text strong>{r.resume.user_name}</Text>
                            <div style={{ fontSize: 12, color: '#999' }}>{r.resume.experience || 0}年经验 · {r.resume.education || '学历未填'}</div>
                          </div>
                        </Space>
                        <Progress type="dashboard" percent={Math.round(r.score * 100)} size={50} />
                      </div>
                      <Space wrap size="small" style={{ marginTop: 8 }}>
                        {r.matched.slice(0, 3).map((m: string) => <Tag key={m} color="green">{m} ✓</Tag>)}
                      </Space>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          )}

          <Card title="岗位申请记录" style={{ marginBottom: 16 }}>
            {user?.role !== 'hr' ? (
              <Alert type="info" message="登录HR账号可查看申请记录" />
            ) : applications.length === 0 ? (
              <Text type="secondary">暂无申请记录</Text>
            ) : (
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={applications}
                columns={[
                  { title: '求职者', dataIndex: 'applicant_name' },
                  { title: '简历', dataIndex: 'resume_title', ellipsis: true },
                  { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={s === 'pending' ? 'orange' : s === 'accepted' ? 'green' : 'red'}>{s}</Tag> }
                ]}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
