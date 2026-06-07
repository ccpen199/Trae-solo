import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Button, Tag, Alert, List, Typography, Spin } from 'antd';
import { 
  TeamOutlined, 
  ShopOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  PlusOutlined,
  UserOutlined,
  SearchOutlined,
  DashboardOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  SafetyOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminAPI, jobsAPI } from '../utils/api';
import { useAuth } from '../App';

const { Title, Text } = Typography;

const assuranceRecords = [
  {
    title: '报名申请复查',
    status: '已流转',
    color: 'green',
    desc: '木工班组 3 人已提交实名证书，项目方 09:40 完成面试确认，记录可在我的申请查看。'
  },
  {
    title: '保证金托管',
    status: '托管中',
    color: 'blue',
    desc: '项目方预付 12000 元、工友履约押金 1800 元，银行托管流水 GYT-20260604-001。'
  },
  {
    title: '现场打卡与工时确认',
    status: '待复核',
    color: 'orange',
    desc: '今日 6 条 NFC 闸机打卡，4 条已由企业确认，2 条等待班组长复核。'
  },
  {
    title: '劳务合规中心',
    status: '已归档',
    color: 'purple',
    desc: '劳动合同模板、工资支付监管、纠纷调解单均已关联招工单 GY-0428。'
  }
];

function Home() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const [stats, setStats] = useState(null);
  const [dailyTip, setDailyTip] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth?.loading) {
      return;
    }
    loadData();
  }, [auth?.loading, auth?.user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, tipRes, jobsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getDailyTip(),
        jobsAPI.getJobs({ page: 1, pageSize: 6 })
      ]);
      setStats(statsRes.data);
      setDailyTip(tipRes.data);
      setFeaturedJobs(jobsRes.data?.jobs || []);

      if (user?.role === 'worker' || user?.role === 'team') {
        try {
          const recRes = await jobsAPI.getRecommendations();
          setRecommendations(recRes.data);
        } catch (e) {
          console.log('Load worker data error:', e);
        }
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (auth?.loading || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getRoleName = (role) => {
    const names = {
      admin: '平台管理员',
      worker: '工友',
      company: '项目方/企业',
      team: '班组'
    };
    return names[role] || role;
  };

  const openDemoRole = (role, path) => {
    const demoUsers = {
      worker: { userId: 2, role: 'worker', name: '演示工友', phone: '13800000001' },
      company: { userId: 3, role: 'company', name: '演示企业', phone: '13900000001' },
      admin: { userId: 1, role: 'admin', name: '演示管理员', phone: 'admin' }
    };
    auth.login(`local-demo-${role}`, demoUsers[role]);
    navigate(path);
  };

  const renderWorkerDashboard = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={8}>
        <Card className="card-hover" onClick={() => navigate('/jobs')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>浏览招工</Title>
            <Text type="secondary">查看附近招工信息，智能匹配推荐</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="card-hover" onClick={() => navigate('/attendance')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <ClockCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>考勤打卡</Title>
            <Text type="secondary">上下班打卡，工时电子确认</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="card-hover" onClick={() => navigate('/my-jobs')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>我的申请</Title>
            <Text type="secondary">查看申请记录和用工状态</Text>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const renderCompanyDashboard = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/create-job')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <PlusOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>发布招工</Title>
            <Text type="secondary">发布新的招工需求</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/my-jobs')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>招工管理</Title>
            <Text type="secondary">管理已发布的招工信息</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/attendance')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>工时确认</Title>
            <Text type="secondary">确认工友打卡工时</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/admin')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <FileProtectOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>劳务合规</Title>
            <Text type="secondary">合同模板、工资监管</Text>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const renderTeamDashboard = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={8}>
        <Card className="card-hover" onClick={() => navigate('/jobs')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>承揽项目</Title>
            <Text type="secondary">浏览适合班组的工程项目</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="card-hover" onClick={() => navigate('/my-jobs')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>项目管理</Title>
            <Text type="secondary">已承揽项目进度追踪</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="card-hover" onClick={() => navigate('/attendance')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <TeamOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>班组考勤</Title>
            <Text type="secondary">班组成员打卡管理</Text>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const renderAdminDashboard = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/admin')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <DashboardOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>数据看板</Title>
            <Text type="secondary">平台运营数据总览</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/admin#users')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>用户管理</Title>
            <Text type="secondary">工友、企业、班组管理</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/admin#heatmap')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <LineChartOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>用工热力图</Title>
            <Text type="secondary">区域用工需求和薪资分析</Text>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/admin#safety')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <SafetyOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>安全知识库</Title>
            <Text type="secondary">安全培训和考试管理</Text>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const renderPublicDashboard = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => navigate('/jobs')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>搜索筛选招工</Title>
            <Text type="secondary">公开浏览岗位、工种分类、薪资筛选和招工详情</Text>
            <Button type="primary" block style={{ marginTop: 16 }} onClick={() => navigate('/jobs')}>
              浏览岗位
            </Button>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => openDemoRole('worker', '/profile')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>个人中心 / 我的申请</Title>
            <Text type="secondary">登录工友账号后查看申请记录、考勤和资料</Text>
            <Button type="primary" block style={{ marginTop: 16 }} onClick={() => openDemoRole('worker', '/profile')}>
              登录查看我的
            </Button>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => openDemoRole('company', '/create-job')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <PlusOutlined style={{ fontSize: '48px', color: '#722ed1', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>发布 / 提交招工</Title>
            <Text type="secondary">企业登录后发布招工需求并管理报名申请</Text>
            <Button type="primary" block style={{ marginTop: 16 }} onClick={() => openDemoRole('company', '/create-job')}>
              企业提交需求
            </Button>
          </div>
        </Card>
      </Col>
      <Col xs={24} md={6}>
        <Card className="card-hover" onClick={() => openDemoRole('admin', '/admin')}>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <DashboardOutlined style={{ fontSize: '48px', color: '#fa8c16', marginBottom: '12px' }} />
            <Title level={5} style={{ marginBottom: '8px' }}>后台管理</Title>
            <Text type="secondary">管理员查看用户、企业、招工审核和安全知识库</Text>
            <Button type="primary" block style={{ marginTop: 16 }} onClick={() => openDemoRole('admin', '/admin')}>
              进入后台
            </Button>
          </div>
        </Card>
      </Col>
    </Row>
  );

  const renderDashboardByRole = () => {
    if (!user) return renderPublicDashboard();
    switch (user.role) {
      case 'worker':
        return renderWorkerDashboard();
      case 'company':
        return renderCompanyDashboard();
      case 'team':
        return renderTeamDashboard();
      case 'admin':
        return renderAdminDashboard();
      default:
        return renderWorkerDashboard();
    }
  };

  const skillDemand = stats?.skillStats?.length
    ? stats.skillStats
    : featuredJobs.reduce((items, job) => {
        const skill = job.skill_required || job.category || '综合工种';
        const existing = items.find((item) => item.skill === skill);
        if (existing) {
          existing.count += 1;
        } else {
          items.push({ skill, count: 1 });
        }
        return items;
      }, []);

  return (
    <div className="page-container">
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              {user ? `欢迎回来，${user.name || user.phone}！` : '建筑用工撮合平台'}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
              {user
                ? `${getRoleName(user.role)}工作台 · ${new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                : '招工搜索、岗位详情、报名申请、个人中心和后台管理入口'}
            </Text>
          </div>
          <SafetyCertificateOutlined style={{ fontSize: '64px', color: 'rgba(255,255,255,0.3)' }} />
        </div>
      </Card>

      <Alert
        message={`🔔 每日安全提醒：${dailyTip?.title || '安全第一'}`}
        description={dailyTip?.content || '施工时请务必佩戴安全帽，注意安全！'}
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <Card className="card-hover" onClick={() => navigate('/jobs')}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <SearchOutlined style={{ fontSize: '36px', color: '#1890ff', marginBottom: '8px' }} />
              <Title level={5} style={{ marginBottom: '6px' }}>搜索/筛选招工</Title>
              <Text type="secondary">按工种、区域和薪资查找岗位</Text>
              <Button size="small" type="primary" style={{ marginTop: 12 }} onClick={() => navigate('/jobs')}>
                搜索岗位
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="card-hover" onClick={() => openDemoRole('worker', '/profile')}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <UserOutlined style={{ fontSize: '36px', color: '#52c41a', marginBottom: '8px' }} />
              <Title level={5} style={{ marginBottom: '6px' }}>个人中心/我的</Title>
              <Text type="secondary">资料、报名申请和考勤记录</Text>
              <Button size="small" type="primary" style={{ marginTop: 12 }} onClick={() => openDemoRole('worker', '/profile')}>
                我的资料
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="card-hover" onClick={() => openDemoRole('company', '/create-job')}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <PlusOutlined style={{ fontSize: '36px', color: '#722ed1', marginBottom: '8px' }} />
              <Title level={5} style={{ marginBottom: '6px' }}>发布/提交招工</Title>
              <Text type="secondary">企业提交用工需求并管理报名</Text>
              <Button size="small" type="primary" style={{ marginTop: 12 }} onClick={() => openDemoRole('company', '/create-job')}>
                发布招工
              </Button>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card className="card-hover" onClick={() => openDemoRole('admin', '/admin')}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <DashboardOutlined style={{ fontSize: '36px', color: '#fa8c16', marginBottom: '8px' }} />
              <Title level={5} style={{ marginBottom: '6px' }}>后台管理</Title>
              <Text type="secondary">用户、企业和招工审核看板</Text>
              <Button size="small" type="primary" style={{ marginTop: 12 }} onClick={() => openDemoRole('admin', '/admin')}>
                管理后台
              </Button>
            </div>
          </Card>
        </Col>
      </Row>

      <Title level={4} style={{ marginBottom: 16 }}>
        <span style={{ borderLeft: '4px solid #1890ff', paddingLeft: '12px' }}>
          工作台
        </span>
      </Title>

      {renderDashboardByRole()}

      <Title level={4} style={{ marginBottom: 16, marginTop: 32 }}>
        <span style={{ borderLeft: '4px solid #1890ff', paddingLeft: '12px' }}>
          平台数据
        </span>
      </Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="工友总数"
              value={stats?.overview?.totalWorkers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="企业总数"
              value={stats?.overview?.totalCompanies || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="进行中招工"
              value={stats?.overview?.openJobs || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日打卡"
              value={stats?.overview?.todayAttendances || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {featuredJobs.length > 0 && (
        <>
          <Title level={4} style={{ marginBottom: 16, marginTop: 32 }}>
            <span style={{ borderLeft: '4px solid #13c2c2', paddingLeft: '12px' }}>
              精选招工
            </span>
          </Title>
          <Card>
            <List
              dataSource={featuredJobs}
              renderItem={(job) => (
                <List.Item
                  key={job.id}
                  actions={[
                    <Button type="link" onClick={() => navigate(`/jobs/${job.id}`)}>
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={<span style={{ fontWeight: 'bold' }}>{job.title}</span>}
                    description={
                      <div>
                        <Tag color="blue">{job.skill_required}</Tag>
                        <Tag color="purple">{job.job_type}</Tag>
                        <span style={{ marginLeft: 8 }}>{job.company_name}</span>
                        <span style={{ marginLeft: 16 }}>📍 {job.location}</span>
                        <span style={{ marginLeft: 16, color: '#f5222d', fontWeight: 'bold' }}>
                          ¥{job.daily_salary}/天
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </>
      )}

      {(user?.role === 'worker' || user?.role === 'team') && recommendations.length > 0 && (
        <>
          <Title level={4} style={{ marginBottom: 16 }}>
            <span style={{ borderLeft: '4px solid #52c41a', paddingLeft: '12px' }}>
              为您推荐
            </span>
          </Title>
          <Card>
            <List
              dataSource={recommendations.slice(0, 5)}
              renderItem={(job) => (
                <List.Item
                  key={job.id}
                  actions={[
                    <Button type="primary" size="small" onClick={() => navigate(`/jobs/${job.id}`)}>
                      立即申请
                    </Button>
                  ]}
                  className="card-hover"
                >
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{job.title}</span>
                        <Tag color="green">匹配度 {job.match_score}%</Tag>
                      </div>
                    }
                    description={
                      <div style={{ marginTop: '8px' }}>
                        <Tag color="blue">{job.skill_required}</Tag>
                        <Tag color="purple">{job.job_type}</Tag>
                        <span style={{ marginLeft: 8 }}>📍 {job.location}</span>
                        <span style={{ marginLeft: 16, color: '#f5222d', fontWeight: 'bold', fontSize: '18px' }}>
                          ¥{job.daily_salary}/天
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </>
      )}

      <Title level={4} style={{ marginBottom: 16, marginTop: 32 }}>
        <span style={{ borderLeft: '4px solid #fa8c16', paddingLeft: '12px' }}>
          热门工种需求
        </span>
      </Title>
      <Card>
        {skillDemand.length > 0 ? (
          <Row gutter={[16, 16]}>
            {skillDemand.map((item, index) => (
              <Col xs={24} sm={12} md={8} lg={6} key={index}>
                <Card size="small" className="card-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 12px' }}>{item.skill}</Tag>
                    <span style={{ color: '#666', fontWeight: 'bold' }}>{item.count} 个岗位</span>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
            热门工种数据正在汇总，先浏览精选招工岗位。
          </div>
        )}
      </Card>

      <Title level={4} style={{ marginBottom: 16, marginTop: 32 }}>
        <span style={{ borderLeft: '4px solid #52c41a', paddingLeft: '12px' }}>
          过程保障闭环
        </span>
      </Title>
      <Row gutter={[16, 16]}>
        {assuranceRecords.map((item, index) => (
          <Col xs={24} md={12} key={index}>
            <Card size="small" className="card-hover">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                <strong>{item.title}</strong>
                <Tag color={item.color}>{item.status}</Tag>
              </div>
              <Text type="secondary">{item.desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {stats?.regionStats?.length > 0 && (
        <>
          <Title level={4} style={{ marginBottom: 16, marginTop: 32 }}>
            <span style={{ borderLeft: '4px solid #722ed1', paddingLeft: '12px' }}>
              区域薪资水平
            </span>
          </Title>
          <Card>
            <Row gutter={[16, 16]}>
              {stats.regionStats.slice(0, 6).map((item, index) => (
                <Col xs={24} sm={12} md={8} key={index}>
                  <Card size="small" className="card-hover">
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{item.location}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.count} 个岗位</div>
                      <div style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '20px', marginTop: '8px' }}>
                        ¥{Math.round(item.avg_salary)}/天
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </>
      )}
    </div>
  );
}

export default Home;
