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
  Modal,
  Select,
  Space,
  Typography,
  Divider,
  message,
  Spin,
  Alert,
  Table
} from 'antd';
import {
  ArrowLeftOutlined,
  UserSwitchOutlined,
  SafetyOutlined,
  GiftOutlined,
  BankOutlined,
  CalendarOutlined,
  SendOutlined,
  FileTextOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;

interface Job {
  id: number;
  company_id: number;
  title: string;
  department: string;
  job_description: string;
  requirements: string;
  salary_min: number;
  salary_max: number;
  reward_amount: number;
  commission_tiers: Array<{ threshold: number; rate: number }>;
  installment_plan: Array<{ month: number; ratio: number }>;
  allowed_channels: string[];
  probation_months: number;
  feedback_nodes: string[];
  city: string;
  status: string;
  company_name: string;
  industry: string;
  scale: string;
  description: string;
  verified: boolean;
  creator_name: string;
  created_at: string;
}

interface ResumeOption {
  id: number;
  candidate_name: string;
  current_position: string;
  current_company: string;
  current_salary: number;
}

const JobDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [recommendModalVisible, setRecommendModalVisible] = useState(false);
  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const [recommending, setRecommending] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetail();
      fetchResumes();
    }
  }, [id]);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/jobs/${id}`);
      setJob(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取职位详情失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await axios.get('/api/resumes/mine');
      setResumes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    }
  };

  const handleRecommend = async () => {
    if (!selectedResume || !id) return;
    try {
      setRecommending(true);
      const response = await axios.post('/api/recommendations', {
        resume_id: selectedResume,
        job_id: parseInt(id)
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

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      active: { color: 'green', text: '招聘中' },
      closed: { color: 'default', text: '已关闭' },
      paused: { color: 'orange', text: '已暂停' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const tierColumns = [
    {
      title: '成功人数',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (val: number) => `${val}人以上`
    },
    {
      title: '佣金比例',
      dataIndex: 'rate',
      key: 'rate',
      render: (val: number) => <span style={{ color: '#1677ff', fontWeight: 500 }}>{(val * 100).toFixed(0)}%</span>
    },
    {
      title: '佣金金额',
      key: 'amount',
      render: (_: any, record: any) => (
        <span className="reward-text">¥{Math.round((job?.reward_amount || 0) * record.rate).toLocaleString()}</span>
      )
    }
  ];

  const installmentColumns = [
    {
      title: '期数',
      dataIndex: 'month',
      key: 'month',
      render: (val: number) => `第${val}个月`
    },
    {
      title: '发放比例',
      dataIndex: 'ratio',
      key: 'ratio',
      render: (val: number) => `${(val * 100).toFixed(0)}%`
    },
    {
      title: '预计金额',
      key: 'amount',
      render: (_: any, record: any) => (
        <span className="reward-text">
          ¥{Math.round((job?.reward_amount || 0) * 0.1 * record.ratio).toLocaleString()}
        </span>
      )
    },
    {
      title: '发放条件',
      key: 'condition',
      render: (_: any, record: any) => `候选人成功入职满${record.month}个月`
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!job) {
    return <Alert message="职位不存在" type="error" />;
  }

  const estimatedCommission = Math.round(job.reward_amount * 0.1);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/jobs')}
          type="text"
        >
          返回列表
        </Button>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            {job.title}
            {getStatusTag(job.status)}
          </Title>
        </div>
        {job.status === 'active' && user?.role === 'user' && (
          <Button
            type="primary"
            size="large"
            icon={<UserSwitchOutlined />}
            onClick={() => setRecommendModalVisible(true)}
          >
            推荐候选人
          </Button>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 28,
                color: '#fff'
              }}>
                <BankOutlined />
              </div>
              <Title level={4} style={{ marginBottom: 4 }}>
                {job.company_name}
              </Title>
              <Text type="secondary">
                {job.industry} · {job.scale}人
              </Text>
              <div style={{ marginTop: 12 }}>
                {job.verified ? (
                  <Tag color="green" icon={<SafetyOutlined />}>企业已认证</Tag>
                ) : (
                  <Tag color="default">未认证</Tag>
                )}
              </div>
            </div>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.8 }}>
              {job.description || '暂无企业介绍'}
            </div>
          </Card>

          <Card
            title={<><GiftOutlined /> 悬赏奖励</>}
            bordered={false}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#f5222d',
                marginBottom: 4
              }}>
                ¥{job.reward_amount.toLocaleString()}
              </div>
              <Text type="secondary">成功入职奖励</Text>
            </div>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>预计佣金</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }}>
                    ¥{estimatedCommission.toLocaleString()}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>佣金比例</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
                    {(job.commission_tiers[0]?.rate * 100 || 10).toFixed(0)}%
                  </div>
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Alert
                type="info"
                showIcon
                message={`试用期 ${job.probation_months} 个月`}
                description={`反馈节点: ${job.feedback_nodes?.join(' · ')}`}
              />
            </div>
          </Card>

          <Card
            title={<><CalendarOutlined /> 分期发放计划</>}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              {job.installment_plan?.map((installment, idx) => (
                <div key={idx} style={{ position: 'relative', paddingBottom: idx < job.installment_plan.length - 1 ? 24 : 0 }}>
                  {idx < job.installment_plan.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: -15,
                      top: 12,
                      bottom: -12,
                      width: 2,
                      background: '#d9d9d9'
                    }} />
                  )}
                  <div style={{
                    position: 'absolute',
                    left: -20,
                    top: 4,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#1677ff',
                    border: '2px solid #fff',
                    boxShadow: '0 0 0 2px #1677ff'
                  }} />
                  <div style={{ marginLeft: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text strong>入职第{installment.month}个月</Text>
                      <Text strong style={{ color: '#1677ff' }}>{(installment.ratio * 100).toFixed(0)}%</Text>
                    </div>
                    <div style={{ fontSize: 13, color: '#666' }}>
                      预计 ¥{Math.round(estimatedCommission * installment.ratio).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <Title level={5} style={{ marginTop: 0 }}>职位信息</Title>
            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="所属部门">{job.department}</Descriptions.Item>
              <Descriptions.Item label="工作城市">{job.city}</Descriptions.Item>
              <Descriptions.Item label="薪资范围">
                <span className="salary-text">
                  ¥{(job.salary_min / 10000).toFixed(1)}-{(job.salary_max / 10000).toFixed(1)}万/年
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="试用期">{job.probation_months}个月</Descriptions.Item>
              <Descriptions.Item label="发布人">{job.creator_name}</Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {dayjs(job.created_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                <FileTextOutlined /> 职位描述
              </Title>
              <div style={{
                padding: 16,
                background: '#fafafa',
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8
              }}>
                {job.job_description || '暂无职位描述'}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                <RiseOutlined /> 任职要求
              </Title>
              <div style={{
                padding: 16,
                background: '#fafafa',
                borderRadius: 8,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8
              }}>
                {job.requirements || '暂无任职要求'}
              </div>
            </div>
          </Card>

          <Card
            title={<><GiftOutlined /> 佣金等级说明</>}
            bordered={false}
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            <Table
              columns={tierColumns}
              dataSource={job.commission_tiers}
              rowKey="threshold"
              pagination={false}
              size="small"
            />
            <Alert
              type="info"
              showIcon
              message="佣金等级说明"
              description="佣金比例根据您的历史推荐成功率自动计算。成功推荐越多，佣金比例越高。"
              style={{ marginTop: 16 }}
            />
          </Card>

          <Card
            title={<><BankOutlined /> 分期发放明细</>}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <Table
              columns={installmentColumns}
              dataSource={job.installment_plan}
              rowKey="month"
              pagination={false}
              size="small"
            />
            <Alert
              type="warning"
              showIcon
              message="重要说明"
              description="佣金将在候选人通过相应试用期节点后自动发放至您的账户。如候选人在试用期内离职，后续佣金将不予发放。"
              style={{ marginTop: 16 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={<><UserSwitchOutlined /> 推荐候选人</>}
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
              {job.title} - {job.company_name}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              薪资: ¥{(job.salary_min / 10000).toFixed(1)}-{(job.salary_max / 10000).toFixed(1)}万/年
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>
              悬赏: <span className="reward-text">¥{job.reward_amount.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>选择候选人简历</div>
          {resumes.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="您还没有录入任何简历"
              description={<a onClick={() => navigate('/resumes')}>去录入简历 →</a>}
            />
          ) : (
            <Select
              placeholder="请选择要推荐的简历"
              style={{ width: '100%' }}
              value={selectedResume}
              onChange={setSelectedResume}
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {resumes.map(resume => (
                <Option key={resume.id} value={resume.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{resume.candidate_name}</span>
                      <span style={{ color: '#999', marginLeft: 8 }}>{resume.current_position}</span>
                    </div>
                    <span className="salary-text">
                      ¥{(resume.current_salary / 10000).toFixed(1)}万
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          )}
          {selectedResume && (
            <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 8, border: '1px solid #b7eb8f' }}>
              <div style={{ fontSize: 13, color: '#389e0d' }}>
                预计佣金: <span style={{ fontWeight: 600, fontSize: 16 }}>¥{estimatedCommission.toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                佣金将按分期计划发放，具体以实际入职情况为准
              </div>
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
              disabled={!selectedResume || resumes.length === 0}
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

export default JobDetail;
