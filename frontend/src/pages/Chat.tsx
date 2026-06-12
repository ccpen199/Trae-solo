import { useState, useEffect, useRef } from 'react';
import { Layout, List, Avatar, Input, Button, Typography, Space, Badge, Upload, Tag, App, Card, Table, Progress, Tabs, Empty, Modal, message as AntMsg, Statistic, Row, Col } from 'antd';
import { SendOutlined, PaperClipOutlined, UserOutlined, SafetyCertificateOutlined, WarningOutlined, BarChartOutlined } from '@ant-design/icons';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store';
import api from '../api';
import dayjs from 'dayjs';
import axios from 'axios';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

export default function Chat() {
  const { user, token } = useAppStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState<any>(null);
  const [qualityModal, setQualityModal] = useState(false);
  const [qualityStats, setQualityStats] = useState<any>({});
  const socketRef = useRef<Socket | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);

  useEffect(() => {
    if (!token || !user) return;
    const socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      api.get('/chat/sessions').then((d: any) => setSessions(d.sessions || []));
    });

    socket.on('new_message', (msg: any) => {
      if (msg.sessionId === activeSession) {
        setMessages(m => [...m, msg]);
      }
      setSessions(s => s.map(sess => sess.id === msg.sessionId ? { ...sess, last_message: msg.content, last_message_at: new Date().toISOString(), unread_count: msg.senderId !== user.id ? (sess.unread_count || 0) + 1 : sess.unread_count } : sess));
      scrollToBottom();
    });

    socket.on('user_typing', (data: any) => {
      if (data.sessionId === activeSession && data.userId !== user?.id) {
        setTypingUser(data);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTypingUser(null), 3000);
      }
    });

    socket.on('messages_read', () => {
      setSessions(s => s.map(sess => sess.id === activeSession ? { ...sess, unread_count: 0 } : sess));
    });

    return () => { socket.close(); };
  }, [token, user, activeSession]);

  useEffect(() => {
    if (activeSession) {
      socketRef.current?.emit('join_session', activeSession);
      api.get(`/chat/sessions/${activeSession}/messages`).then((d: any) => {
        setMessages(d.messages || []);
        socketRef.current?.emit('mark_read', { sessionId: activeSession });
        scrollToBottom();
      });
    }
  }, [activeSession]);

  const scrollToBottom = () => {
    setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const sendMessage = () => {
    if (!input.trim() || !activeSession) return;
    socketRef.current?.emit('send_message', { sessionId: activeSession, content: input, type: 'text' });
    setInput('');
  };

  const handleTyping = (value: string) => {
    setInput(value);
    socketRef.current?.emit('typing', { sessionId: activeSession, isTyping: value.length > 0 });
  };

  const createSession = async (targetUserId: string) => {
    try {
      const data = await api.post('/chat/sessions', { targetUserId }) as any;
      setActiveSession(data.sessionId);
      const sess = await api.get('/chat/sessions') as any;
      setSessions(sess.sessions || []);
    } catch (e: any) {
      AntMsg.error(e.error || '创建会话失败');
    }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post('/api/upload', formData, { headers: { Authorization: `Bearer ${token}` } }) as any;
      if (res.data?.url && activeSession) {
        socketRef.current?.emit('send_message', { sessionId: activeSession, content: file.name, type: 'file', fileUrl: res.data.url });
      }
    } catch {
      AntMsg.error('上传失败');
    }
    return false;
  };

  const showQualityStats = () => {
    api.get('/chat/quality/stats').then((d: any) => {
      setQualityStats(d.stats || {});
      setQualityModal(true);
    });
  };

  const getSessionTitle = (s: any) => s.other_name || '未知用户';

  return (
    <Layout style={{ height: 'calc(100vh - 180px)', background: 'white', borderRadius: 8, overflow: 'hidden' }}>
      <Sider width={280} style={{ background: '#fafafa', borderRight: '1px solid #eee' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>消息</Title>
          <Space>
            <Button size="small" icon={<BarChartOutlined />} onClick={showQualityStats}>质检</Button>
          </Space>
        </div>
        <List
          dataSource={sessions}
          locale={{ emptyText: '暂无会话' }}
          renderItem={(s: any) => (
            <List.Item
              onClick={() => setActiveSession(s.id)}
              style={{
                cursor: 'pointer', padding: '12px 16px',
                background: activeSession === s.id ? '#e6f4ff' : 'transparent',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Space style={{ width: '100%' }}>
                <Badge count={s.unread_count || 0} size="small">
                  <Avatar icon={<UserOutlined />} src={s.other_avatar} />
                </Badge>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex-between">
                    <Text strong ellipsis style={{ maxWidth: 120, display: 'block' }}>{getSessionTitle(s)}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{s.last_message_at ? dayjs(s.last_message_at).format('HH:mm') : ''}</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.last_message || '暂无消息'}
                  </Text>
                </div>
              </Space>
            </List.Item>
          )}
        />
      </Sider>
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        {activeSession ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
              <Space>
                <Avatar icon={<UserOutlined />} />
                <div>
                  <Text strong>{getSessionTitle(sessions.find(s => s.id === activeSession) || {})}</Text>
                  {typingUser && <div style={{ fontSize: 12, color: '#1677ff' }}>{typingUser.userName} 正在输入...</div>}
                </div>
              </Space>
            </div>
            <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f5f5f5' }}>
              {messages.length === 0 ? <Empty description="开始对话吧" style={{ marginTop: 80 }} /> : messages.map((m: any, i) => (
                <div key={i} className={`message-item ${m.senderId === user?.id ? 'self' : ''}`}>
                  <div className="message-bubble">
                    {m.type === 'file' ? (
                      <a href={m.fileUrl} target="_blank" rel="noreferrer">📎 {m.content}</a>
                    ) : m.content}
                    {m.isBlocked && <Tag color="red" icon={<WarningOutlined />} style={{ marginTop: 4 }}>含敏感词已过滤</Tag>}
                    {m.qualityScore < 0.6 && m.senderId === user?.id && <Tag color="orange" style={{ marginTop: 4 }}>质量分 {m.qualityScore?.toFixed(2)}</Tag>}
                  </div>
                  <div className="message-time" style={{ textAlign: m.senderId === user?.id ? 'right' : 'left', padding: '0 8px' }}>
                    {m.senderId !== user?.id && !m.isRead && <Tag color="blue" style={{ marginRight: 4 }}>未读</Tag>}
                    {dayjs(m.createdAt || m.created_at).format('HH:mm')}
                  </div>
                </div>
              ))}
              <div ref={msgEndRef} />
            </div>
            <div className="chat-input" style={{ padding: 16, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
              <Upload beforeUpload={uploadFile} showUploadList={false}>
                <Button icon={<PaperClipOutlined />} />
              </Upload>
              <Input.TextArea
                rows={1}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder="输入消息..."
                value={input}
                onChange={e => handleTyping(e.target.value)}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                style={{ flex: 1 }}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={sendMessage}>发送</Button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="选择会话开始聊天" />
          </div>
        )}
      </Content>

      <Modal title="会话质检中心" open={qualityModal} onCancel={() => setQualityModal(false)} footer={null} width={720}>
        <Row gutter={16}>
          <Col span={6}><Card className="stat-card"><Statistic title="消息总数" value={qualityStats.total || 0} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="拦截敏感词" value={qualityStats.blocked || 0} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="平均质量分" value={qualityStats.avgQuality ? Math.round(qualityStats.avgQuality * 100) : 0} suffix="%" /></Card></Col>
          <Col span={6}><Card className="stat-card"><Statistic title="低质量消息" value={qualityStats.lowQuality?.length || 0} valueStyle={{ color: '#faad14' }} /></Card></Col>
        </Row>
        <Table
          size="small"
          style={{ marginTop: 16 }}
          dataSource={qualityStats.lowQuality || []}
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '发送者', dataIndex: 'sender_name' },
            { title: '内容', dataIndex: 'content', ellipsis: true },
            { title: '质量分', dataIndex: 'quality_score', render: (s: number) => <Progress percent={Math.round(s * 100)} size="small" /> },
            { title: '是否拦截', dataIndex: 'is_blocked', render: (v: number) => v ? <Tag color="red"><WarningOutlined /> 已拦截</Tag> : <Tag color="green">通过</Tag> }
          ]}
        />
      </Modal>
    </Layout>
  );
}
