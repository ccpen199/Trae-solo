import React, { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Button,
  Form,
  Select,
  Tag,
  Space,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  Progress,
  InputNumber,
  Tooltip,
  Popover,
  Divider,
  Modal,
  Steps,
  Descriptions
} from 'antd';
import {
  ReloadOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  GiftOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
  VideoCameraOutlined,
  SendOutlined,
  FileTextOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  RiseOutlined,
  StarOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;

interface CommissionInstallment {
  installment_number: number;
  total_installments: number;
  amount: number;
  trigger_condition: string;
  trigger_date: string;
  status: string;
  paid_at: string | null;
  txn_id: string | null;
}

interface InterviewInfo {
  round: number;
  interview_type: string;
  scheduled_at: string;
  interviewer: string;
  status: string;
  result: string;
}

interface ProbationFeedback {
  feedback_node: string;
  feedback_date: string;
  rating: number;
  comments: string;
  passed: number;
}

interface TransactionInfo {
  amount: number;
  status: string;
  txn_type: string;
  created_at: string;
}

interface Recommendation {
  id: number;
  resume_id: number;
  job_id: number;
  referrer_id: number;
  company_id: number;
  status: string;
  commission_rate: number;
  commission_amount: number;
  contract_hash: string;
  candidate_name: string;
  current_position: string;
  current_company: string;
  city: string;
  job_title: string;
  reward_amount: number;
  job_city: string;
  company_name: string;
  referrer_name: string;
  referrer_credit: number;
  referrer_exposure_weight: number;
  referrer_hit_rate: number;
  commission_tiers?: string;
  commission_installments?: string | CommissionInstallment[];
  latest_review_note?: string;
  latest_interview?: string | InterviewInfo | null;
  latest_probation_feedback?: string | ProbationFeedback | null;
  interview_count?: number;
  probation_feedback_count?: number;
  latest_transaction?: string | TransactionInfo | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  pending: number;
  interviewing: number;
  hired: number;
  completed: number;
  rejected: number;
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
}

const Recommendations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [minCredit, setMinCredit] = useState<number | undefined>();
  const [maxCredit, setMaxCredit] = useState<number | undefined>();
  const [minHitRate, setMinHitRate] = useState<number | undefined>();
  const [maxHitRate, setMaxHitRate] = useState<number | undefined>();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    interviewing: 0,
    hired: 0,
    completed: 0,
    rejected: 0,
    total_commission: 0,
    paid_commission: 0,
    pending_commission: 0
  });

  useEffect(() => {
    fetchRecommendations();
    fetchStats();
  }, [page, pageSize, statusFilter, minCredit, maxCredit, minHitRate, maxHitRate]);

  const fetchStats = async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (minCredit !== undefined) params.min_credit = minCredit;
      if (maxCredit !== undefined) params.max_credit = maxCredit;
      if (minHitRate !== undefined) params.min_hit_rate = minHitRate;
      if (maxHitRate !== undefined) params.max_hit_rate = maxHitRate;
      const response = await axios.get('/api/recommendations/stats', { params });
      setStats(response.data);
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        pageSize
      };
      if (statusFilter) params.status = statusFilter;
      if (minCredit !== undefined) params.min_credit = minCredit;
      if (maxCredit !== undefined) params.max_credit = maxCredit;
      if (minHitRate !== undefined) params.min_hit_rate = minHitRate;
      if (maxHitRate !== undefined) params.max_hit_rate = maxHitRate;
      const response = await axios.get('/api/recommendations', { params });
      setRecommendations(response.data.list || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      message.error('获取推荐列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleCreditFilterChange = () => {
    setPage(1);
  };

  const resetFilters = () => {
    setStatusFilter(undefined);
    setMinCredit(undefined);
    setMaxCredit(undefined);
    setMinHitRate(undefined);
    setMaxHitRate(undefined);
    setPage(1);
  };

  const parseJson = <T,>(data: string | T | null | undefined): T | null => {
    if (!data) return null;
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return null;
      }
    }
    return data;
  };

  const renderBusinessTimeline = (record: Recommendation) => {
    const steps = [
      { key: 'pending', title: '待审核', icon: <ClockCircleOutlined />, status: 'pending' },
      { key: 'reviewing', title: '审核中', icon: <AuditOutlined />, status: 'reviewing' },
      { key: 'interviewing', title: '面试中', icon: <VideoCameraOutlined />, status: 'interviewing' },
      { key: 'hired', title: '已录用', icon: <SendOutlined />, status: 'hired' },
      { key: 'probation', title: '试用期', icon: <FileTextOutlined />, status: 'probation' },
      { key: 'completed', title: '已完成', icon: <CheckCircleOutlined />, status: 'completed' }
    ];

    const statusOrder = ['pending', 'reviewing', 'interviewing', 'hired', 'probation', 'completed'];
    const currentIndex = statusOrder.indexOf(record.status);

    const interviewInfo = parseJson<InterviewInfo>(record.latest_interview);
    const probationInfo = parseJson<ProbationFeedback>(record.latest_probation_feedback);
    const reviewNote = record.latest_review_note ? parseJson<any>(record.latest_review_note) : null;

    const getStepDetails = (step: typeof steps[0]) => {
      if (step.key === 'reviewing' && reviewNote) {
        return `审核意见: ${reviewNote.comments || '已审核'}`;
      }
      if (step.key === 'interviewing' && interviewInfo) {
        return `${interviewInfo.interview_type} · ${interviewInfo.interviewer} · ${dayjs(interviewInfo.scheduled_at).format('MM-DD HH:mm')}`;
      }
      if (step.key === 'probation' && probationInfo) {
        return `第${probationInfo.feedback_node} · 评分${probationInfo.rating}分 · ${probationInfo.passed ? '通过' : '待改进'}`;
      }
      if (step.key === 'hired') {
        return record.interview_count ? `共${record.interview_count}轮面试` : null;
      }
      return null;
    };

    const content = (
      <div style={{ minWidth: 320, padding: 8 }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong>业务流转节点</Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {steps.map((step, index) => {
            const isActive = currentIndex >= index;
            const isCurrent = currentIndex === index;
            const details = getStepDetails(step);
            return (
              <div key={step.key} style={{ flex: 1, textAlign: 'center', minWidth: 45 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#1677ff' : '#f0f0f0',
                    color: isActive ? '#fff' : '#bfbfbf',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 4px',
                    fontSize: 12,
                    border: isCurrent ? '2px solid #1677ff' : 'none',
                    boxShadow: isCurrent ? '0 0 0 3px rgba(22, 119, 255, 0.1)' : 'none'
                  }}
                >
                  {step.icon}
                </div>
                <div style={{ fontSize: 11, color: isActive ? '#1677ff' : '#bfbfbf', marginBottom: 4 }}>
                  {step.title}
                </div>
                {details && (
                  <div style={{ fontSize: 10, color: '#666', lineHeight: 1.4 }}>
                    {details}
                  </div>
                )}
                {index < steps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: '50%',
                      width: '100%',
                      height: 2,
                      backgroundColor: isActive ? '#1677ff' : '#f0f0f0',
                      zIndex: -1
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        {record.status === 'rejected' && (
          <div style={{ marginTop: 8, padding: 8, backgroundColor: '#fff2f0', borderRadius: 4, fontSize: 12, color: '#ff4d4f' }}>
            <CloseCircleOutlined style={{ marginRight: 4 }} />
            已拒绝: {reviewNote?.comments || '未填写原因'}
          </div>
        )}
      </div>
    );

    return (
      <Popover content={content} title={null} trigger="hover" placement="bottomLeft">
        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Steps
            size="small"
            current={currentIndex}
            direction="horizontal"
            items={steps.map(s => ({ title: '' }))}
            style={{ flex: 1, minWidth: 150 }}
          />
          <InfoCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
        </div>
      </Popover>
    );
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
      reviewing: { color: 'blue', text: '审核中', icon: <ClockCircleOutlined /> },
      interviewing: { color: 'cyan', text: '面试中', icon: <UserOutlined /> },
      hired: { color: 'green', text: '已录用', icon: <CheckCircleOutlined /> },
      probation: { color: 'geekblue', text: '试用期', icon: <ClockCircleOutlined /> },
      completed: { color: 'purple', text: '已完成', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined /> },
      candidate_withdrew: { color: 'default', text: '候选人放弃', icon: <CloseCircleOutlined /> }
    };
    const s = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={s.color} icon={s.icon}>
        {s.text}
      </Tag>
    );
  };

  const getCreditClass = (score: number) => {
    if (score >= 80) return 'credit-score-good';
    if (score >= 60) return 'credit-score-medium';
    return 'credit-score-low';
  };

  const getHitRateColor = (rate: number) => {
    if (rate >= 50) return '#52c41a';
    if (rate >= 30) return '#fa8c16';
    return '#ff4d4f';
  };

  const getExposureWeightColor = (weight: number) => {
    if (weight >= 1.5) return '#722ed1';
    if (weight >= 1.0) return '#1677ff';
    return '#8c8c8c';
  };

  const renderActionButtons = (record: Recommendation) => {
    const isCompany = user?.role === 'company' || user?.role === 'admin';
    const isUser = user?.role === 'user';
    const buttons: React.ReactNode[] = [];

    buttons.push(
      <Button
        key="detail"
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/recommendations/${record.id}`)}
      >
        详情
      </Button>
    );

    if (isCompany) {
      if (record.status === 'pending' || record.status === 'reviewing') {
        buttons.push(
          <Button
            key="review"
            type="link"
            size="small"
            icon={<AuditOutlined />}
            onClick={() => navigate(`/recommendations/${record.id}?action=review`)}
            style={{ color: '#1677ff' }}
          >
            审核
          </Button>
        );
      }
      if (record.status === 'reviewing' || record.status === 'interviewing') {
        buttons.push(
          <Button
            key="interview"
            type="link"
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={() => navigate(`/recommendations/${record.id}?action=interview`)}
            style={{ color: '#13c2c2' }}
          >
            面试
          </Button>
        );
      }
      if (record.status === 'interviewing') {
        buttons.push(
          <Button
            key="offer"
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => navigate(`/recommendations/${record.id}?action=offer`)}
            style={{ color: '#52c41a' }}
          >
            Offer
          </Button>
        );
      }
      if (record.status === 'probation') {
        buttons.push(
          <Button
            key="probation"
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/recommendations/${record.id}?action=probation`)}
            style={{ color: '#722ed1' }}
          >
            试用期
          </Button>
        );
      }
    }

    return <Space size={4}>{buttons}</Space>;
  };

  const renderCommissionInfo = (record: Recommendation) => {
    const tiers = record.commission_tiers ? JSON.parse(record.commission_tiers) : null;
    const installments = parseJson<CommissionInstallment[]>(record.commission_installments) || [];
    const transaction = parseJson<TransactionInfo>(record.latest_transaction);

    const tierList = Array.isArray(tiers) ? tiers : [
      { threshold: 1, rate: 0.08 },
      { threshold: 3, rate: 0.10 },
      { threshold: 5, rate: 0.12 }
    ];

    const getInstallmentStatusColor = (status: string) => {
      switch (status) {
        case 'paid': return '#52c41a';
        case 'pending': return '#faad14';
        case 'overdue': return '#ff4d4f';
        default: return '#8c8c8c';
      }
    };

    const getInstallmentStatusText = (status: string) => {
      switch (status) {
        case 'paid': return '已发放';
        case 'pending': return '待发放';
        case 'overdue': return '已逾期';
        default: return status;
      }
    };

    const paidAmount = installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const pendingAmount = installments.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    const progress = record.commission_amount > 0 ? Math.round((paidAmount / record.commission_amount) * 100) : 0;

    const content = (
      <div style={{ minWidth: 380 }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong>佣金计算与发放明细</Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />

        <Row gutter={[16, 8]} style={{ marginBottom: 8 }}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>职位赏金</Text>
            <div style={{ fontWeight: 600 }}>¥{record.reward_amount?.toLocaleString()}</div>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>佣金比例</Text>
            <div style={{ fontWeight: 600, color: '#1677ff' }}>{(record.commission_rate * 100).toFixed(0)}%</div>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>佣金总额</Text>
            <div style={{ fontWeight: 600, color: '#722ed1', fontSize: 16 }}>¥{record.commission_amount?.toLocaleString()}</div>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 12 }}>发放进度</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Progress percent={progress} size="small" style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 600 }}>{progress}%</span>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0' }} />
        <div style={{ marginBottom: 6 }}>
          <Text strong style={{ fontSize: 13 }}>阶梯分佣规则</Text>
        </div>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 8, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
          {tierList.map((tier: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>成功推荐 ≥{tier.threshold || idx * 3 + 1}人</span>
              <span style={{ color: '#1677ff', fontWeight: 600 }}>{(tier.rate * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>

        {installments.length > 0 && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13 }}>分期发放计划</Text>
            </div>
            <div style={{ fontSize: 12 }}>
              {installments.map((inst, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', backgroundColor: idx % 2 === 0 ? '#fafafa' : 'transparent', borderRadius: 4, marginBottom: 2 }}>
                  <div>
                    <span style={{ marginRight: 8 }}>第{inst.installment_number}/{inst.total_installments}期</span>
                    <span style={{ color: '#8c8c8c' }}>{inst.trigger_condition}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>¥{inst.amount.toLocaleString()}</div>
                    <Tag color={getInstallmentStatusColor(inst.status)} style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                      {getInstallmentStatusText(inst.status)}
                    </Tag>
                    <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>{inst.trigger_date}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {transaction && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13 }}>最近交易流水</Text>
            </div>
            <div style={{ fontSize: 12, padding: 8, backgroundColor: '#f6ffed', borderRadius: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#8c8c8c' }}>{transaction.txn_type}</span>
                <span style={{ fontWeight: 600, color: '#52c41a' }}>¥{transaction.amount.toLocaleString()}</span>
              </div>
              <div style={{ color: '#8c8c8c', marginTop: 2 }}>{dayjs(transaction.created_at).format('YYYY-MM-DD HH:mm')}</div>
            </div>
          </>
        )}

        {record.contract_hash && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace', wordBreak: 'break-all', padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
              <div style={{ marginBottom: 4, color: '#1677ff' }}>📄 分佣协议区块链存证:</div>
              {record.contract_hash.substring(0, 32)}...
            </div>
          </>
        )}

        <Divider style={{ margin: '8px 0' }} />
        <Row gutter={[8, 0]} style={{ fontSize: 12, color: '#666' }}>
          <Col span={8}>
            <div style={{ color: '#52c41a' }}>已发放: ¥{paidAmount.toLocaleString()}</div>
          </Col>
          <Col span={8}>
            <div style={{ color: '#faad14' }}>待发放: ¥{pendingAmount.toLocaleString()}</div>
          </Col>
          <Col span={8}>
            <div style={{ color: '#8c8c8c' }}>合计: ¥{record.commission_amount?.toLocaleString()}</div>
          </Col>
        </Row>
      </div>
    );

    return (
      <Popover content={content} title={null} trigger="hover" placement="bottomLeft">
        <div style={{ cursor: 'pointer' }}>
          <div style={{ color: '#722ed1', fontSize: 15, fontWeight: 600 }}>
            ¥{record.commission_amount?.toLocaleString()}
            <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 12, color: '#8c8c8c' }} />
          </div>
          {installments.length > 0 && (
            <Progress percent={progress} size="small" showInfo={false} style={{ marginTop: 4, width: 80 }} />
          )}
        </div>
      </Popover>
    );
  };

  const renderCredibilityInfo = (record: Recommendation) => {
    const content = (
      <div style={{ minWidth: 260 }}>
        <div style={{ marginBottom: 8 }}>
          <Text strong>{record.referrer_name} 的可信度指标</Text>
        </div>
        <Divider style={{ margin: '8px 0' }} />
        <Row gutter={[8, 8]}>
          <Col span={12}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              <StarOutlined style={{ color: '#faad14', marginRight: 4 }} />
              信用评分
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: getHitRateColor(record.referrer_credit) }}>
              {record.referrer_credit}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              <RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              推荐命中率
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: getHitRateColor(record.referrer_hit_rate) }}>
              {record.referrer_hit_rate}%
            </div>
          </Col>
          <Col span={24}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
              <ThunderboltOutlined style={{ color: '#722ed1', marginRight: 4 }} />
              曝光权重 (影响推荐排序)
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: getExposureWeightColor(record.referrer_exposure_weight) }}>
              {record.referrer_exposure_weight?.toFixed(2)}x
            </div>
            <Progress
              percent={Math.min((record.referrer_exposure_weight / 3) * 100, 100)}
              size="small"
              showInfo={false}
              strokeColor={{
                '0%': '#1677ff',
                '100%': '#722ed1'
              }}
              style={{ marginTop: 4 }}
            />
          </Col>
        </Row>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
          • 信用评分影响曝光权重和佣金比例<br />
          • 命中率 = 成功入职数 / 总推荐数<br />
          • 曝光权重越高，推荐越靠前
        </div>
      </div>
    );
    return (
      <Popover content={content} title={null} trigger="hover">
        <div style={{ cursor: 'pointer' }}>
          <div style={{ fontWeight: 500 }}>{record.referrer_name}</div>
          <Space size={8} style={{ fontSize: 12 }}>
            <span className={getCreditClass(record.referrer_credit)}>
              信用: {record.referrer_credit}
            </span>
            <span style={{ color: getHitRateColor(record.referrer_hit_rate) }}>
              命中: {record.referrer_hit_rate}%
            </span>
          </Space>
        </div>
      </Popover>
    );
  };

  const columns = [
    {
      title: '候选人',
      key: 'candidate',
      width: 160,
      fixed: 'left' as const,
      render: (_: any, record: Recommendation) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.candidate_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.current_position}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.current_company}</div>
        </div>
      )
    },
    {
      title: '目标职位',
      key: 'job',
      width: 180,
      render: (_: any, record: Recommendation) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.job_title}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.company_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.job_city}</div>
        </div>
      )
    },
    {
      title: '推荐人 / 可信度',
      key: 'referrer',
      width: 160,
      render: (_: any, record: Recommendation) => renderCredibilityInfo(record)
    },
    {
      title: '职位赏金',
      dataIndex: 'reward_amount',
      key: 'reward_amount',
      width: 110,
      render: (val: number) => <span className="reward-text">¥{val?.toLocaleString()}</span>
    },
    {
      title: '佣金比例',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      width: 90,
      render: (val: number) => <span style={{ color: '#1677ff', fontWeight: 500 }}>{(val * 100).toFixed(0)}%</span>
    },
    {
      title: '佣金金额 (点击查看明细)',
      key: 'commission_amount',
      width: 180,
      render: (_: any, record: Recommendation) => renderCommissionInfo(record)
    },
    {
      title: '业务流转节点',
      key: 'business_timeline',
      width: 200,
      render: (_: any, record: Recommendation) => renderBusinessTimeline(record)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '推荐时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Recommendation) => renderActionButtons(record)
    }
  ];

  const statusOptions = [
    { label: '全部', value: undefined },
    { label: '待审核', value: 'pending' },
    { label: '审核中', value: 'reviewing' },
    { label: '面试中', value: 'interviewing' },
    { label: '已录用', value: 'hired' },
    { label: '试用期', value: 'probation' },
    { label: '已完成', value: 'completed' },
    { label: '已拒绝', value: 'rejected' },
    { label: '候选人放弃', value: 'candidate_withdrew' }
  ];

  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const commissionProgress = stats.total_commission > 0 ? Math.round((stats.paid_commission / stats.total_commission) * 100) : 0;

  const handleHitRateFilterChange = () => {
    setPage(1);
  };

  const filterContent = (
    <div style={{ width: 360, padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>可信度与绩效筛选</Text>
      </div>
      <Divider style={{ margin: '8px 0' }} />
      <Form layout="vertical" size="small">
        <Row gutter={[8, 0]}>
          <Col span={12}>
            <Form.Item label="最小信用分" style={{ marginBottom: 12 }}>
              <InputNumber
                min={0}
                max={100}
                value={minCredit}
                onChange={(value) => setMinCredit(value ?? undefined)}
                onBlur={handleCreditFilterChange}
                style={{ width: '100%' }}
                placeholder="0-100"
                size="small"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="最大信用分" style={{ marginBottom: 12 }}>
              <InputNumber
                min={0}
                max={100}
                value={maxCredit}
                onChange={(value) => setMaxCredit(value ?? undefined)}
                onBlur={handleCreditFilterChange}
                style={{ width: '100%' }}
                placeholder="0-100"
                size="small"
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '4px 0' }} />
        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
          <RiseOutlined style={{ marginRight: 4 }} />
          推荐命中率筛选
        </div>
        <Row gutter={[8, 0]}>
          <Col span={12}>
            <Form.Item label="最小命中率 (%)" style={{ marginBottom: 12 }}>
              <InputNumber
                min={0}
                max={100}
                value={minHitRate}
                onChange={(value) => setMinHitRate(value ?? undefined)}
                onBlur={handleHitRateFilterChange}
                style={{ width: '100%' }}
                placeholder="0-100"
                size="small"
                addonAfter="%"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="最大命中率 (%)" style={{ marginBottom: 12 }}>
              <InputNumber
                min={0}
                max={100}
                value={maxHitRate}
                onChange={(value) => setMaxHitRate(value ?? undefined)}
                onBlur={handleHitRateFilterChange}
                style={{ width: '100%' }}
                placeholder="0-100"
                size="small"
                addonAfter="%"
              />
            </Form.Item>
          </Col>
        </Row>
        <Divider style={{ margin: '4px 0' }} />
        <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 8, lineHeight: 1.6 }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          • 信用分影响曝光权重和佣金比例<br />
          • 命中率 = 成功入职数 / 总推荐数<br />
          • 筛选后统计数据自动同步更新
        </div>
        <div style={{ textAlign: 'right' }}>
          <Button size="small" onClick={resetFilters}>重置所有筛选</Button>
        </div>
      </Form>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>推荐管理</Title>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} lg={4}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="总推荐数"
              value={stats.total}
              prefix={<UserSwitchOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="面试中"
              value={stats.interviewing}
              prefix={<VideoCameraOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="已成功"
              value={stats.completed}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="累计佣金"
              value={stats.total_commission}
              formatter={(val) => `¥${Number(val).toLocaleString()}`}
              prefix={<GiftOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                发放进度: {stats.paid_commission.toLocaleString()} / {stats.total_commission.toLocaleString()}
              </div>
              <Progress
                percent={commissionProgress}
                size="small"
                showInfo={false}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#722ed1'
                }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} lg={4}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title="待发佣金"
              value={stats.pending_commission}
              formatter={(val) => `¥${Number(val).toLocaleString()}`}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={6}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              推荐成功率
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress
                percent={successRate}
                size="small"
                style={{ flex: 1 }}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#13c2c2'
                }}
              />
              <span style={{ fontWeight: 600, color: '#52c41a' }}>{successRate}%</span>
            </div>
          </Col>
          <Col xs={24} md={18}>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
              筛选条件
            </div>
            <Space wrap size={[8, 8]}>
              <Space>
                {statusOptions.map(opt => (
                  <Tag.CheckableTag
                    key={opt.value || 'all'}
                    checked={statusFilter === opt.value}
                    onChange={() => handleStatusChange(opt.value)}
                    style={{ cursor: 'pointer' }}
                  >
                    {opt.label}
                  </Tag.CheckableTag>
                ))}
              </Space>
              <Select
                placeholder="状态筛选"
                style={{ width: 140 }}
                value={statusFilter}
                onChange={handleStatusChange}
                allowClear
              >
                {statusOptions.slice(1).map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
              <Popover content={filterContent} title={null} trigger="click" placement="bottomLeft">
                <Button icon={<FilterOutlined />}>
                  高级筛选
                  {(minCredit !== undefined || maxCredit !== undefined || minHitRate !== undefined || maxHitRate !== undefined) && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>已设置</Tag>
                  )}
                </Button>
              </Popover>
              <Button icon={<ReloadOutlined />} onClick={() => { fetchRecommendations(); fetchStats(); }}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={recommendations}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            }
          }}
        />
      </Card>
    </div>
  );
};

export default Recommendations;
