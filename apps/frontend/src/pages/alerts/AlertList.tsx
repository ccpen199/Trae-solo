import React, { useState, useEffect } from 'react';
import {
  Table, Card, Input, Select, Button, Space, Tag, Modal,
  App, Badge, Tooltip, Statistic, Row, Col, Empty,
} from 'antd';
import {
  SearchOutlined, FilterOutlined, WarningOutlined,
  CheckCircleOutlined, StopOutlined, BellOutlined,
  ReloadOutlined, ClockCircleOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { monitoringAPI, deviceAPI } from '../../services/api';

const { Search } = Input;
const { Option } = Select;

const AlertListPage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [severityFilter, setSeverityFilter] = useState<string>();
  const [typeFilter, setTypeFilter] = useState<string>();
  const [stats, setStats] = useState<any>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    loadAlerts();
    loadStats();
  }, [page, pageSize, keyword, statusFilter, severityFilter, typeFilter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize, status: statusFilter };
      if (keyword) params.keyword = keyword;
      if (severityFilter) params.severity = severityFilter;
      if (typeFilter) params.type = typeFilter;
      const result: any = await monitoringAPI.getAlerts(params);
      setAlerts(result.items || []);
      setTotal(result.total || 0);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const s: any = await monitoringAPI.getAlertStats();
      setStats(s || {});
    } catch {}
  };

  const handleAcknowledge = async (record: any) => {
    try {
      await monitoringAPI.acknowledgeAlert(record.id);
      message.success('已标记为已读');
      loadAlerts();
      loadStats();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleResolve = async (record: any) => {
    modal.confirm({
      title: '确认已解决？',
      onOk: async () => {
        try {
          await monitoringAPI.resolveAlert(record.id);
          message.success('已标记为已解决');
          loadAlerts();
          loadStats();
        } catch (err: any) {
          message.error(err.message || '操作失败');
        }
      },
    });
  };

  const handleIgnore = async (record: any) => {
    try {
      await monitoringAPI.ignoreAlert(record.id);
      message.success('已忽略');
      loadAlerts();
      loadStats();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleBulkResolve = async () => {
    if (selectedRowKeys.length === 0) return;
    modal.confirm({
      title: `确认批量解决 ${selectedRowKeys.length} 条告警？`,
      onOk: async () => {
        try {
          await monitoringAPI.bulkResolve(selectedRowKeys);
          message.success('批量处理成功');
          setSelectedRowKeys([]);
          loadAlerts();
          loadStats();
        } catch (err: any) {
          message.error(err.message || '操作失败');
        }
      },
    });
  };

  const severityConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    critical: { color: '#ff4d4f', label: '严重', icon: <ThunderboltOutlined /> },
    error: { color: '#ff4d4f', label: '错误', icon: <WarningOutlined /> },
    warning: { color: '#faad14', label: '警告', icon: <WarningOutlined /> },
    info: { color: '#1677ff', label: '信息', icon: <BellOutlined /> },
  };

  const statusConfig: Record<string, { color: string; label: string }> = {
    open: { color: 'red', label: '未处理' },
    acknowledged: { color: 'gold', label: '已读' },
    resolved: { color: 'green', label: '已解决' },
    ignored: { color: 'default', label: '已忽略' },
  };

  const columns = [
    {
      title: '级别',
      dataIndex: 'severity',
      width: 100,
      render: (s: string) => {
        const cfg = severityConfig[s] || severityConfig.info;
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: '标题',
      dataIndex: 'title',
      render: (t: string, record: any) => (
        <div>
          <div style={{ fontWeight: record.status === 'open' ? 500 : 400 }}>{t}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{record.message}</div>
        </div>
      ),
    },
    {
      title: '关联设备',
      dataIndex: 'deviceName',
      width: 160,
      render: (name: string, record: any) => (
        <Space>
          <Badge status={record.deviceStatus === 'online' ? 'success' : 'default'} />
          {name || record.deviceId || '-'}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: string) => {
        const cfg = statusConfig[s] || statusConfig.open;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'triggeredAt',
      width: 170,
      render: (t: string) => t ? new Date(t).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: any) => (
        <Space size="small">
          {record.status === 'open' && (
            <Button type="link" size="small" onClick={() => handleAcknowledge(record)}>
              标记已读
            </Button>
          )}
          {record.status !== 'resolved' && (
            <Button type="link" size="small" onClick={() => handleResolve(record)}>
              解决
            </Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleIgnore(record)}>
            忽略
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="待处理"
              value={stats.open || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="今日总数"
              value={stats.today || 0}
              prefix={<BellOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="低电量告警"
              value={stats.lowBattery || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="已解决"
              value={stats.resolved || 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="告警列表"
        extra={
          <Space>
            <Search
              placeholder="搜索标题/消息"
              allowClear
              style={{ width: 200 }}
              onSearch={(v) => { setKeyword(v); setPage(1); }}
            />
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 100 }}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <Option value="open">未处理</Option>
              <Option value="acknowledged">已读</Option>
              <Option value="resolved">已解决</Option>
              <Option value="ignored">已忽略</Option>
            </Select>
            <Select
              placeholder="级别"
              allowClear
              style={{ width: 100 }}
              value={severityFilter}
              onChange={(v) => { setSeverityFilter(v); setPage(1); }}
            >
              <Option value="critical">严重</Option>
              <Option value="error">错误</Option>
              <Option value="warning">警告</Option>
              <Option value="info">信息</Option>
            </Select>
            <Select
              placeholder="类型"
              allowClear
              style={{ width: 120 }}
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v); setPage(1); }}
            >
              <Option value="device_offline">设备离线</Option>
              <Option value="low_battery">低电量</Option>
              <Option value="high_power">功耗异常</Option>
              <Option value="temperature_alarm">温度告警</Option>
              <Option value="ota_failed">OTA失败</Option>
              <Option value="tamper">防拆告警</Option>
            </Select>
            {selectedRowKeys.length > 0 && (
              <Button type="primary" onClick={handleBulkResolve}>
                批量解决 ({selectedRowKeys.length})
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadAlerts}>刷新</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={alerts}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条告警`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{
            emptyText: <Empty description="暂无告警" />,
          }}
        />
      </Card>
    </div>
  );
};

export default AlertListPage;
