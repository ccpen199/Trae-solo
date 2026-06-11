import { useState } from 'react';
import { Button, Card, Col, Form, Input, Row, Select, Space, Table, Tag, Typography, message } from 'antd';
import { PayCircleOutlined } from '@ant-design/icons';
import { payBill, queryBills, type Bill } from '@/services/payment';
import { PAYMENT_TYPES } from '@/utils/constants';

const { Title, Paragraph, Text } = Typography;

export default function Payment() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (values: { type: string; accountNo: string }) => {
    setLoading(true);
    try {
      setBills(await queryBills(values.type, values.accountNo));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (billId: string) => {
    await payBill(billId, 'wallet');
    message.success('缴费成功');
    setBills((current) => current.map((item) => item.id === billId ? { ...item, status: 'paid' } : item));
  };

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100%' }}>
      <Title level={2} style={{ color: '#1B5E20' }}>便民缴费</Title>
      <Paragraph type="secondary">水、电、燃气、暖气账单查询与在线支付。</Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {PAYMENT_TYPES.map((item) => (
          <Col xs={12} md={6} key={item.key}>
            <Card>
              <Space>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <Text strong>{item.label}</Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Form layout="inline" onFinish={handleQuery} initialValues={{ type: 'water', accountNo: 'GZ-88001234' }}>
          <Form.Item name="type" rules={[{ required: true }]}>
            <Select
              style={{ width: 160 }}
              options={PAYMENT_TYPES.map((item) => ({ label: item.label, value: item.key }))}
            />
          </Form.Item>
          <Form.Item name="accountNo" rules={[{ required: true, message: '请输入缴费户号' }]}>
            <Input prefix={<PayCircleOutlined />} placeholder="缴费户号" style={{ width: 220 }} />
          </Form.Item>
          <Button type="primary" htmlType="submit">查询账单</Button>
        </Form>
      </Card>

      <Card title="账单列表">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={bills}
          pagination={false}
          columns={[
            { title: '户号', dataIndex: 'accountNo' },
            { title: '周期', dataIndex: 'period' },
            { title: '金额', dataIndex: 'amount', render: (value: number) => `¥${value.toFixed(2)}` },
            { title: '截止日期', dataIndex: 'dueDate' },
            { title: '状态', dataIndex: 'status', render: (status: Bill['status']) => <Tag color={status === 'paid' ? 'green' : 'orange'}>{status === 'paid' ? '已缴费' : '待缴费'}</Tag> },
            { title: '操作', render: (_, record: Bill) => <Button disabled={record.status === 'paid'} onClick={() => handlePay(record.id)}>立即缴费</Button> },
          ]}
        />
      </Card>
    </div>
  );
}
