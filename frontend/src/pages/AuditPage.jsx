import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, message, Card, Alert } from 'antd';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

const { Title } = Typography;

const AuditPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { hasRole } = useAuth();

  const isAllowed = hasRole('platform_engineer', 'security_admin');

  useEffect(() => {
    if (isAllowed) {
      fetchAuditLogs();
    }
  }, [isAllowed]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/logs/audit');
      setAuditLogs(response.data.auditLogs);
    } catch (error) {
      message.error('获取审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const expandedRowRender = (record) => {
    return (
      <div style={{ padding: '0 24px' }}>
        {record.old_value && (
          <Card title="变更前" size="small" style={{ marginBottom: 8 }}>
            <pre style={{ margin: 0, maxHeight: 100, overflow: 'auto' }}>{record.old_value}</pre>
          </Card>
        )}
        {record.new_value && (
          <Card title="变更后" size="small">
            <pre style={{ margin: 0, maxHeight: 100, overflow: 'auto' }}>{record.new_value}</pre>
          </Card>
        )}
      </div>
    );
  };

  const columns = [
    {
      title: '审计ID',
      dataIndex: 'audit_id',
      key: 'audit_id',
      width: 180
    },
    {
      title: '用户',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 100,
      render: (name, record) => name || record.username || '系统'
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 200
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 120
    },
    {
      title: '资源ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'allowed' ? 'green' : 'red'}>{status}</Tag>
      )
    },
    {
      title: '拒绝原因',
      dataIndex: 'denial_reason',
      key: 'denial_reason',
      render: (reason) => reason || '-'
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }
  ];

  if (!isAllowed) {
    return (
      <Alert
        type="error"
        showIcon
        message="权限不足"
        description="只有平台工程师和安全管理员可以访问权限审计页面。"
      />
    );
  }

  return (
    <div>
      <Title level={3}>权限审计</Title>
      <Table
        columns={columns}
        dataSource={auditLogs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1400 }}
        expandedRowRender={expandedRowRender}
        rowExpandable={(record) => !!(record.old_value || record.new_value)}
      />
    </div>
  );
};

export default AuditPage;
