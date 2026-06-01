import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, Space, Tag, message, Row, Col, Card } from 'antd';
import { PlusOutlined, BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { renewalAPI, clientAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Renewals = () => {
  const [renewals, setRenewals] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadRenewals();
    loadClients();
  }, []);

  const loadRenewals = async () => {
    setLoading(true);
    try {
      const res = await renewalAPI.getAll();
      setRenewals(res.data);
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
      await renewalAPI.create(values);
      message.success('续费提醒创建成功');
      setModalVisible(false);
      form.resetFields();
      loadRenewals();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const colors = { pending: 'orange', renewed: 'green', lost: 'red' };
    const labels = { pending: '待续费', renewed: '已续费', lost: '已流失' };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const columns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '合同到期日', dataIndex: 'contract_end_date', key: 'contract_end_date', render: (date) => dayjs(date).format('YYYY-MM-DD') },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
    { title: '提醒发送', dataIndex: 'reminder_sent', key: 'reminder_sent', render: (sent) => sent ? <Tag color="green">已发送</Tag> : <Tag color="orange">未发送</Tag> },
    { title: '提醒日期', dataIndex: 'reminder_date', key: 'reminder_date', render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-' },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" icon={<BellOutlined />} onClick={() => message.info('已发送提醒')}>发送提醒</Button>
        <Button type="link" icon={<CheckCircleOutlined />} onClick={() => { renewalAPI.update(record.id, { status: 'renewed' }); loadRenewals(); }}>标记已续费</Button>
      </Space>
    ) }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>续费提醒管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建续费提醒</Button>
        </div>

        <Table columns={columns} dataSource={renewals} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建续费提醒" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="client_id" label="客户" rules={[{ required: true, message: '请选择客户' }]}>
            <Select placeholder="请选择客户">
              {clients.map(client => <Option key={client.id} value={client.id}>{client.company_name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="contract_end_date" label="合同到期日期" rules={[{ required: true, message: '请选择日期' }]}>
            <Input type="date" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Renewals;
