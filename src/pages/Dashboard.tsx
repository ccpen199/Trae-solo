import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Tag, 
  Table, 
  List, 
  Avatar, 
  Typography, 
  Space,
  Timeline,
  Tabs,
  Radio,
  Divider,
  Badge,
  Progress
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import {
  RiseOutlined,
  BellOutlined,
  FileTextOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SmileOutlined,
  MehOutlined,
  FrownOutlined,
  FireOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  TagOutlined,
  CloudOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DashboardOutlined,
  BarChartOutlined,
  PlusOutlined,
  MinusOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import { useAppStore } from '../store/appStore';
import type { 
  NewsItem, 
  HotEvent, 
  TimelineEvent, 
  RealTimeStream, 
  KeywordTrend,
  SentimentTrendData,
  SourceSentimentDistribution,
  RegionSentimentDistribution,
  RiskTrendData,
  TopicDistribution
} from '../types';

const { Text } = Typography;
const { TabPane } = Tabs;

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [comparePeriod, setComparePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [sentimentView, setSentimentView] = useState<'trend' | 'source' | 'region'>('trend');
  const { dashboardData, newsItems, alerts } = useAppStore();
  
  const { 
    todayStats, 
    comparisonStats,
    trendData, 
    hourlyTrend,
    topKeywords, 
    keywordTrends,
    regionDistribution, 
    riskDistribution,
    sentimentAnalysis,
    sentimentTrendData,
    sourceSentimentDistribution,
    regionSentimentDistribution,
    riskTrendData,
    topicDistribution,
    sourceDistribution,
    sourceTrendData,
    hotEvents,
    timelineEvents,
    realTimeStreams
  } = dashboardData;
  
  const COLORS = ['#52c41a', '#1890ff', '#faad14', '#ff4d4f', '#722ed1', '#eb2f96', '#13c2c2', '#fa8c16'];
  
  const sentimentColors = {
    positive: '#52c41a',
    neutral: '#1890ff',
    negative: '#ff4d4f'
  };
  
  const riskLevelColors = {
    low: '#52c41a',
    medium: '#faad14',
    high: '#ff4d4f',
    critical: '#722ed1'
  };
  
  const riskLevelText = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '紧急'
  };
  
  const trendColors = {
    up: '#52c41a',
    down: '#ff4d4f',
    stable: '#1890ff'
  };
  
  const trendIcons = {
    up: <ArrowUpOutlined />,
    down: <ArrowDownOutlined />,
    stable: <ArrowUpOutlined style={{ transform: 'rotate(90deg)' }} />
  };
  
  const recentNews = newsItems.slice(0, 5);
  const recentAlerts = alerts.filter(a => a.status === 'unread' || a.status === 'read').slice(0, 5);
  
  const comparisonData = comparisonStats[comparePeriod];
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };
  
  const sentimentRadarData = [
    { subject: '正面情感', A: sentimentAnalysis.positivePercent, fullMark: 100 },
    { subject: '中性情感', A: sentimentAnalysis.neutralPercent, fullMark: 100 },
    { subject: '负面情感', A: sentimentAnalysis.negativePercent, fullMark: 100 },
    { subject: '媒体曝光', A: 85, fullMark: 100 },
    { subject: '互动热度', A: 75, fullMark: 100 },
    { subject: '传播速度', A: 90, fullMark: 100 }
  ];
  
  const newsColumns = [
    {
      title: '热度',
      dataIndex: 'hotScore',
      key: 'hotScore',
      width: 80,
      render: (score: number) => (
        <Space>
          <FireOutlined style={{ color: '#faad14' }} />
          <Text strong>{score}</Text>
        </Space>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: NewsItem) => (
        <div>
          <Text strong={!record.read} style={{ color: record.read ? '#666' : '#333' }}>
            {text}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: 12 }}>{record.source}</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.views.toLocaleString()} 阅读
              </Text>
            </Space>
          </div>
        </div>
      )
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: NewsItem['riskLevel']) => (
        <Tag color={riskLevelColors[level]}>{riskLevelText[level]}</Tag>
      )
    },
    {
      title: '情感倾向',
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 100,
      render: (sentiment: NewsItem['sentiment']) => {
        const icons = {
          positive: <SmileOutlined style={{ color: sentimentColors.positive }} />,
          neutral: <MehOutlined style={{ color: sentimentColors.neutral }} />,
          negative: <FrownOutlined style={{ color: sentimentColors.negative }} />
        };
        const texts = {
          positive: '正面',
          neutral: '中性',
          negative: '负面'
        };
        return (
          <Space>
            {icons[sentiment]}
            <Text style={{ color: sentimentColors[sentiment] }}>{texts[sentiment]}</Text>
          </Space>
        );
      }
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      key: 'publishTime',
      width: 160,
      render: (time: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {time}
        </Text>
      )
    }
  ];
  
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'news': return <FileTextOutlined />;
      case 'alert': return <BellOutlined />;
      case 'system': return <SyncOutlined />;
      default: return <InfoCircleOutlined />;
    }
  };
  
  const getEventColor = (type: TimelineEvent['type'], level?: TimelineEvent['level']) => {
    if (level) return riskLevelColors[level];
    switch (type) {
      case 'news': return '#1890ff';
      case 'alert': return '#ff4d4f';
      case 'system': return '#52c41a';
      default: return '#1890ff';
    }
  };
  
  const getStreamIcon = (type: RealTimeStream['type']) => {
    switch (type) {
      case 'news': return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'alert': return <WarningOutlined style={{ color: '#ff4d4f' }} />;
      case 'weather': return <CloudOutlined style={{ color: '#faad14' }} />;
      default: return <InfoCircleOutlined />;
    }
  };
  
  const getHotEventTrendIcon = (trend: HotEvent['trend']) => {
    switch (trend) {
      case 'rising': return <ArrowUpOutlined style={{ color: '#ff4d4f' }} />;
      case 'falling': return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
      case 'stable': return <ArrowUpOutlined style={{ transform: 'rotate(90deg)', color: '#1890ff' }} />;
      default: return null;
    }
  };
  
  const getSourceTrendLines = () => {
    if (!sourceTrendData || sourceTrendData.length === 0) return null;
    const keys = Object.keys(sourceTrendData[0]).filter(k => k !== 'date');
    return keys.map((key, index) => (
      <Line 
        key={key} 
        type="monotone" 
        dataKey={key} 
        stroke={COLORS[index % COLORS.length]} 
        strokeWidth={2}
        dot={false}
      />
    ));
  };

  const renderSentimentTrendChart = () => (
    <Card 
      title={
        <Space>
          <LineChartOutlined />
          <span>情感趋势变化（近7天）</span>
        </Space>
      }
      extra={
        <Radio.Group 
          value={sentimentView} 
          onChange={(e: RadioChangeEvent) => setSentimentView(e.target.value)}
          size="small"
        >
          <Radio.Button value="trend">趋势变化</Radio.Button>
          <Radio.Button value="source">来源分布</Radio.Button>
          <Radio.Button value="region">地区分布</Radio.Button>
        </Radio.Group>
      }
    >
      {sentimentView === 'trend' && (
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={sentimentTrendData}>
            <defs>
              <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            <Legend />
            <Area yAxisId="left" type="monotone" dataKey="positive" stroke="#52c41a" fill="url(#colorPos)" name="正面数量" strokeWidth={2} />
            <Area yAxisId="left" type="monotone" dataKey="neutral" stroke="#1890ff" fill="rgba(24,144,255,0.1)" name="中性数量" strokeWidth={2} />
            <Area yAxisId="left" type="monotone" dataKey="negative" stroke="#ff4d4f" fill="url(#colorNeg)" name="负面数量" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="positivePercent" stroke="#52c41a" strokeWidth={2} strokeDasharray="5 5" name="正面占比%" dot={{ fill: '#52c41a' }} />
            <Line yAxisId="right" type="monotone" dataKey="negativePercent" stroke="#ff4d4f" strokeWidth={2} strokeDasharray="5 5" name="负面占比%" dot={{ fill: '#ff4d4f' }} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
      
      {sentimentView === 'source' && (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={sourceSentimentDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="positive" stackId="a" fill="#52c41a" name="正面" />
            <Bar dataKey="neutral" stackId="a" fill="#1890ff" name="中性" />
            <Bar dataKey="negative" stackId="a" fill="#ff4d4f" name="负面" />
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {sentimentView === 'region' && (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={regionSentimentDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="region" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="positivePercent" fill="#52c41a" name="正面占比%" />
            <Bar dataKey="negativePercent" fill="#ff4d4f" name="负面占比%" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );

  const renderRiskTrendChart = () => (
    <Card 
      title={
        <Space>
          <BarChartOutlined />
          <span>风险等级趋势（近7天）</span>
        </Space>
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={riskTrendData}>
          <defs>
            <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#faad14" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#faad14" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#722ed1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#722ed1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <RechartsTooltip />
          <Legend />
          <Area type="monotone" dataKey="low" stroke="#52c41a" fill="url(#colorLow)" name="低风险" strokeWidth={2} />
          <Area type="monotone" dataKey="medium" stroke="#faad14" fill="url(#colorMedium)" name="中风险" strokeWidth={2} />
          <Area type="monotone" dataKey="high" stroke="#ff4d4f" fill="url(#colorHigh)" name="高风险" strokeWidth={2} />
          <Area type="monotone" dataKey="critical" stroke="#722ed1" fill="url(#colorCritical)" name="紧急" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderTopicDistribution = () => (
    <Card 
      title={
        <Space>
          <SafetyCertificateOutlined />
          <span>订阅主题分布</span>
        </Space>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topicDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="topic" type="category" tick={{ fontSize: 12 }} width={100} />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill="#52c41a" name="正面" />
              <Bar dataKey="negative" stackId="a" fill="#ff4d4f" name="负面" />
            </BarChart>
          </ResponsiveContainer>
        </Col>
        <Col xs={24} md={12}>
          <List
            dataSource={topicDistribution}
            renderItem={(item: TopicDistribution) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Tag color={item.trend === 'up' ? 'error' : item.trend === 'down' ? 'success' : 'processing'} style={{ fontSize: 11 }}>
                      {item.trend === 'up' ? <ArrowUpOutlined /> : item.trend === 'down' ? <ArrowDownOutlined /> : <ArrowUpOutlined style={{ transform: 'rotate(90deg)' }} />}
                    </Tag>
                  }
                  title={
                    <Space>
                      <Text strong>{item.topic}</Text>
                      <Tag color="blue">{item.count}条</Tag>
                    </Space>
                  }
                  description={
                    <div style={{ marginTop: 4 }}>
                      <Progress 
                        percent={Math.round((item.positive / item.count) * 100)} 
                        strokeColor="#52c41a"
                        trailColor="#ff4d4f"
                        size="small"
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                        <Text type="secondary" style={{ color: '#52c41a', fontSize: 11 }}>
                          正面: {item.positive}
                        </Text>
                        <Text type="secondary" style={{ color: '#ff4d4f', fontSize: 11 }}>
                          负面: {item.negative}
                        </Text>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </Card>
  );

  const renderKeywordHorizontalChart = () => (
    <Card 
      title={
        <Space>
          <TagOutlined />
          <span>热门关键词热度对比</span>
        </Space>
      }
    >
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={topKeywords.slice(0, 6)} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="word" type="category" tick={{ fontSize: 12 }} width={80} />
          <RechartsTooltip />
          <Legend />
          <Bar dataKey="count" name="出现次数" radius={[0, 4, 4, 0]}>
            {topKeywords.slice(0, 6).map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.trend === 'up' ? '#ff4d4f' : entry.trend === 'down' ? '#52c41a' : '#1890ff'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );

  const renderCompareChart = () => {
    const compareChartData = [
      {
        period: '总舆情',
        上期: comparisonData.previous.totalNews,
        本期: comparisonData.current.totalNews,
        变化: Number(calculateChange(comparisonData.current.totalNews, comparisonData.previous.totalNews))
      },
      {
        period: '正面舆情',
        上期: comparisonData.previous.positiveNews,
        本期: comparisonData.current.positiveNews,
        变化: Number(calculateChange(comparisonData.current.positiveNews, comparisonData.previous.positiveNews))
      },
      {
        period: '负面舆情',
        上期: comparisonData.previous.negativeNews,
        本期: comparisonData.current.negativeNews,
        变化: Number(calculateChange(comparisonData.current.negativeNews, comparisonData.previous.negativeNews))
      },
      {
        period: '紧急预警',
        上期: comparisonData.previous.criticalAlerts,
        本期: comparisonData.current.criticalAlerts,
        变化: Number(calculateChange(comparisonData.current.criticalAlerts, comparisonData.previous.criticalAlerts))
      }
    ];

    return (
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            <span>同比/环比对比</span>
          </Space>
        }
        extra={
          <Radio.Group 
            value={comparePeriod} 
            onChange={(e: RadioChangeEvent) => setComparePeriod(e.target.value)}
            size="small"
          >
            <Radio.Button value="daily">日对比</Radio.Button>
            <Radio.Button value="weekly">周对比</Radio.Button>
            <Radio.Button value="monthly">月对比</Radio.Button>
          </Radio.Group>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={compareChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="上期" fill="#d9d9d9" name="上期" />
                <Bar dataKey="本期" fill="#1890ff" name="本期" />
              </BarChart>
            </ResponsiveContainer>
          </Col>
          <Col xs={24} md={10}>
            <List
              dataSource={compareChartData}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong>{item.period}</Text>
                      <Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          上期: {item.上期}
                        </Text>
                        <Text style={{ fontSize: 12 }}>
                          →
                        </Text>
                        <Text strong style={{ fontSize: 12 }}>
                          本期: {item.本期}
                        </Text>
                      </Space>
                    </div>
                    <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Progress 
                        percent={Math.min(Math.abs(item.变化), 100)} 
                        strokeColor={item.变化 >= 0 ? '#ff4d4f' : '#52c41a'}
                        size="small"
                        showInfo={false}
                        style={{ flex: 1 }}
                      />
                      <Tag color={item.变化 >= 0 ? 'error' : 'success'} style={{ margin: 0 }}>
                        {item.变化 >= 0 ? <PlusOutlined /> : <MinusOutlined />} {Math.abs(item.变化)}%
                      </Tag>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        type="card"
        style={{ marginBottom: 16 }}
      >
        <TabPane tab={<span><DashboardOutlined /> 数据总览</span>} key="overview" />
        <TabPane tab={<span><LineChartOutlined /> 趋势分析</span>} key="trends" />
        <TabPane tab={<span><PieChartOutlined /> 情感分析</span>} key="sentiment" />
        <TabPane tab={<span><BarChartOutlined /> 风险预警</span>} key="risk" />
        <TabPane tab={<span><TagOutlined /> 关键词监控</span>} key="keywords" />
        <TabPane tab={<span><SafetyCertificateOutlined /> 主题分布</span>} key="topics" />
        <TabPane tab={<span><LineChartOutlined /> 来源分析</span>} key="sources" />
        <TabPane tab={<span><BellOutlined /> 预警动态</span>} key="alerts" />
      </Tabs>

      {activeTab === 'overview' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title={
                    <Space>
                      <RiseOutlined style={{ color: '#1890ff' }} />
                      <span>今日舆情总量</span>
                    </Space>
                  }
                  value={todayStats.totalNews}
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                  suffix={
                    <span style={{ fontSize: 14, color: '#52c41a' }}>
                      <ArrowUpOutlined /> {calculateChange(comparisonData.current.totalNews, comparisonData.previous.totalNews)}%
                    </span>
                  }
                />
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    昨日: {comparisonData.previous.totalNews}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    活跃来源: {todayStats.activeSources}
                  </Text>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title={
                    <Space>
                      <SmileOutlined style={{ color: '#52c41a' }} />
                      <span>正面舆情</span>
                    </Space>
                  }
                  value={todayStats.positiveNews}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                  suffix={
                    <span style={{ fontSize: 14 }}>
                      占比 {Math.round(sentimentAnalysis.positivePercent)}%
                    </span>
                  }
                />
                <Progress 
                  percent={Math.round(sentimentAnalysis.positivePercent)} 
                  strokeColor="#52c41a"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title={
                    <Space>
                      <FrownOutlined style={{ color: '#ff4d4f' }} />
                      <span>负面舆情</span>
                    </Space>
                  }
                  value={todayStats.negativeNews}
                  valueStyle={{ color: '#ff4d4f', fontWeight: 'bold' }}
                  suffix={
                    <span style={{ fontSize: 14 }}>
                      占比 {Math.round(sentimentAnalysis.negativePercent)}%
                    </span>
                  }
                />
                <Progress 
                  percent={Math.round(sentimentAnalysis.negativePercent)} 
                  strokeColor="#ff4d4f"
                  size="small"
                  style={{ marginTop: 8 }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} md={6}>
              <Card size="small" hoverable>
                <Statistic
                  title={
                    <Space>
                      <WarningOutlined style={{ color: '#722ed1' }} />
                      <span>紧急预警</span>
                    </Space>
                  }
                  value={todayStats.criticalAlerts}
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                  suffix={
                    <span style={{ fontSize: 14, color: '#ff4d4f' }}>
                      需处理
                    </span>
                  }
                />
                <div style={{ marginTop: 8 }}>
                  <Space split={<Divider type="vertical" />}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      关键词: {todayStats.monitoredKeywords}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      订阅: {todayStats.activeSubscriptions}
                    </Text>
                  </Space>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={14}>
              <Card 
                title={
                  <Space>
                    <LineChartOutlined />
                    <span>舆情趋势（近7天）</span>
                  </Space>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#52c41a" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#52c41a" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff4d4f" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff4d4f" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="positive" stroke="#52c41a" fill="url(#colorPositive)" name="正面" strokeWidth={2} />
                    <Area type="monotone" dataKey="neutral" stroke="#1890ff" fill="url(#colorNeutral)" name="中性" strokeWidth={2} />
                    <Area type="monotone" dataKey="negative" stroke="#ff4d4f" fill="url(#colorNegative)" name="负面" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} lg={10}>
              <Card 
                title={
                  <Space>
                    <PieChartOutlined />
                    <span>情感分析分布</span>
                  </Space>
                }
                extra={
                  <Tag color={sentimentAnalysis.trend === 'improving' ? 'success' : sentimentAnalysis.trend === 'worsening' ? 'error' : 'processing'}>
                    {sentimentAnalysis.trend === 'improving' ? '情绪向好' : sentimentAnalysis.trend === 'worsening' ? '情绪恶化' : '情绪稳定'}
                  </Tag>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={12}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: '正面', value: sentimentAnalysis.positive, percent: sentimentAnalysis.positivePercent },
                            { name: '中性', value: sentimentAnalysis.neutral, percent: sentimentAnalysis.neutralPercent },
                            { name: '负面', value: sentimentAnalysis.negative, percent: sentimentAnalysis.negativePercent }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#52c41a" />
                          <Cell fill="#1890ff" />
                          <Cell fill="#ff4d4f" />
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col xs={12}>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={sentimentRadarData}>
                        <PolarGrid stroke="#f0f0f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar name="综合指数" dataKey="A" stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>正面</Text>
                    <div style={{ color: '#52c41a', fontSize: 18, fontWeight: 'bold' }}>
                      {sentimentAnalysis.positivePercent}%
                    </div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>中性</Text>
                    <div style={{ color: '#1890ff', fontSize: 18, fontWeight: 'bold' }}>
                      {sentimentAnalysis.neutralPercent}%
                    </div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>负面</Text>
                    <div style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
                      {sentimentAnalysis.negativePercent}%
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <TagOutlined />
                    <span>热门关键词TOP8</span>
                  </Space>
                }
                extra={<ArrowUpOutlined style={{ color: '#ff4d4f' }} />}
                size="small"
              >
                <List
                  dataSource={topKeywords}
                  size="small"
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            style={{
                              backgroundColor: index < 3 ? '#ff4d4f' : index < 5 ? '#faad14' : '#1890ff',
                              fontWeight: 'bold',
                              width: 28,
                              height: 28,
                              fontSize: 12
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        }
                        title={
                          <Space size="small">
                            <Text strong style={{ fontSize: 13 }}>{item.word}</Text>
                            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                              {item.count}次
                            </Tag>
                            <span style={{ color: trendColors[item.trend], fontSize: 11 }}>
                              {trendIcons[item.trend]} {item.trendPercent > 0 ? '+' : ''}{item.trendPercent}%
                            </span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <ClockCircleOutlined />
                    <span>实时动态</span>
                  </Space>
                }
                size="small"
              >
                <List
                  dataSource={realTimeStreams}
                  size="small"
                  renderItem={(item) => (
                    <List.Item style={{ padding: '8px 0' }}>
                      <List.Item.Meta
                        avatar={getStreamIcon(item.type)}
                        title={
                          <Space>
                            <Text ellipsis style={{ maxWidth: 150, fontSize: 13 }}>
                              {item.title}
                            </Text>
                            {item.riskLevel && (
                              <Tag color={riskLevelColors[item.riskLevel]} style={{ margin: 0 }}>
                                {riskLevelText[item.riskLevel]}
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space size="small" split={<Divider type="vertical" />}>
                            <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>{item.source}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <ClockCircleOutlined />
                    <span>动态时间线</span>
                  </Space>
                }
                size="small"
              >
                <Timeline
                  mode="left"
                  style={{ padding: 0 }}
                  items={timelineEvents.map((event) => ({
                    color: getEventColor(event.type, event.level),
                    dot: getEventIcon(event.type),
                    children: (
                      <div>
                        <Text strong style={{ fontSize: 12 }}>{event.title}</Text>
                        <div>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {event.description}
                          </Text>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {event.time}
                        </Text>
                      </div>
                    ),
                  }))}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <FileTextOutlined />
                    <span>最新舆情</span>
                  </Space>
                }
                extra={<a href="#" onClick={(e) => e.preventDefault()}>查看全部</a>}
              >
                <Table
                  dataSource={recentNews}
                  columns={newsColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card 
                title={
                  <Space>
                    <BellOutlined />
                    <span>待处理预警</span>
                  </Space>
                }
                extra={<a href="#" onClick={(e) => e.preventDefault()}>查看全部</a>}
              >
                <List
                  dataSource={recentAlerts}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color={riskLevelColors[item.riskLevel]} style={{ margin: 0 }}>
                            {riskLevelText[item.riskLevel]}
                          </Tag>
                        }
                        title={
                          <Text ellipsis style={{ maxWidth: 200, fontSize: 13 }}>
                            {item.newsTitle}
                          </Text>
                        }
                        description={
                          <Space>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {item.ruleName}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {item.alertTime}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'trends' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {renderCompareChart()}
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} lg={12}>
              <Card title={
                <Space>
                  <LineChartOutlined />
                  <span>小时趋势图</span>
                </Space>
              }>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#1890ff" name="舆情数量" radius={[4, 4, 0, 0]}>
                      {hourlyTrend.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.count > 30 ? '#ff4d4f' : entry.count > 20 ? '#faad14' : '#1890ff'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title={
                <Space>
                  <EnvironmentOutlined />
                  <span>地区分布</span>
                </Space>
              }>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={80} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="positive" stackId="a" fill="#52c41a" name="正面" />
                    <Bar dataKey="negative" stackId="a" fill="#ff4d4f" name="负面" />
                    <Bar dataKey="count" name="总计" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'sentiment' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {renderSentimentTrendChart()}
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Card title={
                <Space>
                  <PieChartOutlined />
                  <span>情感分布</span>
                </Space>
              }>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '正面', value: sentimentAnalysis.positive, percent: sentimentAnalysis.positivePercent },
                        { name: '中性', value: sentimentAnalysis.neutral, percent: sentimentAnalysis.neutralPercent },
                        { name: '负面', value: sentimentAnalysis.negative, percent: sentimentAnalysis.negativePercent }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      dataKey="value"
                      paddingAngle={5}
                    >
                      <Cell fill="#52c41a" />
                      <Cell fill="#1890ff" />
                      <Cell fill="#ff4d4f" />
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <Card title={
                <Space>
                  <Radar
                    name="综合指数"
                    dataKey="A"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.3}
                  />
                  <span>情感指数雷达图</span>
                </Space>
              }>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={sentimentRadarData}>
                    <PolarGrid stroke="#f0f0f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Radar name="综合指数" dataKey="A" stroke="#1890ff" fill="#1890ff" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'risk' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {renderRiskTrendChart()}
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title={
                <Space>
                  <PieChartOutlined />
                  <span>风险等级分布</span>
                </Space>
              }>
                <Row>
                  <Col xs={24} md={12}>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={riskDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.level}: ${entry.count} (${entry.percent}%)`}
                          outerRadius={100}
                          innerRadius={60}
                          dataKey="count"
                          paddingAngle={2}
                        >
                          {riskDistribution.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{ padding: 16 }}>
                      {riskDistribution.map((item, index) => (
                        <div key={item.level} style={{ marginBottom: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Space>
                              <Badge color={COLORS[index % COLORS.length]} />
                              <Text strong>{item.level}</Text>
                            </Space>
                            <Text strong style={{ color: COLORS[index % COLORS.length] }}>
                              {item.count} 条 ({item.percent}%)
                            </Text>
                          </div>
                          <Progress 
                            percent={item.percent} 
                            strokeColor={COLORS[index % COLORS.length]}
                            showInfo={false}
                            size="small"
                          />
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'keywords' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {renderKeywordHorizontalChart()}
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title={
                <Space>
                  <TagOutlined />
                  <span>关键词热度趋势</span>
                </Space>
              }>
                <Row gutter={[16, 16]}>
                  {keywordTrends.map((trend: KeywordTrend, index: number) => (
                    <Col xs={24} md={8} key={trend.word}>
                      <Card 
                        size="small"
                        title={
                          <Space>
                            <Text strong>{trend.word}</Text>
                            <Tag color={trend.trend === 'up' ? 'red' : trend.trend === 'down' ? 'green' : 'blue'}>
                              {trend.trend === 'up' ? '上升' : trend.trend === 'down' ? '下降' : '稳定'}
                            </Tag>
                          </Space>
                        }
                      >
                        <ResponsiveContainer width="100%" height={150}>
                          <LineChart data={trend.data}>
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <RechartsTooltip />
                            <Line 
                              type="monotone" 
                              dataKey="count" 
                              stroke={COLORS[index % COLORS.length]}
                              strokeWidth={2}
                              dot={{ fill: COLORS[index % COLORS.length] }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'topics' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              {renderTopicDistribution()}
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'sources' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={
                <Space>
                  <PieChartOutlined />
                  <span>来源分布</span>
                </Space>
              }>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={sourceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={(entry: any) => `${entry.name}: ${entry.count}`}
                      outerRadius={120}
                      dataKey="count"
                    >
                      {sourceDistribution.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title={
                <Space>
                  <LinkOutlined />
                  <span>来源类型分布</span>
                </Space>
              }>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={[
                    { type: '新闻网站', count: sourceDistribution.filter(s => s.type === 'news').reduce((sum, s) => sum + s.count, 0), name: '新闻' },
                    { type: 'RSS订阅', count: sourceDistribution.filter(s => s.type === 'rss').reduce((sum, s) => sum + s.count, 0), name: 'RSS' },
                    { type: '天气数据', count: sourceDistribution.filter(s => s.type === 'weather').reduce((sum, s) => sum + s.count, 0), name: '天气' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="count" name="数量" radius={[8, 8, 0, 0]}>
                      <Cell fill="#1890ff" />
                      <Cell fill="#722ed1" />
                      <Cell fill="#faad14" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24}>
              <Card title={
                <Space>
                  <LineChartOutlined />
                  <span>来源趋势对比（近7天）</span>
                </Space>
              }>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={sourceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Legend />
                    {getSourceTrendLines()}
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'alerts' && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={
                <Space>
                  <FireOutlined />
                  <span>热点事件</span>
                </Space>
              }>
                <List
                  grid={{ gutter: 16, column: 1 }}
                  dataSource={hotEvents}
                  renderItem={(event: HotEvent) => (
                    <List.Item>
                      <Card 
                        size="small"
                        hoverable
                        style={{ 
                          borderLeft: `4px solid ${event.sentiment === 'positive' ? '#52c41a' : '#ff4d4f'}`
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <Text strong>{event.title}</Text>
                            <div style={{ marginTop: 8 }}>
                              <Space size="small" wrap>
                                {event.keywords.slice(0, 3).map((kw, i) => (
                                  <Tag key={i} color="blue" style={{ fontSize: 11 }}>{kw}</Tag>
                                ))}
                              </Space>
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <Space size="small" split={<Divider type="vertical" />}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  相关新闻: {event.newsCount}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {event.region}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {event.startDate}
                                </Text>
                              </Space>
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', marginLeft: 16 }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                              {event.hotScore}
                            </div>
                            <div style={{ fontSize: 11, color: '#999' }}>热度</div>
                            <div style={{ marginTop: 4 }}>
                              {getHotEventTrendIcon(event.trend)}
                              <Text style={{ 
                                fontSize: 11, 
                                marginLeft: 4,
                                color: event.trend === 'rising' ? '#ff4d4f' : event.trend === 'falling' ? '#52c41a' : '#1890ff'
                              }}>
                                {event.trend === 'rising' ? '上升' : event.trend === 'falling' ? '下降' : '稳定'}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={12}>
              <Card title={
                <Space>
                  <BellOutlined />
                  <span>预警动态时间线</span>
                </Space>
              }>
                <Timeline
                  mode="left"
                  items={timelineEvents.filter(e => e.type === 'alert' || e.type === 'news').map((event) => ({
                    color: getEventColor(event.type, event.level),
                    dot: getEventIcon(event.type),
                    children: (
                      <Card size="small" style={{ marginBottom: 8 }}>
                        <div>
                          <Space>
                            <Text strong style={{ fontSize: 13 }}>{event.title}</Text>
                            {event.level && (
                              <Tag color={riskLevelColors[event.level]} style={{ margin: 0 }}>
                                {riskLevelText[event.level]}
                              </Tag>
                            )}
                          </Space>
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {event.description}
                            </Text>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {event.time}
                            </Text>
                          </div>
                        </div>
                      </Card>
                    ),
                  }))}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
