import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  message,
  Popconfirm,
  Descriptions,
  Divider
} from 'antd';
import { PlusOutlined, SyncOutlined, EditOutlined } from '@ant-design/icons';
import { permissionApi } from '@/api';
import { useAuthStore } from '@/store';

const { Option } = Select;

const UserManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, branchesRes, positionsRes] = await Promise.all([
        permissionApi.getUsers(),
        permissionApi.getBranches(),
        permissionApi.getPositions()
      ]);
      setUsers(usersRes.data.users || []);
      setBranches(branchesRes.data.branches || []);
      setPositions(positionsRes.data.positions || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue({
      name: record.name,
      branchId: record.branch_id,
      positionId: record.position_id,
      status: record.status === 1
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        await permissionApi.updateUser(editingUser.id, {
          name: values.name,
          branchId: values.branchId,
          positionId: values.positionId,
          status: values.status ? 1 : 0,
          password: values.password
        });
        message.success('用户更新成功');
      } else {
        if (!values.erpId || !values.password) {
          message.error('请填写ERPID和密码');
          return;
        }
        await permissionApi.createUser({
          erpId: values.erpId,
          name: values.name,
          password: values.password,
          branchId: values.branchId,
          positionId: values.positionId
        });
        message.success('用户创建成功');
      }

      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.error || '保存失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'ERPID',
      dataIndex: 'erp_id',
      key: 'erp_id',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分公司',
      dataIndex: 'branch_name',
      key: 'branch_name',
      render: (name: string, record: any) => (
        <Tag color={record.branch_code === 'HEAD' ? 'purple' : 'blue'}>
          {name}
        </Tag>
      ),
    },
    {
      title: '岗位',
      dataIndex: 'position_name',
      key: 'position_name',
    },
    {
      title: '状态',
      key: 'status',
      render: (_: any, record: any) => (
        <Tag color={record.status === 1 ? 'green' : 'red'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      render: (time: string) => time || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="用户管理"
        extra={
          <Space>
            <Button icon={<SyncOutlined />} onClick={fetchData} loading={loading}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增用户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editingUser ? (
            <>
              <Form.Item
                label="ERPID"
                name="erpId"
                rules={[{ required: true, message: '请输入ERPID' }]}
              >
                <Input placeholder="请输入登录用的ERPID" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入登录密码" />
              </Form.Item>
            </>
          ) : (
            <>
              <Descriptions bordered size="small" column={1} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="ERPID">{editingUser.erp_id}</Descriptions.Item>
              </Descriptions>
              <Divider>修改信息（留空则不修改密码）</Divider>
              <Form.Item label="新密码（留空不修改）" name="password">
                <Input.Password placeholder="如需修改密码请输入新密码，否则留空" />
              </Form.Item>
            </>
          )}

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="分公司"
            name="branchId"
            rules={[{ required: true, message: '请选择分公司' }]}
          >
            <Select placeholder="请选择分公司">
              {branches.map((b) => (
                <Option key={b.id} value={b.id} disabled={
                  !user?.isHeadquarters && b.id !== user?.branchId
                }>
                  {b.name} {b.is_headquarters ? '(总公司)' : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="岗位"
            name="positionId"
            rules={[{ required: true, message: '请选择岗位' }]}
          >
            <Select placeholder="请选择岗位">
              {positions.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item label="状态" name="status" valuePropName="checked">
              <Switch
                checkedChildren="启用"
                unCheckedChildren="禁用"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
