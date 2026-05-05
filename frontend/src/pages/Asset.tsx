import React, { useState, useEffect } from 'react';
import { Card, Statistic, Button, Table, Modal, Form, Input, message, Tabs, TabsProps, Tag, Space } from 'antd';
import { MoneyCollectOutlined, WalletOutlined, RiseOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { assetApi } from '../api';
import type { ColumnsType } from 'antd/es/table';

interface AssetOverview {
  accountBalance: { available: number; frozen: number; total: number };
  fundShare: {
    totalShares: number;
    availableShares: number;
    frozenShares: number;
    nav: number;
    totalAmount: number;
    availableAmount: number;
  };
  totalIncome: number;
  totalAsset: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  shares?: number;
  status: string;
  description?: string;
  createdAt: string;
}

const Asset: React.FC = () => {
  const [overview, setOverview] = useState<AssetOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const response = await assetApi.getOverview();
      if (response.data.success) {
        setOverview(response.data.data);
      }
    } catch (error) {
      message.error('获取资产信息失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handlePurchase = async (values: { amount: string; fromAccount: string }) => {
    setPurchaseLoading(true);
    try {
      const response = await assetApi.purchase({
        amount: parseFloat(values.amount),
        fromAccount: values.fromAccount as 'BALANCE' | 'BANK_CARD',
      });
      if (response.data.success) {
        message.success('购买成功');
        setPurchaseModalVisible(false);
        form.resetFields();
        fetchOverview();
      } else {
        message.error(response.data.error || '购买失败');
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '购买失败');
    } finally {
      setPurchaseLoading(false);
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      PURCHASE: { text: '购买', color: 'green' },
      REDEEM: { text: '赎回', color: 'orange' },
      PAYMENT: { text: '支付', color: 'red' },
      REFUND: { text: '退款', color: 'blue' },
      INCOME: { text: '收益', color: 'gold' },
      WITHDRAW: { text: '提现', color: 'orange' },
    };
    return labels[type] || { text: type, color: 'default' };
  };

  const transactionColumns: ColumnsType<Transaction> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const label = getTransactionTypeLabel(type);
        return <Tag color={label.color}>{label.text}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount > 0 ? '+' : ''}{amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: '份额',
      dataIndex: 'shares',
      key: 'shares',
      render: (shares?: number) => (shares ? shares.toFixed(4) : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          SUCCESS: 'success',
          FAILED: 'error',
          PENDING: 'processing',
          PROCESSING: 'processing',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ];

  const TransactionList: React.FC<{ type: 'all' | 'in' | 'out' }> = ({ type }) => {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          let response;
          if (type === 'in') {
            response = await assetApi.getTransferIn();
          } else if (type === 'out') {
            response = await assetApi.getTransferOut();
          } else {
            response = await assetApi.getTransactions();
          }
          if (response.data.success) {
            setData(response.data.data.transactions || []);
          }
        } catch (error) {
          console.error('获取交易记录失败', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, [type]);

    return (
      <Table
        columns={transactionColumns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
    );
  };

  const tabItems: TabsProps['items'] = [
    {
      key: 'all',
      label: '全部记录',
      children: <TransactionList type="all" />,
    },
    {
      key: 'in',
      label: '转入明细',
      children: <TransactionList type="in" />,
    },
    {
      key: 'out',
      label: '转出明细',
      children: <TransactionList type="out" />,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title="资产总览" loading={loading}>
        <div style={{ marginBottom: 24 }}>
          <Statistic
            title="总资产(元)"
            value={overview?.totalAsset || 0}
            valueStyle={{ color: '#1890ff', fontSize: 32 }}
            prefix={<MoneyCollectOutlined />}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          <Card size="small">
            <Statistic
              title="账户余额(元)"
              value={overview?.accountBalance.available || 0}
              valueStyle={{ fontSize: 18 }}
              prefix={<WalletOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
          <Card size="small">
            <Statistic
              title="基金份额(元)"
              value={overview?.fundShare.availableAmount || 0}
              valueStyle={{ fontSize: 18 }}
              prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
            />
            <div style={{ fontSize: 12, color: '#666' }}>
              {overview?.fundShare.availableShares.toFixed(4)} 份 | 净值 {overview?.fundShare.nav.toFixed(4)}
            </div>
          </Card>
          <Card size="small">
            <Statistic
              title="累计收益(元)"
              value={overview?.totalIncome || 0}
              valueStyle={{ fontSize: 18, color: '#faad14' }}
              prefix={<ArrowUpOutlined />}
            />
          </Card>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowDownOutlined />}
            onClick={() => setPurchaseModalVisible(true)}
          >
            快速购买
          </Button>
          <Button size="large" icon={<ArrowUpOutlined />}>
            定投设置
          </Button>
        </div>
      </Card>

      <Card title="交易记录" style={{ marginTop: 24 }}>
        <Tabs defaultActiveKey="all" items={tabItems} />
      </Card>

      <Modal
        title="购买货币基金"
        open={purchaseModalVisible}
        onCancel={() => setPurchaseModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handlePurchase} layout="vertical">
          <Form.Item
            name="amount"
            label="购买金额(元)"
            rules={[
              { required: true, message: '请输入购买金额' },
              { pattern: /^\d+(\.\d{1,2})?$/, message: '金额格式不正确' },
            ]}
          >
            <Input placeholder="请输入购买金额" prefix="¥" />
          </Form.Item>
          <Form.Item
            name="fromAccount"
            label="付款方式"
            initialValue="BALANCE"
          >
            <select className="ant-select" style={{ width: '100%', height: 32, padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}>
              <option value="BALANCE">账户余额</option>
              <option value="BANK_CARD">银行卡</option>
            </select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={purchaseLoading} block>
              确认购买
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Asset;
