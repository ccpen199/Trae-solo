import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  List,
  Tag,
  Rate,
  Modal,
  Form,
  Input,
  Avatar,
  Button,
  Space,
  Card,
  Empty,
  Divider,
  Badge,
  Spin,
  Upload,
  Tooltip,
  Typography,
  message,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  RobotOutlined,
  SendOutlined,
  PaperClipOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockTickets, policyDocuments } from '../../shared/mockData';
import {
  Ticket,
  TicketIntent,
  TicketPriority,
  TicketStatus,
  ChatMessage,
  PolicyDocument,
} from '../../shared/types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const INTENT_NAMES: Record<TicketIntent, string> = {
  PAYMENT_INTERRUPT: '社保断缴问题',
  TRANSFER: '社保转移',
  PENSION_CALCULATE: '退休金计算',
  REIMBURSEMENT: '医保报销',
  BASE_QUESTION: '缴费基数问题',
  POLICY_CONSULT: '政策咨询',
  REFUND: '退费申请',
  OTHER: '其他问题',
};

const PRIORITY_NAMES: Record<TicketPriority, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  URGENT: '紧急',
};

const STATUS_NAMES: Record<TicketStatus, string> = {
  NEW: '新工单',
  AI_PROCESSING: 'AI处理中',
  AI_RESOLVED: 'AI已解决',
  PENDING_AGENT: '待人工分配',
  ASSIGNED: '已分配',
  PROCESSING: '处理中',
  PENDING_USER: '待用户回复',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
};

const QUICK_REPLIES: string[] = [
  '帮我查一下断缴影响',
  '如何办理补缴',
  '退休金怎么计算',
  '社保怎么转移',
  '我的参保基数是多少',
];

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  LOW: 'default',
  MEDIUM: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  NEW: 'blue',
  AI_PROCESSING: 'processing',
  AI_RESOLVED: 'success',
  PENDING_AGENT: 'warning',
  ASSIGNED: 'cyan',
  PROCESSING: 'processing',
  PENDING_USER: 'orange',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const quickIntentDetect = (text: string): { intent: TicketIntent; confidence: number } => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('断缴')) {
    return { intent: 'PAYMENT_INTERRUPT', confidence: 0.7 + Math.random() * 0.28 };
  }
  if (lowerText.includes('转移')) {
    return { intent: 'TRANSFER', confidence: 0.7 + Math.random() * 0.28 };
  }
  if (lowerText.includes('退休') || lowerText.includes('养老')) {
    return { intent: 'PENSION_CALCULATE', confidence: 0.7 + Math.random() * 0.28 };
  }
  if (lowerText.includes('报销')) {
    return { intent: 'REIMBURSEMENT', confidence: 0.7 + Math.random() * 0.28 };
  }
  if (lowerText.includes('基数')) {
    return { intent: 'BASE_QUESTION', confidence: 0.7 + Math.random() * 0.28 };
  }
  if (lowerText.includes('退费') || lowerText.includes('退款')) {
    return { intent: 'REFUND', confidence: 0.7 + Math.random() * 0.28 };
  }
  return { intent: 'OTHER', confidence: 0.7 + Math.random() * 0.28 };
};

const calculateSLARemaining = (ticket: Ticket): string => {
  const priorityHours: Record<TicketPriority, number> = {
    URGENT: 1,
    HIGH: 4,
    MEDIUM: 24,
    LOW: 72,
  };
  const deadline = dayjs(ticket.createdAt).add(priorityHours[ticket.priority], 'hour');
  const diff = deadline.diff(dayjs(), 'minute');
  if (diff <= 0) return '已超时';
  if (diff < 60) return `${diff}分钟`;
  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  return `${hours}小时${mins > 0 ? mins + '分' : ''}`;
};

interface SupportCenterProps {}

const SupportCenter: React.FC<SupportCenterProps> = () => {
  const [keyword, setKeyword] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(mockTickets[0] || null);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [newTicketModalVisible, setNewTicketModalVisible] = useState<boolean>(false);
  const [aiRecognition, setAiRecognition] = useState<{
    intent: TicketIntent;
    confidence: number;
  } | null>(null);
  const [newTicketForm] = Form.useForm();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const filteredTickets = useMemo(() => {
    if (!keyword.trim()) return mockTickets;
    const kw = keyword.toLowerCase();
    return mockTickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(kw) ||
        t.ticketNo.toLowerCase().includes(kw) ||
        INTENT_NAMES[t.intent].toLowerCase().includes(kw)
    );
  }, [keyword]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [selectedTicket?.messages, isTyping]);

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleRecognizeIntent = () => {
    const content = newTicketForm.getFieldValue('content') || '';
    const subject = newTicketForm.getFieldValue('subject') || '';
    const text = `${subject} ${content}`;
    if (!text.trim()) {
      message.warning('请先输入工单标题或描述');
      return;
    }
    const result = quickIntentDetect(text);
    setAiRecognition(result);
  };

  const handleNewTicketSubmit = (values: { subject: string; content: string }) => {
    const intent = aiRecognition?.intent || quickIntentDetect(values.content).intent;
    const confidence = aiRecognition?.confidence || 0.85;
    const now = new Date().toISOString();
    const newTicket: Ticket = {
      id: `TK${Date.now()}`,
      ticketNo: `GD${dayjs().format('YYYYMMDD')}${Math.floor(100 + Math.random() * 900)}`,
      userId: 'U001',
      subject: values.subject,
      intent,
      confidence,
      priority: 'MEDIUM',
      status: 'AI_PROCESSING',
      cityCode: 'BJ',
      messages: [
        {
          id: `M${Date.now()}_1`,
          role: 'USER',
          content: values.content,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    setSelectedTicket(newTicket);
    setNewTicketModalVisible(false);
    newTicketForm.resetFields();
    setAiRecognition(null);
    message.success('工单创建成功');
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedTicket) return;
    const userMsg: ChatMessage = {
      id: `M${Date.now()}`,
      role: 'USER',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };
    const updatedTicket: Ticket = {
      ...selectedTicket,
      messages: [...selectedTicket.messages, userMsg],
      updatedAt: new Date().toISOString(),
    };
    setSelectedTicket(updatedTicket);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: ChatMessage = {
        id: `M${Date.now() + 1}`,
        role: 'AI',
        content: '您好！我已收到您的消息，正在为您查询相关政策，请稍候...',
        timestamp: new Date().toISOString(),
        relatedPolicyIds: ['P001', 'P005'],
      };
      setSelectedTicket((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, aiMsg],
          updatedAt: new Date().toISOString(),
        };
      });
    }, 1200);
  };

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
  };

  const handleSatisfactionChange = (value: number) => {
    if (!selectedTicket) return;
    setSelectedTicket({ ...selectedTicket, satisfaction: value as 1 | 2 | 3 | 4 | 5 });
    message.success(`感谢您的评价：${value}星`);
  };

  const relatedPoliciesForTicket = useMemo(() => {
    if (!selectedTicket) return [] as PolicyDocument[];
    return policyDocuments
      .filter((p) =>
        selectedTicket.messages.some((m) => m.relatedPolicyIds?.includes(p.id)) ||
        selectedTicket.subject.includes(p.category) ||
        p.tags.some((t) => selectedTicket.subject.includes(t))
      )
      .slice(0, 3);
  }, [selectedTicket]);

  const renderMessageBubble = (msg: ChatMessage) => {
    const isUser = msg.role === 'USER';
    const isAI = msg.role === 'AI';
    const isAgent = msg.role === 'AGENT';

    const avatarBg = isAI ? '#3B82F6' : isAgent ? '#166534' : '#d9d9d9';
    const avatarIcon = isAI ? (
      <RobotOutlined />
    ) : isAgent ? (
      <CustomerServiceOutlined />
    ) : (
      <UserOutlined />
    );
    const bubbleBg = isUser ? '#DBEAFE' : isAI ? '#EFF6FF' : '#ECFDF5';
    const nameText = isUser ? '您' : isAI ? 'AI助手' : selectedTicket?.agentName || '客服坐席';

    const relatedPols = msg.relatedPolicyIds
      ? policyDocuments.filter((p) => msg.relatedPolicyIds!.includes(p.id))
      : [];

    return (
      <div
        key={msg.id}
        className={`flex mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <Avatar style={{ backgroundColor: avatarBg, flexShrink: 0 }} icon={avatarIcon} />
        <div
          className={`mx-3 ${isUser ? 'text-right' : 'text-left'}`}
          style={{ maxWidth: '65%' }}
        >
          <div style={{ marginBottom: 4 }}>
            <Text strong style={{ fontSize: 12 }}>
              {nameText}
            </Text>
            <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
              {dayjs(msg.timestamp).format('MM-DD HH:mm')}
            </Text>
          </div>
          <div
            style={{
              display: 'inline-block',
              padding: '10px 14px',
              borderRadius: 12,
              background: bubbleBg,
              borderTopLeftRadius: isUser ? 12 : 2,
              borderTopRightRadius: isUser ? 2 : 12,
              lineHeight: 1.6,
            }}
          >
            {msg.content}
          </div>
          {relatedPols.length > 0 && (
            <div className={`mt-2 ${isUser ? 'text-right' : 'text-left'}`}>
              <Space wrap size={4}>
                {relatedPols.map((p) => (
                  <Tag
                    key={p.id}
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    icon={<FileTextOutlined />}
                  >
                    {p.title.length > 20 ? p.title.slice(0, 20) + '...' : p.title}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4" style={{ height: '100vh', background: '#F1F5F9' }}>
      <div className="flex justify-between items-center mb-4">
        <Title level={3} style={{ margin: 0, color: '#1E40AF' }}>
          <CustomerServiceOutlined style={{ color: '#1E40AF', marginRight: 8 }} />
          客服工单中心
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setNewTicketModalVisible(true)}
          style={{ background: '#1E40AF' }}
        >
          新建工单
        </Button>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 100px)' }}>
        <div style={{ width: '30%' }}>
          <Card
            size="small"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            title={
              <Input
                prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
                placeholder="搜索工单"
                size="small"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                allowClear
              />
            }
            extra={
              <Badge
                count={filteredTickets.length}
                style={{ backgroundColor: '#1E40AF' }}
              />
            }
          >
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                marginTop: 8,
              }}
            >
              <List
                dataSource={filteredTickets}
                locale={{ emptyText: <Empty description="暂无工单" /> }}
                renderItem={(ticket) => (
                  <List.Item
                    key={ticket.id}
                    onClick={() => handleSelectTicket(ticket)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 8px',
                      borderBottom: '1px solid #F3F4F6',
                      background:
                        selectedTicket?.id === ticket.id ? '#EFF6FF' : 'transparent',
                      borderRadius: 6,
                      marginBottom: 4,
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ marginBottom: 6 }}>
                          <Text
                            strong
                            style={{
                              color:
                                selectedTicket?.id === ticket.id ? '#1E40AF' : '#1F2937',
                            }}
                          >
                            {ticket.subject}
                          </Text>
                        </div>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Space wrap size={4}>
                            <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>
                              {INTENT_NAMES[ticket.intent]}
                            </Tag>
                            <Tag
                              color={PRIORITY_COLORS[ticket.priority]}
                              style={{ fontSize: 11, margin: 0 }}
                            >
                              {PRIORITY_NAMES[ticket.priority]}
                            </Tag>
                            <Tag
                              color={STATUS_COLORS[ticket.status]}
                              style={{ fontSize: 11, margin: 0 }}
                            >
                              {STATUS_NAMES[ticket.status]}
                            </Tag>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            #{ticket.ticketNo} · {dayjs(ticket.createdAt).format('MM-DD HH:mm')}
                          </Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </div>

        <div style={{ width: '70%', display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}>
            {selectedTicket ? (
              <Card
                size="small"
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                title={
                  <Space wrap>
                    <Text strong>#{selectedTicket.ticketNo}</Text>
                    <Tag color="blue" style={{ background: '#EFF6FF', color: '#1E40AF' }}>
                      {INTENT_NAMES[selectedTicket.intent]}
                      <span style={{ marginLeft: 4, color: '#16A34A' }}>
                        {(selectedTicket.confidence * 100).toFixed(0)}%
                      </span>
                    </Tag>
                    <Tag color={PRIORITY_COLORS[selectedTicket.priority]}>
                      优先级：{PRIORITY_NAMES[selectedTicket.priority]}
                    </Tag>
                    <Tag
                      color={
                        calculateSLARemaining(selectedTicket).includes('超时')
                          ? 'red'
                          : 'cyan'
                      }
                      icon={<ClockCircleOutlined />}
                    >
                      SLA：{calculateSLARemaining(selectedTicket)}
                    </Tag>
                  </Space>
                }
              >
                <div
                  ref={chatContainerRef}
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '8px 4px',
                    marginBottom: 12,
                    minHeight: 300,
                  }}
                >
                  {selectedTicket.messages.map(renderMessageBubble)}
                  {isTyping && (
                    <div className="flex mb-4">
                      <Avatar style={{ backgroundColor: '#3B82F6' }} icon={<RobotOutlined />} />
                      <div className="mx-3">
                        <div style={{ marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 12 }}>
                            AI助手
                          </Text>
                        </div>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: 12,
                            borderTopLeftRadius: 2,
                            background: '#EFF6FF',
                          }}
                        >
                          <Spin size="small" />
                          <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                            AI正在输入中...
                          </Text>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ marginBottom: 8 }}>
                  <Space wrap size={4}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      <ThunderboltOutlined style={{ color: '#1E40AF' }} /> 快捷回复：
                    </Text>
                    {QUICK_REPLIES.map((reply, idx) => (
                      <Tooltip key={idx} title={reply}>
                        <Tag
                          color="blue"
                          style={{ cursor: 'pointer', fontSize: 11 }}
                          onClick={() => handleQuickReply(reply)}
                        >
                          {reply.length > 15 ? reply.slice(0, 15) + '...' : reply}
                        </Tag>
                      </Tooltip>
                    ))}
                  </Space>
                </div>

                <div className="flex gap-2 items-end">
                  <Upload showUploadList={false}>
                    <Button icon={<PaperClipOutlined />} />
                  </Upload>
                  <TextArea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="输入消息，Enter发送，Shift+Enter换行"
                    rows={2}
                    style={{ flex: 1, resize: 'none' }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    style={{ background: '#1E40AF' }}
                  >
                    发送
                  </Button>
                </div>
              </Card>
            ) : (
              <Card size="small" style={{ height: '100%' }}>
                <div
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Empty description="请选择左侧工单查看详情" />
                </div>
              </Card>
            )}
          </div>

          <div style={{ width: 260 }}>
            {selectedTicket ? (
              <div
                className="flex flex-col gap-4"
                style={{ height: '100%', overflow: 'auto' }}
              >
                <Card
                  size="small"
                  title={
                    <span>
                      <RobotOutlined style={{ color: '#1E40AF' }} /> AI建议回复
                    </span>
                  }
                >
                  <Paragraph style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 8 }}>
                    根据您的问题，建议回复：您的情况符合《社保法》相关规定，可以在线办理补缴手续，需要我帮您操作吗？
                  </Paragraph>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    block
                    onClick={() =>
                      handleQuickReply(
                        '根据您的问题，建议回复：您的情况符合《社保法》相关规定，可以在线办理补缴手续，需要我帮您操作吗？'
                      )
                    }
                    style={{ borderColor: '#1E40AF', color: '#1E40AF' }}
                  >
                    使用此回复
                  </Button>
                </Card>

                <Card
                  size="small"
                  title={
                    <span>
                      <FileTextOutlined style={{ color: '#16A34A' }} /> 关联政策
                    </span>
                  }
                >
                  {relatedPoliciesForTicket.length === 0 ? (
                    <Empty
                      description="暂无"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      style={{ padding: '12px 0' }}
                    />
                  ) : (
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      {relatedPoliciesForTicket.map((p) => (
                        <div
                          key={p.id}
                          style={{
                            padding: '8px 10px',
                            background: '#F9FAFB',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          <Text strong style={{ fontSize: 12, color: '#1E40AF' }}>
                            {p.title.length > 25 ? p.title.slice(0, 25) + '...' : p.title}
                          </Text>
                          <div style={{ marginTop: 4 }}>
                            <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                              {p.docNo}
                            </Tag>
                            <Tag
                              color={p.status === 'EFFECTIVE' ? 'green' : 'default'}
                              style={{ fontSize: 10, margin: 0, marginLeft: 4 }}
                            >
                              {p.status === 'EFFECTIVE' ? '有效' : '失效'}
                            </Tag>
                          </div>
                        </div>
                      ))}
                    </Space>
                  )}
                </Card>

                <Card
                  size="small"
                  title={
                    <span>
                      <Rate disabled count={1} value={1} style={{ fontSize: 14, color: '#F59E0B' }} /> 服务评价
                    </span>
                  }
                >
                  <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <Rate
                      count={5}
                      value={selectedTicket.satisfaction || 0}
                      onChange={handleSatisfactionChange}
                      disabled={
                        selectedTicket.status !== 'RESOLVED' &&
                        selectedTicket.status !== 'AI_RESOLVED' &&
                        selectedTicket.status !== 'CLOSED'
                      }
                    />
                    <div style={{ marginTop: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {selectedTicket.satisfaction
                          ? `感谢您的 ${selectedTicket.satisfaction} 星评价`
                          : selectedTicket.status === 'RESOLVED' ||
                            selectedTicket.status === 'AI_RESOLVED' ||
                            selectedTicket.status === 'CLOSED'
                          ? '请对本次服务进行评价'
                          : '工单解决后可进行评价'}
                      </Text>
                    </div>
                  </div>
                </Card>
              </div>
            ) : (
              <Card size="small" style={{ height: '100%' }}>
                <Empty description="请选择工单查看辅助信息" />
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal
        title={
          <span>
            <PlusOutlined style={{ color: '#1E40AF' }} /> 新建工单
          </span>
        }
        open={newTicketModalVisible}
        onCancel={() => {
          setNewTicketModalVisible(false);
          newTicketForm.resetFields();
          setAiRecognition(null);
        }}
        footer={null}
        width={640}
      >
        <Form
          form={newTicketForm}
          layout="vertical"
          onFinish={handleNewTicketSubmit}
        >
          <Form.Item
            label="工单标题"
            name="subject"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请简要描述您的问题" maxLength={50} showCount />
          </Form.Item>
          <Form.Item
            label="问题描述"
            name="content"
            rules={[{ required: true, message: '请输入问题描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述您遇到的问题，例如：社保断缴了2个月怎么办？"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<RobotOutlined />}
              onClick={handleRecognizeIntent}
              type="dashed"
              block
              style={{ borderColor: '#1E40AF', color: '#1E40AF' }}
            >
              AI识别意图
            </Button>
          </div>

          {aiRecognition && (
            <Card
              size="small"
              style={{
                marginBottom: 16,
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
              }}
              title={
                <Space>
                  <Tag color="blue" style={{ background: '#1E40AF', color: '#fff' }}>
                    识别意图：{INTENT_NAMES[aiRecognition.intent]}
                  </Tag>
                  <Tag color="cyan">
                    置信度：{(aiRecognition.confidence * 100).toFixed(0)}%
                  </Tag>
                </Space>
              }
            >
              <Paragraph style={{ fontSize: 13, marginBottom: 0 }}>
                AI已根据您输入的内容识别出问题类型，系统将据此优先匹配相关政策和解决方案。
              </Paragraph>
            </Card>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setNewTicketModalVisible(false);
                  newTicketForm.resetFields();
                  setAiRecognition(null);
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                style={{ background: '#1E40AF' }}
              >
                提交工单
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupportCenter;
