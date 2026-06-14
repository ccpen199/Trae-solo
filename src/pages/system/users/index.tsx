import { useState } from 'react';
import { Button, Modal, Form, Input, Select, Switch, Space, message } from 'antd';
import { PlusOutlined, EditOutlined, LockOutlined, StopOutlined, CheckOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { PageContainer, TablePro, StatusTag } from '@/components/common';
import { Desensitize } from '@/components/common';
import {
  getUserList,
  createUser,
  updateUser,
  resetUserPassword,
  getRoleList,
  type SystemUser,
  type SystemUserListParams,
} from '@/services/api/system';
import { formatDateTime } from '@/utils/format';
import { cities } from '@/utils/region';

const UserManagement = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [searchParams] = useState<Record<string, string>>({});

  const [form] = Form.useForm();

  const { data: roleData } = useRequest(getRoleList);
  const roleOptions = (roleData?.data || []).map((r) => ({ label: r.name, value: r.id }));

  const { run: doCreate, loading: creating } = useRequest(createUser, {
    manual: true,
    onSuccess: () => {
      message.success('用户创建成功');
      setModalOpen(false);
      form.resetFields();
    },
  });

  const { run: doUpdate, loading: updating } = useRequest(updateUser, {
    manual: true,
    onSuccess: () => {
      message.success('用户更新成功');
      setModalOpen(false);
      setEditingUser(null);
      form.resetFields();
    },
  });

  const { run: doResetPwd } = useRequest(resetUserPassword, {
    manual: true,
    onSuccess: () => message.success('密码重置成功'),
  });

  const { run: doToggleStatus } = useRequest(
    (id: string, status: string) => updateUser(id, { status: status as 'active' | 'disabled' }),
    { manual: true, onSuccess: () => message.success('状态更新成功') }
  );

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: SystemUser) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      realName: record.realName,
      phone: record.phone,
      email: record.email,
      roleId: record.roleId,
      department: record.department,
      status: record.status === 'active',
    });
    setModalOpen(true);
  };

  const handleResetPassword = (record: SystemUser) => {
    Modal.confirm({
      title: '重置密码',
      content: `确认重置用户 ${record.realName} 的密码？`,
      onOk: () => doResetPwd(record.id, 'Abc@123456'),
    });
  };

  const handleToggleStatus = (record: SystemUser) => {
    const newStatus = record.status === 'active' ? 'disabled' : 'active';
    Modal.confirm({
      title: newStatus === 'disabled' ? '禁用用户' : '启用用户',
      content: `确认${newStatus === 'disabled' ? '禁用' : '启用'}用户 ${record.realName}？`,
      onOk: () => doToggleStatus(record.id, newStatus),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        status: values.status ? 'active' : 'disabled',
      };
      if (editingUser) {
        doUpdate(editingUser.id, payload);
      } else {
        doCreate(payload as Omit<SystemUser, 'id' | 'createdAt' | 'lastLoginAt' | 'statusName' | 'roleName'>);
      }
    } catch { /* validation failed */ }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '姓名', dataIndex: 'realName', key: 'realName', width: 100 },
    { title: '角色', dataIndex: 'roleName', key: 'roleName', width: 120 },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (v: string) => <Desensitize type="phone" value={v} />,
    },
    { title: '区域', dataIndex: 'department', key: 'department', width: 120 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <StatusTag
          status={status === 'active' ? 'success' : 'danger'}
          text={status === 'active' ? '启用' : '禁用'}
        />
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 170,
      render: (v: string) => (v ? formatDateTime(v) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_: unknown, record: SystemUser) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<LockOutlined />} onClick={() => handleResetPassword(record)}>
            重置密码
          </Button>
          {record.status === 'active' ? (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleToggleStatus(record)}>
              禁用
            </Button>
          ) : (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleToggleStatus(record)}>
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="用户管理"
      subTitle="系统用户账号管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增用户
        </Button>
      }
    >
      <TablePro<SystemUser>
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getUserList(params as SystemUserListParams);
          return {
            list: res.data?.list || [],
            total: res.data?.total || 0,
          };
        }}
        params={searchParams}
        showExport
      />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingUser(null); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={creating || updating}
        width={560}
        destroyOnClose
      >
        <Form
          form={form}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 18 }}
          initialValues={{ status: true }}
        >
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少8位' }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
          )}
          <Form.Item name="realName" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="roleId" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select placeholder="请选择角色" options={roleOptions} />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ pattern: /^1\d{10}$/, message: '请输入正确手机号' }]}>
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入正确邮箱' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="department" label="区域">
            <Select placeholder="请选择区域" allowClear options={cities.map((c) => ({ label: c.name, value: c.code }))} />
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;
