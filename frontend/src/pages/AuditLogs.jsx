import React, { useState, useEffect } from 'react';
import { Table, Select, Space, Tag, Button, message, DatePicker } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { canExport, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function AuditLogs() {
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
      const response = await api.get('/audit', { params });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/audit/export', { params: filters });
      const { data, filename } = response.data;
      
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const auditTypeNames = {
    login: '登录',
    logout: '登出',
    permission_check: '权限检查',
    config_change: '配置变更',
    task_execute: '任务执行',
    data_access: '数据访问',
    exception: '异常处理',
    export: '导出'
  };

  const columns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm:ss')
    },
    { title: '类型', dataIndex: 'audit_type', key: 'audit_type', width: 120,
      render: (v) => <Tag>{auditTypeNames[v] || v}</Tag>
    },
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
    { title: '资源类型', dataIndex: 'resource_type', key: 'resource_type', width: 120 },
    { title: '资源名称', dataIndex: 'resource_name', key: 'resource_name' },
    { title: '权限结果', dataIndex: 'permission_granted', key: 'permission_granted', width: 100,
      render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? '通过' : '拒绝'}</Tag>
    },
    { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', width: 100,
      render: (v) => <Tag color={{ low: 'green', medium: 'orange', high: 'red' }[v]}>{v}</Tag>
    },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 130 }
  ];

  return (
    <div>
      <div className="table-toolbar">
        <h1 className="page-title">审计日志</h1>
        {canExport(userRole, 'audit') && (
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
        )}
      </div>

      <div className="table-filters" style={{ marginBottom: 16 }}>
        <Select 
          placeholder="日志类型" 
          style={{ width: 150 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, audit_type: v }))}
        >
          {Object.entries(auditTypeNames).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v}</Select.Option>
          ))}
        </Select>
        <Select 
          placeholder="权限结果" 
          style={{ width: 120 }} 
          allowClear
          onChange={(v) => setFilters(f => ({ ...f, permission_granted: v }))}
        >
          <Select.Option value="true">通过</Select.Option>
          <Select.Option value="false">拒绝</Select.Option>
        </Select>
        <DatePicker placeholder="开始日期" onChange={(d) => setFilters(f => ({ ...f, start_date: d?.format('YYYY-MM-DD') }))} />
        <DatePicker placeholder="结束日期" onChange={(d) => setFilters(f => ({ ...f, end_date: d?.format('YYYY-MM-DD') }))} />
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
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

export default AuditLogs;
