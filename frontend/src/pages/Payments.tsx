import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Space,
  message,
  Descriptions,
  Badge,
  Tabs,
  Spin,
} from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import api from '../utils/api';
import { useAuth } from '../store/auth';

const { Option } = Select;
const { TabPane } = Tabs;

const Payments: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<any>(null);
  const [approvalFlow, setApprovalFlow] = useState<any[]>([]);
  const [form] = Form.useForm();
  const { user } = useAuth();

  const canCreate = ['CASHIER', 'FINANCIAL_MANAGER', 'ADMIN'].includes(user?.role || '');
  const canApprove = ['FINANCIAL_MANAGER', 'CFO', 'ADMIN'].includes(user?.role || '');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/payments');
      if (response.success) {
        setAccounts(response.data.paymentRequests || []);
      }
    } catch (error) {
      console.error('Load payments error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      const response: any = await api.post('/payments', {
        ...values,
        payeeBankAccount: values.payeeBankAccount || '6222021234567890123',
      });
      if (response.success) {
        message.success('付款申请创建成功');
        setModalVisible(false);
        form.resetFields();
        loadPayments();
      }
    } catch (error) {
      console.error('Create payment error:', error);
    }
  };

  const handleViewDetail = async (record: any) => {
    setCurrentPayment(record);
    setDetailModalVisible(true);
    try {
      const response: any = await api.get(`/payments/${record.id}`);
      if (response.success) {
        setApprovalFlow(response.data.approvalFlows || []);
      }
    } catch (error) {
      console.error('Load approval flow error:', error);
    }
  };

  const handleApprove = async (id: string, level: number) => {
    try {
      const response: any = await api.post(`/payments/${id}/approve`, {
        approvalLevel: level,
        comment: '审批通过',
      });
      if (response.success) {
        message.success('审批通过');
        loadPayments();
        setDetailModalVisible(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '审批失败');
    }
  };

  const handleReject = async (id: string, level: number) => {
    try {
      const response: any = await api.post(`/payments/${id}/reject`, {
        approvalLevel: level,
        comment: '审批驳回',
      });
      if (response.success) {
        message.success('已驳回');
        loadPayments();
        setDetailModalVisible(false);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'default',
      SUBMITTED: 'processing',
      PENDING_APPROVAL: 'warning',
      APPROVED: 'success',
      EXECUTING: 'processing',
      COMPLETED: 'success',
      REJECTED: 'error',
      FAILED: 'error',
      CANCELLED: 'default',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      DRAFT: '草稿',
      SUBMITTED: '已提交',
      PENDING_APPROVAL: '待审批',
      APPROVED: '已审批',
      EXECUTING: '执行中',
      COMPLETED: '已完成',
      REJECTED: '已驳回',
      FAILED: '失败',
      CANCELLED: '已取消',
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
    },
    {
      title: '付款用途',
      dataIndex: 'paymentPurpose',
      key: 'paymentPurpose',
    },
    {
      title: '收款人',
      dataIndex: 'payeeName',
      key: 'payeeName',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (
        <span style={{ fontWeight: 500 }}>¥{Number(val).toLocaleString()}</span>
      ),
    },
    {
      title: '当前审批级别',
      dataIndex: 'currentApprovalLevel',
      key: 'currentApprovalLevel',
      render: (level: number | null, record: any) => (
        <Badge
          count={`等级 ${level || '-'} / 共 ${record.maxApprovalLevel || 0}`}
          style={{ backgroundColor: '#1890ff' }}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'PENDING_APPROVAL' && canApprove && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record.id, record.currentApprovalLevel || 1)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                style={{ color: '#ff4d4f' }}
                onClick={() => handleReject(record.id, record.currentApprovalLevel || 1)}
              >
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2>付款申请</h2>
        <p>管理付款申请，执行分级审批</p>
      </div>

      <Card
        extra={
          canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              新增申请
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>

      <Modal
        title="新增付款申请"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="提交申请"
        cancelText="取消"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          className="modal-form"
        >
          <Form.Item
            name="paymentPurpose"
            label="付款用途"
            rules={[{ required: true, message: '请输入付款用途' }]}
          >
            <Input placeholder="请输入付款用途" />
          </Form.Item>
          <Form.Item
            name="payeeName"
            label="收款人名称"
            rules={[{ required: true, message: '请输入收款人名称' }]}
          >
            <Input placeholder="请输入收款人名称" />
          </Form.Item>
          <Form.Item
            name="payeeBank"
            label="收款人银行"
            rules={[{ required: true, message: '请输入收款人银行' }]}
          >
            <Input placeholder="请输入收款人银行" />
          </Form.Item>
          <Form.Item
            name="amount"
            label="付款金额 (元"
            rules={[{ required: true, message: '请输入付款金额' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入付款金额"
              precision={2}
              min={0}
            />
          </Form.Item>
          <Form.Item
            name="currency"
            label="币种"
            initialValue="CNY"
          >
            <Select placeholder="请选择币种">
              <Option value="CNY">人民币 (CNY)</Option>
              <Option value="USD">美元 (USD)</Option>
              <Option value="EUR">欧元 (EUR)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea rows={3} placeholder="请输入备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="付款申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={null}
      >
        {currentPayment && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="申请编号">{currentPayment.requestNumber}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(currentPayment.status)}>{getStatusText(currentPayment.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="付款用途">{currentPayment.paymentPurpose}</Descriptions.Item>
              <Descriptions.Item label="金额">
                <span style={{ fontWeight: 500, color: '#ff4d4f' }}>
                  ¥{Number(currentPayment.amount).toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="收款人">{currentPayment.payeeName}</Descriptions.Item>
              <Descriptions.Item label="收款银行">{currentPayment.payeeBank}</Descriptions.Item>
              <Descriptions.Item label="当前审批级别">
                等级 {currentPayment.currentApprovalLevel || '-'} / 共 {currentPayment.maxApprovalLevel || 0}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(currentPayment.createdAt).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <h4 style={{ marginBottom: 16 }}>审批流程</h4>
              <Table
                dataSource={approvalFlow}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: '审批级别',
                    dataIndex: 'approvalLevel',
                    render: (level: number) => `等级 ${level}`,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    render: (status: string) => {
                      const text = {
                        PENDING: '待审批',
                        APPROVED: '已通过',
                        REJECTED: '已驳回',
                        SKIPPED: '已跳过',
                      };
                      const color = {
                        PENDING: 'warning',
                        APPROVED: 'success',
                        REJECTED: 'error',
                        SKIPPED: 'default',
                      };
                      return <Tag color={color[status as keyof typeof color] || 'default'}>{text[status as keyof typeof text] || status}</Tag>;
                    },
                  },
                  {
                    title: '审批人',
                    dataIndex: 'approver',
                    render: (approver: any) => approver?.username || '-',
                  },
                  {
                    title: '审批时间',
                    dataIndex: 'approvedAt',
                    render: (time: string) => (time ? new Date(time).toLocaleString() : '-'),
                  },
                  {
                    title: '意见',
                    dataIndex: 'comment',
                    render: (comment: string) => comment || '-',
                  },
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
