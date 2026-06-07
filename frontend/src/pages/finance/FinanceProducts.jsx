import React, { useEffect, useState } from 'react';
import { Table, Button, Select, Tag, Space, Modal, Form, Input, InputNumber, message, Typography, Spin, Card, Descriptions } from 'antd';
import { PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

const typeMap = { huinong: '惠农贷', machine: '农机购置贷', livestock: '活体抵押贷', merchant: '小微商户贷' };
const typeColor = { huinong: 'green', machine: 'blue', livestock: 'orange', merchant: 'purple' };

export default function FinanceProducts() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [productType, setProductType] = useState('');
  const [detailModal, setDetailModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [form] = Form.useForm();

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, pageSize: 10 };
      if (productType) params.product_type = productType;
      const res = await api.get('/finance/products', { params });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) { message.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitAdd = async () => {
    const vals = await form.validateFields();
    try {
      await api.post('/finance/products', { ...vals, risk_rules: JSON.stringify({ min_credit_score: vals.min_credit_score || 600, collateral_required: !!vals.collateral_required }) });
      message.success('金融产品创建成功');
      setAddModal(false);
      load();
    } catch (e) { message.error(e.message); }
  };

  const parseRules = (r) => {
    try { return JSON.parse(r); } catch { return {}; }
  };

  const columns = [
    { title: '产品编码', dataIndex: 'code', width: 120 },
    { title: '产品名称', dataIndex: 'name', width: 140 },
    { title: '类型', dataIndex: 'product_type', width: 130, render: v => <Tag color={typeColor[v]}>{typeMap[v]}</Tag> },
    { title: '最高额度(元)', dataIndex: 'max_amount', width: 130, render: v => v?.toLocaleString() },
    { title: '年利率(%)', dataIndex: 'annual_rate', width: 100, render: v => v?.toFixed(2) },
    { title: '最长期限(月)', dataIndex: 'max_periods', width: 100 },
    { title: '状态', dataIndex: 'status', width: 80, render: v => <Tag color={v === 'active' ? 'green' : 'default'}>{v === 'active' ? '在售' : '停售'}</Tag> },
    { title: '操作', width: 100, render: (_, r) => <Button size="small" icon={<InfoCircleOutlined />} onClick={() => { setCurrentProduct(r); setDetailModal(true); }}>详情</Button> },
  ];

  return (
    <div>
      <Title level={4}>农村金融产品工厂</Title>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Select placeholder="产品类型" value={productType || undefined} onChange={v => { setProductType(v || ''); load(1); }} style={{ width: 150 }} allowClear>
          <Option value="huinong">惠农贷</Option>
          <Option value="machine">农机购置贷</Option>
          <Option value="livestock">活体抵押贷</Option>
          <Option value="merchant">小微商户贷</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setAddModal(true); }}>创建产品</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading}
        pagination={{ current: page, total, pageSize: 10, onChange: p => { setPage(p); load(p); } }} />

      <Modal title="产品详情" open={detailModal} onCancel={() => setDetailModal(false)} footer={null} width={600}>
        {currentProduct && (
          <Card size="small">
            <Descriptions column={2} size="small" title={currentProduct.name}>
              <Descriptions.Item label="产品编码">{currentProduct.code}</Descriptions.Item>
              <Descriptions.Item label="类型">{typeMap[currentProduct.product_type]}</Descriptions.Item>
              <Descriptions.Item label="最高额度">{currentProduct.max_amount.toLocaleString()}元</Descriptions.Item>
              <Descriptions.Item label="年利率">{currentProduct.annual_rate}%</Descriptions.Item>
              <Descriptions.Item label="最长期限">{currentProduct.max_periods}个月</Descriptions.Item>
              <Descriptions.Item label="状态">{currentProduct.status === 'active' ? '在售' : '停售'}</Descriptions.Item>
            </Descriptions>
            <Card size="small" title="风控规则" style={{ marginTop: 12 }}>
              <pre style={{ whiteSpace: 'pre-wrap', margin: 0, background: '#f6ffed', padding: 12, borderRadius: 4 }}>
                {JSON.stringify(parseRules(currentProduct.risk_rules), null, 2)}
              </pre>
            </Card>
          </Card>
        )}
      </Modal>

      <Modal title="创建金融产品" open={addModal} onOk={submitAdd} onCancel={() => setAddModal(false)} width={500}>
        <Form form={form} layout="vertical">
          <Form.Item label="产品编码" name="code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="产品名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="产品类型" name="product_type" rules={[{ required: true }]}>
            <Select><Option value="huinong">惠农贷</Option><Option value="machine">农机购置贷</Option><Option value="livestock">活体抵押贷</Option><Option value="merchant">小微商户贷</Option></Select>
          </Form.Item>
          <Form.Item label="最高额度(元)" name="max_amount" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="年利率(%)" name="annual_rate" rules={[{ required: true }]}><InputNumber min={0} step={0.01} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="最长期限(月)" name="max_periods" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="最低信用分" name="min_credit_score"><InputNumber min={300} max={1000} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="是否需抵押" name="collateral_required">
            <Select><Option value={false}>否</Option><Option value={true}>是</Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
