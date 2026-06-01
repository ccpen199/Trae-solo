import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { Customer, getCustomers, createCustomer } from '../api/customers';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      message.error('加载客户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await createCustomer(values);
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadCustomers();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns = [
    { title: '企业名称', dataIndex: 'name', key: 'name' },
    { title: '统一社会信用代码', dataIndex: 'unifiedSocialCode', key: 'unifiedSocialCode' },
    { title: '法定代表人', dataIndex: 'legalRepresentative', key: 'legalRepresentative' },
    { title: '联系人', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone' },
    {
      title: '数据统计',
      key: 'stats',
      render: (_: any, record: Customer) => (
        <Space>
          <span>申请: {record._count?.applications || 0}</span>
          <span>证书: {record._count?.qualificationCerts || 0}</span>
        </Space>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}>详情</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>客户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          添加客户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
      />

      <Modal
        title="添加客户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="企业名称" rules={[{ required: true }]}>
            <Input placeholder="请输入企业名称" />
          </Form.Item>
          <Form.Item name="unifiedSocialCode" label="统一社会信用代码" rules={[{ required: true }]}>
            <Input placeholder="请输入统一社会信用代码" />
          </Form.Item>
          <Form.Item name="legalRepresentative" label="法定代表人" rules={[{ required: true }]}>
            <Input placeholder="请输入法定代表人姓名" />
          </Form.Item>
          <Form.Item name="contactPerson" label="联系人" rules={[{ required: true }]}>
            <Input placeholder="请输入联系人姓名" />
          </Form.Item>
          <Form.Item name="contactPhone" label="联系电话" rules={[{ required: true }]}>
            <Input placeholder="请输入联系电话" />
          </Form.Item>
          <Form.Item name="address" label="注册地址">
            <Input placeholder="请输入注册地址" />
          </Form.Item>
          <Form.Item name="industry" label="所属行业">
            <Input placeholder="请输入所属行业" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
