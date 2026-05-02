import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, InputNumber, DatePicker, Select, message, Descriptions, Typography, Tooltip, Spin } from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, CalculatorOutlined } from '@ant-design/icons';
import { discountsAPI, billsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Discounts = () => {
  const [loading, setLoading] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [calcModalVisible, setCalcModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [calcResult, setCalcResult] = useState(null);
  const [form] = Form.useForm();
  const [calcForm] = Form.useForm();
  const [pendingBills, setPendingBills] = useState([]);
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchDiscounts();
    fetchPendingBills();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      const response = await discountsAPI.getList(params);
      if (response.data.success) {
        setDiscounts(response.data.data.discounts || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('获取贴现列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBills = async () => {
    try {
      const response = await billsAPI.getList({ status: 'pending_discount', pageSize: 100 });
      if (response.data.success) {
        setPendingBills(response.data.data.bills || []);
      }
    } catch (error) {
      console.error('获取待贴现票据失败:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审批' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' },
      processing: { color: 'blue', text: '处理中' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleCreate = async (values) => {
    try {
      const response = await discountsAPI.create({
        ...values,
        discountDate: values.discountDate?.format('YYYY-MM-DD')
      });
      if (response.data.success) {
        message.success('贴现申请创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchDiscounts();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const handleCalculate = async (values) => {
    try {
      const response = await discountsAPI.calculate(values);
      if (response.data.success) {
        setCalcResult(response.data.data);
      }
    } catch (error) {
      message.error('计算失败');
    }
  };

  const handleAction = async (action, comment = '') => {
    if (!selectedItem) return;
    try {
      let response;
      switch (action) {
        case 'approve':
          response = await discountsAPI.approve(selectedItem.id, comment);
          break;
        case 'reject':
          response = await discountsAPI.reject(selectedItem.id, comment);
          break;
        default:
          return;
      }
      
      if (response.data.success) {
        message.success('操作执行成功');
        setDetailModalVisible(false);
        fetchDiscounts();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '贴现编号',
      dataIndex: 'discount_no',
      key: 'discount_no',
      render: (text, record) => (
        <a onClick={() => {
          setSelectedItem(record);
          setDetailModalVisible(true);
        }}>{text}</a>
      )
    },
    {
      title: '票据编号',
      dataIndex: 'bill_number',
      key: 'bill_number'
    },
    {
      title: '银行',
      dataIndex: 'bank_name',
      key: 'bank_name'
    },
    {
      title: '贴现金额',
      dataIndex: 'discount_amount',
      key: 'discount_amount',
      render: (text) => `¥${text?.toLocaleString() || 0}`
    },
    {
      title: '贴现率',
      dataIndex: 'discount_rate',
      key: 'discount_rate',
      render: (text) => `${(text * 100)?.toFixed(2) || 0}%`
    },
    {
      title: '利息金额',
      dataIndex: 'interest_amount',
      key: 'interest_amount',
      render: (text) => `¥${text?.toLocaleString() || 0}`
    },
    {
      title: '实际到账',
      dataIndex: 'actual_amount',
      key: 'actual_amount',
      render: (text) => `¥${text?.toLocaleString() || 0}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => getStatusTag(text)
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="link" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedItem(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'pending' && hasRole(['bank', 'admin']) && (
            <>
              <Tooltip title="通过">
                <Button 
                  type="link" 
                  size="small" 
                  icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                  onClick={() => {
                    setSelectedItem(record);
                    handleAction('approve');
                  }}
                />
              </Tooltip>
              <Tooltip title="驳回">
                <Button 
                  type="link" 
                  size="small" 
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    setSelectedItem(record);
                    handleAction('reject');
                  }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>贴现申请</Title>
        <Space>
          <Button 
            icon={<CalculatorOutlined />}
            onClick={() => setCalcModalVisible(true)}
          >
            贴现计算器
          </Button>
          {hasRole(['finance', 'admin']) && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新建贴现
            </Button>
          )}
        </Space>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="状态"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Option value="pending">待审批</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已驳回</Option>
              <Option value="processing">处理中</Option>
            </Select>
            <Button type="primary" onClick={fetchDiscounts}>查询</Button>
            <Button onClick={() => {
              setFilters({});
              setPagination(prev => ({ ...prev, current: 1 }));
            }}>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={discounts}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={(page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          }}
        />
      </Card>

      <Modal
        title="新建贴现申请"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="billId"
            label="选择票据"
            rules={[{ required: true, message: '请选择票据' }]}
          >
            <Select placeholder="选择待贴现的票据">
              {pendingBills.map(bill => (
                <Option key={bill.id} value={bill.id}>
                  {bill.bill_number} - ¥{bill.amount.toLocaleString()}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="bankName"
            label="贴现银行"
            rules={[{ required: true, message: '请输入银行名称' }]}
          >
            <Input placeholder="请输入贴现银行名称" />
          </Form.Item>

          <Form.Item
            name="discountAmount"
            label="贴现金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入贴现金额"
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="discountRate"
            label="贴现率 (年率)"
            rules={[{ required: true, message: '请输入贴现率' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="例如: 0.06 表示 6%"
              min={0}
              max={1}
              precision={4}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item
            name="discountDate"
            label="贴现日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="贴现计算器"
        open={calcModalVisible}
        onCancel={() => {
          setCalcModalVisible(false);
          calcForm.resetFields();
          setCalcResult(null);
        }}
        footer={null}
        width={500}
      >
        <Form form={calcForm} layout="vertical" onFinish={handleCalculate}>
          <Form.Item
            name="discountAmount"
            label="贴现金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入贴现金额"
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="discountRate"
            label="贴现率 (年率)"
            rules={[{ required: true, message: '请输入贴现率' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="例如: 0.06 表示 6%"
              min={0}
              max={1}
              precision={4}
            />
          </Form.Item>

          <Form.Item
            name="days"
            label="贴现天数"
            rules={[{ required: true, message: '请输入天数' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入贴现天数"
              min={1}
              precision={0}
            />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              <CalculatorOutlined /> 计算
            </Button>
          </Form.Item>
        </Form>

        {calcResult && (
          <Card size="small" title="计算结果">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="利息金额">¥{calcResult.interestAmount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="利息税">¥{calcResult.interestTax?.taxAmount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="印花税">¥{calcResult.stampTax?.taxAmount?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="税费合计">¥{calcResult.totalTax?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="实际到账">
                <Text strong style={{ color: '#52c41a' }}>
                  ¥{calcResult.actualReceived?.toLocaleString()}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Modal>

      <Modal
        title="贴现详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={600}
        footer={selectedItem?.status === 'pending' && hasRole(['bank', 'admin']) ? [
          <Button key="reject" danger onClick={() => handleAction('reject')}>
            <CloseCircleOutlined /> 驳回
          </Button>,
          <Button key="approve" type="primary" onClick={() => handleAction('approve')}>
            <CheckCircleOutlined /> 通过
          </Button>
        ] : [
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
      >
        {selectedItem && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="贴现编号">{selectedItem.discount_no}</Descriptions.Item>
            <Descriptions.Item label="票据编号">{selectedItem.bill_number}</Descriptions.Item>
            <Descriptions.Item label="贴现银行">{selectedItem.bank_name}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(selectedItem.status)}</Descriptions.Item>
            <Descriptions.Item label="贴现金额">{`¥${selectedItem.discount_amount?.toLocaleString() || 0}`}</Descriptions.Item>
            <Descriptions.Item label="贴现率">{`${(selectedItem.discount_rate * 100)?.toFixed(2) || 0}%`}</Descriptions.Item>
            <Descriptions.Item label="利息金额">{`¥${selectedItem.interest_amount?.toLocaleString() || 0}`}</Descriptions.Item>
            <Descriptions.Item label="实际到账">{`¥${selectedItem.actual_amount?.toLocaleString() || 0}`}</Descriptions.Item>
            <Descriptions.Item label="操作人">{selectedItem.operator_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批意见">{selectedItem.approval_comment || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Discounts;
