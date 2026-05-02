import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Statistic, Descriptions, Empty, Spin, Divider, Table, Row, Col } from 'antd';
import { 
  WalletOutlined, 
  DollarOutlined, 
  ArrowUpOutlined,
  ArrowDownOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import dayjs from 'dayjs';

const Wallet = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/wallet/balance');
      if (response.success) {
        setWallet(response);
      }
    } catch (error) {
      console.error('获取钱包信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/api/wallet/transactions?limit=50');
      if (response.success) {
        setTransactions(response.transactions || []);
        const income = response.transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) || 0;
        setTotalIncome(income);
      }
    } catch (error) {
      console.error('获取交易记录失败:', error);
    }
  };

  const getTransactionTypeText = (type) => {
    const typeMap = {
      payment: { text: '支付咨询费', color: 'red', icon: <ArrowUpOutlined /> },
      commission: { text: '咨询费收入', color: 'green', icon: <ArrowDownOutlined /> },
      refund: { text: '退款', color: 'green', icon: <ArrowDownOutlined /> },
      withdraw: { text: '提现', color: 'orange', icon: <ArrowUpOutlined /> },
      deposit: { text: '充值', color: 'green', icon: <ArrowDownOutlined /> },
      bonus: { text: '奖励', color: 'gold', icon: <DollarOutlined /> }
    };
    return typeMap[type] || { text: type, color: 'default', icon: <FileTextOutlined /> };
  };

  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
      width: 180
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeInfo = getTransactionTypeText(type);
        return (
          <Tag color={typeInfo.color}>
            {typeInfo.icon} {typeInfo.text}
          </Tag>
        );
      },
      width: 120
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {amount >= 0 ? '+' : ''}{amount.toFixed(2)} 元
        </span>
      ),
      width: 120
    },
    {
      title: '变更前余额',
      dataIndex: 'balance_before',
      key: 'balance_before',
      render: (amount) => `${amount?.toFixed(2) || 0} 元`,
      width: 120
    },
    {
      title: '变更后余额',
      dataIndex: 'balance_after',
      key: 'balance_after',
      render: (amount) => `${amount?.toFixed(2) || 0} 元`,
      width: 120
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
      ellipsis: true
    }
  ];

  if (loading && !wallet) {
    return <Spin tip="加载中..." style={{ display: 'flex', justifyContent: 'center', padding: '40px' }} />;
  }

  return (
    <div>
      <Card title="我的钱包">
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="账户余额"
                value={wallet?.balance || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总收入"
                value={totalIncome || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="冻结金额"
                value={wallet?.frozen_balance || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="累计提现"
                value={wallet?.total_withdraw || 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="账户说明" size="small" style={{ marginBottom: '24px' }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="账户类型">
              {user?.role === 'lawyer' ? '律师账户' : user?.role === 'client' ? '用户账户' : '平台账户'}
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">
              {user?.id}
            </Descriptions.Item>
            <Descriptions.Item label="用户名">
              {user?.username}
            </Descriptions.Item>
            <Descriptions.Item label="真实姓名">
              {user?.realName || '未实名认证'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Divider>交易记录</Divider>
        {transactions.length > 0 ? (
          <Table
            dataSource={transactions}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showTotal: (total) => `共 ${total} 条记录`,
              showSizeChanger: true
            }}
          />
        ) : (
          <Empty description="暂无交易记录" style={{ padding: '40px' }} />
        )}
      </Card>

      <Card title="收益说明" style={{ marginTop: '24px' }}>
        <div style={{ padding: '16px', background: '#f0f5ff', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '12px' }}>分成规则</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>律师分成：80%（即每笔咨询费的 80% 归律师所有）</li>
            <li>平台服务费：20%（包含系统维护、推广运营等费用）</li>
            <li>税费：已包含在平台服务费和律师分成中</li>
          </ul>
          
          <h4 style={{ margin: '16px 0 12px 0' }}>结算规则</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>用户确认咨询建议并完成评价后，系统自动结算</li>
            <li>律师可随时查看账户余额和交易记录</li>
            <li>提现功能即将上线，敬请期待</li>
          </ul>

          <h4 style={{ margin: '16px 0 12px 0' }}>争议处理</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>如用户对咨询服务有异议，可在7天内发起争议</li>
            <li>平台客服将在1-3个工作日内介入处理</li>
            <li>根据争议结果，可能会影响分成比例或进行退款</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default Wallet;
