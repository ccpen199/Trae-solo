import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, message, Space, Tabs, Statistic, Alert } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { WarningOutlined, ArrowUpOutlined, ArrowDownOutlined, SafetyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { safetyAPI } from '../api';
import dayjs from 'dayjs';

const UsageStatistics = () => {
  const [usageData, setUsageData] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usageRes, anomalyRes, statsRes] = await Promise.all([
        safetyAPI.getUsageStatistics(),
        safetyAPI.getUsageAnomalies(),
        safetyAPI.getUsageOverview(),
      ]);
      setUsageData(usageRes.data || []);
      setAnomalies(anomalyRes.data || []);
      setStatistics(statsRes.data);
    } catch (err) {
      message.error('加载用量数据失败');
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: '烹饪用气', value: 45, color: '#1890ff' },
    { name: '热水器用气', value: 35, color: '#52c41a' },
    { name: '采暖用气', value: 15, color: '#faad14' },
    { name: '其他', value: 5, color: '#722ed1' },
  ];

  const items = [
    {
      key: 'monthly',
      label: '月度用量',
      children: (
        <Card bordered={false}>
          <h3 style={{ marginTop: 0 }}>近12个月燃气用量趋势</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} m³`, '用量']} />
              <Legend />
              <Line
                type="monotone"
                dataKey="usage"
                stroke="#1890ff"
                strokeWidth={2}
                name="实际用量"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="average"
                stroke="#d9d9d9"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="历史均值"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      ),
    },
    {
      key: 'comparison',
      label: '用量对比',
      children: (
        <Card bordered={false}>
          <h3 style={{ marginTop: 0 }}>与去年同期用量对比</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} m³`, '用量']} />
              <Legend />
              <Bar dataKey="usage" name="今年" fill="#1890ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="last_year" name="去年" fill="#d9d9d9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      ),
    },
    {
      key: 'analysis',
      label: '用气分析',
      children: (
        <Card bordered={false}>
          <h3 style={{ marginTop: 0 }}>用气用途分布</h3>
          <Row gutter={24}>
            <Col span={12}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Col>
            <Col span={12}>
              <Space direction="vertical" size="large" style={{ width: '100%', marginTop: 20 }}>
                {pieData.map(item => (
                  <Card size="small" key={item.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Space>
                        <div style={{ width: 16, height: 16, background: item.color, borderRadius: 2 }} />
                        <span>{item.name}</span>
                      </Space>
                      <span style={{ fontWeight: 'bold' }}>{item.value}%</span>
                    </div>
                  </Card>
                ))}
              </Space>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  const activeAnomalies = anomalies.filter(a => a.status === 'active');

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>用气分析与异常预警</h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          基于历史用量聚类分析，智能识别用气异常，保障用气安全
        </p>
      </Card>

      {activeAnomalies.length > 0 && (
        <Alert
          message={`检测到 ${activeAnomalies.length} 条用气异常预警`}
          description={
            <ul style={{ margin: '8px 0 0 16px', padding: 0 }}>
              {activeAnomalies.slice(0, 2).map(a => (
                <li key={a.id}>
                  <strong>{dayjs(a.detected_at).format('YYYY-MM-DD')}</strong>：{a.description}
                </li>
              ))}
            </ul>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          action={
            <Button size="small" type="primary" onClick={() => document.getElementById('anomaly-section')?.scrollIntoView({ behavior: 'smooth' })}>
              查看详情
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#666' }}>本月用量</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 28, color: '#1890ff', fontWeight: 'bold' }}>
                  {statistics?.current_month?.toFixed(1) || 0}
                  <span style={{ fontSize: 14, color: '#666', marginLeft: 4 }}>m³</span>
                </p>
              </div>
              {statistics?.current_month > statistics?.average_month ? (
                <ArrowUpOutlined style={{ fontSize: 32, color: '#f5222d' }} />
              ) : (
                <ArrowDownOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              )}
            </div>
            <p style={{ margin: '8px 0 0 0', color: statistics?.current_month > statistics?.average_month ? '#f5222d' : '#52c41a' }}>
              {statistics?.current_month > statistics?.average_month ? '↑' : '↓'}
              较月均 {Math.abs(((statistics?.current_month - statistics?.average_month) / statistics?.average_month * 100) || 0).toFixed(1)}%
            </p>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#666' }}>累计用量</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 28, color: '#722ed1', fontWeight: 'bold' }}>
                  {statistics?.total?.toFixed(0) || 0}
                  <span style={{ fontSize: 14, color: '#666', marginLeft: 4 }}>m³</span>
                </p>
              </div>
              <SafetyOutlined style={{ fontSize: 32, color: '#722ed140' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#666' }}>月均用量</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 28, color: '#13c2c2', fontWeight: 'bold' }}>
                  {statistics?.average_month?.toFixed(1) || 0}
                  <span style={{ fontSize: 14, color: '#666', marginLeft: 4 }}>m³</span>
                </p>
              </div>
              <InfoCircleOutlined style={{ fontSize: 32, color: '#13c2c240' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, color: '#666' }}>异常预警</p>
                <p style={{ margin: '8px 0 0 0', fontSize: 28, color: activeAnomalies.length > 0 ? '#faad14' : '#52c41a', fontWeight: 'bold' }}>
                  {activeAnomalies.length}
                  <span style={{ fontSize: 14, color: '#666', marginLeft: 4 }}>条</span>
                </p>
              </div>
              <WarningOutlined style={{ fontSize: 32, color: `${activeAnomalies.length > 0 ? '#faad14' : '#52c41a'}40` }} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Tabs items={items} />
      </Card>

      <Card id="anomaly-section" title="异常预警记录" bordered={false}>
        {anomalies.length > 0 ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {anomalies.map(anomaly => (
              <Card
                key={anomaly.id}
                size="small"
                style={{
                  borderLeft: `4px solid ${anomaly.status === 'active' ? '#faad14' : anomaly.severity === 'high' ? '#f5222d' : '#d9d9d9'}`,
                }}
              >
                <Row align="middle">
                  <Col span={18}>
                    <Space>
                      {anomaly.status === 'active' && (
                        <Tag color="warning">待处理</Tag>
                      )}
                      {anomaly.status === 'resolved' && (
                        <Tag color="success">已处理</Tag>
                      )}
                      <Tag color={anomaly.severity === 'high' ? 'red' : anomaly.severity === 'medium' ? 'orange' : 'blue'}>
                        {anomaly.severity === 'high' ? '高风险' : anomaly.severity === 'medium' ? '中风险' : '低风险'}
                      </Tag>
                      <strong>{anomaly.type === 'high_usage' ? '用量异常偏高' : anomaly.type === 'leak_suspected' ? '疑似泄漏' : anomaly.type}</strong>
                    </Space>
                    <p style={{ margin: '8px 0 0 0', color: '#666' }}>{anomaly.description}</p>
                    <p style={{ margin: '4px 0 0 0', color: '#999', fontSize: 12 }}>
                      检测时间：{dayjs(anomaly.detected_at).format('YYYY-MM-DD HH:mm')}
                      {anomaly.resolved_at && ` · 处理时间：${dayjs(anomaly.resolved_at).format('YYYY-MM-DD HH:mm')}`}
                    </p>
                  </Col>
                  <Col span={6} style={{ textAlign: 'right' }}>
                    {anomaly.status === 'active' && (
                      <Space direction="vertical" size="small">
                        <Button size="small" type="primary">
                          联系网格员
                        </Button>
                        <Button size="small">
                          上报工单
                        </Button>
                      </Space>
                    )}
                    {anomaly.resolved_note && (
                      <p style={{ margin: 0, color: '#52c41a', fontSize: 12 }}>
                        处理结果：{anomaly.resolved_note}
                      </p>
                    )}
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <SafetyOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <p>暂无异常预警记录</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UsageStatistics;
