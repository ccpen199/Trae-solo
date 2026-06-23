import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Modal, Form, Radio, message, Space, Statistic, Row, Col } from 'antd';
import { WechatOutlined, AlipayCircleOutlined } from '@ant-design/icons';
import api from '../api';
import dayjs from 'dayjs';

export default function Bills() {
  const [bills, setBills] = useState<any[]>([]);
  const [payModal, setPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const loadData = () => {
    api.get('/bills').then((res) => setBills(res.data));
  };

  useEffect(() => { loadData(); }, []);

  const handlePay = async (values: any) => {
    if (!selectedBill) return;
    try {
      setLoading(true);
      await api.post(`/bills/${selectedBill.id}/pay`, { paymentMethod: values.method });
      message.success('缴费成功');
      setPayModal(false);
      loadData();
    } catch (err: any) {
      message.error(err.response?.data?.message || '缴费失败');
    } finally {
      setLoading(false);
    }
  };

  const unpaidCount = bills.filter((b) => b.status === 'unpaid').length;
  const totalUnpaid = bills.filter((b) => b.status === 'unpaid').reduce((s, b) => s + Number(b.amount), 0);

  const columns = [
    { title: '账单类型', dataIndex: 'type', render: (t: string) => t === 'property' ? '物业费' : t },
    { title: '账期', dataIndex: 'period' },
    { title: '金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>¥{v}</span> },
    { title: '截止日期', dataIndex: 'dueDate' },
    {
      title: '状态', dataIndex: 'status',
      render: (s: string) => s === 'paid' ? <Tag color="green">已缴费</Tag> : <Tag color="red">待缴费</Tag>,
    },
    { title: '缴费时间', dataIndex: 'paidAt', render: (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '支付方式', dataIndex: 'paymentMethod', render: (m: string) => m === 'wechat' ? '微信' : m === 'alipay' ? '支付宝' : '-' },
    {
      title: '操作',
      render: (_: any, record: any) =>
        record.status === 'unpaid' ? (
          <Button type="primary" size="small" onClick={() => { setSelectedBill(record); setPayModal(true); }}>
            去缴费
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="待缴账单" value={unpaidCount} suffix="笔" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="待缴金额" value={totalUnpaid} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Card title="缴费记录" style={{ borderRadius: 12 }}>
        <Table columns={columns} dataSource={bills} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="在线缴费"
        open={payModal}
        onCancel={() => setPayModal(false)}
        footer={null}
      >
        {selectedBill && (
          <Form form={form} onFinish={handlePay} layout="vertical">
            <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>账单类型：{selectedBill.type === 'property' ? '物业费' : selectedBill.type}</span>
                <span>账期：{selectedBill.period}</span>
              </div>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <div style={{ color: '#888' }}>应缴金额</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#ff4d4f' }}>¥{selectedBill.amount}</div>
              </div>
            </Card>
            <Form.Item name="method" label="选择支付方式" initialValue="wechat" rules={[{ required: true }]}>
              <Radio.Group>
                <Radio.Button value="wechat" style={{ padding: '8px 24px' }}>
                  <Space><WechatOutlined style={{ color: '#07c160' }} />微信支付</Space>
                </Radio.Button>
                <Radio.Button value="alipay" style={{ padding: '8px 24px' }}>
                  <Space><AlipayCircleOutlined style={{ color: '#1677ff' }} />支付宝</Space>
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading} size="large">
                确认支付
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
