import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Tag, message, Spin, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { invoicesAPI } from '../services/api';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const data = await invoicesAPI.getById(id);
      setInvoice(data);
    } catch (error) {
      message.error('加载失败');
    }
    setLoading(false);
  };

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 50 }} />;
  if (!invoice) return <div>账单不存在</div>;

  const statusColors = {
    draft: 'default',
    client_confirmed: 'blue',
    invoiced: 'orange',
    partially_paid: 'purple',
    paid: 'green',
  };
  const statusLabels = {
    draft: '草稿',
    client_confirmed: '客户已确认',
    invoiced: '已开票',
    partially_paid: '部分付款',
    paid: '已结清',
  };

  const timeEntryColumns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '参与人', dataIndex: 'user_name', key: 'user_name', width: 120 },
    { title: '工作事项', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '工时(h)', dataIndex: 'hours', key: 'hours', width: 100 },
    { title: '费率(元/h)', dataIndex: 'rate_amount', key: 'rate_amount', width: 120, render: v => v?.toFixed(2) },
    { title: '费用(元)', key: 'amount', width: 120,
      render: (_, record) => record.is_billable ? (record.hours * record.rate_amount).toFixed(2) : '不可计费'
    },
  ];

  const paymentColumns = [
    { title: '收款日期', dataIndex: 'payment_date', key: 'payment_date', width: 150 },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount', width: 150, render: v => v?.toFixed(2) },
    { title: '付款方式', dataIndex: 'payment_method', key: 'payment_method', width: 150,
      render: v => ({ bank: '银行转账', cash: '现金', check: '支票', other: '其他' })[v] || v
    },
    { title: '备注', dataIndex: 'notes', key: 'notes', ellipsis: true },
  ];

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/invoices')}>
            返回列表
          </Button>
          <h1 className="page-title">账单详情</h1>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions title="账单信息" bordered column={2}>
          <Descriptions.Item label="账单编号">{invoice.invoice_number}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColors[invoice.status]}>{statusLabels[invoice.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="客户">{invoice.client_name}</Descriptions.Item>
          <Descriptions.Item label="案件">{invoice.matter_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="总工时">{invoice.total_hours ? `${invoice.total_hours}h` : '-'}</Descriptions.Item>
          <Descriptions.Item label="工时费">¥{invoice.time_fee?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="固定费用">¥{(invoice.fixed_fee || 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="代垫费用">¥{(invoice.advance_fee || 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="税费">¥{invoice.tax?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="折扣">-¥{(invoice.discount || 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="总金额" span={2} style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
            ¥{invoice.total_amount?.toFixed(2)}
          </Descriptions.Item>
          <Descriptions.Item label="已收款">¥{(invoice.paid_amount || 0).toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="待收款">¥{(invoice.total_amount - (invoice.paid_amount || 0)).toFixed(2)}</Descriptions.Item>
          {invoice.client_confirmed_at && (
            <Descriptions.Item label="客户确认时间">{invoice.client_confirmed_at}</Descriptions.Item>
          )}
          {invoice.invoiced_at && (
            <Descriptions.Item label="开票时间">{invoice.invoiced_at}</Descriptions.Item>
          )}
          {invoice.paid_at && (
            <Descriptions.Item label="结清时间">{invoice.paid_at}</Descriptions.Item>
          )}
          {invoice.notes && (
            <Descriptions.Item label="备注" span={2}>{invoice.notes}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {invoice.time_entries && invoice.time_entries.length > 0 && (
        <Card title="工时明细" style={{ marginBottom: 16 }}>
          <Table
            columns={timeEntryColumns}
            dataSource={invoice.time_entries}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {invoice.payments && invoice.payments.length > 0 && (
        <Card title="收款记录">
          <Table
            columns={paymentColumns}
            dataSource={invoice.payments}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default InvoiceDetail;
