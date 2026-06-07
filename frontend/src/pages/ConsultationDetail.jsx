import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Tag, Button, Input, message, Space, List, Avatar } from 'antd';
import { useParams } from 'react-router-dom';
import { consultationAPI } from '../utils/api';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

function ConsultationDetail({ user, role }) {
  const { id } = useParams();
  const [consultation, setConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadDetail();
    loadMessages();
  }, [id]);

  const loadDetail = async () => {
    try {
      const res = await consultationAPI.detail(id);
      if (res.data.success) {
        setConsultation(res.data.consultation);
      }
    } catch (err) {
      message.error('加载咨询详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await consultationAPI.getMessages(id);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('加载消息失败');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      await consultationAPI.sendMessage(id, newMessage);
      setNewMessage('');
      loadMessages();
    } catch (err) {
      message.error('发送失败');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return <Card loading style={{ maxWidth: 1000, margin: '40px auto' }} />;
  }

  if (!consultation) {
    return <Card style={{ maxWidth: 1000, margin: '40px auto' }}>咨询不存在</Card>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>{consultation.title}</Title>
            <Space>
              <Tag>{consultation.category}</Tag>
              <Tag>Lv.{consultation.level}</Tag>
              <Tag color={consultation.status === 'closed' ? 'default' : 'green'}>
                {consultation.status}
              </Tag>
            </Space>
          </div>

          <Card title="问题描述" type="inner">
            <Paragraph>{consultation.description}</Paragraph>
          </Card>

          {consultation.ai_response && (
            <Card title="AI智能解答" type="inner" style={{ background: '#f0f7ff' }}>
              <Paragraph>{consultation.ai_response}</Paragraph>
            </Card>
          )}

          <Card title="对话记录" type="inner">
            <div style={{ maxHeight: 400, overflow: 'auto', marginBottom: 16 }}>
              <List
                dataSource={messages}
                renderItem={(msg) => (
                  <List.Item style={{ justifyContent: msg.sender_type === role ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%',
                      background: msg.sender_type === role ? '#1890ff' : '#f0f0f0',
                      color: msg.sender_type === role ? '#fff' : '#000',
                      padding: '12px 16px',
                      borderRadius: 12,
                    }}>
                      <div style={{ fontSize: 12, marginBottom: 4, opacity: 0.8 }}>
                        {msg.sender_name} · {msg.created_at}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  </List.Item>
                )}
              />
              <div ref={messagesEndRef} />
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <TextArea
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
              />
              <Button type="primary" onClick={sendMessage} style={{ height: 'auto' }}>
                发送
              </Button>
            </Space.Compact>
          </Card>
        </Space>
      </Card>
    </div>
  );
}

export default ConsultationDetail;
