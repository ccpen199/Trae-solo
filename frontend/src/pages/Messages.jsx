import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Space,
  Tag,
  Divider,
  Spin,
  Empty,
  List,
  Avatar,
  Badge,
  Tabs,
  message,
  Input,
  Form,
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  HomeOutlined,
  SendOutlined,
  BellOutlined,
  CalendarOutlined,
  FileTextOutlined,
  RightOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { userService } from '@/services/userService';
import request from '@/utils/request';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function Messages() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chats');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  const tabItems = [
    { key: 'chats', label: <span><MessageOutlined /> 对话消息</span> },
    { key: 'notifications', label: <span><BellOutlined /> 系统通知</span> },
  ];

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchNotifications();
    } else {
      fetchChats();
    }
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await userService.getNotifications({ limit: 50 });
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('获取通知列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const mockChats = [
        {
          id: 1,
          name: '张房东',
          avatar: null,
          lastMessage: '好的，我们已经为您准备好了房间。',
          lastMessageTime: new Date(Date.now() - 3600000),
          unread: 2,
          houseTitle: '温馨两居室公寓',
        },
        {
          id: 2,
          name: '李房东',
          avatar: null,
          lastMessage: '请问您什么时候到？',
          lastMessageTime: new Date(Date.now() - 86400000),
          unread: 0,
          houseTitle: '海景豪华别墅',
        },
      ];
      setChats(mockChats);
    } catch (error) {
      console.error('获取聊天列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      message.success('已全部标记为已读');
      fetchNotifications();
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleChatClick = (chat) => {
    setSelectedChat(chat);
    const mockMessages = [
      {
        id: 1,
        isMe: false,
        content: '您好，欢迎咨询我的房源！',
        time: new Date(Date.now() - 7200000),
      },
      {
        id: 2,
        isMe: true,
        content: '您好，我想预订您的房子，请问28号还有房吗？',
        time: new Date(Date.now() - 7000000),
      },
      {
        id: 3,
        isMe: false,
        content: '有的，28号还有空房。您想住几晚呢？',
        time: new Date(Date.now() - 6800000),
      },
      {
        id: 4,
        isMe: true,
        content: '我想住3晚，从28号到31号。',
        time: new Date(Date.now() - 6600000),
      },
      {
        id: 5,
        isMe: false,
        content: '好的，我们已经为您准备好了房间。',
        time: new Date(Date.now() - 3600000),
      },
    ];
    setMessages(mockMessages);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    const newMessage = {
      id: messages.length + 1,
      isMe: true,
      content: messageInput,
      time: new Date(),
    };
    setMessages([...messages, newMessage]);
    setMessageInput('');
    
    setTimeout(() => {
      const replyMessage = {
        id: messages.length + 2,
        isMe: false,
        content: '好的，收到您的消息！',
        time: new Date(),
      };
      setMessages((prev) => [...prev, replyMessage]);
    }, 1000);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <FileTextOutlined style={{ color: '#1890ff' }} />;
      case 'system':
        return <BellOutlined style={{ color: '#52c41a' }} />;
      case 'promotion':
        return <Tag color="purple">优惠</Tag>;
      default:
        return <BellOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const renderNotificationItem = (notification) => (
    <List.Item
      key={notification.id}
      style={{
        background: notification.isRead ? '#fff' : '#f0f5ff',
        padding: '16px 24px',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            size={48}
            style={{
              background: notification.isRead ? '#f0f0f0' : '#1890ff',
              color: notification.isRead ? '#999' : '#fff',
            }}
            icon={getNotificationIcon(notification.type)}
          />
        }
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong>{notification.title}</Text>
              {!notification.isRead && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  新消息
                </Tag>
              )}
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(notification.createdAt).format('MM-DD HH:mm')}
              </Text>
            </Col>
          </Row>
        }
        description={
          <div>
            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
              {notification.content}
            </Paragraph>
          </div>
        }
      />
    </List.Item>
  );

  const renderChatItem = (chat) => (
    <List.Item
      key={chat.id}
      onClick={() => handleChatClick(chat)}
      style={{
        cursor: 'pointer',
        background: selectedChat?.id === chat.id ? '#e6f7ff' : '#fff',
        padding: '16px 24px',
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <List.Item.Meta
        avatar={
          <Badge count={chat.unread}>
            <Avatar
              size={48}
              icon={<UserOutlined />}
              src={chat.avatar}
              style={{ backgroundColor: '#ff4d4f' }}
            />
          </Badge>
        }
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong>{chat.name}</Text>
            </Col>
            <Col>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(chat.lastMessageTime).format('HH:mm')}
              </Text>
            </Col>
          </Row>
        }
        description={
          <div>
            <Text type="secondary" ellipsis>
              {chat.lastMessage}
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                来自：{chat.houseTitle}
              </Text>
            </div>
          </div>
        }
      />
    </List.Item>
  );

  const renderMessageItem = (msg) => (
    <div
      key={msg.id}
      style={{
        display: 'flex',
        justifyContent: msg.isMe ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      {!msg.isMe && (
        <Avatar
          size={36}
          icon={<UserOutlined />}
          style={{ marginRight: 12, backgroundColor: '#ff4d4f' }}
        />
      )}
      <div
        style={{
          maxWidth: '60%',
          padding: '12px 16px',
          borderRadius: 12,
          background: msg.isMe ? '#ff4d4f' : '#f0f0f0',
          color: msg.isMe ? '#fff' : '#333',
        }}
      >
        <Paragraph style={{ margin: 0 }}>{msg.content}</Paragraph>
        <Text
          style={{
            fontSize: 11,
            color: msg.isMe ? 'rgba(255,255,255,0.7)' : '#999',
            display: 'block',
            marginTop: 4,
            textAlign: 'right',
          }}
        >
          {dayjs(msg.time).format('HH:mm')}
        </Text>
      </div>
      {msg.isMe && (
        <Avatar
          size={36}
          icon={<UserOutlined />}
          style={{ marginLeft: 12, backgroundColor: '#1890ff' }}
        />
      )}
    </div>
  );

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <MessageOutlined style={{ marginRight: 8 }} />
            消息中心
          </Title>
        </Col>
        {activeTab === 'notifications' && (
          <Col>
            <Button type="link" onClick={handleMarkAllRead}>
              全部已读
            </Button>
          </Col>
        )}
      </Row>

      <Row gutter={[24, 0]}>
        <Col xs={24} lg={8}>
          <Card bordered={false}>
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
              style={{ marginBottom: 16 }}
            />

            <Spin spinning={loading}>
              {activeTab === 'notifications' ? (
                notifications.length === 0 ? (
                  <Empty description="暂无系统通知" />
                ) : (
                  <List dataSource={notifications} renderItem={renderNotificationItem} />
                )
              ) : chats.length === 0 ? (
                <Empty description="暂无对话消息" />
              ) : (
                <List dataSource={chats} renderItem={renderChatItem} />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ minHeight: 600 }}>
            {selectedChat ? (
              <>
                <div
                  style={{
                    paddingBottom: 16,
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: 16,
                  }}
                >
                  <Row align="middle">
                    <Avatar
                      size={40}
                      icon={<UserOutlined />}
                      src={selectedChat.avatar}
                      style={{ marginRight: 12, backgroundColor: '#ff4d4f' }}
                    />
                    <div>
                      <Text strong style={{ fontSize: 16 }}>
                        {selectedChat.name}
                      </Text>
                      <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                        {selectedChat.houseTitle}
                      </Text>
                    </div>
                  </Row>
                </div>

                <div style={{ height: 400, overflowY: 'auto', paddingRight: 16 }}>
                  {messages.map(renderMessageItem)}
                </div>

                <Divider style={{ margin: '16px 0' }} />

                <Row gutter={[16, 0]}>
                  <Col flex="auto">
                    <TextArea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="输入消息..."
                      rows={2}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </Col>
                  <Col flex="none">
                    <Button
                      type="primary"
                      size="large"
                      icon={<SendOutlined />}
                      onClick={handleSendMessage}
                      style={{ height: '100%' }}
                    >
                      发送
                    </Button>
                  </Col>
                </Row>
              </>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 400,
                }}
              >
                <MessageOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <Text type="secondary">选择一个对话开始聊天</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Messages;