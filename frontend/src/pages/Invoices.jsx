import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Card, message, Spin, Modal, Descriptions, Empty, Space, Divider, Row, Col, Typography } from 'antd';
import { EyeOutlined, PayCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { invoiceApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const { isAdmin, isOperator, isFinance } = useAuth();
  const canManage = isAdmin() || isOperator() || isFinance();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await invoiceApi.getAll();
      setInvoices(response.data.data.invoices || []);
    } catch (error) {
      message.error('获取账单列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      draft: { text: '草稿', color: 'default' },
      open: { text: '待支付', color: 'warning' },
      paid: { text: '已支付', color: 'success' },
      void: { text: '已作废', color: 'default' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleViewDetails = (record) => {
    setSelectedInvoice(record);
    setDetailModalVisible(true);
  };

  const handlePay = async (record) => {
    try {
      await invoiceApi.pay(record.id);
      message.success('支付成功！');
      fetchInvoices();
    } catch (error) {
      message.error(error.response?.data?.error || '支付失败');
    }
  };

  const handleViewReceipt = async (record) => {
    try {
      const response = await invoiceApi.getReceipt(record.id);
      const { receipt, invoice, items } = response.data.data;
      
      Modal.info({
        title: null,
        icon: null,
        content: (
          <div style={{ padding: '10px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>电子收据</div>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                收据编号: {receipt.receiptNumber}
              </div>
            </div>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>账单编号</Text>
                <div style={{ fontWeight: 500 }}>{receipt.invoiceNumber}</div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>状态</Text>
                <div>
                  <Tag color="success">已支付</Tag>
                </div>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>支付金额</Text>
                <div style={{ fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  ¥{receipt.amount?.toFixed(2)}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>支付时间</Text>
                <div style={{ fontWeight: 500 }}>
                  {receipt.paidAt ? dayjs(receipt.paidAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </div>
              </Col>
            </Row>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <Text type="secondary" style={{ fontSize: 12 }}>订阅服务</Text>
            <Row gutter={16} style={{ marginBottom: 8, marginTop: 8 }}>
              <Col span={24}>
                <div style={{ fontWeight: 500 }}>{invoice.plan_name || '订阅服务'}</div>
              </Col>
            </Row>
            
            <Row gutter={16} style={{ marginBottom: 8 }}>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>服务周期</Text>
                <div style={{ fontSize: 13 }}>
                  {receipt.details?.billingPeriod?.start 
                    ? dayjs(receipt.details.billingPeriod.start).format('YYYY-MM-DD')
                    : '-'}
                  {' ~ '}
                  {receipt.details?.billingPeriod?.end 
                    ? dayjs(receipt.details.billingPeriod.end).format('YYYY-MM-DD')
                    : '-'}
                </div>
              </Col>
              <Col span={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>订阅编号</Text>
                <div style={{ fontSize: 13 }}>{receipt.details?.subscriptionId || '-'}</div>
              </Col>
            </Row>
            
            {items && items.length > 0 && (
              <>
                <Divider style={{ margin: '16px 0' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>明细项目</Text>
                <Table
                  dataSource={items}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  style={{ marginTop: 8 }}
                  columns={[
                    { 
                      title: '项目', 
                      dataIndex: 'description', 
                      key: 'description',
                      render: (text) => <span style={{ fontSize: 13 }}>{text}</span>
                    },
                    { 
                      title: '数量', 
                      dataIndex: 'quantity', 
                      key: 'quantity',
                      width: 80,
                      align: 'center',
                      render: (q) => <span style={{ fontSize: 13 }}>{q}</span>
                    },
                    { 
                      title: '单价', 
                      dataIndex: 'unit_price', 
                      key: 'unit_price',
                      width: 100,
                      align: 'right',
                      render: (p) => <span style={{ fontSize: 13 }}>¥{p?.toFixed(2) || 0}</span>
                    },
                    { 
                      title: '小计', 
                      dataIndex: 'amount', 
                      key: 'amount',
                      width: 100,
                      align: 'right',
                      render: (a) => <span style={{ fontSize: 13 }}>¥{a?.toFixed(2) || 0}</span>
                    },
                  ]}
                />
              </>
            )}
            
            <Divider style={{ margin: '24px 0' }} />
            
            <Row justify="space-between" style={{ fontSize: 12, color: '#8c8c8c' }}>
              <Col>
                <div>签发时间: {dayjs(receipt.issuedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
              </Col>
              <Col>
                <div style={{ textAlign: 'right' }}>
                  <div>系统自动生成</div>
                </div>
              </Col>
            </Row>
          </div>
        ),
        width: 600,
        okText: '知道了',
      });
    } catch (error) {
      message.error('获取收据失败');
    }
  };

  const columns = [
    {
      title: '账单编号',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
    },
    ...(canManage ? [
      {
        title: '用户',
        dataIndex: 'user_display_name',
        key: 'user_display_name',
        render: (text, record) => text || record.user_username,
      },
    ] : []),
    {
      title: '套餐',
      dataIndex: 'plan_name',
      key: 'plan_name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const info = getStatusInfo(status);
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '金额',
      dataIndex: 'amount_due',
      key: 'amount_due',
      render: (amount) => <span className="invoice-amount">¥{amount?.toFixed(2)}</span>,
    },
    {
      title: '账期',
      key: 'period',
      render: (_, record) => (
        <span>
          {record.billing_period_start ? dayjs(record.billing_period_start).format('MM-DD') : '-'}
          {' ~ '}
          {record.billing_period_end ? dayjs(record.billing_period_end).format('MM-DD') : '-'}
        </span>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'due_at',
      key: 'due_at',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            详情
          </Button>
          {record.status === 'open' && (
            <Button 
              type="primary" 
              size="small" 
              icon={<PayCircleOutlined />}
              onClick={() => handlePay(record)}
            >
              支付
            </Button>
          )}
          {record.status === 'paid' && (
            <Button 
              type="link" 
              size="small" 
              icon={<FileTextOutlined />}
              onClick={() => handleViewReceipt(record)}
            >
              收据
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="loading-spinner">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>账单管理</h2>
      </div>

      <Card className="dashboard-card">
        {invoices.length === 0 ? (
          <Empty 
            description="暂无账单" 
            style={{ padding: 40 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={invoices}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>

      <Modal
        title="账单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {selectedInvoice && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="账单编号" span={2}>
                {selectedInvoice.invoice_number}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusInfo(selectedInvoice.status).color}>
                  {getStatusInfo(selectedInvoice.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="套餐">
                {selectedInvoice.plan_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="账单金额">
                <span className="invoice-amount">¥{selectedInvoice.amount_due?.toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="已支付">
                <span style={{ color: '#52c41a' }}>¥{selectedInvoice.amount_paid?.toFixed(2) || 0}</span>
              </Descriptions.Item>
              <Descriptions.Item label="账期">
                {selectedInvoice.billing_period_start && selectedInvoice.billing_period_end
                  ? `${dayjs(selectedInvoice.billing_period_start).format('YYYY-MM-DD')} ~ ${dayjs(selectedInvoice.billing_period_end).format('YYYY-MM-DD')}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="到期时间">
                {selectedInvoice.due_at ? dayjs(selectedInvoice.due_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="支付时间">
                {selectedInvoice.paid_at ? dayjs(selectedInvoice.paid_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {selectedInvoice.created_at ? dayjs(selectedInvoice.created_at).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
            
            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <Table
                title={() => '明细项目'}
                columns={[
                  { title: '项目名称', dataIndex: 'description', key: 'description' },
                  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                  { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (p) => `¥${p?.toFixed(2) || 0}` },
                  { title: '小计', dataIndex: 'amount', key: 'amount', render: (a) => `¥${a?.toFixed(2) || 0}` },
                ]}
                dataSource={selectedInvoice.items}
                rowKey="id"
                pagination={false}
                size="small"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
