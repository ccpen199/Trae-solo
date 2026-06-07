import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Badge, Row, Col, Statistic, Alert, Timeline } from 'antd';
import { SwapOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';

const gatewayLogs = [
  { id: 1, from: '公安厅', to: '人社厅', api: '身份核验', status: 'success', time: '2分钟前', latency: '120ms' },
  { id: 2, from: '医保局', to: '卫健委', api: '就诊记录查询', status: 'success', time: '5分钟前', latency: '85ms' },
  { id: 3, from: '住建厅', to: '自然资源厅', api: '不动产查询', status: 'success', time: '8分钟前', latency: '200ms' },
  { id: 4, from: '税务局', to: '市场监管', api: '企业信息核验', status: 'success', time: '12分钟前', latency: '150ms' },
  { id: 5, from: '教育厅', to: '公安厅', api: '学历核验', status: 'failed', time: '15分钟前', latency: '超时' },
  { id: 6, from: '民政厅', to: '公安厅', api: '婚姻状态核验', status: 'success', time: '20分钟前', latency: '95ms' },
  { id: 7, from: '人社厅', to: '医保局', api: '参保状态同步', status: 'success', time: '25分钟前', latency: '110ms' },
  { id: 8, from: '交通厅', to: '公安厅', api: '驾驶证核验', status: 'success', time: '30分钟前', latency: '88ms' },
];

const departments = [
  { name: '公安厅', apis: 12, status: 'online' },
  { name: '人社厅', apis: 8, status: 'online' },
  { name: '医保局', apis: 6, status: 'online' },
  { name: '教育局', apis: 5, status: 'online' },
  { name: '民政厅', apis: 4, status: 'online' },
  { name: '税务局', apis: 7, status: 'online' },
  { name: '住建厅', apis: 5, status: 'online' },
  { name: '交通厅', apis: 4, status: 'online' },
  { name: '市场监管', apis: 6, status: 'online' },
  { name: '卫健委', apis: 5, status: 'online' },
  { name: '自然资源厅', apis: 3, status: 'online' },
  { name: '司法厅', apis: 4, status: 'degraded' },
];

function AdminGateway() {
  const columns = [
    { title: '调用方', dataIndex: 'from', key: 'from', render: (d) => <Tag color="blue">{d}</Tag> },
    { title: '提供方', dataIndex: 'to', key: 'to', render: (d) => <Tag color="green">{d}</Tag> },
    { title: '接口', dataIndex: 'api', key: 'api' },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={s === 'success' ? 'success' : 'error'}>{s === 'success' ? '成功' : '失败'}</Tag>
    },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { title: '延迟', dataIndex: 'latency', key: 'latency', render: (l) => <span style={{ color: l === '超时' ? '#ff4d4f' : '#52c41a' }}>{l}</span> },
  ];

  return (
    <div>
      <Alert
        message="跨部门服务调用网关"
        description="统一管理各部门之间的服务调用关系，监控调用状态、延迟和成功率，确保跨部门数据共享安全可控。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={6}>
          <Card>
            <Statistic title="接入部门" value={departments.length} suffix="个" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic title="开放接口" value={departments.reduce((s, d) => s + d.apis, 0)} suffix="个" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic title="今日调用" value={1286} suffix="次" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card>
            <Statistic title="成功率" value={99.2} suffix="%" valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      <Card title={<Space><SwapOutlined />部门接入状态</Space>} style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]}>
          {departments.map((dept, idx) => (
            <Col xs={8} sm={6} md={4} key={idx}>
              <Card size="small">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>{dept.name}</span>
                  <Badge status={dept.status === 'online' ? 'success' : 'warning'} />
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  开放接口：{dept.apis}个 · {dept.status === 'online' ? '正常' : '降级'}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="调用日志">
        <Table
          columns={columns}
          dataSource={gatewayLogs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  );
}

export default AdminGateway;
