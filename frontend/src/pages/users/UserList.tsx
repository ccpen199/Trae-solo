import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Input, Select, Switch, message, Popconfirm } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { userApi } from '../../services/api';
import { User, RoleMap } from '../../types';

const { Option } = Select;

const UserList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({ role: '', keyword: '' });

  useEffect(() => {
    loadUsers();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('加载用户失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, checked: boolean) => {
    try {
      await userApi.updateStatus(id, checked ? 1 : 0);
      message.success('状态更新成功');
      loadUsers();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email', render: (v?: string) => v || '-' },
    { title: '角色', dataIndex: 'role', key: 'role', render: (r: string) => <Tag color="blue">{RoleMap[r] || r}</Tag> },
    { title: '身份证号', dataIndex: 'id_card', key: 'id_card', render: (v?: string) => v || '-' },
    { title: '驾照号', dataIndex: 'license_number', key: 'license_number', render: (v?: string) => v || '-' },
    { title: '驾照审核', dataIndex: 'license_verified', key: 'license_verified', render: (v: number) => v === 1 ? <Tag color="success">已通过</Tag> : <Tag color="warning">未审核</Tag> },
    {
      title: '状态', dataIndex: 'status', key: 'status',
      render: (status: number, record: User) => (
        <Switch
          checked={status === 1}
          onChange={(checked) => handleStatusChange(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => v.slice(0, 10) }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">用户管理</h2>
        <Space>
          <Input
            placeholder="搜索用户名/姓名/手机号"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select
            placeholder="角色"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, role: value })}
          >
            {Object.entries(RoleMap).map(([key, val]) => (
              <Option key={key} value={key}>{val}</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{
          ...pagination,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize })
        }}
      />
    </div>
  );
};

export default UserList;
