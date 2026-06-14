import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography, Spin, Button, Space, Steps, Timeline, List, Avatar, Badge, Divider } from 'antd';
import {
  FileTextOutlined,
  GiftOutlined,
  UserSwitchOutlined,
  DollarOutlined,
  RiseOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  SafetyOutlined,
  ToolOutlined,
  MessageOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useAuthStore } from '../store/auth';

const { Title, Text } = Typography;
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface Stats {
  totalResumes: number;
  totalJobs: number;
  totalRecommendations: number;
  totalCommission: number;
  successRate: number;
  pendingReviews: number;
}

interface RecentActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  time: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalResumes: 0,
    totalJobs: 0,
    totalRecommendations: 0,
    totalCommission: 0,
    successRate: 0,
    pendingReviews: 0
  });
  const [recentRecommendations, setRecentRecommendations] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [todoList, setTodoList] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [resumesRes, jobsRes, recommendationsRes] = await Promise.all([
        axios.get('/api/resumes', { params: { pageSize: 1 } }),
        axios.get('/api/jobs', { params: { pageSize: 1 } }),
        axios.get('/api/recommendations', { params: { pageSize: 10 } })
      ]);

      const myResumes = await axios.get('/api/resumes/mine').catch(() => ({ data: [] }));
      const myRecommendations = await axios.get('/api/recommendations/mine').catch(() => ({ data: [] }));

      const allRecommendations = recommendationsRes.data.list || myRecommendations.data || [];
      
      const totalCommission = user?.total_commission || 0;
      const successHires = user?.success_hires || 0;
      const totalRecs = user?.total_recommendations || 0;
      const successRate = totalRecs > 0 ? Math.round((successHires / totalRecs) * 100) : 0;

      const pendingReviews = allRecommendations.filter(
        (r: any) => r.status === 'pending' || r.status === 'reviewing'
      ).length;
      const interviewingCount = allRecommendations.filter((r: any) => r.status === 'interviewing').length;
      const hiredCount = allRecommendations.filter((r: any) => r.status === 'hired').length;
      const probationCount = allRecommendations.filter((r: any) => r.status === 'probation').length;
      const completedCount = allRecommendations.filter((r: any) => r.status === 'completed').length;
      const rejectedCount = allRecommendations.filter((r: any) => r.status === 'rejected').length;

      setStats({
        totalResumes: resumesRes.data.total || myResumes.data.length || 0,
        totalJobs: jobsRes.data.total || 0,
        totalRecommendations: recommendationsRes.data.total || myRecommendations.data.length || 0,
        totalCommission,
        successRate,
        pendingReviews
      });

      const recentRecs = allRecommendations.slice(0, 5);
      setRecentRecommendations(recentRecs);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = dayjs().subtract(6 - i, 'day');
        return {
          date: date.format('MM-DD'),
          recommendations: Math.floor(Math.random() * 10) + 1,
          hires: Math.floor(Math.random() * 3)
        };
      });
      setChartData(last7Days);

      setStatusData([
        { name: '待审核', value: pendingReviews || 2, color: '#fa8c16' },
        { name: '面试中', value: interviewingCount || 5, color: '#1890ff' },
        { name: '已录用', value: hiredCount || 3, color: '#52c41a' },
        { name: '试用期', value: probationCount || 2, color: '#13c2c2' },
        { name: '已完成', value: completedCount || 8, color: '#722ed1' },
        { name: '已拒绝', value: rejectedCount || 3, color: '#ff4d4f' }
      ]);

      const todos: any[] = [];
      const pendingRec = allRecommendations.find((r: any) => r.status === 'pending');
      const interviewRec = allRecommendations.find((r: any) => r.status === 'interviewing');
      const probationRec = allRecommendations.find((r: any) => r.status === 'probation');
      const commissionRec = allRecommendations.find((r: any) => r.status === 'completed' || r.status === 'probation');

      if (pendingRec) {
        todos.push({
          id: pendingRec.id,
          recommendation_id: pendingRec.id,
          type: 'review',
          title: `${pendingRec.candidate_name} 的推荐待企业审核`,
          time: dayjs(pendingRec.created_at).fromNow(),
          status: 'pending',
          action_label: '去审核',
          action_type: 'review'
        });
      }
      if (interviewRec) {
        todos.push({
          id: interviewRec.id * 10 + 1,
          recommendation_id: interviewRec.id,
          type: 'interview',
          title: `${interviewRec.candidate_name} 的面试待安排`,
          time: dayjs(interviewRec.updated_at).fromNow(),
          status: 'urgent',
          action_label: '安排面试',
          action_type: 'interview'
        });
      }
      if (probationRec) {
        todos.push({
          id: probationRec.id * 10 + 2,
          recommendation_id: probationRec.id,
          type: 'probation',
          title: `${probationRec.candidate_name} 的试用期反馈待提交`,
          time: '2天前',
          status: 'normal',
          action_label: '提交反馈',
          action_type: 'probation'
        });
      }
      if (commissionRec) {
        todos.push({
          id: commissionRec.id * 10 + 3,
          recommendation_id: commissionRec.id,
          type: 'commission',
          title: `${commissionRec.candidate_name} 的佣金发放跟踪`,
          time: '3天前',
          status: 'normal',
          action_label: '查看流水',
          action_type: 'commission'
        });
      }

      if (todos.length === 0) {
        todos.push(
          { id: 1, type: 'review', title: '张三的推荐待企业审核', time: '10分钟前', status: 'pending', action_label: '去审核', action_type: 'review', recommendation_id: 1 },
          { id: 2, type: 'interview', title: '李四的面试安排在今天下午2点', time: '1小时前', status: 'urgent', action_label: '安排面试', action_type: 'interview', recommendation_id: 2 }
        );
      }
      setTodoList(todos);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待审核' },
      reviewing: { color: 'blue', text: '审核中' },
      interviewing: { color: 'cyan', text: '面试中' },
      hired: { color: 'green', text: '已录用' },
      probation: { color: 'geekblue', text: '试用期' },
      completed: { color: 'purple', text: '已完成' },
      rejected: { color: 'red', text: '已拒绝' },
      candidate_withdrew: { color: 'default', text: '候选人放弃' }
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const columns = [
    {
      title: '候选人',
      dataIndex: 'candidate_name',
      key: 'candidate_name',
      width: 100,
      render: (val: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{val}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{record.current_position}</div>
        </div>
      )
    },
    {
      title: '目标职位',
      dataIndex: 'job_title',
      key: 'job_title',
      width: 130,
      render: (val: string, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{val}</div>
          <div style={{ fontSize: 11, color: '#999' }}>悬赏: ¥{record.reward_amount?.toLocaleString()}</div>
        </div>
      )
    },
    {
      title: '推荐人',
      dataIndex: 'referrer_name',
      key: 'referrer_name',
      width: 80,
      render: (val: string, record: any) => (
        <div>
          <div>{val}</div>
          <div style={{ fontSize: 11, color: '#1677ff' }}>信用: {record.referrer_credit}</div>
        </div>
      )
    },
    {
      title: '佣金比例',
      dataIndex: 'commission_rate',
      key: 'commission_rate',
      width: 80,
      render: (val: number) => (
        <Tag color="blue">{(val * 100).toFixed(0)}%</Tag>
      )
    },
    {
      title: '佣金金额',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      width: 90,
      render: (val: number) => <span className="reward-text" style={{ fontWeight: 600 }}>¥{val?.toLocaleString()}</span>
    },
    {
      title: '分期发放',
      key: 'installments',
      width: 100,
      render: (_: any, record: any) => (
        <div style={{ fontSize: 11, color: '#666' }}>
          3期 · 1/3/6月
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => getActionButton(record)
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getTodoIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      review: <ClockCircleOutlined style={{ color: '#fa8c16' }} />,
      interview: <VideoCameraOutlined style={{ color: '#1890ff' }} />,
      probation: <UserOutlined style={{ color: '#13c2c2' }} />,
      commission: <DollarOutlined style={{ color: '#52c41a' }} />
    };
    return icons[type] || <ClockCircleOutlined />;
  };

  const handleTodoAction = (item: any) => {
    if (item.action_type === 'commission') {
      navigate(`/recommendations/${item.recommendation_id}#transactions`);
    } else {
      navigate(`/recommendations/${item.recommendation_id}?action=${item.action_type}`);
    }
  };

  const getActionButton = (record: any) => {
    const actions: React.ReactNode[] = [
      <Button
        key="view"
        type="link"
        size="small"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/recommendations/${record.id}`)}
      >
        详情
      </Button>
    ];

    if (record.status === 'pending' || record.status === 'reviewing') {
      actions.push(
        <Button
          key="review"
          type="primary"
          size="small"
          icon={<EditOutlined />}
          onClick={() => navigate(`/recommendations/${record.id}?action=review`)}
        >
          审核
        </Button>
      );
    }

    if (record.status === 'reviewing' || record.status === 'interviewing') {
      actions.push(
        <Button
          key="interview"
          type="link"
          size="small"
          icon={<VideoCameraOutlined />}
          onClick={() => navigate(`/recommendations/${record.id}?action=interview`)}
        >
          安排面试
        </Button>
      );
    }

    if (record.status === 'interviewing') {
      actions.push(
        <Button
          key="offer"
          type="link"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => navigate(`/recommendations/${record.id}?action=offer`)}
        >
          发送Offer
        </Button>
      );
    }

    if (record.status === 'probation') {
      actions.push(
        <Button
          key="feedback"
          type="primary"
          size="small"
          icon={<UserOutlined />}
          onClick={() => navigate(`/recommendations/${record.id}?action=probation`)}
        >
          试用期反馈
        </Button>
      );
    }

    return <Space size={4} wrap>{actions}</Space>;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>
              欢迎回来，{user?.real_name}
            </Title>
            <Text type="secondary">
              {dayjs().format('YYYY年MM月DD日 dddd')} · 祝您工作顺利
            </Text>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/resumes')}>
                上传简历
              </Button>
              <Button icon={<UserSwitchOutlined />} onClick={() => navigate('/jobs')}>
                推荐候选人
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card 
            className="card-hover" 
            bordered={false} 
            style={{ borderRadius: 12, cursor: 'pointer' }}
            onClick={() => navigate('/resumes')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: '#e6f4ff', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>简历库</div>
                <div style={{ fontSize: 12, color: '#999' }}>管理候选人简历</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card 
            className="card-hover" 
            bordered={false} 
            style={{ borderRadius: 12, cursor: 'pointer' }}
            onClick={() => navigate('/jobs')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: '#f9f0ff', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <GiftOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>职位悬赏</div>
                <div style={{ fontSize: 12, color: '#999' }}>查看企业悬赏职位</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card 
            className="card-hover" 
            bordered={false} 
            style={{ borderRadius: 12, cursor: 'pointer' }}
            onClick={() => navigate('/recommendations')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: '#e6fffb', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <UserSwitchOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>推荐管理</div>
                <div style={{ fontSize: 12, color: '#999' }}>跟踪推荐进度与佣金</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card 
            className="card-hover" 
            bordered={false} 
            style={{ borderRadius: 12, cursor: 'pointer' }}
            onClick={() => navigate('/toolbox')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: '#fff7e6', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <ToolOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>猎头工具箱</div>
                <div style={{ fontSize: 12, color: '#999' }}>人才画像·风险评估</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card 
            className="card-hover" 
            bordered={false} 
            style={{ borderRadius: 12, cursor: 'pointer' }}
            onClick={() => navigate('/im')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: '#f6ffed', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <MessageOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>消息中心</div>
                <div style={{ fontSize: 12, color: '#999' }}>IM沟通·视频面试</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card 
            className="card-hover" 
            bordered={false} 
            style={{ borderRadius: 12, cursor: 'pointer' }}
            onClick={() => navigate('/admin')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 12, 
                background: '#fff1f0', display: 'flex', 
                alignItems: 'center', justifyContent: 'center' 
              }}>
                <SettingOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>管理后台</div>
                <div style={{ fontSize: 12, color: '#999' }}>可信度·资金流水</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: 14 }}>简历总数</span>}
              value={stats.totalResumes}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 12 }} />
              <Text type="success" style={{ fontSize: 12 }}>本周新增 12</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: 14 }}>职位悬赏</span>}
              value={stats.totalJobs}
              prefix={<GiftOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 12 }} />
              <Text type="success" style={{ fontSize: 12 }}>本周新增 5</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: 14 }}>推荐次数</span>}
              value={stats.totalRecommendations}
              prefix={<UserSwitchOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>成功率：</Text>
              <Text strong style={{ fontSize: 12, color: '#52c41a' }}>{stats.successRate}%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="card-hover" bordered={false} style={{ borderRadius: 12 }}>
            <Statistic
              title={<span style={{ color: '#666', fontSize: 14 }}>累计佣金</span>}
              value={stats.totalCommission}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              formatter={(val) => `¥${Number(val).toLocaleString()}`}
            />
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowUpOutlined style={{ color: '#52c41a', fontSize: 12 }} />
              <Text type="success" style={{ fontSize: 12 }}>本月 ¥{Math.round(stats.totalCommission * 0.15).toLocaleString()}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="最近7天推荐趋势" bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#999" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="recommendations"
                    name="推荐数"
                    stroke="#1677ff"
                    strokeWidth={3}
                    dot={{ fill: '#1677ff', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hires"
                    name="成功入职"
                    stroke="#52c41a"
                    strokeWidth={3}
                    dot={{ fill: '#52c41a', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="推荐状态分布" bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ height: 300, display: 'flex', flexDirection: 'column' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                {statusData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <Text style={{ fontSize: 11 }}>{item.name}</Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="推荐状态闭环"
            bordered={false}
            style={{ borderRadius: 12 }}
            extra={<Button type="link" onClick={() => navigate('/recommendations')}>管理推荐 →</Button>}
          >
            <Steps
              current={1}
              items={[
                {
                  title: '创建推荐',
                  status: 'finish',
                  description: '提交简历至企业',
                  icon: <UserSwitchOutlined />
                },
                {
                  title: '企业审核',
                  status: 'process',
                  description: '待HR审核简历',
                  icon: <ClockCircleOutlined />
                },
                {
                  title: '面试安排',
                  status: 'wait',
                  description: '视频面试预约',
                  icon: <VideoCameraOutlined />
                },
                {
                  title: '录用入职',
                  status: 'wait',
                  description: '发放offer入职',
                  icon: <CheckCircleOutlined />
                },
                {
                  title: '试用期考核',
                  status: 'wait',
                  description: '1/3/6月反馈',
                  icon: <UserOutlined />
                },
                {
                  title: '分佣发放',
                  status: 'wait',
                  description: '佣金分期到账',
                  icon: <DollarOutlined />
                }
              ]}
            />
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: '待审核', count: 2, color: '#fa8c16', status: 'pending' },
                { label: '面试中', count: 5, color: '#1890ff', status: 'interviewing' },
                { label: '已录用', count: 3, color: '#52c41a', status: 'hired' },
                { label: '试用期', count: 2, color: '#13c2c2', status: 'probation' },
                { label: '已完成', count: 8, color: '#722ed1', status: 'completed' }
              ].map((item, idx) => (
                <Button
                  key={idx}
                  type="text"
                  style={{ 
                    border: `1px solid ${item.color}20`, 
                    background: `${item.color}08`,
                    color: item.color,
                    borderRadius: 8,
                    padding: '8px 16px',
                    height: 'auto'
                  }}
                  onClick={() => navigate(`/recommendations?status=${item.status}`)}
                >
                  <Space direction="vertical" size={0} style={{ display: 'flex' }}>
                    <Text style={{ fontSize: 20, fontWeight: 600, color: item.color }}>{item.count}</Text>
                    <Text style={{ fontSize: 12 }}>{item.label}</Text>
                  </Space>
                </Button>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="待办事项"
            bordered={false}
            style={{ borderRadius: 12 }}
            extra={<Badge count={todoList.length} size="small" />}
          >
            <List
              dataSource={todoList}
              renderItem={(item: any) => (
                <List.Item
                  style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                  onClick={() => handleTodoAction(item)}
                  actions={[
                    <Button 
                      type={item.status === 'urgent' ? 'primary' : 'link'} 
                      size="small" 
                      onClick={(e) => { e.stopPropagation(); handleTodoAction(item); }}
                    >
                      {item.action_label || '处理'}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          background: item.status === 'urgent' ? '#ff4d4f' : '#e6f4ff',
                          color: item.status === 'urgent' ? '#fff' : '#1677ff'
                        }}
                        icon={getTodoIcon(item.type)}
                      />
                    }
                    title={
                      <Space>
                        {item.status === 'urgent' && <Tag color="red" style={{ margin: 0 }}>紧急</Tag>}
                        <span style={{ fontWeight: 500 }}>{item.title}</span>
                      </Space>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="最近推荐记录"
            bordered={false}
            style={{ borderRadius: 12 }}
            extra={<Button type="link" onClick={() => navigate('/recommendations')}>查看全部 →</Button>}
          >
            <Table
              columns={columns}
              dataSource={recentRecommendations}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 900 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="个人绩效" bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ marginBottom: 20 }}>
              <div className="progress-label">
                <span>本月推荐目标</span>
                <span>{stats.totalRecommendations}/30</span>
              </div>
              <Progress percent={Math.min(Math.round((stats.totalRecommendations / 30) * 100), 100)} strokeColor="#1677ff" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="progress-label">
                <span>成功入职目标</span>
                <span>{user?.success_hires || 0}/5</span>
              </div>
              <Progress percent={Math.min(Math.round(((user?.success_hires || 0) / 5) * 100), 100)} strokeColor="#52c41a" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div className="progress-label">
                <span>信用评分</span>
                <span>{user?.credit_score || 0}/100</span>
              </div>
              <Progress
                percent={user?.credit_score || 0}
                strokeColor={{
                  '0%': '#52c41a',
                  '100%': '#13c2c2'
                }}
              />
            </div>
            <div>
              <div className="progress-label">
                <span>曝光权重</span>
                <span>{user?.exposure_weight || 0}/100</span>
              </div>
              <Progress
                percent={user?.exposure_weight || 0}
                strokeColor={{
                  '0%': '#722ed1',
                  '100%': '#eb2f96'
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
