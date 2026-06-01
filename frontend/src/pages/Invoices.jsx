import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, message, Space, InputNumber, Tag, Progress, DatePicker, Input } from 'antd';
import { PlusOutlined, EyeOutlined, RedoOutlined, DollarOutlined } from '@ant-design/icons';
import { invoicesAPI, clientsAPI, mattersAPI, timeEntriesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Option } = Select;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [matters, setMatters] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoicesData, clientsData, mattersData] = await Promise.all([
        invoicesAPI.getAll(),
        clientsAPI.getAll(),
        mattersAPI.getAll(),
      ]);
      setInvoices(invoicesData || []);
      setClients(clientsData || []);
      setMatters(mattersData || []);
    } catch (error) {
      message.error('加载数据失败');
    }
    setLoading(false);
  };

  const handleClientChange = async (clientId) => {
    try {
      const entries = await timeEntriesAPI.getAll();
      const approvedEntries = (entries || []).filter(e =>
        e.status === 'approved' && !e.invoice_id
      );
      setTimeEntries(approvedEntries);
    } catch (e) {}
  };

  const handleAdd = () => {
    setCurrentInvoice(null);
    form.resetFields();
    form.setFieldsValue({ tax_rate: 6 });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await invoicesAPI.create(values);
      message.success('创建账单成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await invoicesAPI.updateStatus(id, status);
      message.success('状态更新成功');
      loadData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleRecordPayment = (record) => {
    setCurrentInvoice(record);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      invoice_id: record.id,
      payment_date: dayjs(),
      amount: record.total_amount - (record.paid_amount || 0),
    });
    setPaymentModalVisible(true);
  };

  const handlePaymentSubmit = async (values) => {
    try {
      await invoicesAPI.recordPayment({
        ...values,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
      });
      message.success('付款记录成功');
      setPaymentModalVisible(false);
      loadData();
    } catch (error) {
      message.error('记录失败');
    }
  };

  const handleReopen = async (id) => {
    try {
      await invoicesAPI.reopen(id);
      message.success('账单已重新打开');
      loadData();
    } catch (error) {
      message.error('重新打开失败');
    }
  };

  const statusColors = {
    draft: 'default',
    client_confirmed: 'blue',
    invoiced: 'orange',
    partially_paid: 'purple',
    paid: 'green',
  };
  const statusLabels = {
    draft: '草稿',
    client_confirmed: '客户已确认',
    invoiced: '已开票',
    partially_paid: '部分付款',
    paid: '已结清',
  };

  const columns = [
    { title: '账单编号', dataIndex: 'invoice_number', key: 'invoice_number', width: 160 },
    { title: '客户', dataIndex: 'client_name', key: 'client_name', width: 140 },
    { title: '案件', dataIndex: 'matter_name', key: 'matter_name', width: 120, ellipsis: true },
    { title: '总工时', dataIndex: 'total_hours', key: 'total_hours', width: 100, render: v => v ? `${v}h` : '-' },
    { title: '工时费', dataIndex: 'time_fee', key: 'time_fee', width: 100, render: v => `¥${v?.toFixed(2)}` },
    { title: '固定费用', dataIndex: 'fixed_fee', key: 'fixed_fee', width: 100, render: v => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 120, render: v => `¥${v?.toFixed(2)}` },
    {
      title: '收款进度',
      key: 'payment_progress',
      width: 150,
      render: (_, record) => {
        const paid = record.paid_amount || 0;
        const total = record.total_amount || 1;
        const percent = Math.round((paid / total) * 100);
        return (
          <div>
            <Progress percent={percent} size="small" status={percent >= 100 ? 'success' : 'active'} />
            <div style={{ fontSize: 12, textAlign: 'right' }}>¥{paid.toFixed(2)}</div>
          </div>
        );
      },
    },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: status => <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space wrap size="small">
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/invoices/${record.id}`)}>
            详情
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'client_confirmed')}>
              确认
            </Button>
          )}
          {record.status === 'client_confirmed' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, 'invoiced')}>
              开票
            </Button>
          )}
          {(record.status === 'invoiced' || record.status === 'partially_paid') && (
            <Button type="link" icon={<DollarOutlined />} size="small" onClick={() => handleRecordPayment(record)}>
              收款
            </Button>
          )}
          {record.status !== 'draft' && (
            <Button type="link" danger icon={<RedoOutlined />} size="small" onClick={() => handleReopen(record.id)}>
              重开
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">账单管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建账单
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={invoices}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1600 }}
      />

      <Modal
        title="新建账单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="client_id" label="客户" rules={[{ required: true }]}>
            <Select onChange={handleClientChange}>
              {clients.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="matter_id" label="案件">
            <Select>
              {matters.map(m => <Option key={m.id} value={m.id}>{m.case_number} - {m.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="time_entry_ids" label="选择工时记录">
            <Select mode="multiple" style={{ width: '100%' }} placeholder="选择已通过审核的工时">
              {timeEntries.map(e => (
                <Option key={e.id} value={e.id}>
                  {e.date} - {e.user_name} - {e.hours}h - {e.description.substring(0, 20)}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="fixed_fee" label="固定费用 (元)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="advance_fee" label="代垫费用 (元)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="tax_rate" label="税率 (%)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="discount" label="折扣金额 (元)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="记录收款"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={() => paymentForm.submit()}
        width={500}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handlePaymentSubmit}>
          <Form.Item name="invoice_id" hidden><Input /></Form.Item>
          <Form.Item name="amount" label="收款金额 (元)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="payment_date" label="收款日期" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="payment_method" label="付款方式">
            <Select>
              <Option value="bank">银行转账</Option>
              <Option value="cash">现金</Option>
              <Option value="check">支票</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Invoices;
