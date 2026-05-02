import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Tag, 
  Space, 
  Input, 
  Select, 
  DatePicker, 
  Modal, 
  Form, 
  InputNumber, 
  message,
  Descriptions,
  Divider,
  Timeline,
  Typography,
  Tooltip,
  Popconfirm,
  Spin,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { billsAPI } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const Bills = () => {
  const [loading, setLoading] = useState(false);
  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    if (status) {
      setFilters(prev => ({ ...prev, status }));
    }
  }, [location.search]);

  useEffect(() => {
    fetchBills();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      const response = await billsAPI.getList(params);
      if (response.data.success) {
        setBills(response.data.data.bills || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('获取票据列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending_input: { color: 'blue', text: '待票据录入' },
      pending_endorsement: { color: 'orange', text: '待背书流转' },
      pending_discount: { color: 'gold', text: '待贴现申请' },
      pending_maturity: { color: 'purple', text: '待到期提示' },
      archived: { color: 'green', text: '已归档' },
      difference: { color: 'red', text: '差异处理中' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getBillTypeLabel = (type) => {
    return type === 'bank_acceptance' ? '银行承兑' : '商业承兑';
  };

  const handleCreateBill = async (values) => {
    try {
      const response = await billsAPI.create({
        ...values,
        issueDate: values.issueDate?.format('YYYY-MM-DD'),
        maturityDate: values.maturityDate?.format('YYYY-MM-DD')
      });
      if (response.data.success) {
        message.success('票据创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchBills();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '创建票据失败');
    }
  };

  const handleViewDetail = async (bill) => {
    try {
      const response = await billsAPI.getById(bill.id);
      if (response.data.success) {
        setSelectedBill(response.data.data);
        setDetailModalVisible(true);
      }
    } catch (error) {
      message.error('获取票据详情失败');
    }
  };

  const handlePerformAction = async (action, comment = '') => {
    if (!selectedBill) return;
    try {
      const response = await billsAPI.performAction(selectedBill.id, action, comment);
      if (response.data.success) {
        message.success(`操作执行成功`);
        setDetailModalVisible(false);
        fetchBills();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作执行失败');
    }
  };

  const handleDeleteBill = async (bill) => {
    try {
      const response = await billsAPI.delete(bill.id);
      if (response.data.success) {
        message.success('票据删除成功');
        fetchBills();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '删除票据失败');
    }
  };

  const columns = [
    {
      title: '票据编号',
      dataIndex: 'bill_number',
      key: 'bill_number',
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      )
    },
    {
      title: '票据类型',
      dataIndex: 'bill_type',
      key: 'bill_type',
      render: (text) => getBillTypeLabel(text)
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => `¥${text?.toLocaleString() || 0}`
    },
    {
      title: '出票人',
      dataIndex: 'drawer',
      key: 'drawer'
    },
    {
      title: '承兑人',
      dataIndex: 'acceptor',
      key: 'acceptor'
    },
    {
      title: '到期日',
      dataIndex: 'maturity_date',
      key: 'maturity_date',
      render: (text) => text && dayjs(text).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => getStatusTag(text)
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      render: (level) => {
        const colors = { low: 'green', medium: 'orange', high: 'red' };
        const labels = { low: '低', medium: '中', high: '高' };
        return level ? <Tag color={colors[level]}>{labels[level]}</Tag> : '-';
      }
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
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'pending_input' && hasRole(['finance', 'admin']) && (
            <>
              <Tooltip title="提交">
                <Button 
                  type="link" 
                  size="small" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    setSelectedBill(record);
                    handlePerformAction('submit');
                  }}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Popconfirm
                  title="确定要删除此票据吗？"
                  onConfirm={() => handleDeleteBill(record)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button 
                    type="link" 
                    size="small" 
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
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
        <Title level={3} style={{ margin: 0 }}>票据台账</Title>
        {hasRole(['finance', 'admin']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建票据
          </Button>
        )}
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="票据编号"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              onChange={(e) => setFilters(prev => ({ ...prev, billNumber: e.target.value }))}
              allowClear
            />
            <Select
              placeholder="状态"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              value={filters.status || undefined}
            >
              <Option value="pending_input">待票据录入</Option>
              <Option value="pending_endorsement">待背书流转</Option>
              <Option value="pending_discount">待贴现申请</Option>
              <Option value="pending_maturity">待到期提示</Option>
              <Option value="archived">已归档</Option>
              <Option value="difference">差异处理中</Option>
            </Select>
            <Select
              placeholder="票据类型"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters(prev => ({ ...prev, billType: value }))}
            >
              <Option value="bank_acceptance">银行承兑</Option>
              <Option value="commercial_acceptance">商业承兑</Option>
            </Select>
            <RangePicker
              style={{ width: 260 }}
              onChange={(dates) => {
                if (dates) {
                  setFilters(prev => ({
                    ...prev,
                    startDate: dates[0]?.format('YYYY-MM-DD'),
                    endDate: dates[1]?.format('YYYY-MM-DD')
                  }));
                } else {
                  setFilters(prev => {
                    const { startDate, endDate, ...rest } = prev;
                    return rest;
                  });
                }
              }}
            />
            <Button type="primary" onClick={fetchBills}>查询</Button>
            <Button onClick={() => {
              setFilters({});
              setPagination(prev => ({ ...prev, current: 1 }));
            }}>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={bills}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={(page, pageSize) => {
            setPagination(prev => ({ ...prev, current: page, pageSize }));
          }}
        />
      </Card>

      <Modal
        title="新建票据"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateBill}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="billType"
                label="票据类型"
                rules={[{ required: true, message: '请选择票据类型' }]}
              >
                <Select placeholder="请选择票据类型">
                  <Option value="bank_acceptance">银行承兑汇票</Option>
                  <Option value="commercial_acceptance">商业承兑汇票</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="billNumber"
                label="票据编号"
                rules={[{ required: true, message: '请输入票据编号' }]}
              >
                <Input placeholder="请输入票据编号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="金额 (元)"
                rules={[{ required: true, message: '请输入金额' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  placeholder="请输入金额"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="expectedCompleteDate"
                label="期望完成日期"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="drawer"
                label="出票人"
                rules={[{ required: true, message: '请输入出票人' }]}
              >
                <Input placeholder="请输入出票人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="acceptor"
                label="承兑人"
                rules={[{ required: true, message: '请输入承兑人' }]}
              >
                <Input placeholder="请输入承兑人" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="payee"
                label="收款人"
                rules={[{ required: true, message: '请输入收款人' }]}
              >
                <Input placeholder="请输入收款人" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="issueDate"
                label="出票日期"
                rules={[{ required: true, message: '请选择出票日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maturityDate"
                label="到期日期"
                rules={[{ required: true, message: '请选择到期日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建票据
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="票据详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedBill && (
          <Spin spinning={!selectedBill}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="票据编号">{selectedBill.bill_number}</Descriptions.Item>
              <Descriptions.Item label="票据类型">{getBillTypeLabel(selectedBill.bill_type)}</Descriptions.Item>
              <Descriptions.Item label="金额">{`¥${selectedBill.amount?.toLocaleString() || 0}`}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedBill.status)}</Descriptions.Item>
              <Descriptions.Item label="出票人">{selectedBill.drawer}</Descriptions.Item>
              <Descriptions.Item label="承兑人">{selectedBill.acceptor}</Descriptions.Item>
              <Descriptions.Item label="收款人">{selectedBill.payee}</Descriptions.Item>
              <Descriptions.Item label="风险等级">
                {selectedBill.risk_level ? (
                  <Tag color={selectedBill.risk_level === 'low' ? 'green' : selectedBill.risk_level === 'medium' ? 'orange' : 'red'}>
                    {selectedBill.risk_level === 'low' ? '低' : selectedBill.risk_level === 'medium' ? '中' : '高'}
                    (风险评分: {selectedBill.risk_score})
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="出票日期">{dayjs(selectedBill.issue_date).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="到期日期">{dayjs(selectedBill.maturity_date).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedBill.created_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="责任人">{selectedBill.responsible_person_name || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">状态流转历史</Divider>
            
            <Timeline>
              {selectedBill.statusHistory?.map((item, index) => (
                <Timeline.Item 
                  key={index}
                  color={item.to_status === 'archived' ? 'green' : item.to_status === 'difference' ? 'red' : 'blue'}
                >
                  <div>
                    <Text strong>
                      {item.action === 'create' ? '创建票据' : 
                       item.action === 'submit' ? '提交审核' :
                       item.action === 'approve' ? '审批通过' :
                       item.action === 'reject' ? '审批驳回' :
                       item.action === 'process' ? '处理完成' : item.action}
                    </Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {item.to_status === 'pending_input' ? '待票据录入' :
                       item.to_status === 'pending_endorsement' ? '待背书流转' :
                       item.to_status === 'pending_discount' ? '待贴现申请' :
                       item.to_status === 'pending_maturity' ? '待到期提示' :
                       item.to_status === 'archived' ? '已归档' :
                       item.to_status === 'difference' ? '差异处理中' : item.to_status}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Text type="secondary">
                      操作人: {item.operator_name || '系统'} | {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </div>
                  {item.comment && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary">备注: {item.comment}</Text>
                    </div>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>

            {selectedBill.taxes && (
              <>
                <Divider orientation="left">税费计算</Divider>
                <Descriptions bordered column={2}>
                  <Descriptions.Item label="票据金额">¥{selectedBill.amount?.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="税费总额">¥{selectedBill.taxes.totalTaxAmount?.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="净额">¥{selectedBill.taxes.netAmount?.toLocaleString()}</Descriptions.Item>
                </Descriptions>
              </>
            )}
          </Spin>
        )}
      </Modal>
    </div>
  );
};

export default Bills;
