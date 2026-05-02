import React, { useEffect, useState } from 'react';
import { Card, Statistic, Table, Descriptions, Tag, Empty } from 'antd';
import {
  WalletOutlined,
  RiseOutlined,
  TransactionOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Wallet, Transaction } from '../../types';
import api from '../../utils/api';

const WalletPage: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWalletInfo();
    fetchTransactions();
  }, []);

  const fetchWalletInfo = async () => {
    try {
      const response = await api.get('/workers/wallet');
      setWallet(response.data);
    } catch (error) {
      console.error('获取钱包信息失败', error);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/workers/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('获取交易记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '交易ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        if (type === 'income') {
          return <Tag color="green">收入</Tag>;
        }
        return <Tag color="orange">支出</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: Transaction) => (
        <span style={{ 
          color: record.type === 'income' ? '#52c41a' : '#fa8c16',
          fontWeight: 'bold'
        }}>
          {record.type === 'income' ? '+' : '-'}{'¥'}
          {amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: '变动前余额',
      dataIndex: 'balance_before',
      key: 'balance_before',
      width: 120,
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '变动后余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      width: 120,
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (val: string) => new Date(val).toLocaleString('zh-CN'),
    },
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>我的钱包</h1>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions bordered column={4}>
          <Descriptions.Item label="钱包余额">
            <Statistic
              value={wallet?.balance || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#1890ff' }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="累计收入">
            <Statistic
              value={wallet?.total_income || 0}
              precision={2}
              prefix={<RiseOutlined />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="累计提现">
            <Statistic
              value={wallet?.total_withdraw || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            {wallet?.updated_at ? new Date(wallet.updated_at).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={<span><HistoryOutlined style={{ marginRight: 8 }} />交易记录</span>}>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          locale={{
            emptyText: (
              <Empty
                description="暂无交易记录"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default WalletPage;
