import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Space, Tag, message, Row, Col, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { accountingAPI, clientAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Accounting = () => {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRecords();
    loadClients();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = await accountingAPI.getAll();
      setRecords(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    const res = await clientAPI.getAll({ status: 'active' });
    setClients(res.data);
  };

  const handleSubmit = async (values) => {
    try {
      await accountingAPI.create(values);
      message.success('做账记录创建成功');
      setModalVisible(false);
      form.resetFields();
      loadRecords();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const colors = { processing: 'orange', completed: 'blue', reviewed: 'green' };
    const labels = { processing: '处理中', completed: '已完成', reviewed: '已复核' };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const columns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '凭证数量', dataIndex: 'voucher_count', key: 'voucher_count' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
    { title: '处理人', dataIndex: 'handler_name', key: 'handler_name' },
    { title: '复核人', dataIndex: 'reviewer_name', key: 'reviewer_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" onClick={() => { accountingAPI.updateStatus(record.id, 'completed'); loadRecords(); }}>完成</Button>
        <Button type="link" onClick={() => { accountingAPI.updateStatus(record.id, 'reviewed'); loadRecords(); }}>复核通过</Button>
      </Space>
    ) }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>做账管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建做账记录</Button>
        </div>

        <Table columns={columns} dataSource={records} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建做账记录" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="client_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="请选择客户">
              {clients.map(client => <Option key={client.id} value={client.id}>{client.company_name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="month" label="月份" rules={[{ required: true, message: '请选择月份' }]}>
            <Select placeholder="请选择月份">
              {Array.from({ length: 12 }, (_, i) => {
                const date = dayjs().subtract(i, 'month');
                return <Option key={i} value={date.format('YYYY-MM')}>{date.format('YYYY-MM')}</Option>;
              })}
            </Select>
          </Form.Item>
          <Form.Item name="voucher_count" label="凭证数量">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Accounting;
