import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  LikeOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { api } from '../../services/api';
import { DailyStats } from '../../types';
import dayjs from 'dayjs';

const AdminDashboard: React.FC = () => {
  const [todayStats, setTodayStats] = React.useState<DailyStats | null>(null);
  const [recentLogs, setRecentLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('/admin/stats/today'),
        api.get('/admin/audit-logs', { params: { limit: 10 } })
      ]);

      if (statsRes.data.success) {
        setTodayStats(statsRes.data.data);
      }
      if (logsRes.data.success) {
        setRecentLogs(logsRes.data.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const logColumns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        let color = 'default';
        if (action.includes('delete') || action.includes('ban')) color = 'red';
        if (action.includes('create')) color = 'green';
        if (action.includes('update')) color = 'blue';
        return <Tag color={color}>{action}</Tag>;
      }
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType'
    },
    {
      title: '操作者',
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => user?.username || '系统'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm:ss')
    }
  ];

  return (
    <div className="admin-dashboard">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日活跃用户"
              value={todayStats?.activeUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日新注册"
              value={todayStats?.newUsers || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日发帖数"
              value={todayStats?.postsCreated || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日举报数"
              value={todayStats?.reportsCreated || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="今日评论数"
              value={todayStats?.commentsCreated || 0}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="今日点赞数"
              value={todayStats?.likesCreated || 0}
              prefix={<LikeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card loading={loading}>
            <Statistic
              title="今日处理数"
              value={(todayStats?.postsDeleted || 0) + (todayStats?.usersMuted || 0) + (todayStats?.usersBanned || 0)}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card title="最近操作日志" loading={loading}>
            <Table
              dataSource={recentLogs}
              columns={logColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
