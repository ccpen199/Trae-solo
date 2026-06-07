import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Statistic, Card, Row, Col, Divider } from 'antd';
import { WalletOutlined, CreditCardOutlined, DollarOutlined, TransactionOutlined, PlusOutlined } from '@ant-design/icons';
import { walletApi, audiencesApi } from '../api';

const cardTypeMap = {
  personal: { color: 'blue', label: 'Personal' },
  enterprise: { color: 'orange', label: 'Enterprise' },
};

const statusMap = {
  active: { color: 'green', label: 'Active' },
  frozen: { color: 'blue', label: 'Frozen' },
  closed: { color: 'red', label: 'Closed' },
};

const txnTypeMap = {
  recharge: { color: 'green', label: 'Recharge' },
  consume: { color: 'red', label: 'Consume' },
  refund: { color: 'blue', label: 'Refund' },
  freeze: { color: 'default', label: 'Freeze' },
  unfreeze: { color: 'cyan', label: 'Unfreeze' },
  enterprise_grant: { color: 'purple', label: 'Enterprise Grant' },
};

function Wallet() {
  const [audiences, setAudiences] = useState([]);
  const [selectedAudience, setSelectedAudience] = useState(undefined);
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txnLoading, setTxnLoading] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [rechargeForm] = Form.useForm();
  const [consumeForm] = Form.useForm();
  const [grantForm] = Form.useForm();

  useEffect(() => {
    audiencesApi.list().then((res) => {
      setAudiences(res.items || res.data || res || []);
    }).catch((err) => message.error(err.message));
  }, []);

  const fetchCards = async (audienceId) => {
    if (!audienceId) {
      setCards([]);
      setSelectedCard(null);
      setTransactions([]);
      return;
    }
    setCardsLoading(true);
    try {
      const res = await walletApi.cards(audienceId);
      setCards(res.items || res.data || res || []);
      setSelectedCard(null);
      setTransactions([]);
    } catch (err) {
      message.error(err.message);
    } finally {
      setCardsLoading(false);
    }
  };

  const handleAudienceChange = (val) => {
    setSelectedAudience(val);
    fetchCards(val);
  };

  const fetchTransactions = async (card) => {
    setSelectedCard(card);
    setTxnLoading(true);
    try {
      const res = await walletApi.transactions(card.id);
      setTransactions(res.items || res.data || res || []);
    } catch (err) {
      message.error(err.message);
    } finally {
      setTxnLoading(false);
    }
  };

  const handleRecharge = async () => {
    try {
      const values = await rechargeForm.validateFields();
      await walletApi.recharge({ card_id: selectedCard.id, amount: values.amount });
      message.success('Recharged');
      setRechargeOpen(false);
      fetchCards(selectedAudience);
      fetchTransactions(selectedCard);
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleConsume = async () => {
    try {
      const values = await consumeForm.validateFields();
      await walletApi.consume({
        card_id: selectedCard.id,
        amount: values.amount,
        order_id: values.order_id,
        remark: values.remark,
      });
      message.success('Consumed');
      setConsumeOpen(false);
      fetchCards(selectedAudience);
      fetchTransactions(selectedCard);
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const handleGrant = async () => {
    try {
      const values = await grantForm.validateFields();
      await walletApi.enterpriseGrant({
        card_id: selectedCard.id,
        amount: values.amount,
        enterprise_id: values.enterprise_id,
        remark: values.remark,
      });
      message.success('Grant succeeded');
      setGrantOpen(false);
      fetchCards(selectedAudience);
      fetchTransactions(selectedCard);
    } catch (err) {
      if (err.message) message.error(err.message);
    }
  };

  const cardColumns = [
    { title: 'Card No', dataIndex: 'card_no', key: 'card_no' },
    {
      title: 'Type',
      dataIndex: 'card_type',
      key: 'card_type',
      render: (val) => {
        const info = cardTypeMap[val] || { color: 'default', label: val };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (val) => `¥${Number(val).toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (val) => {
        const info = statusMap[val] || { color: 'default', label: val };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" icon={<TransactionOutlined />} onClick={() => fetchTransactions(record)}>
          Transactions
        </Button>
      ),
    },
  ];

  const txnColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (val) => {
        const info = txnTypeMap[val] || { color: 'default', label: val };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val) => `¥${Number(val).toFixed(2)}`,
    },
    {
      title: 'Balance After',
      dataIndex: 'balance_after',
      key: 'balance_after',
      render: (val) => `¥${Number(val).toFixed(2)}`,
    },
    { title: 'Order ID', dataIndex: 'order_id', key: 'order_id' },
    { title: 'Remark', dataIndex: 'remark', key: 'remark' },
    { title: 'Created At', dataIndex: 'created_at', key: 'created_at' },
  ];

  const isEnterprise = selectedCard?.card_type === 'enterprise';
  const isActive = selectedCard?.status === 'active';

  return (
    <>
      <Space style={{ marginBottom: 16 }} size="middle">
        <Select
          placeholder="Select Audience"
          showSearch
          optionFilterProp="children"
          style={{ width: 260 }}
          value={selectedAudience}
          onChange={handleAudienceChange}
          allowClear
        >
          {audiences.map((a) => (
            <Select.Option key={a.id} value={a.id}>{a.name || a.phone || a.id}</Select.Option>
          ))}
        </Select>
      </Space>

      {selectedCard && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Card No" value={selectedCard.card_no} prefix={<CreditCardOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic title="Balance" value={selectedCard.balance} prefix={<DollarOutlined />} precision={2} />
            </Col>
            <Col span={6}>
              <Statistic
                title="Type"
                value={cardTypeMap[selectedCard.card_type]?.label || selectedCard.card_type}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Status"
                value={statusMap[selectedCard.status]?.label || selectedCard.status}
                valueStyle={{ color: statusMap[selectedCard.status]?.color === 'green' ? '#3f8600' : statusMap[selectedCard.status]?.color === 'red' ? '#cf1322' : undefined }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!selectedCard || !isActive}
          onClick={() => {
            rechargeForm.resetFields();
            setRechargeOpen(true);
          }}
        >
          Recharge
        </Button>
        <Button
          danger
          icon={<WalletOutlined />}
          disabled={!selectedCard || !isActive}
          onClick={() => {
            consumeForm.resetFields();
            setConsumeOpen(true);
          }}
        >
          Consume
        </Button>
        <Button
          style={{ background: '#722ed1', borderColor: '#722ed1', color: '#fff' }}
          icon={<WalletOutlined />}
          disabled={!selectedCard || !isEnterprise || !isActive}
          onClick={() => {
            grantForm.resetFields();
            setGrantOpen(true);
          }}
        >
          Enterprise Grant
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={cardColumns}
        dataSource={cards}
        loading={cardsLoading}
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => fetchTransactions(record),
          style: { cursor: 'pointer', background: selectedCard?.id === record.id ? '#e6f7ff' : undefined },
        })}
      />

      <Divider />

      {selectedCard && (
        <>
          <h3>Transactions for Card {selectedCard.card_no}</h3>
          <Table
            rowKey="id"
            columns={txnColumns}
            dataSource={transactions}
            loading={txnLoading}
            pagination={{ pageSize: 10 }}
          />
        </>
      )}

      <Modal
        title="Recharge"
        open={rechargeOpen}
        onOk={handleRecharge}
        onCancel={() => setRechargeOpen(false)}
        destroyOnClose
      >
        <Form form={rechargeForm} layout="vertical">
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Consume"
        open={consumeOpen}
        onOk={handleConsume}
        onCancel={() => setConsumeOpen(false)}
        destroyOnClose
      >
        <Form form={consumeForm} layout="vertical">
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="order_id" label="Order ID">
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="Remark">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Enterprise Grant"
        open={grantOpen}
        onOk={handleGrant}
        onCancel={() => setGrantOpen(false)}
        destroyOnClose
      >
        <Form form={grantForm} layout="vertical">
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
          <Form.Item name="enterprise_id" label="Enterprise ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="remark" label="Remark">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default Wallet;
