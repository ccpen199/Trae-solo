import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, Select, message, Space, Drawer, Descriptions, Avatar } from 'antd';
import { SearchOutlined, UserOutlined, PlusOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { adminAPI, authAPI } from '../../api';
import dayjs from 'dayjs';

const { Option } = Select;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [filters, setFilters] = useState({ role: 'all', keyword: '' });
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    loadUsers();
    loadOrganizations();
  }, [filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAllUsers(filters);
      setUsers(res.data || []);
    } catch (err) {
      message.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizations = async () => {
    try {
      const res = await adminAPI.getOrganizations();
      setOrganizations(res.data || []);
    } catch (err) {
      message.error('加载组织架构失败');
    }
  };

  const handleCreate = async (values) => {
    try {
      await authAPI.register(values);
      message.success('创建用户成功');
      setCreateVisible(false);
      createForm.resetFields();
      loadUsers();
    } catch (err) {
      message.error(err.response?.data?.error || '创建失败');
    }
  };

  const handleEdit = async (values) => {
    try {
      await adminAPI.updateUser(currentUser.id, values);
      message.success('更新用户成功');
      setEditVisible(false);
      form.resetFields();
      loadUsers();
    } catch (err) {
      message.error(err.response?.data?.error || '更新失败');
    }
  };

  const handleResetPassword = (id) => {
    Modal.confirm({
      title: '确认重置密码',
      content: '确定要将该用户的密码重置为默认密码 123456 吗？',
      onOk: async () => {
        try {
          await adminAPI.resetUserPassword(id);
          message.success('密码已重置为 123456');
        } catch (err) {
          message.error('重置失败');
        }
      },
    });
  };

  const handleToggleStatus = (id, status) => {
    Modal.confirm({
      title: status === 'active' ? '确认禁用用户' : '确认启用用户',
      content: status === 'active' ? '禁用后该用户将无法登录系统' : '启用后该用户可以正常登录',
      onOk: async () => {
        try {
          await adminAPI.toggleUserStatus(id, status === 'active' ? 'inactive' : 'active');
          message.success('操作成功');
          loadUsers();
        } catch (err) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await adminAPI.getUserDetail(id);
      setCurrentUser(res.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('获取用户详情失败');
    }
  };

  const getRoleTag = (role) => {
    const roleMap = {
      admin: { color: 'red', text: '系统管理员' },
      operator: { color: 'blue', text: '运营人员' },
      grid_worker: { color: 'green', text: '网格员' },
      user: { color: 'default', text: '普通用户' },
    };
    const info = roleMap[role] || { color: 'default', text: role };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: '用户编号',
      dataIndex: 'user_no',
      render: (v) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
      width: 120,
    },
    {
      title: '用户名',
      dataIndex: 'username',
    },
    {
      title: '真实姓名',
      dataIndex: 'real_name',
    },
    {
      title: '手机号码',
      dataIndex: 'phone',
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (v) => getRoleTag(v),
      width: 100,
    },
    {
      title: '所属组织',
      dataIndex: 'organization_name',
      render: (v) => v || '-',
    },
    {
      title: '实名状态',
      dataIndex: 'verified',
      render: (v) => v ? <Tag color="green">已实名</Tag> : <Tag color="default">未实名</Tag>,
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v) => v === 'active' ? <Tag color="success">正常</Tag> : <Tag color="default">禁用</Tag>,
      width: 80,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setCurrentUser(record);
              form.setFieldsValue({
                real_name: record.real_name,
                phone: record.phone,
                email: record.email,
                role: record.role,
                organization_id: record.organization_id,
                status: record.status,
              });
              setEditVisible(true);
            }}
          >
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleResetPassword(record.id)}>
            重置密码
          </Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'active'}
            onClick={() => handleToggleStatus(record.id, record.status)}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>用户管理</h2>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>
              管理系统所有用户，支持创建、编辑、禁用等操作
            </p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateVisible(true)}>
            新增用户
          </Button>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              value={filters.role}
              onChange={(v) => setFilters({ ...filters, role: v })}
            >
              <Option value="all">全部角色</Option>
              <Option value="user">普通用户</Option>
              <Option value="grid_worker">网格员</Option>
              <Option value="operator">运营人员</Option>
              <Option value="admin">系统管理员</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Input.Search
              placeholder="搜索用户名、姓名、手机号"
              allowClear
              onSearch={(v) => setFilters({ ...filters, keyword: v })}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={loadUsers}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Card bordered={false}>
        <Table
          columns={columns}
          dataSource={users}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      <Drawer
        title="用户详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar size={80} icon={<UserOutlined />} src={currentUser.avatar} />
              <h3 style={{ margin: '16px 0 8px 0' }}>
                {currentUser.real_name || currentUser.username}
              </h3>
              <Space>
                {getRoleTag(currentUser.role)}
                {currentUser.verified && <Tag color="green">已实名</Tag>}
              </Space>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="用户编号">{currentUser.user_no}</Descriptions.Item>
              <Descriptions.Item label="用户名">{currentUser.username}</Descriptions.Item>
              <Descriptions.Item label="真实姓名">{currentUser.real_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="身份证号">
                {currentUser.id_card ? `${currentUser.id_card.substring(0, 6)}********${currentUser.id_card.substring(14)}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="手机号码">{currentUser.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="电子邮箱">{currentUser.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系地址">{currentUser.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="所属组织">{currentUser.organization_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="注册时间">{dayjs(currentUser.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            </Descriptions>

            {currentUser.meters && currentUser.meters.length > 0 && (
              <Card title="绑定气表" size="small" style={{ marginTop: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {currentUser.meters.map(meter => (
                    <Card key={meter.id} size="small">
                      <Row align="middle">
                        <Col span={12}>
                          <p style={{ margin: 0 }}>
                            <span style={{ color: '#666' }}>表号：</span>
                            <span style={{ fontFamily: 'monospace' }}>{meter.meter_no}</span>
                          </p>
                          <p style={{ margin: '4px 0 0 0' }}>
                            <span style={{ color: '#666' }}>地址：</span>
                            {meter.install_address}
                          </p>
                        </Col>
                        <Col span={6}>
                          <p style={{ margin: 0 }}>
                            当前读数：<strong>{meter.current_reading} m³</strong>
                          </p>
                        </Col>
                        <Col span={6} style={{ textAlign: 'right' }}>
                          <Tag color={meter.status === 'active' ? 'success' : 'default'}>
                            {meter.status === 'active' ? '正常' : '停用'}
                          </Tag>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </Card>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        title="新增用户"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码长度不少于6位' },
                ]}
              >
                <Input.Password placeholder="请输入密码（默认123456）" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="real_name"
                label="真实姓名"
                rules={[{ required: true, message: '请输入真实姓名' }]}
              >
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号码"
                rules={[
                  { required: true, message: '请输入手机号码' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                ]}
              >
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="用户角色"
                rules={[{ required: true, message: '请选择用户角色' }]}
              >
                <Select placeholder="请选择用户角色">
                  <Option value="user">普通用户</Option>
                  <Option value="grid_worker">网格员</Option>
                  <Option value="operator">运营人员</Option>
                  <Option value="admin">系统管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="organization_id"
                label="所属组织"
              >
                <Select placeholder="请选择所属组织">
                  {organizations.map(org => (
                    <Option key={org.id} value={org.id}>{org.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ float: 'right' }}>
              <Button onClick={() => setCreateVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
        width={600}
      >
        {currentUser && (
          <Form form={form} layout="vertical" onFinish={handleEdit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="real_name"
                  label="真实姓名"
                  rules={[{ required: true, message: '请输入真实姓名' }]}
                >
                  <Input placeholder="请输入真实姓名" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="手机号码"
                  rules={[
                    { required: true, message: '请输入手机号码' },
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码' },
                  ]}
                >
                  <Input placeholder="请输入手机号码" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="email"
              label="电子邮箱"
              rules={[{ type: 'email', message: '请输入正确的邮箱' }]}
            >
              <Input placeholder="请输入电子邮箱" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="role"
                  label="用户角色"
                  rules={[{ required: true, message: '请选择用户角色' }]}
                >
                  <Select placeholder="请选择用户角色">
                    <Option value="user">普通用户</Option>
                    <Option value="grid_worker">网格员</Option>
                    <Option value="operator">运营人员</Option>
                    <Option value="admin">系统管理员</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="organization_id"
                  label="所属组织"
                >
                  <Select placeholder="请选择所属组织">
                    {organizations.map(org => (
                      <Option key={org.id} value={org.id}>{org.name}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="status"
              label="用户状态"
              rules={[{ required: true, message: '请选择用户状态' }]}
            >
              <Select placeholder="请选择用户状态">
                <Option value="active">正常</Option>
                <Option value="inactive">禁用</Option>
              </Select>
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ float: 'right' }}>
                <Button onClick={() => setEditVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit">保存</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
