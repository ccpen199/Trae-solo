import React, { useState, useEffect } from 'react';
import {
  Table,
  Input,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  message,
  Popconfirm,
  Drawer,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../utils/api';

const { Title } = Typography;
const { Search } = Input;

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [keyword, setKeyword] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [form] = Form.useForm();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize,
      };
      if (keyword) params.keyword = keyword;

      const response = await adminApi.getAdmins(params);
      setAdmins(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      message.error('获取管理员列表失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchAdmins();
  };

  const handleAdd = () => {
    setEditingAdmin(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    form.setFieldsValue({
      ...admin,
      username: admin.username,
    });
    setDrawerVisible(true);
  };

  const handleView = async (admin) => {
    try {
      const response = await adminApi.getAdminById(admin.id);
      setSelectedAdmin(response.data);
      setDetailVisible(true);
    } catch (err) {
      message.error('获取管理员详情失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteAdmin(id);
      message.success('删除成功');
      fetchAdmins();
    } catch (err) {
      message.error(err.response?.data?.message || '删除失败');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingAdmin) {
        await adminApi.updateAdmin(editingAdmin.id, values);
        message.success('更新成功');
      } else {
        await adminApi.createAdmin(values);
        message.success('添加成功');
      }
      setDrawerVisible(false);
      fetchAdmins();
    } catch (err) {
      message.error(err.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
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
      width: 180,
      render: (email) => email || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone) => phone || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该管理员吗？"
            description="至少需要保留一个管理员账户"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              管理员管理
            </Title>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              添加管理员
            </Button>
          </div>
          <Search
            placeholder="搜索姓名、电话或邮箱"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            style={{ width: 400 }}
          />
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={admins}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Drawer
        title={editingAdmin ? '编辑管理员' : '添加管理员'}
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerVisible(false)}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              提交
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingAdmin && (
            <>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item
                name="password"
                label="密码"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
            </>
          )}
          {editingAdmin && (
            <Form.Item name="password" label="新密码 (留空则不修改)">
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          )}

          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item name="email" label="邮箱">
            <Input type="email" placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="管理员详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {selectedAdmin && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="姓名" span={2}>
              {selectedAdmin.name}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">{selectedAdmin.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedAdmin.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{selectedAdmin.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{selectedAdmin.created_at}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{selectedAdmin.updated_at || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AdminManagement;
