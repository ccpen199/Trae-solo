import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Spin, Empty, Typography, Progress, Space } from 'antd';
import {
  MoonOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { sleepAPI } from '../services/api';
import { SleepStats, SleepSummary } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [stats, setStats] = useState<SleepStats[]>([]);
  const [summary, setSummary] = useState<SleepSummary | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await sleepAPI.getStats(7);
      setStats(data.stats || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('获取睡眠统计失败:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartData = stats?.map(item => ({
    date: dayjs(item.sleep_date).format('MM-DD'),
    duration: item.duration ? Number((item.duration / 60).toFixed(1)) : 0,
    deepSleep: item.deep_sleep_duration ? Number((item.deep_sleep_duration / 60).toFixed(1)) : 0,
    score: item.sleep_quality_score || 0
  })) || [];

  const getQualityColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getQualityText = (score: number) => {
    if (score >= 80) return '优秀';
    if (score >= 60) return '良好';
    return '需改善';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Empty
          description="加载失败"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            无法获取睡眠数据
          </Text>
          <ReloadOutlined
            onClick={fetchData}
            style={{ fontSize: 24, cursor: 'pointer', color: '#1890ff' }}
          />
        </div>
      </div>
    );
  }

  const hasData = stats && stats.length > 0;

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>睡眠概览</Title>
        <Text type="secondary">最近7天</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均睡眠时长"
              value={summary?.avgDuration ? Number((summary.avgDuration / 60).toFixed(1)) : 0}
              suffix="小时"
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均深度睡眠"
              value={summary?.avgDeepSleep ? Number((summary.avgDeepSleep / 60).toFixed(1)) : 0}
              suffix="小时"
              prefix={<MoonOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均睡眠质量"
              value={summary?.avgScore ? Number(summary.avgScore.toFixed(0)) : 0}
              suffix="分"
              prefix={<BarChartOutlined style={{ color: getQualityColor(summary?.avgScore || 0) }} />}
              valueStyle={{ color: getQualityColor(summary?.avgScore || 0) }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="记录天数"
              value={summary?.totalDays || 0}
              suffix="天"
              prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {hasData ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="睡眠时长趋势" extra={<Text type="secondary">单位：小时</Text>}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="duration" stroke="#1890ff" strokeWidth={2} name="总睡眠" />
                  <Line type="monotone" dataKey="deepSleep" stroke="#722ed1" strokeWidth={2} name="深度睡眠" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="睡眠质量评分" style={{ marginBottom: 16 }}>
              {stats && stats.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {stats.slice().reverse().slice(0, 5).map((item, index) => (
                    <div key={index}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text>{dayjs(item.sleep_date).format('MM-DD')}</Text>
                        <Text type={item.sleep_quality_score && item.sleep_quality_score >= 7 ? 'success' : 'warning'}>
                          {item.sleep_quality_score ? getQualityText(item.sleep_quality_score) : '-'}
                        </Text>
                      </div>
                      <Progress
                        percent={Number(((item.duration || 0) / 8 * 100).toFixed(0))}
                        strokeColor={item.duration && item.duration >= 7 ? '#52c41a' : '#faad14'}
                        showInfo={false}
                      />
                    </div>
                  ))}
                </Space>
              ) : (
                <Empty description="暂无睡眠数据" />
              )}
            </Card>
          </Col>
        </Row>
      ) : (
        <Card>
          <Empty
            description={
              <span>
                暂无睡眠数据
                <br />
                <Text type="secondary">开始记录您的第一个睡眠吧！</Text>
              </span>
            }
          />
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
