import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, InputNumber, Input, Space, Tag, message, Row, Col, Card } from 'antd';
import { PlusOutlined, MailOutlined, EyeOutlined } from '@ant-design/icons';
import { reportAPI, clientAPI } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const MonthlyReports = () => {
  const [reports, setReports] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadReports();
    loadClients();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.getAll();
      setReports(res.data);
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
      await reportAPI.create(values);
      message.success('月报创建成功');
      setModalVisible(false);
      form.resetFields();
      loadReports();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getReadTag = (is_read) => {
    return is_read ? <Tag color="green">已阅读</Tag> : <Tag color="orange">未阅读</Tag>;
  };

  const columns = [
    { title: '客户名称', dataIndex: 'company_name', key: 'company_name' },
    { title: '月份', dataIndex: 'month', key: 'month' },
    { title: '收入', dataIndex: 'revenue', key: 'revenue', render: (val) => `¥${val?.toFixed(2)}` },
    { title: '成本', dataIndex: 'cost', key: 'cost', render: (val) => `¥${val?.toFixed(2)}` },
    { title: '利润', dataIndex: 'profit', key: 'profit', render: (val) => `¥${val?.toFixed(2)}` },
    { title: '税额', dataIndex: 'tax_amount', key: 'tax_amount', render: (val) => `¥${val?.toFixed(2)}` },
    { title: '凭证数量', dataIndex: 'voucher_count', key: 'voucher_count' },
    { title: '阅读状态', dataIndex: 'is_read', key: 'is_read', render: (is_read) => getReadTag(is_read) },
    { title: '创建人', dataIndex: 'creator_name', key: 'creator_name' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm') },
    { title: '操作', key: 'action', render: (_, record) => (
      <Space>
        <Button type="link" icon={<MailOutlined />} onClick={() => message.info('已发送月报')}>发送</Button>
        <Button type="link" icon={<EyeOutlined />} onClick={() => { reportAPI.update(record.id, { is_read: true }); loadReports(); }}>标记已读</Button>
      </Space>
    ) }
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>月报管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建月报</Button>
        </div>

        <Table columns={columns} dataSource={reports} loading={loading} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="新建月报" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()} width={600}>
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
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="revenue" label="收入">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="cost" label="成本">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="profit" label="利润">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="tax_amount" label="税额">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="voucher_count" label="凭证数量">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="月报内容">
            <Input.TextArea rows={4} placeholder="请输入月报详细内容" />
          </Form.Item>
          <Form.Item name="client_feedback" label="客户反馈">
            <Input.TextArea rows={2} placeholder="请输入客户反馈" />
          </Form.Item>
          <Form.Item name="renewal_opportunity" label="续费机会">
            <Input.TextArea rows={2} placeholder="请输入续费机会评估" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MonthlyReports;
