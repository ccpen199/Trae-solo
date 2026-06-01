import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Typography, Card, Tag, Select } from 'antd';
import { PlusOutlined, EditOutlined, KeyOutlined } from '@ant-design/icons';
import { userAPI } from '../services/api';

const { Title } = Typography;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.users);
    } catch (error) {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingUser(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleChangePassword = (id) => {
    setSelectedUserId(id);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingUser) {
        await userAPI.update(editingUser.id, values);
        message.success('更新成功');
      } else {
        await userAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      if (error.errorFields) return;
      message.error(editingUser ? '更新失败' : '创建失败');
    }
  };

  const handleSubmitPassword = async () => {
    try {
      const values = await passwordForm.validateFields();
      await userAPI.updatePassword(selectedUserId, values.password);
      message.success('密码修改成功');
      setPasswordModalVisible(false);
    } catch (error) {
      if (error.errorFields) return;
      message.error('密码修改失败');
    }
  };

  const roleLabels = {
    manager: '管理员',
    lawyer: '律师',
    assistant: '助理',
    client: '客户',
  };

  const roleColors = {
    manager: 'red',
    lawyer: 'blue',
    assistant: 'green',
    client: 'orange',
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleChangePassword(record.id)}>
            密码
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>用户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建用户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true }, { min: 6 }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select placeholder="请选择角色">
              <Select.Option value="manager">管理员</Select.Option>
              <Select.Option value="lawyer">律师</Select.Option>
              <Select.Option value="assistant">助理</Select.Option>
              <Select.Option value="client">客户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onOk={handleSubmitPassword}
        onCancel={() => setPasswordModalVisible(false)}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item name="password" label="新密码" rules={[{ required: true }, { min: 6 }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
