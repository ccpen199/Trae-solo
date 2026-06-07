import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, message } from 'antd';
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  UserOutlined,
  BulbOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getDashboardStats, getDevices, getOrders } from '../api';

function Dashboard() {
  const [stats, setStats] = useState({});
  const [devices, setDevices] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsRes = await getDashboardStats();
      const devicesRes = await getDevices();
      const ordersRes = await getOrders();
      setStats(statsRes.data);
      setDevices(devicesRes.data.slice(0, 5));
      setRecentOrders(ordersRes.data.slice(0, 5));
    } catch (error) {
      console.error('Dashboard load error:', error);
      message.error('数据加载失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const deviceTypeChart = {
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: devices.filter(d => d.type === 'tv').length, name: '电视' },
        { value: devices.filter(d => d.type === 'ac').length, name: '空调' },
        { value: devices.filter(d => d.type === 'fridge').length, name: '冰箱' },
        { value: devices.filter(d => d.type === 'washer').length, name: '洗衣机' }
      ]
    }]
  };

  const deviceColumns = [
    { title: '设备名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t) => {
      const types = { tv: '电视', ac: '空调', fridge: '冰箱', washer: '洗衣机' };
      return types[t] || t;
    }},
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => (
      <Tag color={s === 'online' ? 'success' : 'error'}>
        {s === 'online' ? '在线' : '离线'}
      </Tag>
    )},
    { title: '能耗(W)', dataIndex: 'energy_consumption', key: 'energy' }
  ];

  const orderColumns = [
    { title: '工单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s) => {
      const statusMap = { pending: '待处理', in_progress: '处理中', completed: '已完成' };
      const colorMap = { pending: 'orange', in_progress: 'blue', completed: 'green' };
      return <Tag color={colorMap[s]}>{statusMap[s]}</Tag>;
    }}
  ];

  return (
    <div>
      <Row gutter={16}>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="设备总数"
              value={stats.totalDevices || 0}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="在线设备"
              value={stats.onlineDevices || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="场景模板"
              value={stats.totalScenes || 0}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="待处理工单"
              value={stats.pendingOrders || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="总能耗(W)"
              value={stats.totalEnergy || 0}
              prefix={<BulbOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="用户数"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card title="设备类型分布" loading={loading}>
            <ReactECharts option={deviceTypeChart} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={16}>
          <Card title="设备列表" loading={loading}>
            <Table
              columns={deviceColumns}
              dataSource={devices}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="最近工单" loading={loading}>
            <Table
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
