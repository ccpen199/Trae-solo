import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Tag, Space, Modal, message, Descriptions, Typography, Tooltip, Statistic, Row, Col, Form, Input } from 'antd';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, UserSwitchOutlined, WarningOutlined, FileSearchOutlined } from '@ant-design/icons';
import { differencesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Differences = () => {
  const [loading, setLoading] = useState(false);
  const [differences, setDifferences] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentAction, setCurrentAction] = useState(null);
  const [form] = Form.useForm();
  const { hasRole } = useAuth();

  useEffect(() => {
    fetchDifferences();
    fetchDashboard();
  }, [filters, pagination.current, pagination.pageSize]);

  const fetchDifferences = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.current,
        pageSize: pagination.pageSize
      };
      const response = await differencesAPI.getList(params);
      if (response.data.success) {
        setDifferences(response.data.data.differences || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      message.error('获取差异单列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await differencesAPI.getDashboard();
      if (response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (error) {
      console.error('获取差异单统计失败:', error);
    }
  };

  const getDiffTypeLabel = (type) => {
    const map = {
      'credit_limit': '授信额度',
      'exchange_rate': '汇率差异',
      'invoice': '发票差异',
      'callback': '回调异常',
      'reconciliation': '对账差异'
    };
    return map[type] || type;
  };

  const getDiffTypeColor = (type) => {
    const map = {
      'credit_limit': 'red',
      'exchange_rate': 'orange',
      'invoice': 'gold',
      'callback': 'magenta',
      'reconciliation': 'red'
    };
    return map[type] || 'default';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      open: { color: 'red', text: '待处理' },
      processing: { color: 'orange', text: '处理中' },
      resolved: { color: 'green', text: '已解决' },
      closed: { color: 'default', text: '已关闭' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const openActionModal = (item, action) => {
    setSelectedItem(item);
    setCurrentAction(action);
    form.resetFields();
    setActionModalVisible(true);
  };

  const handleAction = async (values) => {
    if (!selectedItem) return;
    try {
      let response;
      const comment = values.comment || '';
      
      switch (currentAction) {
        case 'resolve':
          response = await differencesAPI.resolve(selectedItem.id, comment);
          break;
        case 'close':
          response = await differencesAPI.close(selectedItem.id, comment);
          break;
        case 'reassign':
          response = await differencesAPI.reassign(selectedItem.id, values.newOperatorId, comment);
          break;
        default:
          return;
      }
      
      if (response.data.success) {
        message.success('操作执行成功');
        setActionModalVisible(false);
        fetchDifferences();
        fetchDashboard();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  const columns = [
    {
      title: '差异单编号',
      dataIndex: 'diff_no',
      key: 'diff_no',
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
      key: 'bill_number',
      render: (text) => text || '-'
    },
    {
      title: '差异类型',
      dataIndex: 'diff_type',
      key: 'diff_type',
      render: (text) => (
        <Tag color={getDiffTypeColor(text)}>
          {getDiffTypeLabel(text)}
        </Tag>
      )
    },
    {
      title: '差异描述',
      dataIndex: 'diff_description',
      key: 'diff_description',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'current_status',
      key: 'current_status',
      render: (text) => getStatusTag(text)
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text && dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      render: (text) => text || '-'
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
          {(record.current_status === 'open' || record.current_status === 'processing') && (
            <>
              {hasRole(['finance', 'admin']) && (
                <Tooltip title="解决">
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    onClick={() => openActionModal(record, 'resolve')}
                  />
                </Tooltip>
              )}
              {hasRole(['admin']) && (
                <>
                  <Tooltip title="转派">
                    <Button 
                      type="link" 
                      size="small" 
                      icon={<UserSwitchOutlined />}
                      onClick={() => openActionModal(record, 'reassign')}
                    />
                  </Tooltip>
                  <Tooltip title="关闭">
                    <Button 
                      type="link" 
                      size="small" 
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => openActionModal(record, 'close')}
                    />
                  </Tooltip>
                </>
              )}
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>差异处理</Title>
        <Space>
          <Button icon={<FileSearchOutlined />} onClick={fetchDifferences}>
            刷新
          </Button>
        </Space>
      </div>

      {dashboard && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="差异单总数"
                value={dashboard.stats?.totalCount || 0}
                prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="待处理"
                value={dashboard.stats?.openCount || 0}
                prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="处理中"
                value={dashboard.stats?.processingCount || 0}
                prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic
                title="已解决"
                value={(dashboard.stats?.resolvedCount || 0) + (dashboard.stats?.closedCount || 0)}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="状态"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters(prev => ({ ...prev, currentStatus: value })}
            >
              <Option value="open">待处理</Option>
              <Option value="processing">处理中</Option>
              <Option value="resolved">已解决</Option>
              <Option value="closed">已关闭</Option>
            </Select>
            <Select
              placeholder="差异类型"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters(prev => ({ ...prev, diffType: value }))}
            >
              <Option value="credit_limit">授信额度</Option>
              <Option value="exchange_rate">汇率差异</Option>
              <Option value="invoice">发票差异</Option>
              <Option value="callback">回调异常</Option>
              <Option value="reconciliation">对账差异</Option>
            </Select>
            <Button type="primary" onClick={fetchDifferences}>查询</Button>
            <Button onClick={() => {
              setFilters({});
              setPagination(prev => ({ ...prev, current: 1 }));
            }}>重置</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={differences}
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
        title="差异单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
      >
        {selectedItem && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="差异单编号">{selectedItem.diff_no}</Descriptions.Item>
            <Descriptions.Item label="票据编号">{selectedItem.bill_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="差异类型">
              <Tag color={getDiffTypeColor(selectedItem.diff_type)}>
                {getDiffTypeLabel(selectedItem.diff_type)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="差异描述">{selectedItem.diff_description || '-'}</Descriptions.Item>
            <Descriptions.Item label="原状态">{selectedItem.original_status || '-'}</Descriptions.Item>
            <Descriptions.Item label="当前状态">{getStatusTag(selectedItem.current_status)}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{dayjs(selectedItem.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="解决时间">{selectedItem.resolved_at ? dayjs(selectedItem.resolved_at).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="解决备注">{selectedItem.resolution_comment || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作人">{selectedItem.operator_name || '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={
          currentAction === 'resolve' ? '解决差异' :
          currentAction === 'close' ? '关闭差异' : '转派差异'
        }
        open={actionModalVisible}
        onCancel={() => setActionModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleAction}>
          {currentAction === 'reassign' && (
            <Form.Item
              name="newOperatorId"
              label="选择新操作人"
              rules={[{ required: true, message: '请选择新操作人' }]}
            >
              <Select placeholder="请选择操作人">
                <Option value={1}>admin</Option>
              </Select>
            </Form.Item>
          )}
          <Form.Item
            name="comment"
            label={currentAction === 'resolve' ? '解决备注' : currentAction === 'close' ? '关闭备注' : '转派备注'}
            rules={[{ required: currentAction === 'resolve', message: '请输入备注' }]}
          >
            <TextArea rows={4} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setActionModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {currentAction === 'resolve' ? '确认解决' : currentAction === 'close' ? '确认关闭' : '确认转派'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Differences;
