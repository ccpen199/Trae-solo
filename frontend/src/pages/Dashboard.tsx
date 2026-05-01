import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, message, Spin } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  SendOutlined,
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<any[]>([]);
  const [topContents, setTopContents] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response: any = await analyticsApi.getDashboard(7);
      const data = response.data;

      setOverview(data?.overview || {});
      setChannelBreakdown(
        Object.entries(data?.byChannel || {}).map(([key, value]: any) => ({
          name: key,
          ...value,
        }))
      );
      setDailyTrend(
        Object.entries(data?.byDay || {}).map(([key, value]: any) => ({
          date: key,
          ...value,
        }))
      );
      setTopContents(data?.topContents || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'default',
      PENDING_REVIEW: 'warning',
      IN_REVIEW: 'processing',
      APPROVED: 'success',
      PUBLISHED: 'blue',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      DRAFT: '草稿',
      PENDING_REVIEW: '待审核',
      IN_REVIEW: '审核中',
      APPROVED: '已通过',
      PUBLISHED: '已发布',
      REJECTED: '已驳回',
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: '标题',
      dataIndex: ['content', 'title'],
      key: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: ['content', 'status'],
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '阅读量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      render: (count: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <EyeOutlined style={{ color: '#1890ff' }} />
          {count?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: '点赞',
      dataIndex: 'likeCount',
      key: 'likeCount',
      render: (count: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LikeOutlined style={{ color: '#ff4d4f' }} />
          {count?.toLocaleString() || 0}
        </span>
      ),
    },
  ];

  const statsCards = [
    {
      title: '总阅读量',
      value: overview?.viewCount || 0,
      icon: <EyeOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
      color: '#e6f7ff',
    },
    {
      title: '总点赞数',
      value: overview?.likeCount || 0,
      icon: <LikeOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />,
      color: '#fff1f0',
    },
    {
      title: '总评论数',
      value: overview?.commentCount || 0,
      icon: <CommentOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
      color: '#f6ffed',
    },
    {
      title: '总分享数',
      value: overview?.shareCount || 0,
      icon: <ShareAltOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
      color: '#f9f0ff',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>数据看板</h2>
        <p style={{ color: 'rgba(0,0,0,0.45)' }}>欢迎回来，{user?.displayName || user?.username}</p>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {statsCards.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card className="card-stat" style={{ background: stat.color, border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <Statistic
                      title={stat.title}
                      value={stat.value}
                      valueStyle={{ fontSize: 28, fontWeight: 600 }}
                    />
                  </div>
                  {stat.icon}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="互动数据趋势" className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="viewCount" name="阅读量" stroke="#1890ff" strokeWidth={2} />
                  <Line type="monotone" dataKey="likeCount" name="点赞" stroke="#ff4d4f" strokeWidth={2} />
                  <Line type="monotone" dataKey="commentCount" name="评论" stroke="#52c41a" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="渠道分布" className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={channelBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="viewCount"
                  >
                    {channelBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24}>
            <Card title="热门内容排行">
              <Table
                dataSource={topContents}
                columns={columns}
                rowKey="contentId"
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;
