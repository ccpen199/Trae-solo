import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, Space, Tag, message, Row, Col, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { documentAPI, clientAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({ month: '', type: '', status: '' });

  useEffect(() => {
    loadDocuments();
    loadClients();
  }, [filters]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentAPI.getAll(filters);
      setDocuments(res.data);
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
      await documentAPI.create(values);
      message.success('票据上传成功');
      setModalVisible(false);
      form.resetFields();
      loadDocuments();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getStatusTag = (status) => {
    const colors = { pending: 'orange', received: 'blue', verified: 'green', rejected: 'red' };
    const labels = { pending: '待上传', received: '已上传', verified: '已核验', rejected: '已退回' };
    return <Tag color={colors[status]}>{labels[status]}</Tag>;
  };

  const getTypeTag = (type) => {
    const labels = { invoice: '发票', bank: '银行流水', salary: '工资表', expense: '费用凭证' };
    return <Tag>{labels[type]}</Tag>;
  };

  const columns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type) => getTypeTag(type) },
    { title: '文件名', dataIndex: 'file_name', key: 'file_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
    { title: '上传人', dataIndex: 'uploader_name', key: 'uploader_name' },
    { title: '上传时间', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>票据收集管理</h2>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>上传票据</Button>
            <Button onClick={() => { documentAPI.checkMissing(dayjs().format('YYYY-MM')); message.info('已触发缺失资料检查'); }}>检查缺失资料</Button>
          </Space>
        </div>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select placeholder="选择月份" style={{ width: '100%' }} allowClear onChange={(value) => setFilters({ ...filters, month: value || '' })}>
              {Array.from({ length: 12 }, (_, i) => {
                const date = dayjs().subtract(i, 'month');
                return <Option key={i} value={date.format('YYYY-MM')}>{date.format('YYYY-MM')}</Option>;
              })}
            </Select>
          </Col>
          <Col span={6}>
            <Select placeholder="票据类型" style={{ width: '100%' }} allowClear onChange={(value) => setFilters({ ...filters, type: value || '' })}>
              <Option value="invoice">发票</Option>
              <Option value="bank">银行流水</Option>
              <Option value="salary">工资表</Option>
              <Option value="expense">费用凭证</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Select placeholder="状态" style={{ width: '100%' }} allowClear onChange={(value) => setFilters({ ...filters, status: value || '' })}>
              <Option value="pending">待上传</Option>
              <Option value="received">已上传</Option>
              <Option value="verified">已核验</Option>
              <Option value="rejected">已退回</Option>
            </Select>
          </Col>
        </Row>

        <Table columns={columns} dataSource={documents} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="上传票据" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
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
          <Form.Item name="type" label="票据类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="请选择类型">
              <Option value="invoice">发票</Option>
              <Option value="bank">银行流水</Option>
              <Option value="salary">工资表</Option>
              <Option value="expense">费用凭证</Option>
            </Select>
          </Form.Item>
          <Form.Item name="file_name" label="文件名" rules={[{ required: true, message: '请输入文件名' }]}>
            <Input placeholder="请输入文件名" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Documents;
