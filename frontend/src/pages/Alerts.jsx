import React, { useState, useEffect } from 'react';
import { Table, Select, Space, Tag, Button, message } from 'antd';
import { CheckOutlined, SolutionOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { hasPermission, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function Alerts() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.current, pageSize: pagination.pageSize, ...filters };
      const response = await api.get('/alerts', { params });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (record) => {
    try {
      await api.post(`/alerts/${record.id}/acknowledge`);
      message.success('已确认');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleResolve = async (record) => {
    try {
      await api.post(`/alerts/${record.id}/resolve`, { resolution_note: '已处理' });
      message.success('已解决');
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const alertTypeNames = {
    task_failed: '任务失败',
    task_timeout: '任务超时',
    backup_missed: '备份遗漏',
    storage_full: '存储已满',
    permission_violation: '权限违规',
    security_risk: '安全风险'
  };

  const severityColor = {
    info: 'blue',
    warning: 'orange',
    error: 'red',
    critical: 'red'
  };

  const columns = [
    { title: '告警编号', dataIndex: 'alert_no', key: 'alert_no', width: 160 },
    { title: '类型', dataIndex: 'alert_type', key: 'alert_type', width: 120,
      render: (v) => <Tag>{alertTypeNames[v] || v}</Tag>
    },
    { title: '级别', dataIndex: 'severity', key: 'severity', width: 100,
      render: (v) => <Tag color={severityColor[v]}>{v.toUpperCase()}</Tag>
    },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120,
      render: (v) => {
        const colors = { active: 'red', acknowledged: 'orange', resolved: 'green', closed: 'default' };
        const names = { active: '待处理', acknowledged: '已确认', resolved: '已解决', closed: '已关闭' };
        return <Tag color={colors[v]}>{names[v]}</Tag>;
      }
    },
    { title: '关联任务', dataIndex: 'task_no', key: 'task_no', width: 120 },
    { title: '确认人', dataIndex: 'acknowledger_name', key: 'acknowledger_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status === 'active' && hasPermission(userRole, 'alert', 'acknowledge') && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleAcknowledge(record)}>
              确认
            </Button>
          )}
          {['active', 'acknowledged'].includes(record.status) && hasPermission(userRole, 'alert', 'resolve') && (
            <Button type="link" size="small" icon={<SolutionOutlined />} onClick={() => handleResolve(record)}>
              解决
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <h1 className="page-title">告警中心</h1>

      <div className="table-filters" style={{ marginBottom: 16 }}>
        <Select 
          placeholder="告警类型" 
          style={{ width: 150 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, alert_type: v }))}
        >
          {Object.entries(alertTypeNames).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v}</Select.Option>
          ))}
        </Select>
        <Select 
          placeholder="严重级别" 
          style={{ width: 120 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, severity: v }))}
        >
          <Select.Option value="info">INFO</Select.Option>
          <Select.Option value="warning">WARNING</Select.Option>
          <Select.Option value="error">ERROR</Select.Option>
          <Select.Option value="critical">CRITICAL</Select.Option>
        </Select>
        <Select 
          placeholder="状态" 
          style={{ width: 120 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, status: v }))}
        >
          <Select.Option value="active">待处理</Select.Option>
          <Select.Option value="acknowledged">已确认</Select.Option>
          <Select.Option value="resolved">已解决</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
        }}
      />
    </div>
  );
}

export default Alerts;
