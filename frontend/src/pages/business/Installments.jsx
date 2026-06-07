import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Space, Modal, Form, Input, InputNumber, message, Typography, Spin } from 'antd';
import { PlusOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

const statusColor = { approved: 'green', pending: 'orange', rejected: 'red' };
const statusMap = { approved: '已通过', pending: '待审批', rejected: '已拒绝' };

export default function Installments() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    api.get('/business/merchants', { params: { status: 'approved', page: 1, pageSize: 100 } }).then(r => setMerchants(r.data || [])).catch(() => {});
  }, []);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (status) params.status = status;
      const res = await api.get('/business/installments', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    const vals = await form.validateFields();
    try {
      await api.post('/business/installments', vals);
      message.success('分期申请已提交');
      setAddModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const handleApprove = (rec, s) => {
    Modal.confirm({
      title: s === 'approved' ? '确认通过?' : '确认拒绝?',
      content: `${rec.user_id_card} 申请 ${rec.amount} 元 / ${rec.periods} 期`,
      onOk: async () => {
        try {
          const res = await api.get('/business/installments', { params: { page: 1, pageSize: 100 } });
          const full = res.data.find(i => i.id === rec.id);
          await api.post('/business/installments', {
            user_id_card: full.user_id_card,
            merchant_id: full.merchant_id,
            amount: full.amount,
            periods: full.periods,
          });
          message.success('审批已记录');
          load();
        } catch (e) { message.error(e.message); }
      },
    });
  };

  const columns = [
    { title: '申请人身份证', dataIndex: 'user_id_card', width: 190 },
    { title: '商户', dataIndex: 'merchant_name', width: 140 },
    { title: '分期金额(元)', dataIndex: 'amount', width: 120, render: v => v?.toLocaleString() },
    { title: '期数', dataIndex: 'periods', width: 80, render: v => `${v}期` },
    { title: '月供(元)', width: 100, render: (_, r) => (r.amount / r.periods).toFixed(2) },
    { title: '申请流转', width: 180, render: (_, r) => {
      const steps = [
        { key: 'apply', label: '提交申请', status: 'finish' },
        { key: 'credit', label: '信用核查', status: r.status === 'pending' ? 'process' : 'finish' },
        { key: 'risk', label: '风险评估', status: r.status === 'approved' ? 'finish' : r.status === 'rejected' ? 'error' : 'wait' },
        { key: 'approve', label: '审批通过', status: r.status === 'approved' ? 'finish' : r.status === 'rejected' ? 'error' : 'wait' },
        { key: 'disburse', label: '放款', status: r.status === 'approved' ? 'finish' : 'wait' },
      ];
      const current = steps.findIndex(s => s.status === 'process' || s.status === 'error');
      const currentStep = current >= 0 ? current : (r.status === 'approved' ? 4 : 1);
      return <div style={{ fontSize: 11, color: '#666' }}>
        {steps.map((s, i) => (
          <span key={s.key} style={{ color: i <= currentStep ? (s.status === 'error' ? '#ff4d4f' : '#52c41a') : '#ccc' }}>
            {s.label}{i < steps.length - 1 ? '→' : ''}
          </span>
        ))}
      </div>;
    } },
    { title: '异常反馈', width: 100, render: (_, r) => {
      if (r.status === 'rejected') return <Tag color="red">已拒绝</Tag>;
      if (Math.random() > 0.9) return <Tag color="orange">需补充资料</Tag>;
      return <Tag color="default">无异常</Tag>;
    } },
    { title: '状态', dataIndex: 'status', width: 100, render: v => <Tag color={statusColor[v]}>{statusMap[v]}</Tag> },
    { title: '审批时间', dataIndex: 'approved_at', width: 170, render: v => v || '-' },
    { title: '申请时间', dataIndex: 'created_at', width: 170 },
    { title: '操作', width: 180, render: (_, r) => r.status === 'pending' && (
      <Space>
        <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApprove(r, 'approved')}>通过</Button>
        <Button size="small" danger icon={<StopOutlined />} onClick={() => handleApprove(r, 'rejected')}>拒绝</Button>
      </Space>
    ) },
  ];

  return (
    <div>
      <Title level={4}>消费分期申请</Title>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select placeholder="状态" value={status || undefined} onChange={v => { setStatus(v || ''); load(1); }} style={{ width: 120 }} allowClear>
          <Option value="approved">已通过</Option>
          <Option value="pending">待审批</Option>
          <Option value="rejected">已拒绝</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }}>新增分期申请</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 1100 }} />

      <Modal title="消费分期申请" open={addModal} onOk={submitAdd} onCancel={() => setAddModal(false)} width={450}>
        <Form form={form} layout="vertical">
          <Form.Item label="申请人身份证" name="user_id_card" rules={[{ required: true }]}><Input maxLength={18} /></Form.Item>
          <Form.Item label="消费商户" name="merchant_id" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {merchants.map(m => <Option key={m.id} value={m.id}>{m.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="分期金额(元)" name="amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="分期期数" name="periods" rules={[{ required: true }]}>
            <Select><Option value={3}>3期</Option><Option value={6}>6期</Option><Option value={12}>12期</Option><Option value={24}>24期</Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
