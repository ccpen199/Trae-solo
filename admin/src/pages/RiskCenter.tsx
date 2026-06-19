import React, { useEffect, useState } from 'react';
import { Table, Tag, Card, Row, Col, Statistic, Tabs, Select } from 'antd';
import { getRiskEvents, getRiskStats } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#f5222d', '#faad14', '#fa541c', '#eb2f96', '#722ed1', '#1677ff', '#13c2c2'];

const eventTypes = [
  { value: 'multi_account', label: '多账号设备' },
  { value: 'rapid_task_completion', label: '快速任务完成' },
  { value: 'abnormal_step_count', label: '异常步数' },
  { value: 'frequent_withdrawal', label: '频繁提现' },
  { value: 'ip_anomaly', label: 'IP异常' },
];

const RiskCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [eventType, setEventType] = useState<string>('all');
  const [list, setList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const type = eventType === 'all' ? undefined : eventType;
      const data: any = await getRiskEvents(page, pageSize, type);
      setList(data.list || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await getRiskStats();
      setStats(s);
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
    loadStats();
  }, [page, pageSize, eventType]);

  const levelColor: Record<string, string> = {
  low: 'green',
  medium: 'orange',
  high: 'red',
};

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户ID', dataIndex: 'user_id', render: (v: number) => v || '-' },
    { title: '设备ID', dataIndex: 'device_id', ellipsis: true, render: (v: string) => v || '-' },
    { title: 'IP', dataIndex: 'ip', render: (v: string) => v || '-' },
    {
      title: '事件类型',
      dataIndex: 'event_type',
      render: (v: string) => {
        const found = eventTypes.find(e => e.value === v);
        return <Tag color="blue">{found?.label || v}</Tag>;
      },
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      render: (v: string) => <Tag color={levelColor[v] || 'default'}>{v}</Tag>,
    },
    { title: '详情', dataIndex: 'details' },
    {
      title: '是否处理',
      dataIndex: 'is_handled',
      render: (v: number) => v ? <Tag color="green">已处理</Tag> : <Tag color="orange">未处理</Tag>,
    },
    { title: '时间', dataIndex: 'created_at', width: 160 },
  ];

  const pieData = (stats.eventTypes || []).map((e: any) => ({ name: eventTypes.find(t => t.value === e.event_type)?.label || e.event_type, value: e.count }));

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>⚠️ 风控中心</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="今日风险事件" value={stats.todayEvents || 0} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="高风险用户" value={stats.highRiskUsers || 0} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="封禁用户" value={stats.blockedUsers || 0} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="📊 近7日风险事件分布" size="small">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={(e) => `${e.name}: ${e.value}`}
                >
                  {pieData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🔍 筛选" size="small">
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>事件类型</div>
              <Select
                style={{ width: '100%' }}
                value={eventType}
                onChange={setEventType}
                options={[{ value: 'all', label: '全部' }, ...eventTypes]}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={list}
        pagination={{ current: page, pageSize, total, onChange: setPage, onShowSizeChange: (_, s) => setPageSize(s) }}
      />
    </div>
  );
};

export default RiskCenter;
