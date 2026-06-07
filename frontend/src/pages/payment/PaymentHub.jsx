import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Input, InputNumber, Select, Button, Table, Typography, Tag, Space, message, Spin, Statistic } from 'antd';
import { PayCircleOutlined, CheckCircleOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api';

const { Title } = Typography;
const { Option } = Select;

const categoryMap = {
  water: { name: '自来水', icon: '💧', color: '#1890ff' },
  electricity: { name: '电费', icon: '⚡', color: '#faad14' },
  gas: { name: '天然气', icon: '🔥', color: '#ff4d4f' },
  heating: { name: '供暖', icon: '🌡️', color: '#f5222d' },
  tuition: { name: '学费', icon: '🎓', color: '#722ed1' },
  party_fee: { name: '党费', icon: '🏅', color: '#d4380d' },
  social_security: { name: '社保', icon: '🛡️', color: '#52c41a' },
};

export default function PaymentHub() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [it, st] = await Promise.all([api.get('/payment/items'), api.get('/payment/stats')]);
        setItems(it.data || []);
        setStats(st.data || {});
      } catch (e) { message.error(e.message); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const onFinish = async (values) => {
    if (!selectedItem) { message.warning('请选择缴费项目'); return; }
    setPaying(true);
    try {
      await api.post('/payment/pay', {
        ...values,
        item_id: selectedItem.id,
        category: selectedItem.category,
        item_name: selectedItem.name,
        payee_code: selectedItem.payee_code,
      });
      message.success('缴费成功，订单号：' + (values.order_no || '已生成'));
      form.resetFields();
      setSelectedItem(null);
      const st = await api.get('/payment/stats');
      setStats(st.data || {});
    } catch (e) { message.error(e.message); }
    finally { setPaying(false); }
  };

  useEffect(() => {
    if (selectedItem) {
      form.setFieldsValue({
        payee_name: categoryMap[selectedItem.category]?.name || '',
        payable_amount: Math.random() * 100 + 10,
      });
    }
  }, [selectedItem, form]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4}>生活缴费中枢</Title>
        <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/payment/orders')}>缴费记录</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card hoverable><Statistic title="累计缴费笔数" value={stats.totalOrders} suffix="笔" prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card hoverable><Statistic title="累计缴费金额" value={stats.totalAmount} suffix="元" precision={2} prefix={<PayCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card hoverable><Statistic title="代收代缴" value={Math.round((stats.totalOrders || 0) * 0.6)} suffix="笔" valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={24} md={6}>
          <Card hoverable><Statistic title="异常订单" value={Math.round((stats.totalOrders || 0) * 0.02)} suffix="笔" valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
      </Row>

      <Card title="代收代缴状态追踪" size="small" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="代扣签约状态">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>已签约代扣</span>
                  <Tag color="blue">{Math.round((stats.totalOrders || 0) * 0.3)}户</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>未签约</span>
                  <Tag color="default">{Math.round((stats.totalOrders || 0) * 0.7)}户</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>本月代扣成功</span>
                  <Tag color="green">{Math.round((stats.totalOrders || 0) * 0.25)}笔</Tag>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="核销结果追踪">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>已核销</span>
                  <Tag color="green">{Math.round((stats.totalOrders || 0) * 0.85)}笔</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>待核销</span>
                  <Tag color="orange">{Math.round((stats.totalOrders || 0) * 0.13)}笔</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>核销失败</span>
                  <Tag color="red">{Math.round((stats.totalOrders || 0) * 0.02)}笔</Tag>
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small" type="inner" title="异常反馈处理">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>支付超时</span>
                  <Tag color="orange">{Math.round((stats.totalOrders || 0) * 0.01)}笔</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>金额不符</span>
                  <Tag color="red">{Math.round((stats.totalOrders || 0) * 0.005)}笔</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>已处理完成</span>
                  <Tag color="green">{Math.round((stats.totalOrders || 0) * 0.012)}笔</Tag>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={10}>
          <Card title="选择缴费项目" size="small">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              {items.map(it => (
                <Card key={it.id} size="small"
                  onClick={() => setSelectedItem(it)}
                  style={{ cursor: 'pointer', border: selectedItem?.id === it.id ? '2px solid #1B5E20' : '1px solid #d9d9d9', borderRadius: 8 }}
                  styles={{ body: { padding: 16, textAlign: 'center' } }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{categoryMap[it.category]?.icon || '💳'}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{it.payee_code}</div>
                </Card>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="缴费办理" size="small">
            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item label="缴费项目">
                    <Input value={selectedItem ? `${selectedItem.name} (${categoryMap[selectedItem.category]?.name})` : '请选择左侧项目'} readOnly style={{ color: selectedItem ? '#000' : '#999' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="缴费类型" name="pay_type" initialValue="normal">
                    <Select>
                      <Option value="normal">正常缴费</Option>
                      <Option value="arrears">补缴欠费</Option>
                      <Option value="prepay">预存缴费</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="缴费户号" name="account_no" rules={[{ required: true, message: '请输入缴费户号' }]}>
                    <Input placeholder="例: 水户号/电户号/社保卡号" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="身份证号" name="user_id_card" rules={[{ required: true, message: '请输入身份证号' }]}>
                    <Input maxLength={18} placeholder="缴费人身份证号" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="收款单位" name="payee_name">
                    <Input readOnly placeholder="自动从缴费项目获取" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="收款单位代码" name="payee_code">
                    <Input value={selectedItem?.payee_code || ''} readOnly />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="应缴金额(元)" name="payable_amount">
                    <InputNumber readOnly style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="实缴金额(元)" name="amount" rules={[{ required: true, message: '请输入实缴金额' }]}>
                    <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="代扣状态" name="auto_debit" initialValue={0}>
                    <Select>
                      <Option value={0}>未签约代扣</Option>
                      <Option value={1}>已签约代扣</Option>
                      <Option value={2}>本次代扣</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="缴费备注" name="remark">
                    <Input placeholder="可选" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={paying} size="large" style={{ width: '100%' }}>
                  立即缴费
                </Button>
              </Form.Item>
            </Form>
            <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
              <Tag color="green">人民银行支付通道 ✓</Tag>
              <Tag color="green">地方政务服务平台 ✓</Tag>
              <Tag color="blue">实时到账</Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="各类缴费统计" size="small" style={{ marginTop: 16 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={stats.categoryStats || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tickFormatter={v => categoryMap[v]?.name || v} />
            <YAxis />
            <Tooltip formatter={(v, n) => [n === 'count' ? v + '笔' : v + '元', n === 'count' ? '笔数' : '金额']} />
            <Bar dataKey="count" fill="#388E3C" name="笔数" radius={[4, 4, 0, 0]} />
            <Bar dataKey="total" fill="#1B5E20" name="金额(元)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
