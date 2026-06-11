import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Typography, Spin, message, Button, 
  Modal, Form, Input, Select, Space, Statistic, Row, Col,
  InputNumber, Popconfirm, Empty
} from 'antd';
import { 
  PlusOutlined, MinusOutlined, SafetyCertificateOutlined,
  WalletOutlined, ArrowUpOutlined, ArrowDownOutlined,
  DollarOutlined, BankOutlined, AlertOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const AdminDeposits = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filterType, setFilterType] = useState('all');
  const [deductModalVisible, setDeductModalVisible] = useState(false);
  const [rechargeModalVisible, setRechargeModalVisible] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deductForm] = Form.useForm();
  const [rechargeForm] = Form.useForm();

  const TYPE_MAP = {
    deposit: { label: '保证金缴纳', color: 'green', icon: <ArrowDownOutlined /> },
    deduct: { label: '保证金扣除', color: 'red', icon: <ArrowUpOutlined /> },
    freeze: { label: '保证金冻结', color: 'orange', icon: <AlertOutlined /> },
    unfreeze: { label: '保证金解冻', color: 'blue', icon: <BankOutlined /> }
  };

  const fetchRecords = async (page = 1, type = 'all') => {
    setLoading(true);
    try {
      const params = {
        page,
        pageSize: pagination.pageSize
      };
      const response = await adminAPI.getDeposits(params);
      let data = response.data.data;
      
      if (type !== 'all') {
        data = data.filter(item => item.type === type);
      }
      
      setRecords(data);
      setSummary(response.data.summary || {});
      setPagination(prev => ({
        ...prev,
        current: page,
        total: response.data.total
      }));
    } catch (error) {
      message.error('获取保证金记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1, filterType);
  }, [filterType]);

  const handlePageChange = (page) => {
    fetchRecords(page, filterType);
  };

  const handleDeduct = (record) => {
    setSelectedMerchant({ id: record.merchant_id, name: record.company_name });
    deductForm.resetFields();
    setDeductModalVisible(true);
  };

  const handleRecharge = (record) => {
    setSelectedMerchant({ id: record.merchant_id, name: record.company_name });
    rechargeForm.resetFields();
    setRechargeModalVisible(true);
  };

  const submitDeduct = async () => {
    try {
      const values = await deductForm.validateFields();
      setActionLoading(true);
      await adminAPI.deductDeposit(selectedMerchant.id, values);
      message.success('保证金扣除成功');
      setDeductModalVisible(false);
      fetchRecords(pagination.current, filterType);
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.error || '扣除失败');
    } finally {
      setActionLoading(false);
    }
  };

  const submitRecharge = async () => {
    try {
      const values = await rechargeForm.validateFields();
      setActionLoading(true);
      await adminAPI.rechargeDeposit(selectedMerchant.id, values);
      message.success('保证金补缴成功');
      setRechargeModalVisible(false);
      fetchRecords(pagination.current, filterType);
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.error || '补缴失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: '商家',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (name, record) => (
        <div>
          <Text strong>{name || '-'}</Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              商家ID: #{record.merchant_id}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type) => {
        const info = TYPE_MAP[type] || { label: type, color: 'default', icon: null };
        return (
          <Tag icon={info.icon} color={info.color}>
            {info.label}
          </Tag>
        );
      }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount, record) => {
        const isPositive = record.type === 'deposit' || record.type === 'unfreeze';
        return (
          <Text 
            strong 
            style={{ 
              color: isPositive ? '#52c41a' : '#ff4d4f',
              fontSize: 16
            }}
          >
            {isPositive ? '+' : '-'}¥{amount?.toLocaleString()}
          </Text>
        );
      }
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (remark) => remark || '-'
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<MinusOutlined />}
            danger
            onClick={() => handleDeduct(record)}
          >
            扣除
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<PlusOutlined />}
            style={{ color: '#52c41a' }}
            onClick={() => handleRecharge(record)}
          >
            补缴
          </Button>
        </Space>
      )
    }
  ];

  const statsCards = [
    {
      title: '累计保证金',
      value: `¥${(summary.total_deposit || 0).toLocaleString()}`,
      icon: <WalletOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      color: '#f6ffed',
      borderColor: '#b7eb8f',
      valueStyle: { color: '#52c41a' }
    },
    {
      title: '累计扣除',
      value: `¥${(summary.total_deduct || 0).toLocaleString()}`,
      icon: <ArrowUpOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />,
      color: '#fff1f0',
      borderColor: '#ffa39e',
      valueStyle: { color: '#ff4d4f' }
    },
    {
      title: '冻结保证金',
      value: `¥${((summary.total_freeze || 0) - (summary.total_unfreeze || 0)).toLocaleString()}`,
      icon: <AlertOutlined style={{ fontSize: 28, color: '#faad14' }} />,
      color: '#fffbe6',
      borderColor: '#ffe58f',
      valueStyle: { color: '#faad14' }
    },
    {
      title: '当前可用',
      value: `¥${((summary.total_deposit || 0) - (summary.total_deduct || 0)).toLocaleString()}`,
      icon: <DollarOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      color: '#e6f7ff',
      borderColor: '#91d5ff',
      valueStyle: { color: '#1890ff' }
    }
  ];

  const filterOptions = [
    { value: 'all', label: '全部' },
    { value: 'deposit', label: '缴纳' },
    { value: 'deduct', label: '扣除' },
    { value: 'freeze', label: '冻结' },
    { value: 'unfreeze', label: '解冻' }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
            保证金监管
          </Title>
          <Text type="secondary">管理商家保证金，保障消费者权益</Text>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((card, index) => (
          <Col xs={12} sm={6} key={index}>
            <Card
              style={{
                background: card.color,
                borderRadius: 12,
                border: `1px solid ${card.borderColor}`,
                height: '100%'
              }}
              bodyStyle={{ padding: 16 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {card.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{card.title}</Text>
                  <div style={{ 
                    fontSize: 22, 
                    fontWeight: 700, 
                    lineHeight: 1.2,
                    ...card.valueStyle
                  }}>
                    {card.value}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card 
        style={{ borderRadius: 12 }}
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#faad14' }} />
            保证金变动记录
          </Space>
        }
        extra={
          <Select
            value={filterType}
            style={{ width: 120 }}
            onChange={setFilterType}
            size="small"
          >
            {filterOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        }
      >
        <Spin spinning={loading}>
          {records.length > 0 ? (
            <Table
              columns={columns}
              dataSource={records}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                onChange: handlePageChange,
                showSizeChanger: false,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              size="middle"
              scroll={{ x: 900 }}
            />
          ) : (
            <Empty 
              description="暂无保证金记录"
              style={{ padding: '60px 0' }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <Space>
            <MinusOutlined style={{ color: '#ff4d4f' }} />
            扣除保证金
          </Space>
        }
        open={deductModalVisible}
        onCancel={() => setDeductModalVisible(false)}
        onOk={submitDeduct}
        confirmLoading={actionLoading}
        okText="确认扣除"
        okButtonProps={{ danger: true }}
        width={520}
      >
        {selectedMerchant && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">商家: {selectedMerchant.name}</Tag>
          </div>
        )}
        <Form form={deductForm} layout="vertical">
          <Form.Item
            name="amount"
            label="扣除金额（元）"
            rules={[
              { required: true, message: '请输入扣除金额' },
              { type: 'number', min: 1, message: '金额必须大于0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1}
              step={1000}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\¥\s?|(,*)/g, '')}
              placeholder="请输入扣除金额"
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label="扣除原因"
            rules={[{ required: true, message: '请填写扣除原因' }]}
            extra="请详细说明扣除保证金的原因，该记录将永久保存"
          >
            <TextArea 
              rows={4} 
              placeholder="如：商家违约、客户投诉处理等"
            />
          </Form.Item>

          <div style={{ 
            padding: 16, 
            background: '#fff1f0', 
            borderRadius: 8,
            border: '1px dashed #ffa39e'
          }}>
            <Text type="secondary" style={{ fontSize: 13, color: '#ff4d4f' }}>
              <AlertOutlined style={{ marginRight: 6 }} />
              警告：扣除保证金将直接减少商家保证金余额，请谨慎操作。
            </Text>
          </div>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#52c41a' }} />
            补缴保证金
          </Space>
        }
        open={rechargeModalVisible}
        onCancel={() => setRechargeModalVisible(false)}
        onOk={submitRecharge}
        confirmLoading={actionLoading}
        okText="确认补缴"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
        width={520}
      >
        {selectedMerchant && (
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">商家: {selectedMerchant.name}</Tag>
          </div>
        )}
        <Form form={rechargeForm} layout="vertical">
          <Form.Item
            name="amount"
            label="补缴金额（元）"
            rules={[
              { required: true, message: '请输入补缴金额' },
              { type: 'number', min: 1, message: '金额必须大于0' }
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1}
              step={10000}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\¥\s?|(,*)/g, '')}
              placeholder="请输入补缴金额"
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea 
              rows={3} 
              placeholder="请输入备注信息（可选）"
            />
          </Form.Item>

          <div style={{ 
            padding: 16, 
            background: '#f6ffed', 
            borderRadius: 8,
            border: '1px dashed #b7eb8f'
          }}>
            <Text type="secondary" style={{ fontSize: 13, color: '#52c41a' }}>
              <SafetyCertificateOutlined style={{ marginRight: 6 }} />
              补缴成功后，商家保证金余额将相应增加，商家可以恢复正常经营。
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDeposits;
