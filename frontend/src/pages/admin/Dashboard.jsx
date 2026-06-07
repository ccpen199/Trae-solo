import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, message, Space, Statistic, Table, Progress } from 'antd';
import { UserOutlined, FileTextOutlined, DollarOutlined, WarningOutlined, ArrowUpOutlined, ToolOutlined, EyeOutlined } from '@ant-design/icons';
import { adminAPI } from '../../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, ordersRes, revenueRes] = await Promise.all([
        adminAPI.getDashboardOverview(),
        adminAPI.getRecentWorkOrders(),
        adminAPI.getRevenueStatistics(),
      ]);
      setOverview(overviewRes.data);
      setRecentOrders(ordersRes.data || []);
      setRevenueData(revenueRes.data || []);
    } catch (err) {
      message.error('加载看板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const statusPieData = [
    { name: '待处理', value: overview?.work_orders?.pending || 0, color: '#faad14' },
    { name: '处理中', value: overview?.work_orders?.in_progress || 0, color: '#1890ff' },
    { name: '已完成', value: overview?.work_orders?.completed || 0, color: '#52c41a' },
    { name: '已取消', value: overview?.work_orders?.cancelled || 0, color: '#d9d9d9' },
  ];

  const orderColumns = [
    {
      title: '工单号',
      dataIndex: 'order_no',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
    },
    {
      title: '用户',
      dataIndex: 'user_name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v) => {
        const map = { install: '报装', repair: '报修', maintain: '维护', inspection: '安检' };
        return <Tag color="blue">{map[v] || v}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => {
        const statusMap = {
          pending: { color: 'warning', text: '待处理' },
          assigned: { color: 'processing', text: '已派单' },
          in_progress: { color: 'blue', text: '处理中' },
          completed: { color: 'success', text: '已完成' },
          cancelled: { color: 'default', text: '已取消' },
        };
        const info = statusMap[v] || { color: 'default', text: v };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: 'SLA',
      dataIndex: 'sla_status',
      render: (v, record) => {
        if (v === 'breached') {
          return <Tag color="red">已超时</Tag>;
        }
        if (v === 'warning') {
          return <Tag color="orange">即将超时</Tag>;
        }
        return <Tag color="green">正常</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  if (!overview) return null;

  const statCards = [
    {
      title: '总用户数',
      value: overview.users?.total || 0,
      suffix: '人',
      icon: <UserOutlined />,
      color: '#1890ff',
      trend: overview.users?.growth || 0,
    },
    {
      title: '今日工单',
      value: overview.work_orders?.today || 0,
      suffix: '单',
      icon: <FileTextOutlined />,
      color: '#722ed1',
      trend: overview.work_orders?.growth || 0,
    },
    {
      title: '本月营收',
      value: overview.revenue?.month || 0,
      prefix: '¥',
      icon: <DollarOutlined />,
      color: '#52c41a',
      trend: overview.revenue?.growth || 0,
    },
    {
      title: '异常预警',
      value: overview.anomalies?.active || 0,
      suffix: '条',
      icon: <WarningOutlined />,
      color: '#faad14',
      trend: overview.anomalies?.growth || 0,
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>运营看板</h2>
        <p style={{ margin: '8px 0 0 0', color: '#666' }}>
          实时监控业务数据，助力运营决策
        </p>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statCards.map((stat, idx) => (
          <Col span={6} key={idx}>
            <Card className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#666' }}>{stat.title}</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 28, color: stat.color, fontWeight: 'bold' }}>
                    {stat.prefix}{stat.value}{stat.suffix}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: stat.trend >= 0 ? '#52c41a' : '#f5222d', fontSize: 12 }}>
                    {stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend)}% 较上月
                  </p>
                </div>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card title="工单状态分布" bordered={false}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="营收趋势（近6个月）" bordered={false}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`¥${value}`, '营收']} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="billing"
                  name="燃气缴费"
                  stroke="#1890ff"
                  fill="#1890ff30"
                />
                <Area
                  type="monotone"
                  dataKey="mall"
                  name="商城营收"
                  stroke="#52c41a"
                  fill="#52c41a30"
                />
                <Area
                  type="monotone"
                  dataKey="service"
                  name="服务收入"
                  stroke="#faad14"
                  fill="#faad1430"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="SLA时效监控" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>24小时内完成率</span>
                  <span style={{ color: '#52c41a' }}>{overview.sla?.within_24h || 0}%</span>
                </div>
                <Progress percent={overview.sla?.within_24h || 0} strokeColor="#52c41a" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>48小时内完成率</span>
                  <span style={{ color: '#1890ff' }}>{overview.sla?.within_48h || 0}%</span>
                </div>
                <Progress percent={overview.sla?.within_48h || 0} strokeColor="#1890ff" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>超时工单</span>
                  <span style={{ color: '#f5222d' }}>{overview.sla?.breached || 0} 单</span>
                </div>
                <Progress percent={((overview.sla?.breached || 0) / (overview.work_orders?.total || 1) * 100)} strokeColor="#f5222d" showInfo={false} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>平均处理时长</span>
                  <span>{overview.sla?.avg_duration || 0} 小时</span>
                </div>
                <Progress percent={Math.min(100, (overview.sla?.avg_duration || 0) / 24 * 100)} strokeColor="#722ed1" showInfo={false} />
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="用气趋势（近7天）" bordered={false}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={overview.usage_trend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} m³`, '用量']} />
                <Bar dataKey="usage" fill="#1890ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card
        title="最新工单"
        bordered={false}
        extra={<Button type="link" size="small">查看全部</Button>}
      >
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          loading={loading}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
