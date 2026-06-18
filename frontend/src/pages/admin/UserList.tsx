import React, { useState, useEffect } from 'react';
import { Table, Select, Tag, Card, Typography, Space, App, Avatar, Button } from 'antd';
import {
  UserOutlined,
  FilterOutlined,
  PhoneOutlined,
  MailOutlined,
  ShopOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import { roleNames, UserRole } from '../../store/auth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface UserItem {
  id: string;
  username: string;
  real_name: string;
  role: UserRole;
  phone: string;
  email: string;
  store_id?: string;
  store_name?: string;
  status: 'active' | 'inactive';
  created_at: string;
  avatar?: string;
}

const roleColors: Record<UserRole, string> = {
  admin: 'red',
  owner: 'blue',
  designer: 'purple',
  supervisor: 'cyan',
  supplier: 'orange',
  store_manager: 'magenta',
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchUsers(roleFilter, statusFilter);
  }, [roleFilter, statusFilter]);

  const fetchUsers = async (role?: string, status?: string) => {
    setLoading(true);
    try {
      const params: any = {};
      if (role) params.role = role;
      if (status) params.status = status;
      const response = await apiClient.get('/admin/users', { params });
      setUsers(response.data || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '用户信息',
      key: 'user_info',
      width: 200,
      fixed: 'left' as const,
      render: (_: any, record: UserItem) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} src={record.avatar}>
            {record.real_name?.charAt(0)}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: 14 }}>{record.real_name}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>@{record.username}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole) => (
        <Tag color={roleColors[role]} style={{ padding: '4px 12px', borderRadius: 4, fontSize: 13 }}>
          {roleNames[role]}
        </Tag>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string) => (
        <Space>
          <PhoneOutlined style={{ color: '#1890ff' }} />
          <span>{phone}</span>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => (
        <Space>
          <MailOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{email}</span>
        </Space>
      ),
    },
    {
      title: '所属门店',
      dataIndex: 'store_name',
      key: 'store_name',
      width: 160,
      render: (name: string) => (
        <Space>
          {name ? (
            <>
              <ShopOutlined style={{ color: '#722ed1' }} />
              <span>{name}</span>
            </>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'} style={{ padding: '4px 12px', borderRadius: 4 }}>
          {status === 'active' ? '正常' : '停用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: UserItem) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          详情
        </Button>
      ),
    },
  ];

  const roleOptions: { value: UserRole; label: string; color: string }[] = [
    { value: 'admin', label: '系统管理员', color: 'red' },
    { value: 'owner', label: '业主', color: 'blue' },
    { value: 'designer', label: '设计师', color: 'purple' },
    { value: 'supervisor', label: '施工监理', color: 'cyan' },
    { value: 'supplier', label: '材料供应商', color: 'orange' },
    { value: 'store_manager', label: '门店经理', color: 'magenta' },
  ];

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    byRole: roleOptions.map((r) => ({
      ...r,
      count: users.filter((u) => u.role === r.value).length,
    })),
  };

  return (
    <div>
      <Card
        style={{ marginBottom: 16, borderRadius: 12 }}
        bodyStyle={{ padding: '16px 24px' }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
              <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              用户管理
            </Title>
            <Text type="secondary">
              管理平台所有用户账户，支持按角色和状态筛选
            </Text>
          </div>
          <Space wrap>
            <Space>
              <FilterOutlined style={{ color: '#666' }} />
              <span style={{ color: '#666' }}>角色：</span>
              <Select
                placeholder="全部角色"
                style={{ width: 140 }}
                allowClear
                value={roleFilter}
                onChange={setRoleFilter}
              >
                {roleOptions.map((r) => (
                  <Option key={r.value} value={r.value}>
                    <Tag color={r.color}>{r.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Space>
            <Space>
              <span style={{ color: '#666' }}>状态：</span>
              <Select
                placeholder="全部状态"
                style={{ width: 120 }}
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="active">正常</Option>
                <Option value="inactive">停用</Option>
              </Select>
            </Space>
          </Space>
        </Space>
      </Card>

      <Space wrap style={{ marginBottom: 16, width: '100%' }} size={[12, 12]}>
        <Card
          style={{
            borderRadius: 8,
            border: 'none',
            background: '#e6f7ff',
            minWidth: 120,
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>总用户数</Text>
            <Text strong style={{ fontSize: 22, color: '#1890ff' }}>{stats.total}</Text>
          </Space>
        </Card>
        <Card
          style={{
            borderRadius: 8,
            border: 'none',
            background: '#f6ffed',
            minWidth: 120,
          }}
          bodyStyle={{ padding: '12px 16px' }}
        >
          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>正常用户</Text>
            <Text strong style={{ fontSize: 22, color: '#52c41a' }}>{stats.active}</Text>
          </Space>
        </Card>
        {stats.byRole.map((r) => (
          <Card
            key={r.value}
            style={{
              borderRadius: 8,
              border: 'none',
              minWidth: 120,
            }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Space direction="vertical" size={2}>
              <Space size={4}>
                <Tag color={r.color} style={{ margin: 0 }}>{r.label}</Tag>
              </Space>
              <Text strong style={{ fontSize: 22 }}>{r.count}</Text>
            </Space>
          </Card>
        ))}
      </Space>

      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            showQuickJumper: true,
          }}
          onRow={(record) => ({
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
};

export default UserList;
