import React, { useEffect, useState } from 'react';
import {
  Card,
  Tabs,
  Table,
  Statistic,
  Row,
  Col,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  message,
  Spin,
  Alert,
  Descriptions,
  Progress,
  Timeline,
  List,
  Avatar
} from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  SafetyOutlined,
  DollarOutlined,
  LinkOutlined,
  FileTextOutlined,
  UserOutlined,
  EditOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  EyeOutlined,
  BarChartOutlined,
  FundOutlined,
  AuditOutlined,
  HistoryOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DashboardStats {
  total_users: number;
  total_resumes: number;
  total_jobs: number;
  total_recommendations: number;
  total_hires: number;
  total_commission: number;
  pending_recommendations: number;
  active_interviews: number;
}

interface UserItem {
  id: number;
  username: string;
  real_name: string;
  phone: string;
  email: string;
  role: string;
  credit_score: number;
  exposure_weight: number;
  total_recommendations: number;
  success_hires: number;
  total_commission: number;
  company_name?: string;
  verified?: boolean;
  created_at: string;
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
  candidate_name?: string;
  job_title?: string;
  txn_id: string;
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
  real_name: string;
  username: string;
  created_at: string;
}

interface CredibilityDetail {
  user_id: number;
  username: string;
  real_name: string;
  role: string;
  current_credit_score: number;
  current_exposure_weight: number;
  latest_calculation: any;
  history: any[];
}

interface HitRateItem {
  user_id: number;
  username: string;
  real_name: string;
  total_recommendations: number;
  success_hires: number;
  hit_rate: number;
  credit_score: number;
  exposure_weight: number;
}

interface ExposureAnalysisItem {
  credit_level: string;
  user_count: number;
  avg_exposure_weight: number;
  avg_hit_rate: number;
}

interface FundingSupervision {
  total_commission_amount: number;
  paid_commission_amount: number;
  pending_commission_amount: number;
  total_transactions: number;
  pending_transactions: number;
  completed_transactions: number;
}

interface BlockchainStats {
  total_records: number;
  recommendation_contracts: number;
  commission_payment_contracts: number;
  last_24h_records: number;
}

interface DashboardData {
  stats: DashboardStats;
  recent_recommendations: any[];
  top_referrers: any[];
  hit_rate_analysis: HitRateItem[];
  exposure_analysis: ExposureAnalysisItem[];
  funding_supervision: FundingSupervision;
  blockchain_stats: BlockchainStats;
  recent_transactions: Transaction[];
}

const Admin: React.FC = () => {
  const [activeKey, setActiveKey] = useState('1');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRecommendations, setRecentRecommendations] = useState<any[]>([]);
  const [topReferrers, setTopReferrers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  const [hitRateAnalysis, setHitRateAnalysis] = useState<HitRateItem[]>([]);
  const [exposureAnalysis, setExposureAnalysis] = useState<ExposureAnalysisItem[]>([]);
  const [fundingSupervision, setFundingSupervision] = useState<FundingSupervision | null>(null);
  const [blockchainStats, setBlockchainStats] = useState<BlockchainStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dashboardTabKey, setDashboardTabKey] = useState('overview');

  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(20);
  const [userFilters, setUserFilters] = useState({ role: '', keyword: '' });
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [userForm] = Form.useForm();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transTotal, setTransTotal] = useState(0);
  const [transPage, setTransPage] = useState(1);
  const [transPageSize, setTransPageSize] = useState(20);
  const [transFilters, setTransFilters] = useState({ type: '', status: '' });

  const [blockchainRecords, setBlockchainRecords] = useState<BlockchainRecord[]>([]);
  const [bcTotal, setBcTotal] = useState(0);
  const [bcPage, setBcPage] = useState(1);
  const [bcPageSize, setBcPageSize] = useState(20);
  const [bcFilter, setBcFilter] = useState('');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize, setLogsPageSize] = useState(20);

  const [credibilityModalVisible, setCredibilityModalVisible] = useState(false);
  const [credibilityDetail, setCredibilityDetail] = useState<CredibilityDetail | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (activeKey === '1') {
      fetchDashboard();
    } else if (activeKey === '2') {
      fetchUsers();
    } else if (activeKey === '4') {
      fetchTransactions();
    } else if (activeKey === '5') {
      fetchBlockchainRecords();
    } else if (activeKey === '6') {
      fetchAuditLogs();
    }
  }, [activeKey, userPage, userPageSize, userFilters, transPage, transPageSize, transFilters, bcPage, bcPageSize, bcFilter, logsPage, logsPageSize]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/dashboard');
      setStats(response.data.stats);
      setRecentRecommendations(response.data.recent_recommendations);
      setTopReferrers(response.data.top_referrers);
      setHitRateAnalysis(response.data.hit_rate_analysis || []);
      setExposureAnalysis(response.data.exposure_analysis || []);
      setFundingSupervision(response.data.funding_supervision || null);
      setBlockchainStats(response.data.blockchain_stats || null);
      setRecentTransactions(response.data.recent_transactions || []);

      const statsRes = await axios.get('/api/admin/statistics', { params: { period: '30d' } });
      setChartData(statsRes.data.daily_recommendations || []);
      setStatusData(statsRes.data.status_distribution?.map((item: any) => ({
        name: item.status,
        value: item.count
      })) || []);
    } catch (error) {
      message.error('获取数据概览失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page: userPage, pageSize: userPageSize, ...userFilters };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      const response = await axios.get('/api/admin/users', { params });
      setUsers(response.data.list);
      setUsersTotal(response.data.total);
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = { page: transPage, pageSize: transPageSize, ...transFilters };
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      const response = await axios.get('/api/admin/transactions', { params });
      setTransactions(response.data.list);
      setTransTotal(response.data.total);
    } catch (error) {
      message.error('获取资金流水失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchainRecords = async () => {
    try {
      setLoading(true);
      const params: any = { page: bcPage, pageSize: bcPageSize };
      if (bcFilter) params.contract_type = bcFilter;
      const response = await axios.get('/api/admin/blockchain', { params });
      setBlockchainRecords(response.data.list);
      setBcTotal(response.data.total);
    } catch (error) {
      message.error('获取区块链存证失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/audit-logs', {
        params: { page: logsPage, pageSize: logsPageSize }
      });
      setAuditLogs(response.data.list);
      setLogsTotal(response.data.total);
    } catch (error) {
      message.error('获取操作日志失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchCredibilityDetail = async (userId: number) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${userId}/credibility`);
      setCredibilityDetail(response.data);
      setCredibilityModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取可信度详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculateCredibility = async (userId: number) => {
    try {
      await axios.post(`/api/admin/users/${userId}/recalculate-credibility`);
      message.success('重新计算成功');
      fetchCredibilityDetail(userId);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || '计算失败');
    }
  };

  const handleUserSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await axios.put(`/api/users/${editingUser.id}`, values);
        message.success('更新成功');
      } else {
        await axios.post('/api/users', values);
        message.success('创建成功');
      }
      setUserModalVisible(false);
      setEditingUser(null);
      userForm.resetFields();
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const handleEditUser = (user: UserItem) => {
    setEditingUser(user);
    userForm.setFieldsValue(user);
    setUserModalVisible(true);
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await axios.delete(`/api/users/${id}`);
      message.success('删除成功');
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const getRoleTag = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'red',
      user: 'blue',
      company: 'green'
    };
    const texts: Record<string, string> = {
      admin: '管理员',
      user: '猎头顾问',
      company: '企业用户'
    };
    return <Tag color={colors[role]}>{texts[role]}</Tag>;
  };

  const getCreditClass = (score: number) => {
    if (score >= 80) return 'credit-score-good';
    if (score >= 60) return 'credit-score-medium';
    return 'credit-score-low';
  };

  const COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#f5222d'];

  const dashboardColumns = [
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name'
    },
    {
      title: '目标职位',
      dataIndex: 'job_title',
      key: 'job_title'
    },
    {
      title: '企业',
      dataIndex: 'company_name',
      key: 'company_name'
    },
    {
      title: '推荐人',
      dataIndex: 'referrer_name',
      key: 'referrer_name'
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    }
  ];

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
      key: 'real_name'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => getRoleTag(role)
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '信用评分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      render: (score: number) => (
        <span className={getCreditClass(score)}>{score}</span>
      )
    },
    {
      title: '曝光权重',
      dataIndex: 'exposure_weight',
      key: 'exposure_weight'
    },
    {
      title: '企业名称',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (val: string, record: UserItem) => (
        <span>
          {val}
          {record.verified !== undefined && (
            <Tag color={record.verified ? 'green' : 'orange'} style={{ marginLeft: 4 }}>
              {record.verified ? '已认证' : '未认证'}
            </Tag>
          )}
        </span>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: UserItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => { setSelectedUserId(record.id); fetchCredibilityDetail(record.id); }}
          >
            可信度
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            编辑
          </Button>
        </Space>
      )
    }
  ];

  const transColumns = [
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const map: Record<string, string> = {
          commission: '佣金发放',
          reward: '赏金支付',
          deposit: '充值',
          withdraw: '提现'
        };
        return <Tag color="blue">{map[type] || type}</Tag>;
      }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => <span className="reward-text">¥{val.toLocaleString()}</span>
    },
    {
      title: '付款方',
      dataIndex: 'from_user_name',
      key: 'from_user_name'
    },
    {
      title: '收款方',
      dataIndex: 'to_user_name',
      key: 'to_user_name'
    },
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name'
    },
    {
      title: '目标职位',
      dataIndex: 'job_title',
      key: 'job_title'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          completed: { color: 'green', text: '已完成' },
          pending: { color: 'orange', text: '处理中' },
          failed: { color: 'red', text: '失败' }
        };
        const s = map[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '交易时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
    }
  ];

  const bcColumns = [
    {
      title: '合约类型',
      dataIndex: 'contract_type',
      key: 'contract_type',
      render: (type: string) => {
        const map: Record<string, string> = {
          recommendation: '推荐合约',
          commission_payment: '佣金支付'
        };
        return <Tag color="purple">{map[type] || type}</Tag>;
      }
    },
    {
      title: '关联ID',
      dataIndex: 'reference_id',
      key: 'reference_id'
    },
    {
      title: '区块哈希',
      dataIndex: 'block_hash',
      key: 'block_hash',
      render: (val: string) => <span className="blockchain-hash">{val}</span>
    },
    {
      title: '交易哈希',
      dataIndex: 'transaction_hash',
      key: 'transaction_hash',
      render: (val: string) => <span className="blockchain-hash">{val}</span>
    },
    {
      title: '存证时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  const logColumns = [
    {
      title: '操作人',
      dataIndex: 'real_name',
      key: 'real_name',
      render: (val: string, record: AuditLog) => (
        <span>{val} ({record.username})</span>
      )
    },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        const map: Record<string, { color: string; text: string }> = {
          create_resume: { color: 'green', text: '创建简历' },
          update_resume: { color: 'blue', text: '更新简历' },
          delete_resume: { color: 'red', text: '删除简历' },
          create_job: { color: 'green', text: '创建职位' },
          update_job: { color: 'blue', text: '更新职位' },
          close_job: { color: 'orange', text: '关闭职位' },
          create_recommendation: { color: 'purple', text: '创建推荐' },
          update_recommendation_status: { color: 'cyan', text: '更新推荐状态' },
          create_user: { color: 'green', text: '创建用户' },
          update_user: { color: 'blue', text: '更新用户' },
          delete_user: { color: 'red', text: '删除用户' },
          verify_company: { color: 'geekblue', text: '企业认证' }
        };
        const s = map[action] || { color: 'default', text: action };
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type'
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id'
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip'
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  const getHitRateColor = (rate: number) => {
    if (rate >= 0.3) return '#52c41a';
    if (rate >= 0.15) return '#fa8c16';
    return '#ff4d4f';
  };

  const getExposureColor = (weight: number) => {
    if (weight >= 80) return '#722ed1';
    if (weight >= 60) return '#eb2f96';
    return '#fa8c16';
  };

  const dashboardSubTabs = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined />
          总览
        </span>
      )
    },
    {
      key: 'hitrate',
      label: (
        <span>
          <BarChartOutlined />
          命中率与曝光分析
        </span>
      )
    },
    {
      key: 'funding',
      label: (
        <span>
          <FundOutlined />
          资金监管看板
        </span>
      )
    },
    {
      key: 'blockchain',
      label: (
        <span>
          <AuditOutlined />
          区块链存证
        </span>
      )
    },
    {
      key: 'transactions',
      label: (
        <span>
          <HistoryOutlined />
          交易流水
        </span>
      )
    }
  ];

  const hitRateColumns = [
    {
      title: '推荐人',
      dataIndex: 'real_name',
      key: 'real_name',
      render: (val: string, record: HitRateItem) => (
        <span>
          {val}
          <span style={{ color: '#999', fontSize: 12, marginLeft: 6 }}>({record.username})</span>
        </span>
      )
    },
    {
      title: '推荐总数',
      dataIndex: 'total_recommendations',
      key: 'total_recommendations',
      align: 'center' as const
    },
    {
      title: '成功入职',
      dataIndex: 'success_hires',
      key: 'success_hires',
      align: 'center' as const
    },
    {
      title: '命中率',
      dataIndex: 'hit_rate',
      key: 'hit_rate',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: getHitRateColor(val), fontWeight: 600 }}>
          {(val * 100).toFixed(1)}%
        </span>
      )
    },
    {
      title: '信用评分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      align: 'center' as const,
      render: (val: number) => (
        <span className={getCreditClass(val)} style={{ fontWeight: 600 }}>
          {val}
        </span>
      )
    },
    {
      title: '曝光权重',
      dataIndex: 'exposure_weight',
      key: 'exposure_weight',
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ color: getExposureColor(val), fontWeight: 600 }}>
          {val}
        </span>
      )
    },
    {
      title: '曝光权重影响',
      key: 'impact',
      align: 'center' as const,
      render: (_: any, record: HitRateItem) => {
        const avgHitRate = hitRateAnalysis.reduce((sum, item) => sum + item.hit_rate, 0) / Math.max(hitRateAnalysis.length, 1);
        const diff = record.hit_rate - avgHitRate;
        const impact = Math.round(diff * 100) / 10;
        return (
          <Tag color={impact >= 0 ? 'green' : 'red'}>
            {impact >= 0 ? '↑' : '↓'} {Math.abs(impact).toFixed(1)}%
          </Tag>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      align: 'center' as const,
      render: (_: any, record: HitRateItem) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<AuditOutlined />}
            onClick={() => fetchCredibilityDetail(record.user_id)}
          >
            复查
          </Button>
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <DashboardOutlined />
          数据概览
        </span>
      ),
      children: (
        <div>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <Tabs 
              activeKey={dashboardTabKey} 
              onChange={setDashboardTabKey} 
              items={dashboardSubTabs}
              size="large"
              style={{ marginBottom: 0 }}
            />
          </Card>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : stats ? (
            <>
              {dashboardTabKey === 'overview' && (
                <>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} lg={6}>
                  <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                    <Statistic
                      title="用户总数"
                      value={stats.total_users}
                      prefix={<TeamOutlined style={{ color: '#1677ff' }} />}
                      valueStyle={{ color: '#1677ff' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} lg={6}>
                  <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                    <Statistic
                      title="简历总数"
                      value={stats.total_resumes}
                      prefix={<FileTextOutlined style={{ color: '#13c2c2' }} />}
                      valueStyle={{ color: '#13c2c2' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} lg={6}>
                  <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                    <Statistic
                      title="成功入职"
                      value={stats.total_hires}
                      prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} lg={6}>
                  <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                    <Statistic
                      title="佣金总额"
                      value={stats.total_commission}
                      formatter={(val) => `¥${Number(val).toLocaleString()}`}
                      prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
                      valueStyle={{ color: '#fa8c16' }}
                    />
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} lg={16}>
                  <Card title="近30天推荐趋势" bordered={false} style={{ borderRadius: 12 }}>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#999" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="count" name="推荐数" stroke="#1677ff" strokeWidth={3} />
                          <Line type="monotone" dataKey="success" name="成功数" stroke="#52c41a" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="推荐状态分布" bordered={false} style={{ borderRadius: 12 }}>
                    <div style={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                  <Card title="最近推荐记录" bordered={false} style={{ borderRadius: 12 }}>
                    <Table
                      columns={dashboardColumns}
                      dataSource={recentRecommendations}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={10}>
                  <Card title="优秀推荐人排行" bordered={false} style={{ borderRadius: 12 }}>
                    <List
                      dataSource={topReferrers}
                      renderItem={(item, idx) => (
                        <List.Item key={item.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                            <div style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: idx < 3 ? '#fa8c16' : '#d9d9d9',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12,
                              fontWeight: 600
                            }}>
                              {idx + 1}
                            </div>
                            <Avatar size={36} icon={<UserOutlined />} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>{item.real_name}</div>
                              <div style={{ fontSize: 12, color: '#999' }}>
                                成功{idx + 1}人 · 佣金¥{item.total_commission?.toLocaleString() || 0}
                              </div>
                            </div>
                            <div className={getCreditClass(item.credit_score)}>
                              信用{item.credit_score}
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </Card>
                </Col>
              </Row>
                </>
              )}

              {dashboardTabKey === 'hitrate' && (
                <>
                  <Alert
                    type="info"
                    showIcon
                    message="推荐命中率与曝光权重分析"
                    description="系统根据推荐人命中率动态调整信用评分和曝光权重。命中率越高，曝光权重越大，推荐越容易被企业优先查看。"
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={14}>
                      <Card title="命中率与曝光权重对比" bordered={false} style={{ borderRadius: 12 }}>
                        <div style={{ height: 350 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hitRateAnalysis.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="real_name" 
                                tick={{ fontSize: 11 }} 
                                stroke="#999"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#999" />
                              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#999" />
                              <Tooltip 
                                formatter={(value: number, name: string) => {
                                  if (name === '命中率') return [`${(value * 100).toFixed(1)}%`, '命中率'];
                                  return [value, name];
                                }}
                              />
                              <Legend />
                              <Bar yAxisId="left" dataKey="hit_rate" name="命中率" fill="#52c41a" radius={[4, 4, 0, 0]} />
                              <Bar yAxisId="right" dataKey="exposure_weight" name="曝光权重" fill="#722ed1" radius={[4, 4, 0, 0]} />
                              <Bar yAxisId="right" dataKey="credit_score" name="信用评分" fill="#fa8c16" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={10}>
                      <Card title="按信用分级的平均曝光" bordered={false} style={{ borderRadius: 12 }}>
                        <div style={{ height: 350 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={exposureAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#999" />
                              <YAxis type="category" dataKey="credit_level" tick={{ fontSize: 12 }} stroke="#999" width={70} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="avg_exposure_weight" name="平均曝光权重" fill="#722ed1" radius={[0, 4, 4, 0]} />
                              <Bar dataKey="user_count" name="用户数" fill="#1677ff" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Card title="推荐人命中率排行（Top 15）" bordered={false} style={{ borderRadius: 12 }}>
                    <Table
                      columns={hitRateColumns}
                      dataSource={hitRateAnalysis}
                      rowKey="user_id"
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </>
              )}

              {dashboardTabKey === 'funding' && fundingSupervision && (
                <>
                  <Alert
                    type="success"
                    showIcon
                    message="资金监管看板"
                    description="所有佣金资金由平台监管，根据候选人试用期节点分三期发放。确保资金安全透明。"
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="佣金总额"
                          value={fundingSupervision.total_commission_amount}
                          formatter={(val) => `¥${Number(val).toLocaleString()}`}
                          prefix={<DollarOutlined style={{ color: '#1677ff' }} />}
                          valueStyle={{ color: '#1677ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="已发放佣金"
                          value={fundingSupervision.paid_commission_amount}
                          formatter={(val) => `¥${Number(val).toLocaleString()}`}
                          prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="待发放佣金（监管中）"
                          value={fundingSupervision.pending_commission_amount}
                          formatter={(val) => `¥${Number(val).toLocaleString()}`}
                          prefix={<SafetyOutlined style={{ color: '#fa8c16' }} />}
                          valueStyle={{ color: '#fa8c16' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="监管中交易笔数"
                          value={fundingSupervision.pending_transactions}
                          prefix={<WarningOutlined style={{ color: '#eb2f96' }} />}
                          valueStyle={{ color: '#eb2f96' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={12}>
                      <Card title="佣金发放进度" bordered={false} style={{ borderRadius: 12 }}>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text>已发放比例</Text>
                            <Text strong>
                              {fundingSupervision.total_commission_amount > 0 
                                ? ((fundingSupervision.paid_commission_amount / fundingSupervision.total_commission_amount) * 100).toFixed(1) 
                                : 0}%
                            </Text>
                          </div>
                          <Progress 
                            percent={fundingSupervision.total_commission_amount > 0 
                              ? Math.round((fundingSupervision.paid_commission_amount / fundingSupervision.total_commission_amount) * 100) 
                              : 0}
                            strokeColor={{
                              '0%': '#52c41a',
                              '100%': '#13c2c2'
                            }}
                          />
                        </div>
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="总交易笔数">{fundingSupervision.total_transactions}</Descriptions.Item>
                          <Descriptions.Item label="已完成交易">
                            <Tag color="green">{fundingSupervision.completed_transactions} 笔</Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="处理中交易">
                            <Tag color="orange">{fundingSupervision.pending_transactions} 笔</Tag>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="分期发放状态" bordered={false} style={{ borderRadius: 12 }}>
                        <List
                          dataSource={[
                            { stage: '入职第1个月', ratio: '30%', desc: '候选人通过试用期首月考核后发放', status: '第一期' },
                            { stage: '入职第3个月', ratio: '40%', desc: '候选人通过试用期中期考核后发放', status: '第二期' },
                            { stage: '入职第6个月', ratio: '30%', desc: '候选人正式转正后发放尾款', status: '第三期' }
                          ]}
                          renderItem={(item) => (
                            <List.Item key={item.stage}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                                <Tag color="purple">{item.status}</Tag>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 500 }}>{item.stage}</div>
                                  <div style={{ fontSize: 12, color: '#999' }}>{item.desc}</div>
                                </div>
                                <div style={{ fontSize: 18, fontWeight: 700, color: '#722ed1' }}>
                                  {item.ratio}
                                </div>
                              </div>
                            </List.Item>
                          )}
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              )}

              {dashboardTabKey === 'blockchain' && blockchainStats && (
                <>
                  <Alert
                    type="success"
                    showIcon
                    message="区块链存证统计"
                    description="所有核心业务数据（推荐合约、佣金支付）均已上链存证，确保数据不可篡改，可追溯可验证。"
                    style={{ marginBottom: 16 }}
                  />
                  
                  <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="存证总条数"
                          value={blockchainStats.total_records}
                          prefix={<LinkOutlined style={{ color: '#722ed1' }} />}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="推荐合约存证"
                          value={blockchainStats.recommendation_contracts}
                          prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
                          valueStyle={{ color: '#1677ff' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="佣金支付存证"
                          value={blockchainStats.commission_payment_contracts}
                          prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={12} lg={6}>
                      <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
                        <Statistic
                          title="近24小时新增"
                          value={blockchainStats.last_24h_records}
                          prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
                          valueStyle={{ color: '#fa8c16' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <Card title="存证类型分布" bordered={false} style={{ borderRadius: 12 }}>
                        <div style={{ height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: '推荐合约', value: blockchainStats.recommendation_contracts },
                                  { name: '佣金支付', value: blockchainStats.commission_payment_contracts }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                <Cell fill="#1677ff" />
                                <Cell fill="#52c41a" />
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="存证流程说明" bordered={false} style={{ borderRadius: 12 }}>
                        <Timeline
                          items={[
                            {
                              color: 'blue',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 500 }}>推荐创建</div>
                                  <div style={{ fontSize: 12, color: '#999' }}>推荐人创建推荐时，自动生成推荐合约并存证</div>
                                </div>
                              )
                            },
                            {
                              color: 'green',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 500 }}>状态变更</div>
                                  <div style={{ fontSize: 12, color: '#999' }}>每次状态流转（审核、面试、Offer、入职）均更新存证</div>
                                </div>
                              )
                            },
                            {
                              color: 'purple',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 500 }}>佣金发放</div>
                                  <div style={{ fontSize: 12, color: '#999' }}>每期佣金发放时生成支付合约并存证</div>
                                </div>
                              )
                            },
                            {
                              color: 'orange',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 500 }}>哈希验证</div>
                                  <div style={{ fontSize: 12, color: '#999' }}>所有存证数据可通过区块哈希进行真实性验证</div>
                                </div>
                              )
                            }
                          ]}
                        />
                      </Card>
                    </Col>
                  </Row>
                </>
              )}

              {dashboardTabKey === 'transactions' && (
                <>
                  <Card 
                    title="最近交易流水" 
                    bordered={false} 
                    style={{ borderRadius: 12 }}
                    extra={<Button type="link" onClick={() => setActiveKey('4')}>查看全部 →</Button>}
                  >
                    <Table
                      columns={[
                        {
                          title: '交易类型',
                          dataIndex: 'type',
                          key: 'type',
                          render: (type: string) => {
                            const map: Record<string, string> = {
                              commission: '佣金发放',
                              reward: '赏金支付',
                              deposit: '充值',
                              withdraw: '提现'
                            };
                            return <Tag color="blue">{map[type] || type}</Tag>;
                          }
                        },
                        {
                          title: '金额',
                          dataIndex: 'amount',
                          key: 'amount',
                          render: (val: number) => <span className="reward-text">¥{val.toLocaleString()}</span>
                        },
                        {
                          title: '付款方',
                          dataIndex: 'from_user_name',
                          key: 'from_user_name'
                        },
                        {
                          title: '收款方',
                          dataIndex: 'to_user_name',
                          key: 'to_user_name'
                        },
                        {
                          title: '候选人',
                          dataIndex: 'candidate_name',
                          key: 'candidate_name',
                          render: (val: string) => val || '-'
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          key: 'status',
                          render: (status: string) => {
                            const map: Record<string, { color: string; text: string }> = {
                              completed: { color: 'green', text: '已完成' },
                              pending: { color: 'orange', text: '处理中' },
                              failed: { color: 'red', text: '失败' }
                            };
                            const s = map[status] || { color: 'default', text: status };
                            return <Tag color={s.color}>{s.text}</Tag>;
                          }
                        },
                        {
                          title: '交易流水号',
                          dataIndex: 'txn_id',
                          key: 'txn_id',
                          render: (val: string) => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#999' }}>{val}</span>
                        },
                        {
                          title: '交易时间',
                          dataIndex: 'created_at',
                          key: 'created_at',
                          render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm')
                        }
                      ]}
                      dataSource={recentTransactions}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </>
              )}
            </>
          ) : null}
        </div>
      )
    },
    {
      key: '2',
      label: (
        <span>
          <TeamOutlined />
          用户管理
        </span>
      ),
      children: (
        <div>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>用户列表</Title>
              <Space>
                <Select
                  placeholder="角色筛选"
                  style={{ width: 140 }}
                  allowClear
                  value={userFilters.role || undefined}
                  onChange={(val) => setUserFilters({ ...userFilters, role: val || '' })}
                >
                  <Option value="user">猎头顾问</Option>
                  <Option value="company">企业用户</Option>
                  <Option value="admin">管理员</Option>
                </Select>
                <Input.Search
                  placeholder="搜索用户名/姓名/手机号"
                  style={{ width: 200 }}
                  allowClear
                  onSearch={(val) => setUserFilters({ ...userFilters, keyword: val })}
                />
                <Button
                  type="primary"
                  icon={<UserOutlined />}
                  onClick={() => { setEditingUser(null); userForm.resetFields(); setUserModalVisible(true); }}
                >
                  创建用户
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchUsers}>刷新</Button>
              </Space>
            </div>
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              loading={loading}
              pagination={{
                current: userPage,
                pageSize: userPageSize,
                total: usersTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, ps) => { setUserPage(p); setUserPageSize(ps); }
              }}
            />
          </Card>

          <Modal
            title={editingUser ? '编辑用户' : '创建用户'}
            open={userModalVisible}
            onCancel={() => { setUserModalVisible(false); setEditingUser(null); }}
            footer={null}
            destroyOnClose
          >
            <Form form={userForm} layout="vertical" onFinish={handleUserSubmit}>
              <Form.Item name="username" label="用户名" rules={[{ required: !editingUser }]}>
                <Input disabled={!!editingUser} placeholder="请输入用户名" />
              </Form.Item>
              {!editingUser && (
                <Form.Item name="password" label="密码" rules={[{ required: true }]}>
                  <Input.Password placeholder="请输入密码" />
                </Form.Item>
              )}
              <Form.Item name="real_name" label="真实姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
                    <Input placeholder="请输入手机号" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="email" label="邮箱">
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="role" label="角色" rules={[{ required: true }]}>
                <Select>
                  <Option value="user">猎头顾问</Option>
                  <Option value="company">企业用户</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => { setUserModalVisible(false); setEditingUser(null); }}>取消</Button>
                  <Button type="primary" htmlType="submit">{editingUser ? '更新' : '创建'}</Button>
                </Space>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      )
    },
    {
      key: '3',
      label: (
        <span>
          <SafetyOutlined />
          可信度分析
        </span>
      ),
      children: (
        <div>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <Alert
              type="info"
              showIcon
              message="可信度评估系统"
              description="系统根据用户的推荐成功率、入职率、历史行为等多维度数据自动计算用户信用评分和曝光权重。信用评分越高，推荐越容易被企业看到。"
              style={{ marginBottom: 16 }}
            />
            <Title level={5} style={{ marginBottom: 16 }}>选择用户查看可信度详情</Title>
            <Select
              placeholder="请选择用户"
              style={{ width: 300 }}
              showSearch
              optionFilterProp="children"
              value={selectedUserId || undefined}
              onChange={(val) => { setSelectedUserId(val); fetchCredibilityDetail(val); }}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.real_name} ({user.username}) - {getRoleTag(user.role)}
                </Option>
              ))}
            </Select>
          </Card>

          {credibilityDetail && (
            <Card
              title={`${credibilityDetail.real_name} 的可信度分析`}
              bordered={false}
              style={{ borderRadius: 12 }}
              extra={
                <Button
                  type="primary"
                  onClick={() => handleRecalculateCredibility(credibilityDetail.user_id)}
                  icon={<ReloadOutlined />}
                >
                  重新计算
                </Button>
              }
            >
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={12}>
                  <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: `6px solid ${credibilityDetail.current_credit_score >= 80 ? '#52c41a' : credibilityDetail.current_credit_score >= 60 ? '#fa8c16' : '#ff4d4f'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                        color: credibilityDetail.current_credit_score >= 80 ? '#52c41a' : credibilityDetail.current_credit_score >= 60 ? '#fa8c16' : '#ff4d4f'
                      }}>
                        {credibilityDetail.current_credit_score}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>当前信用评分</div>
                        <Progress
                          percent={credibilityDetail.current_credit_score}
                          showInfo={false}
                          strokeColor={{
                            '0%': '#52c41a',
                            '100%': '#13c2c2'
                          }}
                          style={{ width: 200 }}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: `6px solid ${credibilityDetail.current_exposure_weight >= 80 ? '#722ed1' : credibilityDetail.current_exposure_weight >= 60 ? '#eb2f96' : '#fa8c16'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                        color: credibilityDetail.current_exposure_weight >= 80 ? '#722ed1' : credibilityDetail.current_exposure_weight >= 60 ? '#eb2f96' : '#fa8c16'
                      }}>
                        {credibilityDetail.current_exposure_weight}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>曝光权重</div>
                        <Progress
                          percent={credibilityDetail.current_exposure_weight}
                          showInfo={false}
                          strokeColor={{
                            '0%': '#722ed1',
                            '100%': '#eb2f96'
                          }}
                          style={{ width: 200 }}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>

              {credibilityDetail.latest_calculation && (
                <Card title="最新计算结果" bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
                  <Descriptions bordered column={2} size="small">
                    {Object.entries(credibilityDetail.latest_calculation).map(([key, value]) => (
                      typeof value === 'number' || typeof value === 'string' ? (
                        <Descriptions.Item key={key} label={key}>
                          {typeof value === 'number' ? value.toFixed(4) : String(value)}
                        </Descriptions.Item>
                      ) : null
                    ))}
                  </Descriptions>
                </Card>
              )}

              <Card title="历史记录" bordered={false} style={{ borderRadius: 12 }}>
                <Timeline
                  items={credibilityDetail.history.map((item, idx) => ({
                    color: idx === 0 ? '#1677ff' : '#d9d9d9',
                    children: (
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          信用分: <span className={getCreditClass(item.credit_score)}>{item.credit_score}</span>
                          {' · '}
                          曝光权重: {item.exposure_weight}
                        </div>
                        <div style={{ fontSize: 12, color: '#999' }}>
                          {dayjs(item.calculated_at).format('YYYY-MM-DD HH:mm:ss')}
                        </div>
                      </div>
                    )
                  }))}
                />
              </Card>
            </Card>
          )}
        </div>
      )
    },
    {
      key: '4',
      label: (
        <span>
          <DollarOutlined />
          资金流水
        </span>
      ),
      children: (
        <div>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>资金流水记录</Title>
              <Space>
                <Select
                  placeholder="交易类型"
                  style={{ width: 140 }}
                  allowClear
                  value={transFilters.type || undefined}
                  onChange={(val) => setTransFilters({ ...transFilters, type: val || '' })}
                >
                  <Option value="commission">佣金发放</Option>
                  <Option value="reward">赏金支付</Option>
                  <Option value="deposit">充值</Option>
                  <Option value="withdraw">提现</Option>
                </Select>
                <Select
                  placeholder="交易状态"
                  style={{ width: 140 }}
                  allowClear
                  value={transFilters.status || undefined}
                  onChange={(val) => setTransFilters({ ...transFilters, status: val || '' })}
                >
                  <Option value="completed">已完成</Option>
                  <Option value="pending">处理中</Option>
                  <Option value="failed">失败</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={fetchTransactions}>刷新</Button>
              </Space>
            </div>
            <Table
              columns={transColumns}
              dataSource={transactions}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                current: transPage,
                pageSize: transPageSize,
                total: transTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, ps) => { setTransPage(p); setTransPageSize(ps); }
              }}
            />
          </Card>
        </div>
      )
    },
    {
      key: '5',
      label: (
        <span>
          <LinkOutlined />
          区块链存证
        </span>
      ),
      children: (
        <div>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>区块链存证记录</Title>
              <Space>
                <Select
                  placeholder="合约类型"
                  style={{ width: 160 }}
                  allowClear
                  value={bcFilter || undefined}
                  onChange={(val) => setBcFilter(val || '')}
                >
                  <Option value="recommendation">推荐合约</Option>
                  <Option value="commission_payment">佣金支付</Option>
                </Select>
                <Button icon={<ReloadOutlined />} onClick={fetchBlockchainRecords}>刷新</Button>
              </Space>
            </div>
            <Alert
              type="success"
              showIcon
              message="所有关键操作均已上链存证"
              description="推荐记录、佣金支付等核心数据已通过区块链进行存证，确保数据不可篡改，保障交易安全透明。"
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={bcColumns}
              dataSource={blockchainRecords}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                current: bcPage,
                pageSize: bcPageSize,
                total: bcTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, ps) => { setBcPage(p); setBcPageSize(ps); }
              }}
            />
          </Card>
        </div>
      )
    },
    {
      key: '6',
      label: (
        <span>
          <FileTextOutlined />
          操作日志
        </span>
      ),
      children: (
        <div>
          <Card bordered={false} style={{ borderRadius: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0 }}>系统操作日志</Title>
              <Button icon={<ReloadOutlined />} onClick={fetchAuditLogs}>刷新</Button>
            </div>
            <Table
              columns={logColumns}
              dataSource={auditLogs}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                current: logsPage,
                pageSize: logsPageSize,
                total: logsTotal,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, ps) => { setLogsPage(p); setLogsPageSize(ps); }
              }}
            />
          </Card>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyOutlined />
          管理后台
        </Title>
        <Text type="secondary">平台数据管理与系统配置</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} size="large" />
      </Card>

      <Modal
        title="可信度详情"
        open={credibilityModalVisible}
        onCancel={() => { setCredibilityModalVisible(false); setCredibilityDetail(null); }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {credibilityDetail && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: `6px solid ${credibilityDetail.current_credit_score >= 80 ? '#52c41a' : credibilityDetail.current_credit_score >= 60 ? '#fa8c16' : '#ff4d4f'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 700,
                      color: credibilityDetail.current_credit_score >= 80 ? '#52c41a' : credibilityDetail.current_credit_score >= 60 ? '#fa8c16' : '#ff4d4f'
                    }}>
                      {credibilityDetail.current_credit_score}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>当前信用评分</div>
                      <Progress
                        percent={credibilityDetail.current_credit_score}
                        showInfo={false}
                        strokeColor={{
                          '0%': '#52c41a',
                          '100%': '#13c2c2'
                        }}
                        style={{ width: 150 }}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card bordered={false} style={{ background: '#fafafa', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: `6px solid ${credibilityDetail.current_exposure_weight >= 80 ? '#722ed1' : credibilityDetail.current_exposure_weight >= 60 ? '#eb2f96' : '#fa8c16'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 700,
                      color: credibilityDetail.current_exposure_weight >= 80 ? '#722ed1' : credibilityDetail.current_exposure_weight >= 60 ? '#eb2f96' : '#fa8c16'
                    }}>
                      {credibilityDetail.current_exposure_weight}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: '#999', marginBottom: 4 }}>曝光权重</div>
                      <Progress
                        percent={credibilityDetail.current_exposure_weight}
                        showInfo={false}
                        strokeColor={{
                          '0%': '#722ed1',
                          '100%': '#eb2f96'
                        }}
                        style={{ width: 150 }}
                      />
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
            <Card title="历史记录" bordered={false} style={{ borderRadius: 12 }}>
              <Timeline
                items={credibilityDetail.history.map((item, idx) => ({
                  color: idx === 0 ? '#1677ff' : '#d9d9d9',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        信用分: <span className={getCreditClass(item.credit_score)}>{item.credit_score}</span>
                        {' · '}
                        曝光权重: {item.exposure_weight}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        {dayjs(item.calculated_at).format('YYYY-MM-DD HH:mm:ss')}
                      </div>
                    </div>
                  )
                }))}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admin;
