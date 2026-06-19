import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Form, InputNumber, Button, List, Spin, message, Modal } from 'antd';
import { WalletOutlined, LockOutlined, DollarOutlined, GiftOutlined } from '@ant-design/icons';
import api from '../api';

interface WalletData {
  totalBalance: number;
  frozenAmount: number;
  earnedTotal: number;
}

interface RedPacket {
  id: string;
  amount: number;
  status: 'pending' | 'claimed' | 'expired';
  description: string;
  expiresAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const Wallet: React.FC = () => {
  const [wallet, setWallet] = useState<WalletData>({ totalBalance: 0, frozenAmount: 0, earnedTotal: 0 });
  const [redPackets, setRedPackets] = useState<RedPacket[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [walletRes, redPacketsRes, transactionsRes] = await Promise.all([
          api.get('/wallet'),
          api.get('/wallet/red-packets'),
          api.get('/wallet/transactions'),
        ]);
        setWallet(walletRes.data);
        setRedPackets(redPacketsRes.data.items || []);
        setTransactions(transactionsRes.data.items || []);
      } catch {
        setWallet({ totalBalance: 358.5, frozenAmount: 50, earnedTotal: 1200 });
        setRedPackets([
          { id: '1', amount: 10, status: 'pending', description: '新人红包', expiresAt: '2026-06-30T23:59:59Z' },
          { id: '2', amount: 5, status: 'claimed', description: '签到奖励', expiresAt: '2026-06-20T23:59:59Z' },
          { id: '3', amount: 8, status: 'expired', description: '活动红包', expiresAt: '2026-06-10T23:59:59Z' },
        ]);
        setTransactions([
          { id: '1', type: 'income', amount: 5, description: '发帖奖励', createdAt: '2026-06-19T10:00:00Z' },
          { id: '2', type: 'income', amount: 68, description: '订单收入', createdAt: '2026-06-18T14:00:00Z' },
          { id: '3', type: 'withdraw', amount: -100, description: '提现', createdAt: '2026-06-17T09:00:00Z' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleWithdraw = async (values: { amount: number }) => {
    if (values.amount > wallet.totalBalance - wallet.frozenAmount) {
      message.warning('可提现金额不足');
      return;
    }
    setWithdrawing(true);
    try {
      await api.post('/wallet/withdraw', values);
      message.success('提现申请已提交');
      form.resetFields();
    } catch {
      message.error('提现失败');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleClaimRedPacket = async (id: string) => {
    try {
      await api.post(`/wallet/red-packets/${id}/claim`);
      setRedPackets((prev) => prev.map((rp) => rp.id === id ? { ...rp, status: 'claimed' as const } : rp));
      message.success('红包已领取');
    } catch {
      message.error('领取失败');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const rpStatusMap: Record<string, { label: string; color: string }> = {
    pending: { label: '待领取', color: 'gold' },
    claimed: { label: '已领取', color: 'green' },
    expired: { label: '已过期', color: 'default' },
  };

  const txColumns = [
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#52c41a' : '#f50', fontWeight: 'bold' }}>
          {v >= 0 ? '+' : ''}{v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('zh-CN'),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="账户余额" value={wallet.totalBalance} prefix="¥" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="冻结金额" value={wallet.frozenAmount} prefix={<LockOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="累计收入" value={wallet.earnedTotal} prefix={<DollarOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title={<span><GiftOutlined /> 红包列表</span>}>
            <List
              dataSource={redPackets}
              renderItem={(rp) => (
                <List.Item
                  actions={[
                    rp.status === 'pending' ? (
                      <Button type="primary" size="small" onClick={() => handleClaimRedPacket(rp.id)}>领取</Button>
                    ) : (
                      <Tag color={rpStatusMap[rp.status]?.color}>{rpStatusMap[rp.status]?.label}</Tag>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    title={`${rp.description} — ¥${rp.amount}`}
                    description={`有效期至 ${new Date(rp.expiresAt).toLocaleDateString('zh-CN')}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span><WalletOutlined /> 提现</span>}>
            <Form form={form} onFinish={handleWithdraw} layout="vertical">
              <Form.Item name="amount" label="提现金额" rules={[{ required: true, message: '请输入提现金额' }]}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={wallet.totalBalance - wallet.frozenAmount}
                  prefix="¥"
                  placeholder="请输入金额"
                />
              </Form.Item>
              <div style={{ color: '#faad14', marginBottom: 16, fontSize: 12 }}>
                ⚠️ 每日提现限额 ¥5000，可提现余额: ¥{(wallet.totalBalance - wallet.frozenAmount).toFixed(2)}
              </div>
              <Button type="primary" htmlType="submit" loading={withdrawing} block>
                申请提现
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card title="交易记录">
        <Table
          dataSource={transactions}
          columns={txColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Wallet;
