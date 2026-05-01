import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Tabs,
  Table,
  Tag,
  message,
  Spin,
} from 'antd';
import {
  EyeOutlined,
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
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
  AreaChart,
  Area,
} from 'recharts';
import { analyticsApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const AnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [dailyTrend, setDailyTrend] = useState<any[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<any[]>([]);
  const [topContents, setTopContents] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
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
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelText = (channel: string) => {
    const map: Record<string, string> = {
      WEB: '官网',
      APP: 'App',
      WECHAT: '微信',
      WEIBO: '微博',
      DOUYIN: '抖音',
      XIAOHONGSHU: '小红书',
      ZHIHU: '知乎',
    };
    return map[channel] || channel;
  };

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
      title: '互动率',
      value: overview?.engagementRate || '0%',
      icon: <ShareAltOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
      color: '#f9f0ff',
    },
  ];

  const columns = [
    {
      title: '内容标题',
      dataIndex: ['content', 'title'],
      key: 'title',
      ellipsis: true,
      width: 250,
    },
    {
      title: '阅读量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      sorter: (a: any, b: any) => a.viewCount - b.viewCount,
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
      sorter: (a: any, b: any) => a.likeCount - b.likeCount,
      render: (count: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LikeOutlined style={{ color: '#ff4d4f' }} />
          {count?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: '评论',
      dataIndex: 'commentCount',
      key: 'commentCount',
      render: (count: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <CommentOutlined style={{ color: '#52c41a' }} />
          {count?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: '分享',
      dataIndex: 'shareCount',
      key: 'shareCount',
      render: (count: number) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <ShareAltOutlined style={{ color: '#722ed1' }} />
          {count?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: '总互动',
      dataIndex: 'totalEngagements',
      key: 'totalEngagements',
      sorter: (a: any, b: any) => a.totalEngagements - b.totalEngagements,
      render: (count: number) => <Tag color="blue">{count?.toLocaleString() || 0}</Tag>,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>数据分析</h2>
        <p style={{ color: 'rgba(0,0,0,0.45)' }}>查看内容互动数据分析</p>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
        <RangePicker
          onChange={() => fetchAnalyticsData()}
          placeholder={['开始日期', '结束日期']}
        />
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statsCards.map((stat, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card size="small" style={{ background: stat.color, border: 'none' }}>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  valueStyle={{ fontSize: 28, fontWeight: 600 }}
                  prefix={stat.icon}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Tabs defaultActiveKey="trend">
          <TabPane tab={<span><LineChartOutlined /> 趋势分析</span>} key="trend">
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={16}>
                <Card title="阅读量趋势">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="viewCount"
                        name="阅读量"
                        stroke="#1890ff"
                        fill="#e6f7ff"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="likeCount"
                        name="点赞"
                        stroke="#ff4d4f"
                        fill="#fff1f0"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
              <Col xs={24} lg={8}>
                <Card title="渠道分布">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={channelBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${getChannelText(name)}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="viewCount"
                      >
                        {channelBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          value.toLocaleString(),
                          getChannelText(name),
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab={<span><BarChartOutlined /> 渠道对比</span>} key="channel">
            <Card title="各渠道互动数据对比">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={channelBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickFormatter={(v) => getChannelText(v)} />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => [value.toLocaleString(), name]} />
                  <Legend />
                  <Bar dataKey="viewCount" name="阅读量" fill="#1890ff" />
                  <Bar dataKey="likeCount" name="点赞" fill="#ff4d4f" />
                  <Bar dataKey="commentCount" name="评论" fill="#52c41a" />
                  <Bar dataKey="shareCount" name="分享" fill="#722ed1" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabPane>

          <TabPane tab={<span><FileTextOutlined /> 内容排行</span>} key="content">
            <Card title="热门内容排行榜">
              <Table
                columns={columns}
                dataSource={topContents}
                rowKey="contentId"
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

export default AnalyticsDashboard;
