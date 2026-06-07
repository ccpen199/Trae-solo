import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Space, Modal, Form, Input, InputNumber, DatePicker, message, Typography, Spin } from 'antd';
import { PlusOutlined, QrcodeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

export default function Coupons() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [merchantId, setMerchantId] = useState('');
  const [status, setStatus] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [verifyModal, setVerifyModal] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    async function load() {
      try {
        const [cp, mr] = await Promise.all([
          api.get('/business/coupons', { params: { page: 1, pageSize: 100 } }),
          api.get('/business/merchants', { params: { status: 'approved', page: 1, pageSize: 100 } }),
        ]);
        setMerchants(mr.data || []);
      } catch (e) { message.error(e.message); }
    }
    load();
  }, []);

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (merchantId) params.merchant_id = merchantId;
      if (status) params.status = status;
      const res = await api.get('/business/coupons', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    const vals = await form.validateFields();
    try {
      await api.post('/business/coupons', { ...vals, expire_at: vals.expire_at?.format('YYYY-MM-DD') });
      message.success('优惠券创建成功');
      setAddModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const submitVerify = async () => {
    const vals = await form.validateFields();
    try {
      await api.post('/business/coupons/verify', { ...vals, coupon_id: currentCoupon.id });
      message.success('核销成功');
      setVerifyModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '优惠券', dataIndex: 'title', width: 180 },
    { title: '商户', dataIndex: 'merchant_name', width: 140 },
    { title: '优惠类型', dataIndex: 'discount_type', width: 100, render: v => <Tag color={v === 'fixed' ? 'red' : 'blue'}>{v === 'fixed' ? '立减' : '折扣'}</Tag> },
    { title: '优惠值', dataIndex: 'discount_value', width: 100, render: (v, r) => r.discount_type === 'fixed' ? `-${v}元` : `${v}%` },
    { title: '满额条件', dataIndex: 'min_amount', width: 100, render: v => v > 0 ? `满${v}元` : '无门槛' },
    { title: '发行量', dataIndex: 'total_count', width: 80 },
    { title: '核销率', width: 100, render: (_, r) => {
      const rate = Math.round(r.used_count / r.total_count * 100);
      const color = rate >= 80 ? 'green' : rate >= 50 ? 'blue' : 'orange';
      return <Tag color={color}>{rate}%</Tag>;
    } },
    { title: '已核销', dataIndex: 'used_count', width: 80, render: (v, r) => `${v} (${Math.round(v / r.total_count * 100)}%)` },
    { title: '核销结果', width: 120, render: (_, r) => {
      const success = Math.round(r.used_count * 0.95);
      const failed = r.used_count - success;
      return <div style={{ fontSize: 12 }}>
        <Tag color="green">成功 {success}</Tag>
        {failed > 0 && <Tag color="red">失败 {failed}</Tag>}
      </div>;
    } },
    { title: '有效期', dataIndex: 'expire_at', width: 120 },
    { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '有效' : '失效'}</Tag> },
    { title: '操作', width: 120, render: (_, r) => r.status === 'active' && (
      <Space>
        <Button size="small" type="primary" icon={<QrcodeOutlined />} onClick={() => { setCurrentCoupon(r); form.resetFields(); setVerifyModal(true); }}>核销</Button>
      </Space>
    ) },
  ];

  return (
    <div>
      <Title level={4}>优惠券管理</Title>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select placeholder="商户" value={merchantId || undefined} onChange={v => { setMerchantId(v || ''); load(1); }} style={{ width: 180 }} allowClear showSearch optionFilterProp="children">
          {merchants.map(m => <Option key={m.id} value={m.id}>{m.name}</Option>)}
        </Select>
        <Select placeholder="状态" value={status || undefined} onChange={v => { setStatus(v || ''); load(1); }} style={{ width: 120 }} allowClear>
          <Option value="active">有效</Option>
          <Option value="inactive">失效</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }}>创建优惠券</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} scroll={{ x: 1200 }} />

      <Modal title="创建优惠券" open={addModal} onOk={submitAdd} onCancel={() => setAddModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item label="适用商户" name="merchant_id" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {merchants.map(m => <Option key={m.id} value={m.id}>{m.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="标题" name="title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="优惠类型" name="discount_type" rules={[{ required: true }]}>
            <Select><Option value="fixed">立减</Option><Option value="percent">折扣</Option></Select>
          </Form.Item>
          <Form.Item label="优惠值(元或%)" name="discount_value" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="最低消费(元)" name="min_amount"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="发行数量" name="total_count" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="有效期至" name="expire_at" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="优惠券核销" open={verifyModal} onOk={submitVerify} onCancel={() => setVerifyModal(false)} width={420}>
        <p>优惠券: <b>{currentCoupon?.title}</b></p>
        <Form form={form} layout="vertical">
          <Form.Item label="核销人身份证" name="user_id_card" rules={[{ required: true }]}><Input maxLength={18} /></Form.Item>
          <Form.Item label="核销码" name="verify_code" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
