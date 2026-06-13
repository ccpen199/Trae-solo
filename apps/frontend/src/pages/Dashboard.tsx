import React, { useEffect, useState } from 'react';
import {
  Row, Col, Card, Statistic, Progress, Avatar, Tag, List, Empty, App,
} from 'antd';
import {
  BulbOutlined, CheckCircleOutlined, WarningOutlined,
  ThunderboltOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { monitoringAPI, deviceAPI, sceneAPI } from '../services/api';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [deviceStats, setDeviceStats] = useState<any>(null);
  const [scenes, setScenes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [d, s, sc, al] = await Promise.all([
        monitoringAPI.getDashboard(),
        deviceAPI.getStats(),
        sceneAPI.getList().catch(() => ({ items: [] })),
        monitoringAPI.getAlerts({ pageSize: 5, status: 'open' }).catch(() => ({ items: [] })),
      ]);
      setDashboard(d);
      setDeviceStats(s);
      setScenes((sc as any).items || []);
      setAlerts((al as any).items || []);
    } finally {
      setLoading(false);
    }
  };

  const onlineRateOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: dashboard?.weeklyTrend?.slice(-7)?.map((d: any) => {
        const date = new Date(d.bucket || Date.now());
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }) || [],
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.2 },
      itemStyle: { color: '#1677ff' },
      lineStyle: { color: '#1677ff', width: 3 },
      data: dashboard?.weeklyTrend?.map(() => {
        const devices = deviceStats?.total || 10;
        const online = deviceStats?.online || 7;
        return Math.round((online / devices) * 100);
      }) || [75, 80, 85, 90, 88, 92, 95],
    }],
  };

  const categoryOption = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: Object.entries(deviceStats?.byCategory || { light: 5, switch: 3, sensor: 4, ac: 2, other: 1 }).map(([name, value]) => ({ name, value })),
    }],
    legend: { bottom: 0, type: 'scroll' },
    color: ['#1677ff', '#52c41a', '#faad14', '#eb2f96', '#722ed1', '#13c2c2'],
  };

  const powerOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 45, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['0时', '4时', '8时', '12时', '16时', '20时', '24时'],
    },
    yAxis: { type: 'value', name: 'W' },
    series: [{
      type: 'bar',
      itemStyle: { color: '#faad14' },
      data: [50, 30, 120, 450, 380, 520, 280],
    }],
  };

  const severityColor: Record<string, string> = {
    critical: '#ff4d4f', error: '#ff4d4f', warning: '#faad14', info: '#1677ff',
  };

  return (
    <div style={{ padding: 0 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="设备总数"
              value={deviceStats?.total || 0}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
              <Tag color="green">在线: {deviceStats?.online || 0}</Tag>
              <Tag color="red">离线: {deviceStats?.offline || 0}</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="在线率"
              value={deviceStats?.onlineRate || 0}
              precision={1}
              suffix="%"
              prefix={
                (deviceStats?.onlineRate || 0) >= 90
                  ? <RiseOutlined style={{ color: '#52c41a' }} />
                  : <FallOutlined style={{ color: '#faad14' }} />
              }
              valueStyle={{ color: (deviceStats?.onlineRate || 0) >= 90 ? '#52c41a' : '#faad14' }}
            />
            <Progress
              percent={Math.round(deviceStats?.onlineRate || 0)}
              showInfo={false}
              size="small"
              strokeColor={(deviceStats?.onlineRate || 0) >= 90 ? '#52c41a' : '#faad14'}
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="今日功耗"
              value={dashboard?.todayPowerConsumption || 0}
              precision={2}
              suffix="kWh"
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 12 }}>
              <Tag>累计: {((dashboard?.todayPowerConsumption || 0) * 30).toFixed(1)} kWh/月</Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="待处理告警"
              value={dashboard?.openAlerts || alerts.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: dashboard?.openAlerts > 0 ? '#ff4d4f' : '#52c41a' }}
            />
            {dashboard?.lowBatteryCount > 0 && (
              <div style={{ marginTop: 8 }}>
                <Tag color="orange">低电量设备: {dashboard.lowBatteryCount}</Tag>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={16}>
          <Card title="设备在线率趋势" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={onlineRateOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="设备分类统计" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={categoryOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 0 }}>
        <Col xs={24} lg={12}>
          <Card
            title="常用智能场景"
            loading={loading}
            style={{ marginTop: 16 }}
            extra={<a onClick={() => navigate('/scenes')}>全部场景</a>}
          >
            {scenes.length ? (
              <List
                dataSource={scenes.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Tag key="st" color={item.status === 'enabled' ? 'green' : 'default'}>
                        {item.status === 'enabled' ? '已启用' : '已停用'}
                      </Tag>,
                      <a key="run" onClick={() => {
                        sceneAPI.execute(item.id);
                        App.useApp().message.success(`执行场景: ${item.name}`);
                      }}>执行</a>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<ThunderboltOutlined />} style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }} />}
                      title={item.name}
                      description={`执行 ${item.executionCount} 次${item.lastExecutedAt ? ` · 上次: ${new Date(item.lastExecutedAt).toLocaleDateString()}` : ''}`}
                    />
                  </List.Item>
                )}
              />
            ) : <Empty description="暂无场景" />}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="实时告警"
            loading={loading}
            style={{ marginTop: 16 }}
            extra={<a onClick={() => navigate('/alerts')}>告警中心</a>}
          >
            {alerts.length ? (
              <List
                dataSource={alerts}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<WarningOutlined />}
                          style={{ backgroundColor: severityColor[item.severity] + '22', color: severityColor[item.severity] }}
                        />
                      }
                      title={
                        <span>
                          <Tag color={severityColor[item.severity]} style={{ marginRight: 8 }}>
                            {item.type}
                          </Tag>
                          {item.title}
                        </span>
                      }
                      description={item.message}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 24 }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <div style={{ marginTop: 8, color: '#52c41a' }}>系统运行正常，暂无告警</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row style={{ marginTop: 0 }}>
        <Col span={24}>
          <Card title="今日用电分布" loading={loading} style={{ marginTop: 16 }}>
            <ReactECharts option={powerOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
