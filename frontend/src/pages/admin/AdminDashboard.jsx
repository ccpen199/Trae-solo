import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Row, Space, Spin, Statistic, Table, Tag, Typography, message } from 'antd';
import {
  AuditOutlined,
  ControlOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title, Text } = Typography;

const moduleColor = {
  credit: 'green',
  payment: 'blue',
  business: 'orange',
  finance: 'purple',
  coordinator: 'geekblue',
  analytics: 'cyan',
};

const moduleName = {
  credit: '信用画像',
  payment: '生活缴费',
  business: '本地商圈',
  finance: '金融产品',
  coordinator: '协理员',
  system: '系统',
};

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/admin/dashboard');
        setDashboard(res.data || {});
      } catch (e) {
        message.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const stats = dashboard?.stats || {};
  const modules = dashboard?.modules || [];
  const latestLogs = dashboard?.latestLogs || [];

  const systemRows = useMemo(() => ([
    { key: 'api', name: '后端 API', status: '运行中', owner: 'Express / SQLite', scope: '127.0.0.1' },
    { key: 'db', name: '业务数据库', status: '已连接', owner: 'SQLite WAL', scope: '本项目 data/app.sqlite' },
    { key: 'audit', name: '审计日志', status: '可查询', owner: 'system_logs', scope: '全模块操作留痕' },
    { key: 'rbac', name: '后台权限', status: '已启用', owner: '管理员角色', scope: '审批、配置、审计' },
  ]), []);

  const moduleColumns = [
    { title: '后台模块', dataIndex: 'name', width: 160, render: (name, row) => <Tag color={moduleColor[row.key] || 'default'}>{name}</Tag> },
    { title: '访问路径', dataIndex: 'path', width: 180 },
    { title: '管理职责', render: (_, row) => {
      const dutyMap = {
        credit: '信用档案、评分画像、授信资料核验',
        payment: '生活缴费项目、订单流水、代扣状态',
        business: '商户准入、优惠券、消费分期',
        finance: '产品工厂、贷款审批、抵押登记',
        coordinator: '协理员任务、离线采集、同步状态',
        analytics: '经营分析、风险预警、操作日志',
      };
      return dutyMap[row.key] || '平台运营管理';
    } },
    { title: '操作', width: 110, render: (_, row) => <Button size="small" onClick={() => navigate(row.path)}>进入</Button> },
  ];

  const logColumns = [
    { title: '时间', dataIndex: 'created_at', width: 170 },
    { title: '模块', dataIndex: 'module', width: 120, render: v => <Tag>{moduleName[v] || v}</Tag> },
    { title: '操作', dataIndex: 'action', width: 150 },
    { title: '操作人', dataIndex: 'operator', width: 120 },
    { title: '详情', dataIndex: 'detail' },
  ];

  const systemColumns = [
    { title: '检查项', dataIndex: 'name', width: 140 },
    { title: '状态', dataIndex: 'status', width: 110, render: v => <Tag color="green">{v}</Tag> },
    { title: '组件', dataIndex: 'owner', width: 160 },
    { title: '范围', dataIndex: 'scope' },
  ];

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>后台管理工作台</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic title="待审商户" value={stats.merchantPending || 0} prefix={<AuditOutlined />} suffix="家" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic title="待批贷款" value={stats.loanPending || 0} prefix={<SafetyCertificateOutlined />} suffix="笔" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic title="已准入商户" value={stats.merchantApproved || 0} prefix={<ControlOutlined />} suffix="家" valueStyle={{ color: '#1B5E20' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable>
            <Statistic title="待办协理任务" value={stats.taskPending || 0} prefix={<SettingOutlined />} suffix="项" valueStyle={{ color: '#0958d9' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <Card title="后台快捷操作" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<AuditOutlined />} onClick={() => navigate('/business/merchants')}>商户入驻审核</Button>
              <Button block icon={<SafetyCertificateOutlined />} onClick={() => navigate('/finance/loans')}>贷款审批管理</Button>
              <Button block icon={<FileSearchOutlined />} onClick={() => navigate('/analytics/logs')}>查看系统日志</Button>
              <Button block icon={<DatabaseOutlined />} onClick={() => navigate('/analytics/vitality')}>运营数据分析</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="系统运行状态" size="small">
            <Table rowKey="key" columns={systemColumns} dataSource={systemRows} pagination={false} size="small" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card
            title="管理模块总览"
            size="small"
            extra={<Text type="secondary">信用档案 {stats.profileCount || 0} 份，已批贷款 {stats.loanApproved || 0} 笔，优惠券核销 {stats.couponUsed || 0} 次</Text>}
          >
            <Table rowKey="key" columns={moduleColumns} dataSource={modules} pagination={false} scroll={{ x: 760 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="后台审计日志" size="small">
            <Table rowKey="id" columns={logColumns} dataSource={latestLogs} pagination={false} scroll={{ x: 820 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
