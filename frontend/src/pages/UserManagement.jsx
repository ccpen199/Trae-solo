import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message, 
  Space, 
  Popconfirm,
  Card,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import * as api from '../services/api';

const { Option } = Select;

const ROLE_MAP = {
  admin: { text: '管理员', color: 'red' },
  user: { text: '普通用户', color: 'blue' }
};

const UserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.getUsers({
        page: pagination.current,
        pageSize: pagination.pageSize
      });
      if (response.success) {
        setData(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total
        }));
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, record = null) => {
    setModalType(type);
    setSelectedRecord(record);
    
    if (type === 'edit' && record) {
      form.setFieldsValue({
        ...record,
        password: undefined
      });
    } else {
      form.resetFields();
    }
    
    setModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (modalType === 'create') {
        const response = await api.createUser(values);
        if (response.success) {
          message.success('用户创建成功');
          fetchData();
          setModalVisible(false);
        }
      } else if (modalType === 'edit') {
        const response = await api.updateUser(selectedRecord.id, values);
        if (response.success) {
          message.success('用户更新成功');
          fetchData();
          setModalVisible(false);
        }
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.deleteUser(id);
      if (response.success) {
        message.success('用户删除成功');
        fetchData();
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (val) => {
        const role = ROLE_MAP[val] || { text: val, color: 'default' };
        return <Tag color={role.color}>{role.text}</Tag>;
      }
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (val) => val || '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (val) => (
        <Tag color={val ? 'success' : 'error'}>
          {val ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (val) => val || '从未登录'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal('edit', record)}
          >
            编辑
          </Button>
          {record.username !== 'admin' && (
            <Popconfirm
              title="确定要删除该用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card 
        title="用户管理" 
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchData}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => openModal('create')}
            >
              新增用户
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={modalType === 'create' ? '新增用户' : '编辑用户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: modalType === 'create', message: '请输入用户名' },
              { min: 2, max: 50, message: '用户名长度应在2-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入用户名" disabled={modalType === 'edit'} />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: modalType === 'create', message: '请输入密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password placeholder={modalType === 'create' ? '请输入密码' : '留空则不修改密码'} />
          </Form.Item>
          
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[
              { required: true, message: '请输入真实姓名' }
            ]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[
              { required: true, message: '请选择角色' }
            ]}
          >
            <Select placeholder="请选择角色">
              <Option value="user">普通用户</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="department"
            label="部门"
          >
            <Input placeholder="请输入部门" />
          </Form.Item>
          
          {modalType === 'edit' && (
            <Form.Item
              name="isActive"
              label="状态"
              valuePropName="checked"
            >
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
