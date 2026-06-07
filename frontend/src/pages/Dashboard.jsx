import { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Statistic, Tag, message } from 'antd';
import {
  UserOutlined,
  FileTextOutlined,
  FormOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../api';
import dayjs from 'dayjs';

const defaultWorkOrders = [
  { id: 1, title: '省级事项材料共享异常', category: '业务协同', status: '待分拨', deadline: dayjs().subtract(20, 'minute').toISOString() },
  { id: 2, title: '医保报销支付回执核验', category: '支付网关', status: '处理中', deadline: dayjs().subtract(1, 'hour').toISOString() },
  { id: 3, title: '闽政通登录失败反馈', category: '统一认证', status: '已回复', deadline: dayjs().subtract(2, 'hour').toISOString() },
  { id: 4, title: '高频事项访问超时预警', category: '监测分析', status: '已超时', deadline: dayjs().subtract(4, 'hour').toISOString() },
];

export default function Dashboard() {
  const [stats, setStats] = useState({ visits: 0, services: 0, filings: 0, rate: 0 });
  const [topServices, setTopServices] = useState([]);
  const [visitTrend, setVisitTrend] = useState([]);
  const [approvalList, setApprovalList] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sRes, topRes, trendRes, apprRes, orderRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/top-services'),
        api.get('/dashboard/visit-trend'),
        api.get('/dashboard/approval-list'),
        api.get('/dashboard/work-orders'),
      ]);
      if (sRes.success) setStats(sRes.data);
      if (topRes.success) setTopServices(topRes.data);
      if (trendRes.success) setVisitTrend(trendRes.data);
      if (apprRes.success) setApprovalList(apprRes.data);
      if (orderRes.success) {
        setWorkOrders(Array.isArray(orderRes.data) && orderRes.data.length > 0 ? orderRes.data : defaultWorkOrders);
      } else {
        setWorkOrders(defaultWorkOrders);
      }
    } catch (err) {
      setWorkOrders(defaultWorkOrders);
      message.error('加载工作台数据失败');
    } finally {
      setLoading(false);
    }
  };

  const topChartOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: topServices.map(d => d.name.length > 6 ? d.name.substring(0, 6) + '...' : d.name),
      axisLabel: { rotate: 0, fontSize: 11, interval: 0 },
    },
    yAxis: { type: 'value', name: '访问量' },
    series: [{
      name: '访问量',
      type: 'bar',
      data: topServices.map(d => d.count),
      itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
      barWidth: 20,
    }],
  };

  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: visitTrend.map(d => d.date) },
    yAxis: { type: 'value', name: '访问量' },
    series: [{
      name: '访问量',
      type: 'line',
      smooth: true,
      data: visitTrend.map(d => d.visits),
      itemStyle: { color: '#52c41a' },
      areaStyle: { color: 'rgba(82, 196, 26, 0.1)' },
    }],
  };

  const statCards = [
    { title: '今日访问量', value: stats.visits, icon: <UserOutlined style={{ color: '#1890ff' }} />, trend: 12.5, up: true, color: '#1890ff' },
    { title: '在线事项数', value: stats.services, icon: <FileTextOutlined style={{ color: '#52c41a' }} />, trend: 3.2, up: true, color: '#52c41a' },
    { title: '今日办件数', value: stats.filings, icon: <FormOutlined style={{ color: '#faad14' }} />, trend: 8.1, up: true, color: '#faad14' },
    { title: '一次办结率', value: `${stats.rate}%`, icon: <CheckCircleOutlined style={{ color: '#722ed1' }} />, trend: 1.8, up: true, color: '#722ed1' },
  ];

  const approvalColumns = [
    { title: '任务标题', dataIndex: 'title', key: 'title' },
    { title: '办理部门', dataIndex: 'department', key: 'department' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const colors = { '待审批': 'orange', '审批中': 'blue', '已通过': 'green', '已退回': 'red' };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'time',
      key: 'time',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const orderColumns = [
    { title: '工单标题', dataIndex: 'title', key: 'title' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => {
        const colors = { '待分拨': 'orange', '处理中': 'blue', '已回复': 'green', '已超时': 'red' };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#1a3a5c' }}>省级政务服务工作台</h2>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((card, idx) => (
          <Col span={6} key={idx}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <Statistic
                    title={card.title}
                    value={card.value}
                    valueStyle={{ color: card.color }}
                    prefix={card.icon}
                    suffix={
                      <span style={{ fontSize: 12 }}>
                        {card.up ? <ArrowUpOutlined style={{ color: '#52c41a' }} /> : <ArrowDownOutlined style={{ color: '#f5222d' }} />}
                        {card.trend}%
                      </span>
                    }
                  />
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="高频事项TOP10" size="small">
            <ReactECharts option={topChartOption} style={{ height: 300 }} notMerge lazyUpdate />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="近7天访问趋势" size="small">
            <ReactECharts option={trendOption} style={{ height: 300 }} notMerge lazyUpdate />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="最新审批任务" size="small">
            <Table
              rowKey="id"
              columns={approvalColumns}
              dataSource={approvalList}
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="待处理工单" size="small">
            <Table
              rowKey="id"
              columns={orderColumns}
              dataSource={workOrders}
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
