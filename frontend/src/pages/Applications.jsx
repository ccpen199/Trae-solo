import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { applicationAPI, userAPI } from '../services/api';
import dayjs from 'dayjs';

const Applications = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
    loadUsers();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await applicationAPI.list();
      setData(res.data);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await userAPI.list();
      setUsers(res.data);
    } catch (err) {
      console.error('加载用户失败');
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleView = (record) => {
    setViewingRecord(record);
    setViewModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await applicationAPI.delete(id);
      message.success('删除成功');
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await applicationAPI.update(editingRecord.id, values);
        message.success('更新成功');
      } else {
        await applicationAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      message.error(err.response?.data?.error || '操作失败');
    }
  };

  const columns = [
    {
      title: '应用ID',
      dataIndex: 'app_id',
      key: 'app_id',
      width: 150,
    },
    {
      title: '应用名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 100,
      render: (env) => {
        const colorMap = { dev: 'green', test: 'blue', prod: 'red' };
        return <Tag color={colorMap[env]}>{env}</Tag>;
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 100,
    },
    {
      title: '负责人',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">应用管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建应用
        </Button>
      </div>

      <div className="card-content">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
        />
      </div>

      <Modal
        title={editingRecord ? '编辑应用' : '新建应用'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="应用名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="environment" label="环境" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="dev">开发环境</Select.Option>
              <Select.Option value="test">测试环境</Select.Option>
              <Select.Option value="prod">生产环境</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本" initialValue="1.0.0">
            <Input />
          </Form.Item>
          <Form.Item name="owner_id" label="负责人">
            <Select>
              {users.map(u => (
                <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              <Select.Option value="active">激活</Select.Option>
              <Select.Option value="inactive">停用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="应用详情"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={null}
        width={600}
      >
        {viewingRecord && (
          <div>
            <p><strong>应用ID:</strong> {viewingRecord.app_id}</p>
            <p><strong>应用名称:</strong> {viewingRecord.name}</p>
            <p><strong>描述:</strong> {viewingRecord.description || '-'}</p>
            <p><strong>环境:</strong> {viewingRecord.environment}</p>
            <p><strong>版本:</strong> {viewingRecord.version}</p>
            <p><strong>负责人:</strong> {viewingRecord.owner_name || '-'}</p>
            <p><strong>状态:</strong> {viewingRecord.status}</p>
            <p><strong>API Key:</strong> <code>{viewingRecord.api_key}</code></p>
            <p><strong>创建时间:</strong> {dayjs(viewingRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Applications;
