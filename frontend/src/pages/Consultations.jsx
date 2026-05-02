import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Input, Select, Row, Col, Empty, Spin, Timeline, Descriptions, Divider, message, Modal, Form, InputNumber, Rate, Avatar, Badge, Checkbox } from 'antd';
import { 
  EyeOutlined, 
  MessageOutlined, 
  CheckOutlined, 
  FileTextOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  SendOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { Search, TextArea } = Input;

const CATEGORIES = [
  { id: 'civil', name: '民事纠纷' },
  { id: 'contract', name: '合同纠纷' },
  { id: 'labor', name: '劳动争议' },
  { id: 'criminal', name: '刑事辩护' },
  { id: 'corporate', name: '公司事务' },
  { id: 'intellectual', name: '知识产权' },
  { id: 'real_estate', name: '房产纠纷' },
  { id: 'traffic', name: '交通事故' },
  { id: 'consumer', name: '消费维权' }
];

const Consultations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [filters, setFilters] = useState({ status: '', category: '' });

  useEffect(() => {
    fetchConsultations();
  }, [filters]);

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      let url = '/api/consultations/my';
      const params = [];
      if (filters.status) params.push(`status=${filters.status}`);
      if (filters.category) params.push(`category=${filters.category}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await api.get(url);
      if (response.success) {
        setConsultations(response.consultations || []);
      }
    } catch (error) {
      console.error('获取咨询列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending_payment: { text: '待支付', color: 'orange', actions: ['支付'] },
      pending_accept: { text: '待接单', color: 'blue', actions: ['查看'] },
      in_progress: { text: '进行中', color: 'cyan', actions: ['聊天', '查看'] },
      suggested: { text: '已提交建议', color: 'purple', actions: ['确认', '查看'] },
      pending_review: { text: '待评价', color: 'gold', actions: ['评价', '查看'] },
      reviewed: { text: '已评价', color: 'green', actions: ['查看'] },
      settled: { text: '已结算', color: 'green', actions: ['查看'] }
    };
    return config[status] || { text: status, color: 'default', actions: [] };
  };

  const getCategoryName = (id) => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
  };

  return (
    <div>
      <Card 
        title="我的咨询" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/consultations/create')}>
            发布咨询
          </Button>
        }
      >
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(value) => setFilters({ ...filters, status: value || '' })}
            >
              <Option value="pending_payment">待支付</Option>
              <Option value="pending_accept">待接单</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="suggested">已提交建议</Option>
              <Option value="pending_review">待评价</Option>
              <Option value="reviewed">已评价</Option>
              <Option value="settled">已结算</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Select
              placeholder="筛选分类"
              allowClear
              style={{ width: '100%' }}
              value={filters.category || undefined}
              onChange={(value) => setFilters({ ...filters, category: value || '' })}
            >
              {CATEGORIES.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>

        <Spin spinning={loading}>
          {consultations.length > 0 ? (
            <List
              dataSource={consultations}
              renderItem={(item) => {
                const statusConfig = getStatusConfig(item.status);
                return (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/consultations/${item.id}`)}
                      >
                        查看详情
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '500' }}>{item.title}</span>
                          <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                          <Tag>{getCategoryName(item.category)}</Tag>
                        </div>
                      }
                      description={
                        <div>
                          <p style={{ margin: '8px 0', color: '#666' }}>
                            {item.description?.substring(0, 100)}...
                          </p>
                          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: '#999' }}>
                            <span>预算: ¥{item.budget_amount}</span>
                            <span>律师: {item.lawyer_name || '待分配'}</span>
                            <span>创建时间: {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <Empty 
              description="暂无咨询记录"
              style={{ padding: '40px' }}
            >
              <Button type="primary" onClick={() => navigate('/consultations/create')}>
                发布第一个咨询
              </Button>
            </Empty>
          )}
        </Spin>
      </Card>
    </div>
  );
};

export const ConsultationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [reviewForm] = Form.useForm();
  const [suggestionForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchConsultationDetail();
    }
  }, [id]);

  const fetchConsultationDetail = async () => {
    setLoading(true);
    try {
      const [consultationRes, messagesRes] = await Promise.all([
        api.get(`/api/consultations/${id}`),
        api.get(`/api/messages/consultations/${id}`)
      ]);

      if (consultationRes.success) {
        setConsultation(consultationRes.consultation);
      }
      if (messagesRes.success) {
        setMessages(messagesRes.messages || []);
      }
    } catch (error) {
      console.error('获取咨询详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim()) return;

    setSending(true);
    try {
      const response = await api.post(`/api/messages/consultations/${id}/send`, {
        content: messageInput
      });
      if (response.success) {
        setMessageInput('');
        fetchConsultationDetail();
      }
    } catch (error) {
      console.error('发送消息失败:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async () => {
    try {
      const response = await api.post(`/api/consultations/${id}/accept`);
      if (response.success) {
        message.success('接单成功');
        fetchConsultationDetail();
      }
    } catch (error) {
      console.error('接单失败:', error);
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await api.post(`/api/consultations/${id}/confirm`);
      if (response.success) {
        message.success('确认成功，请对律师服务进行评价');
        fetchConsultationDetail();
      }
    } catch (error) {
      console.error('确认失败:', error);
    }
  };

  const handleSubmitSuggestion = async (values) => {
    try {
      const response = await api.post(`/api/consultations/${id}/suggestion`, values);
      if (response.success) {
        message.success('建议提交成功');
        setShowSuggestionModal(false);
        fetchConsultationDetail();
      }
    } catch (error) {
      console.error('提交建议失败:', error);
    }
  };

  const handleSubmitReview = async (values) => {
    try {
      const response = await api.post(`/api/consultations/${id}/review`, values);
      if (response.success) {
        message.success('评价提交成功，费用已结算');
        setShowReviewModal(false);
        fetchConsultationDetail();
      }
    } catch (error) {
      console.error('提交评价失败:', error);
    }
  };

  const handlePay = async () => {
    try {
      const response = await api.post(`/api/consultations/${id}/pay`);
      if (response.success) {
        message.success('支付成功，律师已接单');
        fetchConsultationDetail();
      }
    } catch (error) {
      console.error('支付失败:', error);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending_payment: { text: '待支付', color: 'orange' },
      pending_accept: { text: '待接单', color: 'blue' },
      in_progress: { text: '进行中', color: 'cyan' },
      suggested: { text: '已提交建议', color: 'purple' },
      pending_review: { text: '待评价', color: 'gold' },
      reviewed: { text: '已评价', color: 'green' },
      settled: { text: '已结算', color: 'green' }
    };
    return config[status] || { text: status, color: 'default' };
  };

  const renderActions = () => {
    if (!consultation) return null;

    const actions = [];

    if (consultation.status === 'pending_payment' && user.role === 'client') {
      actions.push(
        <Button key="pay" type="primary" onClick={handlePay}>
          立即支付
        </Button>
      );
    }

    if (consultation.status === 'pending_accept' && user.role === 'lawyer') {
      actions.push(
        <Button key="accept" type="primary" onClick={handleAccept}>
          接受咨询
        </Button>
      );
    }

    if (consultation.status === 'in_progress' && user.role === 'lawyer') {
      actions.push(
        <Button key="suggestion" type="primary" onClick={() => setShowSuggestionModal(true)}>
          提交咨询建议
        </Button>
      );
    }

    if (consultation.status === 'suggested' && user.role === 'client') {
      actions.push(
        <Button key="confirm" type="primary" onClick={handleConfirm}>
          确认建议
        </Button>
      );
    }

    if (consultation.status === 'pending_review' && user.role === 'client') {
      actions.push(
        <Button key="review" type="primary" onClick={() => setShowReviewModal(true)}>
          评价服务
        </Button>
      );
    }

    return actions;
  };

  if (loading) {
    return <Spin tip="加载中..." style={{ display: 'flex', justifyContent: 'center', padding: '40px' }} />;
  }

  if (!consultation) {
    return <div>咨询单不存在</div>;
  }

  const statusConfig = getStatusConfig(consultation.status);

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/consultations')}
        style={{ marginBottom: '16px' }}
      >
        返回咨询列表
      </Button>

      <Card>
        <Row gutter={24}>
          <Col span={16}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0 }}>{consultation.title}</h2>
                <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
              </div>
              
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="咨询分类">
                  {consultation.category}
                </Descriptions.Item>
                <Descriptions.Item label="紧急程度">
                  {consultation.urgency === 'urgent' ? '紧急' : consultation.urgency === 'emergency' ? '加急' : '普通'}
                </Descriptions.Item>
                <Descriptions.Item label="预算金额">
                  <span style={{ color: '#1890ff', fontWeight: 'bold' }}>¥{consultation.budget_amount}</span>
                </Descriptions.Item>
                <Descriptions.Item label="律师">
                  {consultation.lawyer_real_name || consultation.lawyer_username || '待分配'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(consultation.created_at).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="操作">
                  {renderActions()}
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Divider>咨询描述</Divider>
            <Card size="small" style={{ marginBottom: '24px' }}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{consultation.description}</p>
            </Card>

            {consultation.suggestion_id && (
              <>
                <Divider>律师建议</Divider>
                <Card 
                  size="small" 
                  title="咨询建议书"
                  style={{ marginBottom: '24px' }}
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="咨询摘要">
                      {consultation.suggestion_summary}
                    </Descriptions.Item>
                    <Descriptions.Item label="详细建议">
                      {consultation.suggestion_detail}
                    </Descriptions.Item>
                    {consultation.suggestion_legal_basis && (
                      <Descriptions.Item label="法律依据">
                        {consultation.suggestion_legal_basis}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </>
            )}

            {consultation.status === 'in_progress' && (
              <>
                <Divider>实时沟通</Divider>
                <Card size="small" style={{ marginBottom: '16px' }}>
                  <div 
                    style={{ 
                      height: '300px', 
                      overflowY: 'auto',
                      padding: '16px',
                      background: '#f5f5f5',
                      borderRadius: '8px'
                    }}
                  >
                    {messages.length > 0 ? (
                      messages.map((msg, index) => (
                        <div 
                          key={msg.id || index}
                          style={{
                            marginBottom: '12px',
                            textAlign: msg.sender_id === user.id ? 'right' : 'left'
                          }}
                        >
                          <div style={{
                            display: 'inline-block',
                            maxWidth: '70%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: msg.sender_id === user.id ? '#1890ff' : '#fff',
                            color: msg.sender_id === user.id ? '#fff' : '#333',
                            textAlign: 'left'
                          }}>
                            <p style={{ margin: 0 }}>{msg.content}</p>
                            <p style={{ 
                              margin: '4px 0 0 0', 
                              fontSize: '11px', 
                              opacity: 0.7 
                            }}>
                              {dayjs(msg.created_at).format('HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty description="暂无消息" style={{ padding: '40px' }} />
                    )}
                  </div>
                </Card>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Input.TextArea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="输入消息内容..."
                    size="large"
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ flex: 1 }}
                  />
                  <Button 
                    type="primary" 
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sending}
                    size="large"
                  >
                    发送
                  </Button>
                </div>
              </>
            )}
          </Col>

          <Col span={8}>
            <Card title="状态流转" size="small">
              <Timeline>
                {consultation.statusLogs?.map((log, index) => (
                  <Timeline.Item 
                    key={log.id || index}
                    color={index === consultation.statusLogs.length - 1 ? 'green' : 'blue'}
                  >
                    <p style={{ margin: 0 }}>{log.to_status}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#999' }}>
                      {log.changed_by_name || '系统'} - {dayjs(log.created_at).format('MM-DD HH:mm')}
                    </p>
                    {log.reason && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>{log.reason}</p>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        title="提交咨询建议"
        open={showSuggestionModal}
        onCancel={() => setShowSuggestionModal(false)}
        onOk={() => suggestionForm.submit()}
        width={800}
      >
        <Form
          form={suggestionForm}
          layout="vertical"
          onFinish={handleSubmitSuggestion}
        >
          <Form.Item
            name="summary"
            label="咨询摘要"
            rules={[{ required: true, message: '请输入咨询摘要' }]}
          >
            <Input.TextArea rows={3} placeholder="简要总结咨询内容和解决方案要点" />
          </Form.Item>
          <Form.Item
            name="detailedAdvice"
            label="详细建议"
            rules={[{ required: true, message: '请输入详细建议' }]}
          >
            <Input.TextArea rows={6} placeholder="详细说明法律建议和解决方案" />
          </Form.Item>
          <Form.Item
            name="legalBasis"
            label="法律依据"
          >
            <Input.TextArea rows={3} placeholder="引用相关法律法规或判例" />
          </Form.Item>
          <Form.Item
            name="recommendedActions"
            label="行动建议"
          >
            <Input.TextArea rows={3} placeholder="建议用户采取的具体行动步骤" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="评价律师服务"
        open={showReviewModal}
        onCancel={() => setShowReviewModal(false)}
        onOk={() => reviewForm.submit()}
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={handleSubmitReview}
          initialValues={{ rating: 5 }}
        >
          <Form.Item
            name="rating"
            label="服务评分"
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="comment"
            label="评价内容"
          >
            <Input.TextArea rows={4} placeholder="请分享您的咨询体验（选填）" />
          </Form.Item>
          <Form.Item
            name="isAnonymous"
            valuePropName="checked"
          >
            <Checkbox>匿名评价</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Consultations;
