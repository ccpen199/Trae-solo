import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Progress,
  Row,
  Col,
  Statistic,
  Avatar,
  Modal,
  Select,
  Space,
  Typography,
  Divider,
  message,
  Spin,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  UserSwitchOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  RiseOutlined,
  WarningOutlined,
  SafetyOutlined,
  BarChartOutlined,
  GiftOutlined,
  SendOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface Resume {
  id: number;
  candidate_name: string;
  candidate_phone: string;
  candidate_email: string;
  age: number;
  gender: string;
  current_company: string;
  current_position: string;
  current_salary: number;
  expected_salary_min: number;
  expected_salary_max: number;
  city: string;
  education: string;
  work_years: number;
  skills: string[];
  experience: string;
  education_detail: string;
  portrait_tags: string[];
  poaching_risk: number;
  owner_name: string;
  owner_credit: number;
  is_public: boolean;
  created_at: string;
}

interface JobOption {
  id: number;
  title: string;
  company_name: string;
  reward_amount: number;
}

interface TalentPortrait {
  tags: string[];
  skill_rating: {
    score: number;
    level: string;
    matched_hot_skills: number;
  };
  market_value: {
    level: string;
    current_salary: number;
    expected_min: number;
    expected_max: number;
  };
  career_stage: string;
  growth_potential: number;
  stability_index: number;
  overall_score: number;
  recommendations: string[];
}

interface PoachingRisk {
  risk_score: number;
  risk_level: string;
  risk_description: string;
  factors: Array<{
    factor: string;
    impact: string;
    score: number;
  }>;
  suggestions: string[];
  poaching_index: number;
}

const ResumeDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<Resume | null>(null);
  const [portrait, setPortrait] = useState<TalentPortrait | null>(null);
  const [risk, setRisk] = useState<PoachingRisk | null>(null);
  const [salaryBand, setSalaryBand] = useState<any>(null);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [recommendModalVisible, setRecommendModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [recommending, setRecommending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchResumeDetail();
      fetchJobs();
    }
  }, [id]);

  const fetchResumeDetail = async () => {
    try {
      setLoading(true);
      const [resumeRes, portraitRes, riskRes, salaryRes] = await Promise.all([
        axios.get(`/api/resumes/${id}`),
        axios.get(`/api/toolbox/portrait/${id}`).catch(() => ({ data: null })),
        axios.get(`/api/toolbox/poaching-risk/${id}`).catch(() => ({ data: null })),
        axios.get('/api/toolbox/salary-band', {
          params: { city: '', industry: '', position_level: '', position: '' }
        }).catch(() => ({ data: null }))
      ]);
      setResume(resumeRes.data);
      setPortrait(portraitRes.data);
      setRisk(riskRes.data);
      setSalaryBand(salaryRes.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取简历详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await axios.get('/api/jobs', { params: { pageSize: 50 } });
      setJobs(response.data.list || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleRecommend = async () => {
    if (!selectedJob || !id) return;
    try {
      setRecommending(true);
      const response = await axios.post('/api/recommendations', {
        resume_id: parseInt(id),
        job_id: selectedJob
      });
      message.success(`推荐成功！预计佣金: ¥${response.data.commission_amount.toLocaleString()}`);
      setRecommendModalVisible(false);
      navigate(`/recommendations/${response.data.id}`);
    } catch (error: any) {
      message.error(error.response?.data?.error || '推荐失败');
    } finally {
      setRecommending(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'very_high': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      case 'very_low': return '#237804';
      default: return '#999';
    }
  };

  const getRiskText = (level: string) => {
    const map: Record<string, string> = {
      very_high: '极高',
      high: '高',
      medium: '中',
      low: '低',
      very_low: '极低'
    };
    return map[level] || level;
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'S': return '#f5222d';
      case 'A': return '#fa8c16';
      case 'B': return '#1677ff';
      case 'C': return '#8c8c8c';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!resume) {
    return <Alert message="简历不存在" type="error" />;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/resumes')}
          type="text"
        >
          返回列表
        </Button>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0 }}>
            {resume.candidate_name}
            <span style={{ fontSize: 16, fontWeight: 400, color: '#999', marginLeft: 12 }}>
              {resume.current_position}
            </span>
          </Title>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<UserSwitchOutlined />}
          onClick={() => setRecommendModalVisible(true)}
        >
          推荐候选人
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <Avatar size={80} icon={<UserOutlined />} style={{ background: '#1677ff', fontSize: 32 }} />
              <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                {resume.candidate_name}
              </Title>
              <Text type="secondary">{resume.age}岁 · {resume.gender}</Text>
              <div className="tag-list" style={{ justifyContent: 'center', marginTop: 16 }}>
                {resume.portrait_tags?.map((tag, idx) => (
                  <Tag key={idx} color="blue">{tag}</Tag>
                ))}
              </div>
            </div>
            <Divider style={{ margin: '16px 0' }} />
            <Descriptions column={1} size="small">
              <Descriptions.Item label={<><PhoneOutlined /> 联系电话</>}>
                {resume.candidate_phone}
              </Descriptions.Item>
              <Descriptions.Item label={<><MailOutlined /> 电子邮箱</>}>
                {resume.candidate_email}
              </Descriptions.Item>
              <Descriptions.Item label={<><EnvironmentOutlined /> 所在城市</>}>
                {resume.city}
              </Descriptions.Item>
              <Descriptions.Item label={<><SafetyOutlined /> 录入人</>}>
                {resume.owner_name}
                <Tag
                  color={resume.owner_credit >= 80 ? 'success' : resume.owner_credit >= 60 ? 'gold' : 'red'}
                  style={{ marginLeft: 8 }}
                >
                  信用 {resume.owner_credit}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(resume.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={<><BarChartOutlined /> 人才画像</>}
            bordered={false}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            {portrait && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    border: `6px solid ${portrait.overall_score >= 80 ? '#52c41a' : portrait.overall_score >= 60 ? '#fa8c16' : '#ff4d4f'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    fontSize: 28,
                    fontWeight: 700,
                    color: portrait.overall_score >= 80 ? '#52c41a' : portrait.overall_score >= 60 ? '#fa8c16' : '#ff4d4f'
                  }}>
                    {portrait.overall_score}
                  </div>
                  <Text type="secondary">综合评分</Text>
                </div>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <div className="progress-label">
                        <span>技能评分</span>
                        <span style={{ color: getSkillLevelColor(portrait.skill_rating.level), fontWeight: 600 }}>
                          {portrait.skill_rating.level}级
                        </span>
                      </div>
                      <Progress percent={portrait.skill_rating.score} strokeColor="#1677ff" size="small" />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <div className="progress-label">
                        <span>成长潜力</span>
                        <span>{portrait.growth_potential}</span>
                      </div>
                      <Progress percent={portrait.growth_potential} strokeColor="#52c41a" size="small" />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <div className="progress-label">
                        <span>稳定性</span>
                        <span>{portrait.stability_index}</span>
                      </div>
                      <Progress percent={portrait.stability_index} strokeColor="#faad14" size="small" />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <div className="progress-label">
                        <span>市场价值</span>
                        <span>{portrait.market_value.level}</span>
                      </div>
                      <Progress
                        percent={portrait.market_value.level === '高' ? 90 : portrait.market_value.level === '中高' ? 75 : portrait.market_value.level === '中等' ? 55 : 35}
                        strokeColor="#722ed1"
                        size="small"
                      />
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>猎头建议</div>
                  {portrait.recommendations.map((rec, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      • {rec}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card
            title={<><WarningOutlined /> 挖角风险评估</>}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {risk && (
              <>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: getRiskColor(risk.risk_level)
                  }}>
                    {Math.round(risk.risk_score * 100)}%
                  </div>
                  <div style={{ color: getRiskColor(risk.risk_level), fontWeight: 500 }}>
                    挖角难度{getRiskText(risk.risk_level)}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    挖角成功指数: {risk.poaching_index}
                  </div>
                </div>
                <Alert
                  type="info"
                  showIcon
                  message={risk.risk_description}
                  style={{ marginBottom: 16 }}
                />
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>风险因素</div>
                  {risk.factors.map((factor, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ fontSize: 13 }}>{factor.factor}</span>
                      <Tag color={factor.impact === 'very_high' || factor.impact === 'high' ? 'red' : factor.impact === 'medium' ? 'orange' : 'green'}>
                        +{Math.round(factor.score * 100)}%
                      </Tag>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 8 }}>操作建议</div>
                  {risk.suggestions.map((suggestion, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>
                      • {suggestion}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <Title level={5} style={{ marginTop: 0 }}>基本信息</Title>
            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="当前公司">{resume.current_company}</Descriptions.Item>
              <Descriptions.Item label="当前职位">{resume.current_position}</Descriptions.Item>
              <Descriptions.Item label="工作年限">{resume.work_years}年</Descriptions.Item>
              <Descriptions.Item label="最高学历">{resume.education}</Descriptions.Item>
              <Descriptions.Item label="所在城市">{resume.city}</Descriptions.Item>
              <Descriptions.Item label="公开状态">
                <Tag color={resume.is_public ? 'green' : 'default'}>
                  {resume.is_public ? '公开' : '私有'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                  <Statistic
                    title="当前年薪"
                    value={resume.current_salary}
                    precision={0}
                    prefix="¥"
                    suffix="/年"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                  <Statistic
                    title="期望年薪下限"
                    value={resume.expected_salary_min}
                    precision={0}
                    prefix="¥"
                    suffix="/年"
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                  <Statistic
                    title="期望年薪上限"
                    value={resume.expected_salary_max}
                    precision={0}
                    prefix="¥"
                    suffix="/年"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            {salaryBand && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 500, marginBottom: 12 }}>
                  <RiseOutlined /> 市场薪酬参考
                  <Tag color="purple" style={{ marginLeft: 8 }}>{salaryBand.source === 'actual' ? '实际数据' : '估算数据'}</Tag>
                </div>
                <Row gutter={[8, 8]} style={{ fontSize: 13 }}>
                  <Col span={8} style={{ textAlign: 'center', padding: '12px 8px', background: '#f5f5f5', borderRadius: 6 }}>
                    <div style={{ color: '#999', marginBottom: 4 }}>P10 (低位)</div>
                    <div style={{ fontWeight: 600 }}>¥{(salaryBand.p10 / 10000).toFixed(1)}万</div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center', padding: '12px 8px', background: '#e6f4ff', borderRadius: 6 }}>
                    <div style={{ color: '#999', marginBottom: 4 }}>P50 (中位)</div>
                    <div style={{ fontWeight: 600, color: '#1677ff' }}>¥{(salaryBand.p50 / 10000).toFixed(1)}万</div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center', padding: '12px 8px', background: '#f5f5f5', borderRadius: 6 }}>
                    <div style={{ color: '#999', marginBottom: 4 }}>P90 (高位)</div>
                    <div style={{ fontWeight: 600 }}>¥{(salaryBand.p90 / 10000).toFixed(1)}万</div>
                  </Col>
                </Row>
              </div>
            )}

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>技能标签</div>
              <div className="tag-list">
                {resume.skills?.map((skill, idx) => (
                  <Tag key={idx} color="processing">{skill}</Tag>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>工作经历</div>
              <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                {resume.experience || '暂无详细工作经历'}
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>教育经历</div>
              <div style={{ padding: 16, background: '#fafafa', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                {resume.education_detail || '暂无详细教育经历'}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={<><GiftOutlined /> 推荐到职位</>}
        open={recommendModalVisible}
        onCancel={() => setRecommendModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{
            padding: 16,
            background: '#f0f5ff',
            borderRadius: 8,
            marginBottom: 16
          }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {resume.candidate_name} - {resume.current_position}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              期望薪资: ¥{(resume.expected_salary_min / 10000).toFixed(1)}-{(resume.expected_salary_max / 10000).toFixed(1)}万/年
            </div>
          </div>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>选择目标职位</div>
          <Select
            placeholder="请选择要推荐的职位"
            style={{ width: '100%' }}
            value={selectedJob}
            onChange={setSelectedJob}
            showSearch
            optionFilterProp="children"
            size="large"
          >
            {jobs.map(job => (
              <Option key={job.id} value={job.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{job.title} - {job.company_name}</span>
                  <span className="reward-text">¥{job.reward_amount.toLocaleString()}</span>
                </div>
              </Option>
            ))}
          </Select>
          {selectedJob && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">预计佣金将根据您的信用等级和推荐成功率计算</Text>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setRecommendModalVisible(false)}>取消</Button>
            <Button
              type="primary"
              onClick={handleRecommend}
              loading={recommending}
              disabled={!selectedJob}
              icon={<SendOutlined />}
            >
              确认推荐
            </Button>
          </Space>
        </div>
      </Modal>
    </div>
  );
};

export default ResumeDetail;
