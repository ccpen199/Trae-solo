import React, { useEffect, useState } from 'react';
import { 
  Card, Table, Button, Modal, Form, Input, Select, Tag, message, Space, 
  Empty, Alert, Row, Col, Statistic, Result
} from 'antd';
import { 
  PlusOutlined, EyeOutlined, HistoryOutlined, 
  InboxOutlined, WarningOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { Option } = Select;
const { TextArea } = Input;

function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState('');
  const [apiError, setApiError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTickets();
    loadTicketTypes();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    setApiError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录后查看您的工单');
        setTickets([]);
        setLoading(false);
        return;
      }
      
      const response = await api.get('/tickets/my');
      setTickets(response.data.tickets || []);
    } catch (error) {
      console.error('加载工单失败', error);
      setApiError(error.response?.data?.error || '加载工单失败，请稍后重试');
      setTickets([]);
    }
    setLoading(false);
  };

  const loadTicketTypes = async () => {
    try {
      const response = await api.get('/tickets/types');
      setTicketTypes(response.data.types || []);
      setStatuses(response.data.statuses || []);
    } catch (error) {
      console.error('加载工单类型失败', error);
      setTicketTypes([
        { id: 'refund', name: '退订申请', description: '报刊杂志退订', icon: '↩️' },
        { id: 'resend', name: '补寄申请', description: '缺失刊物补寄', icon: '📦' },
        { id: 'damage', name: '破损索赔', description: '物品破损赔偿', icon: '💔' },
        { id: 'other', name: '其他问题', description: '其他售后服务', icon: '❓' }
      ]);
    }
  };

  const handleCreate = async (values) => {
    try {
      setApiError('');
      const response = await api.post('/tickets', values);
      message.success(response.data.message || '工单创建成功');
      setModalVisible(false);
      form.resetFields();
      loadTickets();
      
      setTimeout(() => {
        navigate(`/tickets/${response.data.id}`);
      }, 500);
    } catch (error) {
      const errMsg = error.response?.data?.error || '创建失败';
      message.error(errMsg);
      setApiError(errMsg);
    }
  };

  const getTypeInfo = (typeId) => {
    const type = ticketTypes.find(t => t.id === typeId);
    return type || { name: typeId, icon: '📝' };
  };

  const getStatusColor = (status) => {
    const colors = { open: 'red', processing: 'blue', closed: 'default' };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const statusInfo = statuses.find(s => s.id === status);
    return statusInfo?.name || status;
  };

  const getPriorityColor = (priority) => {
    const colors = { high: 'red', normal: 'blue', low: 'default' };
    return colors[priority] || 'default';
  };

  const getPriorityText = (priority) => {
    const texts = { high: '高', normal: '普通', low: '低' };
    return texts[priority] || priority;
  };

  const filteredTickets = activeTab === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === activeTab);

  const statistics = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    processing: tickets.filter(t => t.status === 'processing').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  const columns = [
    { 
      title: '工单号', 
      dataIndex: 'id', 
      key: 'id', 
      width: 80,
      render: (id) => <Tag color="blue">#{id}</Tag>
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      width: 120,
      render: (type) => {
        const info = getTypeInfo(type);
        return <Space><span>{info.icon}</span><span>{info.name}</span></Space>;
      }
    },
    { 
      title: '标题', 
      dataIndex: 'title', 
      key: 'title',
      ellipsis: true
    },
    { 
      title: '优先级', 
      dataIndex: 'priority', 
      key: 'priority', 
      width: 80,
      render: (p) => <Tag color={getPriorityColor(p)}>{getPriorityText(p)}</Tag>
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'created_at', 
      key: 'created_at',
      width: 160
    },
    { 
      title: '操作', 
      key: 'action', 
      width: 100,
      render: (_, record) => (
        <Link to={`/tickets/${record.id}`}>
          <Button size="small" type="link" icon={<EyeOutlined />}>查看详情</Button>
        </Link>
      )
    },
  ];

  const renderEmptyState = () => {
    if (error) {
      return (
        <Result
          status="warning"
          title="请先登录"
          subTitle={error}
          extra={
            <Link to="/login">
              <Button type="primary" size="large">立即登录</Button>
            </Link>
          }
        />
      );
    }

    if (apiError) {
      return (
        <Card>
          <Alert
            message="加载失败"
            description={
              <Space direction="vertical">
                <span>{apiError}</span>
                <Button type="primary" size="small" onClick={loadTickets}>重新加载</Button>
              </Space>
            }
            type="error"
            showIcon
          />
        </Card>
      );
    }

    return (
      <Card>
        <Empty
          image={<InboxOutlined style={{ fontSize: 64, color: '#ccc' }} />}
          description={
            <div>
              <h3 style={{ color: '#666', marginBottom: 8 }}>暂无售后工单</h3>
              <p style={{ color: '#999', marginBottom: 16 }}>
                如您有报刊订阅、商品包裹等问题，可提交售后工单
              </p>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
                  提交您的第一个工单
                </Button>
                <Space wrap style={{ justifyContent: 'center' }}>
                  <Tag color="default">↩️ 退订申请</Tag>
                  <Tag color="default">📦 补寄申请</Tag>
                  <Tag color="default">💔 破损索赔</Tag>
                  <Tag color="default">❓ 其他问题</Tag>
                </Space>
              </Space>
            </div>
          }
        />
      </Card>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>售后服务</h1>
          <p style={{ color: '#999', margin: '8px 0 0 0' }}>处理您的退订、补寄、索赔等售后问题</p>
        </div>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setModalVisible(true)}>
            提交工单
          </Button>
        </Space>
      </div>

      {tickets.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="全部工单" 
                value={statistics.all} 
                prefix={<HistoryOutlined />} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="待处理" 
                value={statistics.open} 
                prefix={<WarningOutlined />} 
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="处理中" 
                value={statistics.processing} 
                prefix={<HistoryOutlined />} 
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic 
                title="已完成" 
                value={statistics.closed} 
                prefix={<CheckCircleOutlined />} 
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {tickets.length > 0 ? (
        <Card>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button type={activeTab === 'all' ? 'primary' : 'default'} onClick={() => setActiveTab('all')}>
                全部 ({statistics.all})
              </Button>
              <Button type={activeTab === 'open' ? 'primary' : 'default'} danger={activeTab === 'open'} onClick={() => setActiveTab('open')}>
                待处理 ({statistics.open})
              </Button>
              <Button type={activeTab === 'processing' ? 'primary' : 'default'} onClick={() => setActiveTab('processing')}>
                处理中 ({statistics.processing})
              </Button>
              <Button type={activeTab === 'closed' ? 'primary' : 'default'} onClick={() => setActiveTab('closed')}>
                已完成 ({statistics.closed})
              </Button>
            </Space>
          </div>
          
          <Table
            columns={columns}
            dataSource={filteredTickets}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <span>
                      该分类下暂无工单
                      <Button type="link" onClick={() => setActiveTab('all')}>查看全部</Button>
                    </span>
                  }
                />
              )}}
            />
        </Card>
      ) : (
        !loading && renderEmptyState()
      )}

      {loading && tickets.length === 0 && !error && !apiError && (
        <Card><Empty description="加载中..." /></Card>
      )}

      <Modal
        title="提交售后工单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        {apiError && (
          <Alert message={apiError} type="error" showIcon style={{ marginBottom: 16 }} />
        )}
        
        <Form form={form} layout="vertical" onFinish={handleCreate} preserve={false}>
          <Form.Item name="type" label="问题类型" rules={[{ required: true, message: '请选择问题类型' }]}>
            <Select placeholder="请选择您遇到的问题类型">
              {ticketTypes.map(type => (
                <Option key={type.id} value={type.id}>
                  <Space>{type.icon} {type.name} - {type.description}</Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="问题标题" rules={[{ required: true, message: '请输入问题标题' }]}>
            <Input placeholder="请简要描述您的问题（不超过50字）" maxLength={50} showCount />
          </Form.Item>
          <Form.Item name="related_id" label="关联订单/订阅号（选填）">
            <Input placeholder="如有相关订单或订阅，请填写编号以便快速处理" />
          </Form.Item>
          <Form.Item 
            name="description" 
            label="详细描述" 
            rules={[
              { required: true, message: '请输入详细描述' },
              { min: 10, message: '描述内容不少于10个字，以便我们更好地为您处理' }
            ]}
          >
            <TextArea 
              rows={5} 
              placeholder="请详细描述您遇到的问题，包括时间、地点、具体情况等。如有照片可在后续回复中上传。" 
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)} size="large">取消</Button>
              <Button type="primary" htmlType="submit" size="large">提交工单</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Tickets;
