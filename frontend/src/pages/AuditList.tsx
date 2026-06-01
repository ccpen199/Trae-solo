import React, { useEffect, useState } from 'react';
import { Table, Button, message, Space, DatePicker, Select, Card } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import { auditAPI, departmentsAPI } from '../api';

const { RangePicker } = DatePicker;
const { Option } = Select;

const AuditList: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    action: '',
    department_id: ''
  });

  useEffect(() => {
    loadData();
    loadDepartments();
  }, []);

  const loadData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await auditAPI.getAll({ page, pageSize: 20, ...filters });
      setLogs((res.data as any).data);
      setTotal((res.data as any).total);
    } catch (error) {
      message.error('加载审计日志失败');
    }
    setLoading(false);
  };

  const loadDepartments = async () => {
    try {
      const res = await departmentsAPI.getAll();
      setDepartments(res.data);
    } catch (error) {
      console.error('加载部门失败', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(filters)
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'audit_logs.csv';
        if (disposition) {
          const match = disposition.match(/filename="([^"]+)"/);
          if (match) filename = match[1];
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        message.success(`审计日志已导出并下载`);
        loadData();
      } else {
        message.error('导出失败');
      }
    } catch (error) {
      message.error('导出失败');
    }
  };

  const actionLabels: Record<string, string> = {
    create_application: '创建申请',
    approve_application: '审批通过',
    reject_application: '审批拒绝',
    export_audit: '导出审计日志'
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => actionLabels[action] || action
    },
    { title: '操作人', dataIndex: 'operator', key: 'operator', render: (v: string) => v || '系统' },
    { title: '部门', dataIndex: 'department_name', key: 'department_name', render: (v: string) => v || '-' },
    { title: '目标类型', dataIndex: 'target_type', key: 'target_type', render: (v: string) => v || '-' },
    { title: '目标ID', dataIndex: 'target_id', key: 'target_id', render: (v: number) => v || '-' },
    { title: '详情', dataIndex: 'details', key: 'details', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', render: (v: string) => v || '-' },
    { title: '操作时间', dataIndex: 'created_at', key: 'created_at' }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>审计日志</h2>
        <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
          导出日志
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters(f => ({
                  ...f,
                  start_date: dates[0].format('YYYY-MM-DD'),
                  end_date: dates[1].format('YYYY-MM-DD')
                }));
              } else {
                setFilters(f => ({ ...f, start_date: '', end_date: '' }));
              }
            }}
          />
          <Select
            style={{ width: 150 }}
            placeholder="操作类型"
            allowClear
            onChange={(value) => setFilters(f => ({ ...f, action: value || '' }))}
          >
            <Option value="create_application">创建申请</Option>
            <Option value="approve_application">审批通过</Option>
            <Option value="reject_application">审批拒绝</Option>
            <Option value="export_audit">导出审计日志</Option>
          </Select>
          <Select
            style={{ width: 150 }}
            placeholder="部门"
            allowClear
            onChange={(value) => setFilters(f => ({ ...f, department_id: value || '' }))}
          >
            {departments.map(d => (
              <Option key={d.id} value={d.id}>{d.name}</Option>
            ))}
          </Select>
          <Button onClick={() => loadData()}>查询</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={logs}
        rowKey="id"
        loading={loading}
        pagination={{
          total,
          pageSize: 20,
          onChange: (page) => loadData(page)
        }}
      />
    </div>
  );
};

export default AuditList;
