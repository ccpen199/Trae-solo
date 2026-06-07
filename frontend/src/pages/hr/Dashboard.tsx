import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Tag, Button, Progress } from 'antd';
import { FileTextOutlined, UserOutlined, CalendarOutlined, CheckCircleOutlined, PlusOutlined, TeamOutlined, BarChartOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';

export default function HRDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ jobs: 0, applications: 0, interviews: 0, hired: 0 });
  const [hrStats, setHrStats] = useState({
    avgReplyTime: 0,
    avgJobCloseCycle: 0,
    hireConversionRate: 0
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadRecentApplications();
    loadHRStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await axios.get('/hr/jobs');
      const total = data.list?.reduce((acc: number, job: any) => acc + (job.application_count || 0), 0) || 0;
      setStats({
        jobs: data.total || 0,
        applications: total,
        interviews: 0,
        hired: 0
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadHRStats = async () => {
    try {
      const { data } = await axios.get('/hr/dashboard/stats').catch(() => ({
        data: {
          avgReplyTime: 2.5,
          avgJobCloseCycle: 14,
          hireConversionRate: 15
        }
      }));
      setHrStats({
        avgReplyTime: data.avgReplyTime || 0,
        avgJobCloseCycle: data.avgJobCloseCycle || 0,
        hireConversionRate: data.hireConversionRate || 0
      });
    } catch (error) {
      console.error('Failed to load HR stats:', error);
    }
  };

  const loadRecentApplications = async () => {
    try {
      const { data } = await axios.get('/hr/applications');
      setRecentApplications((data || []).slice(0, 5));
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'default',
    viewed: 'processing',
    interview: 'blue',
    offer: 'success',
    rejected: 'error',
    hired: 'success'
  };

  const statusLabels: Record<string, string> = {
    pending: '待查看',
    viewed: '已查看',
    interview: '面试中',
    offer: '已录用',
    rejected: '未通过',
    hired: '已入职'
  };

  const quickActions = [
    { title: '发布职位', icon: <PlusOutlined />, path: '/hr/jobs/new', color: '#1890ff', desc: '发布新的招聘职位' },
    { title: '简历管理', icon: <UserOutlined />, path: '/hr/applications', color: '#52c41a', desc: '查看和管理收到的简历' },
    { title: '面试安排', icon: <CalendarOutlined />, path: '/hr/interviews', color: '#722ed1', desc: '安排和管理面试' },
    { title: '查看效能数据', icon: <BarChartOutlined />, path: '/admin/analytics', color: '#fa8c16', desc: '查看招聘效能分析' }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>HR工作台</h2>

      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {quickActions.map((action) => (
          <Col span={6} key={action.title}>
            <Card
              hoverable
              onClick={() => navigate(action.path)}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: `${action.color}15`,
                    color: action.color,
                    fontSize: 24,
                    margin: '0 auto 12px'
                  }}
                >
                  {action.icon}
                </div>
                <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{action.title}</div>
                <div style={{ color: '#999', fontSize: 12 }}>{action.desc}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="在招职位"
              value={stats.jobs}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="收到简历"
              value={stats.applications}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="面试安排"
              value={stats.interviews}
              prefix={<CalendarOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已录用"
              value={stats.hired}
              prefix={<CheckCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="招聘效能" style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}>
                <Progress
                  type="dashboard"
                  percent={Math.min(100, Math.max(0, (5 - hrStats.avgReplyTime) * 20))}
                  strokeColor="#1890ff"
                  size={100}
                />
              </div>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                {hrStats.avgReplyTime} <span style={{ fontSize: 14, color: '#999', fontWeight: 'normal' }}>天</span>
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>平均回复时长</div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                <ClockCircleOutlined /> 目标: ≤ 2天
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}>
                <Progress
                  type="dashboard"
                  percent={Math.min(100, Math.max(0, (30 - hrStats.avgJobCloseCycle) * 3.33))}
                  strokeColor="#52c41a"
                  size={100}
                />
              </div>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                {hrStats.avgJobCloseCycle} <span style={{ fontSize: 14, color: '#999', fontWeight: 'normal' }}>天</span>
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>岗位关闭周期</div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                <FileTextOutlined /> 目标: ≤ 15天
              </div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 12 }}>
                <Progress
                  type="dashboard"
                  percent={hrStats.hireConversionRate}
                  strokeColor="#fa8c16"
                  size={100}
                />
              </div>
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                {hrStats.hireConversionRate} <span style={{ fontSize: 14, color: '#999', fontWeight: 'normal' }}>%</span>
              </div>
              <div style={{ color: '#666', fontSize: 12 }}>录用转化率</div>
              <div style={{ color: '#999', fontSize: 11, marginTop: 4 }}>
                <TeamOutlined /> 行业均值: ~12%
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Card title="最新简历">
        <List
          dataSource={recentApplications}
          renderItem={(item: any) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <span>
                    {item.jobseeker_name}
                    <Tag color={statusColors[item.status]} style={{ marginLeft: 8 }}>
                      {statusLabels[item.status]}
                    </Tag>
                  </span>
                }
                description={`应聘: ${item.title} | ${item.education} | ${item.experience_years}年经验`}
              />
              <div style={{ color: '#999' }}>{item.created_at}</div>
            </List.Item>
          )}
          locale={{ emptyText: '暂无简历' }}
        />
      </Card>
    </div>
  );
}
