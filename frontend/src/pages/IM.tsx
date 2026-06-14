import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  List,
  Input,
  Button,
  Avatar,
  Badge,
  Tag,
  Modal,
  Select,
  Space,
  Typography,
  message,
  Spin,
  Empty,
  Tooltip,
  Alert,
  Form,
  DatePicker,
  InputNumber,
  Descriptions,
  Divider,
  Progress,
  Row,
  Col
} from 'antd';
import {
  SendOutlined,
  UserOutlined,
  PaperClipOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  ClockCircleOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  RiseOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';

const { Title, Text } = Typography;
const { Option } = Select;

interface Conversation {
  conversation_id: string;
  other_user: {
    id: number;
    username: string;
    real_name: string;
    avatar: string;
    role: string;
    credit_score: number;
  };
  last_message: Message;
  unread_count: number;
  last_message_at: string;
}

interface Message {
  id: number;
  conversation_id: string;
  sender_id: number;
  receiver_id: number;
  message_type: string;
  content: string;
  resume_id?: number;
  interview_id?: number;
  is_read: number;
  created_at: string;
  sender_name: string;
  sender_avatar: string;
  candidate_name?: string;
  current_position?: string;
  current_company?: string;
}

interface ResumeOption {
  id: number;
  candidate_name: string;
  current_position: string;
  current_company: string;
  current_salary: number;
}

interface InterviewInvite {
  id: number;
  candidate_name: string;
  job_title: string;
  company_name: string;
  round: number;
  scheduled_at: string;
  duration: number;
  interviewer: string;
  room_url: string;
  status: string;
}

interface InterviewSummary {
  id: number;
  candidate_name: string;
  job_title: string;
  round: number;
  overall_rating: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  interviewer: string;
  created_at: string;
}

interface ResumeCardData {
  candidate_name: string;
  current_position: string;
  current_company: string;
  work_years: number;
  education: string;
  skills: string[];
  expected_salary: string;
}

const IM: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const [draggedResume, setDraggedResume] = useState<ResumeOption | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [interviewForm] = Form.useForm();
  const [interviewSending, setInterviewSending] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<InterviewSummary | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<InterviewInvite | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  useEffect(() => {
    fetchConversations();
    fetchResumes();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/im/conversations');
      setConversations(response.data || []);
      if (response.data?.length > 0 && !selectedConversation) {
        selectConversation(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const response = await axios.get('/api/resumes/mine');
      setResumes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch resumes:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await axios.get(`/api/im/messages/${conversationId}`);
      setMessages(response.data.list || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.conversation_id);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const response = await axios.post('/api/im/messages', {
        receiver_id: selectedConversation.other_user.id,
        content: messageInput.trim(),
        message_type: 'text'
      });
      setMessages([...messages, response.data]);
      setMessageInput('');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送失败');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSendResume = async () => {
    if (!selectedResume || !selectedConversation) return;

    try {
      setSending(true);
      const resume = resumes.find(r => r.id === selectedResume);
      const response = await axios.post('/api/im/messages', {
        receiver_id: selectedConversation.other_user.id,
        content: resume?.candidate_name || '简历卡片',
        message_type: 'resume',
        resume_id: selectedResume
      });
      setMessages([...messages, { ...response.data, ...resume } as any]);
      setResumeModalVisible(false);
      setSelectedResume(null);
      message.success('简历卡片已发送');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (!draggedResume || !selectedConversation) return;

    handleSendResumeDirect(draggedResume);
    setDraggedResume(null);
  };

  const handleSendResumeDirect = async (resume: ResumeOption) => {
    if (!selectedConversation) return;

    try {
      setSending(true);
      const response = await axios.post('/api/im/messages', {
        receiver_id: selectedConversation.other_user.id,
        content: resume.candidate_name,
        message_type: 'resume',
        resume_id: resume.id
      });
      setMessages([...messages, { ...response.data, ...resume } as any]);
      message.success('简历卡片已发送');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendInterviewInvite = async (values: any) => {
    if (!selectedConversation) return;

    try {
      setInterviewSending(true);
      const invite: InterviewInvite = {
        id: Date.now(),
        candidate_name: values.candidate_name,
        job_title: values.job_title,
        company_name: user?.role === 'company' ? '贵公司' : '合作企业',
        round: values.round,
        scheduled_at: dayjs(values.scheduled_at).toISOString(),
        duration: values.duration || 60,
        interviewer: values.interviewer || '面试官',
        room_url: `https://meet.example.com/room/${Date.now()}`,
        status: 'pending'
      };

      const response = await axios.post('/api/im/messages', {
        receiver_id: selectedConversation.other_user.id,
        content: `面试邀请：${invite.candidate_name} - 第${invite.round}轮面试`,
        message_type: 'interview_invite',
        metadata: invite
      });

      setMessages([...messages, { ...response.data, ...invite } as any]);
      setInterviewModalVisible(false);
      interviewForm.resetFields();
      message.success('面试邀请已发送');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送失败');
    } finally {
      setInterviewSending(false);
    }
  };

  const handleSendInterviewSummary = async () => {
    if (!selectedConversation) return;

    try {
      const summary: InterviewSummary = {
        id: Date.now(),
        candidate_name: '张三',
        job_title: '高级前端工程师',
        round: 2,
        overall_rating: 4,
        summary: '候选人技术能力扎实，对 React 生态有深入理解，项目经验丰富。沟通表达清晰，有团队协作经验。',
        strengths: ['React/TypeScript 技术栈熟练', '有大型项目架构经验', '沟通表达能力强', '学习能力强'],
        weaknesses: ['对 Node.js 后端经验相对较少', '微服务经验有待加强'],
        recommendations: '建议进入下一轮 HR 面试，重点考察薪资期望和入职时间。综合评估可以给予 Offer。',
        interviewer: '技术总监 - 李明',
        created_at: new Date().toISOString()
      };

      const response = await axios.post('/api/im/messages', {
        receiver_id: selectedConversation.other_user.id,
        content: `面试纪要：${summary.candidate_name} - 第${summary.round}轮`,
        message_type: 'interview_summary',
        metadata: summary
      });

      setMessages([...messages, { ...response.data, ...summary } as any]);
      message.success('面试纪要已发送');
    } catch (error: any) {
      message.error(error.response?.data?.error || '发送失败');
    }
  };

  const handleJoinVideo = (invite: InterviewInvite) => {
    if (invite.room_url) {
      window.open(invite.room_url, '_blank');
      message.success('正在加入视频面试房间...');
    }
  };

  const handleViewSummary = (summary: InterviewSummary) => {
    setSelectedSummary(summary);
    setSummaryModalVisible(true);
  };

  const getTimeDisplay = (dateStr: string) => {
    const date = dayjs(dateStr);
    const now = dayjs();
    if (now.diff(date, 'day') === 0) {
      return date.format('HH:mm');
    }
    if (now.diff(date, 'day') === 1) {
      return '昨天 ' + date.format('HH:mm');
    }
    return date.format('MM-DD HH:mm');
  };

  const renderMessageContent = (msg: Message & any) => {
    if (msg.message_type === 'resume') {
      return (
        <div
          className="message-type-resume"
          onClick={() => navigate(`/resumes/${msg.resume_id}`)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileTextOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <Text strong style={{ color: '#1677ff' }}>简历卡片</Text>
          </div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{msg.candidate_name || msg.content}</div>
          {msg.current_position && (
            <div style={{ fontSize: 12, color: '#666' }}>
              {msg.current_position} @ {msg.current_company}
            </div>
          )}
        </div>
      );
    }

    if (msg.message_type === 'resume_card' && msg.metadata) {
      const card = msg.metadata as ResumeCardData;
      return (
        <div className="message-type-resume">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileTextOutlined style={{ color: '#722ed1', fontSize: 18 }} />
            <Text strong style={{ color: '#722ed1' }}>精美简历卡片</Text>
          </div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>
            {card.candidate_name} | {card.current_position}
          </div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>
            {card.current_company} | {card.work_years}年经验 | {card.education}
          </div>
          <div style={{ fontSize: 12, marginBottom: 6 }}>
            {card.skills.slice(0, 3).map((skill, idx) => (
              <Tag key={idx} color="purple" style={{ marginBottom: 4 }}>
                {skill}
              </Tag>
            ))}
          </div>
          <div style={{ fontSize: 12, color: '#52c41a', fontWeight: 500 }}>
            期望: {card.expected_salary}
          </div>
        </div>
      );
    }

    if (msg.message_type === 'interview_invite') {
      const invite = (msg.metadata || msg) as InterviewInvite;
      return (
        <div className="message-type-interview">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <VideoCameraOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            <Text strong style={{ color: '#52c41a' }}>视频面试邀请</Text>
          </div>
          <Descriptions bordered size="small" column={1} style={{ marginBottom: 12 }}>
            <Descriptions.Item label="候选人">{invite.candidate_name}</Descriptions.Item>
            <Descriptions.Item label="目标职位">{invite.job_title}</Descriptions.Item>
            <Descriptions.Item label="面试轮次">第{invite.round}轮</Descriptions.Item>
            <Descriptions.Item label="面试时间">
              {dayjs(invite.scheduled_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="预计时长">{invite.duration}分钟</Descriptions.Item>
            <Descriptions.Item label="面试官">{invite.interviewer}</Descriptions.Item>
          </Descriptions>
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<VideoCameraOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleJoinVideo(invite);
              }}
            >
              加入视频面试
            </Button>
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInvite(invite);
                setInviteModalVisible(true);
              }}
            >
              查看详情
            </Button>
          </Space>
        </div>
      );
    }

    if (msg.message_type === 'interview_summary' && msg.metadata) {
      const summary = msg.metadata as InterviewSummary;
      return (
        <div className="message-type-interview">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <FileSearchOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
            <Text strong style={{ color: '#fa8c16' }}>面试纪要摘要</Text>
          </div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {summary.candidate_name} - 第{summary.round}轮面试
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#999' }}>综合评分:</span>
              <Progress
                percent={summary.overall_rating * 20}
                size="small"
                style={{ width: 100 }}
                strokeColor={summary.overall_rating >= 4 ? '#52c41a' : summary.overall_rating >= 3 ? '#fa8c16' : '#ff4d4f'}
              />
              <span style={{ fontWeight: 600 }}>{summary.overall_rating.toFixed(1)}/5.0</span>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              面试官: {summary.interviewer}
            </div>
          </div>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewSummary(summary);
            }}
          >
            查看完整纪要
          </Button>
        </div>
      );
    }

    return <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>;
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>消息中心</Title>
        <Text type="secondary">与候选人、企业用户进行即时沟通</Text>
      </div>

      <Card bordered={false} style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <div style={{ display: 'flex', height: 'calc(100vh - 200px)', minHeight: 600 }}>
          <div style={{
            width: 320,
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: 16, borderBottom: '1px solid #f0f0f0' }}>
              <Input.Search placeholder="搜索联系人" />
            </div>

            {loading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin />
              </div>
            ) : conversations.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="暂无对话" />
              </div>
            ) : (
              <List
                style={{ flex: 1, overflow: 'auto' }}
                dataSource={conversations}
                renderItem={(item) => (
                  <List.Item
                    key={item.conversation_id}
                    onClick={() => selectConversation(item)}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      background: selectedConversation?.conversation_id === item.conversation_id ? '#e6f4ff' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedConversation?.conversation_id !== item.conversation_id) {
                        e.currentTarget.style.background = '#fafafa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedConversation?.conversation_id !== item.conversation_id) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', width: '100%', gap: 12 }}>
                      <Badge count={item.unread_count} offset={[2, 2]}>
                        <Avatar size={44} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                      </Badge>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 4
                        }}>
                          <Text strong ellipsis style={{ maxWidth: 160 }}>
                            {item.other_user.real_name}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {getTimeDisplay(item.last_message_at)}
                          </Text>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          color: '#999'
                        }}>
                          <Tag
                            color={item.other_user.role === 'company' ? 'green' : item.other_user.role === 'admin' ? 'red' : 'blue'}
                            style={{ fontSize: 10, padding: 0, marginRight: 4 }}
                          >
                            {item.other_user.role === 'company' ? '企业' : item.other_user.role === 'admin' ? '管理员' : '猎头'}
                          </Tag>
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 180
                          }}>
                            {item.last_message?.content}
                          </span>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}

            <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                拖拽发送简历：
              </div>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {resumes.slice(0, 5).map(resume => (
                  <div
                    key={resume.id}
                    draggable
                    onDragStart={() => setDraggedResume(resume)}
                    onDragEnd={() => setDraggedResume(null)}
                    className="resume-card"
                    style={{
                      padding: 8,
                      marginBottom: 6,
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #e8e8e8'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileTextOutlined style={{ color: '#1677ff' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {resume.candidate_name}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {resume.current_position}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                <div style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar size={40} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 15 }}>
                        {selectedConversation.other_user.real_name}
                        <Tag
                          color={selectedConversation.other_user.role === 'company' ? 'green' : 'blue'}
                          style={{ marginLeft: 8, fontSize: 10 }}
                        >
                          {selectedConversation.other_user.role === 'company' ? '企业用户' : '猎头顾问'}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        信用评分: <span className={selectedConversation.other_user.credit_score >= 80 ? 'credit-score-good' : selectedConversation.other_user.credit_score >= 60 ? 'credit-score-medium' : 'credit-score-low'}>
                          {selectedConversation.other_user.credit_score}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Space>
                    <Tooltip title="语音通话">
                      <Button type="text" icon={<PhoneOutlined />} />
                    </Tooltip>
                    <Tooltip title="视频通话">
                      <Button type="text" icon={<VideoCameraOutlined />} />
                    </Tooltip>
                  </Space>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: '20px',
                    overflowY: 'auto',
                    background: '#f5f7fa'
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={dragOver ? 'drag-drop-zone dragging' : ''}
                >
                  {dragOver && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(22, 119, 255, 0.1)',
                      border: '2px dashed #1677ff',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}>
                      <div style={{ textAlign: 'center', color: '#1677ff' }}>
                        <FileTextOutlined style={{ fontSize: 48, marginBottom: 12 }} />
                        <div style={{ fontSize: 16, fontWeight: 500 }}>松开发送简历卡片</div>
                      </div>
                    </div>
                  )}

                  {messages.length === 0 ? (
                    <div style={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999'
                    }}>
                      <Empty description="暂无消息，开始对话吧" />
                    </div>
                  ) : (
                    <div>
                      {messages.map((msg) => {
                        const isSelf = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`chat-message ${isSelf ? 'self' : ''}`}
                          >
                            {!isSelf && (
                              <Avatar size={40} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                            )}
                            <div className="chat-content">
                              <div className="chat-bubble">
                                {renderMessageContent(msg)}
                              </div>
                              <div className="chat-time">
                                {dayjs(msg.created_at).format('YYYY-MM-DD HH:mm')}
                                {isSelf && (
                                  <span style={{ marginLeft: 8 }}>
                                    {msg.is_read ? '已读' : '未读'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <Tooltip title="发送简历卡片">
                      <Button
                        type="text"
                        icon={<FileTextOutlined />}
                        onClick={() => setResumeModalVisible(true)}
                      />
                    </Tooltip>
                    <Tooltip title="预约视频面试">
                      <Button
                        type="text"
                        icon={<VideoCameraOutlined />}
                        onClick={() => setInterviewModalVisible(true)}
                      />
                    </Tooltip>
                    <Tooltip title="发送面试纪要">
                      <Button
                        type="text"
                        icon={<FileSearchOutlined />}
                        onClick={handleSendInterviewSummary}
                      />
                    </Tooltip>
                    <Tooltip title="附件">
                      <Button type="text" icon={<PaperClipOutlined />} />
                    </Tooltip>
                    <div style={{ flex: 1 }} />
                    <Space size="small">
                      <Tag color="blue" icon={<CheckCircleOutlined />}>
                        服务端已连接
                      </Tag>
                    </Space>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                    <Input.TextArea
                      ref={inputRef}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="输入消息，按 Enter 发送"
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      loading={sending}
                      disabled={!messageInput.trim()}
                      style={{ height: 40 }}
                    >
                      发送
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}>
                <Empty description="请选择一个对话开始聊天" />
              </div>
            )}
          </div>
        </div>
      </Card>

      <Modal
        title="发送简历卡片"
        open={resumeModalVisible}
        onCancel={() => { setResumeModalVisible(false); setSelectedResume(null); }}
        footer={null}
        width={500}
        destroyOnClose
      >
        {resumes.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            message="您还没有录入任何简历"
            description={<a onClick={() => { setResumeModalVisible(false); navigate('/resumes'); }}>去录入简历 →</a>}
          />
        ) : (
          <>
            <div style={{ fontWeight: 500, marginBottom: 12 }}>选择要发送的简历</div>
            <Select
              placeholder="请选择简历"
              style={{ width: '100%' }}
              value={selectedResume}
              onChange={setSelectedResume}
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {resumes.map(resume => (
                <Option key={resume.id} value={resume.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <span style={{ fontWeight: 500 }}>{resume.candidate_name}</span>
                      <span style={{ color: '#999', marginLeft: 8 }}>{resume.current_position}</span>
                    </span>
                    <span className="salary-text">¥{(resume.current_salary / 10000).toFixed(1)}万</span>
                  </div>
                </Option>
              ))}
            </Select>
            {selectedResume && (
              <div style={{ marginTop: 16, padding: 12, background: '#f0f5ff', borderRadius: 8 }}>
                {(() => {
                  const r = resumes.find(r => r.id === selectedResume);
                  return r ? (
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>{r.candidate_name}</div>
                      <div style={{ fontSize: 13, color: '#666' }}>{r.current_position} @ {r.current_company}</div>
                      <div style={{ fontSize: 13, color: '#fa8c16', marginTop: 4 }}>
                        当前年薪: ¥{(r.current_salary / 10000).toFixed(1)}万
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => { setResumeModalVisible(false); setSelectedResume(null); }}>取消</Button>
                <Button
                  type="primary"
                  onClick={handleSendResume}
                  loading={sending}
                  disabled={!selectedResume}
                  icon={<SendOutlined />}
                >
                  发送
                </Button>
              </Space>
            </div>
          </>
        )}
      </Modal>

      <Modal
        title="预约视频面试"
        open={interviewModalVisible}
        onCancel={() => setInterviewModalVisible(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          message="发送面试邀请"
          description="填写面试信息后，系统将自动生成视频面试房间链接并发送给对方"
          style={{ marginBottom: 16 }}
        />
        <Form form={interviewForm} layout="vertical" onFinish={handleSendInterviewInvite}>
          <Row gutter={12}>
            <Col xs={24} sm={12}>
              <Form.Item name="candidate_name" label="候选人姓名" rules={[{ required: true }]}>
                <Input placeholder="请输入候选人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="round" label="面试轮次" rules={[{ required: true }]}>
                <Select placeholder="请选择">
                  <Option value={1}>第1轮（初筛）</Option>
                  <Option value={2}>第2轮（技术）</Option>
                  <Option value={3}>第3轮（复试）</Option>
                  <Option value={4}>第4轮（HR）</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="job_title" label="目标职位" rules={[{ required: true }]}>
            <Input placeholder="如: 高级前端工程师" />
          </Form.Item>
          <Row gutter={12}>
            <Col xs={24} sm={16}>
              <Form.Item name="scheduled_at" label="面试时间" rules={[{ required: true }]}>
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD HH:mm"
                  placeholder="选择面试时间"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="duration" label="时长（分钟）" rules={[{ required: true }]}>
                <InputNumber
                  min={15}
                  max={240}
                  step={15}
                  defaultValue={60}
                  style={{ width: '100%' }}
                  placeholder="60"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="interviewer" label="面试官" rules={[{ required: true }]}>
            <Input placeholder="请输入面试官姓名和职位" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setInterviewModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={interviewSending} icon={<SendOutlined />}>
                发送邀请
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="面试邀请详情"
        open={inviteModalVisible}
        onCancel={() => { setInviteModalVisible(false); setSelectedInvite(null); }}
        footer={[
          <Button key="cancel" onClick={() => { setInviteModalVisible(false); setSelectedInvite(null); }}>
            关闭
          </Button>,
          selectedInvite && (
            <Button
              key="join"
              type="primary"
              icon={<VideoCameraOutlined />}
              onClick={() => handleJoinVideo(selectedInvite)}
            >
              加入视频面试
            </Button>
          )
        ]}
        width={500}
        destroyOnClose
      >
        {selectedInvite && (
          <div>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="候选人">{selectedInvite.candidate_name}</Descriptions.Item>
              <Descriptions.Item label="目标职位">{selectedInvite.job_title}</Descriptions.Item>
              <Descriptions.Item label="企业">{selectedInvite.company_name}</Descriptions.Item>
              <Descriptions.Item label="面试轮次">第{selectedInvite.round}轮</Descriptions.Item>
              <Descriptions.Item label="面试时间">
                {dayjs(selectedInvite.scheduled_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="预计时长">{selectedInvite.duration}分钟</Descriptions.Item>
              <Descriptions.Item label="面试官">{selectedInvite.interviewer}</Descriptions.Item>
              <Descriptions.Item label="面试房间">
                <a href={selectedInvite.room_url} target="_blank" rel="noreferrer">
                  {selectedInvite.room_url}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedInvite.status === 'completed' ? 'green' : selectedInvite.status === 'cancelled' ? 'red' : 'orange'}>
                  {selectedInvite.status === 'completed' ? '已完成' : selectedInvite.status === 'cancelled' ? '已取消' : '待开始'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
            <Alert
              type="warning"
              showIcon
              message="温馨提示"
              description="请提前5分钟进入面试房间，测试摄像头和麦克风是否正常工作。"
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="面试纪要详情"
        open={summaryModalVisible}
        onCancel={() => { setSummaryModalVisible(false); setSelectedSummary(null); }}
        footer={[
          <Button key="close" onClick={() => { setSummaryModalVisible(false); setSelectedSummary(null); }}>
            关闭
          </Button>
        ]}
        width={600}
        destroyOnClose
      >
        {selectedSummary && (
          <div>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="候选人">{selectedSummary.candidate_name}</Descriptions.Item>
              <Descriptions.Item label="目标职位">{selectedSummary.job_title}</Descriptions.Item>
              <Descriptions.Item label="面试轮次">第{selectedSummary.round}轮</Descriptions.Item>
              <Descriptions.Item label="面试官">{selectedSummary.interviewer}</Descriptions.Item>
            </Descriptions>

            <Card 
              title="综合评估" 
              size="small" 
              style={{ marginBottom: 16 }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  border: `4px solid ${selectedSummary.overall_rating >= 4 ? '#52c41a' : selectedSummary.overall_rating >= 3 ? '#fa8c16' : '#ff4d4f'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: selectedSummary.overall_rating >= 4 ? '#52c41a' : selectedSummary.overall_rating >= 3 ? '#fa8c16' : '#ff4d4f'
                }}>
                  {selectedSummary.overall_rating}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>综合评分</div>
                  <Progress
                    percent={selectedSummary.overall_rating * 20}
                    size="small"
                    strokeColor={selectedSummary.overall_rating >= 4 ? '#52c41a' : selectedSummary.overall_rating >= 3 ? '#fa8c16' : '#ff4d4f'}
                  />
                  <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                    记录时间: {dayjs(selectedSummary.created_at).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                {selectedSummary.summary}
              </div>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} md={12}>
                <Card 
                  title={<span><RiseOutlined style={{ color: '#52c41a' }} /> 优势</span>}
                  size="small"
                  styles={{ body: { padding: 12 } }}
                >
                  {selectedSummary.strengths.map((item, idx) => (
                    <div key={idx} style={{ fontSize: 12, marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#52c41a' }}>✓</span>
                      {item}
                    </div>
                  ))}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card 
                  title={<span><WarningOutlined style={{ color: '#fa8c16' }} /> 待提升</span>}
                  size="small"
                  styles={{ body: { padding: 12 } }}
                >
                  {selectedSummary.weaknesses.map((item, idx) => (
                    <div key={idx} style={{ fontSize: 12, marginBottom: 4, paddingLeft: 12, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 0, color: '#fa8c16' }}>!</span>
                      {item}
                    </div>
                  ))}
                </Card>
              </Col>
            </Row>

            <Alert
              type="info"
              showIcon
              message="面试官建议"
              description={selectedSummary.recommendations}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IM;
