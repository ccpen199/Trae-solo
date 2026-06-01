import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Typography, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { clientApi } from '../services/api';

const { Title } = Typography;

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
      const response = await clientApi.list();
      setClients(response.data);
    } catch (error) {
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
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

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingClient) {
        await clientApi.update(editingClient.id, values);
        message.success('客户更新成功');
      } else {
        await clientApi.create(values);
        message.success('客户创建成功');
      }
      setModalVisible(false);
      loadClients();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry'
    },
    {
      title: '联系人',
      dataIndex: 'contact_person',
      key: 'contact_person'
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone'
    },
    {
      title: '邮箱',
      dataIndex: 'contact_email',
      key: 'contact_email'
    },
    {
      title: '结算方式',
      dataIndex: 'settlement_method',
      key: 'settlement_method'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '合作中' : '已停止'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>客户管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增客户
        </Button>
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <Table
          dataSource={clients}
          columns={columns}
          rowKey="id"
          loading={loading}
          className="card-shadow"
          pagination={{ pageSize: 10 }}
        />
      </div>

      <Modal
        title={editingClient ? '编辑客户' : '新增客户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="客户名称" rules={[{ required: true }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="industry" label="所属行业">
            <Input placeholder="请输入所属行业" />
          </Form.Item>
          <Form.Item name="contact_person" label="联系人">
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="contact_phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="contact_email" label="邮箱">
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input.TextArea rows={3} placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="settlement_method" label="结算方式">
            <Input placeholder="请输入结算方式" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Clients;
