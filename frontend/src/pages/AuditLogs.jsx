import React, { useEffect, useState } from 'react';
import { Card, Table, Input, Select, message } from 'antd';
import api from '../utils/api';

const { Search } = Input;
const { Option } = Select;

export default function AuditLogs() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');

  useEffect(() => {
    loadLogs();
  }, [pagination.page, module, action]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, pageSize: pagination.pageSize };
      if (module) params.module = module;
      if (action) params.action = action;
      
      const response = await api.get('/admin/audit-logs', { params });
      setData(response.data.logs);
      setPagination(prev => ({ ...prev, total: response.data.pagination.total }));
    } catch (error) {
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    { title: '用户', dataIndex: 'username', key: 'username' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '模块', dataIndex: 'module', key: 'module' },
    { title: '操作', dataIndex: 'action', key: 'action' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>审计日志</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <Select
            style={{ width: 150 }}
            placeholder="选择模块"
            value={module}
            onChange={(v) => { setModule(v); setPagination(p => ({ ...p, page: 1 })); }}
            allowClear
          >
            <Option value="认证">认证</Option>
            <Option value="账户管理">账户管理</Option>
            <Option value="提取业务">提取业务</Option>
            <Option value="管理后台">管理后台</Option>
            <Option value="风险监测">风险监测</Option>
          </Select>
          <Search
            placeholder="搜索操作"
            style={{ width: 200 }}
            allowClear
            onSearch={(v) => { setAction(v); setPagination(p => ({ ...p, page: 1 })); }}
          />
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => setPagination(p => ({ ...p, page }))
          }}
        />
      </Card>
    </div>
  );
}
