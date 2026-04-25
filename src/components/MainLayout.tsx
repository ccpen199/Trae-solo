import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Typography, Divider, Tag, Progress, List, Card } from 'antd';
import {
  DashboardOutlined,
  GlobalOutlined,
  SearchOutlined,
  BellOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FireOutlined,
  RiseOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  LinkOutlined,
  CloudOutlined,
  TagOutlined,
  EnvironmentOutlined,
  SunOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  NotificationOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SmileOutlined,
  FrownOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppStore } from '../store/appStore';
import type { NewsSource, WeatherData, SubscriptionTopic, HotEvent } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { currentPage, setCurrentPage, alerts, newsSources, dashboardData, weatherData, subscriptionTopics, keywords } = useAppStore();
  
  const unreadAlertsCount = alerts.filter(a => a.status === 'unread').length;
  const activeSources = newsSources.filter(s => s.status === 'active').length;
  const activeKeywords = keywords.filter(k => k.monitorStatus === 'active').length;
  
  const getSourceIcon = (type: NewsSource['type']) => {
    switch (type) {
      case 'news': return <GlobalOutlined />;
      case 'rss': return <LinkOutlined />;
      case 'weather': return <CloudOutlined />;
      default: return <GlobalOutlined />;
    }
  };
  
  const sourceMenuItems = newsSources.filter(s => s.status === 'active').map(source => ({
    key: `source-${source.id}`,
    icon: getSourceIcon(source.type),
    label: (
      <span>
        {source.name}
        <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>{source.newsCount}</Tag>
      </span>
    )
  }));
  
  const topicMenuItems = subscriptionTopics.map(topic => ({
    key: `topic-${topic.id}`,
    icon: <SafetyCertificateOutlined />,
    label: (
      <span>
        {topic.name}
        <Tag color="green" style={{ marginLeft: 8, fontSize: 11 }}>{topic.newsCount}</Tag>
      </span>
    )
  }));
  
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '舆情概览',
      onClick: () => setCurrentPage('dashboard'),
      children: [
        {
          key: 'dashboard-overview',
          label: '数据总览',
          onClick: () => setCurrentPage('dashboard')
        },
        {
          key: 'dashboard-trend',
          label: '趋势分析',
          onClick: () => setCurrentPage('dashboard')
        },
        {
          key: 'dashboard-compare',
          label: '同比对比',
          onClick: () => setCurrentPage('dashboard')
        }
      ]
    },
    {
      key: 'sources',
      icon: <GlobalOutlined />,
      label: '来源管理',
      onClick: () => setCurrentPage('sources'),
      children: sourceMenuItems.length > 0 ? [
        {
          key: 'sources-all',
          label: '全部来源',
          onClick: () => setCurrentPage('sources')
        },
        { type: 'divider' as const },
        ...sourceMenuItems
      ] : undefined
    },
    {
      key: 'monitoring',
      icon: <SearchOutlined />,
      label: '舆情监测',
      onClick: () => setCurrentPage('monitoring'),
      children: [
        {
          key: 'monitoring-news',
          label: '新闻监测',
          onClick: () => setCurrentPage('monitoring')
        },
        {
          key: 'monitoring-keywords',
          label: (
            <span>
              <TagOutlined style={{ marginRight: 4 }} />关键词监测
              <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>{activeKeywords}</Tag>
            </span>
          ),
          onClick: () => setCurrentPage('monitoring')
        },
        {
          key: 'monitoring-regions',
          label: <span><EnvironmentOutlined style={{ marginRight: 4 }} />地区监测</span>,
          onClick: () => setCurrentPage('monitoring')
        },
        { type: 'divider' as const },
        {
          key: 'monitoring-topics',
          label: '订阅主题',
          onClick: () => setCurrentPage('monitoring'),
          children: topicMenuItems.length > 0 ? topicMenuItems : undefined
        }
      ]
    },
    {
      key: 'alerts',
      icon: (
        <Badge count={unreadAlertsCount} size="small">
          <BellOutlined />
        </Badge>
      ),
      label: '风险预警',
      onClick: () => setCurrentPage('alerts'),
      children: [
        {
          key: 'alerts-unread',
          label: (
            <span>
              未读预警
              <Badge count={alerts.filter(a => a.status === 'unread').length} size="small" style={{ marginLeft: 8 }} />
            </span>
          ),
          onClick: () => setCurrentPage('alerts')
        },
        {
          key: 'alerts-processed',
          label: (
            <span>
              已处理
              <Badge count={alerts.filter(a => a.status === 'processed').length} size="small" style={{ marginLeft: 8 }} />
            </span>
          ),
          onClick: () => setCurrentPage('alerts')
        },
        {
          key: 'alerts-rules',
          label: '预警规则',
          onClick: () => setCurrentPage('alerts')
        }
      ]
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: '简报导出',
      onClick: () => setCurrentPage('reports'),
      children: [
        {
          key: 'reports-daily',
          label: '日报导出',
          onClick: () => setCurrentPage('reports')
        },
        {
          key: 'reports-weekly',
          label: '周报导出',
          onClick: () => setCurrentPage('reports')
        },
        {
          key: 'reports-templates',
          label: '模板管理',
          onClick: () => setCurrentPage('reports')
        }
      ]
    }
  ];
  
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录'
    }
  ];
  
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return '舆情概览';
      case 'sources': return '来源管理';
      case 'monitoring': return '舆情监测';
      case 'alerts': return '风险预警';
      case 'reports': return '简报导出';
      default: return '舆情监控系统';
    }
  };

  const getWeatherIcon = (weather: string) => {
    if (weather.includes('晴')) return <SunOutlined style={{ color: '#faad14', fontSize: 20 }} />;
    if (weather.includes('雷') || weather.includes('雨')) return <ThunderboltOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
    return <CloudOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />;
  };

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return '#52c41a';
    if (aqi <= 100) return '#faad14';
    if (aqi <= 150) return '#fa8c16';
    return '#ff4d4f';
  };
  
  const SidebarWeather = () => {
    if (collapsed || weatherData.length === 0) return null;
    const weather = weatherData[0];
    
    return (
      <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          <CloudOutlined style={{ marginRight: 4 }} />
          天气信息
        </Text>
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {getWeatherIcon(weather.weather)}
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 'bold' }}>
              {weather.temperature.current}°C
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
              {weather.weather}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>
              {weather.region} | 湿度 {weather.humidity}%
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>最高</Text>
            <div style={{ color: '#ff4d4f', fontSize: 14, fontWeight: 'bold' }}>{weather.temperature.max}°</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>最低</Text>
            <div style={{ color: '#1890ff', fontSize: 14, fontWeight: 'bold' }}>{weather.temperature.min}°</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>空气质量</Text>
            <div style={{ color: getAqiColor(weather.aqi), fontSize: 14, fontWeight: 'bold' }}>
              {weather.aqi} {weather.aqiLevel}
            </div>
          </div>
        </div>
        
        {weather.warning && (
          <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,77,79,0.2)', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <WarningOutlined style={{ color: '#ff4d4f' }} />
              <Tag color="error" style={{ margin: 0, fontSize: 11 }}>
                {weather.warning.level}预警
              </Tag>
              <Text style={{ color: '#fff', fontSize: 11 }}>{weather.warning.type}</Text>
            </div>
            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, display: 'block', marginTop: 4 }}>
              {weather.warning.description}
            </Text>
          </div>
        )}
      </div>
    );
  };
  
  const SidebarQuickStats = () => {
    if (collapsed) return null;
    
    const miniTrendData = dashboardData.trendData.slice(-5);
    
    return (
      <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          <RiseOutlined style={{ marginRight: 4 }} />
          数据概览
        </Text>
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ textAlign: 'center', padding: 10, background: 'rgba(24,144,255,0.1)', borderRadius: 6 }}>
            <RiseOutlined style={{ color: '#1890ff', fontSize: 18 }} />
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
              {dashboardData.todayStats.totalNews}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>今日舆情</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: 10, background: 'rgba(255,77,79,0.1)', borderRadius: 6 }}>
            <WarningOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
              {unreadAlertsCount}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>未读预警</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: 10, background: 'rgba(82,196,26,0.1)', borderRadius: 6 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
              {activeSources}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>活跃来源</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: 10, background: 'rgba(250,173,20,0.1)', borderRadius: 6 }}>
            <FireOutlined style={{ color: '#faad14', fontSize: 18 }} />
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 4 }}>
              {dashboardData.todayStats.monitoredKeywords}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>监测关键词</div>
          </div>
        </div>
        
        <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <div>
          <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            <LineChartOutlined style={{ marginRight: 4 }} />
            舆情趋势（近5天）
          </Text>
          <div style={{ marginTop: 8, height: 80 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={miniTrendData}>
                <defs>
                  <linearGradient id="colorTotalMini" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1890ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#1890ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.45)' }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ 
                    background: 'rgba(0,0,0,0.85)', 
                    border: 'none', 
                    borderRadius: 4,
                    fontSize: 11
                  }} 
                />
                <Area type="monotone" dataKey="total" stroke="#1890ff" fill="url(#colorTotalMini)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <Divider style={{ margin: '12px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <div>
          <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
            情感指数
          </Text>
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ color: '#52c41a', fontSize: 11 }}>正面</Text>
              <Text style={{ color: '#52c41a', fontSize: 11, fontWeight: 'bold' }}>
                {dashboardData.sentimentAnalysis.positivePercent}%
              </Text>
            </div>
            <Progress 
              percent={Math.round(dashboardData.sentimentAnalysis.positivePercent)} 
              strokeColor="#52c41a"
              showInfo={false}
              size="small"
              trailColor="rgba(255,255,255,0.1)"
            />
          </div>
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <Text style={{ color: '#ff4d4f', fontSize: 11 }}>负面</Text>
              <Text style={{ color: '#ff4d4f', fontSize: 11, fontWeight: 'bold' }}>
                {dashboardData.sentimentAnalysis.negativePercent}%
              </Text>
            </div>
            <Progress 
              percent={Math.round(dashboardData.sentimentAnalysis.negativePercent)} 
              strokeColor="#ff4d4f"
              showInfo={false}
              size="small"
              trailColor="rgba(255,255,255,0.1)"
            />
          </div>
        </div>
      </div>
    );
  };

  const SidebarHotEvents = () => {
    if (collapsed || !dashboardData.hotEvents || dashboardData.hotEvents.length === 0) return null;
    
    return (
      <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          <FireOutlined style={{ marginRight: 4 }} />
          热点事件
        </Text>
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        {dashboardData.hotEvents.slice(0, 3).map((event: HotEvent, index: number) => (
          <div 
            key={event.id}
            style={{ 
              padding: 8, 
              background: event.riskLevel === 'high' || event.riskLevel === 'critical' ? 'rgba(255,77,79,0.1)' : 'rgba(24,144,255,0.05)', 
              borderRadius: 4,
              marginBottom: 6,
              cursor: 'pointer'
            }}
            onClick={() => setCurrentPage('dashboard')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                <Badge 
                  count={index + 1} 
                  style={{ 
                    backgroundColor: index < 3 ? '#ff4d4f' : index < 5 ? '#faad14' : '#1890ff',
                    minWidth: 18,
                    height: 18,
                    lineHeight: '18px',
                    fontSize: 10
                  }} 
                />
                <Text style={{ color: '#fff', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.title}
                </Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
                {event.sentiment === 'positive' ? (
                  <SmileOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                ) : event.sentiment === 'negative' ? (
                  <FrownOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                ) : null}
                {event.trend === 'rising' && (
                  <ArrowUpOutlined style={{ color: '#ff4d4f', fontSize: 10 }} />
                )}
                {event.trend === 'falling' && (
                  <ArrowDownOutlined style={{ color: '#52c41a', fontSize: 10 }} />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                {event.newsCount}条新闻
              </Text>
              <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>
                热度: {event.hotScore}
              </Text>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SidebarKeywordMiniTrend = () => {
    if (collapsed || !dashboardData.topKeywords || dashboardData.topKeywords.length === 0) return null;
    
    const topKeywords = dashboardData.topKeywords.slice(0, 4);
    
    return (
      <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          <TagOutlined style={{ marginRight: 4 }} />
          热门关键词
        </Text>
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        {topKeywords.map((keyword, index) => (
          <div 
            key={keyword.word}
            style={{ 
              marginBottom: index < topKeywords.length - 1 ? 8 : 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag 
                  color={index < 2 ? 'error' : index < 3 ? 'warning' : 'processing'} 
                  style={{ margin: 0, fontSize: 10, padding: '0 4px' }}
                >
                  {keyword.count}次
                </Tag>
                <Text style={{ color: '#fff', fontSize: 11 }}>{keyword.word}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {keyword.trend === 'up' && (
                  <span style={{ color: '#ff4d4f', fontSize: 10 }}>
                    <ArrowUpOutlined /> +{keyword.trendPercent}%
                  </span>
                )}
                {keyword.trend === 'down' && (
                  <span style={{ color: '#52c41a', fontSize: 10 }}>
                    <ArrowDownOutlined /> {keyword.trendPercent}%
                  </span>
                )}
                {keyword.trend === 'stable' && (
                  <span style={{ color: '#1890ff', fontSize: 10 }}>
                    稳定
                  </span>
                )}
              </div>
            </div>
            <Progress 
              percent={Math.min((keyword.count / topKeywords[0].count) * 100, 100)} 
              strokeColor={
                keyword.trend === 'up' ? '#ff4d4f' : 
                keyword.trend === 'down' ? '#52c41a' : '#1890ff'
              }
              showInfo={false}
              size="small"
              trailColor="rgba(255,255,255,0.1)"
            />
          </div>
        ))}
      </div>
    );
  };

  const SidebarRegionQuickView = () => {
    if (collapsed || !dashboardData.regionDistribution || dashboardData.regionDistribution.length === 0) return null;
    
    return (
      <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          地区分布
        </Text>
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        {dashboardData.regionDistribution.slice(0, 4).map((region) => (
          <div 
            key={region.region}
            style={{ 
              marginBottom: 8
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text style={{ color: '#fff', fontSize: 11 }}>{region.region}</Text>
              <div style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                <span style={{ color: '#52c41a' }}>正:{region.positive}</span>
                <span style={{ color: '#ff4d4f' }}>负:{region.negative}</span>
              </div>
            </div>
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
              <div 
                style={{ 
                  flex: region.positive, 
                  background: '#52c41a',
                  minWidth: region.positive > 0 ? 2 : 0
                }} 
              />
              <div 
                style={{ 
                  flex: region.negative, 
                  background: '#ff4d4f',
                  minWidth: region.negative > 0 ? 2 : 0
                }} 
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SidebarTopics = () => {
    if (collapsed || subscriptionTopics.length === 0) return null;
    
    return (
      <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)' }}>
        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          <SafetyCertificateOutlined style={{ marginRight: 4 }} />
          订阅主题
        </Text>
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        {subscriptionTopics.slice(0, 3).map((topic: SubscriptionTopic) => (
          <div 
            key={topic.id}
            style={{ 
              padding: 8, 
              background: 'rgba(24,144,255,0.08)', 
              borderRadius: 4,
              marginBottom: 6,
              cursor: 'pointer'
            }}
            onClick={() => setCurrentPage('monitoring')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>{topic.name}</Text>
              <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                {topic.newsCount}条
              </Tag>
            </div>
            <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, display: 'block', marginTop: 2 }}>
              {topic.keywords.slice(0, 2).join(', ')}...
            </Text>
          </div>
        ))}
      </div>
    );
  };
  
  const SidebarSystemStatus = () => {
    if (collapsed) return null;
    
    return (
      <div style={{ padding: 12, background: 'rgba(255, 255, 255, 0.05)', marginTop: 'auto' }}>
        <Text type="secondary" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
          <SyncOutlined style={{ marginRight: 4 }} />
          系统状态
        </Text>
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <SyncOutlined spin style={{ color: '#52c41a' }} />
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            最后同步: 10:30
          </Text>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <ClockCircleOutlined style={{ color: '#1890ff' }} />
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            下次同步: 11:00
          </Text>
        </div>
        
        <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <div style={{ textAlign: 'center', padding: 4 }}>
            <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
              <CheckCircleOutlined /> 正常
            </Tag>
          </div>
          <div style={{ textAlign: 'center', padding: 4 }}>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>
              运行中
            </Text>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={280}
        style={{ position: 'relative', height: '100vh', overflow: 'auto' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 16px',
          background: 'rgba(255, 255, 255, 0.1)'
        }}>
          {collapsed ? (
            <DashboardOutlined style={{ fontSize: 28, color: '#fff' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NotificationOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
                舆情监控系统
              </Title>
            </div>
          )}
        </div>
        
        <SidebarWeather />
        
        <SidebarQuickStats />
        
        <SidebarHotEvents />
        
        <SidebarKeywordMiniTrend />
        
        <SidebarRegionQuickView />
        
        <SidebarTopics />
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          style={{ borderRight: 'none' }}
        />
        
        <SidebarSystemStatus />
      </Sider>
      
      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 18, cursor: 'pointer' }}
              />
            ) : (
              <MenuFoldOutlined
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: 18, cursor: 'pointer' }}
              />
            )}
            <Title level={4} style={{ margin: 0 }}>{getPageTitle()}</Title>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadAlertsCount} size="small">
              <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} onClick={() => setCurrentPage('alerts')} />
            </Badge>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer'
              }}>
                <Avatar icon={<UserOutlined />} />
                <span>张三</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content style={{
          margin: 24,
          padding: 24,
          background: '#fff',
          minHeight: 280,
          borderRadius: 8
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
