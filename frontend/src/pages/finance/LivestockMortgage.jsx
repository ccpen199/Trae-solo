import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, InputNumber, Select, message, Typography, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

export default function LivestockMortgage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loans, setLoans] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [ls, ln] = await Promise.all([
        api.get('/finance/livestocks'),
        api.get('/finance/loans', { params: { status: 'pending', page: 1, pageSize: 100 } }),
      ]);
      setData(ls.data || []);
      setLoans((ln.data || []).filter(l => l.collateral_type === 'livestock'));
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    const vals = await form.validateFields();
    try {
      await api.post('/finance/livestocks', vals);
      message.success('活体抵押登记成功');
      setAddModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const columns = [
    { title: '登记号', dataIndex: 'registration_no', width: 140 },
    { title: '贷款申请', dataIndex: 'user_name', width: 120 },
    { title: '产品', dataIndex: 'product_name', width: 130 },
    { title: '畜禽类型', dataIndex: 'livestock_type', width: 100 },
    { title: '数量', dataIndex: 'quantity', width: 80, render: v => `${v}头/只` },
    { title: '单位估值(元)', dataIndex: 'unit_value', width: 110, render: v => v?.toLocaleString() },
    { title: '总估值(元)', dataIndex: 'total_value', width: 120, render: v => v?.toLocaleString() },
    { title: '耳标范围', dataIndex: 'ear_tag', width: 180 },
    { title: '状态', dataIndex: 'status', width: 100, render: v => <Tag color="green">{v}</Tag> },
    { title: '登记时间', dataIndex: 'registered_at', width: 170 },
  ];

  return (
    <div>
      <Title level={4}>活体抵押登记</Title>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }} disabled={loans.length === 0}>
          新增登记
        </Button>
        {loans.length === 0 && <span style={{ color: '#999' }}>暂无可登记的活体抵押类贷款申请</span>}
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1300 }} />

      <Modal title="活体抵押登记" open={addModal} onOk={submitAdd} onCancel={() => setAddModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item label="关联贷款申请" name="loan_id" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children">
              {loans.map(l => <Option key={l.id} value={l.id}>{l.user_name} - 申请{l.apply_amount.toLocaleString()}元</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="畜禽类型" name="livestock_type" rules={[{ required: true }]}>
            <Select><Option value="肉牛">肉牛</Option><Option value="奶牛">奶牛</Option><Option value="生猪">生猪</Option><Option value="肉羊">肉羊</Option><Option value="家禽">家禽</Option></Select>
          </Form.Item>
          <Form.Item label="数量(头/只)" name="quantity" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="单位估值(元)" name="unit_value" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="耳标编号范围" name="ear_tag" rules={[{ required: true }]}><Input placeholder="例: ET-2026-001~050" /></Form.Item>
          <Form.Item label="登记编号" name="registration_no" rules={[{ required: true }]}><Input placeholder="例: LH-REG-2026-001" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
