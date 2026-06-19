import { Card, Row, Col, Statistic, Typography, Progress, Space, Badge, List, Avatar, Tag, Table, Button } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  BellOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useState } from 'react';

const { Title, Text } = Typography;

export default function Monitor() {
  const deviceOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'horizontal', bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '40%'],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 10, name: '在线', itemStyle: { color: '#10B981' } },
        { value: 2, name: '离线', itemStyle: { color: '#94A3B8' } },
      ],
    }],
  };

  const heartbeatOption: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      smooth: true,
      data: [12, 12, 11, 12, 12, 10, 12],
      itemStyle: { color: '#10B981' },
      areaStyle: { opacity: 0.1 },
    }],
  };

  const columns: any[] = [
    { title: '设备名称', dataIndex: 'name', width: 140 },
    { title: '设备类型', dataIndex: 'type', width: 100 },
    { title: '位置', dataIndex: 'location', width: 140 },
    { title: 'MAC地址', dataIndex: 'mac', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Badge status={v === 'online' ? 'success' : 'error'} text={v === 'online' ? '在线' : '离线'} />
      ),
    },
    { title: '最后心跳', dataIndex: 'lastHeartbeat', width: 170 },
    {
      title: '今日通行',
      dataIndex: 'todayAccess',
      width: 100,
      render: (v: number) => <Tag color="blue">{v}次</Tag>,
    },
    {
      title: '操作',
      width: 120,
      render: () => <Button type="link" size="small">远程重启</Button>,
    },
  ];

  const deviceData = Array.from({ length: 12 }, (_, i) => ({
    key: i,
    name: ['东门门禁', '西门门禁', '南门门禁', '北门门禁', '1号楼单元门'][i % 5],
    type: ['蓝牙', 'NFC', '二维码', '人脸识别'][i % 4],
    location: ['东门入口', '西门入口', '南门入口', '1号楼', '2号楼'][i % 5],
    mac: `AC:DE:48:${String(i).padStart(2, '0')}:${String(i + 10).padStart(2, '0')}:${String(i + 20).padStart(2, '0')}`,
    status: i === 3 || i === 7 ? 'offline' : 'online',
    lastHeartbeat: i === 3 ? '2026-06-18 10:30:00' : `2026-06-19 15:${String(30 + i).padStart(2, '0')}:00`,
    todayAccess: Math.floor(Math.random() * 200) + 20,
  }));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>设备监控</Title>
        <Text type="secondary">实时监控门禁设备运行状态</Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="设备总数"
              value={12}
              suffix="台"
              valueStyle={{ color: '#3B82F6' }}
              prefix={<ThunderboltOutlined />}
            />
            <Progress percent={83.3} showInfo={false} strokeColor="#10B981" style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="在线设备"
              value={10}
              suffix="台"
              valueStyle={{ color: '#10B981' }}
              prefix={<CheckCircleOutlined />}
            />
            <Progress percent={100} showInfo={false} strokeColor="#10B981" style={{ marginTop: 12 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="离线设备"
              value={2}
              suffix="台"
              valueStyle={{ color: '#EF4444' }}
              prefix={<CloseCircleOutlined />}
            />
            <Progress percent={16.7} showInfo={false} strokeColor="#EF4444" style={{ marginTop: 12 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={8}>
          <Card title="设备在线状态" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={deviceOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="设备心跳统计（24小时）" size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <ReactECharts option={heartbeatOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card
        title="设备详情列表"
        size="small"
        style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
      >
        <Table
          columns={columns}
          dataSource={deviceData}
          pagination={{ defaultPageSize: 10 }}
          size="small"
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
