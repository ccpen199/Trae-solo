import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, Popconfirm, Card, Tag } from 'antd';
import { message } from '@/utils/message';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { userApi, organizationApi, roleApi, storeApi } from '@/services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const User: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resetPwdModalVisible, setResetPwdModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form] = Form.useForm();
  const [resetPwdForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, orgRes, storeRes, roleRes] = await Promise.all([
        userApi.getList(),
        organizationApi.getList(),
        storeApi.getList(),
        roleApi.getList(),
      ]);
      setList(Array.isArray(userRes) ? userRes : (userRes.data || []));
      setOrganizations(Array.isArray(orgRes) ? orgRes : (orgRes.data || []));
      setStores(Array.isArray(storeRes) ? storeRes : (storeRes.data || []));
      setRoles(Array.isArray(roleRes) ? roleRes : (roleRes.data || []));
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true, gender: 'unknown' });
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    const formData = {
      ...record,
      birthday: record.birthday ? dayjs(record.birthday) : null,
      roleIds: record.roles?.map((r: any) => r.id) || [],
    };
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await userApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleResetPwd = (id: string) => {
    setSelectedUserId(id);
    resetPwdForm.resetFields();
    setResetPwdModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (values.birthday) {
        values.birthday = values.birthday.format('YYYY-MM-DD');
      }
      if (editingItem) {
        await userApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await userApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleResetPwdSubmit = async () => {
    try {
      const values = await resetPwdForm.validateFields();
      await userApi.resetPassword(selectedUserId, values.newPassword);
      message.success('密码重置成功');
      setResetPwdModalVisible(false);
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const columns = [
    { title: '人员编号', dataIndex: 'code', key: 'code' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      render: (gender: string) => {
        const genderMap: Record<string, string> = {
          male: '男',
          female: '女',
          unknown: '未知',
        };
        return genderMap[gender] || '未知';
      },
    },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '所属组织',
      dataIndex: ['organization', 'name'],
      key: 'organizationName',
    },
    {
      title: '所属门店',
      dataIndex: ['store', 'name'],
      key: 'storeName',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: any[]) => (
        <Space wrap>
          {roles?.map((role) => (
            <Tag key={role.id}>{role.name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (enabled ? '启用' : '禁用'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" icon={<KeyOutlined />} onClick={() => handleResetPwd(record.id)}>
            重置密码
          </Button>
          <Popconfirm title="确定删除吗？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>人员管理</h2>
      </div>

      <Card>
        <div className="table-toolbar">
          <span>人员列表</span>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增人员
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={list}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑人员' : '新增人员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="人员编号"
            rules={[{ required: true, message: '请输入人员编号' }]}
          >
            <Input placeholder="请输入人员编号" />
          </Form.Item>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          {!editingItem && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select placeholder="请选择性别">
              <Option value="male">男</Option>
              <Option value="female">女</Option>
              <Option value="unknown">未知</Option>
            </Select>
          </Form.Item>
          <Form.Item name="birthday" label="生日">
            <DatePicker style={{ width: '100%' }} placeholder="请选择生日" />
          </Form.Item>
          <Form.Item name="idCard" label="身份证号">
            <Input placeholder="请输入身份证号" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="organizationId" label="所属组织">
            <Select placeholder="请选择所属组织" allowClear>
              {organizations.map((org) => (
                <Option key={org.id} value={org.id}>
                  {org.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="storeId" label="所属门店">
            <Select placeholder="请选择所属门店" allowClear>
              {stores.map((store) => (
                <Option key={store.id} value={store.id}>
                  {store.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" placeholder="请选择角色" allowClear>
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="enabled" label="状态">
            <Select>
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="重置密码"
        open={resetPwdModalVisible}
        onOk={handleResetPwdSubmit}
        onCancel={() => setResetPwdModalVisible(false)}
      >
        <Form form={resetPwdForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default User;
