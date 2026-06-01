import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tag, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { canCreate, canUpdate, canDelete, getCurrentRole } from '../utils/permissions';
import dayjs from 'dayjs';

function Environments() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [applications, setApplications] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    setUserRole(getCurrentRole());
    loadData();
    loadApplications();
  }, [pagination.current, pagination.pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/environments', {
        params: { page: pagination.current, pageSize: pagination.pageSize }
      });
      setData(response.data.list);
      setPagination(p => ({ ...p, total: response.data.total }));
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await api.get('/applications', { params: { pageSize: 100 } });
      setApplications(response.data.list);
    } catch (e) {}
  };

  const handleCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除环境「${record.env_name}」吗？`,
      onOk: async () => {
        try {
          await api.delete(`/environments/${record.id}`);
          message.success('删除成功');
          loadData();
        } catch (error) {
          message.error(error.response?.data?.error || '删除失败');
        }
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/environments/${editingItem.id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/environments', values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  const envTypeNames = { dev: '开发', test: '测试', staging: '预发', prod: '生产' };
  const dbTypeNames = { mysql: 'MySQL', postgresql: 'PostgreSQL', oracle: 'Oracle', mongodb: 'MongoDB', redis: 'Redis' };

  const columns = [
    { title: '应用', dataIndex: 'app_name', key: 'app_name', width: 120 },
    { title: '环境名称', dataIndex: 'env_name', key: 'env_name', width: 120 },
    { title: '环境类型', dataIndex: 'env_type', key: 'env_type', width: 100,
      render: (v) => <Tag color={v === 'prod' ? 'red' : v === 'staging' ? 'orange' : 'blue'}>{envTypeNames[v]}</Tag>
    },
    { title: '数据库类型', dataIndex: 'db_type', key: 'db_type', width: 100,
      render: (v) => dbTypeNames[v] || v
    },
    { title: '地址', dataIndex: 'db_host', key: 'db_host', width: 120,
      render: (v, r) => `${v}:${r.db_port}`
    },
    { title: '数据库名', dataIndex: 'db_name', key: 'db_name', width: 120 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => (
        <Tag color={v === 'active' ? 'green' : v === 'maintenance' ? 'orange' : 'red'}>
          {v === 'active' ? '启用' : v === 'maintenance' ? '维护中' : '禁用'}
        </Tag>
      )
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          {canUpdate(userRole, 'environment') && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete(userRole, 'environment') && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              删除
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="table-toolbar">
        <h1 className="page-title">环境配置</h1>
        {canCreate(userRole, 'environment') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建环境
          </Button>
        )}
      </div>

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
          onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
        }}
      />

      <Modal
        title={editingItem ? '编辑环境' : '新建环境'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="app_id" label="所属应用" rules={[{ required: true }]}>
            <Select placeholder="请选择应用">
              {applications.map(a => (
                <Select.Option key={a.id} value={a.id}>{a.app_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="env_name" label="环境名称" rules={[{ required: true }]}>
            <Input placeholder="例如：product-db" />
          </Form.Item>
          <Form.Item name="env_type" label="环境类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="dev">开发</Select.Option>
              <Select.Option value="test">测试</Select.Option>
              <Select.Option value="staging">预发</Select.Option>
              <Select.Option value="prod">生产</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="db_type" label="数据库类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="mysql">MySQL</Select.Option>
              <Select.Option value="postgresql">PostgreSQL</Select.Option>
              <Select.Option value="oracle">Oracle</Select.Option>
              <Select.Option value="mongodb">MongoDB</Select.Option>
              <Select.Option value="redis">Redis</Select.Option>
            </Select>
          </Form.Item>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="db_host" label="主机地址" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                <Input placeholder="127.0.0.1" />
              </Form.Item>
              <Form.Item name="db_port" label="端口" rules={[{ required: true }]} style={{ width: 120, marginBottom: 0 }}>
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="db_name" label="数据库名" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                <Input placeholder="mydb" />
              </Form.Item>
              <Form.Item name="version" label="版本" style={{ width: 150, marginBottom: 0 }}>
                <Input placeholder="8.0" />
              </Form.Item>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="db_user" label="用户名" rules={[{ required: true }]} style={{ flex: 1, marginBottom: 0 }}>
                <Input placeholder="root" />
              </Form.Item>
              <Form.Item name="db_password" label="密码" rules={[{ required: !editingItem }]} style={{ flex: 1, marginBottom: 0 }}>
                <Input.Password placeholder={editingItem ? '不修改请留空' : '请输入密码'} />
              </Form.Item>
            </div>
          </Space>
          {editingItem && (
            <Form.Item name="status" label="状态" style={{ marginTop: 24 }}>
              <Select>
                <Select.Option value="active">启用</Select.Option>
                <Select.Option value="maintenance">维护中</Select.Option>
                <Select.Option value="inactive">禁用</Select.Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" block>
              {editingItem ? '更新' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Environments;
