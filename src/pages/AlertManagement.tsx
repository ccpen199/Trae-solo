import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, message, Card, Row, Col, Statistic, Select, Space, Modal, Form, Input } from 'antd';
import { CheckCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { alertsAPI } from '../services/api';

interface Alert {
  id: number;
  type: string;
  message: string;
  level: string;
  status: string;
  related_type?: string;
  related_id?: number;
  created_at: string;
  resolved_at?: string;
}

const AlertManagement: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: undefined as string | undefined,
    status: undefined as string | undefined
  });

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await alertsAPI.getAll(filters);
      setAlerts(response.data.alerts);
    } catch (error) {
      message.error('加载预警失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await alertsAPI.resolve(id);
      message.success('预警已解决');
      loadAlerts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const levelIcons: Record<string, React.ReactNode> = {
    error: <WarningOutlined style={{ color: '#f5222d' }} />,
    warning: <WarningOutlined style={{ color: '#faad14' }} />,
    info: <InfoCircleOutlined style={{ color: '#1890ff' }} />
  };

  const levelColors: Record<string, string> = {
    error: 'red',
    warning: 'orange',
    info: 'blue'
  };

  const typeLabels: Record<string, string> = {
    inventory: '库存',
    shipping: '物流',
    order: '订单',
    system: '系统'
  };

  const columns: ColumnsType<Alert> = [
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => (
        <Space>{levelIcons[level]} <Tag color={levelColors[level]}>{level.toUpperCase()}</Tag></Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeLabels[type] || type
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '待处理' },
          processing: { color: 'processing', text: '处理中' },
          resolved: { color: 'success', text: '已解决' }
        };
        const { color, text } = statusMap[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.status !== 'resolved' && (
          <Button
            type="link"
            icon={<CheckCircleOutlined />}
            onClick={() => handleResolve(record.id)}
          >
            解决
          </Button>
        )
      )
    }
  ];

  const stats = {
    total: alerts.length,
    pending: alerts.filter(a => a.status === 'pending').length,
    processing: alerts.filter(a => a.status === 'processing').length,
    resolved: alerts.filter(a => a.status === 'resolved').length
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>预警中心</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card><Statistic title="总预警" value={stats.total} /></Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card><Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card><Statistic title="处理中" value={stats.processing} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card><Statistic title="已解决" value={stats.resolved} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="预警级别"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, level: value })}
              value={filters.level}
            >
              <Select.Option value="error">错误</Select.Option>
              <Select.Option value="warning">警告</Select.Option>
              <Select.Option value="info">信息</Select.Option>
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => setFilters({ ...filters, status: value })}
              value={filters.status}
            >
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
            </Select>
          </Space>
          <Button onClick={loadAlerts}>刷新</Button>
        </div>

        <Table
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AlertManagement;