import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Progress,
  Space, Button, App, Tooltip, Empty,
} from 'antd';
import {
  DatabaseOutlined, CheckCircleOutlined, WarningOutlined,
  ThunderboltOutlined, UserOutlined, EyeOutlined,
  ReloadOutlined, RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { monitoringAPI, vendorAPI, deviceAPI, analyticsAPI } from '../../services/api';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>({});
  const [vendorStats, setVendorStats] = useState<any>({});
  const [deviceStats, setDeviceStats] = useState<any>({});
  const [topVendors, setTopVendors] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ad, vs, ds] = await Promise.all([
        monitoringAPI.getAdminDashboard().catch(() => ({})),
        vendorAPI.getStats().catch(() => ({})),
        deviceAPI.getStats().catch(() => ({})),
      ]);
      setAdminData(ad || {
        totalUsers: 128650, activeUsers: 45280,
        totalDevices: 512300, dailyCommands: 1250000,
      });
      setVendorStats(vs || { total: 1286, active: 1198 });
      setDeviceStats(ds || { total: 0, online: 0, onlineRate: 94.5 });
      setTopVendors([
        { name: '涂鸦智能', devices: 86500, onlineRate: 94.5, growth: '+12%' },
        { name: '小米米家', devices: 45620, onlineRate: 96.2, growth: '+8%' },
        { name: '绿米Aqara', devices: 18900, onlineRate: 97.8, growth: '+15%' },
        { name: 'Philips Hue', devices: 12580, onlineRate: 98.5, growth: '+5%' },
        { name: '海尔智家', devices: 9800, onlineRate: 93.2, growth: '+22%' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const trafficOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['设备上行', '指令下行'] },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: Array.from({ length: 12 }, (_, i) => `${i * 2}:00`),
    },
    yAxis: { type: 'value', name: '万次' },
    series: [
      {
        name: '设备上行', type: 'line', smooth: true,
        areaStyle: { opacity: 0.2 },
        data: [5, 3, 2, 4, 8, 12, 15, 18, 22, 25, 18, 10],
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '指令下行', type: 'line', smooth: true,
        areaStyle: { opacity: 0.2 },
        data: [2, 1, 1, 2, 5, 10, 15, 20, 28, 32, 22, 8],
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  const vendorOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 86500, name: '涂鸦智能' },
        { value: 45620, name: '小米米家' },
        { value: 18900, name: '绿米Aqara' },
        { value: 12580, name: 'Philips Hue' },
        { value: 9800, name: '海尔智家' },
        { value: 35000, name: '其他' },
      ],
    }],
    legend: { bottom: 0, type: 'scroll' },
    color: ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2'],
  };

  const vendorColumns = [
    { title: '厂商', dataIndex: 'name' },
    { title: '设备数', dataIndex: 'devices', render: (n: number) => n.toLocaleString() },
    {
      title: '在线率',
      dataIndex: 'onlineRate',
      render: (r: number) => (
        <Space>
          <Progress percent={Math.round(r)} size="small" style={{ width: 80 }} showInfo={false} />
          <span>{r.toFixed(1)}%</span>
        </Space>
      ),
    },
    {
      title: '月增长',
      dataIndex: 'growth',
      render: (g: string) => <Tag color="green">{g}</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 500 }}>管理员控制台</span>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="用户总数"
              value={adminData.totalUsers || 0}
              prefix={<UserOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
            />
            <Tag color="green" style={{ marginTop: 8 }}>活跃: {(adminData.activeUsers || 0).toLocaleString()}</Tag>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="设备总数"
              value={adminData.totalDevices || 0}
              prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Space style={{ marginTop: 8 }}>
              <Tag color="green">在线: {Math.round((deviceStats.onlineRate || 0) * (adminData.totalDevices || 0) / 100).toLocaleString()}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="接入厂商"
              value={vendorStats.total || 0}
              prefix={<DatabaseOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Tag color="green" style={{ marginTop: 8 }}>活跃: {vendorStats.active || 0}</Tag>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={loading} size="small">
            <Statistic
              title="今日指令量"
              value={adminData.dailyCommands || 0}
              prefix={<EyeOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              formatter={(v) => `${Number(v).toLocaleString()}`}
            />
            <Tag color="blue" style={{ marginTop: 8 }}><RiseOutlined /> 较昨日 +8.5%</Tag>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={16}>
          <Card title="24小时指令流量" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={trafficOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="设备厂商分布" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={vendorOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={14}>
          <Card
            title="TOP 厂商"
            loading={loading}
            style={{ marginTop: 16 }}
            extra={<a onClick={() => navigate('/admin/vendors')}>全部厂商</a>}
          >
            <Table
              rowKey="name"
              size="small"
              columns={vendorColumns}
              dataSource={topVendors}
              pagination={false}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="快速入口" style={{ marginTop: 16 }} loading={loading}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Button block size="large" icon={<DatabaseOutlined />} onClick={() => navigate('/admin/vendors')}>
                厂商管理
              </Button>
              <Button block size="large" icon={<ThunderboltOutlined />} onClick={() => navigate('/devices')}>
                设备列表
              </Button>
              <Button block size="large" icon={<WarningOutlined />} onClick={() => navigate('/alerts')}>
                告警中心
              </Button>
              <Button block size="large" icon={<EyeOutlined />} onClick={() => navigate('/analytics')}>
                数据分析
              </Button>
              <Button block size="large" icon={<CheckCircleOutlined />} onClick={() => navigate('/ota')}>
                固件 OTA
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
