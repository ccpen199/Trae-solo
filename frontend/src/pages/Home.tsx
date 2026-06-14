import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  List,
  Tag,
  Button,
  Space,
  Avatar,
  Progress,
  Empty,
  Spin,
} from 'antd';
import {
  HomeOutlined,
  SolutionOutlined,
  FileTextOutlined,
  TeamOutlined,
  CalendarOutlined,
  BankOutlined,
  AlertOutlined,
  BarChartOutlined,
  UserOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  SafetyOutlined,
  StarOutlined,
  MessageOutlined,
  PictureOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  FileProtectOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { isEnterprise, isJobseeker, isAdmin, getUser } from '../utils/auth';
import { jobs, resumes, interviews, admin } from '../api/endpoints';
import type { User, Job, InterviewSchedule } from '../types';

const { Title, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const user = getUser() as User | null;
  const [loading, setLoading] = useState(true);

  const [enterpriseStats, setEnterpriseStats] = useState({ activeJobs: 0, totalResumes: 0, pendingInterviews: 0, recentJobs: [] as Job[] });
  const [jobseekerStats, setJobseekerStats] = useState({ totalJobs: 0, applications: 0, pendingInterviews: 0 });
  const [adminStats, setAdminStats] = useState({ userCount: 0, jobCount: 0, resumeCount: 0, companyCount: 0, postCount: 0, interviewCount: 0 });
  const [enterpriseInterviews, setEnterpriseInterviews] = useState<InterviewSchedule[]>([]);
  const [adminWarnings, setAdminWarnings] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (isEnterprise()) {
        const [jobsRes, resumesRes, interviewsRes] = await Promise.allSettled([
          jobs.list({ pageSize: 100 }),
          resumes.list({ pageSize: 100 }),
          interviews.list({ pageSize: 10, status: 'scheduled' }),
        ]);

        const jobList = jobsRes.status === 'fulfilled' ? (jobsRes.value as any)?.data?.data || [] : [];
        const resumeList = resumesRes.status === 'fulfilled' ? (resumesRes.value as any)?.data?.list || [] : [];
        const interviewList = interviewsRes.status === 'fulfilled' ? (interviewsRes.value as any)?.data?.data || [] : [];

        setEnterpriseStats({
          activeJobs: jobList.filter((j: Job) => j.status === 'active').length,
          totalResumes: resumeList.length,
          pendingInterviews: interviewList.length,
          recentJobs: jobList.slice(0, 5),
        });
        setEnterpriseInterviews(interviewList);
      } else if (isJobseeker()) {
        const [jobsRes, applicationsRes, interviewsRes] = await Promise.allSettled([
          jobs.list({ pageSize: 1 }),
          Promise.resolve({ data: { data: { total: 0 } } }),
          interviews.list({ pageSize: 10, status: 'scheduled' }),
        ]);

        const totalJobs = jobsRes.status === 'fulfilled' ? (jobsRes.value as any)?.data?.total || 0 : 0;
        const interviewList = interviewsRes.status === 'fulfilled' ? (interviewsRes.value as any)?.data?.data || [] : [];

        setJobseekerStats({
          totalJobs,
          applications: 0,
          pendingInterviews: interviewList.length,
        });
      } else if (isAdmin()) {
        const [statsRes, warningsRes] = await Promise.allSettled([
          admin.statistics(),
          admin.warnings({ pageSize: 5 }),
        ]);

        if (statsRes.status === 'fulfilled') {
          const data = (statsRes.value as any)?.data;
          setAdminStats({
            userCount: data?.userCount ?? 0,
            jobCount: data?.jobCount ?? 0,
            resumeCount: data?.resumeCount ?? 0,
            companyCount: data?.companyCount ?? 0,
            postCount: data?.postCount ?? 0,
            interviewCount: data?.interviewCount ?? 0,
          });
        }

        if (warningsRes.status === 'fulfilled') {
          setAdminWarnings((warningsRes.value as any)?.data?.data || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const jobTrendOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: [12, 19, 15, 22, 18, 8, 5],
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(24, 144, 255, 0.2)' },
        lineStyle: { color: '#1890ff' },
      },
    ],
  };

  const renderEnterpriseDashboard = () => {
    const quickActions = [
      { icon: <PlusOutlined />, title: '发布新岗位', desc: '结构化录入印刷行业岗位JD', path: '/enterprise/jobs/new', color: '#1890ff' },
      { icon: <FileTextOutlined />, title: 'AI简历解析', desc: '自动提取PS/凹印/ISO等信息', path: '/enterprise/resumes', color: '#52c41a' },
      { icon: <TeamOutlined />, title: '人才推荐', desc: '技能图谱智能匹配推荐', path: '/enterprise/recommend', color: '#722ed1' },
      { icon: <CalendarOutlined />, title: '面试安排', desc: '面试日程管理与日历同步', path: '/enterprise/interviews', color: '#fa8c16' },
    ];

    const stats = [
      { title: '招聘中岗位', value: enterpriseStats.activeJobs, icon: <SolutionOutlined />, color: '#1890ff' },
      { title: '收到简历', value: enterpriseStats.totalResumes, icon: <FileTextOutlined />, color: '#52c41a' },
      { title: '待面试', value: enterpriseStats.pendingInterviews, icon: <CalendarOutlined />, color: '#fa8c16' },
      { title: '本月入职', value: 0, icon: <TeamOutlined />, color: '#722ed1' },
    ];

    return (
      <div>
        <Card
          style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #001529 0%, #1890ff 100%)', color: 'white', border: 'none' }}
          styles={{ body: { padding: '24px' } }}
        >
          <Row align="middle">
            <Col flex="auto">
              <Title level={3} style={{ color: 'white', margin: '0 0 8px' }}>
                欢迎回来，{user?.name || '企业用户'} 👋
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                当前有 {enterpriseStats.activeJobs} 个岗位招聘中，{enterpriseStats.pendingInterviews} 个面试待安排
              </Text>
            </Col>
            <Col>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/enterprise/jobs/new')} style={{ height: '44px', padding: '0 24px' }}>
                发布新岗位
              </Button>
            </Col>
          </Row>
        </Card>

        <Card title="快捷功能" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={12} sm={6} key={index}>
                <Card hoverable onClick={() => navigate(action.path)} style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }} styles={{ body: { padding: '20px 16px' } }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px', color: action.color }}>
                    {action.icon}
                  </div>
                  <Text strong style={{ fontSize: '14px' }}>{action.title}</Text>
                  <div style={{ marginTop: '4px' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{action.desc}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          {stats.map((stat, index) => (
            <Col xs={12} sm={6} key={index}>
              <Card><Statistic title={stat.title} value={stat.value} prefix={<span style={{ color: stat.color }}>{stat.icon}</span>} valueStyle={{ color: stat.color }} /></Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} lg={16}>
            <Card title="岗位列表" extra={<Button type="link" size="small" onClick={() => navigate('/enterprise/jobs')}>查看全部 <ArrowRightOutlined /></Button>}>
              {enterpriseStats.recentJobs.length > 0 ? (
                <List
                  dataSource={enterpriseStats.recentJobs}
                  renderItem={(job: Job) => (
                    <List.Item
                      actions={[<Button type="link" size="small" onClick={() => navigate(`/enterprise/jobs/${job.id}/edit`)}>编辑</Button>]}
                    >
                      <List.Item.Meta
                        title={<Space><Text strong>{job.title}</Text><Tag color={job.status === 'active' ? 'green' : job.status === 'draft' ? 'default' : 'orange'}>{job.status === 'active' ? '招聘中' : job.status === 'draft' ? '草稿' : '已暂停'}</Tag></Space>}
                        description={<Space size={[12, 0]}><Text type="secondary">{job.workLocation || '未设置'}</Text><Text type="secondary">{job.jobType || '全职'}</Text>{job.salaryMin && job.salaryMax && <Tag color="gold">{job.salaryMin}K-{job.salaryMax}K</Tag>}</Space>}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无岗位，点击上方发布新岗位" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="近期面试" extra={<Button type="link" size="small" onClick={() => navigate('/enterprise/interviews')}>全部</Button>}>
              {enterpriseInterviews.length > 0 ? (
                <List
                  dataSource={enterpriseInterviews.slice(0, 4)}
                  renderItem={(item: InterviewSchedule) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                        title={<Space><Text strong>候选人 #{item.jobseekerId}</Text><Tag color={item.status === 'confirmed' ? 'green' : 'orange'}>{item.status === 'confirmed' ? '已确认' : '待确认'}</Tag></Space>}
                        description={<Text type="secondary" style={{ fontSize: '12px' }}><ClockCircleOutlined /> {item.interviewDate ? new Date(item.interviewDate).toLocaleString('zh-CN') : '待定'}</Text>}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无面试安排" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
        </Row>

        <Card title="招聘趋势">
          <ReactECharts option={jobTrendOption} style={{ height: '280px' }} />
        </Card>
      </div>
    );
  };

  const renderJobseekerDashboard = () => {
    const quickActions = [
      { icon: <EditOutlined />, title: '我的简历', desc: '编辑完善个人简历', path: '/jobseeker/resume', color: '#1890ff' },
      { icon: <PictureOutlined />, title: '作品集', desc: '印前/印中/印后作品展示', path: '/jobseeker/portfolio', color: '#52c41a' },
      { icon: <SearchOutlined />, title: '求职广场', desc: '浏览印刷行业优质岗位', path: '/jobseeker/jobs', color: '#722ed1' },
      { icon: <MessageOutlined />, title: '行业社群', desc: '与同行交流技术心得', path: '/jobseeker/community', color: '#fa8c16' },
      { icon: <CalendarOutlined />, title: '面试日程', desc: '面试安排与日历同步', path: '/jobseeker/interviews', color: '#13c2c2' },
      { icon: <StarOutlined />, title: '我的申请', desc: '查看申请进度', path: '/jobseeker/jobs', color: '#eb2f96' },
    ];

    const stats = [
      { title: '在招岗位', value: jobseekerStats.totalJobs, icon: <SolutionOutlined />, color: '#1890ff' },
      { title: '已申请', value: jobseekerStats.applications, icon: <SendOutlined />, color: '#52c41a' },
      { title: '待面试', value: jobseekerStats.pendingInterviews, icon: <CalendarOutlined />, color: '#fa8c16' },
    ];

    return (
      <div>
        <Card
          style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #006400 0%, #52c41a 100%)', color: 'white', border: 'none' }}
          styles={{ body: { padding: '24px' } }}
        >
          <Row align="middle">
            <Col flex="auto">
              <Title level={3} style={{ color: 'white', margin: '0 0 8px' }}>
                你好，{user?.name || '求职者'} 👋
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                当前有 {jobseekerStats.totalJobs} 个优质岗位，{jobseekerStats.pendingInterviews} 个面试待参加
              </Text>
            </Col>
            <Col>
              <Button type="primary" size="large" icon={<SearchOutlined />} onClick={() => navigate('/jobseeker/jobs')} style={{ height: '44px', padding: '0 24px' }}>
                找工作
              </Button>
            </Col>
          </Row>
        </Card>

        <Card title="快捷功能" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={8} sm={8} md={4} key={index}>
                <Card hoverable onClick={() => navigate(action.path)} style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }} styles={{ body: { padding: '16px 8px' } }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '20px', color: action.color }}>
                    {action.icon}
                  </div>
                  <Text strong style={{ fontSize: '13px' }}>{action.title}</Text>
                  <div style={{ marginTop: '2px' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{action.desc}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          {stats.map((stat, index) => (
            <Col xs={8} key={index}>
              <Card><Statistic title={stat.title} value={stat.value} prefix={<span style={{ color: stat.color }}>{stat.icon}</span>} valueStyle={{ color: stat.color }} /></Card>
            </Col>
          ))}
        </Row>

        <Card title="热门岗位推荐" extra={<Button type="link" size="small" onClick={() => navigate('/jobseeker/jobs')}>查看更多 <ArrowRightOutlined /></Button>}>
          <Empty description="完善简历后可获得个性化推荐" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" onClick={() => navigate('/jobseeker/resume')}>完善简历</Button>
          </Empty>
        </Card>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const quickActions = [
      { icon: <BankOutlined />, title: '企业管理', desc: '企业审核与列表管理', path: '/admin/enterprises', color: '#1890ff' },
      { icon: <FileProtectOutlined />, title: '信用档案', desc: '企业信用评分与分析', path: '/admin/enterprises', color: '#52c41a' },
      { icon: <AlertOutlined />, title: '敏感词管理', desc: '敏感词库配置维护', path: '/admin/sensitive-words', color: '#fa8c16' },
      { icon: <SafetyOutlined />, title: '预警列表', desc: '敏感词预警处理', path: '/admin/warnings', color: '#ff4d4f' },
      { icon: <BarChartOutlined />, title: '系统统计', desc: '平台数据统计分析', path: '/admin/statistics', color: '#722ed1' },
      { icon: <AuditOutlined />, title: '审核中心', desc: '内容审核与处理', path: '/admin/warnings', color: '#13c2c2' },
    ];

    const stats = [
      { title: '企业总数', value: adminStats.companyCount, icon: <BankOutlined />, color: '#1890ff' },
      { title: '求职者总数', value: adminStats.userCount, icon: <UserOutlined />, color: '#52c41a' },
      { title: '岗位总数', value: adminStats.jobCount, icon: <SolutionOutlined />, color: '#fa8c16' },
      { title: '简历总数', value: adminStats.resumeCount, icon: <FileTextOutlined />, color: '#ff4d4f' },
    ];

    return (
      <div>
        <Card
          style={{ marginBottom: '16px', background: 'linear-gradient(135deg, #722ed1 0%, #1890ff 100%)', color: 'white', border: 'none' }}
          styles={{ body: { padding: '24px' } }}
        >
          <Row align="middle">
            <Col flex="auto">
              <Title level={3} style={{ color: 'white', margin: '0 0 8px' }}>
                管理员工作台 🛡️
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                平台共 {adminStats.companyCount} 家企业，{adminStats.userCount} 名求职者，{adminStats.jobCount} 个岗位
              </Text>
            </Col>
            <Col>
              <Space>
                <Button size="large" icon={<AuditOutlined />} onClick={() => navigate('/admin/enterprises')} style={{ height: '44px' }}>企业审核</Button>
                <Button type="primary" size="large" icon={<AlertOutlined />} onClick={() => navigate('/admin/warnings')} style={{ height: '44px' }}>处理预警</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Card title="管理功能" style={{ marginBottom: '16px' }}>
          <Row gutter={[16, 16]}>
            {quickActions.map((action, index) => (
              <Col xs={8} sm={8} md={4} key={index}>
                <Card hoverable onClick={() => navigate(action.path)} style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }} styles={{ body: { padding: '16px 8px' } }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${action.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '20px', color: action.color }}>
                    {action.icon}
                  </div>
                  <Text strong style={{ fontSize: '13px' }}>{action.title}</Text>
                  <div style={{ marginTop: '2px' }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{action.desc}</Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          {stats.map((stat, index) => (
            <Col xs={12} sm={6} key={index}>
              <Card><Statistic title={stat.title} value={stat.value} prefix={<span style={{ color: stat.color }}>{stat.icon}</span>} valueStyle={{ color: stat.color }} /></Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} lg={12}>
            <Card title="敏感词预警" extra={<Button type="link" size="small" danger onClick={() => navigate('/admin/warnings')}>查看全部 <ArrowRightOutlined /></Button>}>
              {adminWarnings.length > 0 ? (
                <List
                  dataSource={adminWarnings.slice(0, 5)}
                  renderItem={(item: any) => (
                    <List.Item actions={[<Button size="small" type="primary" onClick={() => navigate('/admin/warnings')}>处理</Button>]}>
                      <List.Item.Meta
                        title={<Space><Text type="danger">{item.sensitiveWord || item.content || '敏感内容'}</Text><Tag color={item.riskLevel === 'high' ? 'red' : 'orange'}>{item.riskLevel === 'high' ? '高风险' : '中风险'}</Tag></Space>}
                        description={<Text type="secondary">{item.source || '系统检测'}</Text>}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无预警，平台内容合规" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="快捷操作">
              <Row gutter={[12, 12]}>
                <Col xs={12}><Button block size="large" icon={<BankOutlined />} onClick={() => navigate('/admin/enterprises')}>企业管理</Button></Col>
                <Col xs={12}><Button block size="large" icon={<AlertOutlined />} danger onClick={() => navigate('/admin/sensitive-words')}>敏感词管理</Button></Col>
                <Col xs={12}><Button block size="large" icon={<SafetyOutlined />} onClick={() => navigate('/admin/warnings')}>预警列表</Button></Col>
                <Col xs={12}><Button block size="large" icon={<BarChartOutlined />} onClick={() => navigate('/admin/statistics')}>系统统计</Button></Col>
                <Col xs={12}><Button block size="large" icon={<FileProtectOutlined />} onClick={() => navigate('/admin/enterprises')}>信用档案</Button></Col>
                <Col xs={12}><Button block size="large" icon={<ThunderboltOutlined />} onClick={() => navigate('/admin/warnings')}>内容审核</Button></Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Card title="系统概览" extra={<Button type="link" size="small" onClick={() => navigate('/admin/statistics')}>查看详情 <ArrowRightOutlined /></Button>}>
          <ReactECharts option={jobTrendOption} style={{ height: '280px' }} />
        </Card>
      </div>
    );
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px' }}><Spin size="large" tip="加载工作台数据..." /></div>;
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: '20px' }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <HomeOutlined /> 工作台
          </Title>
        </Col>
        <Col>
          <Text type="secondary">欢迎回来，{user?.name || user?.email || '用户'}</Text>
        </Col>
      </Row>

      {isEnterprise() && renderEnterpriseDashboard()}
      {isJobseeker() && renderJobseekerDashboard()}
      {isAdmin() && renderAdminDashboard()}
      {!isEnterprise() && !isJobseeker() && !isAdmin() && (
        <Empty description="暂无数据，请先登录" />
      )}
    </div>
  );
};

export default Home;
