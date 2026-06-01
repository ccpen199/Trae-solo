import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { clientsAPI } from '../services/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await clientsAPI.getAll();
      setClients(data || []);
    } catch (error) {
      message.error('加载客户列表失败');
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setEditingClient(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingClient(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient.id, values);
        message.success('更新成功');
      } else {
        await clientsAPI.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadClients();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person', width: 120 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '折扣率', dataIndex: 'discount_rate', key: 'discount_rate', width: 100, render: (v) => v ? `${v}%` : '-' },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">客户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增客户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={clients}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingClient ? '编辑客户' : '新增客户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact_person" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="discount_rate" label="折扣率 (%)">
            <Input type="number" min="0" max="100" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Clients;
