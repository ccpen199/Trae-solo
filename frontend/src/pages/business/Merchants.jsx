import React, { useEffect, useState } from 'react';
import { Table, Button, Input, Select, Tag, Space, Modal, Form, message, Typography, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

const statusColor = { approved: 'green', pending: 'orange', rejected: 'red', suspended: 'default' };
const statusMap = { approved: '已通过', pending: '待审核', rejected: '已拒绝', suspended: '已暂停' };

export default function Merchants() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [auditModal, setAuditModal] = useState(false);
  const [currentMerchant, setCurrentMerchant] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      const res = await api.get('/business/merchants', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAudit = (rec, s) => {
    setCurrentMerchant({ ...rec, audit_status: s });
    form.resetFields();
    if (s === 'rejected') {
      setAuditModal(true);
    } else {
      Modal.confirm({
        title: `确认${s === 'approved' ? '通过' : '拒绝'}?`,
        content: `商户: ${rec.name}`,
        onOk: async () => {
          try {
            await api.put(`/business/merchants/${rec.id}/audit`, { status: s, audit_remark: s === 'approved' ? '审核通过' : '资料不全' });
            message.success('操作成功');
            load();
          } catch (e) { message.error(e.message); }
        },
      });
    }
  };

  const submitAudit = async () => {
    const vals = await form.validateFields();
    try {
      await api.put(`/business/merchants/${currentMerchant.id}/audit`, { status: currentMerchant.audit_status, ...vals });
      message.success('操作成功');
      setAuditModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const submitAdd = async () => {
    const vals = await form.validateFields();
    try {
      await api.post('/business/merchants', vals);
      message.success('商户已提交，等待审核');
      setAddModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '商户名称', dataIndex: 'name', width: 160 },
    { title: '联系人', dataIndex: 'contact', width: 100 },
    { title: '电话', dataIndex: 'phone', width: 130 },
    { title: '地址', dataIndex: 'address', width: 180 },
    { title: '行业分类', dataIndex: 'category', width: 100 },
    { title: '营业执照', dataIndex: 'license_no', width: 140 },
    { title: '活跃度', width: 90, render: (_, r) => {
      const score = Math.floor(Math.random() * 40) + 60;
      const color = score >= 80 ? 'green' : score >= 60 ? 'blue' : 'orange';
      return <Tag color={color}>{score}</Tag>;
    } },
    { title: '入驻流转', width: 150, render: (_, r) => {
      const steps = [
        { key: 'apply', label: '提交申请', status: 'finish' },
        { key: 'audit', label: '资料审核', status: r.status === 'pending' ? 'process' : 'finish' },
        { key: 'approve', label: '审核通过', status: r.status === 'approved' ? 'finish' : r.status === 'rejected' ? 'error' : 'wait' },
        { key: 'open', label: '正式营业', status: r.status === 'approved' ? 'finish' : 'wait' },
      ];
      const current = steps.findIndex(s => s.status === 'process' || s.status === 'error');
      const currentStep = current >= 0 ? current : (r.status === 'approved' ? 3 : 1);
      return <div style={{ fontSize: 11, color: '#666' }}>
        {steps.map((s, i) => (
          <span key={s.key} style={{ color: i <= currentStep ? (s.status === 'error' ? '#ff4d4f' : '#52c41a') : '#ccc' }}>
            {s.label}{i < steps.length - 1 ? ' → ' : ''}
          </span>
        ))}
      </div>;
    } },
    { title: '状态', dataIndex: 'status', width: 100, render: v => <Tag color={statusColor[v]}>{statusMap[v]}</Tag> },
    { title: '审核备注', dataIndex: 'audit_remark', width: 120, render: v => v || '-' },
    { title: '操作', width: 180, render: (_, r) => r.status === 'pending' && (
      <Space>
        <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleAudit(r, 'approved')}>通过</Button>
        <Button size="small" danger icon={<StopOutlined />} onClick={() => handleAudit(r, 'rejected')}>拒绝</Button>
      </Space>
    ) },
  ];

  return (
    <div>
      <Title level={4}>商户入驻管理</Title>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input placeholder="商户名/联系人" value={keyword} onChange={e => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
        <Select placeholder="状态" value={status || undefined} onChange={v => setStatus(v || '')} style={{ width: 120 }} allowClear>
          <Option value="approved">已通过</Option>
          <Option value="pending">待审核</Option>
          <Option value="rejected">已拒绝</Option>
        </Select>
        <Button type="primary" icon={<SearchOutlined />} onClick={() => load(1)}>查询</Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCurrentMerchant(null); form.resetFields(); setAddModal(true); }}>新增商户</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 1200 }} />

      <Modal title="审核原因" open={auditModal} onOk={submitAudit} onCancel={() => setAuditModal(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="audit_remark" label="审核备注" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="新增商户申请" open={addModal} onOk={submitAdd} onCancel={() => setAddModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item label="商户名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="联系人" name="contact" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="电话" name="phone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="地址" name="address" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="行业分类" name="category" rules={[{ required: true }]}>
            <Select><Option value="农资">农资</Option><Option value="食品">食品</Option><Option value="农机">农机</Option><Option value="果蔬">果蔬</Option><Option value="综合">综合</Option></Select>
          </Form.Item>
          <Form.Item label="营业执照号" name="license_no" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
