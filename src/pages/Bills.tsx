import React, { useState, useEffect, useCallback } from 'react';
import { Table, Tabs, Tag, Button, Space, Card, Modal, Form, Select, Input, Descriptions, message } from 'antd';
import { FileTextOutlined, SearchOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { billApi, type BillListItem, type BillDetail } from '../api/bill';
import { formatMoney, formatDateTime } from '../utils/format';
import type { BillStatus, InvoiceStatus } from '../../shared/types';
import type { ColumnsType } from 'antd/es/table';

const billStatusMap: Record<BillStatus, { label: string; color: string }> = {
  unpaid: { label: '未支付', color: 'warning' },
  partial: { label: '部分支付', color: 'processing' },
  paid: { label: '已支付', color: 'success' },
};

const invoiceStatusMap: Record<InvoiceStatus, { label: string; color: string }> = {
  not_applied: { label: '未申请', color: 'default' },
  applied: { label: '已申请', color: 'processing' },
  invoiced: { label: '已开票', color: 'success' },
};

const typeMap: Record<string, { label: string; color: string }> = {
  receivable: { label: '应收', color: 'blue' },
  payable: { label: '应付', color: 'orange' },
};

const billTabs = [
  { key: 'all', label: '全部' },
  { key: 'receivable', label: '应收' },
  { key: 'payable', label: '应付' },
];

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

const Bills: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<BillListItem[]>(demoBills);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(demoBills.length);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [keyword, setKeyword] = useState('');

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [currentBill, setCurrentBill] = useState<BillListItem | null>(null);
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [invoiceForm] = Form.useForm();

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [billDetail, setBillDetail] = useState<BillDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, pageSize };
      if (activeTab !== 'all') {
        params.type = activeTab;
      }
      const res = await billApi.getList(params as Parameters<typeof billApi.getList>[0]);
      const fallback = activeTab === 'all' ? demoBills : demoBills.filter((bill) => bill.type === activeTab);
      setData(res.data.list.length > 0 ? res.data.list : fallback);
      setTotal(res.data.total || fallback.length);
    } catch {
      const fallback = activeTab === 'all' ? demoBills : demoBills.filter((bill) => bill.type === activeTab);
      setData(fallback);
      setTotal(fallback.length);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const handleApplyInvoice = (record: BillListItem) => {
    setCurrentBill(record);
    invoiceForm.resetFields();
    setInvoiceModalOpen(true);
  };

  const submitInvoice = async () => {
    if (!currentBill) return;
    try {
      const values = await invoiceForm.validateFields();
      setInvoiceSubmitting(true);
      await billApi.applyInvoice(currentBill.id, values);
      message.success('发票申请提交成功');
      setInvoiceModalOpen(false);
      fetchData();
    } catch {
      message.error('发票申请提交失败');
    } finally {
      setInvoiceSubmitting(false);
    }
  };

  const handleViewDetail = async (record: BillListItem) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const res = await billApi.getDetail(record.id);
      setBillDetail(res.data);
    } catch {
      setBillDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredData = keyword
    ? data.filter(
        (item) =>
          item.billNo.includes(keyword) ||
          item.orderNo?.includes(keyword) ||
          item.waybillNo?.includes(keyword)
      )
    : data;

  const columns: ColumnsType<BillListItem> = [
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
      width: 150,
      ellipsis: true,
    },
    {
      title: '运单号',
      dataIndex: 'waybillNo',
      key: 'waybillNo',
      width: 150,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val: number) => (
        <span className="font-medium">{formatMoney(val)}</span>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: 'receivable' | 'payable') => {
        const info = typeMap[type];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '支付状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BillStatus) => {
        const info = billStatusMap[status];
        return <Tag color={info?.color}>{info?.label}</Tag>;
      },
    },
    {
      title: '开票状态',
      dataIndex: 'invoiceStatus',
      key: 'invoiceStatus',
      width: 100,
      render: (status: InvoiceStatus) => {
        const info = invoiceStatusMap[status];
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
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: BillListItem) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.invoiceStatus === 'not_applied' && record.type === 'receivable' && (
            <Button
              type="link"
              size="small"
              onClick={() => handleApplyInvoice(record)}
            >
              开票
            </Button>
          )}
          {record.status !== 'paid' && (
            <Button
              type="link"
              size="small"
              icon={<CreditCardOutlined />}
              onClick={() => navigate('/settlement')}
            >
              结算
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        variant="borderless"
        className="card-shadow"
        title="账单管理"
        extra={
          <Button type="link" icon={<CreditCardOutlined />} onClick={() => navigate('/settlement')}>
            前往结算中心
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={billTabs.map((tab) => ({
            key: tab.key,
            label: tab.label,
          }))}
          tabBarExtraContent={
            <Input.Search
              placeholder="搜索账单号/订单号"
              allowClear
              onSearch={setKeyword}
              style={{ width: 240 }}
              prefix={<SearchOutlined />}
            />
          }
        />

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>

      <Modal
        title="申请开票"
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        onOk={submitInvoice}
        confirmLoading={invoiceSubmitting}
        okText="提交申请"
        cancelText="取消"
        width={520}
      >
        <div className="mb-4 text-gray-500 text-sm">
          账单号：<span className="text-gray-900 font-medium">{currentBill?.billNo}</span>
          <span className="ml-4">
            金额：<span className="text-gray-900 font-medium">{currentBill ? formatMoney(currentBill.amount) : '-'}</span>
          </span>
        </div>
        <Form form={invoiceForm} layout="vertical">
          <Form.Item
            name="type"
            label="发票类型"
            rules={[{ required: true, message: '请选择发票类型' }]}
          >
            <Select
              placeholder="请选择发票类型"
              options={[
                { value: 'vat_special', label: '增值税专用发票' },
                { value: 'vat_normal', label: '增值税普通发票' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name={['buyerInfo', 'companyName']}
            label="购方公司名称"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="请输入公司名称" />
          </Form.Item>
          <Form.Item
            name={['buyerInfo', 'taxNumber']}
            label="纳税人识别号"
            rules={[{ required: true, message: '请输入纳税人识别号' }]}
          >
            <Input placeholder="请输入纳税人识别号" />
          </Form.Item>
          <Form.Item name={['buyerInfo', 'address']} label="地址">
            <Input placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name={['buyerInfo', 'phone']} label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name={['buyerInfo', 'bank']} label="开户银行">
            <Input placeholder="请输入开户银行" />
          </Form.Item>
          <Form.Item name={['buyerInfo', 'bankAccount']} label="银行账号">
            <Input placeholder="请输入银行账号" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="账单详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {detailLoading ? (
          <div className="text-center py-8">加载中...</div>
        ) : billDetail ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="账单号" span={1}>{billDetail.billNo}</Descriptions.Item>
            <Descriptions.Item label="类型" span={1}>
              <Tag color={typeMap[billDetail.type]?.color}>{typeMap[billDetail.type]?.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="金额" span={1}>
              <span className="font-medium">{formatMoney(billDetail.amount)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="支付状态" span={1}>
              <Tag color={billStatusMap[billDetail.status]?.color}>
                {billStatusMap[billDetail.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="订单号" span={1}>
              {billDetail.order?.orderNo}
            </Descriptions.Item>
            <Descriptions.Item label="运单号" span={1}>
              {billDetail.waybill?.waybillNo}
            </Descriptions.Item>
            <Descriptions.Item label="货物" span={1}>
              {billDetail.order?.cargoName}
            </Descriptions.Item>
            <Descriptions.Item label="路线" span={1}>
              {billDetail.order?.startCity} → {billDetail.order?.endCity}
            </Descriptions.Item>
            <Descriptions.Item label="货主" span={1}>
              {billDetail.owner?.name}
            </Descriptions.Item>
            <Descriptions.Item label="开票状态" span={1}>
              <Tag color={invoiceStatusMap[billDetail.invoiceStatus]?.color}>
                {invoiceStatusMap[billDetail.invoiceStatus]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={1}>
              {formatDateTime(billDetail.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="支付时间" span={1}>
              {formatDateTime(billDetail.paidAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <div className="text-center py-8 text-gray-400">未找到账单信息</div>
        )}
      </Modal>
    </div>
  );
};

export default Bills;
