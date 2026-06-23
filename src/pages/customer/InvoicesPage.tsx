import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Typography,
  message,
  Row,
  Col,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  FileDoneOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { Invoice } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const InvoicesPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [form] = Form.useForm();

  const invoices = useAppStore((state) => state.invoices);
  const waybills = useAppStore((state) => state.waybills);

  const statusMap: Record<string, { text: string; color: string }> = {
    pending: { text: '待开票', color: 'default' },
    issued: { text: '已开票', color: 'blue' },
    mailed: { text: '已寄送', color: 'success' },
  };

  const typeMap: Record<string, string> = {
    vat: '增值税专用发票',
    normal: '增值税普通发票',
  };

  const columns = [
    {
      title: '发票号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
    },
    {
      title: '发票类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => typeMap[type],
    },
    {
      title: '发票抬头',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '税号',
      dataIndex: 'taxNo',
      key: 'taxNo',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '申请时间',
      dataIndex: 'createTime',
      key: 'createTime',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: Invoice) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status !== 'mailed' && (
            <Button type="link" size="small" icon={<DownloadOutlined />}>
              下载
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = (values: any) => {
    message.success('发票申请已提交，预计1-3个工作日内开具');
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          电子发票
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          申请开票
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: '#e6f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <FileDoneOutlined style={{ color: '#1890ff' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999' }}>累计开票</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  ¥{invoices.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: '#fff7e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <FileDoneOutlined style={{ color: '#faad14' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999' }}>待开票</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {invoices.filter((i) => i.status === 'pending').length} 张
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: '#f6ffed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                <FileDoneOutlined style={{ color: '#52c41a' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#999' }}>本月开票</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  ¥{invoices.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={invoices} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="申请开票"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
        okText="提交申请"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Title level={5}>发票信息</Title>
          <Form.Item
            label="发票类型"
            name="type"
            initialValue="vat"
            rules={[{ required: true, message: '请选择发票类型' }]}
          >
            <Select>
              <Option value="vat">增值税专用发票</Option>
              <Option value="normal">增值税普通发票</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="发票抬头"
                name="title"
                rules={[{ required: true, message: '请输入发票抬头' }]}
              >
                <Input placeholder="请输入公司全称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="税号"
                name="taxNo"
                rules={[{ required: true, message: '请输入税号' }]}
              >
                <Input placeholder="请输入纳税人识别号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开户银行" name="bank">
                <Input placeholder="请输入开户银行名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="银行账号" name="bankAccount">
                <Input placeholder="请输入银行账号" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="注册地址" name="address">
            <Input placeholder="请输入注册地址" />
          </Form.Item>

          <Form.Item label="注册电话" name="regPhone">
            <Input placeholder="请输入注册电话" />
          </Form.Item>

          <Title level={5}>选择运单</Title>
          <Form.Item
            label="关联运单"
            name="waybillNos"
            rules={[{ required: true, message: '请选择要开票的运单' }]}
          >
            <Select mode="multiple" placeholder="选择需要开票的运单" style={{ width: '100%' }}>
              {waybills.map((w) => (
                <Option key={w.id} value={w.waybillNo}>
                  {w.waybillNo} - ¥{w.freight}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Title level={5}>收票信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="收票人"
                name="receiver"
                rules={[{ required: true, message: '请输入收票人' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="联系电话"
                name="receiverPhone"
                rules={[{ required: true, message: '请输入联系电话' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="收票地址"
            name="receiverAddress"
            rules={[{ required: true, message: '请输入收票地址' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="发票详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={
          <Button type="primary" icon={<DownloadOutlined />}>
            下载PDF
          </Button>
        }
        width={600}
      >
        {selectedInvoice && (
          <div>
            <div
              style={{
                textAlign: 'center',
                padding: '24px 0',
                border: '2px dashed #d9d9d9',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                {typeMap[selectedInvoice.type]}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                发票号：{selectedInvoice.invoiceNo}
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: '#f5222d', marginTop: 16 }}>
                ¥{selectedInvoice.amount.toFixed(2)}
              </div>
              <Tag color={statusMap[selectedInvoice.status].color} style={{ marginTop: 8 }}>
                {statusMap[selectedInvoice.status].text}
              </Tag>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="发票抬头">{selectedInvoice.title}</Descriptions.Item>
              <Descriptions.Item label="纳税人识别号">{selectedInvoice.taxNo}</Descriptions.Item>
              <Descriptions.Item label="开票日期">
                {selectedInvoice.issueTime || '待开票'}
              </Descriptions.Item>
              <Descriptions.Item label="关联运单">
                {selectedInvoice.waybillNos.join('、')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InvoicesPage;
