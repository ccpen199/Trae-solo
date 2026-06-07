import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Timeline, Badge } from 'antd';
import { UserOutlined, BankOutlined, FileTextOutlined, WarningOutlined, ArrowRightOutlined, ClockCircleOutlined, CheckCircleOutlined, AuditOutlined, BarChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import axios from '../../utils/axios';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalCompanies: 0,
    totalApplications: 0,
    pendingVerifications: 0,
    pendingReports: 0
  });
  const [summary, setSummary] = useState<any>(null);
  const [pendingCompanies, setPendingCompanies] = useState<any[]>([]);
  const [pendingJobs, setPendingJobs] = useState<any[]>([]);
  const [pendingReports, setPendingReports] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadSummary();
    loadPendingCompanies();
    loadPendingJobs();
    loadPendingReports();
    loadRecentActivities();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await axios.get('/admin/dashboard/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const { data } = await axios.get('/admin/analytics/dashboard/summary');
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  };

  const loadPendingCompanies = async () => {
    try {
      const { data } = await axios.get('/admin/companies/pending');
      setPendingCompanies((data || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to load companies:', error);
    }
  };

  const loadPendingJobs = async () => {
    try {
      const { data } = await axios.get('/admin/jobs/unverified');
      setPendingJobs((data || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const loadPendingReports = async () => {
    try {
      const { data } = await axios.get('/admin/reports', { params: { status: 'pending' } });
      setPendingReports((data || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const loadRecentActivities = async () => {
    try {
      const [reportsRes, companiesRes, jobsRes] = await Promise.all([
        axios.get('/admin/reports').catch(() => ({ data: [] })),
        axios.get('/admin/companies').catch(() => ({ data: [] })),
        axios.get('/admin/jobs').catch(() => ({ data: [] }))
      ]);

      const activities: any[] = [];

      (reportsRes.data || []).slice(0, 5).forEach((r: any) => {
        activities.push({
          type: 'report',
          content: `新举报: ${r.reason}`,
          time: r.created_at,
          color: 'red',
          icon: <WarningOutlined />
        });
      });

      (companiesRes.data?.list || companiesRes.data || []).slice(0, 5).forEach((c: any) => {
        activities.push({
          type: 'company',
          content: `新企业注册: ${c.name}`,
          time: c.created_at,
          color: 'blue',
          icon: <BankOutlined />
        });
      });

      (jobsRes.data?.list || jobsRes.data || []).slice(0, 5).forEach((j: any) => {
        activities.push({
          type: 'job',
          content: `新职位发布: ${j.title}`,
          time: j.created_at,
          color: 'green',
          icon: <FileTextOutlined />
        });
      });

      (reportsRes.data || []).filter((r: any) => r.status === 'resolved').slice(0, 3).forEach((r: any) => {
        activities.push({
          type: 'resolved',
          content: `举报已处理: ${r.reason}`,
          time: r.updated_at,
          color: 'green',
          icon: <CheckCircleOutlined />
        });
      });

      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const quickEntries = [
    {
      title: '风控中心',
      path: '/admin/risk-control',
      icon: <WarningOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />,
      desc: '审核企业与处理举报',
      stat: stats.pendingReports,
      statLabel: '待处理举报',
      color: '#ff4d4f'
    },
    {
      title: '数据看板',
      path: '/admin/analytics',
      icon: <BarChartOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      desc: '行业供需与效能分析',
      stat: stats.totalApplications,
      statLabel: '总求职申请',
      color: '#1890ff'
    },
    {
      title: '企业审核',
      path: '/admin/risk-control',
      icon: <AuditOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      desc: '审核企业资质信息',
      stat: stats.pendingVerifications,
      statLabel: '待审核企业',
      color: '#52c41a'
    },
    {
      title: '职位审核',
      path: '/admin/risk-control',
      icon: <FileTextOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      desc: '审核职位信息合规',
      stat: pendingJobs.length,
      statLabel: '待审核职位',
      color: '#722ed1'
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理后台</h2>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {quickEntries.map((entry) => (
          <Col span={6} key={entry.title}>
            <Card
              hoverable
              onClick={() => navigate(entry.path)}
              style={{ cursor: 'pointer', borderTop: `3px solid ${entry.color}` }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${entry.color}15`,
                    flexShrink: 0
                  }}
                >
                  {entry.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 'bold' }}>{entry.title}</div>
                    <Badge count={entry.stat} color={entry.color} />
                  </div>
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 8 }}>{entry.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Statistic
                      value={entry.stat}
                      valueStyle={{ color: entry.color, fontSize: 20, fontWeight: 'bold' }}
                    />
                    <span style={{ color: '#999', fontSize: 12 }}>{entry.statLabel}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.totalUsers}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="企业数"
              value={stats.totalCompanies}
              prefix={<BankOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="职位数"
              value={stats.totalJobs}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="求职申请"
              value={stats.totalApplications}
              prefix={<UserOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card onClick={() => navigate('/admin/risk-control')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="待审核企业"
              value={stats.pendingVerifications}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card onClick={() => navigate('/admin/risk-control')} style={{ cursor: 'pointer' }}>
            <Statistic
              title="待处理举报"
              value={stats.pendingReports}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {summary && (
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="平均回复时长"
                value={summary.avgReplyTime || '-'}
                suffix="天"
                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="岗位关闭周期"
                value={summary.avgJobCloseCycle || '-'}
                suffix="天"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="录用转化率"
                value={summary.hireConversionRate || 0}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={24}>
        <Col span={8}>
          <Card title="待审核企业" extra={<a onClick={() => navigate('/admin/risk-control')}>查看全部 <ArrowRightOutlined /></a>}>
            <List
              dataSource={pendingCompanies}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={`${item.industry} | ${item.scale}`}
                  />
                  <Tag color="warning">待审核</Tag>
                </List.Item>
              )}
              locale={{ emptyText: '暂无待审核企业' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="待处理举报" extra={<a onClick={() => navigate('/admin/risk-control')}>查看全部 <ArrowRightOutlined /></a>}>
            <List
              dataSource={pendingReports}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={`${item.type === 'job' ? '职位' : item.type === 'company' ? '企业' : '用户'}举报`}
                    description={`原因: ${item.reason} | 举报人: ${item.reporter_name || '匿名'}`}
                  />
                  <Tag color="error">待处理</Tag>
                </List.Item>
              )}
              locale={{ emptyText: '暂无待处理举报' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="最近动态" extra={<a>更多 <ArrowRightOutlined /></a>}>
            {recentActivities.length > 0 ? (
              <Timeline
                items={recentActivities.map((act, idx) => ({
                  color: act.color,
                  dot: act.icon,
                  children: (
                    <div key={idx}>
                      <div style={{ fontSize: 13 }}>{act.content}</div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                        {act.time ? dayjs(act.time).format('YYYY-MM-DD HH:mm') : ''}
                      </div>
                    </div>
                  )
                }))}
              />
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>暂无动态</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
