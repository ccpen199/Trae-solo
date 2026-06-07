import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Table, Progress, Tag, message } from 'antd';
import { UserOutlined, FileTextOutlined, ShopOutlined, EyeOutlined, LikeOutlined, MessageOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';

const { Title } = Typography;

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (error) {
      message.error('加载统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (!stats) {
    return <Card loading />;
  }

  const cityColumns = [
    { title: '城市', dataIndex: 'name', key: 'name' },
    { title: '用户数', dataIndex: 'user_count', key: 'user_count' },
    { title: '帖子数', dataIndex: 'post_count', key: 'post_count' },
    { title: '商家数', dataIndex: 'merchant_count', key: 'merchant_count' },
  ];

  const categoryColumns = [
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => {
      const map: Record<string, string> = {
        news: '本地资讯', job: '招聘求职', rental: '房屋租售',
        secondhand: '二手交易', dating: '相亲交友', show: '秀场动态',
      };
      return map[v] || v;
    }},
    { title: '数量', dataIndex: 'count', key: 'count' },
    {
      title: '占比',
      key: 'ratio',
      render: (_: any, record: any) => {
        const total = stats.overview.totalPosts || 1;
        return <Progress percent={Math.round((record.count / total) * 100)} size="small" />;
      },
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>城市活跃度复盘仪表盘</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={stats.overview.totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="总帖子数"
              value={stats.overview.totalPosts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="商家总数"
              value={stats.overview.totalMerchants}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="今日发帖"
              value={stats.overview.todayPosts}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={8}>
          <Card title="待处理事项">
            <div className="stat-card">
              <div className="stat-number">
                <Tag color="red">{stats.overview.pendingPosts}</Tag>
              </div>
              <div className="stat-label">待审核帖子</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <div className="stat-card">
              <div className="stat-number">
                <Tag color="orange">{stats.overview.pendingMerchants}</Tag>
              </div>
              <div className="stat-label">待审核商家</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card>
            <div className="stat-card">
              <div className="stat-number">
                <Tag color="cyan">{stats.overview.todayComments}</Tag>
              </div>
              <div className="stat-label">今日评论</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col md={12}>
          <Card title="城市活跃度排行" loading={loading}>
            <Table
              dataSource={stats.cityStats}
              columns={cityColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col md={12}>
          <Card title="内容分类分布" loading={loading}>
            <Table
              dataSource={stats.categoryStats}
              columns={categoryColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Card title="24小时发帖趋势" style={{ marginTop: 16 }} loading={loading}>
        <Row gutter={[8, 8]}>
          {Array.from({ length: 24 }).map((_, i) => {
            const hour = i.toString().padStart(2, '0');
            const data = stats.hourlyStats?.find((h: any) => h.hour === hour);
            const count = data?.count || 0;
            const max = Math.max(...stats.hourlyStats?.map((h: any) => h.count || 0), 1);
            return (
              <Col key={i} xs={2} sm={2} md={1} style={{ textAlign: 'center' }}>
                <div style={{ 
                  height: 60, 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  justifyContent: 'center',
                  marginBottom: 4 
                }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      maxWidth: 20,
                      height: `${(count / max) * 100}%`, 
                      background: '#1890ff',
                      borderRadius: 2,
                      minHeight: count > 0 ? 4 : 0
                    }} 
                  />
                </div>
                <Text style={{ fontSize: 10 }}>{hour}</Text>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );
};

export default AdminDashboard;
