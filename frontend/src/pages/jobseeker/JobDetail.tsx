import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  message,
  Row,
  Col,
  Typography,
  Descriptions,
  Divider,
  Progress,
  Empty,
  Breadcrumb,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  EnvironmentOutlined,
  MoneyCollectOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PrinterOutlined,
  SettingOutlined,
  AppstoreOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { Job, Resume } from '../../types';
import { jobs, jobseeker } from '../../api/endpoints';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const equipmentLabels: Record<string, string> = {
  heidelberg: '海德堡',
  komori: '小森',
  roland: '罗兰',
  kba: '高宝',
  other: '其他',
};

const JobDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetail(parseInt(id));
      fetchResume();
    }
  }, [id]);

  const fetchJobDetail = async (jobId: number) => {
    setLoading(true);
    try {
      const data = await jobs.getDetail(jobId);
      setJob(data);
    } catch (error) {
      console.error('Failed to fetch job detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResume = async () => {
    try {
      const response = await jobseeker.resume();
      setResume(response.data);
    } catch (error) {
      console.error('Failed to fetch resume:', error);
    }
  };

  const handleApply = async () => {
    if (!job || !resume) {
      message.warning('请先完善您的简历');
      return;
    }
    setApplying(true);
    try {
      const result = await jobseeker.apply(job.id);
      if (result.success) {
        message.success('申请成功！企业将尽快与您联系');
      }
    } catch (error) {
      message.error('申请失败，请稍后重试');
    } finally {
      setApplying(false);
    }
  };

  const calculateSkillMatch = (): number => {
    if (!job || !job.requiredSkills || !resume || !resume.skills) {
      return 0;
    }
    const jobSkills = job.requiredSkills;
    const userSkills = resume.skills.map(s => s.name).filter(Boolean);
    const matchedSkills = jobSkills.filter(skill =>
      userSkills.some(us => us?.includes(skill) || skill.includes(us || ''))
    );
    return Math.round((matchedSkills.length / jobSkills.length) * 100);
  };

  const skillMatch = calculateSkillMatch();

  const getMatchColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '招聘中' },
      paused: { color: 'orange', text: '已暂停' },
      closed: { color: 'default', text: '已关闭' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  if (loading) {
    return <Card loading />;
  }

  if (!job) {
    return <Empty description="岗位不存在或已删除" />;
  }

  return (
    <div>
      <Breadcrumb style={{ marginBottom: '16px' }}>
        <Breadcrumb.Item onClick={() => navigate('/jobseeker/jobs')}>
          <a>求职广场</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>岗位详情</Breadcrumb.Item>
      </Breadcrumb>

      <Row gutter={24}>
        <Col span={16}>
          <Card style={{ marginBottom: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Title level={3} style={{ margin: 0, marginBottom: '8px' }}>
                    {job.title}
                  </Title>
                  <Space>
                    <Text type="secondary">{job.company?.companyName || '某印刷企业'}</Text>
                    {getStatusTag(job.status)}
                  </Space>
                </div>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                  返回列表
                </Button>
              </Space>
            </div>

            <Space size={24} style={{ marginBottom: '24px' }} wrap>
              <div>
                <MoneyCollectOutlined style={{ color: '#faad14', marginRight: '4px' }} />
                <Text strong style={{ color: '#faad14', fontSize: '18px' }}>
                  {job.salaryMin && job.salaryMax
                    ? `${job.salaryMin}K - ${job.salaryMax}K`
                    : '面议'}
                </Text>
              </div>
              <div>
                <EnvironmentOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
                <Text>{job.workLocation || '地点待定'}</Text>
              </div>
              <div>
                <CalendarOutlined style={{ color: '#722ed1', marginRight: '4px' }} />
                <Text>{job.jobType || '全职'}</Text>
              </div>
              <div>
                <Text type="secondary">
                  发布于 {dayjs(job.createdAt).format('YYYY-MM-DD')}
                </Text>
              </div>
            </Space>

            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Text strong style={{ marginBottom: '8px', display: 'block' }}>技能标签：</Text>
                <Space wrap size={[8, 8]}>
                  {job.requiredSkills.map((skill, idx) => (
                    <Tag key={idx} color="blue">{skill}</Tag>
                  ))}
                </Space>
              </div>
            )}

            {job.description && (
              <div style={{ marginBottom: '24px' }}>
                <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                  <Title level={5} style={{ margin: 0 }}>岗位描述</Title>
                </Divider>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                  {job.description}
                </div>
              </div>
            )}

            {job.processRequirements && Object.keys(job.processRequirements).length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                  <Title level={5} style={{ margin: 0 }}>
                    <PrinterOutlined /> 工艺要求
                  </Title>
                </Divider>
                <Descriptions column={1} bordered size="small">
                  {job.processRequirements.printingMethod && (
                    <Descriptions.Item label="印刷方式">
                      {job.processRequirements.printingMethod}
                    </Descriptions.Item>
                  )}
                  {job.processRequirements.colorGroupRequirement && (
                    <Descriptions.Item label="色组要求">
                      {job.processRequirements.colorGroupRequirement}
                    </Descriptions.Item>
                  )}
                  {job.processRequirements.precisionRequirement && (
                    <Descriptions.Item label="精度要求">
                      {job.processRequirements.precisionRequirement}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}

            {job.equipmentModels && Object.keys(job.equipmentModels).length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                  <Title level={5} style={{ margin: 0 }}>
                    <SettingOutlined /> 设备型号要求
                  </Title>
                </Divider>
                <Row gutter={[16, 16]}>
                  {Object.entries(job.equipmentModels).map(([key, models]) => (
                    models && (models as string[]).length > 0 && (
                      <Col span={12} key={key}>
                        <Card size="small" title={equipmentLabels[key] || key}>
                          <Space wrap>
                            {(models as string[]).map((model, idx) => (
                              <Tag key={idx}>{model}</Tag>
                            ))}
                          </Space>
                        </Card>
                      </Col>
                    )
                  ))}
                </Row>
              </div>
            )}

            {job.materialStandards && Object.keys(job.materialStandards).length > 0 && (
              <div>
                <Divider orientation="left" style={{ margin: '0 0 16px 0' }}>
                  <Title level={5} style={{ margin: 0 }}>
                    <AppstoreOutlined /> 材料标准
                  </Title>
                </Divider>
                <Descriptions column={1} bordered size="small">
                  {job.materialStandards.paperType && (
                    <Descriptions.Item label="纸张类型">
                      {job.materialStandards.paperType}
                    </Descriptions.Item>
                  )}
                  {job.materialStandards.inkStandard && (
                    <Descriptions.Item label="油墨标准">
                      {job.materialStandards.inkStandard}
                    </Descriptions.Item>
                  )}
                  {job.materialStandards.laminationRequirement && (
                    <Descriptions.Item label="覆膜要求">
                      {job.materialStandards.laminationRequirement}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card
            style={{ position: 'sticky', top: '24px' }}
            title={<><StarOutlined /> 技能匹配度</>}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Progress
                type="dashboard"
                percent={skillMatch}
                strokeColor={getMatchColor(skillMatch)}
                size={160}
                format={(percent) => `${percent}%`}
              />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">
                  {skillMatch >= 80
                    ? '非常匹配，强烈推荐申请'
                    : skillMatch >= 60
                    ? '基本匹配，可以尝试申请'
                    : '匹配度较低，建议提升技能后再申请'}
                </Text>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ marginBottom: '16px' }}>
              <Text strong>岗位要求技能</Text>
            </div>
            <List
              size="small"
              dataSource={job.requiredSkills || []}
              renderItem={(skill) => {
                const hasSkill = resume?.skills?.some(s =>
                  s.name?.includes(skill) || skill.includes(s.name || '')
                );
                return (
                  <List.Item>
                    <Space>
                      {hasSkill ? (
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      )}
                      <Text style={{ textDecoration: hasSkill ? 'none' : 'line-through' }}>
                        {skill}
                      </Text>
                    </Space>
                  </List.Item>
                );
              }}
            />

            <Divider style={{ margin: '16px 0' }} />

            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              onClick={handleApply}
              loading={applying}
              disabled={job.status !== 'active'}
              block
              style={{ height: '48px', fontSize: '16px' }}
            >
              {job.status === 'active' ? '立即申请' : '该岗位已结束招聘'}
            </Button>

            {job.status !== 'active' && (
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '8px', textAlign: 'center' }}>
                该岗位已暂停或关闭招聘
              </Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default JobDetail;
