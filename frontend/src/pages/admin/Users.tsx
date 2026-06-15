import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Select, Avatar, Input, Space, Button } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';
import api from '../../api';

const { Option } = Select;

function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [role, setRole] = useState<string | undefined>();

  useEffect(() => {
    fetchUsers();
  }, [page, role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (role) params.role = role;
      const data: any = await api.get('/admin/users/list', { params });
      setUsers(data.users);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role: string) => {
    const roleMap: Record<string, { text: string; color: string }> = {
      employer: { text: '雇主', color: 'blue' },
      worker: { text: '工人', color: 'green' },
      driver: { text: '司机', color: 'orange' },
      admin: { text: '管理员', color: 'purple' },
    };
    return roleMap[role] || { text: role, color: 'default' };
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 90) return '#52c41a';
    if (score >= 70) return '#fa8c16';
    return '#f5222d';
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_: any, record: any) => (
        <Space>
          <Avatar src={record.avatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.real_name || record.username}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>@{record.username}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const info = getRoleText(role);
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '未填写',
    },
    {
      title: '信用分',
      dataIndex: 'credit_score',
      key: 'credit_score',
      render: (score: number) => (
        <span style={{ color: getCreditScoreColor(score), fontWeight: 500 }}>
          {score}
        </span>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance: number) => <span>¥{balance}</span>,
    },
    {
      title: '所在城市',
      dataIndex: 'city',
      key: 'city',
      render: (city: string) => city || '未填写',
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 16 }}>👥 用户管理</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large" wrap>
          <Select
            placeholder="用户角色"
            style={{ width: 150 }}
            allowClear
            value={role}
            onChange={setRole}
          >
            <Option value="employer">雇主</Option>
            <Option value="worker">工人</Option>
            <Option value="driver">司机</Option>
            <Option value="admin">管理员</Option>
          </Select>
          <Input
            placeholder="搜索用户"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            onPressEnter={fetchUsers}
          />
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}

export default AdminUsers;
