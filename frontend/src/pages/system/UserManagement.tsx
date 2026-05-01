import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { userApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import dayjs from 'dayjs';

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);

  const roles = [
    { value: 'ADMIN', label: '系统管理员', color: 'red' },
    { value: 'CHIEF_EDITOR', label: '主编', color: 'purple' },
    { value: 'EDITOR', label: '编辑', color: 'blue' },
    { value: 'CHANNEL_OPERATOR', label: '渠道运营', color: 'orange' },
    { value: 'DATA_ANALYST', label: '数据分析师', color: 'green' },
  ];

  useEffect(() => {
    fetchUsers();
  }, [pagination.current, pagination.pageSize]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize,
      };

      const response: any = await userApi.getList(params);
      setData(response.data?.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data?.total || 0,
      }));
    } catch (error) {
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: 'EDITOR', isActive: true });
    setShowModal(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      displayName: record.displayName,
      phone: record.phone,
      department: record.department,
      role: record.role,
      isActive: record.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id);
      message.success('删除成功');
      fetchUsers();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, values);
        message.success('更新成功');
      } else {
        await userApi.create({
          ...values,
          password: values.password || 'Default@123',
        });
        message.success('创建成功');
      }
      setShowModal(false);
      fetchUsers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const getRoleText = (role: string) => {
    const r = roles.find((r) => r.value === role);
    return r?.label || role;
  };

  const getRoleColor = (role: string) => {
    const r = roles.find((r) => r.value === role);
    return r?.color || 'default';
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '显示名称',
      dataIndex: 'displayName',
      key: 'displayName',
      width: 120,
      render: (name: string) => name || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => <Tag color={getRoleColor(role)}>{getRoleText(role)}</Tag>,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (dept: string) => dept || '-',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>{active ? '正常' : '禁用'}</Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 180,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          {record.id !== user?.id && (
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const stats = [
    {
      title: '总用户数',
      value: pagination.total,
      icon: <TeamOutlined style={{ color: '#1890ff' }} />,
    },
    {
      title: '管理员',
      value: data.filter((d) => d.role === 'ADMIN').length,
      icon: <UserOutlined style={{ color: '#ff4d4f' }} />,
    },
    {
      title: '主编',
      value: data.filter((d) => d.role === 'CHIEF_EDITOR').length,
      icon: <UserOutlined style={{ color: '#722ed1' }} />,
    },
    {
      title: '编辑',
      value: data.filter((d) => d.role === 'EDITOR').length,
      icon: <UserOutlined style={{ color: '#1890ff' }} />,
    },
  ];

  return (
    <div>
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div>
          <h2>用户管理</h2>
          <p style={{ color: 'rgba(0,0,0,0.45)' }}>管理系统用户和权限</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增用户
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card size="small">
              <Statistic title={stat.title} value={stat.value} prefix={stat.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
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
            onChange: (page, pageSize) =>
              setPagination({ ...pagination, current: page, pageSize }),
          }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={showModal}
        onCancel={() => setShowModal(false)}
        width={600}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[
                { required: true, message: '请输入初始密码' },
                { min: 8, message: '密码至少8个字符' },
              ]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item name="displayName" label="显示名称">
            <Input placeholder="请输入显示名称" />
          </Form.Item>

          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item name="department" label="所属部门">
            <Input placeholder="请输入所属部门" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              {roles.map((r) => (
                <Select.Option key={r.value} value={r.value}>
                  <Tag color={r.color}>{r.label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setShowModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
