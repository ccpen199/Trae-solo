import React, { useEffect, useState } from 'react';
import { 
  Card, Descriptions, Tag, List, Input, Button, message, Avatar, 
  Result, Alert, Space, Skeleton, Empty, Steps
} from 'antd';
import { 
  UserOutlined, SendOutlined, ArrowLeftOutlined, 
  HistoryOutlined, CheckCircleOutlined, ClockCircleOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const { TextArea } = Input;
const { Step } = Steps;

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('请先登录后查看工单详情');
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.ticket);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('加载工单失败', error);
      const errMsg = error.response?.data?.error || '加载工单失败，请检查工单ID是否正确';
      setError(errMsg);
      setTicket(null);
      setMessages([]);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      message.warning('请输入消息内容');
      return;
    }

    setSending(true);
    try {
      await api.post(`/tickets/${id}/messages`, { content: newMessage });
      message.success('消息发送成功');
      setNewMessage('');
      loadTicket();
    } catch (error) {
      message.error(error.response?.data?.error || '发送失败');
    }
    setSending(false);
  };

  const getStatusColor = (status) => {
    const colors = { open: 'red', processing: 'blue', closed: 'default' };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = { open: '待处理', processing: '处理中', closed: '已关闭' };
    return texts[status] || status;
  };

  const getTypeInfo = (type) => {
    const types = {
      refund: { name: '退订申请', icon: '↩️', color: 'orange' },
      resend: { name: '补寄申请', icon: '📦', color: 'blue' },
      damage: { name: '破损索赔', icon: '💔', color: 'red' },
      other: { name: '其他问题', icon: '❓', color: 'default' }
    };
    return types[type] || { name: type, icon: '📝', color: 'default' };
  };

  const getStatusSteps = (status) => {
    const allSteps = [
      { title: '已提交', description: '工单已创建' },
      { title: '处理中', description: '客服正在处理' },
      { title: '已解决', description: '问题已处理完毕' }
    ];
    
    const currentStep = status === 'open' ? 0 : status === 'processing' ? 1 : 2;
    return { steps: allSteps, current: currentStep };
  };

  if (loading) {
    return (
      <div>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/tickets')}
          style={{ marginBottom: 16 }}
        >
          返回工单列表
        </Button>
        <Card style={{ marginBottom: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
        <Card title="消息记录">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="warning"
          title="无法查看工单"
          subTitle={error}
          extra={
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')}>
                返回工单列表
              </Button>
              <Button type="primary" onClick={loadTicket}>重新加载</Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ padding: 24 }}>
        <Result
          status="404"
          title="工单不存在"
          subTitle="您访问的工单可能已被删除或ID不正确"
          extra={
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')}>
              返回工单列表
            </Button>
          }
        />
      </div>
    );
  }

  const { steps, current } = getStatusSteps(ticket.status);
  const typeInfo = getTypeInfo(ticket.type);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/tickets')}
          >
            返回列表
          </Button>
          <h1 style={{ margin: 0 }}>
            工单详情 
            <Tag color="blue" style={{ marginLeft: 12 }}>#{ticket.id}</Tag>
            <Tag color={typeInfo.color} style={{ marginLeft: 8 }}>
              {typeInfo.icon} {typeInfo.name}
            </Tag>
          </h1>
        </div>
        <Tag color={getStatusColor(ticket.status)} style={{ fontSize: 14, padding: '4px 16px' }}>
          {getStatusText(ticket.status)}
        </Tag>
      </div>

      {ticket.status === 'closed' && (
        <Alert
          message="该工单已关闭"
          description="如需继续讨论此问题，请提交新工单"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Card style={{ marginBottom: 24 }}>
        <Steps
          size="small"
          current={current}
          items={steps}
          style={{ marginBottom: 24 }}
        />
        
        <Descriptions column={2} size="middle">
          <Descriptions.Item label="工单编号">
            <Tag color="blue">#{ticket.id}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="工单类型">
            <Space>
              <span>{typeInfo.icon}</span>
              <span>{typeInfo.name}</span>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="工单标题" span={2}>
            <strong>{ticket.title}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="优先级">
            <Tag color={ticket.priority === 'high' ? 'red' : ticket.priority === 'normal' ? 'blue' : 'default'}>
              {ticket.priority === 'high' ? '高' : ticket.priority === 'normal' ? '普通' : '低'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="关联编号">
            {ticket.related_id ? <Tag color="default">#{ticket.related_id}</Tag> : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="问题描述" span={2}>
            <div style={{ 
              background: '#f5f5f5', 
              padding: 12, 
              borderRadius: 4, 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {ticket.description}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <Space><ClockCircleOutlined />{ticket.created_at}</Space>
          </Descriptions.Item>
          <Descriptions.Item label="最近更新">
            <Space><HistoryOutlined />{messages[messages.length - 1]?.created_at || ticket.created_at}</Space>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card 
        title={
          <Space>
            <UserOutlined />
            消息记录
            <Tag color="default">{messages.length} 条</Tag>
          </Space>
        } 
        style={{ marginBottom: 24 }}
      >
        {messages.length > 0 ? (
          <List
            style={{ maxHeight: 400, overflowY: 'auto' }}
            dataSource={messages}
            renderItem={(msg) => {
              const isAdmin = msg.type === 'enterprise';
              return (
                <List.Item
                  style={{
                    background: isAdmin ? '#e6f7ff' : '#fafafa',
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 8,
                    marginLeft: isAdmin ? 48 : 0,
                    marginRight: isAdmin ? 0 : 48
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ 
                          background: isAdmin ? '#1890ff' : '#52c41a',
                          color: 'white'
                        }} 
                        icon={<UserOutlined />} 
                      />
                    }
                    title={
                      <Space>
                        <span style={{ fontWeight: 600 }}>
                          {msg.username}
                        </span>
                        {isAdmin && <Tag color="blue">客服</Tag>}
                        <span style={{ color: '#999', fontWeight: 'normal', fontSize: 12 }}>
                          {msg.created_at}
                        </span>
                      </Space>
                    }
                    description={
                      <div style={{ 
                        marginTop: 8, 
                        color: '#333', 
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.6
                      }}>
                        {msg.content}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty 
            image={<HistoryOutlined style={{ fontSize: 48, color: '#ccc' }} />}
            description="暂无消息记录" 
          />
        )}
      </Card>

      {ticket.status !== 'closed' && (
        <Card title="回复消息">
          <TextArea
            rows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="请输入您的回复消息..."
            style={{ marginBottom: 16 }}
            maxLength={500}
            showCount
          />
          <Space>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={sending}
              disabled={!newMessage.trim()}
              size="large"
            >
              发送消息
            </Button>
            <Button 
              onClick={() => setNewMessage('')}
              size="large"
            >
              清空
            </Button>
          </Space>
          <p style={{ color: '#999', fontSize: 12, marginTop: 12, marginBottom: 0 }}>
            提示：客服回复通常在24小时内，请耐心等待
          </p>
        </Card>
      )}

      {ticket.status === 'closed' && (
        <Card>
          <Result
            status="success"
            title="工单已完成"
            subTitle="感谢您的反馈，我们将持续改进服务质量"
            extra={[
              <Button type="primary" key="new" onClick={() => navigate('/tickets')}>
                提交新工单
              </Button>,
              <Button key="back" onClick={() => navigate('/tickets')}>
                返回列表
              </Button>
            ]}
          />
        </Card>
      )}
    </div>
  );
}

export default TicketDetail;
