import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Progress,
  Row,
  Col,
  Statistic,
  Timeline,
  Modal,
  Select,
  Space,
  Typography,
  Divider,
  message,
  Spin,
  Alert,
  Table,
  Rate,
  DatePicker,
  Form,
  Input,
  Tabs,
  InputNumber,
  Empty,
  Steps
} from 'antd';
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  SafetyOutlined,
  GiftOutlined,
  BankOutlined,
  CalendarOutlined,
  SendOutlined,
  LinkOutlined,
  EditOutlined,
  FileTextOutlined,
  RiseOutlined,
  EyeOutlined,
  PlusOutlined,
  UserSwitchOutlined,
  HistoryOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const parseSafeJson = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return (value as T) ?? fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const money = (value: unknown): string => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '0';
};

const annualSalaryText = (value: unknown): string => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? (numeric / 10000).toFixed(1) : '0.0';
};

interface RecommendationDetail {
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
  portrait_tags: string[];
  job_title: string;
  reward_amount: number;
  commission_tiers: any[];
  installment_plan: any[];
  probation_months: number;
  company_name: string;
  industry: string;
  referrer_name: string;
  referrer_phone: string;
  referrer_email: string;
  referrer_credit: number;
  referrer_exposure: number;
  created_at: string;
  updated_at: string;
  commission_plans: CommissionPlan[];
  interviews: Interview[];
  probation_feedbacks: ProbationFeedback[];
  blockchain_record: BlockchainRecord | null;
  feedback_nodes?: string[];
}

interface CommissionPlan {
  id: number;
  installment_number: number;
  total_installments: number;
  amount: number;
  trigger_condition: string;
  trigger_date: string;
  status: string;
  paid_at: string;
  txn_id: string;
}

interface Interview {
  id: number;
  round: number;
  interview_type: string;
  scheduled_at: string;
  interviewer: string;
  webrtc_room: string;
  status: string;
  feedback: string;
  result: string;
  ai_summary: string;
}

interface ProbationFeedback {
  id: number;
  feedback_node: string;
  feedback_date: string;
  rating: number;
  comments: string;
  passed: number;
  created_by: string;
  created_at: string;
}

interface BlockchainRecord {
  id: number;
  contract_type: string;
  reference_id: number;
  block_hash: string;
  transaction_hash: string;
  data: any;
  created_at: string;
}

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  resource_type: string;
  resource_id: number;
  ip: string;
  details: any;
  created_at: string;
  operator_name: string;
  operator_role: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  status: string;
  from_user_id: number;
  to_user_id: number;
  from_user_name: string;
  to_user_name: string;
  recommendation_id: number;
  commission_plan_id: number;
  txn_id: string;
  remark: string;
  created_at: string;
}

interface ReferrerStats {
  total_recommendations: number;
  success_hires: number;
  hit_rate: number;
}

const RecommendationDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newStatus, setNewStatus] = useState<string>('');
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [statusForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();
  const [interviewForm] = Form.useForm();
  const [offerForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  useEffect(() => {
    if (!loading && detail && !initializedRef.current) {
      initializedRef.current = true;
      const action = searchParams.get('action');
      const hash = location.hash;
      
      if (action === 'review' && (detail.status === 'pending' || detail.status === 'reviewing')) {
        setReviewModalVisible(true);
      } else if (action === 'interview' && (detail.status === 'reviewing' || detail.status === 'interviewing')) {
        setInterviewModalVisible(true);
      } else if (action === 'offer' && detail.status === 'interviewing') {
        setOfferModalVisible(true);
      } else if (action === 'probation' && (detail.status === 'probation' || detail.status === 'hired')) {
        setFeedbackModalVisible(true);
      }
      
      if (hash === '#transactions') {
        setActiveTab('funding');
      }
    }
  }, [loading, detail, searchParams, location.hash]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/recommendations/${id}`);
      setDetail(response.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取推荐详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (values: any) => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await axios.post(`/api/recommendations/${id}/status`, {
        status: newStatus,
        feedback: values.feedback
      });
      message.success('状态更新成功');
      setStatusModalVisible(false);
      statusForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (values: any) => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await axios.post(`/api/recommendations/${detail.id}/probation-feedback`, {
        feedback_node: values.feedback_node,
        feedback_date: values.feedback_date.format('YYYY-MM-DD'),
        rating: values.rating,
        comments: values.comments,
        passed: values.passed
      });
      message.success('反馈提交成功');
      setFeedbackModalVisible(false);
      feedbackForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInterviewSchedule = async (values: any) => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await axios.post('/api/im/interview/schedule', {
        recommendation_id: detail.id,
        candidate_id: detail.candidate_id || detail.resume_id,
        interviewer_id: values.interviewer_id,
        round: values.round,
        interview_type: values.interview_type,
        scheduled_at: values.scheduled_at.format('YYYY-MM-DD HH:mm:00'),
        duration: values.duration
      });
      message.success('面试预约成功');
      setInterviewModalVisible(false);
      interviewForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOfferSend = async (values: any) => {
    if (!detail) return;
    try {
      setSubmitting(true);
      await axios.post(`/api/recommendations/${detail.id}/status`, {
        status: 'hired',
        feedback: JSON.stringify({
          offer_salary: values.offer_salary,
          entry_date: values.entry_date?.format('YYYY-MM-DD'),
          benefits: values.benefits,
          other_terms: values.other_terms
        })
      });
      message.success('Offer已发送，状态更新为已录用');
      setOfferModalVisible(false);
      offerForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewSubmit = async (values: any) => {
    if (!detail) return;
    try {
      setSubmitting(true);
      const targetStatus = values.review_result === 'pass' ? 'reviewing' : 'rejected';
      await axios.post(`/api/recommendations/${detail.id}/status`, {
        status: targetStatus,
        feedback: values.review_comments
      });
      message.success(values.review_result === 'pass' ? '审核通过，进入下一阶段' : '已拒绝推荐');
      setReviewModalVisible(false);
      reviewForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewSummary = (interview: any) => {
    setSelectedInterview(interview);
    setSummaryModalVisible(true);
  };

  const handleJoinVideo = (interview: any) => {
    navigate(`/im?room=${interview.webrtc_room}&interview=${interview.id}`);
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { color: string; text: string; icon: React.ReactNode; dotColor: string }> = {
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined />, dotColor: '#fa8c16' },
      reviewing: { color: 'blue', text: '审核中', icon: <ClockCircleOutlined />, dotColor: '#1890ff' },
      interviewing: { color: 'cyan', text: '面试中', icon: <UserOutlined />, dotColor: '#13c2c2' },
      hired: { color: 'green', text: '已录用', icon: <CheckCircleOutlined />, dotColor: '#52c41a' },
      probation: { color: 'geekblue', text: '试用期', icon: <ClockCircleOutlined />, dotColor: '#2f54eb' },
      completed: { color: 'purple', text: '已完成', icon: <CheckCircleOutlined />, dotColor: '#722ed1' },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseCircleOutlined />, dotColor: '#ff4d4f' },
      candidate_withdrew: { color: 'default', text: '候选人放弃', icon: <CloseCircleOutlined />, dotColor: '#8c8c8c' }
    };
    return statusMap[status] || { color: 'default', text: status, icon: null, dotColor: '#999' };
  };

  const getValidStatusTransitions = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      pending: ['reviewing', 'rejected'],
      reviewing: ['interviewing', 'rejected'],
      interviewing: ['hired', 'rejected', 'candidate_withdrew'],
      hired: ['probation', 'candidate_withdrew'],
      probation: ['completed', 'candidate_withdrew'],
      completed: [],
      rejected: [],
      candidate_withdrew: []
    };
    return transitions[currentStatus] || [];
  };

  const getTimelineItems = (status: string) => {
    const allStatuses = [
      { status: 'pending', title: '提交推荐', description: '推荐记录已创建' },
      { status: 'reviewing', title: '审核中', description: '企业正在审核简历' },
      { status: 'interviewing', title: '面试中', description: '候选人参与面试' },
      { status: 'hired', title: '已录用', description: '候选人已接受offer' },
      { status: 'probation', title: '试用期', description: '候选人入职试用' },
      { status: 'completed', title: '已完成', description: '推荐成功，佣金已发放' }
    ];

    const statusOrder = ['pending', 'reviewing', 'interviewing', 'hired', 'probation', 'completed'];
    const currentIndex = statusOrder.indexOf(status);

    if (status === 'rejected' || status === 'candidate_withdrew') {
      return [
        ...allStatuses.slice(0, Math.max(currentIndex, 0)).map((item, idx) => ({
          ...item,
          done: true,
          current: false
        })),
        {
          status,
          title: status === 'rejected' ? '已拒绝' : '候选人放弃',
          description: status === 'rejected' ? '推荐未通过' : '候选人主动放弃',
          done: true,
          current: true
        }
      ];
    }

    return allStatuses.map((item, idx) => ({
      ...item,
      done: idx <= currentIndex,
      current: idx === currentIndex
    }));
  };

  const planColumns = [
    {
      title: '期数',
      dataIndex: 'installment_number',
      key: 'installment_number',
      render: (val: number, record: CommissionPlan) => `第${val}期 / 共${record.total_installments}期`
    },
    {
      title: '发放金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => <span className="reward-text">¥{val.toLocaleString()}</span>
    },
    {
      title: '触发条件',
      dataIndex: 'trigger_condition',
      key: 'trigger_condition'
    },
    {
      title: '预计日期',
      dataIndex: 'trigger_date',
      key: 'trigger_date',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        if (val === 'paid') return <Tag color="green">已发放</Tag>;
        return <Tag color="orange">待发放</Tag>;
      }
    },
    {
      title: '发放日期',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '交易流水号',
      dataIndex: 'txn_id',
      key: 'txn_id',
      render: (val: string) => val 
        ? <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#666' }}>{val}</span>
        : '-'
    },
    {
      title: '支付凭证',
      key: 'voucher',
      render: (_: any, record: CommissionPlan) => {
        if (record.status === 'paid') {
          return (
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {
                const txn = detail?.transactions?.find((t: Transaction) => t.commission_plan_id === record.id);
                if (txn) {
                  Modal.success({
                    title: '支付凭证',
                    content: (
                      <div style={{ padding: 16 }}>
                        <Descriptions bordered column={1} size="small">
                          <Descriptions.Item label="交易流水号"><span style={{ fontFamily: 'monospace' }}>{txn.txn_id}</span></Descriptions.Item>
                          <Descriptions.Item label="支付金额">¥{txn.amount.toLocaleString()}</Descriptions.Item>
                          <Descriptions.Item label="支付时间">{dayjs(txn.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                          <Descriptions.Item label="付款方">{txn.from_user_name}</Descriptions.Item>
                          <Descriptions.Item label="收款方">{txn.to_user_name}</Descriptions.Item>
                          <Descriptions.Item label="支付渠道">支付宝监管账户</Descriptions.Item>
                          <Descriptions.Item label="备注">{txn.remark}</Descriptions.Item>
                        </Descriptions>
                      </div>
                    )
                  });
                } else {
                  message.info('支付凭证正在生成中...');
                }
              }}
            >
              查看凭证
            </Button>
          );
        }
        return '-';
      }
    }
  ];

  const interviewColumns = [
    {
      title: '轮次',
      dataIndex: 'round',
      key: 'round',
      render: (val: number) => `第${val}轮`
    },
    {
      title: '类型',
      dataIndex: 'interview_type',
      key: 'interview_type',
      render: (val: string) => val === 'video' ? '视频面试' : '现场面试'
    },
    {
      title: '时间',
      dataIndex: 'scheduled_at',
      key: 'scheduled_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '面试官',
      dataIndex: 'interviewer',
      key: 'interviewer'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const map: Record<string, string> = {
          scheduled: '已排期', active: '进行中', completed: '已完成', passed: '通过', failed: '未通过'
        };
        return <Tag color={val === 'passed' ? 'green' : val === 'failed' ? 'red' : 'blue'}>{map[val] || val}</Tag>;
      }
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (val: string) => {
        if (!val) return '-';
        return val === 'pass' ? <Tag color="green">通过</Tag> : <Tag color="red">未通过</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Interview) => (
        <Space size={4} wrap>
          {record.status === 'scheduled' && (
            <Button 
              type="primary"
              size="small" 
              icon={<VideoCameraOutlined />}
              onClick={() => handleJoinVideo(record)}
            >
              加入视频
            </Button>
          )}
          {record.ai_summary && (
            <Button 
              type="link" 
              size="small" 
              icon={<FileTextOutlined />}
              onClick={() => handleViewSummary(record)}
            >
              查看纪要
            </Button>
          )}
        </Space>
      )
    }
  ];

  const feedbackColumns = [
    {
      title: '反馈节点',
      dataIndex: 'feedback_node',
      key: 'feedback_node'
    },
    {
      title: '反馈日期',
      dataIndex: 'feedback_date',
      key: 'feedback_date',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD')
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      render: (val: number) => <Rate disabled value={val} allowHalf />
    },
    {
      title: '评价',
      dataIndex: 'comments',
      key: 'comments'
    },
    {
      title: '是否通过',
      dataIndex: 'passed',
      key: 'passed',
      render: (val: number) => val ? <Tag color="green">通过</Tag> : <Tag color="red">未通过</Tag>
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return <Alert message="推荐记录不存在" type="error" />;
  }

  const statusInfo = getStatusInfo(detail.status);
  const timelineItems = getTimelineItems(detail.status);
  const validTransitions = getValidStatusTransitions(detail.status);
  const canUpdateStatus = (user?.role === 'company' || user?.role === 'admin') && validTransitions.length > 0;
  const canAddFeedback = (user?.role === 'company' || user?.role === 'admin') &&
    (detail.status === 'probation' || detail.status === 'hired');

  const getFullTimelineData = () => {
    const items: any[] = [];
    
    if (detail?.audit_logs?.length > 0) {
      detail.audit_logs.forEach((log: AuditLog) => {
        const details = parseSafeJson<Record<string, any>>(log.details, {});
        let title = log.action;
        let description = '';
        
        if (log.action === 'create_recommendation') {
          title = '创建推荐';
          description = `创建推荐记录，佣金 ¥${money(details.commission_amount)}`;
        } else if (log.action === 'update_recommendation_status') {
          const statusText: Record<string, string> = {
            pending: '待审核', reviewing: '审核中', interviewing: '面试中',
            hired: '已录用', probation: '试用期', completed: '已完成',
            rejected: '已拒绝', candidate_withdrew: '候选人放弃'
          };
          title = `状态变更：${statusText[details.old_status] || details.old_status} → ${statusText[details.new_status] || details.new_status}`;
          description = details.feedback || '更新推荐状态';
        }
        
        items.push({
          color: '#1677ff',
          children: (
            <div>
              <div style={{ fontWeight: 500 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>{description}</div>
              <div style={{ fontSize: 11, color: '#bbb' }}>
                操作人：{log.operator_name}（{log.operator_role}）· {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
          )
        });
      });
    }
    
    if (items.length === 0) {
      return timelineItems.map((item, idx) => {
        const isCurrent = item.status === detail?.status;
        const isDone = item.done;
        return {
          color: isCurrent ? statusInfo.dotColor : isDone ? '#52c41a' : '#d9d9d9',
          dot: isCurrent ? statusInfo.icon : undefined,
          children: (
            <div>
              <div style={{ fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#1677ff' : undefined }}>
                {item.title}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                {item.description}
              </div>
            </div>
          )
        };
      });
    }
    
    return items;
  };

  const getExposureImpactAnalysis = () => {
    const stats = detail?.referrer_stats;
    if (!stats) return null;
    
    let impactLevel = '正常';
    let impactColor = '#52c41a';
    let impactDesc = '当前信用分和命中率处于行业平均水平，曝光权重正常';
    
    if (stats.hit_rate >= 30 && detail.referrer_credit >= 80) {
      impactLevel = '优秀';
      impactColor = '#1677ff';
      impactDesc = '高命中率+高信用分，获得 150% 曝光权重加成，推荐优先展示';
    } else if (stats.hit_rate >= 20 && detail.referrer_credit >= 60) {
      impactLevel = '良好';
      impactColor = '#52c41a';
      impactDesc = '信用和命中率良好，获得 110% 曝光权重加成';
    } else if (stats.hit_rate < 10 || detail.referrer_credit < 50) {
      impactLevel = '待提升';
      impactColor = '#fa8c16';
      impactDesc = '命中率或信用分偏低，曝光权重降低至 60%，建议提升推荐质量';
    }
    
    return { impactLevel, impactColor, impactDesc };
  };

  const timelineData = getFullTimelineData();
  const exposureAnalysis = getExposureImpactAnalysis();

  const canReview = (user?.role === 'company' || user?.role === 'admin') && 
    (detail.status === 'pending' || detail.status === 'reviewing');
  const canScheduleInterview = (user?.role === 'company' || user?.role === 'admin') &&
    (detail.status === 'reviewing' || detail.status === 'interviewing');
  const canSendOffer = (user?.role === 'company' || user?.role === 'admin') &&
    detail.status === 'interviewing';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/recommendations')}
          type="text"
        >
          返回列表
        </Button>
        <div style={{ flex: 1 }}>
          <Title level={3} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            推荐详情 #{detail.id}
            <Tag color={statusInfo.color} icon={statusInfo.icon}>
              {statusInfo.text}
            </Tag>
          </Title>
        </div>
        <Space wrap>
          {canReview && (
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setReviewModalVisible(true)}
            >
              企业审核
            </Button>
          )}
          {canScheduleInterview && (
            <Button 
              icon={<CalendarOutlined />}
              onClick={() => setInterviewModalVisible(true)}
            >
              预约面试
            </Button>
          )}
          {canSendOffer && (
            <Button 
              type="primary"
              icon={<SendOutlined />}
              onClick={() => setOfferModalVisible(true)}
            >
              发送Offer
            </Button>
          )}
          {canUpdateStatus && (
            <Button onClick={() => setStatusModalVisible(true)}>
              状态变更
            </Button>
          )}
          {canAddFeedback && (
            <Button type="primary" onClick={() => setFeedbackModalVisible(true)}>
              试用期反馈
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card
            title="推荐进度时间线"
            bordered={false}
            style={{ borderRadius: 12 }}
            extra={<Button type="link" size="small" icon={<HistoryOutlined />}>查看完整日志</Button>}
          >
            <Timeline
              mode="left"
              items={timelineData}
              style={{ maxHeight: 500, overflowY: 'auto' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <Title level={5} style={{ marginTop: 0, marginBottom: 16 }}>推荐状态闭环</Title>
            <Steps
              current={['pending', 'reviewing', 'interviewing', 'hired', 'probation', 'completed'].indexOf(detail.status)}
              size="small"
              items={[
                { title: '创建推荐', status: 'finish', icon: <UserSwitchOutlined />, description: '提交简历' },
                { title: '企业审核', status: detail.status === 'pending' ? 'process' : 'finish', icon: <EditOutlined />, description: 'HR审核' },
                { title: '面试安排', status: ['interviewing', 'hired', 'probation', 'completed'].includes(detail.status) ? 'finish' : detail.status === 'reviewing' ? 'process' : 'wait', icon: <CalendarOutlined />, description: '视频面试' },
                { title: '录用入职', status: ['hired', 'probation', 'completed'].includes(detail.status) ? 'finish' : 'wait', icon: <CheckCircleOutlined />, description: '发送Offer' },
                { title: '试用期考核', status: ['probation', 'completed'].includes(detail.status) ? 'finish' : 'wait', icon: <UserOutlined />, description: '1/3/6月反馈' },
                { title: '分佣发放', status: detail.status === 'completed' ? 'finish' : 'wait', icon: <DollarOutlined />, description: '佣金到账' }
              ]}
            />
          </Card>

          <Card
            title={<><RiseOutlined /> 推荐人命中率与曝光权重分析</>}
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            {detail.referrer_stats ? (
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Card bordered={false} style={{ background: '#f0f5ff', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>总推荐数</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>{detail.referrer_stats.total_recommendations}</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>成功入职</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{detail.referrer_stats.success_hires}</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>命中率</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#fa8c16' }}>{detail.referrer_stats.hit_rate}%</div>
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card bordered={false} style={{ background: '#f9f0ff', borderRadius: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>曝光权重</div>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#722ed1' }}>{detail.referrer_exposure}</div>
                  </Card>
                </Col>
              </Row>
            ) : (
              <Empty description="暂无统计数据" />
            )}
            {exposureAnalysis && (
              <Alert
                type="info"
                showIcon
                message={`曝光权重影响：${exposureAnalysis.impactLevel}`}
                description={exposureAnalysis.impactDesc}
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{ borderRadius: 12 }}
        tabBarExtraContent={<Space><Button type="link" size="small" icon={<UserSwitchOutlined />}>推荐记录</Button></Space>}
      >
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <div>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card 
                        title="候选人信息" 
                        size="small"
                        bordered={false} 
                        style={{ borderRadius: 8, background: '#fafafa' }}
                      >
                        <Descriptions bordered column={2} size="small">
                          <Descriptions.Item label="姓名">{detail.candidate_name}</Descriptions.Item>
                          <Descriptions.Item label="电话">{detail.candidate_phone}</Descriptions.Item>
                          <Descriptions.Item label="当前职位">{detail.current_position}</Descriptions.Item>
                          <Descriptions.Item label="当前公司">{detail.current_company}</Descriptions.Item>
                          <Descriptions.Item label="工作年限">{detail.work_years}年</Descriptions.Item>
                          <Descriptions.Item label="所在城市">{detail.city}</Descriptions.Item>
                          <Descriptions.Item label="当前年薪" span={2}>
                            <span className="salary-text">¥{annualSalaryText(detail.current_salary)}万</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="期望年薪" span={2}>
                            <span className="salary-text">¥{annualSalaryText(detail.expected_salary_min)}-{annualSalaryText(detail.expected_salary_max)}万</span>
                          </Descriptions.Item>
                        </Descriptions>
                        <Divider style={{ margin: '12px 0' }} />
                        <div>
                          <Text strong style={{ fontSize: 12 }}>人才标签：</Text>
                          <div style={{ marginTop: 6 }}>
                            {detail.portrait_tags?.map((tag: string, idx: number) => (
                              <Tag key={idx} color="blue" style={{ marginBottom: 4 }}>{tag}</Tag>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card 
                        title="目标职位信息" 
                        size="small"
                        bordered={false} 
                        style={{ borderRadius: 8, background: '#fafafa' }}
                      >
                        <Descriptions bordered column={2} size="small">
                          <Descriptions.Item label="职位名称">{detail.job_title}</Descriptions.Item>
                          <Descriptions.Item label="企业名称">{detail.company_name}</Descriptions.Item>
                          <Descriptions.Item label="所属行业">{detail.industry}</Descriptions.Item>
                          <Descriptions.Item label="试用期">{detail.probation_months}个月</Descriptions.Item>
                          <Descriptions.Item label="悬赏金额" span={2}>
                            <span className="reward-text" style={{ fontSize: 18 }}>¥{money(detail.reward_amount)}</span>
                          </Descriptions.Item>
                        </Descriptions>
                        <Divider style={{ margin: '12px 0' }} />
                        <Row gutter={[12, 12]}>
                          <Col span={12}>
                            <div style={{ textAlign: 'center', padding: 8, background: '#e6f4ff', borderRadius: 6 }}>
                              <div style={{ fontSize: 11, color: '#999' }}>佣金比例</div>
                              <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>{(detail.commission_rate * 100).toFixed(0)}%</div>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ textAlign: 'center', padding: 8, background: '#fff7e6', borderRadius: 6 }}>
                              <div style={{ fontSize: 11, color: '#999' }}>佣金总额</div>
                              <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>¥{money(detail.commission_amount)}</div>
                            </div>
                          </Col>
                        </Row>
                      </Card>
                    </Col>
                  </Row>
                </div>
              )
            },
            {
              key: 'review',
              label: '审核与面试',
              children: (
                <div>
                  {detail.review_feedback && (
                    <Card 
                      title={<><EditOutlined /> 企业审核意见</>}
                      size="small"
                      bordered={false} 
                      style={{ borderRadius: 8, marginBottom: 16, background: '#e6f4ff20' }}
                    >
                      <Alert
                        type={detail.review_feedback.new_status === 'rejected' ? 'error' : 'success'}
                        showIcon
                        message={`审核结果：${detail.review_feedback.new_status === 'rejected' ? '已拒绝' : '审核通过'}`}
                        description={detail.review_feedback.feedback || '无具体说明'}
                      />
                    </Card>
                  )}

                  <Card 
                    title={<><VideoCameraOutlined /> 面试记录</>}
                    size="small"
                    bordered={false} 
                    style={{ borderRadius: 8, marginBottom: 16 }}
                    extra={
                      canScheduleInterview && (
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setInterviewModalVisible(true)}>
                          安排面试
                        </Button>
                      )
                    }
                  >
                    {detail.interviews?.length > 0 ? (
                      <Table
                        columns={interviewColumns}
                        dataSource={detail.interviews}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无面试记录" />
                    )}
                  </Card>

                  {detail.offer_info && (
                    <Card 
                      title={<><CheckCircleOutlined /> Offer入职信息</>}
                      size="small"
                      bordered={false} 
                      style={{ borderRadius: 8, background: '#f6ffed20' }}
                    >
                      <Alert
                        type="success"
                        showIcon
                        message="Offer已发送"
                        description={`候选人已接受Offer，预计入职时间：${dayjs(detail.offer_info.scheduled_at || detail.updated_at).format('YYYY-MM-DD')}`}
                        style={{ marginBottom: 12 }}
                      />
                      {typeof detail.offer_info.feedback === 'string' && detail.offer_info.feedback.startsWith('{') && (
                        <Descriptions bordered column={2} size="small">
                          {(() => {
                            try {
                              const offerData = JSON.parse(detail.offer_info.feedback);
                              return (
                                <>
                                  {offerData.offer_salary && <Descriptions.Item label="Offer薪资">¥{Number(offerData.offer_salary).toLocaleString()}/年</Descriptions.Item>}
                                  {offerData.entry_date && <Descriptions.Item label="入职日期">{offerData.entry_date}</Descriptions.Item>}
                                  {offerData.benefits && <Descriptions.Item label="福利待遇" span={2}>{offerData.benefits}</Descriptions.Item>}
                                  {offerData.other_terms && <Descriptions.Item label="其他条款" span={2}>{offerData.other_terms}</Descriptions.Item>}
                                </>
                              );
                            } catch(e) {
                              return null;
                            }
                          })()}
                        </Descriptions>
                      )}
                    </Card>
                  )}
                </div>
              )
            },
            {
              key: 'commission',
              label: '试用期与佣金',
              children: (
                <div>
                  <Card 
                    title={<><UserOutlined /> 试用期反馈记录</>}
                    size="small"
                    bordered={false} 
                    style={{ borderRadius: 8, marginBottom: 16 }}
                    extra={
                      canAddFeedback && (
                        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setFeedbackModalVisible(true)}>
                          提交反馈
                        </Button>
                      )
                    }
                  >
                    {detail.probation_feedbacks?.length > 0 ? (
                      <Table
                        columns={feedbackColumns}
                        dataSource={detail.probation_feedbacks}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无试用期反馈" />
                    )}
                  </Card>

                  <Card 
                    title={<><GiftOutlined /> 佣金发放计划（含到账凭据）</>}
                    size="small"
                    bordered={false} 
                    style={{ borderRadius: 8 }}
                  >
                    <Alert
                      type="success"
                      showIcon
                      message="企业悬赏规则"
                      description={`推荐渠道仅限平台认证用户，试用期第1/3/6个月反馈通过后分别发放30%/40%/30%佣金。`}
                      style={{ marginBottom: 16 }}
                    />
                    <Divider orientation="left" orientationMargin="0" plain>阶梯分佣规则</Divider>
                    <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                      {detail.commission_tiers?.map((tier: any, idx: number) => (
                        <Col xs={24} sm={8} key={idx}>
                          <Card 
                            bordered 
                            size="small" 
                            style={{ 
                              borderRadius: 8, 
                              background: (tier.rate === detail.commission_rate) ? '#e6f4ff' : '#fafafa',
                              borderColor: (tier.rate === detail.commission_rate) ? '#1677ff' : undefined
                            }}
                          >
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>成功推荐 ≥ {tier.threshold}人</div>
                              <div style={{ fontSize: 18, fontWeight: 600, color: tier.rate === detail.commission_rate ? '#1677ff' : '#666' }}>
                                {(tier.rate * 100).toFixed(0)}%
                              </div>
                              {tier.rate === detail.commission_rate && <Tag color="blue" style={{ marginTop: 2, fontSize: 10 }}>当前适用</Tag>}
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                    <Divider orientation="left" orientationMargin="0" plain>分期发放明细</Divider>
                    <Table
                      columns={planColumns}
                      dataSource={detail.commission_plans}
                      rowKey="id"
                      pagination={false}
                      size="small"
                      scroll={{ x: 900 }}
                    />
                  </Card>
                </div>
              )
            },
            {
              key: 'funding',
              label: '资金与存证',
              children: (
                <div id="transactions">
                  <Card 
                    title={<><BankOutlined /> 资金监管状态</>}
                    size="small"
                    bordered={false} 
                    style={{ borderRadius: 8, marginBottom: 16 }}
                  >
                    <Alert
                      type="success"
                      showIcon
                      message="资金由第三方支付机构监管"
                      description="所有分佣资金由支付宝（中国）网络技术有限公司进行托管，满足触发条件后自动打款至推荐人绑定的银行账户，全程可追溯。"
                    />
                    <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
                      <Col xs={12} sm={6}>
                        <Card bordered={false} style={{ background: '#f0f5ff', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#999' }}>佣金总额</div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>¥{money(detail.commission_amount)}</div>
                        </Card>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#999' }}>已发放</div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                            ¥{money(detail.commission_plans?.filter((p: any) => p.status === 'paid').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0))}
                          </div>
                        </Card>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#999' }}>待发放</div>
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }}>
                            ¥{money(detail.commission_plans?.filter((p: any) => p.status === 'pending').reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0))}
                          </div>
                        </Card>
                      </Col>
                      <Col xs={12} sm={6}>
                        <Card bordered={false} style={{ background: '#f9f0ff', borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#999' }}>监管机构</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#722ed1', marginTop: 4 }}>支付宝</div>
                        </Card>
                      </Col>
                    </Row>
                  </Card>

                  <Card 
                    title={<><HistoryOutlined /> 交易流水记录</>}
                    size="small"
                    bordered={false} 
                    style={{ borderRadius: 8, marginBottom: 16 }}
                  >
                    {detail.transactions?.length > 0 ? (
                      <Table
                        size="small"
                        pagination={false}
                        columns={[
                          {
                            title: '流水号',
                            dataIndex: 'txn_id',
                            key: 'txn_id',
                            render: (val: string) => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{val}</span>
                          },
                          {
                            title: '类型',
                            dataIndex: 'type',
                            key: 'type',
                            render: () => <Tag color="blue">分佣发放</Tag>
                          },
                          {
                            title: '金额',
                            dataIndex: 'amount',
                            key: 'amount',
                            render: (val: number) => <span className="reward-text" style={{ fontWeight: 600 }}>¥{val.toLocaleString()}</span>
                          },
                          {
                            title: '付款方',
                            dataIndex: 'from_user_name',
                            key: 'from'
                          },
                          {
                            title: '收款方',
                            dataIndex: 'to_user_name',
                            key: 'to'
                          },
                          {
                            title: '状态',
                            dataIndex: 'status',
                            key: 'status',
                            render: (val: string) => val === 'completed' 
                              ? <Tag color="green">已完成</Tag> 
                              : <Tag color="orange">处理中</Tag>
                          },
                          {
                            title: '交易时间',
                            dataIndex: 'created_at',
                            key: 'time',
                            render: (val: string) => dayjs(val).format('MM-DD HH:mm')
                          },
                          {
                            title: '备注',
                            dataIndex: 'remark',
                            key: 'remark'
                          }
                        ]}
                        dataSource={detail.transactions || []}
                      />
                    ) : (
                      <Empty description="暂无交易流水，满足触发条件后自动生成" />
                    )}
                  </Card>

                  <Card 
                    title={<><SafetyOutlined /> 分佣协议区块链存证</>}
                    size="small"
                    bordered={false} 
                    style={{ borderRadius: 8 }}
                  >
                    {detail.blockchain_record ? (
                      <div>
                        <Alert
                          type="success"
                          showIcon
                          message="推荐合约已上链存证，不可篡改"
                          style={{ marginBottom: 16 }}
                        />
                        <Descriptions bordered column={1} size="small">
                          <Descriptions.Item label="区块哈希">
                            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{detail.blockchain_record.block_hash}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="交易哈希">
                            <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{detail.blockchain_record.transaction_hash}</span>
                          </Descriptions.Item>
                          <Descriptions.Item label="存证时间">{dayjs(detail.blockchain_record.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                          <Descriptions.Item label="合约类型">{detail.blockchain_record.contract_type === 'recommendation' ? '推荐分佣协议' : detail.blockchain_record.contract_type}</Descriptions.Item>
                        </Descriptions>
                        {detail.commission_blockchain?.length > 0 && (
                          <>
                            <Divider orientation="left" plain>分佣支付存证记录</Divider>
                            <Table
                              size="small"
                              pagination={false}
                              columns={[
                                { title: '期数', dataIndex: 'reference_id', key: 'period', render: (val: number) => `第${(val % 100) || 1}期` },
                                { title: '区块哈希', dataIndex: 'block_hash', key: 'hash', render: (val: string) => <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{val.substring(0, 16)}...</span> },
                                { title: '存证时间', dataIndex: 'created_at', key: 'time', render: (val: string) => dayjs(val).format('MM-DD HH:mm') }
                              ]}
                              dataSource={detail.commission_blockchain || []}
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      <Empty description="暂无区块链存证记录" />
                    )}
                  </Card>
                </div>
              )
            },
            {
              key: 'referrer',
              label: '推荐人信息',
              children: (
                <div>
                  <Card bordered={false} style={{ borderRadius: 8 }}>
                    <Descriptions bordered column={3} size="small">
                      <Descriptions.Item label="姓名">{detail.referrer_name}</Descriptions.Item>
                      <Descriptions.Item label="电话">{detail.referrer_phone}</Descriptions.Item>
                      <Descriptions.Item label="邮箱">{detail.referrer_email}</Descriptions.Item>
                      <Descriptions.Item label="信用评分">
                        <span className={detail.referrer_credit >= 80 ? 'credit-score-good' : detail.referrer_credit >= 60 ? 'credit-score-medium' : 'credit-score-low'}>
                          {detail.referrer_credit}
                        </span>
                      </Descriptions.Item>
                      <Descriptions.Item label="曝光权重">{detail.referrer_exposure}</Descriptions.Item>
                      <Descriptions.Item label="推荐时间">{dayjs(detail.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                    </Descriptions>
                    {detail.referrer_stats && (
                      <>
                        <Divider style={{ margin: '16px 0' }} />
                        <Title level={5} style={{ marginTop: 0 }}>历史推荐绩效</Title>
                        <Row gutter={[12, 12]}>
                          <Col xs={8}>
                            <Card bordered={false} style={{ background: '#f0f5ff', borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: '#999' }}>总推荐</div>
                              <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>{detail.referrer_stats.total_recommendations}</div>
                            </Card>
                          </Col>
                          <Col xs={8}>
                            <Card bordered={false} style={{ background: '#f6ffed', borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: '#999' }}>成功入职</div>
                              <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{detail.referrer_stats.success_hires}</div>
                            </Card>
                          </Col>
                          <Col xs={8}>
                            <Card bordered={false} style={{ background: '#fff7e6', borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 11, color: '#999' }}>命中率</div>
                              <div style={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }}>{detail.referrer_stats.hit_rate}%</div>
                            </Card>
                          </Col>
                        </Row>
                      </>
                    )}
                  </Card>
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="更新推荐状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical" onFinish={handleStatusUpdate}>
          <Form.Item name="status" label="选择新状态" rules={[{ required: true }]}>
            <Select
              placeholder="请选择新状态"
              value={newStatus}
              onChange={setNewStatus}
            >
              {validTransitions.map(s => {
                const info = getStatusInfo(s);
                return (
                  <Option key={s} value={s}>
                    <Tag color={info.color}>{info.text}</Tag>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item name="feedback" label="反馈说明">
            <TextArea rows={3} placeholder="请输入状态变更说明" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setStatusModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认更新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交试用期反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
        destroyOnClose
        width={500}
      >
        <Form form={feedbackForm} layout="vertical" onFinish={handleFeedbackSubmit}>
          <Form.Item name="feedback_node" label="反馈节点" rules={[{ required: true }]}>
            <Select placeholder="请选择反馈节点">
              {detail?.feedback_nodes?.map((node: string, idx: number) => (
                <Option key={idx} value={node}>{node}</Option>
              )) || (
                <>
                  <Option value="1个月">入职1个月</Option>
                  <Option value="3个月">入职3个月</Option>
                  <Option value="6个月">入职6个月</Option>
                </>
              )}
            </Select>
          </Form.Item>
          <Form.Item name="feedback_date" label="反馈日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="rating" label="综合评分" rules={[{ required: true }]}>
            <Rate />
          </Form.Item>
          <Form.Item name="passed" label="是否通过" rules={[{ required: true }]}>
            <Select placeholder="请选择">
              <Option value={1}>通过</Option>
              <Option value={0}>未通过</Option>
            </Select>
          </Form.Item>
          <Form.Item name="comments" label="评价内容" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请详细描述试用期表现评价" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setFeedbackModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交反馈
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="企业审核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReviewSubmit}>
          <Alert
            type="info"
            showIcon
            message="审核须知"
            description="请根据候选人简历匹配度、企业招聘要求等因素综合判断。审核通过后进入面试阶段，拒绝需说明具体原因。"
            style={{ marginBottom: 16 }}
          />
          <Form.Item name="review_result" label="审核结果" rules={[{ required: true, message: '请选择审核结果' }]}>
            <Select placeholder="请选择审核结果">
              <Option value="pass">
                <Tag color="green">审核通过，进入面试阶段</Tag>
              </Option>
              <Option value="reject">
                <Tag color="red">拒绝推荐</Tag>
              </Option>
            </Select>
          </Form.Item>
          <Form.Item name="review_comments" label="审核意见" rules={[{ required: true, message: '请输入审核意见' }]}>
            <TextArea 
              rows={4} 
              placeholder="请详细说明审核通过或拒绝的原因，如：简历匹配度高/低、技能不符合要求等"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setReviewModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认审核
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="预约视频面试"
        open={interviewModalVisible}
        onCancel={() => setInterviewModalVisible(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <Form form={interviewForm} layout="vertical" onFinish={handleInterviewSchedule}>
          <Alert
            type="info"
            showIcon
            message="面试预约"
            description="预约成功后系统将自动生成视频面试房间链接，发送给候选人和面试官。"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="round" label="面试轮次" rules={[{ required: true }]}>
                <Select placeholder="请选择">
                  <Option value={1}>第1轮（初筛）</Option>
                  <Option value={2}>第2轮（技术）</Option>
                  <Option value={3}>第3轮（复试）</Option>
                  <Option value={4}>第4轮（HR）</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="interview_type" label="面试类型" rules={[{ required: true }]}>
                <Select placeholder="请选择" defaultValue="video">
                  <Option value="video">视频面试</Option>
                  <Option value="onsite">现场面试</Option>
                  <Option value="phone">电话面试</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item name="scheduled_at" label="面试时间" rules={[{ required: true }]}>
                <DatePicker 
                  showTime 
                  style={{ width: '100%' }} 
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择面试时间"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="duration" label="时长（分钟）" rules={[{ required: true }]}>
                <InputNumber 
                  min={15} 
                  max={240} 
                  step={15} 
                  defaultValue={60}
                  style={{ width: '100%' }} 
                  placeholder="60"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="interviewer_id" label="面试官" rules={[{ required: true }]}>
            <Select placeholder="请选择面试官">
              <Option value={1}>张经理（技术总监）</Option>
              <Option value={2}>李主管（HR经理）</Option>
              <Option value={3}>王总（CTO）</Option>
            </Select>
          </Form.Item>
          <Form.Item name="interviewer_notes" label="面试备注">
            <TextArea 
              rows={2} 
              placeholder="请输入面试重点考察方向或注意事项"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setInterviewModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认预约
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发送录用Offer"
        open={offerModalVisible}
        onCancel={() => setOfferModalVisible(false)}
        footer={null}
        destroyOnClose
        width={560}
      >
        <Form form={offerForm} layout="vertical" onFinish={handleOfferSend}>
          <Alert
            type="success"
            showIcon
            message="发送录用Offer"
            description="确认录用信息无误后，系统将更新状态为已录用，并触发分佣协议执行。"
            style={{ marginBottom: 16 }}
          />
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="offer_salary" label="Offer薪资（元/年）" rules={[{ required: true }]}>
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={0}
                  placeholder="请输入年薪"
                  formatter={(value) => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value?.replace(/\¥\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="entry_date" label="预计入职日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="benefits" label="福利待遇">
            <TextArea 
              rows={2} 
              placeholder="如：五险一金、年终奖、股票期权、带薪年假等"
            />
          </Form.Item>
          <Form.Item name="other_terms" label="其他条款">
            <TextArea 
              rows={2} 
              placeholder="如：试用期薪资、竞业限制、保密协议等"
            />
          </Form.Item>
          <Alert
            type="warning"
            showIcon
            message="确认提示"
            description="发送Offer后，推荐状态将更新为「已录用」，并启动试用期跟踪和分佣计算。请确认信息无误。"
            style={{ marginBottom: 16 }}
          />
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setOfferModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting} danger>
                确认发送Offer
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="面试纪要AI摘要"
        open={summaryModalVisible}
        onCancel={() => setSummaryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSummaryModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        {selectedInterview ? (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="面试轮次">第{selectedInterview.round}轮</Descriptions.Item>
              <Descriptions.Item label="面试时间">{dayjs(selectedInterview.scheduled_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="面试官">{selectedInterview.interviewer || '-'}</Descriptions.Item>
              <Descriptions.Item label="面试结果">
                {selectedInterview.result === 'pass' 
                  ? <Tag color="green">通过</Tag> 
                  : selectedInterview.result === 'fail'
                  ? <Tag color="red">未通过</Tag>
                  : <Tag color="orange">待定</Tag>
                }
              </Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left" plain>AI 智能摘要</Divider>
            {selectedInterview.ai_summary ? (
              <div className="ai-summary">
                {selectedInterview.ai_summary}
              </div>
            ) : (
              <Empty description="暂无AI摘要，面试完成后系统将自动生成" />
            )}
            
            {selectedInterview.feedback && (
              <>
                <Divider orientation="left" plain>面试官评语</Divider>
                <div style={{ padding: 12, background: '#fafafa', borderRadius: 8 }}>
                  {selectedInterview.feedback}
                </div>
              </>
            )}
          </div>
        ) : (
          <Empty description="未选择面试记录" />
        )}
      </Modal>
    </div>
  );
};

export default RecommendationDetail;
