import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Typography, Space, Descriptions, Tag, Spin, message, 
  Modal, Rate, Input, List, Avatar, Divider, Empty
} from 'antd';
import { 
  ArrowLeftOutlined, PhoneOutlined, MessageOutlined, CloseOutlined, 
  CheckOutlined, EnvironmentOutlined, ClockCircleOutlined, UserOutlined,
  SendOutlined
} from '@ant-design/icons';
import { getOrderDetail, cancelOrder, completeOrder, reviewOrder } from '../api/order';
import { getMessages, sendMessage } from '../api/message';
import { getUser } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { TextArea } = Input;

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showReview, setShowReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const chatRef = useRef(null);

  useEffect(() => {
    loadDetail();
    loadMessages();
  }, [id]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await getOrderDetail(id);
      setOrder(res.data);
    } catch (error) {
      console.error('加载订单详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await getMessages(id);
      setMessages(res.data || []);
    } catch (error) {
      console.error('加载消息失败:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const res = await sendMessage(id, newMessage.trim());
      setMessages(prev => [...prev, res.data]);
      setNewMessage('');
    } catch (error) {
      console.error('发送消息失败:', error);
    }
  };

  const handleCancel = () => {
    confirm({
      title: '取消订单',
      content: '确认取消此订单吗？',
      okType: 'danger',
      onOk: async () => {
        setActionLoading(true);
        try {
          await cancelOrder(id);
          message.success('订单已取消');
          loadDetail();
        } catch (error) {
          console.error('取消失败:', error);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleComplete = () => {
    confirm({
      title: '完成订单',
      content: '确认完成此订单吗？完成后可以进行评价',
      onOk: async () => {
        setActionLoading(true);
        try {
          await completeOrder(id);
          message.success('订单已完成');
          loadDetail();
        } catch (error) {
          console.error('操作失败:', error);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  const handleReview = async () => {
    if (reviewForm.rating === 0) {
      message.warning('请选择评分');
      return;
    }
    
    setActionLoading(true);
    try {
      await reviewOrder(id, reviewForm);
      message.success('评价成功');
      setShowReview(false);
      loadDetail();
    } catch (error) {
      console.error('评价失败:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallPhone = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Text type="secondary">订单不存在</Text>
        </div>
      </div>
    );
  }

  const statusMap = {
    ongoing: { text: '进行中', color: 'blue' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' }
  };

  const otherPartyName = user.role === 'student' ? order.teacher_name : order.student_name;
  const otherPartyPhone = user.role === 'student' ? order.teacher_phone : order.student_phone;

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          />
          <div>
            <div className="page-title">订单详情</div>
          </div>
        </div>
      </div>

      <Card className="card-item">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>{order.subject}</Title>
          <Tag color={statusMap[order.status]?.color}>
            {statusMap[order.status]?.text}
          </Tag>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="年级">{order.grade}</Descriptions.Item>
          <Descriptions.Item label="上课地点">
            <Space>
              <EnvironmentOutlined />
              {order.location}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="上课时间">
            <Space>
              <ClockCircleOutlined />
              {order.class_time}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="学生人数">{order.student_count}人</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="card-item" title="联系人信息">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div className="flex-between">
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div>
                <div>{otherPartyName || '未填写'}</div>
                <Text type="secondary">{otherPartyPhone || '未填写'}</Text>
              </div>
            </Space>
            <Space>
              <Button
                type="primary"
                icon={<PhoneOutlined />}
                onClick={() => handleCallPhone(otherPartyPhone)}
                disabled={!otherPartyPhone}
              >
                拨打电话
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {order.classRecords && order.classRecords.length > 0 && (
        <Card className="card-item" title="上课记录">
          <List
            dataSource={order.classRecords}
            renderItem={(record) => (
              <List.Item>
                <List.Item.Meta
                  title={dayjs(record.start_time).format('YYYY-MM-DD HH:mm')}
                  description={
                    <Space>
                      {record.duration && <Text>时长: {record.duration}分钟</Text>}
                      {record.notes && <Text type="secondary">备注: {record.notes}</Text>}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      {order.status === 'ongoing' && (
        <Card className="card-item" title="聊天">
          <div className="chat-container" ref={chatRef}>
            {messages.length === 0 ? (
              <Empty description="暂无消息" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender_id === user.id ? 'self' : ''}`}>
                  <div>
                    {msg.sender_id !== user.id && (
                      <div className="chat-sender">{msg.sender_name || '对方'}</div>
                    )}
                    <div className="chat-bubble">{msg.content}</div>
                    <div className="chat-time">{dayjs(msg.created_at).format('HH:mm')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入消息..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onPressEnter={handleSendMessage}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
            >
              发送
            </Button>
          </Space.Compact>
        </Card>
      )}

      {order.review && (
        <Card className="card-item" title="评价">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Rate disabled value={order.review.rating} />
            {order.review.comment && <Text type="secondary">{order.review.comment}</Text>}
          </Space>
        </Card>
      )}

      <div style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          {order.status === 'ongoing' && (
            <>
              <Button
                danger
                size="large"
                block
                icon={<CloseOutlined />}
                loading={actionLoading}
                onClick={handleCancel}
              >
                取消订单
              </Button>
              {user.role === 'teacher' && (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<CheckOutlined />}
                  loading={actionLoading}
                  onClick={handleComplete}
                >
                  完成订单
                </Button>
              )}
            </>
          )}

          {order.status === 'completed' && !order.review && user.role === 'student' && (
            <Button
              type="primary"
              size="large"
              block
              onClick={() => setShowReview(true)}
            >
              去评价
            </Button>
          )}
        </Space>
      </div>

      <Modal
        title="评价老师"
        open={showReview}
        onCancel={() => setShowReview(false)}
        footer={
          <Space>
            <Button onClick={() => setShowReview(false)}>取消</Button>
            <Button
              type="primary"
              loading={actionLoading}
              onClick={handleReview}
            >
              提交评价
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>评分：</Text>
            <Rate
              value={reviewForm.rating}
              onChange={(value) => setReviewForm(prev => ({ ...prev, rating: value }))}
            />
          </div>
          <div>
            <Text>评价内容：</Text>
            <TextArea
              rows={4}
              placeholder="请输入您的评价..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default OrderDetail;
