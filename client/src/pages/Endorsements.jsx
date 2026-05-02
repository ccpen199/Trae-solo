import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, Form, Input, InputNumber, DatePicker, Select, message, Descriptions, Divider, Timeline, Typography, Popconfirm, Tooltip, Spin } from 'antd';
import { PlusOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, SwapOutlined, ExclamationCircleOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { endorsementsAPI, billsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Endorsements = () => {
  const [loading, setLoading] = useState(false);
  const [endorsements, setEndorsements] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [form] = Form.useForm();
  const [pendingBills, setPendingBills] = useState([]);
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchEndorsements();
    fetchPendingBills();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchEndorsements = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      const response = await endorsementsAPI.getList(params);
      if (response.data.success) {
        setEndorsements(response.data.data.endorsements || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('获取背书列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBills = async () => {
    try {
      const response = await billsAPI.getList({ status: 'pending_endorsement', pageSize: 100 });
      if (response.data.success) {
        setPendingBills(response.data.data.bills || []);
      }
    } catch (error) {
      console.error('获取待背书票据失败:', error);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审批' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已驳回' },
      pending_info: { color: 'gold', text: '待补充资料' },
      reassigned: { color: 'blue', text: '已转派' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const handleCreate = async (values) => {
    try {
      const response = await endorsementsAPI.create({
        ...values,
        endorsementDate: values.endorsementDate?.format('YYYY-MM-DD')
      });
      if (response.data.success) {
        message.success('背书申请创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchEndorsements();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '创建失败');
    }
  };

  const handleAction = async (action, comment = '') => {
    if (!selectedItem) return;
    try {
      let response;
      switch (action) {
        case 'approve':
          response = await endorsementsAPI.approve(selectedItem.id, comment);
          break;
        case 'reject':
          response = await endorsementsAPI.reject(selectedItem.id, comment);
          break;
        case 'request_info':
          response = await endorsementsAPI.requestInfo(selectedItem.id, comment);
          break;
        case 'reassign':
          response = await endorsementsAPI.reassign(selectedItem.id, comment);
          break;
        default:
          return;
      }
      
      if (response.data.success) {
        message.success('操作执行成功');
        setDetailModalVisible(false);
        fetchEndorsements();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '背书编号',
      dataIndex: 'endorsement_no',
      key: 'endorsement_no',
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
      title: '背书人',
      dataIndex: 'from_company',
      key: 'from_company'
    },
    {
      title: '被背书人',
      dataIndex: 'to_company',
      key: 'to_company'
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (text) => `¥${text?.toLocaleString() || 0}`
    },
    {
      title: '背书日期',
      dataIndex: 'endorsement_date',
      key: 'endorsement_date',
      render: (text) => text && dayjs(text).format('YYYY-MM-DD')
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
        <Title level={3} style={{ margin: 0 }}>背书流转</Title>
        {hasRole(['finance', 'admin']) && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            新建背书
          </Button>
        )}
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
              <Option value="pending_info">待补充资料</Option>
              <Option value="reassigned">已转派</Option>
            </Select>
            <Button type="primary" onClick={fetchEndorsements}>查询</Button>
            <Button onClick={() => {
              setFilters({});
              setPagination(prev => ({ ...prev, current: 1 }));
            }}>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={endorsements}
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
        title="新建背书"
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
            <Select placeholder="选择待背书的票据">
              {pendingBills.map(bill => (
                <Option key={bill.id} value={bill.id}>
                  {bill.bill_number} - ¥{bill.amount.toLocaleString()}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="fromCompany"
            label="背书人"
            rules={[{ required: true, message: '请输入背书人' }]}
          >
            <Input placeholder="请输入背书人名称" />
          </Form.Item>

          <Form.Item
            name="toCompany"
            label="被背书人"
            rules={[{ required: true, message: '请输入被背书人' }]}
          >
            <Input placeholder="请输入被背书人名称" />
          </Form.Item>

          <Form.Item
            name="amount"
            label="背书金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              placeholder="请输入金额"
              min={0}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="endorsementDate"
            label="背书日期"
            rules={[{ required: true, message: '请选择日期' }]}
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
        title="背书详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={600}
        footer={selectedItem?.status === 'pending' && hasRole(['bank', 'admin']) ? [
          <Button key="info" onClick={() => handleAction('request_info')}>
            <ExclamationCircleOutlined /> 要求补充资料
          </Button>,
          <Button key="reassign" onClick={() => handleAction('reassign')}>
            <UserSwitchOutlined /> 转派
          </Button>,
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
          <Descriptions bordered column={1}>
            <Descriptions.Item label="背书编号">{selectedItem.endorsement_no}</Descriptions.Item>
            <Descriptions.Item label="票据编号">{selectedItem.bill_number}</Descriptions.Item>
            <Descriptions.Item label="背书人">{selectedItem.from_company}</Descriptions.Item>
            <Descriptions.Item label="被背书人">{selectedItem.to_company}</Descriptions.Item>
            <Descriptions.Item label="金额">{`¥${selectedItem.amount?.toLocaleString() || 0}`}</Descriptions.Item>
            <Descriptions.Item label="背书日期">{selectedItem.endorsement_date && dayjs(selectedItem.endorsement_date).format('YYYY-MM-DD')}</Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(selectedItem.status)}</Descriptions.Item>
            <Descriptions.Item label="操作人">{selectedItem.operator_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="审批意见">{selectedItem.approval_comment || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default Endorsements;
