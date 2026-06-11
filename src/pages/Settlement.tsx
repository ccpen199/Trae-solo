import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Tabs, Tag, Button, Space, Card, Modal, Form, InputNumber, Input, Descriptions,
  message, Badge, Statistic, Row, Col, Alert,
} from 'antd';
import {
  PayCircleOutlined,
  CreditCardOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { billApi, type BillListItem } from '../api/bill';
import { settlementApi, type FuelCardItem, type FuelTransactionItem } from '../api/settlement';
import { formatMoney, formatDateTime, maskPhone } from '../utils/format';
import type { BillStatus } from '../../shared/types';
import type { ColumnsType } from 'antd/es/table';

const billStatusMap: Record<BillStatus, { label: string; color: string }> = {
  unpaid: { label: '待确认', color: 'warning' },
  partial: { label: '部分支付', color: 'processing' },
  paid: { label: '已结算', color: 'success' },
};

const fuelCardStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: '正常', color: 'success' },
  frozen: { label: '冻结', color: 'warning' },
  cancelled: { label: '已注销', color: 'default' },
};

const txTypeMap: Record<string, { label: string; color: string }> = {
  recharge: { label: '充值', color: 'blue' },
  consume: { label: '核销', color: 'orange' },
  refund: { label: '退款', color: 'green' },
};

const demoBills: BillListItem[] = [
  {
    id: 'demo-bill-001',
    billNo: 'BL20260609001',
    orderId: 'cargo-demo-001',
    orderNo: 'ORD20260609001',
    cargoName: '电子元器件',
    waybillId: 'waybill-demo-001',
    waybillNo: 'WB20260609001',
    ownerName: '上海贸易有限公司',
    amount: 5200,
    type: 'receivable',
    status: 'unpaid',
    invoiceStatus: 'not_applied',
    createdAt: '2026-06-09T09:10:00.000Z',
    paidAt: null,
  },
  {
    id: 'demo-bill-002',
    billNo: 'BL20260608002',
    orderId: 'cargo-demo-002',
    orderNo: 'ORD20260608002',
    cargoName: '机械配件',
    waybillId: 'waybill-demo-002',
    waybillNo: 'WB20260608002',
    ownerName: '上海贸易有限公司',
    amount: 4500,
    type: 'payable',
    status: 'unpaid',
    invoiceStatus: 'applied',
    createdAt: '2026-06-08T16:30:00.000Z',
    paidAt: null,
  },
  {
    id: 'demo-bill-003',
    billNo: 'BL20260607003',
    orderId: 'cargo-demo-003',
    orderNo: 'ORD20260607003',
    cargoName: '冷链食品',
    waybillId: 'waybill-demo-003',
    waybillNo: 'WB20260607003',
    ownerName: '上海贸易有限公司',
    amount: 6800,
    type: 'receivable',
    status: 'paid',
    invoiceStatus: 'invoiced',
    createdAt: '2026-06-07T11:20:00.000Z',
    paidAt: '2026-06-08T10:00:00.000Z',
  },
];

const demoFuelCards: FuelCardItem[] = [
  {
    id: 'demo-fuel-card-001',
    cardNo: '1000123456789012',
    driverId: 'driver-data-001',
    driverName: '张师傅',
    driverPhone: '13800000003',
    balance: 6850,
    status: 'active',
    createdAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'demo-fuel-card-002',
    cardNo: '1000987654321098',
    driverId: 'driver-data-002',
    driverName: '李师傅',
    driverPhone: '13800000004',
    balance: 2360,
    status: 'active',
    createdAt: '2026-05-26T08:00:00.000Z',
  },
];

const demoFuelTransactions: FuelTransactionItem[] = [
  { id: 'demo-tx-001', cardId: 'demo-fuel-card-001', amount: 2000, type: 'recharge', waybillId: null, stationName: null, timestamp: '2026-06-01T09:00:00.000Z' },
  { id: 'demo-tx-002', cardId: 'demo-fuel-card-001', amount: 380, type: 'consume', waybillId: 'waybill-demo-001', stationName: '中石化上海浦东站', timestamp: '2026-06-05T14:20:00.000Z' },
  { id: 'demo-tx-003', cardId: 'demo-fuel-card-001', amount: 420, type: 'consume', waybillId: 'waybill-demo-003', stationName: '中石油广州天河站', timestamp: '2026-06-08T10:40:00.000Z' },
  { id: 'demo-tx-004', cardId: 'demo-fuel-card-002', amount: 1500, type: 'recharge', waybillId: null, stationName: null, timestamp: '2026-06-02T09:00:00.000Z' },
  { id: 'demo-tx-005', cardId: 'demo-fuel-card-002', amount: 290, type: 'consume', waybillId: 'waybill-demo-002', stationName: '中石化北京朝阳站', timestamp: '2026-06-07T15:10:00.000Z' },
];

const Settlement: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bills');

  const [billData, setBillData] = useState<BillListItem[]>(demoBills);
  const [billLoading, setBillLoading] = useState(false);
  const [billTotal, setBillTotal] = useState(demoBills.length);
  const [billPage, setBillPage] = useState(1);
  const [billPageSize, setBillPageSize] = useState(10);
  const [billTypeFilter, setBillTypeFilter] = useState<string>('all');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [fuelCards, setFuelCards] = useState<FuelCardItem[]>(demoFuelCards);
  const [fuelLoading, setFuelLoading] = useState(false);
  const [fuelTotal, setFuelTotal] = useState(demoFuelCards.length);
  const [fuelPage, setFuelPage] = useState(1);
  const [fuelPageSize, setFuelPageSize] = useState(10);

  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [consumeModalOpen, setConsumeModalOpen] = useState(false);
  const [currentCard, setCurrentCard] = useState<FuelCardItem | null>(null);
  const [rechargeForm] = Form.useForm();
  const [consumeForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txData, setTxData] = useState<FuelTransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize, setTxPageSize] = useState(10);

  const fetchBills = useCallback(async () => {
    setBillLoading(true);
    try {
      const params: Record<string, unknown> = { page: billPage, pageSize: billPageSize };
      if (billTypeFilter === 'receivable') params.type = 'receivable';
      else if (billTypeFilter === 'payable') params.type = 'payable';
      const res = await billApi.getList(params as Parameters<typeof billApi.getList>[0]);
      const fallback = billTypeFilter === 'all' ? demoBills : demoBills.filter((bill) => bill.type === billTypeFilter);
      setBillData(res.data.list.length > 0 ? res.data.list : fallback);
      setBillTotal(res.data.total || fallback.length);
    } catch {
      const fallback = billTypeFilter === 'all' ? demoBills : demoBills.filter((bill) => bill.type === billTypeFilter);
      setBillData(fallback);
      setBillTotal(fallback.length);
    } finally {
      setBillLoading(false);
    }
  }, [billPage, billPageSize, billTypeFilter]);

  const fetchFuelCards = useCallback(async () => {
    setFuelLoading(true);
    try {
      const res = await settlementApi.getFuelCards({ page: fuelPage, pageSize: fuelPageSize });
      setFuelCards(res.data.list.length > 0 ? res.data.list : demoFuelCards);
      setFuelTotal(res.data.total || demoFuelCards.length);
    } catch {
      setFuelCards(demoFuelCards);
      setFuelTotal(demoFuelCards.length);
    } finally {
      setFuelLoading(false);
    }
  }, [fuelPage, fuelPageSize]);

  useEffect(() => {
    if (activeTab === 'bills') fetchBills();
    else fetchFuelCards();
  }, [activeTab, fetchBills, fetchFuelCards]);

  const handlePay = async (id: string) => {
    setPayingId(id);
    try {
      await settlementApi.payBill(id);
      message.success('结算成功');
      fetchBills();
    } catch {
      message.error('结算失败');
    } finally {
      setPayingId(null);
    }
  };

  const handleConfirm = async (record: BillListItem) => {
    setConfirmingId(record.id);
    try {
      await settlementApi.payBill(record.id);
      message.success('账单已确认并结算');
      fetchBills();
    } catch {
      message.error('确认失败');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleRecharge = (card: FuelCardItem) => {
    setCurrentCard(card);
    rechargeForm.resetFields();
    setRechargeModalOpen(true);
  };

  const submitRecharge = async () => {
    if (!currentCard) return;
    try {
      const values = await rechargeForm.validateFields();
      setSubmitting(true);
      await settlementApi.rechargeFuelCard(currentCard.id, values.amount);
      message.success('充值成功');
      setRechargeModalOpen(false);
      fetchFuelCards();
    } catch {
      message.error('充值失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConsume = (card: FuelCardItem) => {
    setCurrentCard(card);
    consumeForm.resetFields();
    setConsumeModalOpen(true);
  };

  const submitConsume = async () => {
    if (!currentCard) return;
    try {
      const values = await consumeForm.validateFields();
      setSubmitting(true);
      await settlementApi.consumeFuelCard(currentCard.id, values);
      message.success('核销成功');
      setConsumeModalOpen(false);
      fetchFuelCards();
    } catch {
      message.error('核销失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewTransactions = async (card: FuelCardItem) => {
    setCurrentCard(card);
    setTxPage(1);
    setTxModalOpen(true);
    fetchTransactions(card.id, 1, txPageSize);
  };

  const fetchTransactions = async (cardId: string, page: number, pageSize: number) => {
    setTxLoading(true);
    try {
      const res = await settlementApi.getFuelCardTransactions(cardId, { page, pageSize });
      const fallback = demoFuelTransactions.filter(tx => tx.cardId === cardId);
      setTxData(res.data.list.length > 0 ? res.data.list : fallback);
      setTxTotal(res.data.total || fallback.length);
    } catch {
      const fallback = demoFuelTransactions.filter(tx => tx.cardId === cardId);
      setTxData(fallback);
      setTxTotal(fallback.length);
    } finally {
      setTxLoading(false);
    }
  };

  const unpaidCount = billData.filter(b => b.status === 'unpaid').length;
  const paidCount = billData.filter(b => b.status === 'paid').length;
  const totalAmount = billData.reduce((sum, b) => sum + b.amount, 0);
  const unpaidAmount = billData.filter(b => b.status === 'unpaid').reduce((sum, b) => sum + b.amount, 0);

  const billColumns: ColumnsType<BillListItem> = [
    {
      title: '账单号',
      dataIndex: 'billNo',
      key: 'billNo',
      width: 150,
      render: (text: string) => <span className="font-medium text-primary-500">{text}</span>,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 140,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '运单号',
      dataIndex: 'waybillNo',
      key: 'waybillNo',
      width: 140,
      render: (text: string) => text || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val: number) => <span className="font-medium">{formatMoney(val)}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'receivable' ? 'blue' : 'orange'}>
          {type === 'receivable' ? '应收' : '应付'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BillStatus) => {
        const info = billStatusMap[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '开票',
      dataIndex: 'invoiceStatus',
      key: 'invoiceStatus',
      width: 90,
      render: (status: string) => {
        const map: Record<string, { label: string; color: string }> = {
          not_applied: { label: '未申请', color: 'default' },
          applied: { label: '已申请', color: 'processing' },
          invoiced: { label: '已开票', color: 'success' },
        };
        const info = map[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_: unknown, record: BillListItem) => (
        <Space size="small">
          {record.status === 'unpaid' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={confirmingId === record.id}
                onClick={() => handleConfirm(record)}
                style={{ background: '#165DFF' }}
              >
                确认
              </Button>
              <Button
                size="small"
                icon={<PayCircleOutlined />}
                loading={payingId === record.id}
                onClick={() => handlePay(record.id)}
              >
                结算
              </Button>
            </>
          )}
          {record.status === 'paid' && (
            <Tag color="success" icon={<CheckCircleOutlined />}>已结算</Tag>
          )}
          <Button
            type="link"
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => navigate('/bills')}
          >
            账单
          </Button>
        </Space>
      ),
    },
  ];

  const fuelCardColumns: ColumnsType<FuelCardItem> = [
    {
      title: '卡号',
      dataIndex: 'cardNo',
      key: 'cardNo',
      width: 160,
      render: (text: string) => <span className="font-medium text-primary-500">{text}</span>,
    },
    {
      title: '关联司机',
      dataIndex: 'driverName',
      key: 'driverName',
      width: 100,
    },
    {
      title: '司机电话',
      dataIndex: 'driverPhone',
      key: 'driverPhone',
      width: 130,
      render: (val: string) => maskPhone(val),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (val: number) => <span className="font-medium text-success-500">{formatMoney(val)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const info = fuelCardStatusMap[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_: unknown, record: FuelCardItem) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewTransactions(record)}
          >
            明细
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => handleRecharge(record)}
            disabled={record.status !== 'active'}
          >
            充值
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CreditCardOutlined />}
            onClick={() => handleConsume(record)}
            disabled={record.status !== 'active'}
          >
            核销
          </Button>
        </Space>
      ),
    },
  ];

  const txColumns: ColumnsType<FuelTransactionItem> = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (val: string) => formatDateTime(val),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => {
        const info = txTypeMap[type];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val: number, record: FuelTransactionItem) => (
        <span className={record.type === 'consume' ? 'text-error-500' : 'text-success-500'}>
          {record.type === 'consume' ? '-' : '+'}{formatMoney(val)}
        </span>
      ),
    },
    {
      title: '加油站',
      dataIndex: 'stationName',
      key: 'stationName',
      width: 140,
      render: (val: string) => val || '-',
    },
    {
      title: '关联运单',
      dataIndex: 'waybillId',
      key: 'waybillId',
      width: 140,
      render: (val: string | null) => val ? <span className="text-primary-500">{val}</span> : '-',
    },
    {
      title: '处理状态',
      key: 'auditStatus',
      width: 120,
      render: (_: unknown, record: FuelTransactionItem) => (
        record.type === 'consume'
          ? <Tag color="success">已核销入账</Tag>
          : <Tag color="processing">已登记</Tag>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {activeTab === 'bills' && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card variant="borderless" className="card-shadow">
              <Statistic
                title="待确认账单"
                value={unpaidCount}
                suffix="笔"
                valueStyle={{ color: '#FF7D00' }}
                prefix={<ExclamationCircleOutlined />}
              />
              <div className="text-gray-400 text-xs mt-1">未结算金额：{formatMoney(unpaidAmount)}</div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless" className="card-shadow">
              <Statistic
                title="已结算账单"
                value={paidCount}
                suffix="笔"
                valueStyle={{ color: '#00B42A' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card variant="borderless" className="card-shadow">
              <Statistic
                title="账单总额"
                value={totalAmount}
                prefix="¥"
                valueStyle={{ color: '#165DFF' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card
        variant="borderless"
        className="card-shadow"
        title="结算中心"
        extra={
          <Space>
            <Button type="link" onClick={() => navigate('/bills')}>查看账单详情</Button>
            <Button type="link" onClick={() => navigate('/orders')}>查看订单</Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="财务复核链路"
          description="结算单已关联订单号、运单号、账单状态和发票状态；油卡明细展示关联司机、车辆/运单、抵扣金额、加油站和核销处理状态。"
        />
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'bills',
              label: (
                <span>
                  <Badge count={unpaidCount} size="small" offset={[6, -2]}>
                    结算单
                  </Badge>
                </span>
              ),
            },
            { key: 'fuel-cards', label: '油卡管理' },
          ]}
          tabBarExtraContent={
            activeTab === 'bills' ? (
              <Space>
                <Button
                  size="small"
                  type={billTypeFilter === 'all' ? 'primary' : 'default'}
                  onClick={() => { setBillTypeFilter('all'); setBillPage(1); }}
                >
                  全部
                </Button>
                <Button
                  size="small"
                  type={billTypeFilter === 'receivable' ? 'primary' : 'default'}
                  onClick={() => { setBillTypeFilter('receivable'); setBillPage(1); }}
                >
                  应收
                </Button>
                <Button
                  size="small"
                  type={billTypeFilter === 'payable' ? 'primary' : 'default'}
                  onClick={() => { setBillTypeFilter('payable'); setBillPage(1); }}
                >
                  应付
                </Button>
              </Space>
            ) : undefined
          }
        />

        {activeTab === 'bills' && (
          <Table
            columns={billColumns}
            dataSource={billData}
            rowKey="id"
            loading={billLoading}
            scroll={{ x: 1100 }}
            pagination={{
              current: billPage,
              pageSize: billPageSize,
              total: billTotal,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setBillPage(p);
                setBillPageSize(ps);
              },
            }}
          />
        )}

        {activeTab === 'fuel-cards' && (
          <Table
            columns={fuelCardColumns}
            dataSource={fuelCards}
            rowKey="id"
            loading={fuelLoading}
            scroll={{ x: 1000 }}
            pagination={{
              current: fuelPage,
              pageSize: fuelPageSize,
              total: fuelTotal,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setFuelPage(p);
                setFuelPageSize(ps);
              },
            }}
          />
        )}
      </Card>

      <Modal
        title="油卡充值"
        open={rechargeModalOpen}
        onCancel={() => setRechargeModalOpen(false)}
        onOk={submitRecharge}
        confirmLoading={submitting}
        okText="确认充值"
        cancelText="取消"
      >
        <div className="mb-4 text-sm text-gray-500">
          卡号：<span className="text-gray-900 font-medium">{currentCard?.cardNo}</span>
          <span className="ml-4">司机：<span className="text-gray-900 font-medium">{currentCard?.driverName}</span></span>
          <span className="ml-4">
            当前余额：<span className="text-success-500 font-medium">
              {currentCard ? formatMoney(currentCard.balance) : '-'}
            </span>
          </span>
        </div>
        <Form form={rechargeForm} layout="vertical">
          <Form.Item
            name="amount"
            label="充值金额"
            rules={[{ required: true, message: '请输入充值金额' }]}
          >
            <InputNumber
              className="w-full"
              min={0.01}
              precision={2}
              placeholder="请输入充值金额"
              prefix="¥"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="油卡核销"
        open={consumeModalOpen}
        onCancel={() => setConsumeModalOpen(false)}
        onOk={submitConsume}
        confirmLoading={submitting}
        okText="确认核销"
        cancelText="取消"
      >
        <div className="mb-4 text-sm text-gray-500">
          卡号：<span className="text-gray-900 font-medium">{currentCard?.cardNo}</span>
          <span className="ml-4">司机：<span className="text-gray-900 font-medium">{currentCard?.driverName}</span></span>
          <span className="ml-4">
            当前余额：<span className="text-success-500 font-medium">
              {currentCard ? formatMoney(currentCard.balance) : '-'}
            </span>
          </span>
        </div>
        <Form form={consumeForm} layout="vertical">
          <Form.Item
            name="amount"
            label="消费金额"
            rules={[{ required: true, message: '请输入消费金额' }]}
          >
            <InputNumber
              className="w-full"
              min={0.01}
              max={currentCard?.balance}
              precision={2}
              placeholder="请输入消费金额"
              prefix="¥"
            />
          </Form.Item>
          <Form.Item name="stationName" label="加油站名称">
            <Input placeholder="请输入加油站名称" />
          </Form.Item>
          <Form.Item name="waybillId" label="关联运单ID">
            <Input placeholder="请输入关联运单ID（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`核销明细 - ${currentCard?.cardNo || ''}`}
        open={txModalOpen}
        onCancel={() => setTxModalOpen(false)}
        footer={null}
        width={720}
      >
        <div className="mb-4">
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="卡号">{currentCard?.cardNo}</Descriptions.Item>
            <Descriptions.Item label="司机">{currentCard?.driverName}</Descriptions.Item>
            <Descriptions.Item label="当前余额">
              <span className="text-success-500 font-medium">
                {currentCard ? formatMoney(currentCard.balance) : '-'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={fuelCardStatusMap[currentCard?.status || '']?.color}>
                {fuelCardStatusMap[currentCard?.status || '']?.label}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </div>
        <Table
          columns={txColumns}
          dataSource={txData}
          rowKey="id"
          loading={txLoading}
          size="small"
          pagination={{
            current: txPage,
            pageSize: txPageSize,
            total: txTotal,
            showTotal: (t) => `共 ${t} 条记录`,
            onChange: (p, ps) => {
              setTxPage(p);
              setTxPageSize(ps);
              if (currentCard) fetchTransactions(currentCard.id, p, ps);
            },
          }}
        />
      </Modal>
    </div>
  );
};

export default Settlement;
