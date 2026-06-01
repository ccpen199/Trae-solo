import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { apiCallsAPI } from '../api';

const AlertList: React.FC = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiCallsAPI.getAlerts();
      setAlerts(res.data);
    } catch (error) {
      message.error('加载告警数据失败');
    }
    setLoading(false);
  };

  const handleAlert = async (id: number) => {
    try {
      await apiCallsAPI.handleAlert(id, { handled_by: '管理员' });
      message.success('告警已处理');
      loadAlerts();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const typeLabels: Record<string, string> = {
    unauthorized_access: '未授权访问',
    authorization_expired: '授权过期',
    api_failure: '接口调用失败'
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' };
    return colors[severity] || 'default';
  };

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = { high: '高', medium: '中', low: '低' };
    return labels[severity] || severity;
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '告警类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeLabels[type] || type
    },
    { title: '数据目录', dataIndex: 'catalog_title', key: 'catalog_title' },
    { title: '调用部门', dataIndex: 'caller_department_name', key: 'caller_department_name' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (s: string) => <Tag color={getSeverityColor(s)}>{getSeverityLabel(s)}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'open' ? 'red' : 'green'}>
          {status === 'open' ? '待处理' : '已处理'}
        </Tag>
      )
    },
    { title: '处理人', dataIndex: 'handled_by', key: 'handled_by', render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        record.status === 'open' && (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleAlert(record.id)}>
            处理
          </Button>
        )
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>安全告警中心</h2>
      </div>

      <Table
        columns={columns}
        dataSource={alerts}
        rowKey="id"
        loading={loading}
      />
    </div>
  );
};

export default AlertList;
